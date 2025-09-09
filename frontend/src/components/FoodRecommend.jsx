import React, { useEffect, useState } from "react";
import axios from "axios";

const FoodRecommend = () => {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPopularFoods() {
      try {
        const res = await axios.get("/api/popular-foods");
        setFoods(res.data || []);
      } catch (err) {
        console.error("인기 음식 가져오기 실패:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPopularFoods();
  }, []);

  if (loading) return <p>불러오는 중...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>🍜 요즘 인기 있는 음식 추천</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {foods.map((food, idx) => (
          <li
            key={idx}
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "15px",
              borderBottom: "1px solid #ddd",
              paddingBottom: "10px",
            }}
          >
            <img
              src={food.thumbnail}
              alt={food.title}
              width={120}
              style={{ borderRadius: "8px", marginRight: "15px" }}
            />
            <p style={{ fontSize: "16px", fontWeight: "500" }}>{food.title}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};


export default FoodRecommend;