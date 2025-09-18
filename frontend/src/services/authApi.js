import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api';

// 토큰을 localStorage에서 가져오는 함수
export const getToken = () => {
  return localStorage.getItem('token');
};

// 토큰을 localStorage에 저장하는 함수
export const setToken = (token) => {
  localStorage.setItem('token', token);
};

// 토큰을 localStorage에서 제거하는 함수
export const removeToken = () => {
  localStorage.removeItem('token');
};

// axios 인스턴스 생성 (토큰 자동 포함)
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 - 토큰 자동 추가
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 401 에러 시 토큰 제거 및 로그인 페이지로 리다이렉트
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 회원가입
export const signup = async (userData) => {
  try {
    console.log("회원가입 요청 데이터:", userData);
    const response = await axios.post(`${API_BASE_URL}/user/signup`, userData);
    if (response.data.token) {
      setToken(response.data.token);
    }
    return response.data;
  } catch (error) {
    console.error("회원가입 에러:", error.response?.data);
    throw error;
  }
};

// 로그인
export const login = async (credentials) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/user/login`, credentials);
    if (response.data.token) {
      setToken(response.data.token);
    }
    return response.data;
  } catch (error) {
    throw error;
  }
};

// 로그아웃
export const logout = () => {
  removeToken();
  window.location.href = '/login';
};

// 토큰 검증
export const verifyToken = async () => {
  try {
    const response = await apiClient.get('/user/verify');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// 사용자 프로필 조회
export const getUserProfile = async () => {
  try {
    const response = await apiClient.get('/user/profile');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default apiClient;
