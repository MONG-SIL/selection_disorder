import express from "express";
import fs from "fs";
import { google } from "googleapis";

const router = express.Router();

// OAuth 토큰을 사용해 YouTube 인기 음식(요리 카테고리) 영상 조회
router.get("/popular-foods", async (req, res) => {
  try {
    const tokenPath = process.env.YOUTUBE_TOKEN_PATH || 
      "/Users/d/.credentials/youtube-nodejs-quickstart.json";
    const clientSecretPath = process.env.YOUTUBE_CLIENT_SECRET_PATH ||
      "/Users/d/Desktop/seldis/Seldis/frontend/client_secret.json";

    const token = JSON.parse(fs.readFileSync(tokenPath, "utf-8"));
    const credentials = JSON.parse(fs.readFileSync(clientSecretPath, "utf-8"));

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

    // 음식 관련 키워드
        const foodKeywords = [
            "음식", "요리", "레시피",
            "food", "cooking", "recipe"
          ];
          // 필터 함수: 제목 또는 태그에 음식 키워드 포함 여부
          function isFoodRelated(video) {
            const title = video.snippet.title || "";
            const tags = video.snippet.tags || [];
            // 소문자 비교를 위해 모두 소문자로 변환
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

    res.json(foods);
  } catch (err) {
    console.error("YouTube API 에러:", err);
    res.status(500).json({ error: "YouTube API 요청 실패" });
  }
});

export default router;