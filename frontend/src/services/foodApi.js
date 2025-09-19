import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api/food';

// 모든 음식 리스트 가져오기
export const getAllFoods = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.category) params.append('category', filters.category);
    if (filters.search) params.append('search', filters.search);
    if (filters.available !== undefined) params.append('available', filters.available);
    
    const response = await axios.get(`${API_BASE_URL}?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('음식 리스트 가져오기 실패:', error);
    throw error;
  }
};

// 특정 음식 가져오기
export const getFoodById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error('음식 정보 가져오기 실패:', error);
    throw error;
  }
};

// 음식 이미지 배치 조회
export const getFoodImages = async (foodIds) => {
  try {
    const response = await axios.get('http://localhost:4000/api/food-images', {
      params: { ids: foodIds.join(',') }
    });
    return response.data;
  } catch (error) {
    console.error('음식 이미지 조회 실패:', error);
    throw error;
  }
};

// 음식 레시피 배치 조회
export const getFoodRecipes = async (foodIds) => {
  try {
    const response = await axios.get('http://localhost:4000/api/food-recipes', {
      params: { ids: foodIds.join(',') }
    });
    return response.data;
  } catch (error) {
    console.error('음식 레시피 조회 실패:', error);
    throw error;
  }
};

// 개별 음식 레시피 조회
export const getFoodRecipe = async (foodId) => {
  try {
    const response = await axios.get(`http://localhost:4000/api/food-recipes/${foodId}`);
    return response.data;
  } catch (error) {
    console.error('음식 레시피 조회 실패:', error);
    throw error;
  }
};

// 카테고리별 음식 리스트
export const getFoodsByCategory = async (category) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/category/${category}`);
    return response.data;
  } catch (error) {
    console.error('카테고리별 음식 리스트 가져오기 실패:', error);
    throw error;
  }
};

// 새 음식 추가
export const createFood = async (foodData) => {
  try {
    const response = await axios.post(API_BASE_URL, foodData);
    return response.data;
  } catch (error) {
    console.error('음식 추가 실패:', error);
    throw error;
  }
};

// 음식 정보 수정
export const updateFood = async (id, foodData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/${id}`, foodData);
    return response.data;
  } catch (error) {
    console.error('음식 정보 수정 실패:', error);
    throw error;
  }
};

// 음식 삭제
export const deleteFood = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error('음식 삭제 실패:', error);
    throw error;
  }
};
