import express from "express";
import cors from "cors";
import weatherRoutes from "./routes/weather.js";


const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/weather", weatherRoutes);

// ✅ 간단한 DB 대용 (실제는 MongoDB, MySQL 사용 권장)
let userPrefs = { likedFoods: [], orders: [] };

// 👉 사용자 취향/주문 내역 저장
app.post("/api/user/preferences", (req, res) => {
  const { food } = req.body;
  userPrefs.likedFoods.push(food);
  res.json({ message: "취향 저장 완료", userPrefs });
});

app.post("/api/user/order", (req, res) => {
  const { food } = req.body;
  userPrefs.orders.push({ food, date: new Date() });
  res.json({ message: "주문 내역 저장 완료", userPrefs });
});

// 👉 날씨 API (데모)
app.get("/api/weather", (req, res) => {
  // 실제는 OpenWeather API 연동
  res.json({ temp: 27, description: "맑음" });
});

// 👉 AI 대화 API (데모)
app.post("/api/chat", (req, res) => {
  const { message } = req.body;
  res.json({ reply: `AI: "${message}" 라고 하셨군요!` });
});

const PORT = 4000;
app.listen(PORT, () => console.log(`✅ Backend running on http://localhost:${PORT}`));