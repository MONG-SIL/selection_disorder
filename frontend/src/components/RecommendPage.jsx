import React, { useState, useEffect } from "react";
import axios from "axios";
import MoodSelector from "./MoodSelector";
import { getMoodBasedRecommendations, getIntegratedRecommendations } from "../services/moodApi";

const RecommendPage = ({ weatherData, token }) => {
  const [activeTab, setActiveTab] = useState("weather");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 각 탭별 데이터 상태
  const [weatherRecommendations, setWeatherRecommendations] = useState([]);
  const [popularFoods, setPopularFoods] = useState([]);
  const [moodRecommendations, setMoodRecommendations] = useState([]);
  const [integratedRecommendations, setIntegratedRecommendations] = useState([]);
  
  // 기분 선택 상태
  const [selectedMood, setSelectedMood] = useState(null);

  // 컴포넌트 마운트 시 인기 음식 로드
  useEffect(() => {
    fetchPopularFoods();
  }, []);

  // 날씨 데이터가 변경될 때 날씨 기반 추천 로드
  useEffect(() => {
    if (weatherData && activeTab === "weather") {
      fetchWeatherRecommendations();
    }
  }, [weatherData, activeTab]);

  // 기분이 선택될 때 기분 기반 추천 로드
  useEffect(() => {
    if (selectedMood && activeTab === "mood") {
      fetchMoodRecommendations();
    }
  }, [selectedMood, activeTab]);

  // 기분과 날씨 데이터가 모두 있을 때 통합 추천 로드
  useEffect(() => {
    if (selectedMood && weatherData && activeTab === "integrated") {
      fetchIntegratedRecommendations();
    }
  }, [selectedMood, weatherData, activeTab]);

  const fetchPopularFoods = async () => {
    try {
      const response = await axios.get("/api/popular-foods");
      setPopularFoods(response.data || []);
      setError(null); // 성공 시 에러 초기화
    } catch (err) {
      console.error("인기 음식 가져오기 실패:", err);
      const errorMessage = err.response?.data?.error || "인기 음식을 가져오는데 실패했습니다.";
      const errorDetails = err.response?.data?.details || "";
      setError(`${errorMessage}${errorDetails ? ` - ${errorDetails}` : ""}`);
      
      // 에러 발생 시에도 빈 배열로 설정 (백엔드에서 이미 기본 데이터를 제공하므로)
      setPopularFoods([]);
    }
  };

  const fetchWeatherRecommendations = async () => {
    if (!weatherData || !token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get("http://localhost:4000/api/weather-recommend", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          temperature: weatherData.temperature,
          description: weatherData.description,
          foodType: "main"
        }
      });
      setWeatherRecommendations(response.data?.data?.recommendations || []);
    } catch (err) {
      console.error("날씨 기반 추천 실패:", err);
      setError("날씨 기반 추천을 가져오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMoodRecommendations = async () => {
    if (!selectedMood || !token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await getMoodBasedRecommendations(selectedMood, "main", token);
      setMoodRecommendations(response.data?.recommendations || []);
    } catch (err) {
      console.error("기분 기반 추천 실패:", err);
      setError("기분 기반 추천을 가져오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const fetchIntegratedRecommendations = async () => {
    if (!selectedMood || !weatherData || !token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        temperature: weatherData.temperature,
        weatherDescription: weatherData.description,
        mood: selectedMood,
        foodType: "main"
      };
      const response = await getIntegratedRecommendations(params, token);
      setIntegratedRecommendations(response.data?.recommendations || []);
    } catch (err) {
      console.error("통합 추천 실패:", err);
      setError("통합 추천을 가져오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleMoodSelect = (mood) => {
    setSelectedMood(mood);
  };

  const renderFoodItem = (food, idx, type = "recommendation") => {
    if (type === "popular") {
      return (
        <div key={idx} className="flex items-center p-4 bg-white rounded-lg shadow-sm border border-gray-200">
          <img
            src={food.thumbnail}
            alt={food.title}
            width={80}
            height={80}
            className="rounded-lg mr-4 object-cover"
          />
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">{food.title}</h3>
            <div className="flex flex-wrap mt-1">
              {food.tags?.slice(0, 3).map((tag, tagIdx) => (
                <span
                  key={tagIdx}
                  className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded mr-1 mb-1"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div key={food._id || idx} className="flex items-center p-4 bg-white rounded-lg shadow-sm border border-gray-200">
          <img
            src={food.image || "/placeholder-food.jpg"}
            alt={food.name}
            width={80}
            height={80}
            className="rounded-lg mr-4 object-cover"
          />
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">{food.name}</h3>
            <p className="text-sm text-gray-600 mt-1">{food.description}</p>
            <div className="flex items-center mt-2 text-sm text-gray-500">
              <span className="mr-3">평점: {food.rating?.toFixed(1) || "N/A"}</span>
              {food.userRating && (
                <span className="mr-3 text-blue-600">내 평점: {food.userRating}</span>
              )}
              {food.finalScore && (
                <span className="text-green-600">추천 점수: {food.finalScore}</span>
              )}
            </div>
            <div className="flex flex-wrap mt-2">
              {food.tags?.slice(0, 3).map((tag, tagIdx) => (
                <span
                  key={tagIdx}
                  className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded mr-1 mb-1"
                >
                  {tag}
                </span>
              ))}
            </div>
            {food.moodTags && food.moodTags.length > 0 && (
              <div className="flex flex-wrap mt-1">
                {food.moodTags.slice(0, 2).map((moodTag, tagIdx) => (
                  <span
                    key={tagIdx}
                    className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded mr-1 mb-1"
                  >
                    {moodTag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }
  };

  const getCurrentRecommendations = () => {
    switch (activeTab) {
      case "weather":
        return weatherRecommendations;
      case "popular":
        return popularFoods;
      case "mood":
        return moodRecommendations;
      case "integrated":
        return integratedRecommendations;
      default:
        return [];
    }
  };

  const getCurrentType = () => {
    switch (activeTab) {
      case "popular":
        return "popular";
      default:
        return "recommendation";
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case "weather":
        return "🌤️ 날씨 기반 추천";
      case "popular":
        return "🔥 인기 음식";
      case "mood":
        return "😊 기분 기반 추천";
      case "integrated":
        return "🎯 통합 추천";
      default:
        return "음식 추천";
    }
  };

  const currentRecommendations = getCurrentRecommendations();
  const currentType = getCurrentType();

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">🍽️ 음식 추천</h1>
      
      {/* 탭 네비게이션 */}
      <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab("weather")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === "weather"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          🌤️ 날씨 기반
        </button>
        <button
          onClick={() => setActiveTab("popular")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === "popular"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          🔥 인기 음식
        </button>
        <button
          onClick={() => setActiveTab("mood")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === "mood"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          😊 기분 기반
        </button>
        <button
          onClick={() => setActiveTab("integrated")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === "integrated"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          🎯 통합 추천
        </button>
      </div>

      {/* 기분 선택 (기분 기반 또는 통합 추천일 때) */}
      {(activeTab === "mood" || activeTab === "integrated") && (
        <div className="mb-6">
          <MoodSelector
            onMoodSelect={handleMoodSelect}
            selectedMood={selectedMood}
          />
        </div>
      )}

      {/* 날씨 정보 표시 (날씨 기반 또는 통합 추천일 때) */}
      {(activeTab === "weather" || activeTab === "integrated") && weatherData && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900">현재 날씨</h3>
          <p className="text-blue-700">
            {weatherData.temperature}°C, {weatherData.description}
          </p>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* 로딩 상태 */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-500">추천을 불러오는 중...</div>
        </div>
      )}

      {/* 추천 결과 */}
      {!loading && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {getTabTitle()}
          </h2>
          
          {currentRecommendations.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              {(activeTab === "mood" || activeTab === "integrated") && !selectedMood
                ? "기분을 선택해주세요."
                : activeTab === "weather" && !weatherData
                ? "날씨 정보를 가져올 수 없습니다."
                : "추천할 음식이 없습니다."}
            </div>
          ) : (
            <div className="grid gap-4">
              {currentRecommendations.map((food, idx) => 
                renderFoodItem(food, idx, currentType)
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecommendPage;
