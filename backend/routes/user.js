import express from "express";
import bcrypt from "bcryptjs";
import { generateToken, authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// 임시 DB (실제 서비스에서는 DB 연동 필요)
let userDB = {};

// 회원가입
router.post("/signup", async (req, res) => {
  try {
    console.log("회원가입 요청 body:", req.body);
    const { username, password, email } = req.body;
    
    // trim 처리
    const trimmedUsername = username?.trim();
    const trimmedPassword = password?.trim();
    const trimmedEmail = email?.trim();
    
    if (!trimmedUsername || !trimmedPassword || !trimmedEmail) {
      console.log("필드 검증 실패:", { 
        username: !!trimmedUsername, 
        password: !!trimmedPassword, 
        email: !!trimmedEmail 
      });
      return res.status(400).json({ error: "모든 필드가 필요합니다." });
    }

    // 중복 사용자 확인
    if (userDB[trimmedUsername]) {
      return res.status(400).json({ error: "이미 존재하는 사용자입니다." });
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(trimmedPassword, 10);

    // 사용자 저장
    userDB[trimmedUsername] = { 
      username: trimmedUsername, 
      password: hashedPassword, 
      email: trimmedEmail,
      createdAt: new Date()
    };

    // JWT 토큰 생성
    const token = generateToken(trimmedUsername);

    res.status(201).json({ 
      message: "회원가입 완료", 
      token,
      user: { username: trimmedUsername, email: trimmedEmail }
    });
  } catch (error) {
    console.error("회원가입 오류:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

// 로그인
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // trim 처리
    const trimmedUsername = username?.trim();
    const trimmedPassword = password?.trim();
    
    if (!trimmedUsername || !trimmedPassword) {
      return res.status(400).json({ error: "사용자명과 비밀번호가 필요합니다." });
    }

    // 사용자 확인
    const user = userDB[trimmedUsername];
    if (!user) {
      return res.status(401).json({ error: "잘못된 사용자명 또는 비밀번호입니다." });
    }

    // 비밀번호 확인
    const isValidPassword = await bcrypt.compare(trimmedPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "잘못된 사용자명 또는 비밀번호입니다." });
    }

    // JWT 토큰 생성
    const token = generateToken(trimmedUsername);

    res.status(200).json({ 
      message: "로그인 성공", 
      token,
      user: { username: trimmedUsername, email: user.email }
    });
  } catch (error) {
    console.error("로그인 오류:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

// 토큰 검증
router.get("/verify", authenticateToken, (req, res) => {
  res.status(200).json({ 
    message: "유효한 토큰입니다.", 
    user: { username: req.user.userId }
  });
});

// 사용자 정보 조회
router.get("/profile", authenticateToken, (req, res) => {
  const user = userDB[req.user.userId];
  if (!user) {
    return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
  }
  
  res.status(200).json({ 
    user: { 
      username: user.username, 
      email: user.email,
      createdAt: user.createdAt
    }
  });
});

export default router;