import express from "express";
const router = express.Router();

// 임시 DB (실제 서비스에서는 DB 연동 필요)
let userDB = {};

// 회원가입 데이터 저장 (예시)
router.post("/signup", (req, res) => {
  const { userId, username, password, email } = req.body;
  if (!userId || !username || !password || !email) {
    return res.status(400).json({ error: "모든 필드가 필요합니다." });
  }
  userDB[userId] = { username, password, email };
  return res.status(200).json({ message: "회원가입 완료", data: userDB[userId] });
});

// ...기존 취향 관련 라우트 삭제...

export default router;