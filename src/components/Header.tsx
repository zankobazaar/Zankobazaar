import React from 'react';
import { Moon, Sun, Heart, Plus, Globe, Building2, User as UserIcon, LogIn } from 'lucide-react';
import { AppSettings, LanguageCode, UserProfile } from '../types';
import { TRANSLATIONS } from '../utils/translations';

interface HeaderProps {
  onOpenAdd: () => void;
  favoritesCount: number;
  onOpenFavorites: () => void;
  onOpenUniversities: () => void;
  settings: AppSettings;
  onToggleTheme: () => void;
  onSelectLanguage: (lang: LanguageCode) => void;
  onGoHome: () => void;
  currentUser?: UserProfile | null;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAdd,
  favoritesCount,
  onOpenFavorites,
  onOpenUniversities,
  settings,
  onToggleTheme,
  onSelectLanguage,
  onGoHome,
  currentUser,
  onOpenAuth,
}) => {
  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.ckb;

  const LANGUAGES: { code: LanguageCode; label: string; flag: string }[] = [
    { code: 'ckb', label: 'کوردی (سۆرانی)', flag: '☀️' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'ar', label: 'العربية', flag: '🇮🇶' },
    { code: 'kmr', label: 'بادینی', flag: '☀️' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors shadow-xs">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Zone 1: Logo & Brand Wordmark */}
        <button
          onClick={onGoHome}
          className="flex items-center gap-2.5 text-start focus:outline-none group shrink-0"
        >
          <img
            src="/assets/aistudio/Gemini_Generated_Image_dqd0x1dqd0x1dqd0_779672db.jpg"
            alt="ZankoBazaar Logo"
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover shadow-sm ring-1 ring-emerald-500/30 group-hover:scale-105 transition-transform"
          />
          <div className="hidden xs:block">
            <div className="text-base sm:text-lg font-black tracking-tight leading-tight flex items-center gap-1 text-slate-900 dark:text-white">
              <span>{t.appName}</span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[140px] sm:max-w-none">
              {t.tagline}
            </div>
          </div>
        </button>

        {/* Zone 2: Middle Navigation Shortcut to Universities Directory */}
        <div className="hidden lg:flex items-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <button
            onClick={onOpenUniversities}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-blue-700 dark:text-blue-400"
          >
            <Building2 className="w-4 h-4" />
            <span>{t.universities}</span>
          </button>
        </div>

        {/* Zone 3: Actions + Prominent Header "Post Ad" Button */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Universities Button (Mobile / Tablet icon) */}
          <button
            onClick={onOpenUniversities}
            className="lg:hidden w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={t.universities}
            aria-label={t.universities}
          >
            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </button>

          {/* Language Selector Dropdown */}
          <div className="relative group">
            <button
              className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title={t.language}
              aria-label={t.language}
            >
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span className="uppercase text-[11px] font-mono">{settings.language}</span>
            </button>
            <div className="absolute end-0 top-full mt-1 hidden group-hover:block group-focus-within:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg py-1.5 min-w-[130px] z-50 text-xs">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => onSelectLanguage(lang.code)}
                  className={`w-full text-start px-3 py-1.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                    settings.language === lang.code
                      ? 'font-bold text-blue-600 dark:text-blue-400'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>{lang.label}</span>
                  <span className="text-xs">{lang.flag}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Theme Switcher */}
          <button
            onClick={onToggleTheme}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={settings.theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            aria-label="Toggle theme"
          >
            {settings.theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* Favorites Button */}
          <button
            onClick={onOpenFavorites}
            className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={t.favorites}
            aria-label={t.favorites}
          >
            <Heart className="w-4 h-4 text-rose-500" />
            {favoritesCount > 0 && (
              <span className="absolute -top-1 -start-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center tabular-nums shadow-sm">
                {favoritesCount}
              </span>
            )}
          </button>

          {/* User Sign In / Profile Button */}
          {currentUser?.uid ? (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title={currentUser.name}
              aria-label="هەژماری بەکارهێنەر"
            >
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-lg object-cover ring-1 ring-emerald-500"
                />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  {currentUser.name.trim()[0] || 'U'}
                </div>
              )}
              <span className="hidden sm:inline text-xs font-bold text-slate-800 dark:text-slate-200 max-w-[85px] truncate">
                {currentUser.name}
              </span>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold border border-blue-600/40 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors shrink-0"
              title="چوونەژوورەوە بە فایەربەیس"
            >
              <LogIn className="w-3.5 h-3.5 rtl:rotate-180" />
              <span className="hidden xs:inline">چوونەژوورەوە</span>
            </button>
          )}

          {/* PROMINENT HEADER "AD PRODUCTS" BUTTON (Visible on all screens) */}
          <button
            onClick={onOpenAdd}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 text-slate-950 shadow-sm shadow-amber-500/20 transition-all shrink-0"
            title={t.adProduct}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="whitespace-nowrap">{t.adProduct}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
