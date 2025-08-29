import express from "express";
import { sendMessageToGPT } from "../controllers/chatController.js";
import Chat from "../models/Chat.js"; // MongoDB 모델

const router = express.Router();

// POST /api/chat : GPT 호출 + DB 저장 (컨트롤러 사용)
router.post("/", sendMessageToGPT);

// GET /api/chat/:userId : 유저별 대화 불러오기 (기존 코드 유지)
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const chatDoc = await Chat.findOne({ userId });
    res.json({ messages: chatDoc ? chatDoc.messages : [] });
  } catch (err) {
    console.error("채팅 불러오기 실패:", err);
    res.status(500).json({ error: "채팅 불러오기 실패" });
  }
});

export default router;