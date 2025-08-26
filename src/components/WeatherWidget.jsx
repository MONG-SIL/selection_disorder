import { useEffect, useState } from "react";
import axios from "axios";

export default function WeatherWidget({ lat, lon }) {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    if (lat && lon) {
      axios.get(`/api/weather?lat=${lat}&lon=${lon}`)
        .then(res => setWeather(res.data))
        .catch(console.error);
    }
  }, [lat, lon]);

  if (!weather) return <div>날씨 정보를 불러오는 중...</div>;

  return (
    <div className="p-4 bg-blue-100 rounded-xl shadow-md">
      <h3 className="text-lg font-bold">현재 날씨</h3>
      <p>{weather.temp}°C, {weather.description}</p>
    </div>
  );
}