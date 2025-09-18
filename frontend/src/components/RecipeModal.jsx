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
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden shadow-2xl transform transition-all duration-300 scale-100">
        {/* 헤더 */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-6 flex justify-between items-start">
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{title}</h2>
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-full shadow-sm border">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="font-medium text-gray-700">{readyInMinutes}분</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-full shadow-sm border">
                <Users className="w-4 h-4 text-green-500" />
                <span className="font-medium text-gray-700">{servings}인분</span>
              </div>
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-full shadow-sm border">
                <ChefHat className="w-4 h-4 text-orange-500" />
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(difficulty)}`}>
                  {getDifficultyText(difficulty)}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-3 hover:bg-white hover:shadow-md rounded-full transition-all duration-200 group"
          >
            <X className="w-6 h-6 text-gray-500 group-hover:text-gray-700" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* 요약 */}
          {summary && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-200">
              <h3 className="font-bold text-gray-900 mb-3 text-lg flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                요약
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {summary.replace(/<[^>]*>/g, '')}
              </p>
            </div>
          )}

          {/* 영양 정보 */}
          {nutrition && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-xl border border-emerald-200">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                <Flame className="w-5 h-5 text-orange-500" />
                영양 정보 (1인분 기준)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center bg-white p-4 rounded-xl shadow-sm">
                  <div className="text-3xl font-bold text-blue-600 mb-1">{Math.round(nutrition.calories)}</div>
                  <div className="text-sm text-gray-600 font-medium">칼로리</div>
                </div>
                <div className="text-center bg-white p-4 rounded-xl shadow-sm">
                  <div className="text-3xl font-bold text-green-600 mb-1">{Math.round(nutrition.protein)}g</div>
                  <div className="text-sm text-gray-600 font-medium">단백질</div>
                </div>
                <div className="text-center bg-white p-4 rounded-xl shadow-sm">
                  <div className="text-3xl font-bold text-orange-600 mb-1">{Math.round(nutrition.carbs)}g</div>
                  <div className="text-sm text-gray-600 font-medium">탄수화물</div>
                </div>
                <div className="text-center bg-white p-4 rounded-xl shadow-sm">
                  <div className="text-3xl font-bold text-red-600 mb-1">{Math.round(nutrition.fat)}g</div>
                  <div className="text-sm text-gray-600 font-medium">지방</div>
                </div>
              </div>
            </div>
          )}

          {/* 재료 */}
          {ingredients && ingredients.length > 0 && (
            <div>
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                <Utensils className="w-5 h-5 text-purple-500" />
                재료 ({ingredients.length}개)
              </h3>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
                <ul className="space-y-3">
                  {ingredients.map((ingredient, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-semibold mt-1">
                        {index + 1}
                      </div>
                      <span className="text-gray-700 font-medium">{ingredient}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* 조리법 */}
          {instructions && instructions.length > 0 && (
            <div>
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                <ChefHat className="w-5 h-5 text-indigo-500" />
                조리법 ({instructions.length}단계)
              </h3>
              <div className="space-y-6">
                {instructions.map((instruction, index) => (
                  <div key={index} className="flex gap-6 p-6 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl shadow-sm">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-full flex items-center justify-center text-lg font-bold shadow-lg">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-700 leading-relaxed text-base">{instruction}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="sticky bottom-0 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 p-6">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
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
