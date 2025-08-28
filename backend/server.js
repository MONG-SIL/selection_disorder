import express from "express";
import cors from "cors";
import weatherRoutes from "./routes/weather.js";
import preferencesRoutes from "./routes/preferences.js";
import userRoutes from "./routes/user.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/weather", weatherRoutes);
app.use("/api/user/preferences", preferencesRoutes);
app.use("/api/user", userRoutes);


// 👉 AI 대화 API (데모)
app.post("/api/chat", (req, res) => {
  const { message } = req.body;
  res.json({ reply: `AI: "${message}" 라고 하셨군요!` });
});

const PORT = 4000;
app.listen(PORT, () => console.log(`✅ Backend running on http://localhost:${PORT}`));