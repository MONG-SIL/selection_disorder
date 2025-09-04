import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import axios from "axios";
import StarRating from "./StarRating";
import { getAllFoods } from "../services/foodApi";
import { generateFoodTags } from "../services/gptApi";

const Container = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1rem;
`;

const Section = styled.div`
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.5rem 0;
  border-bottom: 1px dashed #f1f5f9;
  &:last-child { border-bottom: none; }
`;

const Controls = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const Select = styled.select`
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0.375rem 0.5rem;
`;

const Input = styled.input`
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
`;

const Button = styled.button`
  border: 1px solid #2563eb;
  background: #2563eb;
  color: #fff;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
`;

const FilterBar = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
`;

const FilterButton = styled.button`
  padding: 0.375rem 0.75rem;
  border-radius: 999px;
  border: 1px solid ${props => props.$active ? '#2563eb' : '#cbd5e1'};
  background: ${props => props.$active ? '#2563eb' : '#fff'};
  color: ${props => props.$active ? '#fff' : '#0f172a'};
`;

export default function Preferences() {
  const [preferences, setPreferences] = useState({ ratings: {}, categories: [], customFoods: [] });
  const [newFood, setNewFood] = useState("");
  const [newRating, setNewRating] = useState(3);
  const [hasPreferences, setHasPreferences] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('전체');
  const [localTags, setLocalTags] = useState([]);
  const [newTag, setNewTag] = useState("");
  const [allTags, setAllTags] = useState([]);
  const [tagSearch, setTagSearch] = useState("");
  const [nameToCategory, setNameToCategory] = useState({});
  const [tab, setTab] = useState('tags'); // 'tags' | 'categories' | 'ratings'

  const navigate = useNavigate();

  const userId = "user123"; // userId 고정

  // 기존에 저장된 취향 불러오기
  const fetchPreferences = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/user/preferences", {
        params: { userId },
      });
      console.log("[client] GET /api/user/preferences resp:", res.data);
      setPreferences(res.data);
      setLocalTags(Array.isArray(res.data.tags) ? res.data.tags : []);
      setHasPreferences(true);
    } catch (err) {
      if (err.response?.status === 404) {
        console.log("사용자 취향 데이터가 없습니다. 온보딩으로 이동합니다.");
        // 취향 데이터가 없으면 온보딩으로 리다이렉트
        navigate('/onboarding');
      } else {
        console.error("취향 불러오기 실패:", err);
      }
    }
  };

  // 모든 음식의 태그를 수집해 태그 라이브러리 구성 + 이름→카테고리 매핑
  useEffect(() => {
    const loadTags = async () => {
      try {
        const res = await getAllFoods({ available: true });
        const tagCount = {};
        const map = {};
        (res.data || []).forEach(food => {
          if (Array.isArray(food.tags)) {
            food.tags.forEach(t => {
              const key = String(t).toLowerCase();
              tagCount[key] = (tagCount[key] || 0) + 1;
            });
          }
          if (food?.name && food?.category) {
            map[food.name] = food.category;
          }
        });
        const sorted = Object.entries(tagCount)
          .sort((a,b) => b[1] - a[1])
          .map(([t]) => t);
        setAllTags(sorted);
        setNameToCategory(map);
      } catch (e) {
        console.error("태그 라이브러리 로드 실패:", e);
      }
    };
    loadTags();
  }, []);

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
    console.log("[client] PUT /api/user/preferences req:", requestData);
    const res = await axios.put("http://localhost:4000/api/user/preferences", requestData);
    console.log("[client] PUT /api/user/preferences resp:", res.data);
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

  // 태그 추가/삭제/저장
  const handleAddTag = () => {
    const t = newTag.trim();
    if (!t) return;
    if (localTags.includes(t)) return;
    setLocalTags([...localTags, t]);
    setNewTag("");
  };

  const handleRemoveTag = (tag) => {
    setLocalTags(localTags.filter(t => t !== tag));
  };

  const handleSaveTags = async () => {
    try {
      const reqBody = {
        userId,
        categories: preferences.categories,
        ratings: preferences.ratings,
        customFoods: preferences.customFoods,
        tags: localTags,
      };
      console.log("[client] POST /api/user/preferences req:", reqBody);
      const res = await axios.post("http://localhost:4000/api/user/preferences", reqBody);
      console.log("[client] POST /api/user/preferences resp:", res.data);
      // 응답에 tags가 누락되는 상황에서도 UI는 즉시 반영
      setPreferences(prev => ({ ...prev, tags: [...localTags] }));
      await fetchPreferences();
    } catch (err) {
      console.error("태그 저장 실패:", err);
    }
  };

  // 새로운 음식 취향 추가 (POST) - GPT 태그 자동 생성 포함
  const handleAddNewPreference = async () => {
    const foodName = newFood.trim();
    if (!foodName) return;

    try {
      // GPT로 태그 생성
      console.log(`[client] GPT 태그 생성 요청: ${foodName}`);
      const gptResponse = await generateFoodTags(foodName);
      console.log(`[client] GPT 응답:`, gptResponse);
      
      const { category, tags } = gptResponse.data;
      
      // 생성된 태그를 localTags에 추가
      const newTags = [...new Set([...localTags, ...tags])];
      setLocalTags(newTags);
      
      // 카테고리도 추가 (중복 제거)
      const updatedCategories = [...new Set([...preferences.categories, category])];
      
      const newRatingObj = { name: foodName, rating: newRating };
      const updatedRatings = { ...preferences.ratings, [foodName + "_custom"]: newRatingObj };
      const updatedCustomFoods = [...preferences.customFoods, foodName];

      await axios.post("http://localhost:4000/api/user/preferences", {
        userId,
        categories: updatedCategories,
        ratings: updatedRatings,
        customFoods: updatedCustomFoods,
        tags: newTags,
      });
      
      setNewFood("");
      setNewRating(3);
      fetchPreferences();
    } catch (err) {
      console.error("새 취향 추가 실패:", err);
    }
  };

  // 취향 데이터가 없으면 로딩 표시
  if (!hasPreferences) {
    return <div>취향 데이터를 불러오는 중...</div>;
  }

  const filteredEntries = Object.entries(preferences.ratings || {}).filter(([_, obj]) => {
    if (categoryFilter === '전체') return true;
    const cat = nameToCategory[obj?.name];
    return cat ? cat === categoryFilter : false;
  });

  const categories = ['전체', '한식', '중식', '일식', '양식', '기타'];

  
  const togglePreferredCategory = (cat) => {
    if (cat === '전체') return;
    const exists = (preferences.categories || []).includes(cat);
    const next = exists
      ? (preferences.categories || []).filter(c => c !== cat)
      : [ ...(preferences.categories || []), cat ];
    setPreferences({ ...preferences, categories: next });
  };

  const savePreferredCategories = async () => {
    try {
      const reqBody = {
        userId,
        categories: preferences.categories,
        ratings: preferences.ratings,
        customFoods: preferences.customFoods,
        tags: localTags,
      };
      console.log('[client] POST /api/user/preferences (categories) req:', reqBody);
      const res = await axios.post('http://localhost:4000/api/user/preferences', reqBody);
      console.log('[client] POST /api/user/preferences (categories) resp:', res.data);
      await fetchPreferences();
    } catch (e) {
      console.error('카테고리 선호 저장 실패:', e);
    }
  };

  return (
    <Container>
      <h2>Preferences</h2>
      {/* 미니 네비게이션 */}
      <FilterBar>
        <FilterButton $active={tab==='tags'} onClick={() => setTab('tags')}>태그</FilterButton>
        <FilterButton $active={tab==='categories'} onClick={() => setTab('categories')}>카테고리</FilterButton>
        <FilterButton $active={tab==='ratings'} onClick={() => setTab('ratings')}>평가</FilterButton>
      </FilterBar>

      {tab === 'tags' && (
      <Section>
        <h3>태그 라이브러리</h3>
        <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8 }}>
          <Input
            type="text"
            placeholder="태그 검색"
            value={tagSearch}
            onChange={(e) => setTagSearch(e.target.value)}
          />
          <span style={{ color:'#64748b' }}>
            {allTags.length} tags
          </span>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {allTags
            .filter(t => !tagSearch || t.includes(tagSearch.trim().toLowerCase()))
            .map((tag, idx) => (
            <button
              key={idx}
              onClick={() => setLocalTags(prev => prev.includes(tag) ? prev.filter(x=>x!==tag) : [...prev, tag])}
              style={{
                padding:'6px 10px', borderRadius:999,
                border:`1px solid ${localTags.includes(tag)?'#059669':'#cbd5e1'}`,
                background: localTags.includes(tag)?'#059669':'#fff',
                color: localTags.includes(tag)?'#fff':'#0f172a'
              }}
            >#{tag}</button>
          ))}
        </div>
        <div style={{ marginTop:8 }}>
          <Button onClick={handleSaveTags}>태그 변경 저장</Button>
        </div>
      </Section>
      )}
      {tab === 'tags' && (
      <Section>
        <h3>내 태그</h3>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:8 }}>
          {localTags.map((tag, idx) => (
            <span key={idx} style={{
              padding:'4px 10px', borderRadius:999, background:'#f1f5f9', color:'#0f172a',
              border:'1px solid #cbd5e1', display:'inline-flex', alignItems:'center', gap:6
            }}>
              #{tag}
              <button onClick={() => handleRemoveTag(tag)} style={{
                border:'none', background:'transparent', color:'#64748b', cursor:'pointer'
              }}>×</button>
            </span>
          ))}
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <Input
            type="text"
            placeholder="태그 입력 (예: 매운맛)"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
          />
          <Button onClick={handleAddTag}>추가</Button>
          <Button onClick={handleSaveTags}>저장</Button>
        </div>
      </Section>
      )}
      {tab === 'categories' && (
      <>
      <FilterBar>
        {categories.map(cat => (
          <FilterButton
            key={cat}
            $active={categoryFilter === cat}
            onClick={() => setCategoryFilter(cat)}
          >
            {cat}
          </FilterButton>
        ))}
      </FilterBar>

      <Section>
        <h3>카테고리 선호 설정</h3>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:8 }}>
          {categories.filter(c => c !== '전체').map(cat => (
            <button
              key={cat}
              onClick={() => togglePreferredCategory(cat)}
              style={{
                padding:'6px 10px', borderRadius:999,
                border:`1px solid ${(preferences.categories||[]).includes(cat)?'#2563eb':'#cbd5e1'}`,
                background: (preferences.categories||[]).includes(cat)?'#2563eb':'#fff',
                color: (preferences.categories||[]).includes(cat)?'#fff':'#0f172a'
              }}
            >{cat}</button>
          ))}
        </div>
        <Button onClick={savePreferredCategories}>카테고리 선호 저장</Button>
      </Section>
      <Section>
        <h3>카테고리 취향</h3>
        {Array.isArray(preferences.categories) &&
          preferences.categories.map((cat, index) => (
            <Row key={index}>
              <span>카테고리: {cat}</span>
            </Row>
          ))}
      </Section>
      </>
      )}
 
      {tab === 'ratings' && (
      <>
      <Section>
        <h3>기존 취향</h3>
        {filteredEntries.map(([foodId, obj]) => (
          <Row key={foodId}>
            <div>
              <div style={{ fontWeight: 600 }}>{obj.name}</div>
            </div>
            <Controls>
              <StarRating
                value={obj.rating}
                onChange={(v) => handleRatingChange(foodId, v)}
                size={20}
              />
              <Button onClick={() => handleSave(foodId)}>저장</Button>
              <Button onClick={() => handleDelete(foodId)} style={{ background:'#ef4444', borderColor:'#ef4444' }}>삭제</Button>
            </Controls>
          </Row>
        ))}
      </Section>

      <Section>
        <h3>새 음식 추가</h3>
        <div style={{ display:'flex', gap:'0.5rem', alignItems:'center', flexWrap:'wrap' }}>
          <Input
            type="text"
            placeholder="음식 이름"
            value={newFood}
            onChange={(e) => setNewFood(e.target.value)}
          />
          <StarRating value={newRating} onChange={(v) => setNewRating(v)} />
          <Button onClick={handleAddNewPreference}>추가</Button>
        </div>
      </Section>
      </>
      )}
    </Container>
  );
}