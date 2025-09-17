import React from 'react';
import { X, Clock, Users, ChefHat, Utensils, Flame } from 'lucide-react';

const RecipeModal = ({ recipe, isOpen, onClose }) => {
  if (!isOpen || !recipe) return null;

  const { 
    title, 
    instructions, 
    ingredients, 
    nutrition, 
    readyInMinutes, 
    servings, 
    difficulty,
    summary 
  } = recipe;

  const getDifficultyColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDifficultyText = (level) => {
    switch (level?.toLowerCase()) {
      case 'easy': return '쉬움';
      case 'medium': return '보통';
      case 'hard': return '어려움';
      default: return '보통';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-start">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{readyInMinutes}분</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{servings}인분</span>
              </div>
              <div className="flex items-center gap-1">
                <ChefHat className="w-4 h-4" />
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(difficulty)}`}>
                  {getDifficultyText(difficulty)}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* 요약 */}
          {summary && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">요약</h3>
              <p className="text-gray-700 text-sm leading-relaxed">
                {summary.replace(/<[^>]*>/g, '')}
              </p>
            </div>
          )}

          {/* 영양 정보 */}
          {nutrition && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Flame className="w-5 h-5" />
                영양 정보 (1인분 기준)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{Math.round(nutrition.calories)}</div>
                  <div className="text-sm text-gray-600">칼로리</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{Math.round(nutrition.protein)}g</div>
                  <div className="text-sm text-gray-600">단백질</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{Math.round(nutrition.carbs)}g</div>
                  <div className="text-sm text-gray-600">탄수화물</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{Math.round(nutrition.fat)}g</div>
                  <div className="text-sm text-gray-600">지방</div>
                </div>
              </div>
            </div>
          )}

          {/* 재료 */}
          {ingredients && ingredients.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Utensils className="w-5 h-5" />
                재료 ({ingredients.length}개)
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <ul className="space-y-2">
                  {ingredients.map((ingredient, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span className="text-gray-700">{ingredient}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* 조리법 */}
          {instructions && instructions.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <ChefHat className="w-5 h-5" />
                조리법 ({instructions.length}단계)
              </h3>
              <div className="space-y-4">
                {instructions.map((instruction, index) => (
                  <div key={index} className="flex gap-4 p-4 bg-white border border-gray-200 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-700 leading-relaxed">{instruction}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="sticky bottom-0 bg-gray-50 border-t p-4">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeModal;
