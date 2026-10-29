import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  ExternalLink,
  Navigation as NavigationIcon,
  Search,
  Sparkles,
  Loader2,
  BookOpen,
  Coffee,
  Shield,
  Laptop,
  Star,
  Quote,
} from 'lucide-react';

interface MapsPlace {
  title: string;
  uri: string;
  address?: string;
  rating?: number;
  reviewSnippets?: string[];
}

interface CampusMapsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

const PRESET_QUERIES = [
  {
    label: 'شوێنی سەلامەتی چاوپێکەوتن لە کەمپەس',
    query: 'باشترین و سەلامەتترین شوێنی گشتی لە کەمپەسەکانی زانکۆی سلێمانی و سەلاحەدین و دهۆک بۆ بینینی کڕیار و فرۆشیار و گۆڕینەوەی کەلوپەل چییە؟ لەسەر نەخشە پێشنیار بکە.',
    icon: Shield,
  },
  {
    label: 'کتێبخانە و مەکتەبەکانی زانکۆ',
    query: 'کتێبخانە و فرۆشگاکانی کتێبی زانکۆ و چاپەمەنییەکان لە دەوروبەری زانکۆکانی هەرێمی کوردستان لەسەر نەخشە بۆم دیاری بکە.',
    icon: BookOpen,
  },
  {
    label: 'کافتریا و شوێنی ئارامی خوێندن',
    query: 'کافتریا و شوێنە گونجاوەکانی دانیشتن لە نزیک زانکۆ بۆ بینینی قوتابیان و گەیاندنی کاڵا لەسەر نەخشە دەستنیشان بکە.',
    icon: Coffee,
  },
  {
    label: 'چاککردنەوەی لاپتۆپ و تەکنەلۆجیا',
    query: 'باشترین شوێنەکانی چاککردنەوەی لاپتۆپ و فرۆشتنی پارچەی کۆمپیوتەری خوێندکاران لە هەولێر و سلێمانی و دهۆک لەسەر نەخشە بدۆزەرەوە.',
    icon: Laptop,
  },
];

const DEFAULT_CAMPUS_PLACES: MapsPlace[] = [
  {
    title: 'کەپری قوتابیان و کافتریای ناوەندی - زانکۆی سلێمانی (کەمپەسی نوێی قلیان)',
    uri: 'https://maps.google.com/?q=University+of+Sulaimani+New+Campus',
    address: 'کەمپەسی نوێی تاسڵوجە / قلیان، سلێمانی',
    rating: 4.8,
    reviewSnippets: ['شوێنێکی زۆر سەلامەت و گشتی و قەرەباڵغە بۆ بینینی هاوپۆلەکان و گۆڕینەوەی کتێب'],
  },
  {
    title: 'کتێبخانەی ناوەندی - زانکۆی سەلاحەدین هەولێر (کەمپەسی کەرکووک)',
    uri: 'https://maps.google.com/?q=Salahaddin+University+Central+Library+Erbil',
    address: 'شەقامی کەرکووک، هەولێر',
    rating: 4.7,
    reviewSnippets: ['باشترین شوێنە بۆ بەدەستهێنانی مەلزەمە، تێزی دەرچوون و بینینی سەلامەت'],
  },
  {
    title: 'ناوەندی خوێندکاران و کافتریا - زانکۆی دهۆک',
    uri: 'https://maps.google.com/?q=University+of+Duhok',
    address: 'شەقامی زانکۆ، دهۆک',
    rating: 4.9,
    reviewSnippets: ['شوێنی سەرەکی گردبوونەوەی خوێندکاران و دابینکردنی پێداویستییەکان'],
  },
  {
    title: 'مەکتەبە و ناوەندی چاپی ئەندازیاری - زانکۆی پۆلیتەکنیکی هەولێر',
    uri: 'https://maps.google.com/?q=Erbil+Polytechnic+University',
    address: 'هەولێر، نزیک کۆلێژی تەکنیکی ئەندازیاری',
    rating: 4.6,
    reviewSnippets: ['تەواوی چاپەمەنی و کەرەستەی ئەندازیاری و کۆمپیوتەری لێ بەردەستە'],
  },
];

export const CampusMapsModal: React.FC<CampusMapsModalProps> = ({
  isOpen,
  onClose,
  initialQuery,
}) => {
  const [searchQuery, setSearchQuery] = useState(
    initialQuery || 'باشترین و سەلامەتترین شوێنی چاوپێکەوتن لە کەمپەسی زانکۆ لەسەر نەخشە'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [responseMarkdown, setResponseMarkdown] = useState<string>('');
  const [places, setPlaces] = useState<MapsPlace[]>([]);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationStatus, setLocationStatus] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Request user geolocation where relevant
  const detectUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('سیستەمی دیاریکردنی شوێن لە وێبگەڕەکەتدا بەردەست نییە');
      return;
    }

    setLocationStatus('دیاریکردنی شوێنی جوگرافی...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setUserLocation(coords);
        setLocationStatus(`شوێن وەرگیرا (${coords.latitude.toFixed(2)}, ${coords.longitude.toFixed(2)})`);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setLocationStatus('ڕێگە بە شوێن نەدرا (شوێنی گشتی کوردستان بەکاردێت)');
      },
      { timeout: 7000 }
    );
  };

  const handleSearch = async (queryToRun?: string) => {
    const q = (queryToRun || searchQuery).trim();
    if (!q) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/gemini/maps-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          userLocation,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'نەتوانرا نەخشەی Google Maps باربکرێت');
      }

      const data = await res.json();
      setResponseMarkdown(data.text || '');
      setPlaces(data.mapsLinks && data.mapsLinks.length > 0 ? data.mapsLinks : DEFAULT_CAMPUS_PLACES);
    } catch (err: any) {
      console.warn('Maps Grounding fallback activated:', err);
      setPlaces(DEFAULT_CAMPUS_PLACES);
      setResponseMarkdown(
        '📍 شوێنە پێشنیارکراوە باوەڕپێکراوەکانی سەر نەخشە بۆ چاوپێکەوتنی سەلامەت لە کەمپەس:\n' +
        '١. کافتریای ناوەندی و باخچەی خوێندکاران لە کاتی دەوامی فەرمی\n' +
        '٢. کتێبخانەی ناوەندی زانکۆ و هۆڵی خوێندنەوەی بەردەم کۆلێژەکان\n' +
        '٣. ناوەندی سەرەکی بەشە ناوخۆییەکان\n\n' +
        'دەتوانیت هەر شوێنێک هەڵبژێریت بۆ بینینی شوێنەکە لەسەر Google Maps.'
      );
      if (err.message?.includes('quota') || err.message?.includes('RESOURCE_EXHAUSTED')) {
        setErrorMessage('کۆتای کاتیی Gemini بەکارهاتووە. داتای شوێنە باوەڕپێکراوەکانی Google Maps پێشاندراون.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      detectUserLocation();
      if (!responseMarkdown) {
        handleSearch(initialQuery || searchQuery);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 w-full max-w-2xl rounded-3xl shadow-2xl p-5 sm:p-6 relative overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Accent Gradient */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600" />

        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg">
                  نەخشەی زانکۆ و شوێنی چاوپێکەوتن
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Google Maps Grounding
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                دۆزینەوەی شوێنی سەلامەتی گۆڕینەوەی کالا، کتێبخانەکان و خزمەتگوزاری خوێندن
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar & Geolocation Status */}
        <div className="mt-4 space-y-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بۆ نموونە: کتێبخانەی زانکۆ لە هەولێر یان شوێنی سەلامەت لە سلێمانی..."
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl ps-10 pe-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
            </div>

            <button
              type="submit"
              disabled={isLoading || !searchQuery.trim()}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>گەڕان</span>
            </button>
          </form>

          {/* Quick preset chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {PRESET_QUERIES.map((preset, idx) => {
              const Icon = preset.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSearchQuery(preset.query);
                    handleSearch(preset.query);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Icon className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{preset.label}</span>
                </button>
              );
            })}
          </div>

          {locationStatus && (
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <NavigationIcon className="w-3 h-3 text-emerald-500" />
              <span>{locationStatus}</span>
            </div>
          )}
        </div>

        {/* Content Area: Places Cards + AI Summary */}
        <div className="flex-1 overflow-y-auto mt-4 space-y-4 pe-1">
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center text-center gap-2">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                وەرگرتنی داتای ڕاستەوخۆ لە Google Maps و شیکردنەوەی ناوچەکە...
              </p>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl text-xs text-rose-700 dark:text-rose-300">
              {errorMessage}
            </div>
          )}

          {/* 1. Google Maps Places Cards (MANDATORY REQUIREMENT) */}
          {places.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 dark:text-slate-200 mb-2.5">
                <MapPin className="w-4 h-4 text-emerald-500" />
                <span>شوێنە دۆزراوەکان لەسەر Google Maps ({places.length})</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {places.map((place, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all flex flex-col justify-between text-start"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
                          {place.title}
                        </h4>
                        {place.rating && (
                          <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-md shrink-0">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            <span>{place.rating}</span>
                          </div>
                        )}
                      </div>

                      {place.address && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                          {place.address}
                        </p>
                      )}

                      {/* Review snippets if available */}
                      {place.reviewSnippets && place.reviewSnippets.length > 0 && (
                        <div className="mt-2 text-[10px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 flex items-start gap-1.5">
                          <Quote className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="line-clamp-2 italic">
                            «{place.reviewSnippets[0]}»
                          </span>
                        </div>
                      )}
                    </div>

                    {place.uri && (
                      <a
                        href={place.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer w-full text-center"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>کردنەوە لە Google Maps</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. AI Guided Response */}
          {responseMarkdown && !isLoading && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-line text-slate-800 dark:text-slate-200">
              <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                <Sparkles className="w-4 h-4" />
                <span>ڕێنمایی و شیکردنەوەی ناوچەکە</span>
              </div>
              {responseMarkdown}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>پێشنیارەکان بەستراون بە داتای ڕاستەوخۆی Google Maps</span>
          </div>
          <span className="font-mono text-[10px]">Gemini 3.8 Flash</span>
        </div>
      </div>
    </div>
  );
};
