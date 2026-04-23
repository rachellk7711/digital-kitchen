import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Search, Mic, Trash2, Loader2, Star, FolderInput, Plus, X, Eraser } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Ingredient, IngredientGroup } from '../types';
import { cn } from '../lib/utils';
import { DEFAULT_PANTRY_ITEMS } from '../constants';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function Pantry() {
  const [pantryItems, setPantryItems] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeGroup, setActiveGroup] = useState<IngredientGroup | 'all'>('all');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', amount: '', group: 'main' as IngredientGroup });
  const [dbStatus, setDbStatus] = useState<"ok" | "error" | "checking" | "demo">("checking");
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isAdding]);

  const groups = [
    { id: 'all', label: '전체', icon: '📦' },
    { id: 'staple', label: '상시 보유 재료', icon: '🥫' },
    { id: 'sauce', label: '소스류', icon: '🍯' },
    { id: 'main', label: '메인 식재료', icon: '🥩' },
    { id: 'special', label: '특별 식재료', icon: '✨' },
    { id: 'urgent', label: '임박/과량 식재료', icon: '⏰' },
  ];

  useEffect(() => {
    fetchPantry();
  }, []);

  async function fetchPantry() {
    console.log('Fetching pantry items...');
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pantry')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data && data.length > 0) {
        const mapped = data.map(item => ({
          ...item,
          id: item.id,
          name: item.name,
          amount: item.amount || '단위 미정',
          icon: item.icon || 'package',
          image: item.image,
          category: item.category || '기타',
          group: item.group || 'staple',
          is_favorite: item.is_favorite || false
        }));
        setPantryItems(mapped);
        setDbStatus("ok");
      } else {
        // Seed default items if pantry is empty
        await seedDefaultPantry();
        setDbStatus("ok");
      }
    } catch (error) {
      console.error('Error fetching pantry, falling back to local defaults:', error);
      setDbStatus("demo");
      // Fallback to local items immediately on error
      setPantryItems(DEFAULT_PANTRY_ITEMS.map((d, i) => ({ 
        ...d, 
        id: `local-${i}`, 
        is_favorite: false,
        icon: 'package' 
      }) as any));
    } finally {
      setLoading(false);
    }
  }

  async function seedDefaultPantry() {
    try {
      const { data, error } = await supabase
        .from('pantry')
        .insert(DEFAULT_PANTRY_ITEMS)
        .select();
      
      if (error) throw error;
      if (data && data.length > 0) {
        setPantryItems(data.map(d => ({ ...d, amount: d.amount || '단위 미정', icon: 'package' })));
      } else {
        throw new Error("No data returned from seed");
      }
    } catch (e) {
      console.warn("Seeding failed, using local fallback:", e);
      setPantryItems(DEFAULT_PANTRY_ITEMS.map((d, i) => ({ 
        ...d, 
        id: `seed-${i}`, 
        is_favorite: false,
        icon: 'package'
      }) as any));
    }
  }

  async function resetPantry() {
    if (!window.confirm("모든 재료를 삭제하고 기본 상태로 초기화하시겠습니까?")) return;
    
    try {
      setLoading(true);
      // Delete everything
      const { error } = await supabase.from('pantry').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      
      // Fetch will now trigger seed because it's empty
      await fetchPantry();
      alert("인벤토리가 깔끔하게 정리되었습니다!");
    } catch (error: any) {
      console.error('Reset failed:', error);
      alert(`정리 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function addIngredient(directName?: any, directAmount?: string) {
    // If first argument is a React Event, ignore it and use newItem.name
    const isEvent = directName && typeof directName === 'object' && directName.nativeEvent;
    const targetName = (isEvent ? newItem.name : directName) || newItem.name;
    const targetAmount = (isEvent ? newItem.amount : directAmount) || newItem.amount;

    if (!targetName) return;
    
    const names = targetName.split(',').map(s => s.trim()).filter(s => s);
    
    // 1. Optimistic Update: UI에 즉시 반영
    const tempIds = names.map(() => Math.random().toString(36).substr(2, 9));
    const optimisticItems = names.map((name, idx) => ({
      id: tempIds[idx],
      name,
      amount: targetAmount || '적당량',
      group: newItem.group,
      icon: 'package',
      category: '기타',
      is_favorite: false,
      is_pending: true // 저장 중 표시용
    }));

    setPantryItems(prev => [...optimisticItems, ...prev]);
    setNewItem({ name: '', amount: '', group: 'main' });
    setIsAdding(false);

    // 2. Background Sync: DB에 실제 저장
    const itemsToInsert = names.map(name => ({
      name,
      amount: targetAmount || '적당량',
      group: newItem.group,
      icon: 'package',
      category: '기타'
    }));

    try {
      const { data, error } = await supabase
        .from('pantry')
        .insert(itemsToInsert)
        .select();

      if (error) throw error;
      
      if (data) {
        // 실제 데이터로 교체 (pending 상태 해제)
        setPantryItems(prev => {
          const filtered = prev.filter(item => !tempIds.includes(item.id));
          return [...data, ...filtered];
        });
      }
    } catch (error: any) {
      console.error('Real-time sync failed:', error);
      // 실패 시 사용자에게 알리고 롤백할지 결정 (여기서는 알림만)
      alert(`DB 저장에 실패했습니다: ${error.message}\n화면에는 임시로 표시되지만 새로고침하면 사라질 수 있습니다.`);
    }
  }

  async function deleteFromPantry(id: string) {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('pantry')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setPantryItems(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting from pantry:', error);
      alert('삭제에 실패했습니다: ' + (error as any).message);
    } finally {
      setLoading(false);
    }
  }

  async function moveItemGroup(id: string, group: IngredientGroup) {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('pantry')
        .update({ group })
        .eq('id', id);

      if (error) throw error;
      
      setPantryItems(prev => prev.map(item => 
        item.id === id ? { ...item, group } : item
      ));
    } catch (error) {
      console.error('Error moving item:', error);
      alert('이동에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function toggleFavorite(id: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('pantry')
        .update({ is_favorite: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      setPantryItems(prev => prev.map(item => 
        item.id === id ? { ...item, is_favorite: !currentStatus } : item
      ));
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }

  const groupOrder: Record<string, number> = {
    urgent: 0,
    main: 1,
    staple: 2,
    sauce: 3,
    special: 4
  };

  const filteredItems = pantryItems
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGroup = activeGroup === 'all' || item.group === activeGroup;
      return matchesSearch && matchesGroup;
    })
    .sort((a, b) => {
      const orderA = groupOrder[a.group || 'staple'] ?? 5;
      const orderB = groupOrder[b.group || 'staple'] ?? 5;
      
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      
      // 동일 카테고리 내에서는 이름순 정렬
      return a.name.localeCompare(b.name);
    });

  const groupStyles: Record<string, string> = {
    staple: 'bg-slate-50/80 border-slate-200',
    sauce: 'bg-amber-50/80 border-amber-200',
    main: 'bg-rose-50/80 border-rose-200',
    special: 'bg-indigo-50/80 border-indigo-200',
    urgent: 'bg-orange-50/80 border-orange-300 shadow-sm shadow-orange-200/50',
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="px-6 py-8 space-y-10"
    >
      <motion.div variants={item}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-3xl font-headline font-extrabold tracking-tight text-on-surface">인벤토리</h2>
            {dbStatus === "ok" ? (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-[10px] font-bold text-green-700 animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> CONNECTED
              </span>
            ) : dbStatus === "demo" ? (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-[10px] font-bold text-amber-700">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> DEMO MODE
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-100 text-[10px] font-bold text-stone-500">
                <div className="w-1.5 h-1.5 rounded-full bg-stone-400" /> CHECKING...
              </span>
            )}
          </div>
          <button 
            onClick={resetPantry}
            className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-all"
            title="인벤토리 초기화"
          >
            <Eraser size={14} />
            전체 초기화
          </button>
        </div>
        <p className="text-on-surface-variant font-body">현재 보유 중인 미식 재료들을 한눈에 관리하세요.</p>
      </motion.div>

      {/* Categories & Search Container */}
      <motion.div variants={item} className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex flex-wrap gap-2">
            {groups.map(g => (
              <button
                key={g.id}
                onClick={() => setActiveGroup(g.id as any)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-bold transition-all border-2",
                  activeGroup === g.id 
                    ? "bg-primary border-primary text-white shadow-md" 
                    : "bg-white border-surface-container text-on-surface-variant hover:border-primary/30"
                )}
              >
                <span className="mr-1.5">{g.icon}</span>
                {g.label}
              </button>
            ))}
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-2xl font-bold shadow-lg active:scale-95 transition-all text-sm whitespace-nowrap"
          >
            <Plus size={18} />
            재료 추가
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
            <input
              className="w-full pl-12 pr-4 py-4 bg-surface-container-highest border-none rounded-2xl focus:ring-2 focus:ring-primary/20 text-on-surface transition-all outline-none"
              placeholder="팬트리 내 재료 검색..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <input
              className="px-6 py-4 bg-white border border-surface-container rounded-2xl focus:border-primary outline-none transition-all text-sm min-w-[200px]"
              placeholder="빠른 재료 추가 (엔터)"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val) {
                    addIngredient(val, '적당량');
                    (e.target as HTMLInputElement).value = '';
                  }
                }
              }}
            />
            <button className="bg-surface-container-low p-4 rounded-2xl flex items-center justify-center hover:bg-surface-container-high transition-colors active:scale-95">
              <Mic className="text-primary" size={24} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Pantry Status Section */}
      <motion.section variants={item} className="bg-white rounded-3xl p-6 shadow-sm border border-surface-container">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-headline text-xl font-bold">현재 인벤토리 ({pantryItems.length})</h3>
          {loading && <Loader2 className="animate-spin text-primary" size={20} />}
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {filteredItems.map((item) => (
            <div 
              key={item.id} 
              className={cn(
                "relative group px-4 py-3 rounded-xl border transition-all flex flex-col justify-between min-h-[72px]",
                groupStyles[item.group || 'staple'] || 'bg-white border-surface-container'
              )}
            >
              <div className="absolute top-1.5 right-1.5 flex gap-1">
                <div className="relative">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDropdown(activeDropdown === item.id ? null : item.id);
                    }}
                    className={cn(
                      "p-1 bg-surface-container text-on-surface-variant rounded-md transition-opacity hover:bg-primary/10",
                      activeDropdown === item.id ? "opacity-100 ring-2 ring-primary/20" : "opacity-0 group-hover:opacity-100"
                    )}
                  >
                    <FolderInput size={12} />
                  </button>
                  {activeDropdown === item.id && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdown(null);
                        }}
                      />
                      <div className="absolute right-0 top-full mt-1 bg-white border border-surface-container rounded-lg shadow-xl z-20 w-40 overflow-hidden scale-100 origin-top-right transition-all">
                        {groups.filter(g => g.id !== 'all').map(g => (
                          <button 
                            key={g.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              moveItemGroup(item.id, g.id as IngredientGroup);
                              setActiveDropdown(null);
                            }}
                            className={cn(
                              "w-full text-left px-3 py-2 text-xs hover:bg-surface-container transition-colors flex items-center gap-2",
                              item.group === g.id && "bg-primary/5 text-primary font-bold"
                            )}
                          >
                            <span>{g.icon}</span>
                            <span>{g.label}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <button 
                  onClick={() => toggleFavorite(item.id, (item as any).is_favorite)}
                  className={cn(
                    "p-1 rounded-md transition-all opacity-0 group-hover:opacity-100",
                    (item as any).is_favorite ? "bg-yellow-50 text-yellow-500 opacity-100" : "bg-surface-container text-on-surface-variant"
                  )}
                >
                  <Star size={12} fill={(item as any).is_favorite ? "currentColor" : "none"} />
                </button>
                <button 
                  onClick={() => deleteFromPantry(item.id)}
                  className="p-1 bg-red-50 text-red-500 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <div className="min-w-0">
                <span className="block font-bold text-sm mb-1 pr-6 break-words leading-tight">{item.name}</span>
                <div className="flex items-start gap-1.5">
                  <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-secondary/30 mt-1"></span>
                  <span className="block text-[11px] text-on-surface-variant break-all font-medium leading-normal">{item.amount}</span>
                </div>
              </div>
            </div>
          ))}
          {filteredItems.length === 0 && !loading && (
            <div className="col-span-full py-12 text-center text-on-surface-variant">
              <p>인벤토리가 비어 있습니다.</p>
            </div>
          )}
        </div>
      </motion.section>

      {/* Add Ingredient Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-md rounded-[2.5rem] p-8 space-y-6 shadow-2xl"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-headline font-extrabold text-on-surface">새로운 재료 추가</h3>
              <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-surface-container rounded-full transition-colors font-bold text-lg">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant ml-1">재료명</label>
                <input
                  ref={nameInputRef}
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="예: 아보카도, 대파..."
                  onKeyDown={(e) => e.key === 'Enter' && addIngredient()}
                  className="w-full px-6 py-4 rounded-2xl bg-surface-container-low border border-surface-container focus:border-primary outline-none transition-all font-body"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant ml-1">수량/단위</label>
                <input
                  value={newItem.amount}
                  onChange={(e) => setNewItem({ ...newItem, amount: e.target.value })}
                  placeholder="예: 2개, 1/2단..."
                  className="w-full px-6 py-4 rounded-2xl bg-surface-container-low border border-surface-container focus:border-primary outline-none transition-all font-body"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant ml-1">보관 위치(카테고리)</label>
                <div className="grid grid-cols-2 gap-2">
                  {groups.filter(g => g.id !== 'all').map(g => (
                    <button
                      key={g.id}
                      onClick={() => setNewItem({ ...newItem, group: g.id as IngredientGroup })}
                      className={cn(
                        "px-4 py-3 rounded-xl border text-sm font-bold transition-all text-left flex items-center gap-2",
                        newItem.group === g.id 
                          ? "bg-primary/10 border-primary text-primary" 
                          : "bg-white border-surface-container text-on-surface-variant"
                      )}
                    >
                      <span>{g.icon}</span>
                      <span>{g.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button 
              onClick={() => addIngredient()}
              disabled={!newItem.name}
              className="w-full py-5 bg-primary text-on-primary rounded-2xl font-headline font-extrabold text-xl shadow-lg active:scale-95 disabled:opacity-50 transition-all mt-4"
            >
              인벤토리에 추가하기
            </button>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
