import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Timer, SignalHigh, Users, Package, Sparkles, Loader2 } from 'lucide-react';
import { MOCK_RECIPES } from '../constants';
import { Link } from 'react-router-dom';
import { getRecipeRecommendations } from '../services/gemini';
import { supabase } from '../lib/supabase';
import { DEFAULT_PANTRY_ITEMS } from '../constants';
import { cn } from '../lib/utils';
import { Recipe, Ingredient } from '../types';

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
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1 }
};

export default function RecipeList() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<"ok" | "error" | "checking" | "demo">("checking");
  const [loadingStatus, setLoadingStatus] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedSituation, setSelectedSituation] = useState("냉장고 파먹기");
  const [servings, setServings] = useState(4);
  const [pantryItems, setPantryItems] = useState<Ingredient[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [customIngredient, setCustomIngredient] = useState("");

  const situations = [
    { id: "dinner", label: "저녁식사", icon: "🍱" },
    { id: "diet", label: "다이어트", icon: "🥗" },
    { id: "quick", label: "초스피드 간편식사", icon: "⚡" },
    { id: "fridge", label: "냉장고 파먹기", icon: "🧊" },
    { id: "baking", label: "노글루텐베이킹", icon: "🥐" },
    { id: "snack", label: "간식", icon: "🍪" },
    { id: "potrice", label: "솥밥", icon: "🍚" },
  ];

  useEffect(() => {
    const init = async () => {
      await checkDbHealth();
      const items = await fetchPantry();
      await fetchRecipes(items);
    };
    init();
  }, []);

  async function fetchPantry() {
    try {
      const { data, error } = await supabase.from('pantry').select('*');
      if (error) throw error;
      if (data && data.length > 0) {
        setPantryItems(data);
        return data;
      } else {
        // Fallback to default items if DB is empty
        setPantryItems(DEFAULT_PANTRY_ITEMS as any);
        return DEFAULT_PANTRY_ITEMS;
      }
    } catch (error) {
      console.error('Error fetching pantry, using defaults:', error);
      setPantryItems(DEFAULT_PANTRY_ITEMS as any);
      return DEFAULT_PANTRY_ITEMS;
    }
  }

  async function checkDbHealth() {
    try {
      const { error } = await supabase.from('recipes').select('id').limit(1);
      if (error) {
        // PGRST116: No rows, 42P01: Table not found
        const isUnconfigured = 
          error.message?.includes("Supabase 설정") || 
          error.code === "PGRST116" || 
          error.code === "42P01" || 
          !supabase;
        
        setDbStatus(isUnconfigured ? "demo" : "error");
        console.error("DB Health Check Failed:", error);
      } else {
        setDbStatus("ok");
      }
    } catch (e) {
      setDbStatus("demo");
    }
  }

  async function fetchRecipes(currentPantryItems?: Ingredient[]) {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false });
      
      const itemsToUse = currentPantryItems || pantryItems;
      const pantryNames = itemsToUse.map(i => i.name.toLowerCase());
      const staples = ['소금', '후추', '알룰로스', '알룰로즈', '물', '식용유', '올리브유', '간장', '액젓', '참기름', '들기름', '고춧가루', '다진 마늘'];

      const processRecipe = (r: any) => ({
        ...r,
        healthPoint: r.health_point || r.healthPoint,
        chefTip: r.chef_tip || r.chefTip,
        videoUrl: r.video_url || r.videoUrl,
        isAI: r.is_ai || r.isAI,
        ingredients: (r.ingredients || []).map((ing: any) => {
          const nameLower = ing.name.toLowerCase().trim();
          const cleanName = nameLower.replace(/\s+/g, '');
          const isStaple = staples.some(s => nameLower.includes(s.toLowerCase()));
          const isOwned = pantryNames.some(p => {
            const cleanP = p.replace(/\s+/g, '');
            return cleanP.includes(cleanName) || cleanName.includes(cleanP);
          });
          return { ...ing, isMissing: !isStaple && !isOwned };
        })
      });

      if (error) throw error;
      if (data && data.length > 0) {
        setRecipes(data.map(processRecipe));
      } else {
        setRecipes((MOCK_RECIPES as any).map(processRecipe));
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
      const pantryNames = pantryItems.map(i => i.name.toLowerCase().trim());
      const staples = ['소금', '후추', '알룰로스', '알룰로즈', '물', '식용유', '올리브유', '간장', '액젓', '참기름', '들기름', '고춧가루', '다진 마늘'];
      setRecipes((MOCK_RECIPES as any).map((r: any) => ({
        ...r,
        ingredients: (r.ingredients || []).map((ing: any) => {
          const nameLower = ing.name.toLowerCase().trim();
          const cleanName = nameLower.replace(/\s+/g, '');
          const isStaple = staples.some(s => nameLower.includes(s.toLowerCase()));
          const isOwned = pantryNames.some(p => {
            const cleanP = p.replace(/\s+/g, '');
            return cleanP.includes(cleanName) || cleanName.includes(cleanP);
          });
          return { ...ing, isMissing: !isStaple && !isOwned };
        })
      })));
    }
  }

  const handleGenerateAI = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setLoadingStatus("준비 중...");
    try {
      // Use selected ingredients if any, otherwise use sample or fetch all
      let ingredientsToUse = selectedIngredients;
      
      if (ingredientsToUse.length === 0) {
        setLoadingStatus("팬트리 재료 확인 중...");
        const { data: pantryData } = await supabase.from('pantry').select('name');
        ingredientsToUse = pantryData && pantryData.length > 0 
          ? pantryData.map(i => i.name) 
          : ['계란', '두부', '파', '쌀가루'];
      }

      setLoadingStatus("AI 셰프가 레시피 구성 중 (약 10-20초 소요)...");
      
      let customGuidelines = null;
      try {
        const { data } = await supabase.from('chef_guidelines').select('content').single();
        if (data) customGuidelines = data.content;
      } catch (e) {
        // Use local storage fallback
        const local = localStorage.getItem('chef_guidelines');
        if (local) customGuidelines = JSON.parse(local);
      }

      const aiRecipes = await getRecipeRecommendations(ingredientsToUse, selectedSituation, servings, customGuidelines);
      
      if (!aiRecipes || aiRecipes.length === 0) {
        throw new Error("AI returned no results or empty response.");
      }
      
      setLoadingStatus("건강 레시피 저장 중...");
      const pantryNames = pantryItems.map(i => i.name.toLowerCase().trim());
      const staples = ['소금', '후추', '알룰로스', '알룰로즈', '물', '식용유', '올리브유', '간장', '액젓', '참기름', '들기름', '고춧가루', '다진 마늘'];

      const formattedRecipes = aiRecipes.map((r: any, idx: number) => ({
        title: r.title,
        description: r.description,
        image: `https://images.unsplash.com/photo-1504674900247?auto=format&fit=crop&w=800&q=80&sig=${Date.now()}-${idx}`,
        time: r.time,
        difficulty: r.difficulty || "중급",
        servings: Number(r.servings) || servings,
        calories: Number(r.calories) || 0,
        ingredients: (r.ingredients || []).map((ing: any) => {
          const nameLower = ing.name.toLowerCase().trim();
          const cleanName = nameLower.replace(/\s+/g, '');
          const isStaple = staples.some(s => nameLower.includes(s.toLowerCase()));
          const isOwned = pantryNames.some(p => {
            const cleanP = p.replace(/\s+/g, '');
            return cleanP.includes(cleanName) || cleanName.includes(cleanP);
          });
          return {
            ...ing,
            isMissing: !isStaple && !isOwned
          };
        }),
        instructions: r.instructions || [],
        tags: r.tags || [],
        health_point: r.healthPoint || r.health_point,
        chef_tip: r.chefTip || r.chef_tip,
        video_url: r.videoUrl || r.video_url,
        is_ai: true
      }));

      // Store to Supabase
      const { data: insertedData, error: insertError } = await supabase.from('recipes').insert(formattedRecipes).select();
      
      if (insertError) {
        console.warn('DB 저장 실패, 로컬 표시로 전환:', insertError);
        const localMapped = formattedRecipes.map((r, i) => ({ 
          ...r, 
          id: `local-${Date.now()}-${i}`, 
          healthPoint: r.health_point, 
          chefTip: r.chef_tip, 
          isAI: r.is_ai 
        }));
        setRecipes([...localMapped as any, ...recipes]);
        setLoadingStatus("저장은 실패했으나 화면에 우선 표시합니다.");
        setErrorMessage(`Database Save Error: ${insertError.message}`);
        setTimeout(() => setLoadingStatus(""), 5000);
        return;
      }

      if (insertedData) {
        const mappedNew = insertedData.map(r => ({
          ...r,
          healthPoint: r.health_point,
          chefTip: r.chef_tip,
          videoUrl: r.video_url,
          isAI: r.is_ai
        }));
        setRecipes([...mappedNew, ...recipes]);
        setLoadingStatus("새로운 레시피 도착!");
        setTimeout(() => setLoadingStatus(""), 2000);
      }
    } catch (error: any) {
      console.error('Error in handleGenerateAI:', error);
      const rawError = error?.message || String(error);
      setErrorMessage(`AI 셰프와의 연결에 문제가 발생했습니다: ${rawError}. 잠시 후 다시 시도해 주세요.`);
      setLoadingStatus("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="px-6 py-8 space-y-8"
    >
      <motion.section variants={item}>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex-1">
            <span className="font-body text-secondary font-semibold tracking-wider text-sm mb-2 block uppercase font-bold text-primary">퍼스널 웰니스 셰프 제안</span>
            <h2 className="font-headline text-4xl md:text-5xl font-extrabold text-on-surface leading-tight">오늘의 건강 미식</h2>
            <p className="text-on-surface-variant mt-2 max-w-md">밀가루와 씨앗 기름 없이, 조리 과학과 미식을 결합한 최상의 한 끼를 경험하세요.</p>
          </div>
          {dbStatus === "demo" && (
            <div className="bg-surface-container-low px-4 py-2 rounded-2xl border border-surface-container flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-bold text-on-surface-variant">데모 모드 (오프라인)</span>
            </div>
          )}
        </div>
      </motion.section>

      {/* 상황 선택 및 인원수 설정 섹션 */}
      <motion.section variants={item} className="space-y-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-surface-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-on-surface-variant flex items-center gap-2">
                  <Sparkles size={16} className="text-primary" />
                  상황별 맞춤 가이드 선택
                </h3>
                <div className="flex flex-wrap gap-2">
                  {situations.map((sit) => (
                    <button
                      key={sit.id}
                      onClick={() => setSelectedSituation(sit.label)}
                      className={cn(
                        "px-4 py-2 rounded-xl font-bold transition-all border-2 text-sm",
                        selectedSituation === sit.label 
                          ? "bg-primary border-primary text-white shadow-md scale-[1.02]" 
                          : "bg-surface-container-low border-surface-container text-on-surface-variant hover:border-primary/30"
                      )}
                    >
                      <span className="mr-2">{sit.icon}</span>
                      {sit.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-on-surface-variant flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <Package size={16} className="text-primary" />
                    주재료 직접 선택 (팬트리)
                  </div>
                  <button 
                    onClick={() => fetchPantry()}
                    className="flex items-center gap-1 text-[10px] bg-secondary/10 text-secondary px-2 py-1 rounded-lg hover:bg-secondary/20 transition-all active:rotate-180 duration-500"
                    title="팬트리 새로고침"
                  >
                    <Loader2 size={10} className={cn(loadingStatus.includes("팬트리") && "animate-spin")} />
                    새로고침
                  </button>
                </h3>
                <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-1 no-scrollbar bg-surface-container-low/30 rounded-2xl">
                  {pantryItems.length > 0 ? pantryItems
                    .filter(ing => {
                      const seasonings = ['소금', '후추', '알룰로스', '알룰로즈', '물', '식용유', '올리브유', '간장', '액젓', '참기름', '들기름', '고춧가루', '다진 마늘', '된장', '고추장', '맛술', '식초', '국간장', '코인육수'];
                      const isSauceGroup = (ing.group || 'main') === 'sauce';
                      const isSeasoningName = seasonings.some(s => ing.name.includes(s));
                      return !isSauceGroup && !isSeasoningName;
                    })
                    .sort((a, b) => {
                      const groupOrder: Record<string, number> = { urgent: 0, main: 1, special: 2, staple: 3 };
                      const orderA = groupOrder[a.group || ''] ?? 99;
                      const orderB = groupOrder[b.group || ''] ?? 99;
                      if (orderA !== orderB) return orderA - orderB;
                      return a.name.localeCompare(b.name);
                    })
                    .map((ing) => (
                    <button
                      key={ing.id}
                      type="button"
                      onClick={() => {
                        setSelectedIngredients(prev => 
                          prev.includes(ing.name) 
                            ? prev.filter(n => n !== ing.name) 
                            : [...prev, ing.name]
                        );
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5",
                        selectedIngredients.includes(ing.name)
                          ? "bg-secondary border-secondary text-white shadow-sm"
                          : ing.group === 'urgent'
                            ? "bg-orange-50 border-orange-300 text-orange-700 hover:bg-orange-100"
                            : "bg-white border-surface-container text-on-surface-variant hover:border-secondary/30"
                      )}
                    >
                      {ing.group === 'urgent' && <span className="text-[10px]">⏰</span>}
                      {ing.name}
                    </button>
                  )) : (
                    <p className="text-xs text-on-surface-variant italic p-2">팬트리가 비어있습니다.</p>
                  )}
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">추가 재료 입력</h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customIngredient}
                      onChange={(e) => setCustomIngredient(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = customIngredient.trim();
                          if (val) {
                            const alreadyExists = selectedIngredients.some(
                              (item) => item.toLowerCase().trim() === val.toLowerCase().trim()
                            );
                            if (!alreadyExists) {
                              setSelectedIngredients(prev => [...prev, val]);
                            }
                            setCustomIngredient("");
                          }
                        }
                      }}
                      placeholder="예: 랍스터, 전복..."
                      className="flex-1 px-4 py-3 bg-white border border-surface-container rounded-xl text-xs outline-none focus:border-primary transition-all font-body shadow-inner-sm"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        const val = customIngredient.trim();
                        if (val) {
                          const alreadyExists = selectedIngredients.some(
                            (item) => item.toLowerCase().trim() === val.toLowerCase().trim()
                          );
                          if (!alreadyExists) {
                            setSelectedIngredients(prev => [...prev, val]);
                          }
                          setCustomIngredient("");
                        }
                      }}
                      className="px-6 py-2 bg-primary text-on-primary rounded-xl text-xs font-black hover:opacity-90 transition-all active:scale-95 shadow-md shadow-primary/20"
                    >
                      추가
                    </button>
                  </div>
                </div>

                {selectedIngredients.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-surface-container/50 mt-4">
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-widest px-1">선택된 식재료 ({selectedIngredients.length})</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedIngredients.map((name) => {
                        const pantryItem = pantryItems.find(p => p.name === name);
                        const isUrgent = pantryItem?.group === 'urgent';
                        return (
                          <button
                            key={name}
                            type="button"
                            onClick={() => {
                              setSelectedIngredients(prev => prev.filter(n => n !== name));
                            }}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-[10px] font-black transition-all border flex items-center gap-1.5",
                              isUrgent 
                                ? "bg-orange-100 border-orange-300 text-orange-700" 
                                : "bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
                            )}
                          >
                            {isUrgent && <span>⏰</span>}
                            {name}
                            <span className="text-[8px]">✕</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-on-surface-variant flex items-center gap-2">
                <Users size={16} className="text-primary" />
                식사 인원수 설정
              </h3>
              <div className="flex items-center gap-6 bg-surface-container-low p-2 rounded-2xl border border-surface-container w-full max-w-[240px]">
                <button 
                  onClick={() => setServings(Math.max(1, servings - 1))}
                  className="w-12 h-12 flex items-center justify-center bg-white rounded-xl shadow-sm hover:bg-primary hover:text-white transition-all font-bold text-xl active:scale-90"
                >
                  -
                </button>
                <div className="flex-1 text-center">
                  <span className="text-2xl font-headline font-bold text-on-surface">{servings}</span>
                  <span className="ml-1 text-on-surface-variant font-bold">인분</span>
                </div>
                <button 
                  onClick={() => setServings(Math.min(20, servings + 1))}
                  className="w-12 h-12 flex items-center justify-center bg-white rounded-xl shadow-sm hover:bg-primary hover:text-white transition-all font-bold text-xl active:scale-90"
                >
                  +
                </button>
              </div>
              <p className="text-xs text-on-surface-variant">4인 가구를 기준으로 정량 레시피가 제공됩니다.</p>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section variants={item}>
        <button 
          onClick={handleGenerateAI}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary px-6 py-5 rounded-[2.5rem] flex items-center justify-center gap-3 font-headline text-lg font-bold shadow-xl shadow-primary/20 hover:opacity-95 active:scale-95 transition-all disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" size={24} />
              <div className="flex flex-col items-start leading-tight">
                <span className="text-sm opacity-80">셰프가 레시피를 구상 중입니다...</span>
                <span className="text-xs font-normal">{loadingStatus}</span>
              </div>
            </>
          ) : (
            <>
              <Sparkles size={24} />
              <span>{selectedSituation} ({servings}인분) AI 레시피 생성하기</span>
            </>
          )}
        </button>
        {errorMessage && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <p className="text-xs font-bold text-red-500 mb-1">시스템 에러 발생 (개발 참고용):</p>
            <p className="text-sm text-red-700 font-mono break-all">{errorMessage}</p>
            <button 
              onClick={() => setErrorMessage(null)}
              className="mt-2 text-xs text-red-400 hover:text-red-500 underline"
            >
              에러 메시지 닫기
            </button>
          </div>
        )}
        {dbStatus === "error" && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <p className="text-sm font-bold text-red-700">⚠️ 데이터베이스 연결 오류</p>
            <p className="text-xs text-red-600 mt-1">
              데이터베이스 연결에 문제가 발생했습니다. 네트워크 상태를 확인하거나 잠시 후 다시 시도해 주세요.
            </p>
          </div>
        )}
      </motion.section>

      <AnimatePresence mode="wait">
        <div className="space-y-6">
          {recipes.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-between mb-2"
            >
              <div className="flex items-center gap-2">
                <div className="h-6 w-1.5 bg-primary rounded-full" />
                <h3 className="font-headline text-xl font-bold">웰니스 셰프의 추천 미식</h3>
              </div>
              <span className="text-xs font-bold text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">
                총 {recipes.length}개
              </span>
            </motion.div>
          )}
          
          <motion.div 
            key={recipes[0]?.id || 'empty'}
            initial="hidden"
            animate="show"
            exit="exit"
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: { 
                opacity: 1, 
                y: 0,
                transition: { staggerChildren: 0.1 }
              },
              exit: { opacity: 0, y: -20 }
            }}
            className="grid grid-cols-1 md:grid-cols-12 gap-6"
          >
            {recipes.map((recipe, index) => {
              const isFeatured = index === 0;
              return (
                <motion.div 
                  key={recipe.id || `recipe-${index}-${Date.now()}`} 
                  variants={item} 
                  className={cn(
                    "group",
                    isFeatured ? "md:col-span-8" : "md:col-span-4"
                  )}
                >
                  <Link to={`/recipe/${recipe.id}`} className="block bg-white h-full rounded-[2rem] overflow-hidden transition-all duration-500 hover:translate-y-[-4px] shadow-sm border border-surface-container">
                    <div className={cn("relative", isFeatured ? "h-[400px]" : "h-[240px]")}>
                      <img
                        alt={recipe.title}
                        className="w-full h-full object-cover"
                        src={recipe.image || `https://images.unsplash.com/photo-1504674900247?auto=format&fit=crop&w=800&q=80&sig=${index}`}
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                      <div className="absolute top-6 left-6 flex gap-2">
                        <span className="bg-primary/90 text-white px-4 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm">
                          {recipe.isAI ? 'AI 생성' : "셰프의 선택"}
                        </span>
                        {isFeatured && (
                          <span className="bg-white/90 text-primary px-4 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm">최고의 추천</span>
                        )}
                      </div>
                    </div>
                    
                    <div className={cn("p-6", isFeatured && "md:p-8")}>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className={cn("font-headline font-bold mb-2 truncate", isFeatured ? "text-3xl" : "text-xl")}>
                            {recipe.title || "제목 없는 레시피"}
                          </h3>
                          {recipe.healthPoint && isFeatured && (
                            <div className="flex items-center gap-2 mb-4 bg-primary/5 p-3 rounded-xl border border-primary/10">
                              <Sparkles size={16} className="text-primary flex-shrink-0" />
                              <p className="text-sm font-bold text-primary truncate">{recipe.healthPoint}</p>
                            </div>
                          )}
                          <div className="flex items-center gap-4 text-on-surface-variant font-medium text-sm">
                            <div className="flex items-center gap-1">
                              <Timer size={16} />
                              <span>{recipe.time || "정보 없음"}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <SignalHigh size={16} />
                              <span>{recipe.difficulty || "중급"}</span>
                            </div>
                          </div>
                        </div>
                        {isFeatured && (
                          <div className="bg-primary text-white p-4 rounded-2xl transition-colors group-hover:bg-primary-container ml-4">
                            <Play size={24} fill="currentColor" />
                          </div>
                        )}
                      </div>
                      
                      {!isFeatured && (
                        <div className="w-full py-3 mt-2 rounded-xl border border-primary text-primary font-bold flex items-center justify-center hover:bg-primary/5 transition-colors text-sm">
                          상세 보기
                        </div>
                      )}
                      
                      {isFeatured && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {recipe.tags?.slice(0, 3).map((tag: string, i: number) => (
                            <span key={i} className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-lg text-xs font-semibold">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </AnimatePresence>
    </motion.div>
  );
}
