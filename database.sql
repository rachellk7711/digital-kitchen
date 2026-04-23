-- 1. 팬트리 테이블 (식재료 관리)
CREATE TABLE IF NOT EXISTS pantry (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  amount TEXT,
  group_name TEXT DEFAULT 'main', -- main, staple, sauce, special, urgent
  is_favorite BOOLEAN DEFAULT false,
  icon TEXT DEFAULT 'package',
  category TEXT DEFAULT '기타'
);

-- 2. 레시피 테이블 (AI 생성 및 저장용)
CREATE TABLE IF NOT EXISTS recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image TEXT,
  time TEXT,
  difficulty TEXT,
  servings INTEGER,
  calories INTEGER,
  ingredients JSONB, -- { name, amount, isMissing }[]
  instructions TEXT[],
  tags TEXT[],
  health_point TEXT,
  chef_tip TEXT,
  video_url TEXT,
  is_ai BOOLEAN DEFAULT true,
  source_type TEXT DEFAULT 'ai' -- ai, manual, youtube
);

-- 3. 식단 기록 테이블 (캘린더용)
CREATE TABLE IF NOT EXISTS meal_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  meal_date DATE DEFAULT current_date NOT NULL,
  meal_type TEXT NOT NULL, -- breakfast, lunch, dinner, snack
  recipe_id UUID REFERENCES recipes(id),
  meal_name TEXT,
  notes TEXT
);

-- 4. 셰프 가이드라인 테이블
CREATE TABLE IF NOT EXISTS chef_guidelines (
  id INTEGER PRIMARY KEY DEFAULT 1,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  content JSONB,
  default_pantry_list TEXT[] -- 마스터가 수정 가능한 기본 팬트리 리스트
);

-- 5. 기본 데이터 시딩 (Pantry Initial Data)
-- 주의: 이미 데이터가 있는 경우 중복될 수 있으므로, 초기 설정 시에만 실행을 권장합니다.
INSERT INTO pantry (name, amount, group_name, category)
VALUES 
  ('간장', '500ml', 'sauce', '양념'),
  ('된장', '500g', 'sauce', '양념'),
  ('고추장', '500g', 'sauce', '양념'),
  ('소금', '200g', 'sauce', '양념'),
  ('알룰로즈', '500ml', 'sauce', '양념'),
  ('맛술', '300ml', 'sauce', '양념'),
  ('무염버터', '200g', 'sauce', '유제품'),
  ('가염버터', '200g', 'sauce', '유제품'),
  ('다진마늘', '200g', 'sauce', '양념'),
  ('국간장', '300ml', 'sauce', '양념'),
  ('아보카도 마요네즈', '300g', 'sauce', '양념'),
  ('엑스트라버진 올리브유', '500ml', 'sauce', '양념'),
  ('코인육수', '20개', 'sauce', '양념'),
  ('파프리카 파우더', '50g', 'sauce', '양념'),
  ('스리라차소스', '200g', 'sauce', '양념'),
  ('레몬즙', '100ml', 'sauce', '양념'),
  ('감자전분', '200g', 'sauce', '양념'),
  ('다시마', '100g', 'sauce', '양념'),
  ('생강슬라이스', '50g', 'sauce', '양념'),
  ('타피오카전분', '200g', 'sauce', '양념'),
  ('고구마전분', '200g', 'sauce', '양념'),
  ('계란', '10알', 'staple', '신선식품'),
  ('냉동새우', '300g', 'staple', '냉동'),
  ('당면', '200g', 'staple', '가공식품'),
  ('대파', '2대', 'staple', '채소'),
  ('무', '1/2개', 'staple', '채소'),
  ('백명란젓', '200g', 'staple', '수산물'),
  ('아보카도', '2개', 'staple', '채소'),
  ('우유', '500ml', 'staple', '유제품'),
  ('모짜렐라치즈', '200g', 'staple', '유제품'),
  ('최겸쌀면', '200g', 'staple', '가공식품'),
  ('양파', '3개', 'staple', '채소'),
  ('쌀', '2kg', 'staple', '곡물'),
  ('병아리콩', '500g', 'staple', '곡물');
