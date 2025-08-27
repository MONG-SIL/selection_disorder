import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

const API_KEY = process.env.OPENWEATHER_API_KEY;

// GET /api/weather?lat=...&lon=...
router.get("/", async (req, res) => {
  const { lat, lon } = req.query;
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=kr`;
    const response = await axios.get(url);

    const temp = response.data.main.temp;
    const description = response.data.weather[0].description;

    // ✅ 날씨에 따른 음식 추천 문구
    let suggestion = "오늘은 아무 음식이나 좋아요!";
    if (temp < 5) suggestion = "추우니까 따뜻한 국물이 어때요? 🍲";
    else if (temp < 15) suggestion = "선선하니 매콤한 음식 추천! 🌶️";
    else if (temp < 25) suggestion = "날씨가 좋으니 가벼운 한 끼 어때요? 🥗";
    else suggestion = "더우니까 시원한 음식 추천! 🍧";

    res.json({
      temp,
      description,
      icon: response.data.weather[0].icon,
      suggestion,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "날씨 정보를 가져올 수 없습니다." });
  }
});

export default router;