import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Save, Plus, Trash2, ChefHat, Sparkles } from 'lucide-react';
import { MOCK_RECIPES } from '../constants';
import { supabase } from '../lib/supabase';
import { Recipe } from '../types';
import { cn } from '../lib/utils';

export default function RecipeModify() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [modifiedIngredients, setModifiedIngredients] = useState<{ name: string; amount: string }[]>([]);

  useEffect(() => {
    fetchRecipe();
  }, [id]);

  async function fetchRecipe() {
    try {
      setLoading(true);
      // Try existing mock data first
      let foundRecipe = MOCK_RECIPES.find(r => r.id === id);
      
      if (!foundRecipe) {
        // Try Supabase if not in mock
        const { data } = await supabase.from('recipes').select('*').eq('id', id).single();
        if (data) foundRecipe = data as any;
      }

      if (foundRecipe) {
        setRecipe(foundRecipe as any);
        setModifiedIngredients([...foundRecipe.ingredients]);
      }
    } catch (error) {
      console.error('Error fetching recipe for modification:', error);
    } finally {
      setLoading(false);
    }
  }

  const addIngredient = () => {
    setModifiedIngredients([...modifiedIngredients, { name: '', amount: '' }]);
  };

  const updateIngredient = (index: number, field: 'name' | 'amount', value: string) => {
    const next = [...modifiedIngredients];
    next[index] = { ...next[index], [field]: value };
    setModifiedIngredients(next);
  };

  const removeIngredient = (index: number) => {
    setModifiedIngredients(modifiedIngredients.filter((_, i) => i !== index));
  };

  const handleSaveAndCook = async () => {
    if (!recipe) return;

    try {
      const personalRecipe = {
        title: `${recipe.title} (나의 수정본)`,
        ingredients: modifiedIngredients,
        instructions: recipe.instructions, // Keep instructions same for now or could allow edit too
        original_recipe_id: recipe.id,
        user_id: (await supabase.auth.getUser()).data.user?.id || 'anonymous',
        modified_at: new Date().toISOString(),
        image: recipe.image,
        video_url: recipe.videoUrl
      };

      // In a real app, save to 'personal_recipes' table
      const { data, error } = await supabase
        .from('personal_recipes')
        .insert([personalRecipe])
        .select()
        .single();

      if (error && error.code !== 'PGRST116') { // Ignore missing table error for demo
         console.warn("Table 'personal_recipes' might not exist, proceeding to lunch log");
      }

      // Automatically redirect to capture a meal log
      const modifiedContent = `[수정된 레시피 정보]\n제목: ${personalRecipe.title}\n\n[수정된 재료]\n${modifiedIngredients.map(ing => `- ${ing.name}: ${ing.amount}`).join('\n')}\n\n[기타 정보]\n원문 레시피를 기반으로 재료를 최적화했습니다.`;

      navigate('/archive', { 
        state: { 
          autoAdd: true, 
          recipeTitle: personalRecipe.title, 
          recipeId: data?.id || recipe.id,
          videoUrl: recipe.videoUrl,
          recipeContent: modifiedContent
        } 
      });

    } catch (error) {
      console.error('Error saving custom recipe:', error);
      alert('수정본 저장 중 오류가 발생했습니다.');
    }
  };

  if (loading) return null;
  if (!recipe) return <div className="p-8">레시피를 찾을 수 없습니다.</div>;

  return (
    <div className="pb-32 px-6 pt-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-surface-container rounded-full">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-headline font-extrabold text-on-surface">레시피 수정하기</h1>
      </div>

      <div className="bg-primary/5 border border-primary/10 rounded-[2rem] p-6 mb-8">
        <div className="flex items-center gap-2 text-primary mb-2">
          <Sparkles size={20} />
          <span className="font-bold">셰프의 조언</span>
        </div>
        <p className="text-sm text-on-surface-variant leading-relaxed font-body italic">
          "재료를 변경하실 때 **노밀가루**, **저당** 원칙을 잊지 마세요! 
          식물성 오일은 **엑스트라 버진 올리브유**로, 설탕은 **알룰로스**로 입력해주시면 더욱 완벽합니다."
        </p>
      </div>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-headline font-bold flex items-center gap-2">
            <ChefHat className="text-primary" size={24} />
            재료 및 분량 조절
          </h2>
          <button 
            onClick={addIngredient}
            className="flex items-center gap-1 text-sm font-bold text-primary px-3 py-1.5 bg-primary/10 rounded-full hover:bg-primary/20 transition-colors"
          >
            <Plus size={16} /> 재료 추가
          </button>
        </div>

        <div className="space-y-3">
          {modifiedIngredients.map((ing, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <input
                value={ing.name}
                onChange={(e) => updateIngredient(idx, 'name', e.target.value)}
                placeholder="재료명 (예: 알룰로스)"
                className="flex-[2] px-4 py-3 rounded-xl bg-white border border-surface-container focus:border-primary outline-none transition-all font-body text-sm shadow-sm"
              />
              <input
                value={ing.amount}
                onChange={(e) => updateIngredient(idx, 'amount', e.target.value)}
                placeholder="분량 (예: 2큰술)"
                className="flex-1 px-4 py-3 rounded-xl bg-white border border-surface-container focus:border-primary outline-none transition-all font-body text-sm shadow-sm"
              />
              <button 
                onClick={() => removeIngredient(idx)}
                className="p-3 text-on-surface-variant hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-12 space-y-4">
        <button 
          onClick={handleSaveAndCook}
          className="w-full py-4 bg-primary text-on-primary rounded-2xl font-headline font-extrabold text-lg shadow-lg flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
        >
          <Save size={24} />
          나만의 레시피로 저장 & 요리 완료
        </button>
        <p className="text-center text-xs text-on-surface-variant px-8">
          저장 버튼을 누르면 이 수정된 재료가 반영된 레시피가 따로 보관되며, 
          '나의 레시피북(아카이브)'으로 자동으로 이어집니다.
        </p>
      </div>
    </div>
  );
}
