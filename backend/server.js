import express from "express";
import cors from "cors";
import weatherRoutes from "./routes/weather.js";
import preferencesRoutes from "./routes/preferences.js";
import userRoutes from "./routes/user.js";
import chatRoutes from "./routes/chat.js";
import foodRoutes from "./routes/food.js";
import gptRoutes from "./routes/gpt.js";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
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



const PORT = 4000;
app.listen(PORT, () => console.log(`✅ Backend running on http://localhost:${PORT}`));