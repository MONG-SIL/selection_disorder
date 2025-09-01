import { useState, useEffect } from "react";
import axios from "axios";

export default function Preferences() {
  const [preferences, setPreferences] = useState({ ratings: {}, categories: [], customFoods: [] });
  const [newFood, setNewFood] = useState("");
  const [newRating, setNewRating] = useState(3);

  const userId = "user123"; // userId 고정

  // 기존에 저장된 취향 불러오기
  const fetchPreferences = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/user/preferences", {
        params: { userId },
      });
      console.log("백엔드 응답:", res.data);
      setPreferences(res.data);
    } catch (err) {
      console.error("취향 불러오기 실패:", err);
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, []);

  // 음식 평점 변경 시 상태 업데이트
  const handleRatingChange = (foodId, rating) => {
    setPreferences({
      ...preferences,
      ratings: {
        ...preferences.ratings,
        [foodId]: { ...preferences.ratings[foodId], rating },
      },
    });
  };

  // 취향 저장 (PUT)
const handleSave = async (foodId) => {
  try {
    const rating = preferences.ratings[foodId].rating;
    const requestData = {
      userId,
      foodId,
      rating,
    };
    console.log("PUT 요청 데이터:", requestData); // 요청 데이터 콘솔 출력
    await axios.put("http://localhost:4000/api/user/preferences", requestData);
    fetchPreferences();
  } catch (err) {
    console.error("취향 저장 실패:", err);
  }
};

  // 취향 삭제 (DELETE)
  const handleDelete = async (foodId) => {
    try {
      await axios.delete("http://localhost:4000/api/user/preferences", {
        data: { userId, foodId },
      });
      fetchPreferences();
    } catch (err) {
      console.error("취향 삭제 실패:", err);
    }
  };

  // 새로운 음식 취향 추가 (POST)
  const handleAddNewPreference = async () => {
    const foodName = newFood.trim();
    if (!foodName) return;

    try {
      const newRatingObj = { name: foodName, rating: newRating };
      const updatedRatings = { ...preferences.ratings, [foodName + "_custom"]: newRatingObj };
      const updatedCustomFoods = [...preferences.customFoods, foodName];

      await axios.post("http://localhost:4000/api/user/preferences", {
        userId,
        categories: preferences.categories,
        ratings: updatedRatings,
        customFoods: updatedCustomFoods,
      });
      setNewFood("");
      setNewRating(3);
      fetchPreferences();
    } catch (err) {
      console.error("새 취향 추가 실패:", err);
    }
  };

  return (
    <div>
      <h2>Preferences Page</h2>

      {/* 기존 취향 */}
      <div>
        <h3>기존 취향</h3>
        {preferences.ratings && Object.entries(preferences.ratings).map(([foodId, obj]) => (
          <div key={foodId}>
            <span>음식명: {obj.name}</span>
            <select
              value={obj.rating}
              onChange={(e) => handleRatingChange(foodId, parseInt(e.target.value))}
            >
              {[1, 2, 3, 4, 5].map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <button onClick={() => handleSave(foodId)}>저장</button>
            <button onClick={() => handleDelete(foodId)}>삭제</button>
          </div>
        ))}
      </div>

      {/* 카테고리 취향 */}
      <div style={{ marginTop: "1rem" }}>
        <h3>카테고리 취향</h3>
        {Array.isArray(preferences.categories) &&
          preferences.categories.map((cat, index) => (
            <div key={index} style={{ marginBottom: "0.5rem" }}>
              <span>카테고리: {cat}</span>
            </div>
          ))}
      </div>

      {/* 새 음식 추가 */}
      <div style={{ marginTop: "1rem" }}>
        <h3>새 음식 추가</h3>
        <input
          type="text"
          placeholder="음식 이름"
          value={newFood}
          onChange={(e) => setNewFood(e.target.value)}
        />
        <select value={newRating} onChange={(e) => setNewRating(parseInt(e.target.value))}>
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