import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar as CalendarIcon, Camera, Link as LinkIcon, Plus, X, Utensils, Award, Sparkles, Image as ImageIcon, FileText, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { MealJournalLog } from '../types';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';

export default function KitchenArchive() {
  const location = useLocation();
  const [logs, setLogs] = useState<MealJournalLog[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [newEntry, setNewEntry] = useState<Partial<MealJournalLog>>({
    date: new Date().toISOString().split('T')[0],
    mealType: 'lunch',
    healthScore: 85,
  });

  // Handle automatic adding from RecipeDetail or RecipeModify
  useEffect(() => {
    if (location.state?.autoAdd) {
      const { recipeId, recipeTitle, videoUrl, recipeContent } = location.state;
      
      const setupEntry = async () => {
        let content = recipeContent || '';
        
        // Only fetch if content was not directly passed
        if (!content && recipeId) {
          try {
            // Try to fetch full recipe content to pre-fill referenceContent
            const { data } = await supabase.from('recipes').select('*').eq('id', recipeId).single();
            if (data) {
              content = `[레시피 정보]\n제목: ${data.title}\n주요 재료: ${data.ingredients?.map((i: any) => i.name).join(', ')}\n\n[조리 순서]\n${data.instructions?.map((s: string, idx: number) => `${idx+1}. ${s}`).join('\n')}`;
            }
          } catch (e) {
            console.warn("Could not auto-fetch recipe info", e);
          }
        }

        setNewEntry(prev => ({
          ...prev,
          title: recipeTitle,
          recipeId: recipeId,
          referenceUrl: videoUrl,
          referenceContent: content
        }));
        setIsAdding(true);
      };

      setupEntry();
      // Clear state after reading
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchLogs = async () => {
    // Demo data
    const demoLogs: MealJournalLog[] = [
      {
        id: '1',
        date: '2026-04-19',
        title: '허니 글레이즈 연어 (나의 수정본)',
        mealType: 'dinner',
        photoUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=400&q=80',
        notes: '아이들이 알룰로스를 넣어서 그런지 평소보다 더 맛있게 먹었음. 다음번엔 시금치를 좀 더 추가해볼 것.',
        healthScore: 92,
        referenceUrl: 'https://www.youtube.com/watch?v=somevideo'
      },
      {
        id: '2',
        date: '2026-04-18',
        title: '노밀가루 쌀가루 해물파전',
        mealType: 'lunch',
        photoUrl: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=400&q=80',
        healthScore: 88,
        notes: '밀가루 대신 쌀가루만 썼는데 충분히 바삭함!'
      }
    ];
    setLogs(demoLogs);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSave = () => {
    if (!newEntry.title) return;
    const entry: MealJournalLog = {
      id: Math.random().toString(36).substr(2, 9),
      date: newEntry.date || new Date().toISOString(),
      title: newEntry.title || '',
      mealType: newEntry.mealType || 'lunch',
      photoUrl: newEntry.photoUrl,
      referenceUrl: newEntry.referenceUrl,
      referenceContent: newEntry.referenceContent,
      notes: newEntry.notes,
      healthScore: newEntry.healthScore || 85,
    };
    setLogs([entry, ...logs]);
    setIsAdding(false);
    setNewEntry({
      date: new Date().toISOString().split('T')[0],
      mealType: 'lunch',
      healthScore: 85,
    });
  };

  return (
    <div className="px-6 py-8 space-y-10">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-headline font-extrabold tracking-tight text-on-surface">나의 레시피북</h2>
          <p className="text-on-surface-variant font-body">AI 제안 레시피와 외부에서 가져온 미식 정보들을 한곳에 보관하세요.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="p-3 bg-primary text-on-primary rounded-2xl shadow-lg active:scale-90 transition-transform"
        >
          <Plus size={24} />
        </button>
      </header>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-primary/5 rounded-3xl p-6 border border-primary/10">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Award size={20} />
            <span className="text-sm font-bold">미식 달성도</span>
          </div>
          <div className="text-2xl font-headline font-extrabold text-on-surface">Premium</div>
        </div>
        <div className="bg-secondary/5 rounded-3xl p-6 border border-secondary/10">
          <div className="flex items-center gap-2 text-secondary mb-2">
            <BookOpen size={20} />
            <span className="text-sm font-bold">아카이브 레시피</span>
          </div>
          <div className="text-2xl font-headline font-extrabold text-on-surface">{logs.length}개</div>
        </div>
      </div>

      {/* Log List */}
      <div className="space-y-6">
        {logs.map((log) => (
          <motion.div 
            key={log.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2rem] border border-surface-container overflow-hidden shadow-sm"
          >
            {log.photoUrl && (
              <div className="aspect-[21/9] overflow-hidden">
                <img src={log.photoUrl} alt={log.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            )}
            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-primary mb-1">
                    <CalendarIcon size={12} />
                    {log.date} · {log.mealType === 'breakfast' ? '아침' : log.mealType === 'lunch' ? '점심' : log.mealType === 'dinner' ? '저녁' : '간식'}
                  </div>
                  <h3 className="font-headline font-bold text-lg text-on-surface leading-tight">{log.title}</h3>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1 bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                    <Sparkles size={14} className="fill-primary" />
                    <span className="text-xs font-black">{log.healthScore}</span>
                  </div>
                </div>
              </div>

              {log.notes && (
                <p className="text-sm text-on-surface-variant font-body mt-3 leading-relaxed">
                  {log.notes}
                </p>
              )}

              {log.referenceContent && (
                <div className="mt-4">
                  <button 
                    onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                    className="flex items-center gap-2 text-xs font-bold text-primary bg-primary/5 px-3 py-2 rounded-lg hover:bg-primary/10 transition-all"
                  >
                    <FileText size={14} />
                    {expandedLog === log.id ? '레시피 본문 닫기' : '상세 레시피 본문 보기'}
                    {expandedLog === log.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  <AnimatePresence>
                    {expandedLog === log.id && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 p-4 bg-surface-container-low rounded-xl border border-surface-container text-xs text-on-surface-variant font-mono whitespace-pre-wrap leading-relaxed">
                          {log.referenceContent}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {(log.referenceUrl) && (
                <div className="flex gap-4 mt-6 pt-4 border-t border-surface-container">
                  {log.referenceUrl && (
                    <a 
                      href={log.referenceUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-primary transition-colors"
                    >
                      <LinkIcon size={14} /> 참고 레시피/영상
                    </a>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Modal Overlay */}
      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-on-surface/40 backdrop-blur-sm flex items-end md:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="bg-surface w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-headline font-extrabold text-on-surface">나만의 레시피 보관하기</h3>
                <button onClick={() => setIsAdding(false)} className="p-2 bg-surface-container rounded-full hover:bg-surface-container-high transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <input 
                  type="text" 
                  placeholder="음식 이름 (예: 연어 스테이크 수정본)"
                  value={newEntry.title || ''}
                  onChange={e => setNewEntry({...newEntry, title: e.target.value})}
                  className="w-full px-6 py-4 rounded-2xl bg-surface-container-low border border-surface-container focus:border-primary outline-none transition-all font-body text-base font-medium"
                />

                <div className="grid grid-cols-2 gap-4">
                  <select 
                    value={newEntry.mealType}
                    onChange={e => setNewEntry({...newEntry, mealType: e.target.value as any})}
                    className="px-6 py-4 rounded-2xl bg-surface-container-low border border-surface-container focus:border-primary outline-none font-body text-sm"
                  >
                    <option value="breakfast">아침</option>
                    <option value="lunch">점심</option>
                    <option value="dinner">저녁</option>
                    <option value="snack">간식</option>
                  </select>
                  <input 
                    type="date"
                    value={newEntry.date}
                    onChange={e => setNewEntry({...newEntry, date: e.target.value})}
                    className="px-6 py-4 rounded-2xl bg-surface-container-low border border-surface-container focus:border-primary outline-none font-body text-sm"
                  />
                </div>

                <div className="flex gap-2 p-2 bg-surface-container-low rounded-2xl border border-surface-container">
                  <button className="flex-1 flex flex-col items-center justify-center py-4 rounded-xl hover:bg-white transition-all gap-1 text-on-surface-variant hover:text-primary relative overflow-hidden group">
                    <Camera size={24} />
                    <span className="text-[10px] font-bold">사진 촬영</span>
                    <input type="file" accept="image/*" capture="environment" className="absolute inset-0 opacity-0 cursor-pointer" />
                  </button>
                  <div className="w-px h-10 bg-surface-container my-auto"></div>
                  <button className="flex-1 flex flex-col items-center justify-center py-4 rounded-xl hover:bg-white transition-all gap-1 text-on-surface-variant hover:text-primary relative overflow-hidden group">
                    <ImageIcon size={24} />
                    <span className="text-[10px] font-bold">갤러리 선택</span>
                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-on-surface-variant ml-2">요리 노트 및 평가</label>
                  <textarea 
                    placeholder="맛은 어땠나요? 레시피 수정 후기나 느낌을 기록해보세요."
                    value={newEntry.notes || ''}
                    onChange={e => setNewEntry({...newEntry, notes: e.target.value})}
                    className="w-full h-32 px-6 py-4 rounded-2xl bg-surface-container-low border border-surface-container focus:border-primary outline-none transition-all font-body text-sm resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center ml-2">
                    <label className="text-[10px] font-black uppercase text-on-surface-variant">참고 레시피 상세 (텍스트/제미나이)</label>
                  </div>
                  <textarea 
                    placeholder="제미나이에게 받은 레시피나 직접 적은 조리법을 여기에 붙여넣으세요."
                    value={newEntry.referenceContent || ''}
                    onChange={e => setNewEntry({...newEntry, referenceContent: e.target.value})}
                    className="w-full h-40 px-6 py-4 rounded-2xl bg-surface-container-low border border-surface-container focus:border-primary outline-none transition-all font-body text-sm resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-on-surface-variant ml-2">참고 레시피/유튜브 링크</label>
                  <input 
                    type="text" 
                    placeholder="URL을 입력하세요 (예: 유튜브 링크)"
                    value={newEntry.referenceUrl || ''}
                    onChange={e => setNewEntry({...newEntry, referenceUrl: e.target.value})}
                    className="w-full px-6 py-4 rounded-2xl bg-surface-container-low border border-surface-container focus:border-primary outline-none font-body text-sm"
                  />
                </div>
              </div>

              <button 
                onClick={handleSave}
                disabled={!newEntry.title}
                className="w-full py-5 bg-primary text-on-primary rounded-2xl font-headline font-extrabold text-xl shadow-xl active:scale-95 disabled:opacity-50 transition-all"
              >
                기록 저장하기
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
