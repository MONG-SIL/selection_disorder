import axios from "axios";

const API_BASE_URL = "http://localhost:4000/api";

// 기분 기반 음식 추천
export const getMoodBasedRecommendations = async (mood, foodType = "main", token) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/mood-recommend`, {
      params: { mood, foodType },
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error("기분 기반 추천 실패:", error);
    throw error;
  }
};

// 사용 가능한 기분 목록 조회
export const getAvailableMoods = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/mood-recommend/moods`);
    return response.data;
  } catch (error) {
    console.error("기분 목록 조회 실패:", error);
    throw error;
  }
};

// 통합 추천 (날씨 + 기분 + 인기도)
export const getIntegratedRecommendations = async (params, token) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/integrated-recommend`, {
      params,
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error("통합 추천 실패:", error);
    throw error;
  }
};
