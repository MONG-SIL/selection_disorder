import express from "express";
import fs from "fs";
import { google } from "googleapis";

const router = express.Router();

// 인기 음식 데이터 조회 (YouTube API 또는 기본 데이터)
router.get("/popular-foods", async (req, res) => {
  try {
    // 기본 인기 음식 데이터 (이미지 없이 아이콘으로 표시)
    const defaultFoods = [
      {
        title: "맛있는 김치찌개 만들기",
        thumbnail: null, // 이미지 없음 - 프론트엔드에서 아이콘 표시
        tags: ["한식", "찌개", "김치", "따뜻한"]
      },
      {
        title: "간단한 파스타 레시피",
        thumbnail: null,
        tags: ["양식", "파스타", "면요리", "간단"]
      },
      {
        title: "달콤한 초콜릿 케이크",
        thumbnail: null,
        tags: ["디저트", "케이크", "초콜릿", "달콤한"]
      },
      {
        title: "매운 떡볶이 만들기",
        thumbnail: null,
        tags: ["한식", "떡볶이", "매운맛", "간식"]
      },
      {
        title: "신선한 샐러드 레시피",
        thumbnail: null,
        tags: ["양식", "샐러드", "건강한", "신선한"]
      },
      {
        title: "부드러운 연어 스테이크",
        thumbnail: null,
        tags: ["양식", "연어", "스테이크", "고급"]
      },
      {
        title: "얼큰한 라면 끓이기",
        thumbnail: null,
        tags: ["한식", "라면", "얼큰한", "간단"]
      },
      {
        title: "달콤한 아이스크림",
        thumbnail: null,
        tags: ["디저트", "아이스크림", "달콤한", "시원한"]
      }
    ];

    // YouTube API 설정이 있는지 확인
    const tokenPath = process.env.YOUTUBE_TOKEN_PATH || 
      "/Users/d/.credentials/youtube-nodejs-quickstart.json";
    const clientSecretPath = process.env.YOUTUBE_CLIENT_SECRET_PATH ||
      "/Users/d/Desktop/seldis/Seldis/frontend/client_secret.json";

    // YouTube API 파일이 존재하고 유효한지 확인
    if (fs.existsSync(tokenPath) && fs.existsSync(clientSecretPath)) {
      try {
        const token = JSON.parse(fs.readFileSync(tokenPath, "utf-8"));
        const credentials = JSON.parse(fs.readFileSync(clientSecretPath, "utf-8"));

        if (credentials.web && credentials.web.client_id && credentials.web.client_secret) {
          const { client_id, client_secret, redirect_uris } = credentials.web;
          const auth = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
          auth.setCredentials(token);

          const service = google.youtube("v3");
          const response = await service.videos.list({
            auth,
            part: "snippet,statistics",
            chart: "mostPopular",
            regionCode: "KR",
            videoCategoryId: "26",
            maxResults: 50,
          });

          if (response.data && response.data.items) {
            // 음식 관련 키워드
            const foodKeywords = [
              "음식", "요리", "레시피", "맛집", "식당", "카페",
              "food", "cooking", "recipe", "restaurant", "cafe", "delicious"
            ];
            
            // 필터 함수: 제목 또는 태그에 음식 키워드 포함 여부
            function isFoodRelated(video) {
              const title = video.snippet.title || "";
              const tags = video.snippet.tags || [];
              const titleLower = title.toLowerCase();
              const tagsLower = tags.map(tag => (tag || "").toLowerCase());
              return foodKeywords.some(keyword => {
                const keywordLower = keyword.toLowerCase();
                return titleLower.includes(keywordLower) ||
                  tagsLower.some(tag => tag.includes(keywordLower));
              });
            }
            
            let foods = response.data.items
              .filter(isFoodRelated)
              .map((video) => ({
                title: video.snippet.title,
                thumbnail: video.snippet.thumbnails?.medium?.url || "",
                tags: video.snippet.tags || [],
              }));
            
            if (foods.length > 10) {
              foods = foods.slice(0, 10);
            }

            // YouTube에서 데이터를 성공적으로 가져온 경우
            if (foods.length > 0) {
              console.log("YouTube API에서 인기 음식 데이터를 성공적으로 가져왔습니다.");
              return res.json(foods);
            }
          }
        }
      } catch (youtubeError) {
        console.log("YouTube API 호출 실패, 기본 데이터를 사용합니다:", youtubeError.message);
      }
    } else {
      console.log("YouTube API 설정 파일이 없어 기본 데이터를 사용합니다.");
    }

    // YouTube API가 없거나 실패한 경우 기본 데이터 반환
    console.log("기본 인기 음식 데이터를 반환합니다.");
    res.json(defaultFoods);

  } catch (err) {
    console.error("인기 음식 API 에러:", err);
    
        // 에러 발생 시에도 기본 데이터 반환
        const fallbackFoods = [
          {
            title: "맛있는 김치찌개 만들기",
            thumbnail: null,
            tags: ["한식", "찌개", "김치"]
          },
          {
            title: "간단한 파스타 레시피",
            thumbnail: null,
            tags: ["양식", "파스타", "면요리"]
          }
        ];
    
    res.json(fallbackFoods);
  }
});

export default router;