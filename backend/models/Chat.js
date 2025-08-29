import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  userId: { type: String, default: "default" }, // 유저 구분용
  messages: [
    {
      role: { type: String, enum: ["user", "assistant"], required: true },
      content: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    },
  ],
});

const Chat = mongoose.model("Chat", chatSchema);

export default Chat;