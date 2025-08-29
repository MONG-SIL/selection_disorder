import express from "express";
const router = express.Router();

// 임시 데이터 (DB 연결 전 테스트용)
let preferencesDB = {}; // userId별로 저장

// GET /api/user/preferences?userId=xxx → 취향 불러오기
router.get("/", (req, res) => {
  const { userId } = req.query;
  console.log("GET 요청 userId:", userId);
  console.log("현재 preferencesDB:", preferencesDB);
  if (!userId || !preferencesDB[userId]) {
    return res.status(404).json({ success: false, message: "No preferences found" });
  }
  res.json(preferencesDB[userId]);
});

// POST /api/user/preferences → 취향 저장 (온보딩)
router.post("/", (req, res) => {
  const { userId, categories, ratings, customFoods } = req.body;
  if (!userId || !categories || !ratings || !customFoods) {
    return res.status(400).json({ success: false, message: "Invalid data" });
  }
  preferencesDB[userId] = { categories, ratings, customFoods };
  res.json({ success: true, preferences: preferencesDB[userId] });
});

// PUT /api/user/preferences → 취향 수정
router.put("/", (req, res) => {
  const { userId, food, rating } = req.body;
  if (!userId || !food || rating === undefined || rating === null) {
    return res.status(400).json({ success: false, message: "Invalid data" });
  }
  if (!preferencesDB[userId]) {
    return res.status(404).json({ success: false, message: "User preferences not found" });
  }
  // ratings 수정
  preferencesDB[userId].ratings[food] = rating;
  res.json({ success: true, preferences: preferencesDB[userId] });
});

// DELETE /api/user/preferences → 취향 삭제
router.delete("/", (req, res) => {
  const { userId, food } = req.body;
  if (!userId || !food) {
    return res.status(400).json({ success: false, message: "Invalid data" });
  }
  if (!preferencesDB[userId]) {
    return res.status(404).json({ success: false, message: "User preferences not found" });
  }
  // ratings에서 삭제
  delete preferencesDB[userId].ratings[food];
  res.json({ success: true, preferences: preferencesDB[userId] });
});

export default router;