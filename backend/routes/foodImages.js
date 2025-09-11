import express from 'express';
import axios from 'axios';
import FoodImageCache from '../models/FoodImageCache.js';
import Food from '../models/Food.js';

const router = express.Router();

// 간단 영문화/동의어 매핑 테이블 (필요 시 확장)
const KO_TO_EN = {
  '불고기': ['bulgogi'],
  '김치찌개': ['kimchi stew','kimchi jjigae'],
  '비빔밥': ['bibimbap'],
  '탕수육': ['tangsuyuk','sweet and sour pork'],
  '짜장면': ['jjajangmyeon','black bean noodles'],
  '짬뽕': ['jjamppong','spicy seafood noodle soup'],
  '초밥': ['sushi'],
  '라멘': ['ramen'],
  '스테이크': ['steak'],
  '파스타': ['pasta'],
};

const CATEGORY_TO_CUISINE = {
  '한식': 'korean',
  '중식': 'chinese',
  '일식': 'japanese',
  '양식': 'western',
  '디저트': 'dessert',
};

// 음식명에 따른 특화된 cuisine 오버라이드(정확도 향상)
const NAME_TO_CUISINE = {
  '파스타': 'italian',
  '스테이크': 'western',
  '초밥': 'japanese',
  '라멘': 'japanese',
  '짜장면': 'chinese',
  '짬뽕': 'chinese',
};

const buildQueries = (name, category) => {
  const base = String(name || '').trim();
  const cat = String(category || '').trim();
  const cuisine = NAME_TO_CUISINE[base] || CATEGORY_TO_CUISINE[cat] || cat || '';
  const engs = KO_TO_EN[base] || [];
  const combos = [];
  // 1) 영문 우선
  engs.forEach(en => {
    if (en && cuisine) combos.push(`${en} authentic ${cuisine} dish`);
    if (en && cuisine) combos.push(`${en} ${cuisine} cuisine`);
    if (en) combos.push(`${en} food`);
    if (en) combos.push(`${en} dish`);
  });
  // 2) 원문 한글 + 카테고리
  if (base && cuisine) combos.push(`${base} authentic ${cuisine} dish`);
  if (base && cuisine) combos.push(`${base} ${cuisine} cuisine`);
  if (base) combos.push(`${base} food`);
  if (base) combos.push(`${base} dish`);
  if (cuisine) combos.push(`${cuisine} cuisine`);
  return combos;
};

const tokenize = (str = '') => String(str).toLowerCase();
const scoreResult = (item, tokens) => {
  const title = tokenize(item?.alt_description || item?.description || item?.slug || '');
  const tags = Array.isArray(item?.tags) ? item.tags.map(t => tokenize(t?.title || t)) : [];
  let score = 0;
  tokens.forEach(t => {
    if (!t) return;
    const tt = t.toLowerCase();
    if (title.includes(tt)) score += 3;
    if (tags.some(x => String(x).includes(tt))) score += 2;
  });
  return score;
};

// GET /api/food-images/:foodId
// 캐시가 있으면 반환, 없으면 Unsplash 검색 후 저장
router.get('/:foodId', async (req, res) => {
  try {
    const { foodId } = req.params;
    const food = await Food.findById(foodId).lean();
    if (!food) return res.status(404).json({ success: false, message: 'Food not found' });

    // 캐시 조회
    const cached = await FoodImageCache.findOne({ foodId }).lean();
    if (cached?.imageUrl) {
      const list = Array.isArray(cached.imageUrls) && cached.imageUrls.length ? cached.imageUrls : [cached.imageUrl];
      const chosen = cached.overrideUrl || list[0];
      return res.json({ success: true, imageUrl: chosen, cached: true });
    }

    const topics = 'food-drink';
    const orientation = 'landscape';
    const orderBy = 'relevant';
    const contentFilter = 'high';
    const queries = buildQueries(food.name, food.category);

    let imageUrl = null;
    let imageUrls = [];
    let imageIds = [];
    for (const q of queries) {
      try {
        const r = await axios.get('https://api.unsplash.com/search/photos', {
          params: {
            query: q,
            per_page: 10,
            topics,
            orientation,
            order_by: orderBy,
            content_filter: contentFilter,
          },
          headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` },
        });
        let results = r.data?.results || [];
        // 스코어링: 제목/태그에 영문명/카테고리 토큰 포함도 기반
        const tokens = [q, ...(KO_TO_EN[food.name] || []), CATEGORY_TO_CUISINE[food.category] || '', NAME_TO_CUISINE[food.name] || '']
          .map(s => String(s||'').toLowerCase())
          .filter(Boolean);
        results = results
          .map(item => ({ item, score: scoreResult(item, tokens) }))
          .sort((a,b) => b.score - a.score)
          .map(x => x.item);
        if (results.length > 0) {
          results.forEach(item => {
            const url = item?.urls?.small;
            if (url) {
              imageUrls.push(url);
              imageIds.push(item?.id);
            }
          });
          if (!imageUrl && imageUrls.length) imageUrl = imageUrls[0];
          if (imageUrl) break;
        }
      } catch (e) {
        // 다음 쿼리로 폴백
      }
    }

    if (!imageUrl) {
      return res.status(404).json({ success: false, message: 'No image found' });
    }

    // 캐시 저장
    await FoodImageCache.create({
      foodId,
      name: food.name,
      category: food.category,
      imageUrl,
      imageUrls: Array.from(new Set(imageUrls)).slice(0, 12),
      imageIds: Array.from(new Set(imageIds)).slice(0, 12),
      provider: 'unsplash',
      query: queries[0],
      topics: [topics],
      orientation,
      orderBy,
      contentFilter,
    });

    res.json({ success: true, imageUrl, cached: false });
  } catch (e) {
    console.error('[food-images] error:', e);
    res.status(500).json({ success: false, message: 'Internal error' });
  }
});

// GET /api/food-images (배치): ids=comma-separated → 각 이미지 반환/생성
router.get('/', async (req, res) => {
  try {
    const ids = String(req.query.ids || '').split(',').map(s => s.trim()).filter(Boolean);
    if (!ids.length) return res.status(400).json({ success: false, message: 'ids required' });

    const foods = await Food.find({ _id: { $in: ids } }).lean();
    const idToFood = foods.reduce((acc, f) => { acc[String(f._id)] = f; return acc; }, {});
    const result = {};

    // 먼저 캐시 일괄 조회
    const caches = await FoodImageCache.find({ foodId: { $in: ids } }).lean();
    // 음식별 로테이션: 요청 시점의 분/초/밀리초를 섞어 인덱스 산출
    const now = Date.now();
    const cachedMap = caches.reduce((acc, c) => {
      const list0 = Array.isArray(c.imageUrls) && c.imageUrls.length ? c.imageUrls : (c.imageUrl ? [c.imageUrl] : []);
      const list = c.overrideUrl ? [c.overrideUrl, ...list0] : list0;
      if (list.length) {
        const idx = Math.abs((now + (String(c.foodId).charCodeAt(0) || 0)) % list.length);
        acc[String(c.foodId)] = list[idx];
      }
      return acc;
    }, {});

    // 캐시 있는 것은 즉시 매핑
    ids.forEach(id => {
      if (cachedMap[id]) result[id] = cachedMap[id];
    });

    // 캐시 없는 것은 검색/저장
    for (const id of ids) {
      if (result[id]) continue;
      const food = idToFood[id];
      if (!food) continue;

      const topics = 'food-drink';
      const orientation = 'landscape';
      const orderBy = 'relevant';
      const contentFilter = 'high';
      const queries = buildQueries(food.name, food.category);

      let imageUrl = null;
      let imageUrls = [];
      let imageIds = [];
      for (const q of queries) {
        try {
          const r = await axios.get('https://api.unsplash.com/search/photos', {
            params: { query: q, per_page: 10, topics, orientation, order_by: orderBy, content_filter: contentFilter },
            headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` },
          });
          let results = r.data?.results || [];
          const tokens = [q, ...(KO_TO_EN[food.name] || []), CATEGORY_TO_CUISINE[food.category] || '', NAME_TO_CUISINE[food.name] || '']
            .map(s => String(s||'').toLowerCase())
            .filter(Boolean);
          results = results
            .map(item => ({ item, score: scoreResult(item, tokens) }))
            .sort((a,b) => b.score - a.score)
            .map(x => x.item);
          if (results.length > 0) {
            results.forEach(item => {
              const url = item?.urls?.small;
              if (url) {
                imageUrls.push(url);
                imageIds.push(item?.id);
              }
            });
            if (!imageUrl && imageUrls.length) imageUrl = imageUrls[0];
            if (imageUrl) break;
          }
        } catch {}
      }

      if (imageUrl) {
        await FoodImageCache.create({
          foodId: id,
          name: food.name,
          category: food.category,
          imageUrl,
          imageUrls: Array.from(new Set(imageUrls)).slice(0, 12),
          imageIds: Array.from(new Set(imageIds)).slice(0, 12),
          provider: 'unsplash',
          query: queries[0],
          topics: [topics],
          orientation,
          orderBy,
          contentFilter,
        });
        result[id] = imageUrl;
      }
    }

    res.json({ success: true, images: result });
  } catch (e) {
    console.error('[food-images][batch] error:', e);
    res.status(500).json({ success: false, message: 'Internal error' });
  }
});

// DELETE /api/food-images/cache?key=YOUR_ADMIN_KEY
// 캐시 전체 삭제 (보호용 키 필요)
router.delete('/cache', async (req, res) => {
  try {
    const provided = String(req.query.key || '');
    const required = String(process.env.ADMIN_KEY || '');
    if (required && provided !== required) {
      return res.status(403).json({ success: false, message: 'forbidden' });
    }
    await FoodImageCache.deleteMany({});
    return res.json({ success: true, message: 'FoodImageCache cleared' });
  } catch (e) {
    console.error('[food-images][clear] error:', e);
    res.status(500).json({ success: false, message: 'Internal error' });
  }
});

export default router;


