import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// GPT를 활용한 음식 태그 자동 생성
export const generateFoodTags = async (req, res) => {
  try {
    const { foodName } = req.body;
    
    if (!foodName) {
      return res.status(400).json({
        success: false,
        message: "음식 이름이 필요합니다."
      });
    }

    const prompt = `
다음 음식에 대한 태그를 생성해주세요. 
음식: "${foodName}"

다음 형식으로 응답해주세요:
카테고리: [한식/중식/일식/양식/기타]
태그: [태그1, 태그2, 태그3, ...]

규칙:
1. 카테고리는 정확히 한 개만 선택
2. 태그는 3-5개 정도로 간결하게
3. 태그는 한국어로, 쉼표로 구분
4. 맛, 재료, 조리법, 특징 등을 포함
5. 예시: 떡볶이 → 카테고리: 한식, 태그: 매운맛, 매콤, 떡, 간식, 길거리음식
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "당신은 음식 전문가입니다. 주어진 음식에 대해 정확한 카테고리와 적절한 태그를 생성해주세요."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 200,
      temperature: 0.3
    });

    const response = completion.choices[0].message.content;
    
    // 응답 파싱
    const categoryMatch = response.match(/카테고리:\s*([^\n]+)/);
    const tagsMatch = response.match(/태그:\s*([^\n]+)/);
    
    const category = categoryMatch ? categoryMatch[1].trim() : '기타';
    const tagsString = tagsMatch ? tagsMatch[1].trim() : '';
    const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()) : [];

    res.status(200).json({
      success: true,
      data: {
        foodName,
        category,
        tags
      }
    });

  } catch (error) {
    console.error('GPT 태그 생성 실패:', error);
    res.status(500).json({
      success: false,
      message: "태그 생성에 실패했습니다.",
      error: error.message
    });
  }
};
