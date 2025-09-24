import Food from "../models/Food.js";
import axios from "axios";

// 통합 추천 알고리즘 - 날씨, 기분, 인기도를 종합한 추천
export const getIntegratedRecommendations = async (req, res) => {
  try {
    const { 
      temperature, 
      weatherDescription, 
      mood, 
      foodType = "main",
      weights = { weather: 0.4, mood: 0.4, popularity: 0.2 } // 가중치 설정
    } = req.query;
    const userId = req.user?.userId;

    // 필수 파라미터 검증
    if (!temperature || !weatherDescription || !mood) {
      return res.status(400).json({
        success: false,
        message: "온도, 날씨 설명, 기분이 모두 필요합니다."
      });
    }

    const temp = parseFloat(temperature);
    const weatherDesc = weatherDescription.toLowerCase();
    const moodKey = mood.toLowerCase();

    // 음식 타입에 따라 필터링
    let foodFilter = { isAvailable: true };
    
    if (foodType === "dessert") {
      foodFilter.category = "디저트";
    } else {
      foodFilter.category = { $ne: "디저트" };
    }

    // 모든 음식 가져오기
    const allFoods = await Food.find(foodFilter);

    // 1. 날씨 기반 점수 계산
    const weatherScores = calculateWeatherScores(allFoods, temp, weatherDesc);
    
    // 2. 기분 기반 점수 계산
    const moodScores = calculateMoodScores(allFoods, moodKey);
    
    // 3. 인기도 기반 점수 계산
    const popularityScores = await calculatePopularityScores(allFoods);

    // 4. 통합 점수 계산
    const integratedScores = allFoods.map(food => {
      const weatherScore = weatherScores[food._id] || 0;
      const moodScore = moodScores[food._id] || 0;
      const popularityScore = popularityScores[food._id] || 0;
      
      // 가중치 적용
      const finalScore = 
        (weatherScore * weights.weather) + 
        (moodScore * weights.mood) + 
        (popularityScore * weights.popularity);

      return {
        food,
        weatherScore,
        moodScore,
        popularityScore,
        finalScore
      };
    });

    // 5. 사용자 선호도 기반 가중치 적용
    let userPreferences = null;
    try {
      const preferencesResponse = await axios.get(`http://localhost:4000/api/user/preferences`, {
        params: { userId }
      });
      userPreferences = preferencesResponse.data;
    } catch (error) {
      console.log("사용자 선호도를 가져올 수 없습니다:", error.message);
    }

    // 사용자 취향 가중치 적용
    const weightedCandidates = integratedScores.map(candidate => {
      let adjustedScore = candidate.finalScore;
      
      if (userPreferences) {
        // 사용자가 이미 평가한 음식이면 가중치 적용
        const userRating = userPreferences.ratings?.[candidate.food._id]?.rating;
        if (userRating) {
          adjustedScore *= (userRating / 3); // 3점 기준으로 정규화
        }

        // 선호하는 카테고리에 가중치 적용
        if (userPreferences.categories?.includes(candidate.food.category)) {
          adjustedScore *= 1.3;
        }

        // 선호하는 태그에 가중치 적용
        if (userPreferences.tags && candidate.food.tags) {
          const tagMatches = candidate.food.tags.filter(tag =>
            userPreferences.tags.some(userTag =>
              tag.toLowerCase().includes(userTag.toLowerCase()) ||
              userTag.toLowerCase().includes(tag.toLowerCase())
            )
          ).length;
          if (tagMatches > 0) {
            adjustedScore *= (1 + tagMatches * 0.2);
          }
        }
      }

      return {
        ...candidate,
        adjustedScore,
        userRating: userPreferences?.ratings?.[candidate.food._id]?.rating
      };
    });

    // 최종 점수순으로 정렬하고 상위 5개 선택
    const finalRecommendations = weightedCandidates
      .sort((a, b) => b.adjustedScore - a.adjustedScore)
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        context: {
          temperature: temp,
          weatherDescription: weatherDescription,
          mood: moodKey,
          foodType: foodType,
          weights: weights
        },
        recommendations: finalRecommendations.map(rec => ({
          _id: rec.food._id,
          name: rec.food.name,
          category: rec.food.category,
          description: rec.food.description,
          price: rec.food.price,
          rating: rec.food.rating,
          tags: rec.food.tags,
          moodTags: rec.food.moodTags,
          image: rec.food.image,
          scores: {
            weather: Math.round(rec.weatherScore * 100) / 100,
            mood: Math.round(rec.moodScore * 100) / 100,
            popularity: Math.round(rec.popularityScore * 100) / 100,
            final: Math.round(rec.finalScore * 100) / 100,
            adjusted: Math.round(rec.adjustedScore * 100) / 100
          },
          userRating: rec.userRating
        })),
        totalCandidates: allFoods.length
      }
    });

  } catch (error) {
    console.error("통합 추천 오류:", error);
    res.status(500).json({
      success: false,
      message: "통합 추천 중 오류가 발생했습니다.",
      error: error.message
    });
  }
};

// 날씨 기반 점수 계산 함수
function calculateWeatherScores(foods, temperature, weatherDescription) {
  const scores = {};
  
  // 날씨 조건별 매핑 규칙
  const weatherRules = {
    cold: { temp: { min: -50, max: 5 }, tags: ["따뜻한", "국물", "보양"], categories: ["한식", "중식"] },
    chilly: { temp: { min: 5, max: 12 }, tags: ["따뜻한", "면요리", "국물"], categories: ["한식", "중식", "일식"] },
    hot: { temp: { min: 30, max: 50 }, tags: ["차가움", "달콤한", "시원한"], categories: ["디저트"] },
    warm: { temp: { min: 25, max: 30 }, tags: ["차가움", "달콤한", "시원한", "가벼움"], categories: ["디저트", "양식"] },
    rainy: { conditions: ["rain", "drizzle", "thunderstorm"], tags: ["따뜻한", "면요리", "국물", "매운맛"], categories: ["한식", "중식", "일식"] },
    sunny: { conditions: ["clear", "sunny"], tags: ["신선한", "건강한", "가벼움", "채소"], categories: ["양식", "한식"] },
    cloudy: { conditions: ["clouds", "overcast"], tags: ["따뜻한", "면요리", "고기"], categories: ["한식", "중식"] }
  };

  // 매칭되는 규칙 찾기
  let matchingRules = [];
  
  Object.entries(weatherRules).forEach(([key, rule]) => {
    if (rule.temp && temp >= rule.temp.min && temp <= rule.temp.max) {
      matchingRules.push({ ...rule, weight: 1.0, type: key });
    }
    if (rule.conditions) {
      const hasMatchingCondition = rule.conditions.some(condition => 
        weatherDescription.includes(condition)
      );
      if (hasMatchingCondition) {
        matchingRules.push({ ...rule, weight: 1.0, type: key });
      }
    }
  });

  if (matchingRules.length === 0) {
    matchingRules = [{
      tags: ["인기메뉴", "따뜻한"],
      categories: ["한식"],
      weight: 1.0,
      type: "default"
    }];
  }

  // 각 음식에 대해 점수 계산
  foods.forEach(food => {
    let score = 0;
    
    matchingRules.forEach(rule => {
      let ruleScore = 0;
      
      // 태그 매칭
      if (rule.tags && food.tags) {
        const tagMatches = food.tags.filter(tag => 
          rule.tags.some(ruleTag => 
            tag.toLowerCase().includes(ruleTag.toLowerCase()) ||
            ruleTag.toLowerCase().includes(tag.toLowerCase())
          )
        ).length;
        ruleScore += tagMatches * 2;
      }

      // 카테고리 매칭
      if (rule.categories && food.category) {
        const categoryMatch = rule.categories.includes(food.category);
        if (categoryMatch) {
          ruleScore += 3;
        }
      }

      // 기본 평점 반영
      ruleScore += food.rating || 0;

      score += ruleScore * rule.weight;
    });

    scores[food._id] = score;
  });

  return scores;
}

// 기분 기반 점수 계산 함수
function calculateMoodScores(foods, mood) {
  const scores = {};
  
  // 기분별 매핑 규칙
  const moodRules = {
    happy: { tags: ["달콤한", "달콤", "달콤함"], moodTags: ["행복", "기쁨", "즐거움"], categories: ["디저트", "양식", "한식"] },
    excited: { tags: ["매운맛", "매운", "얼큰한", "자극적인"], moodTags: ["신남", "흥분", "활기"], categories: ["한식", "중식", "일식"] },
    relaxed: { tags: ["부드러운", "담백한", "가벼운", "건강한"], moodTags: ["편안", "평온", "여유"], categories: ["양식", "한식", "일식"] },
    sad: { tags: ["달콤한", "달콤", "따뜻한"], moodTags: ["슬픔", "우울", "힘듦"], categories: ["디저트", "한식", "중식"] },
    stressed: { tags: ["매운맛", "매운", "얼큰한", "자극적인", "따뜻한"], moodTags: ["스트레스", "압박", "긴장"], categories: ["한식", "중식", "일식"] },
    tired: { tags: ["따뜻한", "보양", "영양", "에너지", "달콤한"], moodTags: ["피곤", "지침", "무기력"], categories: ["한식", "중식"] },
    angry: { tags: ["매운맛", "매운", "얼큰한", "자극적인", "따뜻한"], moodTags: ["화남", "짜증", "분노"], categories: ["한식", "중식"] },
    neutral: { tags: ["담백한", "가벼운", "건강한", "신선한"], moodTags: ["평범", "보통", "일상"], categories: ["한식", "양식", "일식"] },
    hungry: { tags: ["든든한", "포만감", "영양", "고기", "면요리"], moodTags: ["배고픔", "공복", "욕구"], categories: ["한식", "중식", "일식"] }
  };

  const moodRule = moodRules[mood] || moodRules.neutral;

  // 각 음식에 대해 점수 계산
  foods.forEach(food => {
    let score = 0;
    
    // 태그 매칭
    if (moodRule.tags && food.tags) {
      const tagMatches = food.tags.filter(tag => 
        moodRule.tags.some(ruleTag => 
          tag.toLowerCase().includes(ruleTag.toLowerCase()) ||
          ruleTag.toLowerCase().includes(tag.toLowerCase())
        )
      ).length;
      score += tagMatches * 3;
    }

    // 기분 태그 매칭
    if (moodRule.moodTags && food.moodTags) {
      const moodTagMatches = food.moodTags.filter(tag => 
        moodRule.moodTags.some(ruleTag => 
          tag.toLowerCase().includes(ruleTag.toLowerCase()) ||
          ruleTag.toLowerCase().includes(tag.toLowerCase())
        )
      ).length;
      score += moodTagMatches * 4;
    }

    // 카테고리 매칭
    if (moodRule.categories && food.category) {
      const categoryMatch = moodRule.categories.includes(food.category);
      if (categoryMatch) {
        score += 2;
      }
    }

    // 기본 평점 반영
    score += food.rating || 0;

    scores[food._id] = score;
  });

  return scores;
}

// 인기도 기반 점수 계산 함수
async function calculatePopularityScores(foods) {
  const scores = {};
  
  try {
    // 인기 음식 API 호출
    const response = await axios.get("http://localhost:4000/api/popular-foods");
    const popularFoods = response.data || [];
    
    // 인기 음식 제목에서 키워드 추출
    const popularKeywords = popularFoods.flatMap(food => 
      food.title ? food.title.toLowerCase().split(/[\s,]+/) : []
    ).filter(keyword => keyword.length > 1);

    // 각 음식에 대해 인기도 점수 계산
    foods.forEach(food => {
      let score = 0;
      
      // 음식 이름이 인기 키워드와 매칭되는지 확인
      const foodNameWords = food.name.toLowerCase().split(/[\s,]+/);
      const nameMatches = foodNameWords.filter(word => 
        popularKeywords.some(keyword => 
          word.includes(keyword) || keyword.includes(word)
        )
      ).length;
      score += nameMatches * 2;

      // 태그가 인기 키워드와 매칭되는지 확인
      if (food.tags) {
        const tagMatches = food.tags.filter(tag => 
          popularKeywords.some(keyword => 
            tag.toLowerCase().includes(keyword) || keyword.includes(tag.toLowerCase())
          )
        ).length;
        score += tagMatches * 1.5;
      }

      // 기본 평점 반영
      score += food.rating || 0;

      scores[food._id] = score;
    });

  } catch (error) {
    console.log("인기도 점수 계산 중 오류:", error.message);
    // 오류 시 기본 점수 (평점만 반영)
    foods.forEach(food => {
      scores[food._id] = food.rating || 0;
    });
  }

  return scores;
}
