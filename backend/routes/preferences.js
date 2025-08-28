import express from "express";
const router = express.Router();

// 임시 데이터 (DB 연결 전 테스트용)
let preferences = [
  { food: "김치찌개", rating: 5 },
  { food: "비빔밥", rating: 4 }
];

// GET /api/user/preferences → 취향 불러오기
router.get("/", (req, res) => {
  res.json(preferences);
});

// POST /api/user/preferences → 취향 저장
router.post("/", (req, res) => {
  const { food, rating } = req.body;
  preferences.push({ food, rating });
  res.json({ success: true, preferences });
});

// PUT /api/user/preferences → 취향 수정
router.put("/", (req, res) => {
  const { food, rating } = req.body;
  preferences = preferences.map((p) =>
    p.food === food ? { ...p, rating } : p
  );
  res.json({ success: true, preferences });
});

// DELETE /api/user/preferences → 취향 삭제
router.delete("/", (req, res) => {
  const { food } = req.body;
  preferences = preferences.filter((p) => p.food !== food);
  res.json({ success: true, preferences });
});

export default router;