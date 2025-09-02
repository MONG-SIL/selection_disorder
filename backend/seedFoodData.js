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
  }
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
