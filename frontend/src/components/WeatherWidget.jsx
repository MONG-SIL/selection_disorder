import { useEffect, useState } from "react";
import axios from "axios";
import styled from "styled-components";

const WeatherBox = styled.div`
  padding: 1rem;
  background-color: #e0f2fe;
  border-radius: 8px;
  text-align: center;
`;

export default function WeatherWidget({ lat, lon }) {
  const [weather, setWeather] = useState(null);

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

  if (!weather) return <WeatherBox>날씨 정보를 불러오는 중...</WeatherBox>;

  return (
    <WeatherBox>
      <h3>현재 날씨</h3>
      <p>{weather.temp}°C, {weather.description}</p>
      <img
        alt="weather-icon"
        src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
      />
      <p><strong>{weather.suggestion}</strong></p>
      <button>추천 음식 보기</button>
    </WeatherBox>
  );
}