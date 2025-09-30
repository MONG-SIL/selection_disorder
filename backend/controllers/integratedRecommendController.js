import Food from "../models/Food.js";
import axios from "axios";

// 사용자 선호도 데이터 (실제로는 데이터베이스에서 가져와야 함)
let preferencesDB = {};

// 통합 추천 알고리즘 - 날씨, 기분, 인기도를 종합한 추천
export const getIntegratedRecommendations = async (req, res) => {
  try {
    console.log("통합 추천 API 호출됨");
    
    const { temperature, weatherDescription, mood, foodType = "main" } = req.query;

    console.log("받은 파라미터:", { temperature, weatherDescription, mood, foodType });

    // 필수 파라미터 검증
    if (!temperature || !weatherDescription || !mood) {
      console.log("필수 파라미터 누락:", { temperature, weatherDescription, mood });
      return res.status(400).json({
        success: false,
        message: "온도, 날씨 설명, 기분이 모두 필요합니다.",
        received: { temperature, weatherDescription, mood, foodType }
      });
    }

    // 음식 타입에 따라 필터링
    let foodFilter = { isAvailable: true };
    if (foodType === "dessert") {
      foodFilter.category = "디저트";
    } else {
      foodFilter.category = { $ne: "디저트" };
    }

    // 모든 음식 가져오기
    const allFoods = await Food.find(foodFilter);
    console.log("음식 데이터 개수:", allFoods.length);

    // 사용자 선호도 가져오기
    const userId = req.user?.userId;
    let userPreferences = null;
    
    if (userId) {
      try {
        const preferencesResponse = await axios.get(`http://localhost:4000/api/user/preferences`, {
          headers: { Authorization: req.headers.authorization }
        });
        userPreferences = preferencesResponse.data?.data;
        console.log("사용자 선호도 로드됨:", userPreferences ? "있음" : "없음");
      } catch (error) {
        console.log("사용자 선호도 로드 실패:", error.message);
      }
    }

    // 사용자 평가 기반 추천 로직
    const recommendations = allFoods.map(food => {
      let baseScore = food.rating || 0;
      let userRatingBonus = 0;
      let categoryBonus = 0;
      let tagBonus = 0;
      let highRatingBonus = 0;

      // 통합 추천에서는 사용자 평가를 적절히 반영하되 균형을 맞춤
      if (userPreferences && userPreferences.ratings) {
        const userRating = userPreferences.ratings[food._id]?.rating;
        if (userRating) {
          userRatingBonus = userRating * 1.2; // 사용자 평가 가중치 적절히 조정
          
          // 고평가 음식 (4점 이상) 추가 보너스
          if (userRating >= 4) {
            highRatingBonus = 2;
          }
        }
      }

      // 선호 카테고리 보너스 (적절히 조정)
      if (userPreferences && userPreferences.categories?.includes(food.category)) {
        categoryBonus = 1;
      }

      // 선호 태그 보너스 (적절히 조정)
      if (userPreferences && userPreferences.tags && food.tags) {
        const tagMatches = food.tags.filter(tag =>
          userPreferences.tags.some(userTag =>
            tag.toLowerCase().includes(userTag.toLowerCase()) ||
            userTag.toLowerCase().includes(tag.toLowerCase())
          )
        ).length;
        tagBonus = tagMatches * 0.8;
      }

      // 날씨 기반 점수 (간단한 로직)
      const weatherScore = calculateWeatherScore(food, parseFloat(temperature), weatherDescription);
      
      // 기분 기반 점수 (간단한 로직)
      const moodScore = calculateMoodScore(food, mood.toLowerCase());

      // 최종 점수 계산
      const finalScore = baseScore + userRatingBonus + categoryBonus + tagBonus + highRatingBonus + weatherScore + moodScore;

      return {
        _id: food._id,
        name: food.name,
        category: food.category,
        description: food.description,
        price: food.price,
        rating: food.rating,
        tags: food.tags,
        moodTags: food.moodTags,
        image: food.image,
        scores: {
          weather: Math.round(weatherScore * 100) / 100,
          mood: Math.round(moodScore * 100) / 100,
          popularity: Math.round(baseScore * 100) / 100,
          userRating: userRatingBonus,
          categoryBonus: categoryBonus,
          tagBonus: tagBonus,
          highRatingBonus: highRatingBonus,
          final: Math.round(finalScore * 100) / 100
        },
        userRating: userPreferences?.ratings?.[food._id]?.rating
      };
    });

    // 최종 점수순으로 정렬
    recommendations.sort((a, b) => b.scores.final - a.scores.final);

    res.json({
      success: true,
      data: {
        context: {
          temperature: parseFloat(temperature),
          weatherDescription: weatherDescription,
          mood: mood.toLowerCase(),
          foodType: foodType
        },
        recommendations: recommendations.slice(0, 5),
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

// 간단한 날씨 기반 점수 계산
function calculateWeatherScore(food, temperature, weatherDescription) {
  let score = 0;
  
  // 온도 기반 점수
  if (temperature < 5) {
    // 추운 날씨 - 따뜻한 음식 선호
    if (food.tags?.some(tag => ['따뜻한', '국물', '보양'].includes(tag))) {
      score += 2;
    }
  } else if (temperature > 25) {
    // 더운 날씨 - 차가운 음식 선호
    if (food.tags?.some(tag => ['차가움', '시원한'].includes(tag))) {
      score += 2;
    }
  }
  
  // 날씨 설명 기반 점수
  if (weatherDescription.includes('비') || weatherDescription.includes('rain')) {
    if (food.tags?.some(tag => ['따뜻한', '국물', '매운맛'].includes(tag))) {
      score += 1.5;
    }
  } else if (weatherDescription.includes('맑') || weatherDescription.includes('sunny')) {
    if (food.tags?.some(tag => ['신선한', '건강한'].includes(tag))) {
      score += 1.5;
    }
  }
  
  return score;
}

// 간단한 기분 기반 점수 계산
function calculateMoodScore(food, mood) {
  let score = 0;
  
  const moodRules = {
    happy: ['달콤한', '달콤', '달콤함'],
    excited: ['매운맛', '매운', '얼큰한', '자극적인'],
    relaxed: ['부드러운', '담백한', '가벼운', '건강한'],
    sad: ['달콤한', '달콤', '따뜻한'],
    stressed: ['매운맛', '매운', '얼큰한', '자극적인', '따뜻한'],
    tired: ['따뜻한', '보양', '영양', '에너지', '달콤한'],
    angry: ['매운맛', '매운', '얼큰한', '자극적인', '따뜻한'],
    neutral: ['담백한', '가벼운', '건강한', '신선한'],
    hungry: ['든든한', '포만감', '영양', '고기', '면요리']
  };
  
  const preferredTags = moodRules[mood] || [];
  
  if (food.tags) {
    const tagMatches = food.tags.filter(tag =>
      preferredTags.some(preferredTag =>
        tag.toLowerCase().includes(preferredTag.toLowerCase()) ||
        preferredTag.toLowerCase().includes(tag.toLowerCase())
      )
    ).length;
    score += tagMatches * 1.5;
  }
  
  return score;
}

// 날씨 기반 점수 계산 함수 (기존 함수)
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
    // 기본 인기 음식 키워드 (실제 인기 음식 데이터 기반)
    const popularKeywords = [
      "김치찌개", "파스타", "떡볶이", "라면", "아이스크림", "샐러드", "연어", "케이크",
      "한식", "양식", "디저트", "매운맛", "달콤한", "따뜻한", "차가움", "면요리", "국물",
      "food", "cooking", "recipe", "delicious", "spicy", "sweet", "warm", "cold"
    ];

    // 각 음식에 대해 인기도 점수 계산
    foods.forEach(food => {
      let score = 0;
      
      // 음식 이름이 인기 키워드와 매칭되는지 확인
      const foodNameWords = food.name.toLowerCase().split(/[\s,]+/);
      const nameMatches = foodNameWords.filter(word => 
        popularKeywords.some(keyword => 
          word.includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(word)
        )
      ).length;
      score += nameMatches * 2;

      // 태그가 인기 키워드와 매칭되는지 확인
      if (food.tags) {
        const tagMatches = food.tags.filter(tag => 
          popularKeywords.some(keyword => 
            tag.toLowerCase().includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(tag.toLowerCase())
          )
        ).length;
        score += tagMatches * 1.5;
      }

      // 카테고리별 인기도 가중치
      const categoryWeights = {
        "한식": 1.2,
        "양식": 1.1,
        "일식": 1.0,
        "중식": 1.0,
        "디저트": 1.3
      };
      
      if (categoryWeights[food.category]) {
        score *= categoryWeights[food.category];
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
