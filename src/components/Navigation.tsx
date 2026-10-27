import React from 'react';
import { Home, Search, Plus, User, Heart } from 'lucide-react';

interface NavigationProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  favoritesCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onTabChange,
  favoritesCount,
}) => {
  const navItems = [
    { id: 'home', label: 'سەرەکی', icon: Home },
    { id: 'search', label: 'گەڕان', icon: Search },
    { id: 'add', label: 'زیادکردن', icon: Plus, isAdd: true },
    { id: 'favorites', label: 'دڵخوازەکان', icon: Heart, badge: favoritesCount },
    { id: 'profile', label: 'پرۆفایل', icon: User },
  ];

  return (
    <nav
      aria-label="مێنیوی سەرەکی"
      className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800/80 px-2 sm:px-6 py-1.5 pb-[calc(0.4rem+env(safe-area-inset-bottom,0px))] md:py-2 transition-colors"
    >
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          if (item.isAdd) {
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className="group flex flex-col items-center justify-center -mt-5 focus:outline-none"
                aria-label="کالایەکی نوێ زیاد بکە"
              >
                <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-105 active:scale-95 transition-all">
                  <Plus className="w-7 h-7 stroke-[2.5]" />
                </div>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-1">
                  زیادکردن
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all focus:outline-none ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1 -start-2 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[11px] mt-0.5">{item.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
