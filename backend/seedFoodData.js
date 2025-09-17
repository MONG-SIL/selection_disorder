import mongoose from "mongoose";
import Food from "./models/Food.js";
import dotenv from "dotenv";

dotenv.config();

const sampleFoods = [
  {
    name: "김치찌개",
    category: "한식",
    description: "신선한 김치와 돼지고기로 끓인 얼큰한 찌개",
    price: 8000,
    tags: ["매운맛", "따뜻한", "전통음식"],
    rating: 4.5,
    isAvailable: true
  },
  {
    name: "불고기",
    category: "한식",
    description: "달콤짭짤한 양념에 재운 소고기 구이",
    price: 15000,
    tags: ["달콤한", "고기", "인기메뉴"],
    rating: 4.8,
    isAvailable: true
  },
  {
    name: "짜장면",
    category: "중식",
    description: "춘장으로 만든 진한 소스의 면요리",
    price: 6000,
    tags: ["면요리", "인기메뉴", "배달"],
    rating: 4.2,
    isAvailable: true
  },
  {
    name: "짬뽕",
    category: "중식",
    description: "해산물과 야채가 풍부한 얼큰한 국물면",
    price: 7000,
    tags: ["해산물", "매운맛", "면요리"],
    rating: 4.3,
    isAvailable: true
  },
  {
    name: "초밥",
    category: "일식",
    description: "신선한 생선과 밥으로 만든 일본 전통 음식",
    price: 20000,
    tags: ["생선", "신선한", "고급"],
    rating: 4.7,
    isAvailable: true
  },
  {
    name: "라멘",
    category: "일식",
    description: "진한 돈코츠 국물과 쫄깃한 면",
    price: 9000,
    tags: ["면요리", "따뜻한", "인기메뉴"],
    rating: 4.4,
    isAvailable: true
  },
  {
    name: "스테이크",
    category: "양식",
    description: "프리미엄 소고기 스테이크",
    price: 35000,
    tags: ["고기", "고급", "서양식"],
    rating: 4.6,
    isAvailable: true
  },
  {
    name: "파스타",
    category: "양식",
    description: "크림소스와 버섯으로 만든 이탈리안 파스타",
    price: 12000,
    tags: ["면요리", "크림", "이탈리안"],
    rating: 4.1,
    isAvailable: true
  },
  {
    name: "비빔밥",
    category: "한식",
    description: "다양한 나물과 고추장으로 비빈 건강한 밥",
    price: 7000,
    tags: ["건강한", "채소", "전통음식"],
    rating: 4.0,
    isAvailable: true
  },
  {
    name: "탕수육",
    category: "중식",
    description: "바삭한 튀김에 새콤달콤한 소스를 곁들인 요리",
    price: 18000,
    tags: ["튀김", "달콤한", "인기메뉴"],
    rating: 4.5,
    isAvailable: true
  },
  // 추가 항목 (40개)
  { name: "된장찌개", category: "한식", description: "구수한 된장 베이스의 찌개", price: 7500, tags: ["전통음식","따뜻한"], rating: 4.0, isAvailable: true },
  { name: "삼계탕", category: "한식", description: "닭과 인삼으로 끓인 보양식", price: 14000, tags: ["보양","따뜻한"], rating: 4.4, isAvailable: true },
  { name: "제육볶음", category: "한식", description: "매콤달콤한 돼지고기 볶음", price: 9000, tags: ["매운맛","고기"], rating: 4.3, isAvailable: true },
  { name: "닭갈비", category: "한식", description: "닭고기와 채소를 매콤하게 볶은 요리", price: 11000, tags: ["매운맛","고기"], rating: 4.2, isAvailable: true },
  { name: "갈비탕", category: "한식", description: "소갈비로 우려낸 맑은 탕", price: 13000, tags: ["국물","고기"], rating: 4.1, isAvailable: true },
  { name: "부대찌개", category: "한식", description: "햄과 소시지가 든 얼큰한 찌개", price: 9500, tags: ["매운맛","국물"], rating: 4.0, isAvailable: true },
  { name: "잡채", category: "한식", description: "당면과 채소, 고기의 조화", price: 10000, tags: ["면요리","달콤한"], rating: 3.9, isAvailable: true },
  { name: "칼국수", category: "한식", description: "시원한 국물과 쫄깃한 면", price: 8000, tags: ["면요리","따뜻한"], rating: 4.0, isAvailable: true },
  { name: "설렁탕", category: "한식", description: "사골로 우려낸 담백한 탕", price: 9000, tags: ["국물","담백"], rating: 3.8, isAvailable: true },
  { name: "순두부찌개", category: "한식", description: "부드러운 순두부가 들어간 매운 찌개", price: 8500, tags: ["매운맛","국물"], rating: 4.1, isAvailable: true },
  { name: "마라탕", category: "중식", description: "얼얼하고 매운 사천식 탕", price: 12000, tags: ["매운맛","사천"], rating: 4.0, isAvailable: true },
  { name: "마라샹궈", category: "중식", description: "마라 소스로 볶은 건식 요리", price: 13000, tags: ["매운맛","사천"], rating: 4.0, isAvailable: true },
  { name: "꿔바로우", category: "중식", description: "새콤달콤한 찹쌀 탕수육", price: 17000, tags: ["튀김","달콤한"], rating: 4.2, isAvailable: true },
  { name: "딤섬", category: "중식", description: "다양한 소를 넣은 찐만두", price: 12000, tags: ["만두","간식"], rating: 4.1, isAvailable: true },
  { name: "고추잡채", category: "중식", description: "야채와 고기를 매콤하게 볶은 요리", price: 15000, tags: ["볶음","매콤"], rating: 3.9, isAvailable: true },
  { name: "마파두부", category: "중식", description: "두부와 다진고기의 매운 볶음", price: 11000, tags: ["두부","매운맛"], rating: 4.0, isAvailable: true },
  { name: "우육면", category: "중식", description: "소고기 육수의 면요리", price: 10000, tags: ["면요리","국물"], rating: 3.8, isAvailable: true },
  { name: "탄탄면", category: "중식", description: "고소한 땅콩소스의 매콤한 면", price: 10000, tags: ["면요리","매운맛"], rating: 4.0, isAvailable: true },
  { name: "유산슬", category: "중식", description: "해산물과 채소의 걸쭉한 볶음", price: 18000, tags: ["해산물","볶음"], rating: 4.1, isAvailable: true },
  { name: "사천탕면", category: "중식", description: "얼얼한 사천식 국물면", price: 11000, tags: ["면요리","사천"], rating: 3.9, isAvailable: true },
  { name: "돈카츠", category: "일식", description: "바삭한 일본식 돈가스", price: 11000, tags: ["튀김","고기"], rating: 4.2, isAvailable: true },
  { name: "가츠동", category: "일식", description: "돈카츠를 올린 일본식 덮밥", price: 9500, tags: ["덮밥","달콤한"], rating: 4.0, isAvailable: true },
  { name: "규동", category: "일식", description: "소고기 양념 덮밥", price: 9000, tags: ["덮밥","고기"], rating: 4.0, isAvailable: true },
  { name: "우동", category: "일식", description: "쫄깃한 면발의 따뜻한 국물", price: 8000, tags: ["면요리","국물"], rating: 3.9, isAvailable: true },
  { name: "소바", category: "일식", description: "메밀면 차가운 국수", price: 8500, tags: ["면요리","담백"], rating: 3.8, isAvailable: true },
  { name: "가라아게", category: "일식", description: "일본식 닭튀김", price: 9000, tags: ["튀김","간식"], rating: 4.0, isAvailable: true },
  { name: "오코노미야키", category: "일식", description: "일본식 부침개", price: 10000, tags: ["부침","간식"], rating: 3.8, isAvailable: true },
  { name: "회덮밥", category: "일식", description: "신선한 회를 올린 덮밥", price: 12000, tags: ["생선","신선한"], rating: 4.1, isAvailable: true },
  { name: "카레라이스", category: "일식", description: "일본식 커리와 밥", price: 9000, tags: ["카레","덮밥"], rating: 4.0, isAvailable: true },
  { name: "피자", category: "양식", description: "치즈와 토핑이 풍부한 이탈리안 피자", price: 18000, tags: ["치즈","공유"], rating: 4.2, isAvailable: true },
  { name: "리조또", category: "양식", description: "크리미한 이탈리안 리조또", price: 14000, tags: ["이탈리안","크림"], rating: 4.0, isAvailable: true },
  { name: "치킨", category: "양식", description: "겉바속촉 프라이드 치킨", price: 17000, tags: ["튀김","공유"], rating: 4.3, isAvailable: true },
  { name: "버거", category: "양식", description: "비프 패티와 번의 조합", price: 9000, tags: ["패스트푸드","고기"], rating: 4.0, isAvailable: true },
  { name: "샐러드", category: "양식", description: "신선한 채소 샐러드", price: 8000, tags: ["건강","가벼움"], rating: 3.7, isAvailable: true },
  { name: "바비큐립", category: "양식", description: "바비큐 소스의 돼지갈비", price: 22000, tags: ["바비큐","고기"], rating: 4.1, isAvailable: true },
  { name: "크림스프", category: "양식", description: "부드러운 크림 수프", price: 7000, tags: ["수프","크림"], rating: 3.6, isAvailable: true },
  { name: "감바스", category: "양식", description: "올리브오일에 마늘과 새우", price: 16000, tags: ["해산물","타파스"], rating: 4.1, isAvailable: true },
  { name: "아란치니", category: "양식", description: "이탈리안 라이스 크로켓", price: 9000, tags: ["이탈리안","간식"], rating: 3.9, isAvailable: true },
  { name: "티라미수", category: "디저트", description: "마스카르포네 치즈 디저트", price: 7000, tags: ["이탈리안","달콤"], rating: 4.3, isAvailable: true },
  { name: "치즈케이크", category: "디저트", description: "진한 치즈 풍미의 케이크", price: 6500, tags: ["치즈","달콤"], rating: 4.2, isAvailable: true },
  { name: "마카롱", category: "디저트", description: "달콤한 프랑스 과자", price: 3000, tags: ["달콤","간식"], rating: 3.9, isAvailable: true },
  { name: "브라우니", category: "디저트", description: "진한 초콜릿 케이크", price: 4000, tags: ["초콜릿","달콤"], rating: 4.0, isAvailable: true },
  { name: "젤라토", category: "디저트", description: "이탈리안 아이스크림", price: 4500, tags: ["이탈리안","차가움"], rating: 4.1, isAvailable: true },
  { name: "팥빙수", category: "디저트", description: "빙수 위에 팥과 토핑", price: 8000, tags: ["차가움","달콤"], rating: 4.0, isAvailable: true },
  { name: "호떡", category: "디저트", description: "달콤한 시럽이 들어간 한국 길거리 간식", price: 2000, tags: ["한국","달콤"], rating: 4.1, isAvailable: true },
  { name: "크레페", category: "디저트", description: "얇게 부친 프랑스식 디저트", price: 6000, tags: ["프랑스","달콤"], rating: 3.9, isAvailable: true },
  { name: "쿠키", category: "디저트", description: "바삭한 베이커리 과자", price: 2500, tags: ["간식","달콤"], rating: 3.8, isAvailable: true },
  { name: "바닐라 아이스크림", category: "디저트", description: "부드러운 바닐라 풍미", price: 4000, tags: ["차가움","달콤"], rating: 4.0, isAvailable: true }
];

const seedDatabase = async () => {
  try {
    // MongoDB 연결
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log("MongoDB 연결 성공");

    // 기존 음식 데이터 삭제
    await Food.deleteMany({});
    console.log("기존 음식 데이터 삭제 완료");

    
    // 샘플 데이터 삽입
    const insertedFoods = await Food.insertMany(sampleFoods);
    console.log(`${insertedFoods.length}개의 음식 데이터가 성공적으로 추가되었습니다.`);

    // 연결 종료
    await mongoose.connection.close();
    console.log("데이터베이스 연결 종료");
    
  } catch (error) {
    console.error("데이터 시딩 중 오류 발생:", error);
    process.exit(1);
  }
};

// 스크립트가 직접 실행될 때만 시딩 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}

export default seedDatabase;
