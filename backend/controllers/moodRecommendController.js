import Food from "../models/Food.js";
import axios from "axios";

// 기분별 음식 추천 규칙 정의
const moodFoodMapping = {
  // 긍정적 기분
  happy: {
    tags: ["달콤한", "달콤", "달콤함", "달콤한맛", "달콤한음식"],
    moodTags: ["행복", "기쁨", "즐거움", "만족"],
    categories: ["디저트", "양식", "한식"],
    description: "행복한 기분에 어울리는 달콤하고 즐거운 음식"
  },
  excited: {
    tags: ["매운맛", "매운", "얼큰한", "자극적인"],
    moodTags: ["신남", "흥분", "활기", "에너지"],
    categories: ["한식", "중식", "일식"],
    description: "신나는 기분에 어울리는 자극적이고 매운 음식"
  },
  relaxed: {
    tags: ["부드러운", "담백한", "가벼운", "건강한"],
    moodTags: ["편안", "평온", "여유", "안정"],
    categories: ["양식", "한식", "일식"],
    description: "편안한 기분에 어울리는 부드럽고 담백한 음식"
  },
  
  // 부정적 기분
  sad: {
    tags: ["달콤한", "달콤", "달콤함", "달콤한맛", "달콤한음식", "따뜻한"],
    moodTags: ["슬픔", "우울", "힘듦", "위로"],
    categories: ["디저트", "한식", "중식"],
    description: "슬픈 기분에 위로가 되는 달콤하고 따뜻한 음식"
  },
  stressed: {
    tags: ["매운맛", "매운", "얼큰한", "자극적인", "따뜻한"],
    moodTags: ["스트레스", "압박", "긴장", "해소"],
    categories: ["한식", "중식", "일식"],
    description: "스트레스 해소에 도움이 되는 매운 음식"
  },
  tired: {
    tags: ["따뜻한", "보양", "영양", "에너지", "달콤한"],
    moodTags: ["피곤", "지침", "무기력", "회복"],
    categories: ["한식", "중식"],
    description: "피곤한 몸에 에너지를 주는 따뜻하고 영양가 있는 음식"
  },
  angry: {
    tags: ["매운맛", "매운", "얼큰한", "자극적인", "따뜻한"],
    moodTags: ["화남", "짜증", "분노", "해소"],
    categories: ["한식", "중식"],
    description: "화가 날 때 해소에 도움이 되는 매운 음식"
  },
  
  // 중립적 기분
  neutral: {
    tags: ["담백한", "가벼운", "건강한", "신선한"],
    moodTags: ["평범", "보통", "일상", "안정"],
    categories: ["한식", "양식", "일식"],
    description: "일상적인 기분에 어울리는 담백하고 건강한 음식"
  },
  hungry: {
    tags: ["든든한", "포만감", "영양", "고기", "면요리"],
    moodTags: ["배고픔", "공복", "욕구", "만족"],
    categories: ["한식", "중식", "일식"],
    description: "배고플 때 든든하게 해주는 음식"
  }
};

// 기분 기반 음식 추천 함수
export const getMoodBasedRecommendations = async (req, res) => {
  try {
    const { mood, foodType = "main" } = req.query;
    const userId = req.user?.userId; // 토큰에서 추출
    
    if (!mood) {
      return res.status(400).json({
        success: false,
        message: "기분이 필요합니다."
      });
    }

    const moodKey = mood.toLowerCase();
    const moodRule = moodFoodMapping[moodKey];

    if (!moodRule) {
      return res.status(400).json({
        success: false,
        message: "지원하지 않는 기분입니다.",
        availableMoods: Object.keys(moodFoodMapping)
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

    // 기분 규칙 기반으로 음식 점수 계산
    const foodScores = allFoods.map(food => {
      let score = 0;
      let matchedRules = [];

      // 태그 매칭 점수 계산
      if (moodRule.tags && food.tags) {
        const tagMatches = food.tags.filter(tag => 
          moodRule.tags.some(ruleTag => 
            tag.toLowerCase().includes(ruleTag.toLowerCase()) ||
            ruleTag.toLowerCase().includes(tag.toLowerCase())
          )
        ).length;
        score += tagMatches * 3; // 태그 매칭은 높은 점수
      }

      // 기분 태그 매칭 점수 계산
      if (moodRule.moodTags && food.moodTags) {
        const moodTagMatches = food.moodTags.filter(tag => 
          moodRule.moodTags.some(ruleTag => 
            tag.toLowerCase().includes(ruleTag.toLowerCase()) ||
            ruleTag.toLowerCase().includes(tag.toLowerCase())
          )
        ).length;
        score += moodTagMatches * 4; // 기분 태그 매칭은 가장 높은 점수
      }

      // 카테고리 매칭 점수 계산
      if (moodRule.categories && food.category) {
        const categoryMatch = moodRule.categories.includes(food.category);
        if (categoryMatch) {
          score += 2; // 카테고리 매칭 점수
        }
      }

      // 기본 평점 반영
      score += food.rating || 0;

      if (score > 0) {
        matchedRules.push({
          type: moodKey,
          description: moodRule.description,
          score: score
        });
      }

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

    // 사용자 취향 기반 가중치 적용
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
        mood: moodKey,
        foodType: foodType,
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
          matchedRules: rec.matchedRules,
          userRating: rec.userRating,
          finalScore: Math.round(rec.finalScore * 100) / 100
        })),
        totalCandidates: topCandidates.length
      }
    });

  } catch (error) {
    console.error("기분 기반 음식 추천 오류:", error);
    res.status(500).json({
      success: false,
      message: "음식 추천 중 오류가 발생했습니다.",
      error: error.message
    });
  }
};

// 사용 가능한 기분 목록 조회
export const getAvailableMoods = async (req, res) => {
  try {
    const moods = Object.keys(moodFoodMapping).map(key => ({
      key,
      ...moodFoodMapping[key]
    }));

    res.json({
      success: true,
      data: moods
    });
  } catch (error) {
    console.error("기분 목록 조회 오류:", error);
    res.status(500).json({
      success: false,
      message: "기분 목록을 가져오는데 실패했습니다.",
      error: error.message
    });
  }
};
