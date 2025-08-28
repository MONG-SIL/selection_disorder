import { useState } from "react";
import axios from "axios";
import OnboardingPreferences from "./OnboardingPreferences";

export default function Signup() {
  const [step, setStep] = useState(1);
  const [userInfo, setUserInfo] = useState({ username: "", email: "", password: "" });

  const handleSignup = async () => {
    try {
      // 회원가입 API 호출
      const res = await axios.post("http://localhost:4000/api/signup", userInfo);
      console.log("회원가입 성공:", res.data);

      setStep(2); // 온보딩으로 이동
    } catch (err) {
      console.error("회원가입 실패:", err);
      alert("회원가입에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const handleOnboardingComplete = async (preferencesData) => {
    try {
      // 온보딩 취향 입력 API 호출
      const res = await axios.post("http://localhost:4000/api/user/preferences/onboarding", {
        userId: userInfo.username, // 혹은 서버에서 받은 id
        preferences: preferencesData,
      });
      console.log("온보딩 취향 저장 성공:", res.data);

      alert("회원가입과 취향 입력이 완료되었습니다!");
      // 로그인 페이지로 이동하거나 메인페이지로 이동
    } catch (err) {
      console.error("취향 저장 실패:", err);
      alert("취향 저장에 실패했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <div>
      {step === 1 && (
        <div>
          <h2>회원가입</h2>
          <input
            type="text"
            placeholder="아이디"
            value={userInfo.username}
            onChange={e => setUserInfo({ ...userInfo, username: e.target.value })}
          />
          <input
            type="email"
            placeholder="이메일"
            value={userInfo.email}
            onChange={e => setUserInfo({ ...userInfo, email: e.target.value })}
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={userInfo.password}
            onChange={e => setUserInfo({ ...userInfo, password: e.target.value })}
          />
          <button onClick={handleSignup}>회원가입</button>
        </div>
      )}

      {step === 2 && (
        <OnboardingPreferences onComplete={handleOnboardingComplete} />
      )}
    </div>
  );
}