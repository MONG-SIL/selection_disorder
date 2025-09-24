import React, { useEffect, useState } from "react";
import axios from "axios";
import MoodSelector from "./MoodSelector";
import { getMoodBasedRecommendations, getIntegratedRecommendations } from "../services/moodApi";

const FoodRecommend = ({ weatherData, token }) => {
  const [recommendationType, setRecommendationType] = useState("popular"); // popular, mood, integrated
  const [selectedMood, setSelectedMood] = useState(null);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRecommendations();
  }, [recommendationType, selectedMood, weatherData]);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (recommendationType === "popular") {
        const res = await axios.get("/api/popular-foods");
        setFoods(res.data || []);
      } else if (recommendationType === "mood" && selectedMood) {
        const res = await getMoodBasedRecommendations(selectedMood, "main", token);
        setFoods(res.data?.recommendations || []);
      } else if (recommendationType === "integrated" && selectedMood && weatherData) {
        const params = {
          temperature: weatherData.temperature,
          weatherDescription: weatherData.description,
          mood: selectedMood,
          foodType: "main"
        };
        const res = await getIntegratedRecommendations(params, token);
        setFoods(res.data?.recommendations || []);
      }
    } catch (err) {
      console.error("추천 가져오기 실패:", err);
      setError("추천을 가져오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleMoodSelect = (mood) => {
    setSelectedMood(mood);
  };

  const getRecommendationTitle = () => {
    switch (recommendationType) {
      case "popular":
        return "🍜 요즘 인기 있는 음식 추천";
      case "mood":
        return `😊 ${selectedMood ? `${selectedMood} 기분에 어울리는` : "기분 기반"} 음식 추천`;
      case "integrated":
        return "🎯 맞춤형 통합 음식 추천";
      default:
        return "🍜 음식 추천";
    }
  };

  const renderFoodItem = (food, idx) => {
    if (recommendationType === "popular") {
      return (
        <li
          key={idx}
          className="flex items-center mb-4 pb-3 border-b border-gray-200"
        >
          <img
            src={food.thumbnail}
            alt={food.title}
            width={120}
            className="rounded-lg mr-4"
          />
          <p className="text-base font-medium">{food.title}</p>
        </li>
      );
    } else {
      return (
        <li
          key={food._id || idx}
          className="flex items-center mb-4 pb-3 border-b border-gray-200"
        >
          <img
            src={food.image || "/placeholder-food.jpg"}
            alt={food.name}
            width={120}
            className="rounded-lg mr-4"
          />
          <div className="flex-1">
            <h3 className="text-base font-medium text-gray-900">{food.name}</h3>
            <p className="text-sm text-gray-600">{food.description}</p>
            <div className="flex items-center mt-2">
              <span className="text-sm text-gray-500 mr-2">평점: {food.rating?.toFixed(1) || "N/A"}</span>
              {food.userRating && (
                <span className="text-sm text-blue-600 mr-2">내 평점: {food.userRating}</span>
              )}
              {food.finalScore && (
                <span className="text-sm text-green-600">추천 점수: {food.finalScore}</span>
              )}
            </div>
            {food.tags && food.tags.length > 0 && (
              <div className="flex flex-wrap mt-1">
                {food.tags.slice(0, 3).map((tag, tagIdx) => (
                  <span
                    key={tagIdx}
                    className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded mr-1 mb-1"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </li>
      );
    }
  };

  if (loading) {
    return (
      <div className="p-5">
        <div className="flex justify-center items-center h-32">
          <div className="text-gray-500">추천을 불러오는 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">{getRecommendationTitle()}</h2>
        
        {/* 추천 타입 선택 */}
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => setRecommendationType("popular")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              recommendationType === "popular"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            인기 음식
          </button>
          <button
            onClick={() => setRecommendationType("mood")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              recommendationType === "mood"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            기분 기반
          </button>
          <button
            onClick={() => setRecommendationType("integrated")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              recommendationType === "integrated"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            통합 추천
          </button>
        </div>

        {/* 기분 선택 (기분 기반 또는 통합 추천일 때) */}
        {(recommendationType === "mood" || recommendationType === "integrated") && (
          <MoodSelector
            onMoodSelect={handleMoodSelect}
            selectedMood={selectedMood}
            className="mb-6"
          />
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {foods.length === 0 && !loading && (
        <div className="text-center text-gray-500 py-8">
          {recommendationType === "mood" || recommendationType === "integrated"
            ? "기분을 선택해주세요."
            : "추천할 음식이 없습니다."}
        </div>
      )}

      {foods.length > 0 && (
        <ul className="space-y-0">
          {foods.map((food, idx) => renderFoodItem(food, idx))}
        </ul>
      )}
    </div>
  );
};


export default FoodRecommend;