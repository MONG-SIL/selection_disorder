import { useState, useEffect } from "react";
import axios from "axios";

export default function Preferences() {
  const [preferences, setPreferences] = useState([]);
  const [newFood, setNewFood] = useState("");
  const [newRating, setNewRating] = useState(3);

  // 기존에 저장된 취향 불러오기
const fetchPreferences = async () => {
  try {
    const res = await axios.get("http://localhost:4000/api/user/preferences", {
      params: { userId: "user123" }
    });
    console.log("백엔드 응답:", res.data); // 디버깅용 로그
    setPreferences(res.data);
  } catch (err) {
    console.error("취향 불러오기 실패:", err);
  }
};

  useEffect(() => {// 페이지가 처음 렌더링될 때 사용자 취향 불러옴
    fetchPreferences();
  }, []);

  // 음식 평점 변경 시 상태 업데이트
  const handleRatingChange = (index, rating) => {
    const updated = [...preferences];
    updated[index].rating = rating;
    setPreferences(updated);
  };

  // 취향 저장 (기존 음식 → PUT)
  const handleSave = async (food, rating) => {
    try {
      await axios.put("http://localhost:4000/api/user/preferences", { food, rating });
      alert(`${food} 저장됨`);
    } catch (err) {
      console.error("취향 저장 실패:", err);
    }
  };

  // 취향 삭제
  const handleDelete = async (food) => {
    try {
      await axios.delete("http://localhost:4000/api/user/preferences", { data: { food } });
      setPreferences(preferences.filter((p) => p.food !== food));
    } catch (err) {
      console.error("취향 삭제 실패:", err);
    }
  };

  // 새로운 음식 취향 추가 (POST)
  const handleAddNewPreference = async () => {
    try {
      await axios.post("http://localhost:4000/api/user/preferences", { food: newFood, rating: newRating });
      setPreferences([...preferences, { food: newFood, rating: newRating }]);
      setNewFood("");
      setNewRating(3);
    } catch (err) {
      console.error("새 취향 추가 실패:", err);
    }
  };

  return (
    <div>
      <h2>Preferences Page</h2>
      <p>여기에 사용자 취향 설정 UI가 들어갑니다.</p>

      <div>
  <h3>기존 취향</h3>
  {preferences.ratings &&
    Object.entries(preferences.ratings).map(([foodId, obj], index) => (
      <div key={`${foodId}-${index}`}>
        <span>음식명: {obj.name}</span>
        <select
          value={obj.rating}
          onChange={(e) => {
            // 평점 변경
            const newRating = parseInt(e.target.value);
            setPreferences({
              ...preferences,
              ratings: {
                ...preferences.ratings,
                [foodId]: { ...obj, rating: newRating },
              },
            });
          }}
        >
          {[1, 2, 3, 4, 5].map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        {/* 저장/삭제 버튼은 필요에 따라 구현 */}
      </div>
    ))}
</div>

      <div style={{ marginTop: "1rem" }}>
        <h3>새 음식 추가</h3>
        <input
          type="text"
          placeholder="음식 이름"
          value={newFood}
          onChange={(e) => setNewFood(e.target.value)}
        />
        <select
          value={newRating}
          onChange={(e) => setNewRating(parseInt(e.target.value))}
        >
          {[1, 2, 3, 4, 5].map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <button onClick={handleAddNewPreference}>추가</button>
      </div>
    </div>
  );
}

// 사용자 취향을 저장하는 페이지
// 취향은 음식별 리스트가 있고, 각 음식마다 1~5점으로 평가
// 저장된 취향은 /api/user/preferences 로 POST 전송
// 예: { food: "김치찌개", rating: 5 }

// 최초 저장되는 사용자 취향은 사용자 회원가입과 동시에 백엔드에 저장됨

// 취향 설정 페이지에서는 기존에 저장된 취향을 불러와서 표시
// 취향 불러오기: GET /api/user/preferences
// 취향 저장: POST /api/user/preferences { food: "김치찌개", rating: 5 }
// 취향 수정: PUT /api/user/preferences { food: "김치찌개", rating: 4 }
// 취향 삭제: DELETE /api/user/preferences { food: "김치찌개" } 