import express from "express";
const router = express.Router();

let preferencesDB = {}; // userId별로 저장

// GET /api/user/preferences?userId=xxx
router.get("/", (req, res) => {
  console.log("[preferences][GET] query:", req.query);
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ success: false, message: "userId is required" });
  }
  if (!preferencesDB[userId]) {
    return res.status(200).json({ 
      success: true, 
      message: "No preferences found",
      data: null 
    });
  }
  res.json({ 
    success: true, 
    data: preferencesDB[userId] 
  });
});

// POST /api/user/preferences (전체 취향 저장/덮어쓰기)
router.post("/", (req, res) => {
  console.log("[preferences][POST] body:", req.body);
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ success: false, message: "userId is required" });
  }
  const current = preferencesDB[userId] || {};
  const categories = req.body.categories !== undefined ? req.body.categories : current.categories || [];
  const ratings = req.body.ratings !== undefined ? req.body.ratings : current.ratings || {};
  const customFoods = req.body.customFoods !== undefined ? req.body.customFoods : current.customFoods || [];
  const tags = req.body.tags !== undefined ? req.body.tags : current.tags || [];

  preferencesDB[userId] = { categories, ratings, customFoods, tags };
  console.log("[preferences][POST] saved for", userId, preferencesDB[userId]);
  res.json({ success: true, preferences: preferencesDB[userId] });
});

// PUT /api/user/preferences (음식 평점만 수정)
router.put("/", (req, res) => {
  console.log("[preferences][PUT] body:", req.body);
  const { userId, foodId, rating } = req.body;
  if (!userId || !foodId || rating === undefined || rating === null) {
    return res.status(400).json({ success: false, message: "userId, foodId, rating required" });
  }
  if (!preferencesDB[userId]) {
    return res.status(404).json({ success: false, message: "User preferences not found" });
  }

  if (
    preferencesDB[userId].ratings[foodId] &&
    typeof preferencesDB[userId].ratings[foodId] === "object"
  ) {
    preferencesDB[userId].ratings[foodId].rating = rating;
    res.json({ success: true, preferences: preferencesDB[userId] });
  } else {
    return res.status(404).json({ success: false, message: "Food not found in preferences" });
  }
});

// DELETE /api/user/preferences (음식 취향 삭제)
router.delete("/", (req, res) => {
  const { userId, foodId } = req.body;
  if (!userId || !foodId) {
    return res.status(400).json({ success: false, message: "userId, foodId required" });
  }
  if (!preferencesDB[userId]) {
    return res.status(404).json({ success: false, message: "User preferences not found" });
  }
  if (preferencesDB[userId].ratings[foodId]) {
    delete preferencesDB[userId].ratings[foodId];
    res.json({ success: true, preferences: preferencesDB[userId] });
  } else {
    return res.status(404).json({ success: false, message: "Food not found in preferences" });
  }
});

// GET /api/user/preferences/average-rating/:foodId
// 모든 사용자 취향에서 해당 foodId의 평균 평점 계산
router.get("/average-rating/:foodId", (req, res) => {
  const { foodId } = req.params;
  if (!foodId) return res.status(400).json({ success: false, message: "foodId is required" });
  let sum = 0;
  let count = 0;
  Object.values(preferencesDB).forEach(pref => {
    const r = pref?.ratings?.[foodId];
    if (r && typeof r.rating === 'number') {
      sum += Number(r.rating);
      count += 1;
    }
  });
  if (count === 0) return res.json({ success: true, foodId, average: null, count: 0 });
  const avg = Math.round((sum / count) * 10) / 10;
  res.json({ success: true, foodId, average: avg, count });
});

// GET /api/user/preferences/average-ratings?ids=a,b,c
// 여러 foodId에 대한 평균 평점을 일괄 계산
router.get("/average-ratings", (req, res) => {
  const idsParam = String(req.query.ids || '').trim();
  if (!idsParam) return res.status(400).json({ success: false, message: "ids is required" });
  const ids = idsParam.split(',').map(s => s.trim()).filter(Boolean);
  const result = {};
  ids.forEach(foodId => {
    let sum = 0;
    let count = 0;
    Object.values(preferencesDB).forEach(pref => {
      const r = pref?.ratings?.[foodId];
      if (r && typeof r.rating === 'number') {
        sum += Number(r.rating);
        count += 1;
      }
    });
    if (count === 0) {
      result[foodId] = null;
    } else {
      result[foodId] = Math.round((sum / count) * 10) / 10;
    }
  });
  res.json({ success: true, averages: result });
});

export default router;