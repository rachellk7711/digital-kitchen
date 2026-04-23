import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  User, Settings, Bell, Shield, CreditCard, LogOut, ChevronRight, Heart, 
  BookOpen, Clock, Calendar as CalendarIcon, ChevronLeft, CalendarDays, 
  Utensils, Star, ExternalLink, X, Camera, FileText, ChevronDown, ChevronUp,
  ChefHat, Save, Edit3
} from 'lucide-react';
import { MealJournalLog } from '../types';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { DEFAULT_PANTRY_ITEMS } from '../constants';

// Helper for calendar generation
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

export default function ChefsStudy() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [mealLogs, setMealLogs] = useState<MealJournalLog[]>([]);
  const [pantryCount, setPantryCount] = useState<number>(0);
  const [selectedMeal, setSelectedMeal] = useState<MealJournalLog | null>(null);
  const [expandedDetail, setExpandedDetail] = useState(false);
  const [isEditingGuidelines, setIsEditingGuidelines] = useState(false);
  const [guidelines, setGuidelines] = useState({
    dinner: "메인 반찬 (단백질이 포함된 메뉴) + 간단한 밑반찬이나 간단한 국",
    quick: "10분 이내 조리 가능한 식사대용식",
    fridge: "주어진 재료 및 보유 재료를 충실히 이용한 음식",
    baking: "밀가루를 제외한 재료로 만드는 베이킹",
    snack: "고단백질 중심의 간편 준비 메뉴",
    potrice: "쌀과 재료를 함께 넣고 짓는 한 그릇 요리 (예: 가지밥, 콩나물밥)",
    diet: "칼로리 절감보다 탄수화물 완전 배제 지향 (Zero-Carb, Keto)"
  });
  const [defaultPantryList, setDefaultPantryList] = useState<string[]>(DEFAULT_PANTRY_ITEMS.map(i => i.name));

  useEffect(() => {
    fetchGuidelines();
    fetchPantryCount();
    // Demo data for calendar
    const demoLogs: MealJournalLog[] = [
      {
        id: '1',
        date: '2026-04-19',
        title: '허니 글레이즈 연어 (나의 수정본)',
        mealType: 'dinner',
        photoUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=400&q=80',
        notes: '아이들이 알룰로스를 넣어서 그런지 평소보다 더 맛있게 먹었음. 다음번엔 시금치를 좀 더 추가해볼 것.',
        healthScore: 92,
        referenceUrl: 'https://www.youtube.com/results?search_query=노밀가루+연어+스테이크+건강식+레시피'
      },
      {
        id: '2',
        date: '2026-04-18',
        title: '노밀가루 쌀가루 해물파전',
        mealType: 'lunch',
        photoUrl: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=400&q=80',
        healthScore: 88,
        notes: '밀가루 대신 쌀가루만 썼는데 충분히 바삭함!'
      },
      {
        id: '3',
        date: '2026-04-19',
        title: '그린 샐러드 & 아보카도',
        mealType: 'breakfast',
        healthScore: 95,
      }
    ];
    setMealLogs(demoLogs);
  }, []);

  async function fetchGuidelines() {
    try {
      const { data, error } = await supabase.from('chef_guidelines').select('*').single();
      if (data) {
        setGuidelines(data.content);
      }
    } catch (e) {
      console.log("Guidelines table might not exist yet, using defaults");
    }
  }

  async function fetchPantryCount() {
    try {
      const { count, error } = await supabase
        .from('pantry')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      if (count !== null) setPantryCount(count);
    } catch (e) {
      console.error('Error fetching pantry count:', e);
    }
  }

  async function saveGuidelines() {
    try {
      const { error } = await supabase.from('chef_guidelines').upsert({ 
        id: 'global-guidelines',
        content: guidelines 
      });
      setIsEditingGuidelines(false);
      alert("셰프 가이드라인이 저장되었습니다.");
    } catch (e) {
      setIsEditingGuidelines(false);
      // Fallback to local storage if DB fails
      localStorage.setItem('chef_guidelines', JSON.stringify(guidelines));
      alert("가이드라인이 로컬에 저장되었습니다.");
    }
  }

  const menuItems = [
    { icon: <Heart size={20} />, label: '관심 레시피', count: '24', to: '/recipes' },
    { icon: <BookOpen size={20} />, label: '키친 아카이브', count: '12', to: '/archive' },
    { icon: <Clock size={20} />, label: '팬트리 보유고', count: String(pantryCount), to: '/pantry' },
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const calendarDays = Array.from({ length: 42 }, (_, i) => {
    const day = i - firstDay + 1;
    return day > 0 && day <= daysInMonth ? day : null;
  });

  const getLogsForDate = (day: number | null) => {
    if (!day) return [];
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return mealLogs.filter(log => log.date === dateStr);
  };

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(year, month + offset, 1));
  };

  const settingsItems = [
    { icon: <Settings size={20} />, label: '환경 설정' },
    { icon: <Bell size={20} />, label: '알림' },
    { icon: <Shield size={20} />, label: '개인정보 및 보안' },
    { icon: <CreditCard size={20} />, label: '구독 관리' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-6 py-8 pb-32 space-y-10"
    >
      {/* Profile Header */}
      <section className="flex flex-col items-center text-center space-y-4">
        <div className="relative">
          <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-xl">
            <img
              alt="User profile"
              className="w-full h-full object-cover"
              src="https://images.unsplash.com/photo-1556157382-97dee2dcb748?auto=format&fit=crop&w=300&q=80"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-primary text-white p-2 rounded-xl shadow-lg">
            <ChefHat size={20} />
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-headline font-extrabold text-on-surface">셰프의 집무실</h2>
          <p className="text-on-surface-variant font-body">최상의 미식을 설계하는 당신만의 공간</p>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-3 gap-4">
        {menuItems.map((menu, idx) => (
          <Link 
            key={idx} 
            to={menu.to}
            className="bg-white p-4 py-8 rounded-[2rem] shadow-sm border border-surface-container flex flex-col items-center gap-2 active:scale-95 transition-transform"
          >
            <div className="text-primary mb-1">{menu.icon}</div>
            <span className="text-2xl font-headline font-extrabold">{menu.count}</span>
            <span className="text-[10px] uppercase tracking-widest font-black text-on-surface-variant text-center leading-tight">{menu.label}</span>
          </Link>
        ))}
      </section>

      {/* Meal Diary Calendar */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="font-headline text-2xl font-extrabold text-on-surface flex items-center gap-2">
            <CalendarDays className="text-primary" size={24} />
            식단 캘린더
          </h3>
          <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white rounded-lg transition-all">
              <ChevronLeft size={20} />
            </button>
            <span className="px-3 font-headline font-bold text-sm min-w-[100px] text-center">
              {year}년 {month + 1}월
            </span>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white rounded-lg transition-all rotate-180">
              <ChevronLeft size={20} />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-surface-container p-6 shadow-sm overflow-hidden">
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 mb-4">
            {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
              <span key={day} className={cn(
                "text-center text-xs font-black mb-4",
                i === 0 ? "text-red-500" : i === 6 ? "text-secondary" : "text-stone-400"
              )}>
                {day}
              </span>
            ))}
            {calendarDays.map((day, i) => {
              const logs = getLogsForDate(day);
              const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
              const dateStr = day ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
              const isSelected = selectedDate === dateStr;

              return (
                <button
                  key={i}
                  disabled={!day}
                  onClick={() => day && setSelectedDate(dateStr)}
                  className={cn(
                    "relative h-14 flex flex-col items-center justify-center rounded-2xl transition-all",
                    !day && "invisible",
                    isSelected ? "bg-primary text-on-primary shadow-lg ring-2 ring-primary/20 scale-105 z-10" : "hover:bg-surface-container",
                    isToday && !isSelected && "text-primary border border-primary/20 bg-primary/5"
                  )}
                >
                  <span className={cn(
                    "text-sm font-bold",
                    !day && "hidden"
                  )}>{day}</span>
                  {logs.length > 0 && (
                    <div className="flex gap-0.5 mt-1">
                      {logs.slice(0, 3).map((log, idx) => (
                        <div 
                          key={idx} 
                          className={cn(
                            "w-1 h-1 rounded-full",
                            isSelected ? "bg-white/80" : "bg-primary/60"
                          )} 
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Day Meals */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={selectedDate}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mt-6 pt-6 border-t border-surface-container space-y-4"
            >
              <h4 className="text-xs font-black text-on-surface-variant flex items-center gap-1">
                <Utensils size={14} />
                {selectedDate} 식사 내역
              </h4>
              <div className="space-y-3">
                {mealLogs.filter(l => l.date === selectedDate).length > 0 ? (
                  mealLogs.filter(l => l.date === selectedDate).map((log) => (
                    <button 
                      key={log.id}
                      onClick={() => setSelectedMeal(log)}
                      className="w-full flex items-center gap-4 bg-surface-container-low p-4 rounded-2xl border border-surface-container hover:border-primary/30 transition-all text-left group"
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-primary/10 flex-shrink-0">
                        {log.photoUrl ? (
                          <img src={log.photoUrl} alt={log.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-primary">
                            <Utensils size={20} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="text-[10px] uppercase font-bold text-primary">{log.mealType === 'breakfast' ? '아침' : log.mealType === 'lunch' ? '점심' : log.mealType === 'dinner' ? '저녁' : '간식'}</span>
                          <div className="flex items-center gap-0.5 text-xs font-bold text-primary">
                            <Star size={10} className="fill-current" />
                            {log.healthScore}
                          </div>
                        </div>
                        <h5 className="font-headline font-bold text-on-surface truncate">{log.title}</h5>
                      </div>
                      <ChevronRight size={20} className="text-on-surface-variant group-hover:translate-x-1 transition-transform" />
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 text-on-surface-variant/50">
                    <p className="text-sm font-medium">기록된 식단이 없습니다.</p>
                    <Link to="/archive" className="text-xs text-primary font-bold hover:underline mt-1 inline-block">지금 기록하기</Link>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* Settings List */}
      <section className="space-y-4">
        <h3 className="font-headline text-xl font-bold px-2 text-on-surface">계정 및 앱 설정</h3>
        <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-surface-container">
          {settingsItems.map((setting, idx) => (
            <button
              key={idx}
              className="w-full flex items-center justify-between p-6 hover:bg-surface-container-low transition-colors border-b border-surface-container last:border-none"
            >
              <div className="flex items-center gap-4">
                <div className="text-on-surface-variant">{setting.icon}</div>
                <span className="font-body font-bold text-on-surface">{setting.label}</span>
              </div>
              <ChevronRight size={20} className="text-on-surface-variant" />
            </button>
          ))}
        </div>
      </section>

      {/* Chef Guidelines Editor */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="font-headline text-xl font-bold text-on-surface flex items-center gap-2">
            <ChefHat className="text-primary" size={24} />
            셰프 가이드라인 설정
          </h3>
          <button 
            onClick={() => isEditingGuidelines ? saveGuidelines() : setIsEditingGuidelines(true)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all",
              isEditingGuidelines ? "bg-primary text-white" : "bg-primary/10 text-primary"
            )}
          >
            {isEditingGuidelines ? <><Save size={16} /> 저장</> : <><Edit3 size={16} /> 수정</>}
          </button>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-surface-container space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {Object.entries({
              dinner: { label: "저녁식사", icon: "🍱" },
              quick: { label: "초스피드 간편식사", icon: "⚡" },
              fridge: { label: "냉장고 파먹기", icon: "🧊" },
              baking: { label: "노글루텐베이킹", icon: "🥐" },
              snack: { label: "간식", icon: "🍪" },
              potrice: { label: "솥밥", icon: "🍚" },
              diet: { label: "다이어트", icon: "🥗" }
            }).map(([key, info]) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-black text-on-surface-variant uppercase tracking-widest">
                  <span>{info.icon}</span>
                  {info.label}
                </div>
                {isEditingGuidelines ? (
                  <textarea
                    value={guidelines[key as keyof typeof guidelines]}
                    onChange={(e) => setGuidelines({ ...guidelines, [key]: e.target.value })}
                    className="w-full p-4 rounded-2xl bg-surface-container-low border border-surface-container focus:border-primary outline-none transition-all text-sm font-body leading-relaxed min-h-[80px]"
                  />
                ) : (
                  <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-transparent text-sm text-on-surface font-body leading-relaxed">
                    {guidelines[key as keyof typeof guidelines]}
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="text-[10px] text-on-surface-variant italic text-center">
            * 이 가이드라인은 AI가 레시피를 제안할 때 핵심 지침으로 활용됩니다.
          </p>
        </div>
      </section>

      {/* Meal Detail Modal */}
      <AnimatePresence>
        {selectedMeal && (
          <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl"
            >
              <div className="relative aspect-video">
                {selectedMeal.photoUrl ? (
                  <img src={selectedMeal.photoUrl} alt={selectedMeal.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary/5 flex flex-col items-center justify-center text-primary gap-4">
                    <Camera size={48} className="opacity-20" />
                    <span className="text-sm font-bold opacity-40">등록된 사진이 없습니다</span>
                  </div>
                )}
                <button 
                  onClick={() => {
                    setSelectedMeal(null);
                    setExpandedDetail(false);
                  }}
                  className="absolute top-4 right-4 p-2 bg-black/20 backdrop-blur-md text-white rounded-full hover:bg-black/40 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest">
                      {selectedMeal.mealType} · {selectedMeal.date}
                    </span>
                    <div className="flex items-center gap-1 bg-primary text-on-primary px-3 py-1 rounded-full text-xs font-black">
                      <Star size={12} className="fill-current" />
                      {selectedMeal.healthScore}점
                    </div>
                  </div>
                  <h3 className="text-2xl font-headline font-extrabold text-on-surface leading-tight">
                    {selectedMeal.title}
                  </h3>
                </div>

                {selectedMeal.notes && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-on-surface-variant flex items-center gap-2 uppercase tracking-widest">
                       셰프의 요리 후기
                    </h4>
                    <p className="text-sm text-on-surface font-body leading-relaxed bg-surface-container-low p-4 rounded-2xl border border-surface-container">
                      {selectedMeal.notes}
                    </p>
                  </div>
                )}

                {selectedMeal.referenceContent && (
                  <div className="space-y-2">
                    <button 
                      onClick={() => setExpandedDetail(!expandedDetail)}
                      className="w-full flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-2xl text-primary font-bold hover:bg-primary/10 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <FileText size={18} />
                        <span className="text-sm">참고 레시피 본문 {expandedDetail ? '닫기' : '보기'}</span>
                      </div>
                      {expandedDetail ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                    <AnimatePresence>
                      {expandedDetail && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 bg-surface-container-low rounded-2xl border border-surface-container text-xs text-on-surface-variant font-mono whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                            {selectedMeal.referenceContent}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {selectedMeal.referenceUrl && (
                  <a 
                    href={selectedMeal.referenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-2xl text-primary font-bold hover:bg-primary/10 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <ExternalLink size={20} />
                      <span className="text-sm">참고했던 레시피/영상 보기</span>
                    </div>
                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </a>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Default Pantry Settings */}
      <section className="space-y-6">
        <h3 className="font-headline text-xl font-bold px-2 text-on-surface">마스터 설정: 기본 팬트리</h3>
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-surface-container space-y-4">
          <p className="text-xs text-on-surface-variant font-medium mb-2">최초 앱 시작 시 자동으로 등록될 재료 목록입니다. (쉼표로 구분)</p>
          <textarea
            value={defaultPantryList.join(', ')}
            onChange={(e) => setDefaultPantryList(e.target.value.split(',').map(s => s.trim()))}
            className="w-full h-32 p-4 rounded-2xl bg-surface-container-low border border-surface-container focus:border-primary outline-none text-sm font-body leading-relaxed"
          />
          <button className="w-full py-3 bg-primary/10 text-primary rounded-xl font-bold text-xs">
            기본 팬트리 설정 저장
          </button>
        </div>
      </section>

      {/* Logout Button */}
      <section>
        <button className="w-full py-5 bg-surface-container-low text-red-500 rounded-[2.5rem] font-headline font-extrabold flex items-center justify-center gap-3 hover:bg-red-50 transition-colors active:scale-[0.98]">
          <LogOut size={24} />
          로그아웃
        </button>
      </section>

      <p className="text-center text-on-surface-variant text-xs font-body opacity-50 pb-8">
        퍼스널 웰니스 셰프 v2.0.0 • 당신의 미식 여정을 응원합니다 ❤️
      </p>
    </motion.div>
  );
}
