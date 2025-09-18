import Food from "../models/Food.js";
import axios from "axios";

// 날씨 조건별 음식 추천 규칙 정의
const weatherFoodMapping = {
  // 추위 관련
  cold: {
    temperature: { min: -50, max: 5 },
    tags: ["따뜻한", "국물", "보양", "전통음식"],
    categories: ["한식", "중식"],
    description: "추운 날씨에 몸을 따뜻하게 해주는 음식"
  },
  chilly: {
    temperature: { min: 5, max: 12 },
    tags: ["따뜻한", "면요리", "국물"],
    categories: ["한식", "중식", "일식"],
    description: "쌀쌀한 날씨에 어울리는 따뜻한 음식"
  },
  
  // 더위 관련
  hot: {
    temperature: { min: 30, max: 50 },
    tags: ["차가움", "달콤한", "시원한"],
    categories: ["디저트"],
    description: "더운 날씨에 시원하게 해주는 음식"
  },
  warm: {
    temperature: { min: 25, max: 30 },
    tags: ["차가움", "달콤한", "시원한", "가벼움"],
    categories: ["디저트", "양식"],
    description: "따뜻한 날씨에 가벼운 음식"
  },
  
  // 비 관련
  rainy: {
    weatherConditions: ["rain", "drizzle", "thunderstorm"],
    tags: ["따뜻한", "면요리", "국물", "매운맛"],
    categories: ["한식", "중식", "일식"],
    description: "비 오는 날씨에 따뜻하고 얼큰한 음식"
  },
  
  // 맑은 날
  sunny: {
    weatherConditions: ["clear", "sunny"],
    tags: ["신선한", "건강한", "가벼움", "채소"],
    categories: ["양식", "한식"],
    description: "맑은 날씨에 신선하고 건강한 음식"
  },
  
  // 흐린 날
  cloudy: {
    weatherConditions: ["clouds", "overcast"],
    tags: ["따뜻한", "면요리", "고기"],
    categories: ["한식", "중식"],
    description: "흐린 날씨에 든든한 음식"
  }
};

// 날씨 조건에 맞는 음식 추천 함수
export const getWeatherBasedRecommendations = async (req, res) => {
  try {
    const { temperature, description, foodType = "main" } = req.query;
    const userId = req.user?.userId; // 토큰에서 추출
    
    if (!temperature || !description) {
      return res.status(400).json({
        success: false,
        message: "온도와 날씨 설명이 필요합니다."
      });
    }

    const temp = parseFloat(temperature);
    const weatherDesc = description.toLowerCase();

    // 날씨 조건에 맞는 매핑 규칙 찾기
    let matchingRules = [];
    
    // 온도 기반 규칙 찾기
    Object.entries(weatherFoodMapping).forEach(([key, rule]) => {
      if (rule.temperature) {
        if (temp >= rule.temperature.min && temp <= rule.temperature.max) {
          matchingRules.push({ ...rule, weight: 1.0, type: key });
        }
      }
      
      // 날씨 조건 기반 규칙 찾기
      if (rule.weatherConditions) {
        const hasMatchingCondition = rule.weatherConditions.some(condition => 
          weatherDesc.includes(condition)
        );
        if (hasMatchingCondition) {
          matchingRules.push({ ...rule, weight: 1.0, type: key });
        }
      }
    });

    // 매칭되는 규칙이 없으면 기본 규칙 사용
    if (matchingRules.length === 0) {
      matchingRules = [{
        tags: ["인기메뉴", "따뜻한"],
        categories: ["한식"],
        weight: 1.0,
        type: "default",
        description: "일반적인 추천 음식"
      }];
    }

    // 음식 타입에 따라 필터링
    let foodFilter = { isAvailable: true };
    
    if (foodType === "dessert") {
      // 디저트만 필터링
      foodFilter.category = "디저트";
    } else {
      // 메인 음식 (디저트 제외)
      foodFilter.category = { $ne: "디저트" };
    }

    // 모든 음식 가져오기
    const allFoods = await Food.find(foodFilter);

    // 규칙 기반으로 음식 점수 계산
    const foodScores = allFoods.map(food => {
      let score = 0;
      let matchedRules = [];

      matchingRules.forEach(rule => {
        let ruleScore = 0;
        
        // 태그 매칭 점수 계산
        if (rule.tags && food.tags) {
          const tagMatches = food.tags.filter(tag => 
            rule.tags.some(ruleTag => 
              tag.toLowerCase().includes(ruleTag.toLowerCase()) ||
              ruleTag.toLowerCase().includes(tag.toLowerCase())
            )
          ).length;
          ruleScore += tagMatches * 2; // 태그 매칭은 높은 점수
        }

        // 카테고리 매칭 점수 계산
        if (rule.categories && food.category) {
          const categoryMatch = rule.categories.includes(food.category);
          if (categoryMatch) {
            ruleScore += 3; // 카테고리 매칭은 높은 점수
          }
        }

        // 기본 평점 반영
        ruleScore += food.rating || 0;

        if (ruleScore > 0) {
          score += ruleScore * rule.weight;
          matchedRules.push({
            type: rule.type,
            description: rule.description,
            score: ruleScore
          });
        }
      });

      return {
        food,
        score,
        matchedRules
      };
    });

    // 점수순으로 정렬하고 상위 10개 선택
    const topCandidates = foodScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    // 사용자 취향 기반 가중치 적용 (사용자 선호도 API 호출)
    let userPreferences = null;
    try {
      // 실제로는 사용자 선호도 API를 호출해야 하지만, 
      // 현재는 기본 사용자 ID로 가정
      const preferencesResponse = await axios.get(`http://localhost:4000/api/user/preferences`, {
        params: { userId }
      });
      userPreferences = preferencesResponse.data;
    } catch (error) {
      console.log("사용자 선호도를 가져올 수 없습니다:", error.message);
    }

    // 사용자 취향 가중치 적용
    const weightedCandidates = topCandidates.map(candidate => {
      let finalScore = candidate.score;
      
      if (userPreferences) {
        // 사용자가 이미 평가한 음식이면 가중치 적용
        const userRating = userPreferences.ratings?.[candidate.food._id]?.rating;
        if (userRating) {
          finalScore *= (userRating / 3); // 3점 기준으로 정규화
        }

        // 선호하는 카테고리에 가중치 적용
        if (userPreferences.categories?.includes(candidate.food.category)) {
          finalScore *= 1.5;
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
            finalScore *= (1 + tagMatches * 0.3);
          }
        }
      }

      return {
        ...candidate,
        finalScore,
        userRating: userPreferences?.ratings?.[candidate.food._id]?.rating
      };
    });

    // 최종 점수순으로 정렬하고 상위 3개 선택
    const finalRecommendations = weightedCandidates
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, 3);

    res.json({
      success: true,
      data: {
        weather: {
          temperature: temp,
          description: description
        },
        foodType: foodType,
        recommendations: finalRecommendations.map(rec => ({
          _id: rec.food._id,
          name: rec.food.name,
          category: rec.food.category,
          description: rec.food.description,
          price: rec.food.price,
          rating: rec.food.rating,
          tags: rec.food.tags,
          image: rec.food.image,
          matchedRules: rec.matchedRules,
          userRating: rec.userRating,
          finalScore: Math.round(rec.finalScore * 100) / 100
        })),
        totalCandidates: topCandidates.length
      }
    });

  } catch (error) {
    console.error("날씨 기반 음식 추천 오류:", error);
    res.status(500).json({
      success: false,
      message: "음식 추천 중 오류가 발생했습니다.",
      error: error.message
    });
  }
};
