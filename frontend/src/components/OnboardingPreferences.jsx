import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import axios from "axios";
import { getAllFoods } from "../services/foodApi"; 
import StarRating from "./StarRating";

const Container = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1rem;
`;

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
  padding: 0.75rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #ffffff;
`;

const FoodImage = styled.img`
  width: 80px;
  height: auto;
  border-radius: 6px;
  object-fit: cover;
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
  border: 1px solid #2563eb;
  color: #fff;
  background: #2563eb;
  border-radius: 8px;
  margin-top: 0.5rem;
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
  // availableFoods: 백엔드에서 가져온 실제 음식 데이터
  const [availableFoods, setAvailableFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  // 추천 카테고리/태그
  const [suggestedCategories, setSuggestedCategories] = useState([]);
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [existingRatingsMap, setExistingRatingsMap] = useState({});
  const [hasPreferences, setHasPreferences] = useState(false);
  // 검색/정렬/페이지네이션
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("popular"); // popular | name | category
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [imageCache, setImageCache] = useState({});

  // Step1: 선택 가능한 음식 카테고리 목록
  const foodCategories = ["한식", "중식", "일식", "양식", "디저트", "기타"];

  // 컴포넌트 마운트 시 음식 데이터 + 기존 취향 확인
  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const response = await getAllFoods({ available: true });
        const foods = response.data || [];
        setAvailableFoods(foods);
        // 백엔드 캐시에서 배치 조회
        const ids = foods.map(f => f._id).filter(Boolean);
        if (ids.length) {
          try {
            const r = await axios.get('http://localhost:4000/api/food-images', { params: { ids: ids.join(',') } });
            setImageCache(r.data?.images || {});
          } catch (e) {
            // 무시
          }
        }
        setLoading(false);
      } catch (error) {
        console.error("음식 데이터 가져오기 실패:", error);
        setLoading(false);
      }
    };
    const checkExisting = async () => {
      try {
        const res = await axios.get("http://localhost:4000/api/user/preferences", {
          params: { userId: 'user123' },
          validateStatus: (s) => (s >= 200 && s < 300) || s === 404,
        });
        if (res.status === 404) {
          setHasPreferences(false);
          return;
        }
        if (res?.data?.ratings) {
          setExistingRatingsMap(res.data.ratings || {});
          setHasPreferences(true);
          // 두 번째 접속부터는 2단계로 진입
          setStep(2);
          // 네비게이션 동기화
          window.localStorage.setItem('hasPreferences', 'true');
          window.dispatchEvent(new Event('preferences-updated'));
        }
      } catch (e) {
        console.error('기존 취향 확인 실패:', e);
      }
    };

    fetchFoods();
    checkExisting();
  }, []);

  // 사용자가 입력한 평점(ratings)을 기반으로 자동 추천 카테고리/태그 계산
  useEffect(() => {
    if (!availableFoods.length) return;
    const ratedIds = Object.keys(ratings);
    if (!ratedIds.length) {
      setSuggestedCategories([]);
      setSuggestedTags([]);
      return;
    }

    const categoryCount = {};
    const tagCount = {};

    ratedIds.forEach(id => {
      const food = availableFoods.find(f => f._id === id);
      if (!food) return;
      // 카테고리 가중치: 사용자가 준 점수로 가중
      const weight = Number(ratings[id]?.rating) || 0;
      if (food.category) {
        categoryCount[food.category] = (categoryCount[food.category] || 0) + weight;
      }
      if (Array.isArray(food.tags)) {
        food.tags.forEach(t => {
          tagCount[t] = (tagCount[t] || 0) + weight;
        });
      }
    });

    const topCategories = Object.entries(categoryCount)
      .sort((a,b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);

    const topTags = Object.entries(tagCount)
      .sort((a,b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name]) => name);

    setSuggestedCategories(topCategories);
    setSuggestedTags(topTags);
  }, [ratings, availableFoods]);

  // 음식별 선호도 평가를 저장 (0.5 단위)
  const handleRating = (foodId, rating) => {
    const food = availableFoods.find(f => f._id === foodId);
    if (food) {
      setRatings({
        ...ratings,
        [foodId]: { name: food.name, rating }
      });
    }
  };

  // 두 번째 접속(기존 취향 존재) 시: 2단계에서 별점 저장 후 홈으로 이동
  const saveStep2AndFinish = async () => {
    try {
      const entries = Object.entries(ratings || {}).filter(([_, v]) => Number(v?.rating) > 0);
      if (entries.length === 0) {
        navigate('/');
        return;
      }
      const userId = 'user123';
      // 현재 저장된 전체 취향 불러오기 (없으면 기본값)
      let current = { categories: [], ratings: {}, customFoods: [], tags: [] };
      try {
        const res = await axios.get('http://localhost:4000/api/user/preferences', { params: { userId } });
        current = res.data || current;
      } catch (e) {
        // 404면 신규 생성 케이스로 간주
        if (e.response?.status !== 404) {
          console.error('기존 취향 조회 실패:', e);
        }
      }

      // 새 평점을 병합(없던 음식은 추가, 있던 음식은 덮어쓰기)
      const mergedRatings = { ...(current.ratings || {}) };
      entries.forEach(([foodId, r]) => {
        mergedRatings[foodId] = { name: r.name, rating: r.rating };
      });

      const body = {
        userId,
        categories: current.categories || [],
        ratings: mergedRatings,
        customFoods: current.customFoods || [],
        tags: current.tags || [],
      };
      await axios.post('http://localhost:4000/api/user/preferences', body);
      // 네비바와 다른 탭 동기화
      window.localStorage.setItem('hasPreferences', 'true');
      window.dispatchEvent(new Event('preferences-updated'));
      navigate('/');
    } catch (e) {
      console.error('2단계 저장 실패:', e);
      navigate('/');
    }
  };

  // 완료 버튼 클릭 시 호출되는 함수
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

    const finalCategories = Array.from(new Set([...(categories || []), ...suggestedCategories]));
    const finalTags = Array.from(new Set([...(selectedTags || []), ...suggestedTags]));

    const data = {
      userId: "user123", // 실제 로그인/회원가입 시 할당된 ID 사용
      categories: finalCategories,
      ratings: updatedRatings,
      customFoods: customFoodsArr,
      tags: finalTags,
    };
    
    console.log("최종 취향 데이터:", data);
    
    try {
      const res = await axios.post("http://localhost:4000/api/user/preferences", data);
      console.log("서버 저장 결과:", res.data);
      
      // 취향 데이터를 Food 데이터에 반영하는 API 호출
      await updateFoodRatings(updatedRatings);
      
      // 온보딩 완료 후 홈으로 이동
      navigate('/');
    } catch (err) {
      console.error("온보딩 취향 저장 실패:", err);
    }
  };

  // 사용자 취향을 Food 데이터에 반영하는 함수
  const updateFoodRatings = async (userRatings) => {
    try {
      // 각 음식에 대해 사용자 평점을 업데이트
      for (const [foodId, ratingData] of Object.entries(userRatings)) {
        if (foodId.includes('_custom')) continue; // 커스텀 음식은 제외
        
        const food = availableFoods.find(f => f._id === foodId);
        if (food) {
          // 기존 평점과 새 평점을 평균내어 업데이트
          const newRating = (food.rating + ratingData.rating) / 2;
          
          await axios.put(`http://localhost:4000/api/food/${foodId}`, {
            rating: Math.round(newRating * 10) / 10 // 소수점 첫째자리까지
          });
        }
      }
      console.log("음식 평점 업데이트 완료");
    } catch (error) {
      console.error("음식 평점 업데이트 실패:", error);
    }
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
          <StepTitle>2단계: 음식을 보고 선호도를 선택하세요</StepTitle>
          {loading ? (
            <div>음식 데이터를 불러오는 중...</div>
          ) : (
            <>
              {/* 컨트롤 바: 검색 + 정렬 */}
              <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8, flexWrap:'wrap' }}>
                <input
                  type="text"
                  placeholder="음식 검색"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  style={{ border:'1px solid #cbd5e1', borderRadius:8, padding:'6px 10px' }}
                />
                <select
                  value={sortKey}
                  onChange={(e) => { setSortKey(e.target.value); setPage(1); }}
                  style={{ border:'1px solid #cbd5e1', borderRadius:8, padding:'6px 10px' }}
                >
                  <option value="popular">인기순</option>
                  <option value="name">이름순</option>
                  <option value="category">카테고리순</option>
                </select>
              </div>
              {(() => {
                const filtered = availableFoods
                  .filter(food => !Object.keys(existingRatingsMap).includes(food._id))
                  .filter(food => !search || food.name?.toLowerCase().includes(search.trim().toLowerCase()))
                  .sort((a,b) => {
                    if (sortKey === 'name') return (a.name||'').localeCompare(b.name||'');
                    if (sortKey === 'category') return (a.category||'').localeCompare(b.category||'');
                    // popular: rating 내림차순, 없으면 0
                    const ar = Number(a.rating||0);
                    const br = Number(b.rating||0);
                    return br - ar;
                  });
                const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
                const currentPage = Math.min(Math.max(1, page), totalPages);
                const start = (currentPage - 1) * pageSize;
                const items = filtered.slice(start, start + pageSize);
                return items.map(food => (
                  <FoodItem key={food._id}>
                    <div style={{ width: '80px', height: '60px', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', overflow:'hidden' }}>
                      { (imageCache[food._id] || food.image) ? (
                        <FoodImage src={imageCache[food._id] || food.image} alt={food.name} />
                      ) : (
                        <span style={{ fontSize: '12px', color: '#666' }}>이미지 없음</span>
                      )}
                    </div>
                    <FoodName>{food.name} ({food.category})</FoodName>
                    <StarRating
                      value={ratings[food._id]?.rating || 0}
                      onChange={(v) => handleRating(food._id, v)}
                      size={22}
                    />
                  </FoodItem>
                ));
              })()}
              {(() => {
                const filteredCount = availableFoods
                  .filter(food => !Object.keys(existingRatingsMap).includes(food._id))
                  .filter(food => !search || food.name?.toLowerCase().includes(search.trim().toLowerCase()))
                  .length;
                const totalPages = Math.max(1, Math.ceil(filteredCount / pageSize));
                const go = (p) => setPage(Math.min(Math.max(1, p), totalPages));
                const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
                return (
                  <div style={{ display:'flex', justifyContent:'center', gap:8, marginTop:8, flexWrap:'wrap' }}>
                    <Button onClick={() => go(page - 1)} disabled={page <= 1}>이전</Button>
                    {pages.map(p => (
                      <button
                        key={p}
                        onClick={() => go(p)}
                        style={{
                          padding:'6px 10px', borderRadius:999,
                          border:`1px solid ${p===page?'#2563eb':'#cbd5e1'}`,
                          background:p===page?'#2563eb':'#fff', color:p===page?'#fff':'#0f172a'
                        }}
                      >{p}</button>
                    ))}
                    <Button onClick={() => go(page + 1)} disabled={page >= totalPages}>다음</Button>
                  </div>
                );
              })()}
              <Button onClick={saveStep2AndFinish}>완료</Button>
            </>
          )}
        </div>
      )}

      {step === 3 && !hasPreferences && (
        <div>
          <StepTitle>3단계: 좋아하는 음식을 직접 입력하세요 (쉼표 구분)</StepTitle>
          <StepTitle>추천 카테고리/태그를 확인하고 필요하면 선택/해제하세요</StepTitle>
          <div style={{ marginBottom:'0.75rem' }}>
            <div style={{ fontWeight:600, marginBottom:'0.25rem' }}>추천 카테고리</div>
            {(suggestedCategories.length ? suggestedCategories : ["한식","중식","일식","양식"]).map(cat => (
              <button
                key={cat}
                onClick={() => setCategories(prev => prev.includes(cat) ? prev.filter(c=>c!==cat) : [...prev, cat])}
                style={{
                  marginRight:8, marginBottom:8, padding:'6px 10px', borderRadius:999,
                  border: `1px solid ${categories.includes(cat)?'#2563eb':'#cbd5e1'}`,
                  background: categories.includes(cat)?'#2563eb':'#fff', color: categories.includes(cat)?'#fff':'#0f172a'
                }}
              >{cat}</button>
            ))}
          </div>
          <div style={{ marginBottom:'0.75rem' }}>
            <div style={{ fontWeight:600, marginBottom:'0.25rem' }}>추천 태그</div>
            {(suggestedTags.length ? suggestedTags : ["매운맛","면요리","고기","해산물"]).map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t=>t!==tag) : [...prev, tag])}
                style={{
                  marginRight:8, marginBottom:8, padding:'6px 10px', borderRadius:999,
                  border: `1px solid ${selectedTags.includes(tag)?'#059669':'#cbd5e1'}`,
                  background: selectedTags.includes(tag)?'#059669':'#fff', color: selectedTags.includes(tag)?'#fff':'#0f172a'
                }}
              >#{tag}</button>
            ))}
          </div>
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