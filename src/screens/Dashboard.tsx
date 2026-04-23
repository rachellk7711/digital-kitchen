import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, Egg, Leaf, Drumstick, Utensils, Timer, CheckCircle, Circle, Package } from 'lucide-react';
import { MOCK_INGREDIENTS, MOCK_MEAL_PLAN } from '../constants';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Ingredient } from '../types';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function Dashboard() {
  const [pantryItems, setPantryItems] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPantry();
  }, []);

  async function fetchPantry() {
    try {
      const { data } = await supabase
        .from('pantry')
        .select('*')
        .limit(6);
      if (data) setPantryItems(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const inventoryItems = pantryItems.length > 0 ? pantryItems : MOCK_INGREDIENTS;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="px-6 py-8 space-y-12"
    >
      {/* Hero Greeting Section */}
      <motion.section
        variants={item}
        className="relative overflow-hidden bg-surface-container-low rounded-[2rem] p-8 md:p-12 flex flex-col md:flex-row items-center gap-8"
      >
        <div className="flex-1 space-y-4">
          <span className="inline-block px-4 py-1 rounded-full bg-secondary-container text-on-secondary-container font-body text-sm font-semibold">
            저녁 식사까지 2시간 남았습니다
          </span>
          <h2 className="text-4xl md:text-5xl font-headline font-extrabold text-on-surface leading-tight">
            오늘도 <span className="text-primary">최고의 미식을 시작해볼까요?</span>
          </h2>
          <p className="text-on-surface-variant text-lg max-w-md">
            밀가루와 씨앗 기름 없이도 충분히 맛있고 풍성한 식탁을 제안합니다.
          </p>
          <div className="pt-4">
            <Link
              to="/recipes"
              className="inline-flex items-center gap-3 bg-gradient-to-br from-primary to-primary-container text-on-primary px-8 py-4 rounded-xl font-headline font-bold text-lg shadow-lg hover:opacity-90 active:scale-95 transition-all"
            >
              레시피 추천 받기
              <Sparkles size={20} />
            </Link>
          </div>
        </div>
        <div className="w-full md:w-1/2 aspect-square md:aspect-video rounded-[2.5rem] overflow-hidden shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500">
          <img
            alt="Healthy Korean kitchen atmosphere"
            className="w-full h-full object-cover"
            src="https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80"
            referrerPolicy="no-referrer"
          />
        </div>
      </motion.section>

      {/* Bento Grid: Pantry & Countdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* What's in your fridge? Section */}
        <motion.section
          variants={item}
          className="md:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-surface-container"
        >
          <div className="flex justify-between items-end mb-8">
            <div>
              <h3 className="text-2xl font-headline font-bold text-on-surface">냉장고에 무엇이 있나요?</h3>
              <p className="text-on-surface-variant">현재 재고 현황 요약</p>
            </div>
            <Link to="/pantry" className="text-primary font-body font-bold flex items-center gap-1 hover:underline">
              팬트리 보기
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 no-scrollbar">
            {inventoryItems.map((ing) => (
              <div key={ing.id} className="flex-shrink-0 bg-secondary-container/20 p-6 rounded-2xl flex flex-col items-center gap-3 w-32 border border-secondary-container/30">
                {ing.icon === 'egg' && <Egg className="text-secondary" size={32} />}
                {ing.icon === 'leaf' && <Leaf className="text-secondary" size={32} />}
                {ing.icon === 'drumstick' && <Drumstick className="text-secondary" size={32} />}
                {(ing.icon === 'bread' || ing.icon === 'cheese' || ing.icon === 'package') && <Package className="text-secondary" size={32} />}
                {!['egg', 'leaf', 'drumstick', 'bread', 'cheese', 'package'].includes(ing.icon || '') && <Utensils className="text-secondary" size={32} />}
                <span className="font-body text-sm font-bold truncate w-full text-center">{ing.name}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 p-6 bg-surface-container-low rounded-2xl border-l-4 border-primary-container flex items-center gap-4">
            <Sparkles className="text-primary-container" size={24} />
            <p className="text-sm font-medium">
              좋아하시는 메뉴를 포함해 <span className="text-primary font-bold">{pantryItems.length > 0 ? pantryItems.length : 7}가지 이상의 요리</span>가 가능합니다!
            </p>
          </div>
        </motion.section>

        {/* Dinner Countdown Widget */}
        <motion.section
          variants={item}
          className="bg-surface-container-high rounded-3xl p-8 flex flex-col justify-between"
        >
          <div>
            <h3 className="text-xl font-headline font-bold mb-2">미식 준비 카운트다운</h3>
            <p className="text-on-surface-variant text-sm mb-6">목표 시간: 오후 7:00</p>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-5xl font-headline font-extrabold text-primary">01</span>
              <span className="text-2xl font-headline font-bold text-on-surface-variant">:</span>
              <span className="text-5xl font-headline font-extrabold text-primary">42</span>
              <span className="ml-2 text-on-surface-variant font-body text-xs uppercase tracking-widest">후 완성</span>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-white/50 p-3 rounded-xl">
              <CheckCircle size={20} className="text-secondary fill-secondary/20" />
              <span className="text-sm font-medium">식재료 준비 완료</span>
            </div>
            <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-primary-container/20">
              <Circle size={20} className="text-primary" />
              <span className="text-sm font-bold">예열 시작 (400°F)</span>
            </div>
          </div>
        </motion.section>
      </div>

      {/* Meal Planning Section */}
      <motion.section variants={item}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-headline font-bold text-on-surface">금주의 미식 계획</h3>
          <div className="flex gap-2">
            <button className="p-2 rounded-full hover:bg-surface-container-low text-on-surface-variant">
              <ArrowRight className="rotate-180" size={20} />
            </button>
            <button className="p-2 rounded-full hover:bg-surface-container-low text-on-surface-variant">
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {MOCK_MEAL_PLAN.map((meal, idx) => (
            <Link 
              to={`/recipe/r${idx + 1}`} 
              key={idx} 
              className="group relative bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow border border-surface-container block"
            >
              <div className="w-full aspect-[4/3] mb-4 overflow-hidden rounded-xl">
                <img
                  alt={meal.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  src={meal.image}
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-secondary mb-1 block">{meal.day}</span>
              <h4 className="font-headline font-bold text-on-surface leading-tight">{meal.title}</h4>
            </Link>
          ))}
          <Link 
            to="/recipes"
            className="group relative bg-primary-container/5 border-2 border-dashed border-primary-container/20 rounded-2xl p-4 flex flex-col items-center justify-center text-center min-h-[200px] hover:bg-primary-container/10 transition-all"
          >
            <div className="w-12 h-12 rounded-full bg-primary-container/10 flex items-center justify-center text-primary mb-3">
              <Utensils size={24} />
            </div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-primary mb-1 block">목요일</span>
            <h4 className="font-headline font-bold text-primary leading-tight">식단 계획하기</h4>
          </Link>
        </div>
      </motion.section>
    </motion.div>
  );
}
