import { Link } from "react-router-dom";
import styled from "styled-components";

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

export default function Navigation() {
  return (
    <NavBar>
      <NavLink to="/">Home</NavLink>
      <NavLink to="/weather">Weather</NavLink>
      <NavLink to="/map">Map</NavLink>
      <NavLink to="/preferences">Preferences</NavLink>
      <NavLink to="/chat">Chat</NavLink>
    </NavBar>
  );
}