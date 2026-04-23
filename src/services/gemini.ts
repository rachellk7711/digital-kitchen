const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

export async function getRecipeRecommendations(
  ingredients: string[], 
  situation: string = "일상 식사", 
  servings: number = 4,
  customGuidelines?: any
) {
  const prompt = `당신은 사용자의 건강과 미식을 동시에 책임지는 '퍼스널 웰니스 셰프'이자 AI 레시피 엔지니어입니다.
  사용자가 선택한 주재료(${ingredients.join(", ")})를 최우선으로 사용하고, 현재 상황("${situation}")에 맞춰 최적의 레시피 3가지를 제안하세요.

  [식단 원칙 및 제한사항 - 반드시 준수]
  1. 밀가루 및 씨앗 기름 차단: 밀가루와 모든 식물성 씨앗 기름을 원천 차단합니다. 
  2. 건강한 지방 권장: 오직 '엑스트라 버진 올리브유', '아보카도 오일', 'MCT 오일'만을 사용합니다.
  3. 설탕 대체 및 정밀 계량: 설탕은 반드시 '알룰로스'로 대체하며 '액상 알룰로스' 또는 '가루 알룰로스' 중 적합한 타입을 명확히 명시하십시오. 모든 계량은 g 또는 ml 단위를 권장합니다.
  4. 모든 응답은 반드시 한국어로 작성하십시오.

  [최종 출력 형식]
  반드시 다음 구조를 가진 JSON 배열로 반환하세요:
  [{ "title": "요리명", "description": "소개", "healthPoint": "건강포인트", "time": "시간", "difficulty": "난이도", "servings": ${servings}, "calories": 0, "ingredients": [{ "name": "이름", "amount": "양" }], "instructions": ["1단계", "2단계"], "tags": ["태그"], "chefTip": "꿀팁", "videoUrl": "검색링크" }]`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "AI 통신 에러");
    }

    const result = await response.json();
    const text = result.candidates[0].content.parts[0].text;
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Direct Recipe AI generation failed:", error);
    throw error;
  }
}

export async function analyzeImage(base64Image: string) { 
  // 이미지 분석 로직 (필요 시 구현)
  return []; 
}

export async function refineRecipe(currentRecipe: any, userQuestion: string) {
  const prompt = `당신은 '퍼스널 웰니스 셰프'이자 AI 레시피 엔지니어입니다. 
  사용자가 현재 제공된 레시피("${currentRecipe.title}")에 대해 다음과 같이 질문하거나 수정을 요청했습니다:
  "${userQuestion}"

  사용자의 요청을 반영하여 기존 레시피의 'ingredients'(재료) 또는 'instructions'(조리법), 'chefTip' 등을 수정하세요.
  특히 조리 과학적으로 올바른 방법을 제시해야 하며, 기존의 'No Gluten', 'No Seed Oils', '알룰로스 사용', 'g/ml 정밀 계량' 원칙을 철저하게 따르세요.

  [기존 레시피 정보]
  ${JSON.stringify(currentRecipe)}

  [최종 출력 형식]
  반드시 다음 구조를 가진 JSON으로 반환하세요 (수정된 전체 레시피):
  {
    "title": "요리명",
    "description": "짧고 매력적인 소개",
    "healthPoint": "건강 포인트",
    "time": "소요 시간",
    "difficulty": "난이도",
    "servings": 인분 (숫자),
    "calories": 칼로리 (숫자),
    "ingredients": [{ "name": "이름", "amount": "양" }],
    "instructions": ["1단계", "2단계"],
    "tags": ["태그"],
    "chefTip": "셰프의 꿀팁"
  }`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
        }
      })
    });

    if (!response.ok) throw new Error("AI 통신 에러");
    const result = await response.json();
    const text = result.candidates[0].content.parts[0].text;
    return JSON.parse(text);
  } catch (error) {
    console.error("Refine recipe failed:", error);
    return currentRecipe;
  }
}
