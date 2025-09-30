import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { getIntegratedRecommendations } from "../controllers/integratedRecommendController.js";

const router = express.Router();

// 통합 추천 (날씨 + 기분 + 인기도) - 임시로 인증 제거
router.get("/", getIntegratedRecommendations);

export default router;
