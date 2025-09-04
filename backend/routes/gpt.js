import express from "express";
import { generateFoodTags } from "../controllers/gptController.js";

const router = express.Router();

// GPT를 활용한 음식 태그 생성
// POST /api/gpt/generate-tags
router.post("/generate-tags", generateFoodTags);

export default router;
