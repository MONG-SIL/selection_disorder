import express from 'express';
import axios from 'axios';
import FoodRecipeCache from '../models/FoodImageCache.js';
import Food from '../models/Food.js';

const router = express.Router();

// 한글-영어 매핑 테이블 (더 정확한 검색을 위해 확장)
const KO_TO_EN = {
  '불고기': 'bulgogi korean beef',
  '김치찌개': 'kimchi jjigae stew',
  '비빔밥': 'bibimbap korean rice',
  '탕수육': 'tangsuyuk sweet sour pork',
  '짜장면': 'jajangmyeon black bean noodles',
  '짬뽕': 'jjamppong spicy seafood noodles',
  '초밥': 'sushi japanese',
  '라멘': 'ramen japanese noodles',
  '스테이크': 'beef steak',
  '파스타': 'pasta italian',
  '피자': 'pizza italian',
  '햄버거': 'burger hamburger',
  '샐러드': 'salad fresh',
  '스시': 'sushi japanese',
  '우동': 'udon japanese noodles',
  '돈까스': 'tonkatsu japanese pork cutlet',
  '치킨': 'fried chicken korean',
  '떡볶이': 'tteokbokki spicy rice cakes',
  '순두부찌개': 'sundubu jjigae soft tofu stew',
  '된장찌개': 'doenjang jjigae soybean paste stew',
  '김치': 'kimchi korean',
  '갈비': 'galbi korean ribs',
  '삼겹살': 'samgyeopsal pork belly',
  '닭볶음탕': 'dakbokkeumtang spicy chicken stew',
  '제육볶음': 'jeyuk bokkeum spicy pork',
  '오징어볶음': 'ojingeo bokkeum stir fried squid',
  '잡채': 'japchae korean glass noodles',
  '김밥': 'kimbap korean rice rolls',
  '라면': 'ramen instant noodles',
  '만두': 'mandu dumplings',
  '떡국': 'tteokguk rice cake soup',
  '냉면': 'naengmyeon cold noodles',
  '칼국수': 'kalguksu knife cut noodles',
  '콩나물국': 'kongnamul guk bean sprout soup',
  '미역국': 'miyeok guk seaweed soup',
  '된장국': 'doenjang guk soybean paste soup'
};

// 카테고리-요리 타입 매핑
const CATEGORY_TO_CUISINE = {
  '한식': 'korean',
  '중식': 'chinese',
  '일식': 'japanese',
  '양식': 'western',
  '디저트': 'dessert',
  '분식': 'korean',
  '일본': 'japanese',
  '중국': 'chinese',
  '서양': 'western'
};

// 음식명에 따른 특화된 cuisine 오버라이드
const NAME_TO_CUISINE = {
  '파스타': 'italian',
  '스테이크': 'western',
  '초밥': 'japanese',
  '라멘': 'japanese',
  '짜장면': 'chinese',
  '짬뽕': 'chinese',
  '불고기': 'korean',
  '김치찌개': 'korean',
  '비빔밥': 'korean'
};

const buildSearchQueries = (name, category) => {
  const base = String(name || '').trim();
  const cat = String(category || '').trim();
  const cuisine = NAME_TO_CUISINE[base] || CATEGORY_TO_CUISINE[cat] || '';
  const engName = KO_TO_EN[base] || base;
  
  // 여러 검색 쿼리 생성 (우선순위 순)
  const queries = [];
  
  // 1. 정확한 한글-영어 매핑이 있는 경우
  if (KO_TO_EN[base]) {
    queries.push({
      query: engName,
      cuisine: cuisine,
      number: 10,
      addRecipeInformation: true,
      includeNutrition: true
    });
  }
  
  // 2. 카테고리 + 음식명 조합
  if (cuisine && base) {
    queries.push({
      query: `${engName} ${cuisine}`,
      cuisine: cuisine,
      number: 10,
      addRecipeInformation: true,
      includeNutrition: true
    });
  }
  
  // 3. 음식명만
  queries.push({
    query: engName,
    number: 10,
    addRecipeInformation: true,
    includeNutrition: true
  });
  
  // 4. 카테고리만
  if (cuisine) {
    queries.push({
      query: cuisine,
      cuisine: cuisine,
      number: 10,
      addRecipeInformation: true,
      includeNutrition: true
    });
  }
  
  return queries;
};

const scoreRecipe = (recipe, searchTerms) => {
  let score = 0;
  const title = (recipe.title || '').toLowerCase();
  const summary = (recipe.summary || '').toLowerCase();
  
  searchTerms.forEach(term => {
    const lowerTerm = term.toLowerCase();
    if (title.includes(lowerTerm)) score += 3;
    if (summary.includes(lowerTerm)) score += 1;
  });
  
  return score;
};

// 사용된 이미지 ID를 추적하는 Set
const usedImageIds = new Set();

// 만료된 캐시 정리 함수
const cleanupExpiredCache = async () => {
  try {
    const result = await FoodRecipeCache.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    if (result.deletedCount > 0) {
      console.log(`만료된 캐시 ${result.deletedCount}개 삭제됨`);
    }
  } catch (error) {
    console.error('캐시 정리 중 오류:', error);
  }
};

// 1시간마다 만료된 캐시 정리
setInterval(cleanupExpiredCache, 60 * 60 * 1000);

const getUniqueRecipe = async (queries, searchTerms, usedIds = new Set()) => {
  // API 키가 없거나 402 에러가 발생한 경우 즉시 fallback 반환
  if (!process.env.SPOONACULAR_API_KEY) {
    console.log('Spoonacular API 키가 설정되지 않음');
    return null;
  }

  for (const queryParams of queries) {
    try {
      console.log('Spoonacular API 호출:', queryParams);
      const response = await axios.get('https://api.spoonacular.com/recipes/complexSearch', {
        params: queryParams,
        headers: { 
          'X-API-Key': process.env.SPOONACULAR_API_KEY 
        }
      });

      const recipes = response.data?.results || [];
      console.log('API 응답 레시피 수:', recipes.length);
      
      if (recipes.length > 0) {
        // 스코어링으로 최적 레시피 선택
        const scoredRecipes = recipes
          .map(recipe => ({ recipe, score: scoreRecipe(recipe, searchTerms) }))
          .sort((a, b) => b.score - a.score);

        console.log('스코어링된 레시피들:', scoredRecipes.map(s => ({ title: s.recipe.title, score: s.score })));

        // 사용되지 않은 이미지 ID를 가진 레시피 찾기
        for (const { recipe } of scoredRecipes) {
          if (!usedIds.has(recipe.id)) {
            usedIds.add(recipe.id);
            console.log('선택된 레시피:', recipe.title, recipe.id);
            return recipe;
          }
        }
        
        // 모든 레시피가 사용된 경우, 가장 높은 점수의 레시피 반환
        if (scoredRecipes.length > 0) {
          console.log('중복이지만 최고 점수 레시피 선택:', scoredRecipes[0].recipe.title);
          return scoredRecipes[0].recipe;
        }
      }
    } catch (apiError) {
      console.error('Spoonacular API error:', apiError.message);
      // 402 에러 (요청 제한 초과)인 경우 즉시 중단
      if (apiError.response?.status === 402) {
        console.log('Spoonacular API 일일 요청 제한 초과 - fallback 사용');
        return null;
      }
      continue;
    }
  }
  console.log('모든 쿼리에서 레시피를 찾지 못함');
  return null;
};

// GET /api/food-recipes/:foodId
router.get('/:foodId', async (req, res) => {
  try {
    const { foodId } = req.params;
    console.log('레시피 요청:', foodId);
    const food = await Food.findById(foodId).lean();
    if (!food) {
      console.log('음식을 찾을 수 없음:', foodId);
      return res.status(404).json({ success: false, message: 'Food not found' });
    }
    console.log('음식 정보:', food.name, food.category);

    // 캐시 조회 (Spoonacular API로 저장된 것만, 만료되지 않은 것만)
    const cached = await FoodRecipeCache.findOne({ 
      foodId, 
      provider: 'spoonacular',
      expiresAt: { $gt: new Date() } // 만료되지 않은 캐시만
    }).lean();
    
    console.log('캐시 조회 결과:', cached ? '발견됨' : '없음');
    if (cached) {
      console.log('캐시 만료 시간:', cached.expiresAt);
      console.log('현재 시간:', new Date());
    }
    
    if (cached?.imageUrl) {
      console.log('유효한 캐시된 Spoonacular 데이터 사용:', cached.imageUrl);
      return res.json({ 
        success: true, 
        imageUrl: cached.overrideUrl || cached.imageUrl,
        recipe: cached.recipe,
        cached: true 
      });
    }

    // 기존 Unsplash 캐시가 있는지 확인하고 삭제
    const oldCache = await FoodRecipeCache.findOne({ 
      foodId,
      provider: { $ne: 'spoonacular' }
    }).lean();
    if (oldCache) {
      console.log('기존 Unsplash 캐시 삭제:', oldCache._id);
      await FoodRecipeCache.deleteOne({ _id: oldCache._id });
    }

    const searchQueries = buildSearchQueries(food.name, food.category);
    const searchTerms = [food.name, ...(KO_TO_EN[food.name] ? [KO_TO_EN[food.name]] : [])];

    console.log('검색 쿼리들:', searchQueries);
    const bestRecipe = await getUniqueRecipe(searchQueries, searchTerms, usedImageIds);
    const imageUrl = bestRecipe?.image;
    console.log('찾은 레시피:', bestRecipe?.title, imageUrl);

    if (!bestRecipe || !imageUrl) {
      console.log('레시피를 찾을 수 없음 - 기본 이미지 제공');
      // 기본 이미지와 간단한 레시피 정보 제공
      const fallbackRecipe = {
        id: 'fallback',
        title: food.name,
        instructions: [`${food.name}을 맛있게 조리해보세요.`],
        ingredients: [`${food.name} 재료`],
        nutrition: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0
        },
        readyInMinutes: 30,
        servings: 1,
        difficulty: 'medium',
        summary: `${food.name}에 대한 레시피 정보를 찾을 수 없습니다.`
      };

      // 기본 이미지 URL (Unsplash의 기본 이미지 사용)
      const fallbackImageUrl = `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop&crop=center`;

      // 캐시에 저장
      await FoodRecipeCache.create({
        foodId,
        name: food.name,
        category: food.category,
        imageUrl: fallbackImageUrl,
        imageUrls: [fallbackImageUrl],
        imageIds: ['fallback'],
        recipe: fallbackRecipe,
        provider: 'fallback',
        query: food.name,
        cuisine: food.category,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24시간 후 만료
      });

      return res.json({ 
        success: true, 
        imageUrl: fallbackImageUrl,
        recipe: fallbackRecipe,
        cached: false 
      });
    }

    // 레시피 상세 정보 가져오기
    let detailedRecipe = null;
    try {
      const detailResponse = await axios.get(
        `https://api.spoonacular.com/recipes/${bestRecipe.id}/information`,
        {
          params: { includeNutrition: true },
          headers: { 
            'X-API-Key': process.env.SPOONACULAR_API_KEY 
          }
        }
      );
      detailedRecipe = detailResponse.data;
    } catch (detailError) {
      console.error('Spoonacular detail API error:', detailError.message);
    }

    // 레시피 데이터 정리
    const recipeData = {
      id: bestRecipe.id,
      title: bestRecipe.title,
      instructions: detailedRecipe?.instructions ? 
        detailedRecipe.instructions.map(inst => inst.step) : [],
      ingredients: detailedRecipe?.extendedIngredients ? 
        detailedRecipe.extendedIngredients.map(ing => `${ing.amount} ${ing.unit} ${ing.name}`) : [],
      nutrition: {
        calories: detailedRecipe?.nutrition?.nutrients?.find(n => n.name === 'Calories')?.amount || 0,
        protein: detailedRecipe?.nutrition?.nutrients?.find(n => n.name === 'Protein')?.amount || 0,
        carbs: detailedRecipe?.nutrition?.nutrients?.find(n => n.name === 'Carbohydrates')?.amount || 0,
        fat: detailedRecipe?.nutrition?.nutrients?.find(n => n.name === 'Fat')?.amount || 0
      },
      readyInMinutes: bestRecipe.readyInMinutes || 0,
      servings: bestRecipe.servings || 1,
      difficulty: bestRecipe.difficulty || 'medium',
      summary: detailedRecipe?.summary || ''
    };

    // 캐시 저장
    await FoodRecipeCache.create({
      foodId,
      name: food.name,
      category: food.category,
      imageUrl,
      imageUrls: [imageUrl],
      imageIds: [bestRecipe.id],
      recipe: recipeData,
      provider: 'spoonacular',
      query: searchParams.query,
      cuisine: searchParams.cuisine,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24시간 후 만료
    });

    res.json({ 
      success: true, 
      imageUrl, 
      recipe: recipeData,
      cached: false 
    });
  } catch (error) {
    console.error('[food-recipes] error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// GET /api/food-recipes (배치)
router.get('/', async (req, res) => {
  try {
    const ids = String(req.query.ids || '').split(',').map(s => s.trim()).filter(Boolean);
    if (!ids.length) {
      return res.status(400).json({ 
        success: false, 
        message: 'ids required' 
      });
    }

    const foods = await Food.find({ _id: { $in: ids } }).lean();
    const idToFood = foods.reduce((acc, f) => { 
      acc[String(f._id)] = f; 
      return acc; 
    }, {});
    const result = {};

    // 캐시 일괄 조회 (Spoonacular API로 저장된 것만, 만료되지 않은 것만)
    const caches = await FoodRecipeCache.find({ 
      foodId: { $in: ids },
      provider: 'spoonacular',
      expiresAt: { $gt: new Date() } // 만료되지 않은 캐시만
    }).lean();
    const cachedMap = caches.reduce((acc, c) => {
      acc[String(c.foodId)] = {
        imageUrl: c.overrideUrl || c.imageUrl,
        recipe: c.recipe
      };
      return acc;
    }, {});

    // 캐시된 것들 즉시 매핑
    ids.forEach(id => {
      if (cachedMap[id]) {
        result[id] = cachedMap[id];
      }
    });

    // 캐시 없는 것들 처리
    const batchUsedIds = new Set();
    for (const id of ids) {
      if (result[id]) continue;
      const food = idToFood[id];
      if (!food) continue;

      const searchQueries = buildSearchQueries(food.name, food.category);
      const searchTerms = [food.name, ...(KO_TO_EN[food.name] ? [KO_TO_EN[food.name]] : [])];

      const bestRecipe = await getUniqueRecipe(searchQueries, searchTerms, batchUsedIds);
      const imageUrl = bestRecipe?.image;

      if (bestRecipe && imageUrl) {
        // 레시피 상세 정보 가져오기
        let detailedRecipe = null;
        try {
          const detailResponse = await axios.get(
            `https://api.spoonacular.com/recipes/${bestRecipe.id}/information`,
            {
              params: { includeNutrition: true },
              headers: { 
                'X-API-Key': process.env.SPOONACULAR_API_KEY 
              }
            }
          );
          detailedRecipe = detailResponse.data;
        } catch (detailError) {
          console.error('Spoonacular detail API error:', detailError.message);
        }

        const recipeData = {
          id: bestRecipe.id,
          title: bestRecipe.title,
          instructions: detailedRecipe?.instructions ? 
            detailedRecipe.instructions.map(inst => inst.step) : [],
          ingredients: detailedRecipe?.extendedIngredients ? 
            detailedRecipe.extendedIngredients.map(ing => `${ing.amount} ${ing.unit} ${ing.name}`) : [],
          nutrition: {
            calories: detailedRecipe?.nutrition?.nutrients?.find(n => n.name === 'Calories')?.amount || 0,
            protein: detailedRecipe?.nutrition?.nutrients?.find(n => n.name === 'Protein')?.amount || 0,
            carbs: detailedRecipe?.nutrition?.nutrients?.find(n => n.name === 'Carbohydrates')?.amount || 0,
            fat: detailedRecipe?.nutrition?.nutrients?.find(n => n.name === 'Fat')?.amount || 0
          },
          readyInMinutes: bestRecipe.readyInMinutes || 0,
          servings: bestRecipe.servings || 1,
          difficulty: bestRecipe.difficulty || 'medium',
          summary: detailedRecipe?.summary || ''
        };

        // 캐시 저장
        await FoodRecipeCache.create({
          foodId: id,
          name: food.name,
          category: food.category,
          imageUrl,
          imageUrls: [imageUrl],
          imageIds: [bestRecipe.id],
          recipe: recipeData,
          provider: 'spoonacular',
          query: searchQueries[0]?.query || '',
          cuisine: searchQueries[0]?.cuisine || '',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24시간 후 만료
        });

        result[id] = {
          imageUrl,
          recipe: recipeData
        };
      } else {
        // 레시피를 찾지 못한 경우 기본 정보 제공
        console.log(`음식 ${id}에 대한 레시피를 찾지 못함 - 기본 정보 제공`);
        const fallbackRecipe = {
          id: 'fallback',
          title: food.name,
          instructions: [`${food.name}을 맛있게 조리해보세요.`],
          ingredients: [`${food.name} 재료`],
          nutrition: {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0
          },
          readyInMinutes: 30,
          servings: 1,
          difficulty: 'medium',
          summary: `${food.name}에 대한 레시피 정보를 찾을 수 없습니다.`
        };

        const fallbackImageUrl = `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop&crop=center`;

        // 캐시에 저장
        await FoodRecipeCache.create({
          foodId: id,
          name: food.name,
          category: food.category,
          imageUrl: fallbackImageUrl,
          imageUrls: [fallbackImageUrl],
          imageIds: ['fallback'],
          recipe: fallbackRecipe,
          provider: 'fallback',
          query: food.name,
          cuisine: food.category,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24시간 후 만료
        });

        result[id] = {
          imageUrl: fallbackImageUrl,
          recipe: fallbackRecipe
        };
      }
    }

    res.json({ success: true, recipes: result });
  } catch (error) {
    console.error('[food-recipes][batch] error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// DELETE /api/food-recipes/cache?key=YOUR_ADMIN_KEY
router.delete('/cache', async (req, res) => {
  try {
    const provided = String(req.query.key || '');
    const required = String(process.env.ADMIN_KEY || '');
    if (required && provided !== required) {
      return res.status(403).json({ 
        success: false, 
        message: 'forbidden' 
      });
    }
    await FoodRecipeCache.deleteMany({});
    return res.json({ 
      success: true, 
      message: 'FoodRecipeCache cleared' 
    });
  } catch (error) {
    console.error('[food-recipes][clear] error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

export default router;
