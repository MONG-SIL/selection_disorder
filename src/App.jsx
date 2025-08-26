import { useState, useEffect } from "react";
import WeatherWidget from "./components/WeatherWidget";
import ChatBox from "./components/ChatBox";
import MapView from "./components/MapView";
import axios from "axios";

export default function App() {
  const [position, setPosition] = useState(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setPosition({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        }),
      (err) => console.error(err)
    );
  }, []);

  const addPreference = async () => {
    await axios.post("http://localhost:4000/api/user/preferences", {
      food: "김치찌개",
    });
    alert("김치찌개 취향 저장!");
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">🍴 음식 추천 서비스</h1>
      {position && (
        <>
          <WeatherWidget lat={position.lat} lon={position.lon} />
          <MapView lat={position.lat} lon={position.lon} />
        </>
      )}
      <button
        onClick={addPreference}
        className="bg-green-500 text-white px-4 py-2 rounded"
      >
        취향 저장 (김치찌개)
      </button>
      <ChatBox />
    </div>
  );
}