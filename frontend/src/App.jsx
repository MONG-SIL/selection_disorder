import { useState, useEffect } from "react";
import styled from "styled-components";
import WeatherWidget from "./components/WeatherWidget";
import ChatBox from "./components/ChatBox";
import MapView from "./components/MapView";
import Preferences from "./components/Preferences";
import FoodList from "./components/FoodList";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navigation from "./components/Navigation";
import OnboardingPreferences from "./components/OnboardingPreferences";
import Signup from "./components/Signup";
import Login from "./components/Login";
import FoodRecommend from "./components/FoodRecommend";
import ProtectedRoute from "./components/ProtectedRoute";

// 음식 추천 서비스 메인 페이지

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 1rem;
  padding-top: 5rem; 
  gap: 1rem;
`;
const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
`;

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

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Container>
                <Navigation />
                <Routes>
                  <Route path="/" element={<Title>🍴 음식 추천 서비스</Title>} />
                  <Route
                    path="/weather"
                    element={position ? <WeatherWidget lat={position.lat} lon={position.lon} /> : null}
                  />
                  <Route
                    path="/map"
                    element={position ? <MapView lat={position.lat} lon={position.lon} /> : null}
                  />
                  <Route path="/preferences" element={<Preferences />} />
                  <Route path="/chat" element={<ChatBox />} />
                  <Route path="/food" element={<FoodList />} />
                  <Route path="/onboarding" element={<OnboardingPreferences />} />
                  <Route path="/food-recommend" element={<FoodRecommend />} />
                </Routes>
              </Container>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
