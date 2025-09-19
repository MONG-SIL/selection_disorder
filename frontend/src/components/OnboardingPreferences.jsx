import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import axios from "axios";
import { getAllFoods, getFoodImages, getFoodRecipes } from "../services/foodApi";
import { enrichFoodsWithImagesAndRecipes, getValidFoodIds } from "../utils/foodUtils"; 
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
  // ratings: 음식별로 사용자가 평가한 선호도 { foodId: rating }
  const [ratings, setRatings] = useState({});
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
  const [isNewUser, setIsNewUser] = useState(true); // 신규 사용자 여부
  // 검색/정렬/페이지네이션
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("popular"); // popular | name | category
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [imageCache, setImageCache] = useState({});

  // 컴포넌트 마운트 시 음식 데이터 + 기존 취향 확인
  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const response = await getAllFoods({ available: true });
        const foods = response.data || [];
         // 이미지와 레시피를 병렬로 조회
         const ids = getValidFoodIds(foods);
         if (ids.length) {
           try {
             const [imagesRes, recipesRes] = await Promise.all([
               getFoodImages(ids),
               getFoodRecipes(ids)
             ]);
             
             const images = imagesRes?.images || {};
             const recipes = recipesRes?.recipes || {};
             
             // 이미지 캐시 설정
             setImageCache(images);
             
             // 유틸리티 함수를 사용하여 음식 데이터 강화
             const enrichedFoods = enrichFoodsWithImagesAndRecipes(foods, images, recipes);
             setAvailableFoods(enrichedFoods);
           } catch (e) {
             console.error('이미지/레시피 조회 실패:', e);
             setAvailableFoods(foods);
           }
         } else {
           setAvailableFoods(foods);
         }
        setLoading(false);
      } catch (error) {
        console.error("음식 데이터 가져오기 실패:", error);
        setLoading(false);
      }
    };
    const checkExisting = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get("http://localhost:4000/api/user/preferences", {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          validateStatus: (s) => (s >= 200 && s < 300) || s === 404,
        });
        
        if (res.status === 404) {
          setHasPreferences(false);
          setIsNewUser(true);
          return;
        }
        
        // 응답 구조 확인 (Preferences와 동일한 방식)
        const responseData = res.data?.data || res.data;
        
        if (responseData && responseData.ratings && Object.keys(responseData.ratings).length > 0) {
          setExistingRatingsMap(responseData.ratings || {});
          setHasPreferences(true);
          setIsNewUser(false);
          // 기존 취향이 있으면 미평가 음식만 표시
        } else {
          setHasPreferences(false);
          setIsNewUser(true);
        }
      } catch (e) {
        console.error('취향 확인 실패:', e);
        setHasPreferences(false);
        setIsNewUser(true);
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

  // 완료 시: 별점 저장 후 홈으로 이동
  const handleFinish = async () => {
    try {
      const entries = Object.entries(ratings || {}).filter(([_, v]) => Number(v?.rating) > 0);
      if (entries.length === 0) {
        alert('최소 하나의 음식을 평가해주세요.');
        return;
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('토큰이 없습니다.');
        return;
      }
      
      // 4점 이상 평가한 음식들의 태그를 수집 (4점 이하는 제외)
      const highRatedFoodTags = new Set();
      entries.forEach(([foodId, ratingData]) => {
        if (Number(ratingData.rating) >= 4) {
          const food = availableFoods.find(f => f._id === foodId);
          if (food && Array.isArray(food.tags)) {
            food.tags.forEach(tag => highRatedFoodTags.add(tag));
          }
        }
      });
      
      console.log("🔍 [DEBUG] handleFinish - 4점 이상 음식 태그:", Array.from(highRatedFoodTags));
      
      if (isNewUser) {
        // 신규 사용자: 전체 취향 데이터 생성 (4점 이상 음식 태그 포함)
        const body = {
          categories: [],
          ratings: Object.fromEntries(entries.map(([foodId, r]) => [foodId, r])),
          customFoods: [],
          tags: Array.from(highRatedFoodTags),
        };
        
        console.log('신규 사용자 취향 저장:', body);
        await axios.post('http://localhost:4000/api/user/preferences', body, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } else {
        // 기존 사용자: 기존 취향에 새 음식과 태그 추가
        let current = { categories: [], ratings: {}, customFoods: [], tags: [] };
        try {
          const res = await axios.get('http://localhost:4000/api/user/preferences', { 
            headers: { 'Authorization': `Bearer ${token}` }
          });
          current = res.data.data || res.data || current;
        } catch (e) {
          console.error('기존 취향 조회 실패:', e);
          return;
        }

        const mergedRatings = { ...current.ratings };
        entries.forEach(([foodId, r]) => {
          mergedRatings[foodId] = { name: r.name, rating: r.rating };
        });

        // 기존 태그와 새로 추가된 태그 합치기
        const existingTags = current.tags || [];
        const allTags = [...new Set([...existingTags, ...highRatedFoodTags])];

        const body = {
          categories: current.categories,
          ratings: mergedRatings,
          customFoods: current.customFoods,
          tags: allTags,
        };
        
        console.log('기존 사용자 취향 업데이트:', body);
        await axios.post('http://localhost:4000/api/user/preferences', body, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
      
      // 새로 평가한 음식들을 existingRatingsMap에 추가
      const newExistingRatings = { ...existingRatingsMap };
      entries.forEach(([foodId, r]) => {
        newExistingRatings[foodId] = r;
      });
      setExistingRatingsMap(newExistingRatings);
      
      // 네비바와 다른 탭 동기화
      window.localStorage.setItem('hasPreferences', 'true');
      window.dispatchEvent(new Event('preferences-updated'));
      
      // 홈으로 이동
      navigate('/');
    } catch (e) {
      console.error('취향 저장 실패:', e);
      alert('저장에 실패했습니다. 다시 시도해주세요.');
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
      <div>
        <StepTitle>{isNewUser ? '음식 취향 설정' : '새로운 음식 평가하기'}</StepTitle>
        <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
          {isNewUser 
            ? '아래 음식들 중에서 선호하는 음식을 평가해주세요. 최소 3개 이상의 음식을 평가해주세요.'
            : '아래 음식들 중에서 선호하는 음식을 평가해주세요. 평가한 음식은 기존 취향에 추가됩니다.'
          }
        </p>
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
                  .filter(food => {
                    // 기존 취향에 없는 음식만 표시
                    const isRated = Object.keys(existingRatingsMap).includes(food._id);
                    return !isRated;
                  })
                  .filter(food => !search || food.name?.toLowerCase().includes(search.trim().toLowerCase()))
                
                const sorted = filtered.sort((a,b) => {
                    if (sortKey === 'name') return (a.name||'').localeCompare(b.name||'');
                    if (sortKey === 'category') return (a.category||'').localeCompare(b.category||'');
                    // popular: rating 내림차순, 없으면 0
                    const ar = Number(a.rating||0);
                    const br = Number(b.rating||0);
                    return br - ar;
                  });
                const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
                const currentPage = Math.min(Math.max(1, page), totalPages);
                const start = (currentPage - 1) * pageSize;
                const items = sorted.slice(start, start + pageSize);
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
                  .filter(food => {
                    const isRated = Object.keys(existingRatingsMap).includes(food._id);
                    return !isRated;
                  })
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
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <Button onClick={handleFinish}>완료</Button>
                <Button onClick={() => navigate('/')} style={{ background: '#6b7280', borderColor: '#6b7280' }}>취소</Button>
              </div>
            </>
          )}
        </div>
    </Container>
  );
}