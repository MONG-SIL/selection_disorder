import express from "express";
const router = express.Router();

// 임시 DB (실제 서비스에서는 DB 연동 필요)
let userPreferencesDB = {};

// 온보딩에서 받은 사용자 취향 저장
router.post("/onboarding-preferences", (req, res) => {
  const { userId, categories, ratings, customFoods } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "userId가 필요합니다." });
  }

  // userId 기준으로 저장
  userPreferencesDB[userId] = { categories, ratings, customFoods };
  console.log("저장된 온보딩 취향:", userPreferencesDB[userId]);

  return res.status(200).json({ message: "취향 저장 완료", data: userPreferencesDB[userId] });
});

// 저장된 사용자 취향 불러오기
router.get("/preferences/:userId", (req, res) => {
  const { userId } = req.params;
  const prefs = userPreferencesDB[userId];

  if (!prefs) {
    return res.status(404).json({ error: "사용자 취향을 찾을 수 없습니다." });
  }

  return res.status(200).json({ data: prefs });
});

export default router;