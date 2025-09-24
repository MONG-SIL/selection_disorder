import express from "express";
import cors from "cors";
import weatherRoutes from "./routes/weather.js";
import preferencesRoutes from "./routes/preferences.js";
import userRoutes from "./routes/user.js";
import chatRoutes from "./routes/chat.js";
import foodRoutes from "./routes/food.js";
import gptRoutes from "./routes/gpt.js";
import popularFoodsRoutes from "./routes/popularFoods.js";
import foodImagesRoutes from "./routes/foodImages.js";
import foodRecipesRoutes from "./routes/foodRecipes.js";
import weatherRecommendRoutes from "./routes/weatherRecommend.js";
import moodRecommendRoutes from "./routes/moodRecommend.js";
import integratedRecommendRoutes from "./routes/integratedRecommend.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import { google } from "googleapis";

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB connected"))
.catch(err => console.error("MongoDB 연결 실패:", err));


const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/weather", weatherRoutes);
app.use("/api/user/preferences", preferencesRoutes);
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/food", foodRoutes);
app.use("/api/gpt", gptRoutes);
app.use("/api", popularFoodsRoutes);
app.use("/api/food-images", foodImagesRoutes);
app.use("/api/food-recipes", foodRecipesRoutes);
app.use("/api/weather-recommend", weatherRecommendRoutes);
app.use("/api/mood-recommend", moodRecommendRoutes);
app.use("/api/integrated-recommend", integratedRecommendRoutes);


// 인기 음식 라우트는 별도 파일에서 제공됨


const PORT = 4000;
app.listen(PORT, () => console.log(`✅ Backend running on http://localhost:${PORT}`));