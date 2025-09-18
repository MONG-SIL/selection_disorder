import { useEffect, useState } from "react";
import axios from "axios";
import styled from "styled-components";

const WeatherBox = styled.div`
  padding: 1rem;
  background-color: #e0f2fe;
  border-radius: 8px;
  text-align: center;
`;

const RecommendationModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
`;

const FoodCard = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  background: #f9fafb;
`;

const FoodName = styled.h4`
  margin: 0 0 0.5rem 0;
  color: #1f2937;
`;

const FoodInfo = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
`;

const FoodTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.5rem;
`;

const Tag = styled.span`
  background: #dbeafe;
  color: #1e40af;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
`;

const ScoreInfo = styled.div`
  font-size: 0.75rem;
  color: #059669;
  margin-top: 0.5rem;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 1rem;
`;

const RecommendButton = styled.button`
  padding: 0.5rem 1rem;
  border: 1px solid #2563eb;
  background: ${props => props.$loading ? '#94a3b8' : '#2563eb'};
  color: white;
  border-radius: 8px;
  cursor: ${props => props.$loading ? 'not-allowed' : 'pointer'};
  font-size: 0.875rem;
  transition: background-color 0.2s;
  
  &:hover {
    background: ${props => props.$loading ? '#94a3b8' : '#1d4ed8'};
  }
`;

export default function WeatherWidget({ lat, lon }) {
  const [weather, setWeather] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentFoodType, setCurrentFoodType] = useState("main");

  useEffect(() => {
    if (lat && lon) {
      axios
        .get(`http://localhost:4000/api/weather?lat=${lat}&lon=${lon}`)
        .then((res) => {
          console.log("Weather API response:", res.data);
          setWeather(res.data);
        })
        .catch((err) => console.error(err));
    }
  }, [lat, lon]);

  const handleShowRecommendations = async (foodType) => {
    if (!weather) return;
    
    setLoading(true);
    setCurrentFoodType(foodType);
    setShowRecommendations(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:4000/api/weather-recommend`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          temperature: weather.temp,
          description: weather.description,
          // userId는 백엔드에서 토큰으로 자동 추출됨
          foodType: foodType
        }
      });
      
      console.log("Weather recommendations response:", response.data);
      setRecommendations(response.data.data);
    } catch (error) {
      console.error("음식 추천 가져오기 실패:", error);
      setRecommendations({
        recommendations: [],
        error: "음식 추천을 가져올 수 없습니다."
      });
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowRecommendations(false);
    setRecommendations(null);
  };

  if (!weather) return <WeatherBox>날씨 정보를 불러오는 중...</WeatherBox>;

  return (
    <>
      <WeatherBox>
        <h3>현재 날씨</h3>
        <p>{weather.temp}°C, {weather.description}</p>
        <img
          alt="weather-icon"
          src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
        />
        <p><strong>{weather.suggestion}</strong></p>
        <ButtonContainer>
          <RecommendButton 
            onClick={() => handleShowRecommendations("main")} 
            disabled={loading}
            $loading={loading}
          >
            🍽️ 추천 음식 보기
          </RecommendButton>
          <RecommendButton 
            onClick={() => handleShowRecommendations("dessert")} 
            disabled={loading}
            $loading={loading}
          >
            🍰 추천 디저트 보기
          </RecommendButton>
        </ButtonContainer>
      </WeatherBox>

      {showRecommendations && (
        <RecommendationModal onClick={closeModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <CloseButton onClick={closeModal}>×</CloseButton>
            <h3>
              {currentFoodType === "dessert" ? "🍰 날씨 맞춤 디저트 추천" : "🍽️ 날씨 맞춤 음식 추천"}
            </h3>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              현재 날씨 ({weather.temp}°C, {weather.description})에 어울리는 {currentFoodType === "dessert" ? "디저트를" : "음식을"} 추천해드려요!
            </p>

            {loading ? (
              <LoadingSpinner>
                {currentFoodType === "dessert" ? "디저트 추천을 가져오는 중..." : "음식 추천을 가져오는 중..."}
              </LoadingSpinner>
            ) : recommendations?.recommendations?.length > 0 ? (
              <div>
                {recommendations.recommendations.map((food, index) => (
                  <FoodCard key={food._id}>
                    <FoodName>
                      {index + 1}. {food.name}
                    </FoodName>
                    <FoodInfo>
                      <div><strong>카테고리:</strong> {food.category}</div>
                      <div><strong>가격:</strong> {food.price?.toLocaleString()}원</div>
                      <div><strong>평점:</strong> ⭐ {food.rating}</div>
                      {food.userRating && (
                        <div><strong>내 평점:</strong> ⭐ {food.userRating}</div>
                      )}
                    </FoodInfo>
                    <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                      {food.description}
                    </div>
                    <FoodTags>
                      {food.tags?.map((tag, tagIndex) => (
                        <Tag key={tagIndex}>#{tag}</Tag>
                      ))}
                    </FoodTags>
                    {food.matchedRules?.length > 0 && (
                      <ScoreInfo>
                        추천 이유: {food.matchedRules.map(rule => rule.description).join(', ')}
                      </ScoreInfo>
                    )}
                  </FoodCard>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#6b7280' }}>
                {recommendations?.error || `추천할 ${currentFoodType === "dessert" ? "디저트가" : "음식이"} 없습니다.`}
              </div>
            )}
          </ModalContent>
        </RecommendationModal>
      )}
    </>
  );
}