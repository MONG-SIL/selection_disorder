import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { login } from "../services/authApi";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const FormContainer = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
`;

const Title = styled.h2`
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
  font-size: 1.8rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 1rem;
  transition: border-color 0.3s;

  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const Button = styled.button`
  padding: 0.75rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background: #5a6fd8;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const LinkButton = styled.button`
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  text-decoration: underline;
  font-size: 0.9rem;
  margin-top: 1rem;

  &:hover {
    color: #5a6fd8;
  }
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  text-align: center;
  margin-top: 1rem;
  font-size: 0.9rem;
`;

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const InputLabel = styled.div`
  font-size: 0.9rem;
  color: #374151;
  font-weight: 500;
`;

const InputExample = styled.div`
  font-size: 0.8rem;
  color: #6b7280;
  font-style: italic;
`;

const ValidationError = styled.div`
  color: #e74c3c;
  font-size: 0.8rem;
  margin-top: 0.25rem;
`;

const StyledInput = styled(Input)`
  border-color: ${props => props.hasError ? '#e74c3c' : '#ddd'};
  
  &:focus {
    border-color: ${props => props.hasError ? '#e74c3c' : '#667eea'};
  }
`;

export default function Login() {
  const [credentials, setCredentials] = useState({
    username: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const navigate = useNavigate();

  // 입력 형식 검증 함수들
  const validateUsername = (username) => {
    if (!username) return "사용자명을 입력해주세요.";
    return null;
  };

  const validatePassword = (password) => {
    if (!password) return "비밀번호를 입력해주세요.";
    return null;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({
      ...credentials,
      [name]: value
    });
    
    // 실시간 검증
    const errors = { ...validationErrors };
    let error = null;
    
    switch (name) {
      case 'username':
        error = validateUsername(value);
        break;
      case 'password':
        error = validatePassword(value);
        break;
    }
    
    if (error) {
      errors[name] = error;
    } else {
      delete errors[name];
    }
    
    setValidationErrors(errors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setValidationErrors({});

    // 폼 검증
    const errors = {};
    const usernameError = validateUsername(credentials.username);
    const passwordError = validatePassword(credentials.password);

    if (usernameError) errors.username = usernameError;
    if (passwordError) errors.password = passwordError;

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setLoading(true);

    try {
      // 데이터 trim 처리
      const trimmedCredentials = {
        username: credentials.username.trim(),
        password: credentials.password.trim()
      };
      console.log("로그인 전송할 데이터:", trimmedCredentials);
      await login(trimmedCredentials);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const goToSignup = () => {
    navigate("/signup");
  };

  return (
    <Container>
      <FormContainer>
        <Title>🍴 로그인</Title>
        <Form onSubmit={handleSubmit}>
          <InputContainer>
            <InputLabel>사용자명</InputLabel>
            <InputExample>예시: mongsil0601</InputExample>
            <StyledInput
              type="text"
              name="username"
              placeholder="사용자명을 입력하세요"
              value={credentials.username}
              onChange={handleChange}
              hasError={!!validationErrors.username}
              required
            />
            {validationErrors.username && (
              <ValidationError>{validationErrors.username}</ValidationError>
            )}
          </InputContainer>

          <InputContainer>
            <InputLabel>비밀번호</InputLabel>
            <InputExample>비밀번호를 입력하세요</InputExample>
            <StyledInput
              type="password"
              name="password"
              placeholder="비밀번호를 입력하세요"
              value={credentials.password}
              onChange={handleChange}
              hasError={!!validationErrors.password}
              required
            />
            {validationErrors.password && (
              <ValidationError>{validationErrors.password}</ValidationError>
            )}
          </InputContainer>

          <Button type="submit" disabled={loading || Object.keys(validationErrors).length > 0}>
            {loading ? "로그인 중..." : "로그인"}
          </Button>
        </Form>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <LinkButton onClick={goToSignup}>
          계정이 없으신가요? 회원가입
        </LinkButton>
      </FormContainer>
    </Container>
  );
}
