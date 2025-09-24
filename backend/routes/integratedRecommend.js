import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { getIntegratedRecommendations } from "../controllers/integratedRecommendController.js";

const router = express.Router();

// 통합 추천 (날씨 + 기분 + 인기도)
router.get("/", authenticateToken, getIntegratedRecommendations);

export default router;
