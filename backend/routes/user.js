import express from "express";
const router = express.Router();

// 임시 DB (실제 서비스에서는 DB 연동 필요)
let userPreferencesDB = {};

// 온보딩에서 받은 사용자 취향 저장
router.post("/onboarding-preferences", (req, res) => {
  let { userId, categories, ratings, customFoods } = req.body;
  if (!userId) {
    userId = "defaultUser";
  }

  // userId 기준으로 저장
  userPreferencesDB[userId] = { categories, ratings, customFoods };
  console.log("저장된 온보딩 취향:", userPreferencesDB[userId]);

  return res.status(200).json({ message: "취향 저장 완료", data: userPreferencesDB[userId] });
});

// 저장된 사용자 취향 불러오기 (userId는 쿼리로 받음)
router.get("/preferences", (req, res) => {
  let { userId } = req.query;
  if (!userId) {
    userId = "defaultUser";
  }
  const prefs = userPreferencesDB[userId];
  if (!prefs) {
    return res.status(404).json({ error: "사용자 취향을 찾을 수 없습니다." });
  }
  return res.status(200).json({ data: prefs });
});

// 사용자 취향 저장 (추가)
router.post("/preferences", (req, res) => {
  let { userId, food, rating } = req.body;
  if (!food || typeof rating === "undefined") {
    return res.status(400).json({ error: "food, rating이 필요합니다." });
  }
  if (!userId) {
    userId = "defaultUser";
  }
  if (!userPreferencesDB[userId]) {
    userPreferencesDB[userId] = { preferences: [] };
  }
  if (!userPreferencesDB[userId].preferences) {
    userPreferencesDB[userId].preferences = [];
  }
  userPreferencesDB[userId].preferences.push({ food, rating });
  return res.status(200).json({
    message: "취향이 추가되었습니다.",
    data: userPreferencesDB[userId],
  });
});

// 사용자 취향 수정 (업데이트)
router.put("/preferences", (req, res) => {
  let { userId, food, rating } = req.body;
  if (!food || typeof rating === "undefined") {
    return res.status(400).json({ error: "food, rating이 필요합니다." });
  }
  if (!userId) {
    userId = "defaultUser";
  }
  const userPrefs = userPreferencesDB[userId];
  if (!userPrefs || !userPrefs.preferences) {
    return res.status(404).json({ error: "사용자 취향을 찾을 수 없습니다." });
  }
  const idx = userPrefs.preferences.findIndex((pref) => pref.food === food);
  if (idx === -1) {
    return res.status(404).json({ error: "해당 음식 취향을 찾을 수 없습니다." });
  }
  userPrefs.preferences[idx].rating = rating;
  return res.status(200).json({
    message: "취향이 업데이트되었습니다.",
    data: userPrefs,
  });
});

// 사용자 취향 삭제
router.delete("/preferences", (req, res) => {
  let { userId, food } = req.body;
  if (!food) {
    return res.status(400).json({ error: "food가 필요합니다." });
  }
  if (!userId) {
    userId = "defaultUser";
  }
  const userPrefs = userPreferencesDB[userId];
  if (!userPrefs || !userPrefs.preferences) {
    return res.status(404).json({ error: "사용자 취향을 찾을 수 없습니다." });
  }
  const originalLen = userPrefs.preferences.length;
  userPrefs.preferences = userPrefs.preferences.filter((pref) => pref.food !== food);
  if (userPrefs.preferences.length === originalLen) {
    return res.status(404).json({ error: "해당 음식 취향을 찾을 수 없습니다." });
  }
  return res.status(200).json({
    message: "취향이 삭제되었습니다.",
    data: userPrefs,
  });
});

export default router;