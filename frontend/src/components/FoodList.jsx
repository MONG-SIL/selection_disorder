import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { getAllFoods, getFoodsByCategory } from '../services/foodApi';
import axios from 'axios';

const FoodListContainer = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 30px;
`;

const Title = styled.h1`
  color: #333;
  margin-bottom: 10px;
`;

const SearchBar = styled.input`
  width: 100%;
  max-width: 400px;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  margin-bottom: 20px;
  
  &:focus {
    outline: none;
    border-color: #007bff;
  }
`;

const CategoryFilter = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const CategoryButton = styled.button`
  padding: 8px 16px;
  border: 2px solid ${props => props.$active ? '#007bff' : '#e0e0e0'};
  background-color: ${props => props.$active ? '#007bff' : 'white'};
  color: ${props => props.$active ? 'white' : '#333'};
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  
  &:hover {
    border-color: #007bff;
    background-color: ${props => props.$active ? '#0056b3' : '#f8f9fa'};
  }
`;

const FoodGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
`;

const FoodCard = styled.div`
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px;
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  }
`;

const FoodImage = styled.div`
  width: 100%;
  height: 200px;
  background-color: #f8f9fa;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 14px;
  margin-bottom: 15px;
  background-image: ${props => props.$imageUrl ? `url(${props.$imageUrl})` : 'none'};
  background-size: cover;
  background-position: center;
`;

const FoodName = styled.h3`
  color: #333;
  margin-bottom: 8px;
  font-size: 18px;
`;

const FoodCategory = styled.span`
  background-color: #e3f2fd;
  color: #1976d2;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 10px;
  display: inline-block;
`;

const FoodDescription = styled.p`
  color: #666;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 10px;
`;

const FoodPrice = styled.div`
  color: #2e7d32;
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 10px;
`;

const FoodTags = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 10px;
`;

const Tag = styled.span`
  background-color: #f5f5f5;
  color: #666;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
`;

const FoodRating = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  color: #ff9800;
  font-size: 14px;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 16px;
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #d32f2f;
  font-size: 16px;
  background-color: #ffebee;
  border-radius: 8px;
  margin: 20px 0;
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 16px;
`;

const FoodList = () => {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [userPreferences, setUserPreferences] = useState(null);
  const [showRecommended, setShowRecommended] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const searchInputRef = useRef(null);
  const debounceTimeoutRef = useRef(null);

  const categories = ['전체', '한식', '중식', '일식', '양식', '기타'];
  const userId = "user123"; // 실제로는 로그인된 사용자 ID 사용

  // 디바운싱된 검색 함수
  const debouncedFetchFoods = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      fetchFoods();
    }, 2000); // 300ms 디바운스
  }, [selectedCategory, searchTerm]);

  // Unsplash 이미지 검색
  const fetchFoodImagesBatch = async (foodIds) => {
    try {
      const res = await axios.get('http://localhost:4000/api/food-images', { params: { ids: foodIds.join(',') } });
      return res.data?.images || {};
    } catch (e) {
      console.error('이미지 배치 조회 실패:', e);
      return {};
    }
  };

  // 평균 평점 일괄 조회
  const fetchAverageRatings = async (foodIds) => {
    try {
      const res = await axios.get('http://localhost:4000/api/user/preferences/average-ratings', {
        params: { ids: foodIds.join(',') }
      });
      return res.data?.averages || {};
    } catch (e) {
      console.error('평균 평점 조회 실패:', e);
      return {};
    }
  };


  useEffect(() => {
    debouncedFetchFoods();
    
    // 컴포넌트 언마운트 시 타이머 정리
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [debouncedFetchFoods]);

  // 사용자 취향 데이터 가져오기
  useEffect(() => {
    if (!showRecommended) return; // 추천 모드일 때만 불러오기
    const fetchUserPreferences = async () => {
      try {
        const response = await axios.get("http://localhost:4000/api/user/preferences", {
          params: { userId },
          validateStatus: (s) => (s >= 200 && s < 300) || s === 404,
        });
        if (response.status === 404) {
          setUserPreferences(null);
          return;
        }
        setUserPreferences(response.data);
      } catch (error) {
        console.error("사용자 취향 가져오기 실패:", error);
      }
    };
    fetchUserPreferences();
  }, [userId, showRecommended]);

  const fetchFoods = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      if (selectedCategory === '전체') {
        response = await getAllFoods({ 
          search: searchTerm || undefined,
          available: true 
        });
      } else {
        response = await getFoodsByCategory(selectedCategory);
      }
      
      const foods = response.data;
      const ids = foods.map(f => f._id).filter(Boolean);
      const averages = ids.length ? await fetchAverageRatings(ids) : {};
      const images = ids.length ? await fetchFoodImagesBatch(ids) : {};
      const withImages = foods.map((food) => {
        const avg = averages[food._id];
        const rating = typeof avg === 'number' ? avg : 2.5;
        const image = food.image || images[food._id] || null;
        return { ...food, image, rating };
      });
      setFoods(withImages);
    } catch (err) {
      setError('음식 리스트를 가져오는데 실패했습니다.');
      console.error('Error fetching foods:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  // 사용자 취향 기반 추천 음식 필터링 (카테고리 + 개별평가 + 태그 교집합)
  const getRecommendedFoods = (allFoods) => {
    if (!userPreferences) return allFoods;

    const preferredCategories = new Set(userPreferences.categories || []);
    const preferredTags = new Set((userPreferences.tags || []).map(t => String(t).toLowerCase()));
    const ratedByName = Object.values(userPreferences.ratings || {})
      .reduce((acc, r) => { if (r?.name) acc[r.name] = r.rating; return acc; }, {});

    return allFoods
      .map(food => {
        let score = 0;

        // 1) 카테고리 매칭 가중치
        if (food.category && preferredCategories.has(food.category)) {
          score += 2; // 기본 2점 가중치
        }

        // 2) 사용자 개별 평가 반영
        const userRating = ratedByName[food.name];
        if (userRating) {
          score += Number(userRating) * 2; // 평가 ×2
        }

        // 3) 태그 교집합 가중치
        if (Array.isArray(food.tags) && preferredTags.size > 0) {
          const overlap = food.tags
            .map(t => String(t).toLowerCase())
            .filter(t => preferredTags.has(t));
          // 태그 교집합 1개당 1.5점 가중치
          score += overlap.length * 1.5;
        }

        // 4) 기본 음식 평점 보정
        score += food.rating || 0;

        return { ...food, recommendationScore: score };
      })
      .sort((a, b) => b.recommendationScore - a.recommendationScore);
  };

  const handleShowRecommended = () => {
    setShowRecommended(!showRecommended);
    setPage(1);
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} style={{ color: i <= rating ? '#ff9800' : '#e0e0e0' }}>
          ★
        </span>
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <FoodListContainer>
        <LoadingMessage>음식 리스트를 불러오는 중...</LoadingMessage>
      </FoodListContainer>
    );
  }

  if (error) {
    return (
      <FoodListContainer>
        <ErrorMessage>{error}</ErrorMessage>
      </FoodListContainer>
    );
  }

  return (
    <FoodListContainer>
      <Header>
        <Title>🍽️ 음식 메뉴</Title>
        <SearchBar
          ref={searchInputRef}
          type="text"
          placeholder="음식 이름이나 태그로 검색..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
        <CategoryFilter>
          {categories.map(category => (
            <CategoryButton
              key={category}
              $active={selectedCategory === category}
              onClick={() => handleCategoryChange(category)}
            >
              {category}
            </CategoryButton>
          ))}
          {userPreferences && (
            <CategoryButton
              $active={showRecommended}
              onClick={handleShowRecommended}
            >
              🎯 추천 음식
            </CategoryButton>
          )}
        </CategoryFilter>
      </Header>

      {foods.length === 0 ? (
        <EmptyMessage>
          {searchTerm ? `"${searchTerm}"에 대한 검색 결과가 없습니다.` : '표시할 음식이 없습니다.'}
        </EmptyMessage>
      ) : (
        <>
          {(() => {
            const list = showRecommended ? getRecommendedFoods(foods) : foods;
            const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
            const currentPage = Math.min(Math.max(1, page), totalPages);
            const start = (currentPage - 1) * pageSize;
            const slice = list.slice(start, start + pageSize);
            return (
              <>
                <FoodGrid>
                  {slice.map(food => (
                    <FoodCard key={food._id}>
                      <FoodImage $imageUrl={food.image}>
                        {!food.image && '이미지 없음'}
                      </FoodImage>
                      <FoodName>{food.name}</FoodName>
                      <FoodCategory>{food.category}</FoodCategory>
                      {food.description && (
                        <FoodDescription>{food.description}</FoodDescription>
                      )}
                      {food.price && (
                        <FoodPrice>₩{food.price.toLocaleString()}</FoodPrice>
                      )}
                      {food.tags && food.tags.length > 0 && (
                        <FoodTags>
                          {food.tags.map((tag, index) => (
                            <Tag key={index}>{tag}</Tag>
                          ))}
                        </FoodTags>
                      )}
                      {food.rating > 0 && (
                        <FoodRating>
                          {renderStars(food.rating)} ({food.rating}/5)
                        </FoodRating>
                      )}
                      {showRecommended && food.recommendationScore && (
                        <div style={{ 
                          marginTop: '8px', 
                          padding: '4px 8px', 
                          backgroundColor: '#e8f5e8', 
                          borderRadius: '12px', 
                          fontSize: '12px', 
                          color: '#2e7d32',
                          display: 'inline-block'
                        }}>
                          추천 점수: {food.recommendationScore.toFixed(1)}
                        </div>
                      )}
                    </FoodCard>
                  ))}
                </FoodGrid>
                {(() => {
                  const go = (p) => setPage(Math.min(Math.max(1, p), totalPages));
                  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
                  return (
                    <div style={{ display:'flex', justifyContent:'center', gap:8, marginTop:16, flexWrap:'wrap' }}>
                      <button
                        onClick={() => go(currentPage - 1)}
                        disabled={currentPage <= 1}
                        style={{ padding:'6px 10px', borderRadius:999, border:'1px solid #cbd5e1', background:'#fff' }}
                      >이전</button>
                      {pages.map(p => (
                        <button
                          key={p}
                          onClick={() => go(p)}
                          style={{
                            padding:'6px 10px', borderRadius:999,
                            border:`1px solid ${p===currentPage?'#2563eb':'#cbd5e1'}`,
                            background:p===currentPage?'#2563eb':'#fff', color:p===currentPage?'#fff':'#0f172a'
                          }}
                        >{p}</button>
                      ))}
                      <button
                        onClick={() => go(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        style={{ padding:'6px 10px', borderRadius:999, border:'1px solid #cbd5e1', background:'#fff' }}
                      >다음</button>
                    </div>
                  );
                })()}
              </>
            );
          })()}
        </>
      )}
    </FoodListContainer>
  );
};

export default FoodList;
