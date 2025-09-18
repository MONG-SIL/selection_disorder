import express from "express";
import { getWeatherBasedRecommendations } from "../controllers/weatherRecommendController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// 날씨 기반 음식 추천 API
router.get("/", authenticateToken, getWeatherBasedRecommendations);

export default router;
