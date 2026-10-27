import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  Heart,
  Sparkles,
  PackageX,
  Building2,
  Mail,
  Send,
  ShieldCheck,
  Award,
  CheckCircle2,
  Trash2,
  RotateCcw
} from 'lucide-react';
import {
  MarketItem,
  UserProfile,
  AppSettings,
  CategoryType,
  LanguageCode
} from './types';
import { INITIAL_ITEMS, CATEGORIES } from './data/initialItems';
import { TRANSLATIONS } from './utils/translations';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { ItemCard } from './components/ItemCard';
import { ItemDetailModal } from './components/ItemDetailModal';
import { AddListingModal } from './components/AddListingModal';
import { ChatbotModal } from './components/ChatbotModal';
import { UniversitiesModal } from './components/UniversitiesModal';
import { SellerChatModal } from './components/SellerChatModal';
import { ProfileView } from './components/ProfileView';
import { AuthModal } from './components/AuthModal';
import { Toast } from './components/Toast';
import {
  subscribeToMarketItems,
  addMarketItemToFirestore,
  updateMarketItemInFirestore,
  deleteMarketItemFromFirestore,
} from './services/itemService';
import {
  subscribeToAuth,
  logoutUser,
  saveUserData,
  getUserDataFromFirestore,
} from './services/authService';
import { auth } from './lib/firebase';

const STORAGE_KEY = 'zb_university_market_v3_clean';

export default function App() {
  // App Persistent State: Initialized to empty array as requested: "تکایە بەرهەمەکان رەشکەوە بەتالی کەوە"
  const [items, setItems] = useState<MarketItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.items && Array.isArray(parsed.items)) return parsed.items;
      }
    } catch (e) {
      console.error(e);
    }
    return []; // Empty by default
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.favorites && Array.isArray(parsed.favorites)) return parsed.favorites;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Real-time Firestore sync
  useEffect(() => {
    const unsubscribe = subscribeToMarketItems(
      (firestoreItems) => {
        if (firestoreItems && firestoreItems.length > 0) {
          setItems(firestoreItems);
        }
      },
      (err) => {
        console.warn('Real-time sync notice:', err);
      }
    );
    return () => unsubscribe();
  }, []);

  // Firebase Auth state listener
  useEffect(() => {
    const unsubAuth = subscribeToAuth(async (authUser) => {
      if (authUser) {
        try {
          const remoteProfile = await getUserDataFromFirestore(authUser.uid);
          setProfile((prev) => ({
            ...prev,
            uid: authUser.uid,
            name: remoteProfile?.name || authUser.displayName || prev.name,
            email: authUser.email || remoteProfile?.email || prev.email,
            phone: remoteProfile?.phone || authUser.phoneNumber || prev.phone,
            phoneNumber: authUser.phoneNumber || remoteProfile?.phoneNumber || prev.phoneNumber,
            photoURL: authUser.photoURL || remoteProfile?.photoURL || prev.photoURL,
            faculty: remoteProfile?.faculty || prev.faculty,
            role: remoteProfile?.role || prev.role,
            rating: remoteProfile?.rating ?? prev.rating,
            ratingCount: remoteProfile?.ratingCount ?? prev.ratingCount,
            authProvider: authUser.phoneNumber
              ? 'phone'
              : authUser.providerData[0]?.providerId.includes('google')
              ? 'google'
              : 'guest',
          }));
        } catch (e) {
          console.warn('Error reading user profile from Firestore:', e);
        }
      } else {
        setProfile((prev) => {
          if (!prev.uid) return prev;
          const { uid, photoURL, phoneNumber, authProvider, ...rest } = prev;
          return { ...rest };
        });
      }
    });
    return () => unsubAuth();
  }, []);

  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.profile) return parsed.profile;
      }
    } catch (e) {
      console.error(e);
    }
    return {
      name: 'ئاراس ئەحمەد',
      email: 'aras.ahmed@univ.edu.iq',
      role: 'قوتابی',
      faculty: 'کۆلێژی زانست - بەشی کۆمپیوتەر',
      phone: '0750 123 4567',
      rating: 5.0,
      ratingCount: 1,
    };
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.settings) return parsed.settings;
      }
    } catch (e) {
      console.error(e);
    }
    return {
      hidePhone: true,
      notifications: true,
      theme: 'auto',
      language: 'ckb',
    };
  });

  // UI Navigation & Filters State
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'favorites' | 'profile'>('home');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('هەموو');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceFilter, setPriceFilter] = useState<'all' | 'under10' | '10to50' | 'above50'>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'priceAsc' | 'priceDesc'>('newest');

  // Modals & Feedback
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isUniversitiesOpen, setIsUniversitiesOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [chattingItem, setChattingItem] = useState<MarketItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Home Contact form state
  const [homeContactName, setHomeContactName] = useState('');
  const [homeContactEmail, setHomeContactEmail] = useState('');
  const [homeContactMsg, setHomeContactMsg] = useState('');

  // Current language dictionary
  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.ckb;

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          items,
          favorites,
          profile,
          settings,
        })
      );
    } catch (e) {
      console.error(e);
    }
  }, [items, favorites, profile, settings]);

  // Apply Theme & Direction
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateTheme = () => {
      const isDark =
        settings.theme === 'dark' ||
        (settings.theme === 'auto' && mediaQuery.matches);

      if (isDark) {
        root.classList.add('dark');
        root.setAttribute('data-theme', 'dark');
      } else {
        root.classList.remove('dark');
        root.setAttribute('data-theme', 'light');
      }
    };

    updateTheme();

    if (settings.theme === 'auto') {
      mediaQuery.addEventListener('change', updateTheme);
      return () => mediaQuery.removeEventListener('change', updateTheme);
    }
  }, [settings.theme]);

  // Direction & Language
  useEffect(() => {
    const root = document.documentElement;
    if (settings.language === 'en') {
      root.setAttribute('dir', 'ltr');
      root.setAttribute('lang', 'en');
    } else {
      root.setAttribute('dir', 'rtl');
      root.setAttribute('lang', settings.language);
    }
  }, [settings.language]);

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  // Toggle Favorite
  const handleToggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavorites((prev) => {
      const exists = prev.includes(id);
      if (exists) {
        showToast('لە دڵخوازەکان لادرا');
        return prev.filter((item) => item !== id);
      } else {
        showToast('بۆ دڵخوازەکان زیادکرا');
        return [...prev, id];
      }
    });
  };

  // Add Item
  const handleAddItem = (newItem: MarketItem) => {
    setItems((prev) => [newItem, ...prev]);
    setActiveTab('home');
    setSelectedCategory('هەموو');
    addMarketItemToFirestore(newItem).catch((err) =>
      console.warn('Error saving to Firestore:', err)
    );
  };

  // Delete / Remove Item
  const handleDeleteItem = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (selectedItem?.id === id) setSelectedItem(null);
    deleteMarketItemFromFirestore(id).catch((err) =>
      console.warn('Error deleting from Firestore:', err)
    );
    showToast(t.itemRemoved);
  };

  // Clear all products (Empty products as requested: "تکایە بەرهەمەکان رەشکەوە بەتالی کەوە")
  const handleClearAllItems = () => {
    if (confirm('دڵنیایت لە سڕینەوە و بەتاڵکردنەوەی هەموو کاڵاکان؟')) {
      items.forEach((item) => {
        deleteMarketItemFromFirestore(item.id).catch(() => {});
      });
      setItems([]);
      setFavorites([]);
      showToast('هەموو بەرهەمەکان سڕانەوە و لیستەکە بەتاڵ کرا');
    }
  };

  // Load demo items option
  const handleLoadDemoItems = () => {
    setItems(INITIAL_ITEMS);
    INITIAL_ITEMS.forEach((it) => {
      addMarketItemToFirestore(it).catch(() => {});
    });
    showToast('نموونەی کاڵاکان بارکرانەوە');
  };

  // Toggle Sold
  const handleToggleSold = (id: string) => {
    const target = items.find((i) => i.id === id);
    const newSoldState = target ? !target.isSold : true;

    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, isSold: newSoldState } : i))
    );
    if (selectedItem?.id === id) {
      setSelectedItem((prev) => (prev ? { ...prev, isSold: newSoldState } : null));
    }
    updateMarketItemInFirestore(id, { isSold: newSoldState }).catch((err) =>
      console.warn('Error updating sold status in Firestore:', err)
    );
    showToast('دۆخی کاڵاکە نوێکرایەوە');
  };

  // Rate Seller
  const handleRateSeller = (itemId: string, newStars: number) => {
    let updatedRating = 5.0;
    let newCount = 1;

    setItems((prev) =>
      prev.map((it) => {
        if (it.id === itemId) {
          const currentRating = it.sellerRating || 4.8;
          const currentCount = it.sellerRatingCount || 10;
          newCount = currentCount + 1;
          updatedRating = parseFloat(
            ((currentRating * currentCount + newStars) / newCount).toFixed(1)
          );
          return {
            ...it,
            sellerRating: updatedRating,
            sellerRatingCount: newCount,
          };
        }
        return it;
      })
    );

    updateMarketItemInFirestore(itemId, {
      sellerRating: updatedRating,
      sellerRatingCount: newCount,
    }).catch((err) => console.warn('Error updating rating in Firestore:', err));
    const targetItem = items.find((i) => i.id === itemId);
    if (targetItem?.isMine) {
      setProfile((prev) => {
        const count = (prev.ratingCount || 1) + 1;
        const current = prev.rating || 5.0;
        const newAvg = (current * (count - 1) + newStars) / count;
        return {
          ...prev,
          rating: parseFloat(newAvg.toFixed(1)),
          ratingCount: count,
        };
      });
    }
  };

  // Reset Data
  const handleResetData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setItems([]); // Empty
    setFavorites([]);
    setProfile({
      name: 'ئاراس ئەحمەد',
      email: 'aras.ahmed@univ.edu.iq',
      role: 'قوتابی',
      faculty: 'کۆلێژی زانست - بەشی کۆمپیوتەر',
      phone: '0750 123 4567',
      rating: 5.0,
      ratingCount: 1,
    });
    setSettings({
      hidePhone: true,
      notifications: true,
      theme: 'auto',
      language: 'ckb',
    });
    showToast('داتاکان پاککرانەوە و بەتاڵ کران');
  };

  // Auth handlers
  const handleAuthSuccess = (updatedData: Partial<UserProfile>) => {
    setProfile((prev) => ({
      ...prev,
      ...updatedData,
    }));
    showToast('بە سەرکەوتوویی چووە ژوورەوە!');
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setProfile((prev) => {
        const { uid, photoURL, phoneNumber, authProvider, ...rest } = prev;
        return rest;
      });
      showToast('بە سەرکەوتوویی دەرچوویت لە هەژمار');
    } catch (e) {
      showToast('هەڵە لە دەرچوون');
    }
  };

  const handleUpdateProfile = (newProfile: UserProfile) => {
    setProfile(newProfile);
    if (auth.currentUser) {
      saveUserData(auth.currentUser, newProfile).catch((err) =>
        console.warn('Failed to sync updated profile to Firestore:', err)
      );
    }
  };

  // Handle Home Contact submit
  const handleHomeContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeContactMsg.trim()) return;
    setHomeContactMsg('');
    showToast(t.messageSent);
  };

  // Filtered Items computation
  const filteredItems = useMemo(() => {
    let result = [...items];

    // Category filter
    if (selectedCategory !== 'هەموو') {
      result = result.filter((i) => i.category === selectedCategory);
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.faculty.toLowerCase().includes(q) ||
          i.sellerName.toLowerCase().includes(q) ||
          (i.location && i.location.toLowerCase().includes(q))
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      result = result.filter((i) => i.sellerRole === roleFilter);
    }

    // Price Filter
    if (priceFilter === 'under10') {
      result = result.filter((i) => i.price < 10000);
    } else if (priceFilter === '10to50') {
      result = result.filter((i) => i.price >= 10000 && i.price <= 50000);
    } else if (priceFilter === 'above50') {
      result = result.filter((i) => i.price > 50000);
    }

    // Sorting
    if (sortBy === 'priceAsc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'priceDesc') {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [items, selectedCategory, searchQuery, roleFilter, priceFilter, sortBy]);

  const myItems = useMemo(() => items.filter((i) => i.isMine), [items]);
  const favoriteItems = useMemo(
    () => items.filter((i) => favorites.includes(i.id)),
    [items, favorites]
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Header with Logo, Ad Product Button, and Language Switcher */}
      <Header
        onOpenAdd={() => setIsAddModalOpen(true)}
        favoritesCount={favorites.length}
        onOpenFavorites={() => setActiveTab('favorites')}
        onOpenUniversities={() => setIsUniversitiesOpen(true)}
        settings={settings}
        currentUser={profile}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onToggleTheme={() =>
          setSettings((prev) => ({
            ...prev,
            theme: prev.theme === 'dark' ? 'light' : 'dark',
          }))
        }
        onSelectLanguage={(newLang) =>
          setSettings((prev) => ({ ...prev, language: newLang }))
        }
        onGoHome={() => {
          setActiveTab('home');
          setSelectedCategory('هەموو');
          setSearchQuery('');
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 pb-28 md:pb-12 text-start">
        {/* TAB 1: HOME */}
        {activeTab === 'home' && (
          <div className="space-y-8">
            {/* Hero Section with New Logo */}
            <section className="relative rounded-3xl bg-gradient-to-br from-blue-800 via-indigo-800 to-slate-900 text-white p-6 sm:p-9 shadow-xl overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold mb-3">
                    <img
                      src="/assets/aistudio/Gemini_Generated_Image_dqd0x1dqd0x1dqd0_779672db.jpg"
                      alt="Logo"
                      className="w-4 h-4 rounded-full object-cover"
                    />
                    <span>{t.tagline}</span>
                  </div>

                  <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-snug mb-3">
                    {t.heroTitle}
                  </h1>

                  <p className="text-xs sm:text-base text-blue-100 leading-relaxed max-w-xl mb-6">
                    {t.heroSubtitle}
                  </p>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => setIsAddModalOpen(true)}
                      className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all hover:scale-105"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>{t.adProduct}</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('search')}
                      className="px-5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm flex items-center gap-2 backdrop-blur-md transition-colors"
                    >
                      <Search className="w-4 h-4" />
                      <span>{t.exploreBtn}</span>
                    </button>

                    <button
                      onClick={() => setIsUniversitiesOpen(true)}
                      className="px-4 py-2.5 rounded-xl bg-blue-600/40 hover:bg-blue-600/60 text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 backdrop-blur-md transition-colors"
                    >
                      <Building2 className="w-4 h-4 text-blue-200" />
                      <span>{t.universities}</span>
                    </button>

                    <button
                      onClick={() => setIsChatbotOpen(true)}
                      className="px-4 py-2.5 rounded-xl bg-indigo-500/30 hover:bg-indigo-500/50 text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 backdrop-blur-md transition-colors"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>{t.aiAssistantBtn}</span>
                    </button>
                  </div>
                </div>

                {/* Hero Logo Emblem on Desktop */}
                <div className="hidden md:flex flex-col items-center justify-center shrink-0">
                  <div className="w-36 h-36 rounded-full bg-white/10 p-2 backdrop-blur-md shadow-2xl border border-white/20 hover:scale-105 transition-transform">
                    <img
                      src="/assets/aistudio/Gemini_Generated_Image_dqd0x1dqd0x1dqd0_779672db.jpg"
                      alt="ZankoBazaar Emblem"
                      className="w-full h-full object-cover rounded-full shadow-inner"
                    />
                  </div>
                  <span className="text-xs font-bold text-amber-300 mt-2">ZANKOBAZAAR</span>
                </div>
              </div>

              {/* Decorative shapes */}
              <div className="absolute -left-12 -bottom-16 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute right-0 top-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            </section>

            {/* Quick Search Bar */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pe-11 ps-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
              />
              <Search className="absolute end-4 top-3.5 w-4 h-4 text-slate-400" />
            </div>

            {/* Category Filter Chips Bar */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {t.categoriesTitle}
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">{filteredItems.length} {t.price}</span>
                  {items.length > 0 && (
                    <button
                      onClick={handleClearAllItems}
                      className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1 font-semibold"
                      title="سڕینەوە و بەتاڵکردنی بەرهەمەکان"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>بەتاڵکردنەوە</span>
                    </button>
                  )}
                </div>
              </div>

              <div
                className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none"
                role="group"
                aria-label={t.categoriesTitle}
              >
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  const count =
                    cat.id === 'هەموو'
                      ? items.length
                      : items.filter((i) => i.category === cat.id).length;

                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id as CategoryType)}
                      className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20 scale-[1.02]'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      aria-pressed={isSelected}
                    >
                      <span>{cat.emoji}</span>
                      <span>{cat.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums ${
                          isSelected
                            ? 'bg-white/25 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grid Header & Sort */}
            <div className="flex items-center justify-between pt-1">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>{t.latestItems}</span>
                {selectedCategory !== 'هەموو' && (
                  <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                    ({selectedCategory})
                  </span>
                )}
              </h2>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400 hidden sm:inline">{t.sort}:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="newest">{t.newest}</option>
                  <option value="priceAsc">{t.cheapest}</option>
                  <option value="priceDesc">{t.priciest}</option>
                </select>
              </div>
            </div>

            {/* Product Grid / Empty State (when empty) */}
            {filteredItems.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-10 text-center space-y-4 shadow-xs">
                <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-inner">
                  <PackageX className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                    لیستی بەرهەمەکان بەتاڵە
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                    هێشتا هیچ کاڵایەک دانەنراوە. دەتوانیت یەکەم کەس بیت کە ڕیکلام بۆ کەرەستە و کتێبەکانت دابنێیت!
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2 shadow-sm transition-transform hover:scale-105"
                  >
                    <Plus className="w-4 h-4" />
                    <span>کالایەکی نوێ زیاد بکە</span>
                  </button>
                  <button
                    onClick={handleLoadDemoItems}
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>بارکردنەوەی نموونەکان</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
                {filteredItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    isFavorite={favorites.includes(item.id)}
                    onToggleFavorite={handleToggleFavorite}
                    onClick={(it) => setSelectedItem(it)}
                    onDeleteItem={handleDeleteItem}
                    language={settings.language}
                  />
                ))}
              </div>
            )}

            {/* DIRECT "ABOUT" SECTION ON HOME */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden shrink-0 border-2 border-emerald-500/40 shadow-md">
                  <img
                    src="/assets/aistudio/Gemini_Generated_Image_dqd0x1dqd0x1dqd0_779672db.jpg"
                    alt="ZankoBazaar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 space-y-2 text-center md:text-start">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-3 py-1 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>کۆمەڵگەی متمانەپێکراوی کەمپەس</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                    {t.aboutTitle}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                    {t.aboutText}
                  </p>
                  <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      بێ کۆمسیۆن و بێ بەرامبەر
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      هەڵسەنگاندنی ئەستێرەیی فرۆشیاران
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      تایبەت بە زانکۆ و پەیمانگاکان
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* DIRECT "CONTACT" SECTION ON HOME */}
            <section className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
              <div className="max-w-2xl mx-auto space-y-5 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md mb-1">
                  <Mail className="w-6 h-6 text-amber-300" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                    {t.contactTitle}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1">
                    {t.contactSubtitle}
                  </p>
                </div>

                <form onSubmit={handleHomeContactSubmit} className="space-y-3 text-start">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        {t.yourName}
                      </label>
                      <input
                        type="text"
                        value={homeContactName}
                        onChange={(e) => setHomeContactName(e.target.value)}
                        placeholder="ئاراس ئەحمەد"
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        {t.yourEmail}
                      </label>
                      <input
                        type="email"
                        dir="ltr"
                        value={homeContactEmail}
                        onChange={(e) => setHomeContactEmail(e.target.value)}
                        placeholder="student@univ.edu.iq"
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      {t.message}
                    </label>
                    <textarea
                      value={homeContactMsg}
                      onChange={(e) => setHomeContactMsg(e.target.value)}
                      placeholder="پرسیار، پێشنیار، یان ڕاپۆرتەکەت لێرە بنووسە..."
                      rows={3}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    <span>{t.send}</span>
                  </button>
                </form>

                <div className="pt-2 text-xs text-slate-400">
                  <span>پەیوەندی ڕاستەوخۆ: </span>
                  <a
                    href="mailto:walibakir94@gmail.com"
                    className="text-amber-300 underline font-mono"
                  >
                    support@zankobazaar.iq
                  </a>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: SEARCH & FILTERS */}
        {activeTab === 'search' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mb-1">
                {t.search}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.searchPlaceholder}
              </p>
            </div>

            {/* Big Search Input */}
            <div className="relative">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                autoFocus
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pe-12 ps-4 py-3.5 text-sm sm:text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
              />
              <Search className="absolute end-4 top-4 w-5 h-5 text-slate-400" />
            </div>

            {/* Filter Controls Row */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
                  {t.categoriesTitle}:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id as CategoryType)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        selectedCategory === cat.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Filter Chips */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
                  مەودای نرخ / Price Range:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'all', label: 'هەموو نرخەکان' },
                    { id: 'under10', label: '< 10,000 د.ع' },
                    { id: '10to50', label: '10,000 - 50,000 د.ع' },
                    { id: 'above50', label: '> 50,000 د.ع' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPriceFilter(p.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        priceFilter === p.id
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Seller Role Filter */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
                  ڕۆڵی فرۆشیار / Seller Role:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'all', label: 'هەمووان (All)' },
                    { id: 'قوتابی', label: 'قوتابی (Student)' },
                    { id: 'مامۆستا', label: 'مامۆستا (Professor)' },
                    { id: 'کارمەند', label: 'کارمەند (Staff)' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setRoleFilter(r.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        roleFilter === r.id
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Results count & grid */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">
                ئەنجام: {filteredItems.length}
              </span>
              {(selectedCategory !== 'هەموو' ||
                searchQuery ||
                priceFilter !== 'all' ||
                roleFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSelectedCategory('هەموو');
                    setSearchQuery('');
                    setPriceFilter('all');
                    setRoleFilter('all');
                  }}
                  className="text-xs text-rose-500 hover:underline"
                >
                  {t.resetFilters}
                </button>
              )}
            </div>

            {filteredItems.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center text-slate-500">
                {t.noItemsFound}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
                {filteredItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    isFavorite={favorites.includes(item.id)}
                    onToggleFavorite={handleToggleFavorite}
                    onClick={(it) => setSelectedItem(it)}
                    onDeleteItem={handleDeleteItem}
                    language={settings.language}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: FAVORITES */}
        {activeTab === 'favorites' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                  {t.favoritesTitle}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t.tagline}
                </p>
              </div>
              <span className="text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold px-3 py-1 rounded-full">
                {favoriteItems.length}
              </span>
            </div>

            {favoriteItems.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center space-y-3">
                <Heart className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  {t.emptyFavorites}
                </h3>
                <button
                  onClick={() => setActiveTab('home')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  {t.exploreBtn}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
                {favoriteItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    isFavorite={true}
                    onToggleFavorite={handleToggleFavorite}
                    onClick={(it) => setSelectedItem(it)}
                    onDeleteItem={handleDeleteItem}
                    language={settings.language}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PROFILE */}
        {activeTab === 'profile' && (
          <ProfileView
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            settings={settings}
            onUpdateSettings={(s) => setSettings(s)}
            myItems={myItems}
            favoritesCount={favorites.length}
            onOpenBot={() => setIsChatbotOpen(true)}
            onToast={showToast}
            onResetData={handleResetData}
            onItemClick={(it) => setSelectedItem(it)}
            onToggleFavorite={handleToggleFavorite}
            onDeleteItem={handleDeleteItem}
            onToggleSold={handleToggleSold}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Floating Bottom Nav */}
      <Navigation
        currentTab={activeTab}
        onTabChange={(tab) => {
          if (tab === 'add') {
            setIsAddModalOpen(true);
          } else {
            setActiveTab(tab as any);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        favoritesCount={favorites.length}
      />

      {/* Item Detail Modal with Star Rating and Delete */}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          isFavorite={favorites.includes(selectedItem.id)}
          onToggleFavorite={(id) => handleToggleFavorite(id)}
          settings={settings}
          onToast={showToast}
          onToggleSold={handleToggleSold}
          onDeleteItem={handleDeleteItem}
          onRateSeller={handleRateSeller}
          onOpenSellerChat={(it) => setChattingItem(it)}
          onOpenReport={(title) => {
            setActiveTab('profile');
            showToast(`فۆرمی ڕاپۆرتکردن بۆ "${title}" کرایەوە`);
          }}
        />
      )}

      {/* Direct Seller Chat Modal with Voice Notes */}
      {chattingItem && (
        <SellerChatModal
          item={chattingItem}
          isOpen={!!chattingItem}
          onClose={() => setChattingItem(null)}
          language={settings.language}
          onToast={showToast}
        />
      )}

      {/* Add Listing Modal */}
      <AddListingModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddItem={handleAddItem}
        profile={profile}
        onToast={showToast}
      />

      {/* Campus Assistant Chatbot Modal */}
      <ChatbotModal
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        onNavigateAdd={() => {
          setIsChatbotOpen(false);
          setIsAddModalOpen(true);
        }}
      />

      {/* Universities Directory Modal */}
      <UniversitiesModal
        isOpen={isUniversitiesOpen}
        onClose={() => setIsUniversitiesOpen(false)}
        language={settings.language}
      />

      {/* Firebase Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        onToast={showToast}
        language={settings.language}
      />

      {/* Toast Feedback */}
      <Toast message={toastMessage} />
    </div>
  );
}
