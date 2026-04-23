import { Ingredient, Recipe, MealPlan } from './types';

export const MOCK_INGREDIENTS: Ingredient[] = [
  { id: '1', name: '달걀 12개', amount: '12개', icon: 'egg', category: '유제품' },
  { id: '2', name: '시금치', amount: '200g', icon: 'leaf', category: '채소' },
  { id: '3', name: '사워도우', amount: '1덩이', icon: 'bread', category: '베이커리' },
  { id: '4', name: '파마산 치즈', amount: '100g', icon: 'cheese', category: '유제품' },
  { id: '5', name: '닭고기', amount: '500g', icon: 'drumstick', category: '육류' },
];

export const FREQUENT_INGREDIENTS: Ingredient[] = [
  { id: 'f1', name: '양파', amount: '1망', icon: 'shrub', image: 'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=100&q=80', category: '채소' },
  { id: 'f2', name: '대파', amount: '1단', icon: 'align-left', image: 'https://images.unsplash.com/photo-1589133917855-44243dbf1543?auto=format&fit=crop&w=100&q=80', category: '채소' },
  { id: 'f3', name: '당근', amount: '3개', icon: 'carrot', image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=100&q=80', category: '채소' },
  { id: 'f4', name: '계란', amount: '10구', icon: 'egg', image: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=100&q=80', category: '유제품' },
  { id: 'f5', name: '아보카도', amount: '1개', icon: 'avocado', image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=100&q=80', category: '과일' },
  { id: 'f6', name: '백명란젓', amount: '1팩', icon: 'fish', image: 'https://images.unsplash.com/photo-1534422298391-e4f8c170db06?auto=format&fit=crop&w=100&q=80', category: '수산물' },
];

export const DEFAULT_PANTRY_ITEMS = [
  { name: '간장', amount: '500ml', group: 'sauce', category: '양념' },
  { name: '된장', amount: '500g', group: 'sauce', category: '양념' },
  { name: '고추장', amount: '500g', group: 'sauce', category: '양념' },
  { name: '소금', amount: '200g', group: 'sauce', category: '양념' },
  { name: '알룰로즈', amount: '500ml', group: 'sauce', category: '양념' },
  { name: '맛술', amount: '300ml', group: 'sauce', category: '양념' },
  { name: '무염버터', amount: '200g', group: 'sauce', category: '유제품' },
  { name: '가염버터', amount: '200g', group: 'sauce', category: '유제품' },
  { name: '다진마늘', amount: '200g', group: 'sauce', category: '양념' },
  { name: '국간장', amount: '300ml', group: 'sauce', category: '양념' },
  { name: '아보카도 마요네즈', amount: '300g', group: 'sauce', category: '양념' },
  { name: '엑스트라버진 올리브유', amount: '500ml', group: 'sauce', category: '양념' },
  { name: '코인육수', amount: '20개', group: 'sauce', category: '양념' },
  { name: '파프리카 파우더', amount: '50g', group: 'sauce', category: '양념' },
  { name: '스리라차소스', amount: '200g', group: 'sauce', category: '양념' },
  { name: '레몬즙', amount: '100ml', group: 'sauce', category: '양념' },
  { name: '감자전분', amount: '200g', group: 'sauce', category: '양념' },
  { name: '다시마', amount: '100g', group: 'sauce', category: '양념' },
  { name: '생강슬라이스', amount: '50g', group: 'sauce', category: '양념' },
  { name: '타피오카전분', amount: '200g', group: 'sauce', category: '양념' },
  { name: '고구마전분', amount: '200g', group: 'sauce', category: '양념' },
  { name: '계란', amount: '10알', group: 'staple', category: '신선식품' },
  { name: '냉동새우', amount: '300g', group: 'staple', category: '냉동' },
  { name: '당면', amount: '200g', group: 'staple', category: '가공식품' },
  { name: '대파', amount: '2대', group: 'staple', category: '채소' },
  { name: '무', amount: '1/2개', group: 'staple', category: '채소' },
  { name: '백명란젓', amount: '200g', group: 'staple', category: '수산물' },
  { name: '아보카도', amount: '2개', group: 'staple', category: '채소' },
  { name: '우유', amount: '500ml', group: 'staple', category: '유제품' },
  { name: '모짜렐라치즈', amount: '200g', group: 'staple', category: '유제품' },
  { name: '최겸쌀면', amount: '200g', group: 'staple', category: '가공식품' },
  { name: '양파', amount: '3개', group: 'staple', category: '채소' },
  { name: '쌀', amount: '2kg', group: 'staple', category: '곡물' },
  { name: '병아리콩', amount: '500g', group: 'staple', category: '곡물' },
];

export const MOCK_MEAL_PLAN: MealPlan[] = [
  { day: '월요일', title: '하베스트 그레인 볼', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80' },
  { day: '화요일', title: '루스틱 토마토 펜네', image: 'https://images.unsplash.com/photo-1473093226795-af9932fe5856?auto=format&fit=crop&w=400&q=80' },
  { day: '수요일', title: '로스티드 가든 플래터', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80' },
];

export const MOCK_RECIPES: Recipe[] = [
  {
    id: 'r1',
    title: '허니 글레이즈드 대서양 연어',
    description: '허니 글레이즈와 신선한 허브를 곁들여 팬에 구운 윤기 나는 연어 필레입니다.',
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80',
    time: '45분',
    difficulty: '중급',
    servings: 4,
    calories: 420,
    ingredients: [
      { name: '대서양 연어 필레', amount: '4조각' },
      { name: '유기농 꿀', amount: '1/4컵' },
      { name: '신선한 마늘', amount: '3쪽', isMissing: true },
      { name: '저염 간장', amount: '2큰술' },
      { name: '신선한 레몬', amount: '2개', isMissing: true },
      { name: '훈제 파프리카 가루', amount: '1작은술' },
    ],
    instructions: [
      '마리네이드 준비: 작은 볼에 꿀, 간장, 레몬즙, 다진 마늘을 넣고 섞습니다.',
      '연어 시즈닝: 연어 필레의 물기를 닦아냅니다. 양면에 소금, 후추, 훈제 파프리카 가루로 밑간을 합니다.',
      '껍질 굽기: 큰 팬에 올리브유를 두르고 가열합니다. 연어 껍질이 아래로 가게 놓고 4-5분간 굽습니다.',
      '글레이즈 및 뒤집기: 필레를 뒤집고 마리네이드를 팬에 붓습니다. 소스가 보글보글 끓으며 졸아들게 합니다.',
      '휴지 및 서빙: 신선한 파슬리와 레몬 조각으로 장식합니다. 2분간 휴지시킨 후 서빙합니다.',
    ],
    tags: ['연어', '꿀', '건강식'],
    videoUrl: 'https://www.youtube.com/results?search_query=허니+글레이즈+연어+스테이크',
    matchPercentage: 85,
    isChefsPick: true,
  },
  {
    id: 'r2',
    title: '수제 페스토 펜네',
    description: '방울토마토와 신선한 바질 페스토를 곁들인 펜네 파스타입니다.',
    image: 'https://images.unsplash.com/photo-1473093226795-af9932fe5856?auto=format&fit=crop&w=800&q=80',
    time: '20분',
    difficulty: '초급',
    servings: 2,
    calories: 350,
    ingredients: [
      { name: '펜네 파스타', amount: '250g' },
      { name: '신선한 바질', amount: '1컵' },
      { name: '잣', amount: '2큰술' },
      { name: '파마산 치즈', amount: '1/2컵' },
      { name: '올리브유', amount: '1/4컵' },
    ],
    instructions: [
      '소금물에 파스타를 삶습니다.',
      '바질, 잣, 마늘, 파마산 치즈를 블렌더에 넣고 갑니다.',
      '블렌딩하는 동안 올리브유를 천천히 추가합니다.',
      '파스타를 페스토, 방울토마토와 함께 버무립니다.',
    ],
    tags: ['파스타', '채식', '빠른 요리'],
    matchPercentage: 90,
  }
];
