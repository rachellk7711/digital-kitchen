import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Share2, Users, Timer, ChefHat, Flame, CheckCircle, XCircle, ShoppingBasket, PlayCircle, Lightbulb, Refrigerator, Sparkles, Loader2, MessageCircle, Send, PlusCircle } from 'lucide-react';
import { MOCK_RECIPES } from '../constants';
import { supabase } from '../lib/supabase';
import { Recipe } from '../types';
import { cn } from '../lib/utils';
import { refineRecipe } from '../services/gemini';
import { motion, AnimatePresence } from 'motion/react';

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [refineQuery, setRefineQuery] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [refinementHistory, setRefinementHistory] = useState<{question: string, date: string}[]>([]);

  useEffect(() => {
    fetchRecipe();
  }, [id]);

  async function fetchRecipe() {
    try {
      setLoading(true);
      const { data: pantryData } = await supabase.from('pantry').select('name');
      const pantryNames = pantryData?.map(i => i.name.toLowerCase()) || [];
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
            const cleanP = p.toLowerCase().trim().replace(/\s+/g, '');
            return cleanP.includes(cleanName) || cleanName.includes(cleanP);
          });
          return { ...ing, isMissing: !isStaple && !isOwned };
        })
      });

      // First check mock data
      const mock = MOCK_RECIPES.find((r) => r.id === id);
      if (mock) {
        setRecipe(processRecipe(mock));
        return;
      }

      // Then check Supabase
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        const { data: aiData } = await supabase
          .from('recipes')
          .select('*')
          .eq('title', id)
          .maybeSingle();
        
        if (aiData) {
          setRecipe(processRecipe(aiData));
        } else {
          setRecipe(processRecipe(MOCK_RECIPES[0]));
        }
      } else if (data) {
        setRecipe(processRecipe(data));
      }
    } catch (error) {
      console.error('Error fetching recipe detail:', error);
      setRecipe(MOCK_RECIPES[0] as any);
    } finally {
      setLoading(false);
    }
  }

  const handleRefine = async () => {
    if (!refineQuery.trim() || !recipe) return;

    try {
      setIsRefining(true);
      const updatedRecipe = await refineRecipe(recipe, refineQuery);
      
      // Re-apply missing ingredient markers to the new recipe
      const { data: pantryData } = await supabase.from('pantry').select('name');
      const pantryNames = pantryData?.map(i => i.name.toLowerCase()) || [];
      const staples = ['소금', '후추', '알룰로스', '알룰로즈', '물', '식용유', '올리브유', '간장', '액젓', '참기름', '들기름', '고춧가루', '다진 마늘'];

      const processed = {
        ...updatedRecipe,
        healthPoint: updatedRecipe.health_point || updatedRecipe.healthPoint,
        chefTip: updatedRecipe.chef_tip || updatedRecipe.chefTip,
        videoUrl: updatedRecipe.video_url || updatedRecipe.videoUrl,
        isAI: updatedRecipe.is_ai || updatedRecipe.isAI || true,
        ingredients: (updatedRecipe.ingredients || []).map((ing: any) => {
          const nameLower = ing.name.toLowerCase().trim();
          const cleanName = nameLower.replace(/\s+/g, '');
          const isStaple = staples.some(s => nameLower.includes(s.toLowerCase()));
          const isOwned = pantryNames.some(p => {
            const cleanP = p.toLowerCase().trim().replace(/\s+/g, '');
            return cleanP.includes(cleanName) || cleanName.includes(cleanP);
          });
          return { ...ing, isMissing: !isStaple && !isOwned };
        })
      };

      setRecipe(processed);
      setRefinementHistory(prev => [{question: refineQuery, date: new Date().toLocaleTimeString()}, ...prev]);
      setRefineQuery("");
      setCompletedSteps([]); // Reset steps since instructions changed
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error("Refine failed:", err);
      alert("레시피 수정 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setIsRefining(false);
    }
  };

  const toggleStep = (idx: number) => {
    setCompletedSteps((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  const mainIngredient = recipe.ingredients[0]?.name || "";
  const videoSearchUrl = recipe.videoUrl || `https://www.youtube.com/results?search_query=${encodeURIComponent(recipe.title + " " + mainIngredient + " 노밀가루 웰니스 레시피")}`;

  return (
    <div className="pb-32">
      {/* Hero Section */}
      <section className="relative px-4 pt-4">
        <div className="aspect-[16/9] md:aspect-[21/9] rounded-[2rem] overflow-hidden relative shadow-lg">
          <img
            className="w-full h-full object-cover"
            alt={recipe.title}
            src={recipe.image}
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-on-surface/60 via-transparent to-transparent"></div>
          <div className="absolute bottom-8 left-8 right-8">
            <h1 className="font-headline text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight">
              {recipe.title}
            </h1>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="absolute top-6 left-6 p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="absolute top-6 right-6 flex gap-3">
            <button className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors">
              <Heart size={24} />
            </button>
            <button className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors">
              <Share2 size={24} />
            </button>
          </div>
        </div>
      </section>

      {/* Stats Bento Grid */}
      <section className="px-4 mt-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <button 
            onClick={() => navigate(`/recipe/${id}/modify`)}
            className="flex-1 py-5 bg-primary/10 text-primary border-2 border-primary/20 rounded-[1.5rem] font-headline font-extrabold text-lg flex items-center justify-center gap-3 hover:bg-primary/20 transition-all active:scale-95"
          >
            <ChefHat size={24} />
            내 입맛대로 수정하여 요리하기
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface-container-low p-6 rounded-[1.5rem] flex flex-col items-center justify-center text-center">
            <Users className="text-primary mb-2" size={24} />
            <span className="font-headline font-bold text-lg">{recipe.servings}인분</span>
            <span className="text-on-surface-variant text-sm">가족용으로 적합</span>
          </div>
          <div className="bg-surface-container-low p-6 rounded-[1.5rem] flex flex-col items-center justify-center text-center">
            <Timer className="text-primary mb-2" size={24} />
            <span className="font-headline font-bold text-lg">{recipe.time}</span>
            <span className="text-on-surface-variant text-sm">총 요리 시간</span>
          </div>
          <div className="bg-surface-container-low p-6 rounded-[1.5rem] flex flex-col items-center justify-center text-center">
            <ChefHat className="text-primary mb-2" size={24} />
            <span className="font-headline font-bold text-lg">{recipe.difficulty}</span>
            <span className="text-on-surface-variant text-sm">난이도</span>
          </div>
          <div className="bg-surface-container-low p-6 rounded-[1.5rem] flex flex-col items-center justify-center text-center">
            <Flame className="text-primary mb-2" size={24} />
            <span className="font-headline font-bold text-lg">{recipe.calories} kcal</span>
            <span className="text-on-surface-variant text-sm">1인분 기준</span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 mt-12">
        {/* Ingredients Section */}
        <div className="lg:col-span-4 space-y-6">
          {recipe.healthPoint && (
            <div className="bg-primary/10 rounded-[2rem] p-6 border border-primary/20">
              <h3 className="font-headline font-extrabold text-primary mb-2 flex items-center gap-2">
                <Sparkles size={20} />
                건강 포인트
              </h3>
              <p className="text-sm font-bold text-on-surface leading-relaxed">
                {recipe.healthPoint}
              </p>
            </div>
          )}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-surface-container">
            <h2 className="font-headline text-2xl font-bold mb-6 flex items-center gap-2">
              <Refrigerator className="text-primary" size={24} />
              필요한 재료
            </h2>
            <div className="space-y-4">
              {recipe.ingredients.map((ing, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-2xl transition-all duration-300",
                    ing.isMissing 
                      ? "bg-red-50/80 border-2 border-red-200 shadow-sm" 
                      : "bg-surface-container-low border border-transparent"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {ing.isMissing ? (
                      <XCircle size={22} className="text-red-500 fill-white" />
                    ) : (
                      <CheckCircle size={22} className="text-secondary fill-white" />
                    )}
                    <span className={cn(
                      "font-bold text-sm", 
                      ing.isMissing ? "text-red-800" : "text-on-surface"
                    )}>
                      {ing.name}
                    </span>
                  </div>
                  <span className={cn(
                    "text-xs font-black", 
                    ing.isMissing ? "text-red-600" : "text-on-surface-variant"
                  )}>
                    {ing.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {videoSearchUrl && (
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-surface-container overflow-hidden">
              <h3 className="font-headline font-bold text-lg mb-4 flex items-center gap-2">
                <PlayCircle className="text-red-600" size={20} />
                참고 영상 추천
              </h3>
              <div className="aspect-video bg-surface-container rounded-xl overflow-hidden relative group">
                {videoSearchUrl.includes("embed") ? (
                  <iframe 
                    className="w-full h-full"
                    src={videoSearchUrl}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
                ) : (
                  <a 
                    href={videoSearchUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center h-full text-center p-6 hover:bg-red-50/50 transition-all group/link"
                  >
                    <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mb-3 shadow-lg group-hover/link:scale-110 transition-transform">
                      <PlayCircle size={32} className="text-white fill-white" />
                    </div>
                    <span className="text-base font-bold text-on-surface">유튜브에서 요리법 보기</span>
                    <p className="text-[11px] text-on-surface-variant mt-2 px-4 leading-relaxed max-w-[200px] line-clamp-2 italic opacity-70 group-hover/link:opacity-100">
                      {videoSearchUrl}
                    </p>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Instructions Section */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-surface-container">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-headline text-2xl font-bold flex items-center gap-2">
                <ChefHat className="text-primary" size={24} />
                단계별 조리법
              </h2>
              <span className="bg-primary-container/20 text-primary px-4 py-1.5 rounded-full font-bold text-sm uppercase tracking-wider">
                {completedSteps.length}/{recipe.instructions.length} 완료
              </span>
            </div>
            <div className="space-y-6">
              {recipe.instructions.map((step, idx) => (
                <div key={idx} className="flex gap-6 group">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors",
                        completedSteps.includes(idx) ? "bg-secondary text-white" : "bg-surface-container-high text-on-surface-variant"
                      )}
                    >
                      {idx + 1}
                    </div>
                    {idx < recipe.instructions.length - 1 && (
                      <div className="w-0.5 h-full bg-surface-container-high mt-2"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="flex items-start justify-between">
                      <h3 className={cn("font-headline font-bold text-lg mb-2 transition-colors", completedSteps.includes(idx) && "text-on-surface-variant line-through")}>
                        {idx + 1}단계
                      </h3>
                      <input
                        type="checkbox"
                        checked={completedSteps.includes(idx)}
                        onChange={() => toggleStep(idx)}
                        className="w-6 h-6 rounded-md border-surface-container text-primary focus:ring-primary"
                      />
                    </div>
                    <p className={cn("text-on-surface-variant leading-relaxed transition-colors", completedSteps.includes(idx) && "opacity-50")}>
                      {step}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Refinement Box */}
            <div className="mt-12 pt-8 border-t border-surface-container/50">
              <div className="flex items-center gap-2 mb-4">
                <MessageCircle className="text-secondary" size={20} />
                <h3 className="font-headline font-bold text-lg">셰프에게 레시피 수정 요청하기</h3>
              </div>
              <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">
                "냉동 새우는 미리 익혀야 하지 않을까?", "매운맛을 더 추가해줘" 등 조리법에 대해 궁금한 점이나 수정하고 싶은 부분을 말씀해 주세요.
              </p>
              
              <div className="relative">
                <textarea
                  value={refineQuery}
                  onChange={(e) => setRefineQuery(e.target.value)}
                  placeholder="예: 조리 단계에서 새우를 익히는 과정을 더 자세히 알려줘"
                  rows={3}
                  className="w-full bg-surface-container-low border border-surface-container rounded-2xl p-4 pr-16 text-sm outline-none focus:border-primary transition-all resize-none shadow-inner-sm"
                />
                <button
                  onClick={handleRefine}
                  disabled={isRefining || !refineQuery.trim()}
                  className={cn(
                    "absolute bottom-4 right-4 p-3 rounded-xl transition-all",
                    isRefining || !refineQuery.trim() 
                      ? "bg-surface-container-high text-on-surface-variant" 
                      : "bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95"
                  )}
                >
                  {isRefining ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                </button>
              </div>

              <AnimatePresence>
                {refinementHistory.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-6 space-y-3"
                  >
                    <h4 className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">수정 이력</h4>
                    {refinementHistory.map((h, i) => (
                      <div key={i} className="flex items-start gap-2 bg-secondary/5 p-3 rounded-xl border border-secondary/10">
                        <CheckCircle size={14} className="text-secondary mt-0.5" />
                        <div className="flex justify-between items-center w-full">
                          <p className="text-xs font-bold text-secondary line-clamp-1">"{h.question}" 반영됨</p>
                          <span className="text-[10px] text-secondary/60">{h.date}</span>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {recipe.chefTip && (
              <div className="mt-12 p-8 bg-surface-container-low rounded-[2rem] border border-surface-container/50">
                <h3 className="font-headline font-extrabold text-secondary mb-4 flex items-center gap-2">
                  <Lightbulb size={24} className="fill-secondary/10" />
                  셰프의 꿀팁
                </h3>
                <p className="text-on-surface-variant leading-relaxed font-body">
                  {recipe.chefTip}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action */}
      <div className="fixed bottom-[88px] left-0 right-0 p-4 md:p-6 z-40">
        <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row gap-3">
          <div className="flex gap-3 flex-1">
            <button 
              onClick={() => navigate(`/recipe/${id}/modify`)}
              className="flex-1 h-14 bg-white border-2 border-primary text-primary rounded-2xl font-headline text-base font-extrabold flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg backdrop-blur-md bg-white/90"
            >
              <ChefHat size={20} />
              수정하기
            </button>
            <button 
              onClick={() => navigate('/archive', { state: { autoAdd: true, recipeTitle: recipe.title, recipeId: recipe.id } })}
              className="flex-1 h-14 bg-secondary text-white rounded-2xl font-headline text-base font-extrabold flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all"
            >
              <CheckCircle size={20} />
              아카이브에 저장
            </button>
          </div>
          <button className="flex-[1.5] h-14 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-2xl font-headline text-base font-extrabold flex items-center justify-center gap-2 shadow-xl active:scale-[0.98] transition-all">
            <PlayCircle size={20} />
            원조 레시피로 시작
          </button>
        </div>
      </div>
    </div>
  );
}
