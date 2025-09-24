import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { getMoodBasedRecommendations, getAvailableMoods } from "../controllers/moodRecommendController.js";

const router = express.Router();

// 기분 기반 음식 추천
router.get("/", authenticateToken, getMoodBasedRecommendations);

// 사용 가능한 기분 목록 조회
router.get("/moods", getAvailableMoods);

export default router;
