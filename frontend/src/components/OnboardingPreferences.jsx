import { useState } from "react";
import styled from "styled-components";
import axios from "axios"; 

const Container = styled.div``;

const StepTitle = styled.h2`
  margin-bottom: 1rem;
`;

const CategoryLabel = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  cursor: pointer;
`;

const FoodItem = styled.div`
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const FoodImage = styled.img`
  width: 80px;
  height: auto;
`;

const FoodName = styled.span`
  flex: 1;
`;

const FoodSelect = styled.select`
  padding: 0.25rem;
`;

const TextInput = styled.input`
  width: 100%;
  padding: 0.5rem;
  box-sizing: border-box;
  margin-bottom: 1rem;
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  cursor: pointer;
`;

export default function OnboardingPreferences({ onComplete }) {
  // step: 현재 진행 중인 온보딩 단계 (1, 2, 3)
  const [step, setStep] = useState(1);
  // categories: 사용자가 선택한 음식 카테고리 목록
  const [categories, setCategories] = useState([]);
  // ratings: 음식별로 사용자가 평가한 선호도 { foodId: rating }
  const [ratings, setRatings] = useState({});
  // customFoods: 사용자가 직접 입력한 좋아하는 음식 문자열 (쉼표 구분)
  const [customFoods, setCustomFoods] = useState("");

  // Step1: 선택 가능한 음식 카테고리 목록
  const foodCategories = ["한식", "중식", "일식", "양식", "디저트", "기타"];

  // Step2: 대표 음식 샘플 데이터 (실제로는 DB나 JSON에서 불러옴)
  const sampleFoods = [
    { id: 1, name: "김치찌개", img: "/images/kimchi.png" },
    { id: 2, name: "짜장면", img: "/images/jjajang.png" },
    { id: 3, name: "초밥", img: "/images/sushi.png" },
    { id: 4, name: "피자", img: "/images/pizza.png" },
    { id: 5, name: "케이크", img: "/images/cake.png" },
  ];

  // 음식별 선호도 평가를 저장하는 함수
// foodId: 평가할 음식의 ID, rating: 1~5 점수, foodName: 음식 이름
const handleRating = (foodId, rating) => {
  const food = sampleFoods.find(f => f.id === foodId);
  setRatings({
    ...ratings,
    [foodId]: { name: food.name, rating }
  });
};

  // 완료 버튼 클릭 시 호출되는 함수
  // 현재 선택된 카테고리, 평가, 직접 입력한 음식을 정리하여 onComplete 콜백 호출
const handleFinish = async () => {
  // customFoods를 쉼표로 분리
  const customFoodsArr = customFoods
    .split(",")
    .map(f => f.trim())
    .filter(f => f);

  // ratings에 customFoods도 추가 (중복 방지)
  const updatedRatings = { ...ratings };
  customFoodsArr.forEach(foodName => {
    // ratings에 이미 같은 name이 있는지 확인
    const exists = Object.values(updatedRatings).some(r => r.name === foodName);
    if (!exists) {
      // 고유 key 생성 (음식명 + "custom" 등)
      const key = `${foodName}_custom`;
      updatedRatings[key] = { name: foodName, rating: 5 };
    }
  });

  const data = {
    userId: "user123", // 실제 로그인/회원가입 시 할당된 ID 사용
    categories,
    ratings: updatedRatings,
    customFoods: customFoodsArr,
  };
  console.log("최종 취향 데이터:", data);
  try {
    const res = await axios.post("http://localhost:4000/api/user/preferences", data);
    console.log("서버 저장 결과:", res.data);
    if (onComplete) onComplete(data);
  } catch (err) {
    console.error("온보딩 취향 저장 실패:", err);
  }
  if (onComplete) onComplete(data);
};

  return (
    <Container>
      {step === 1 && (
        <div>
          <StepTitle>1단계: 선호하는 카테고리를 선택하세요</StepTitle>
          {foodCategories.map(cat => (
            <CategoryLabel key={cat}>
              <input
                type="checkbox"
                value={cat}
                checked={categories.includes(cat)}
                onChange={e => {
                  if (e.target.checked) {
                    setCategories([...categories, cat]);
                  } else {
                    setCategories(categories.filter(c => c !== cat));
                  }
                }}
              />
              {cat}
            </CategoryLabel>
          ))}
          <Button onClick={() => setStep(2)}>다음</Button>
        </div>
      )}

      {step === 2 && (
        <div>
          <StepTitle>2단계: 음식 사진을 보고 선호도를 선택하세요</StepTitle>
          {sampleFoods.map(food => (
            <FoodItem key={food.id}>
              <FoodImage src={food.img} alt={food.name} />
              <FoodName>{food.name}</FoodName>
              <FoodSelect
                value={ratings[food.id] || ""}
                onChange={e => handleRating(food.id, Number(e.target.value))}
              >
                <option value="">선택</option>
                {[1, 2, 3, 4, 5].map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </FoodSelect>
            </FoodItem>
          ))}
          <Button onClick={() => setStep(3)}>다음</Button>
        </div>
      )}

      {step === 3 && (
        <div>
          <StepTitle>3단계: 좋아하는 음식을 직접 입력하세요 (쉼표 구분)</StepTitle>
          <StepTitle>이곳에 입력하는 음식은 선호도 5로 저장되며, 선호도는 추후 선호도 창에서 언제든 수정할 수 있습니다.</StepTitle>
          <TextInput
            type="text"
            placeholder="예: 떡볶이, 삼겹살, 치즈케이크"
            value={customFoods}
            onChange={e => setCustomFoods(e.target.value)}
          />
          <Button onClick={handleFinish}>완료</Button>
        </div>
      )}
    </Container>
  );
}