import { Link, useLocation } from "react-router-dom";
import styled from "styled-components";
import { useEffect, useState } from "react";
import { logout, getToken, getUserProfile } from "../services/authApi";

const NavBar = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background-color: #f3f4f6;
  padding: 1rem;
  display: flex;
  gap: 1rem;
  justify-content: center;
  z-index: 1000;
`;

const NavLink = styled(Link)`
  color: #2563eb;
  text-decoration: none;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
`;

const LogoutButton = styled.button`
  background: none;
  border: none;
  color: #dc2626;
  text-decoration: none;
  font-weight: 500;
  cursor: pointer;
  font-size: inherit;

  &:hover {
    text-decoration: underline;
  }
`;

const UserGreeting = styled.div`
  color: #374151;
  font-weight: 500;
  font-size: 0.9rem;
  margin-right: auto;
  margin-left: 1rem;
`;

export default function Navigation() {
  const [hasPreferences, setHasPreferences] = useState(false);
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const location = useLocation();

  // 토큰에서 사용자 ID를 가져오는 함수
  const getUserId = () => {
    const token = getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId;
    } catch (error) {
      console.error('토큰 파싱 오류:', error);
      return null;
    }
  };

  useEffect(() => {
    const checkPreferences = async () => {
      try {
        const token = getToken();
        if (!token) return;
        
        const res = await fetch("http://localhost:4000/api/user/preferences", {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          setHasPreferences(!!data.data);
        } else {
          setHasPreferences(false);
        }
      } catch (e) {
        setHasPreferences(false);
        console.error("취향 확인 실패:", e);
      }
    };

    const fetchUserProfile = async () => {
      try {
        const userProfile = await getUserProfile();
        setUsername(userProfile.user.username);
      } catch (e) {
        console.error("사용자 정보 가져오기 실패:", e);
        // 토큰에서 직접 username 가져오기 (fallback)
        const userId = getUserId();
        if (userId) {
          setUsername(userId);
        }
      }
    };
    
    // 사용자 정보 가져오기
    fetchUserProfile();
    
    // 우선 localStorage 플래그 확인 (유저별 구분)
    const userId = getUserId();
    const flag = typeof window !== 'undefined' && userId && window.localStorage?.getItem(`hasPreferences_${userId}`) === 'true';
    if (flag) {
      setHasPreferences(true);
    } else {
      checkPreferences();
    }

    // 커스텀 이벤트 수신하여 즉시 반영
    const onUpdated = () => setHasPreferences(true);
    window.addEventListener('preferences-updated', onUpdated);

    // 다른 탭에서의 변경 반영 (유저별 구분)
    const onStorage = (ev) => {
      if (ev.key === `hasPreferences_${userId}`) {
        setHasPreferences(ev.newValue === 'true');
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('preferences-updated', onUpdated);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // 라우트 변경 시에도 한 번 더 동기화 (유저별 구분)
  useEffect(() => {
    const userId = getUserId();
    const flag = typeof window !== 'undefined' && userId && window.localStorage?.getItem(`hasPreferences_${userId}`) === 'true';
    setHasPreferences(flag);
  }, [location]);

  const handleLogout = () => {
    logout();
  };
  //<NavLink to="/map">Map</NavLink>
  //<NavLink to="/chat">Chat</NavLink>

  return (
    <NavBar>
      <NavLink to="/">Home</NavLink>
      <NavLink to="/weather">Weather</NavLink>
      <NavLink to="/food">Food Menu</NavLink>
      <NavLink to="/recommend">Recommend</NavLink>
      {hasPreferences ? (
        <NavLink to="/preferences">My</NavLink>
      ) : (
        <NavLink to="/onboarding">Preferences</NavLink>
      )}
      <NavLink to="/onboarding">Add Preferences</NavLink>
      {username && <UserGreeting>{username}님 안녕하세요!</UserGreeting>}
      <LogoutButton onClick={handleLogout}>로그아웃</LogoutButton>
    </NavBar>
  );
}