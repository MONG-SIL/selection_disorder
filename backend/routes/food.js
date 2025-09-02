import express from "express";
import {
  getAllFoods,
  getFoodById,
  createFood,
  updateFood,
  deleteFood,
  getFoodsByCategory
} from "../controllers/foodController.js";

const router = express.Router();

// 모든 음식 리스트 가져오기 (필터링 옵션 포함)
// GET /api/food?category=한식&search=김치&available=true
router.get("/", getAllFoods);

// 카테고리별 음식 리스트
// GET /api/food/category/한식
router.get("/category/:category", getFoodsByCategory);

// 특정 음식 가져오기
// GET /api/food/:id
router.get("/:id", getFoodById);

// 새 음식 추가
// POST /api/food
router.post("/", createFood);

// 음식 정보 수정
// PUT /api/food/:id
router.put("/:id", updateFood);

// 음식 삭제
// DELETE /api/food/:id
router.delete("/:id", deleteFood);

export default router;
