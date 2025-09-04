import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api/gpt';

// GPT를 활용한 음식 태그 생성
export const generateFoodTags = async (foodName) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/generate-tags`, {
      foodName
    });
    return response.data;
  } catch (error) {
    console.error('GPT 태그 생성 실패:', error);
    throw error;
  }
};
