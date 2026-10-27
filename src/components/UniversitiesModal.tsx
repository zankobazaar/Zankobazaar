import React, { useState } from 'react';
import { X, Search, ExternalLink, Building2, MapPin, Calendar, Compass } from 'lucide-react';
import { UniversityInfo, LanguageCode } from '../types';
import { UNIVERSITIES } from '../data/universities';
import { TRANSLATIONS } from '../utils/translations';

interface UniversitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: LanguageCode;
}

export const UniversitiesModal: React.FC<UniversitiesModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.ckb;
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'public' | 'private' | 'polytechnic'>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');

  if (!isOpen) return null;

  const cities = ['all', 'سلێمانی', 'هەولێر', 'دهۆک', 'زاخۆ', 'سۆران', 'هەڵەبجە', 'کەلار / گەرمیان', 'ڕانیە و قەڵادزێ'];

  const filtered = UNIVERSITIES.filter((u) => {
    const nameMatch =
      u.name[language]?.toLowerCase().includes(query.toLowerCase()) ||
      u.name.en.toLowerCase().includes(query.toLowerCase()) ||
      u.city[language]?.toLowerCase().includes(query.toLowerCase());
    const typeMatch = selectedType === 'all' || u.type === selectedType;
    const cityMatch = selectedCity === 'all' || u.city.ckb === selectedCity;
    return nameMatch && typeMatch && cityMatch;
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-3 sm:p-5 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden text-start">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100">
                {t.univDirectoryTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.univDirectorySubtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center shadow-xs transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3 bg-white dark:bg-slate-900">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ناوی زانکۆ یان شار بنووسە / Search university or city..."
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pe-10 ps-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute end-3.5 top-3 w-4 h-4 text-slate-400" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Type selector */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setSelectedType('all')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  selectedType === 'all' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                هەموو جۆرەکان
              </button>
              <button
                onClick={() => setSelectedType('public')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  selectedType === 'public' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                حکومی
              </button>
              <button
                onClick={() => setSelectedType('private')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  selectedType === 'private' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                ئەهلی / تایبەت
              </button>
              <button
                onClick={() => setSelectedType('polytechnic')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  selectedType === 'polytechnic' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                پۆلیتەکنیک
              </button>
            </div>
          </div>
        </div>

        {/* Directory Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 dark:bg-slate-950/40">
          {filtered.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 text-sm">
              هیچ زانکۆیەک نەدۆزرایەوە / No universities matched your query.
            </div>
          ) : (
            filtered.map((univ) => (
              <div
                key={univ.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between gap-3 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                      {univ.name[language] || univ.name.ckb}
                    </h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      univ.type === 'public'
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                        : univ.type === 'polytechnic'
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {univ.type === 'public' ? 'حکومی' : univ.type === 'polytechnic' ? 'پۆلیتەکنیک' : 'ئەهلی'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-2.5">
                    <span className="flex items-center gap-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {univ.city[language] || univ.city.ckb}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      دامەزراوە: {univ.founded}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                    {univ.description[language] || univ.description.ckb}
                  </p>

                  {univ.campuses && univ.campuses.length > 0 && (
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mb-2">
                      <Compass className="w-3 h-3" />
                      <span>کەمپەسەکان: {univ.campuses.join('، ')}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <a
                    href={univ.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 group"
                  >
                    <span>{t.visitWebsite}</span>
                    <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
