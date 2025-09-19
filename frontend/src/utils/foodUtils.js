// 음식 데이터 관련 유틸리티 함수들

/**
 * 음식 데이터에 이미지와 레시피 정보를 추가하는 함수
 * @param {Array} foods - 원본 음식 데이터 배열
 * @param {Object} images - 이미지 캐시 객체 { [foodId]: imageUrl }
 * @param {Object} recipes - 레시피 캐시 객체 { [foodId]: { recipe } }
 * @returns {Array} 이미지와 레시피가 추가된 음식 데이터 배열
 */
export const enrichFoodsWithImagesAndRecipes = (foods, images = {}, recipes = {}) => {
  return foods.map(food => ({
    ...food,
    image: images[food._id] || food.image || null,
    imageUrl: images[food._id] || food.image || null,  // 호환성을 위해 유지
    recipe: recipes[food._id]?.recipe || null
  }));
};

/**
 * 음식 ID 배열에서 유효한 ID만 필터링
 * @param {Array} foods - 음식 데이터 배열
 * @returns {Array} 유효한 음식 ID 배열
 */
export const getValidFoodIds = (foods) => {
  return foods.map(f => f._id).filter(Boolean);
};

/**
 * 음식 데이터의 이미지 URL을 안전하게 가져오는 함수
 * @param {Object} food - 음식 객체
 * @param {Object} imageCache - 이미지 캐시
 * @param {string} fallbackImage - fallback 이미지 URL
 * @returns {string} 이미지 URL
 */
export const getFoodImageUrl = (food, imageCache = {}, fallbackImage = null) => {
  return imageCache[food._id] || food.image || food.imageUrl || fallbackImage;
};

/**
 * 음식 데이터의 레시피를 안전하게 가져오는 함수
 * @param {Object} food - 음식 객체
 * @param {Object} recipeCache - 레시피 캐시
 * @returns {Object|null} 레시피 객체 또는 null
 */
export const getFoodRecipe = (food, recipeCache = {}) => {
  return recipeCache[food._id]?.recipe || food.recipe || null;
};

/**
 * 음식이 레시피를 가지고 있는지 확인하는 함수
 * @param {Object} food - 음식 객체
 * @param {Object} recipeCache - 레시피 캐시
 * @returns {boolean} 레시피 존재 여부
 */
export const hasFoodRecipe = (food, recipeCache = {}) => {
  const recipe = getFoodRecipe(food, recipeCache);
  return !!recipe && recipe.provider !== 'fallback';
};
