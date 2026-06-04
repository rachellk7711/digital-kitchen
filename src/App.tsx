import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Home, Refrigerator, BookOpen, User, ChefHat, Utensils } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import Dashboard from './screens/Dashboard';
import Pantry from './screens/Pantry';
import RecipeList from './screens/RecipeList';
import RecipeDetail from './screens/RecipeDetail';
import RecipeModify from './screens/RecipeModify';
import KitchenArchive from './screens/KitchenArchive';
import ChefsStudy from './screens/ChefsStudy';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const NavItem = ({ to, icon: Icon, label, active }: { to: string; icon: any; label: string; active: boolean }) => (
  <Link
    to={to}
    className={cn(
      "flex flex-col items-center justify-center px-5 py-1.5 transition-all duration-300 ease-out active:scale-90",
      active ? "bg-orange-100 text-primary rounded-2xl" : "text-stone-500 hover:text-primary"
    )}
  >
    <Icon size={24} strokeWidth={active ? 2.5 : 2} />
    <span className="font-body text-[11px] font-medium mt-1">{label}</span>
  </Link>
);

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen pb-32">
      <header className="sticky top-0 z-50 w-full bg-surface/80 backdrop-blur-lg border-b border-surface-container">
        <div className="flex justify-between items-center px-6 py-4 w-full max-w-screen-xl mx-auto">
          <div className="flex items-center gap-3">
            <ChefHat className="text-primary-container" size={28} />
            <h1 className="text-xl font-bold text-on-surface font-headline tracking-tight">퍼스널 웰니스 셰프</h1>
          </div>
          <div className="h-10 w-10 rounded-full flex items-center justify-center border-2 border-primary-container shadow-sm bg-orange-50 text-orange-600">
            <ChefHat size={20} />
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-0 left-0 w-full z-50 bg-surface/80 backdrop-blur-lg shadow-[0_-4px_20px_rgba(0,0,0,0.04)] rounded-t-[2rem] border-t border-surface-container">
        <div className="flex justify-around items-center px-4 pt-3 pb-6 max-w-screen-xl mx-auto">
          <NavItem to="/" icon={Home} label="홈" active={location.pathname === '/'} />
          <NavItem to="/pantry" icon={Refrigerator} label="팬트리" active={location.pathname === '/pantry'} />
          <NavItem to="/recipes" icon={BookOpen} label="레시피" active={location.pathname === '/recipes'} />
          <NavItem to="/archive" icon={Utensils} label="아카이브" active={location.pathname === '/archive'} />
          <NavItem to="/study" icon={User} label="집무실" active={location.pathname === '/study'} />
        </div>
      </nav>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pantry" element={<Pantry />} />
          <Route path="/recipes" element={<RecipeList />} />
          <Route path="/recipe/:id" element={<RecipeDetail />} />
          <Route path="/recipe/:id/modify" element={<RecipeModify />} />
          <Route path="/archive" element={<KitchenArchive />} />
          <Route path="/study" element={<ChefsStudy />} />
        </Routes>
      </Layout>
    </Router>
  );
}
