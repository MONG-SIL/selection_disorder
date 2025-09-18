import { Link, useLocation } from "react-router-dom";
import styled from "styled-components";
import { useEffect, useState } from "react";
import { logout, getToken } from "../services/authApi";

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

export default function Navigation() {
  const [hasPreferences, setHasPreferences] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();

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
    
    // 우선 localStorage 플래그 확인
    const flag = typeof window !== 'undefined' && window.localStorage?.getItem('hasPreferences') === 'true';
    if (flag) {
      setHasPreferences(true);
    } else {
      checkPreferences();
    }

    // 커스텀 이벤트 수신하여 즉시 반영
    const onUpdated = () => setHasPreferences(true);
    window.addEventListener('preferences-updated', onUpdated);

    // 다른 탭에서의 변경 반영
    const onStorage = (ev) => {
      if (ev.key === 'hasPreferences') {
        setHasPreferences(ev.newValue === 'true');
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('preferences-updated', onUpdated);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // 라우트 변경 시에도 한 번 더 동기화
  useEffect(() => {
    const flag = typeof window !== 'undefined' && window.localStorage?.getItem('hasPreferences') === 'true';
    setHasPreferences(flag);
  }, [location]);

  const handleLogout = () => {
    logout();
  };

  return (
    <NavBar>
      <NavLink to="/">Home</NavLink>
      <NavLink to="/weather">Weather</NavLink>
      <NavLink to="/map">Map</NavLink>
      <NavLink to="/food">Food Menu</NavLink>
      <NavLink to="/onboarding">Preferences</NavLink>
      {hasPreferences && <NavLink to="/preferences">My</NavLink>}
      <NavLink to="/chat">Chat</NavLink>
      <LogoutButton onClick={handleLogout}>로그아웃</LogoutButton>
    </NavBar>
  );
}