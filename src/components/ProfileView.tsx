import React, { useState } from 'react';
import {
  User,
  Settings,
  Bot,
  ShieldCheck,
  Info,
  Mail,
  ChevronLeft,
  ArrowRight,
  Package,
  Heart,
  Check,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Trash2,
  CheckCircle2,
  Star,
  Award,
  LogIn,
  LogOut,
} from 'lucide-react';
import { UserProfile, AppSettings, MarketItem, UserRole, LanguageCode } from '../types';
import { ItemCard } from './ItemCard';
import { StarRating } from './StarRating';
import { TRANSLATIONS } from '../utils/translations';

interface ProfileViewProps {
  profile: UserProfile;
  onUpdateProfile: (newProfile: UserProfile) => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  myItems: MarketItem[];
  favoritesCount: number;
  onOpenBot: () => void;
  onToast: (msg: string) => void;
  onResetData: () => void;
  onItemClick: (item: MarketItem) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onDeleteItem: (id: string) => void;
  onToggleSold: (id: string) => void;
  initialSubView?: string | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

type SubViewType = 'acc' | 'set' | 'safe' | 'about' | 'contact' | 'myItems' | null;

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  onUpdateProfile,
  settings,
  onUpdateSettings,
  myItems,
  favoritesCount,
  onOpenBot,
  onToast,
  onResetData,
  onItemClick,
  onToggleFavorite,
  onDeleteItem,
  onToggleSold,
  initialSubView = null,
  onOpenAuth,
  onLogout,
}) => {
  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.ckb;
  const [subView, setSubView] = useState<SubViewType>(initialSubView as SubViewType);

  // Form states for Account
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [role, setRole] = useState<UserRole>(profile.role);
  const [faculty, setFaculty] = useState(profile.faculty);
  const [phone, setPhone] = useState(profile.phone);

  // Report form state
  const [reportReason, setReportReason] = useState('');

  // Contact form state
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  const userRating = profile.rating || 4.9;
  const userRatingCount = profile.ratingCount || 18;

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      onToast('تکایە ناو بنووسە');
      return;
    }
    onUpdateProfile({
      name: name.trim(),
      email: email.trim(),
      role,
      faculty: faculty.trim(),
      phone: phone.trim(),
      rating: userRating,
      ratingCount: userRatingCount,
    });
    onToast('زانیارییەکانی هەژمار پاشەکەوتکران');
    setSubView(null);
  };

  const handleSendReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason.trim()) {
      onToast('تکایە هۆکاری ڕاپۆرتەکە بنووسە');
      return;
    }
    setReportReason('');
    onToast('ڕاپۆرتەکەت بە سەرکەوتوویی نێردرا');
    setSubView(null);
  };

  const handleSendContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactMessage.trim()) {
      onToast('تکایە پەیامەکەت بنووسە');
      return;
    }
    setContactMessage('');
    setContactSubject('');
    onToast(t.messageSent);
    setSubView(null);
  };

  const SUB_TITLES: Record<string, string> = {
    acc: 'زانیاری هەژمار',
    set: 'ڕێکخستنەکان',
    safe: 'سەلامەتی بەکارهێنەر',
    about: t.aboutTitle,
    contact: t.contactTitle,
    myItems: t.myListings,
  };

  // Render Subviews
  if (subView) {
    return (
      <div className="max-w-xl mx-auto text-start">
        {/* Back navigation */}
        <button
          onClick={() => setSubView(null)}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-4 transition-colors"
        >
          <ArrowRight className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
          <span>گەڕانەوە بۆ پرۆفایل / Back</span>
        </button>

        <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mb-4">
          {SUB_TITLES[subView]}
        </h2>

        {/* 1. Account Info View */}
        {subView === 'acc' && (
          <form
            onSubmit={handleSaveAccount}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4"
          >
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                ناوی تەواو
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                ئیمەیڵی فەرمی زانکۆ
              </label>
              <input
                type="email"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@univ.edu.iq"
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                پێگە / ڕۆڵ لە زانکۆ
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="قوتابی">قوتابی (Student)</option>
                <option value="مامۆستا">مامۆستا (Professor / Lecturer)</option>
                <option value="کارمەند">کارمەند (Staff)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                کۆلێژ / فاکەڵتی / زانکۆ
              </label>
              <input
                type="text"
                value={faculty}
                onChange={(e) => setFaculty(e.target.value)}
                placeholder="نموونە: زانکۆی سلێمانی - کۆلێژی زانست"
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                ژمارەی پەیوەندی (مۆبایل)
              </label>
              <input
                type="tel"
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Check className="w-4 h-4" />
              <span>پاشەکەوتکردن</span>
            </button>
          </form>
        )}

        {/* 2. Settings View */}
        {subView === 'set' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  شاردنەوەی ژمارەی مۆبایل
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  ژمارەکەت نیشان نادرێت تا کڕیار داوای پەیوەندی نەکات
                </div>
              </div>
              <button
                role="switch"
                aria-checked={settings.hidePhone}
                onClick={() =>
                  onUpdateSettings({ ...settings, hidePhone: !settings.hidePhone })
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.hidePhone ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    settings.hidePhone ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  ئاگادارکردنەوەکان (Notifications)
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  ئاگاداری داواکاری نوێ و پەیامەکان بە
                </div>
              </div>
              <button
                role="switch"
                aria-checked={settings.notifications}
                onClick={() =>
                  onUpdateSettings({
                    ...settings,
                    notifications: !settings.notifications,
                  })
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.notifications ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    settings.notifications ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="p-4 sm:p-5 flex items-center justify-between gap-4 bg-rose-50/50 dark:bg-rose-950/20">
              <div>
                <div className="text-sm font-bold text-rose-700 dark:text-rose-400">
                  سڕینەوەی داتاکان و ڕیسێت
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  گەڕانەوە بۆ باری سەرەتایی بەرنامەکە
                </div>
              </div>
              <button
                onClick={() => {
                  if (confirm('دڵنیایت لە سڕینەوە و ڕیسێتکردنی هەموو داتاکان؟')) {
                    onResetData();
                  }
                }}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors"
              >
                سڕینەوە
              </button>
            </div>
          </div>
        )}

        {/* 3. Safety View */}
        {subView === 'safe' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>ڕێنماییەکانی سەلامەتی لە بازاڕی زانکۆ</span>
              </h3>
              <ul className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-2.5 leading-relaxed list-disc list-inside">
                <li>کۆبوونەوە لە شوێنی گشتی ناو کەمپەس بکە وەک کافتریا و کتێبخانە.</li>
                <li>پێش پێدانی پارە کاڵاکە یان ئامێرەکە بە تەواوی بپشکنە.</li>
                <li>زانیاری بانک و کۆدی نهێنی بە کەس مەدە.</li>
                <li>لە کاتی هەر گومانێک دەتوانیت پەیوەندی بە سەرپەرشتیارانی بازاڕ بکەیت.</li>
              </ul>
            </div>

            {/* Report Form */}
            <form
              onSubmit={handleSendReport}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs"
            >
              <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span>ڕاپۆرتی بەکارهێنەر یان ڕیکلامی نەشیاو</span>
              </h3>
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="ڕوونکردنەوەی کێشەکە بنووسە..."
                rows={3}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 mb-3"
                required
              />
              <button
                type="submit"
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <span>ناردنی ڕاپۆرت</span>
              </button>
            </form>
          </div>
        )}

        {/* 4. About View */}
        {subView === 'about' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-4 leading-relaxed">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <img
                src="/assets/aistudio/Gemini_Generated_Image_dqd0x1dqd0x1dqd0_779672db.jpg"
                alt="ZankoBazaar Logo"
                className="w-14 h-14 rounded-full object-cover shadow-sm ring-2 ring-emerald-500/30"
              />
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  {t.appName}
                </h3>
                <div className="text-xs text-slate-400">{t.tagline}</div>
              </div>
            </div>
            <p>{t.aboutText}</p>
          </div>
        )}

        {/* 5. Contact View */}
        {subView === 'contact' && (
          <form
            onSubmit={handleSendContact}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4"
          >
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.subject}
              </label>
              <input
                type="text"
                value={contactSubject}
                onChange={(e) => setContactSubject(e.target.value)}
                placeholder="کێشەی تەکنیکی، پێشنیار..."
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.message}
              </label>
              <textarea
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="دەقی پەیامەکەت بنووسە..."
                rows={4}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Mail className="w-4 h-4" />
              <span>{t.send}</span>
            </button>
          </form>
        )}

        {/* 6. My Items View (with easy delete) */}
        {subView === 'myItems' && (
          <div className="space-y-3">
            {myItems.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-slate-500 dark:text-slate-400">
                <Package className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-sm font-semibold">تۆ هیچ کاڵایەکت دانەناوە.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div
                      onClick={() => onItemClick(item)}
                      className="flex items-center gap-3 cursor-pointer flex-1"
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                        style={{ backgroundColor: item.colorHex || '#e2e8f0' }}
                      >
                        {item.emoji || '📦'}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
                          {item.title}
                        </h4>
                        <div className="text-xs text-blue-600 dark:text-blue-400 font-bold">
                          {item.price.toLocaleString()} د.ع
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onToggleSold(item.id)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-bold border transition-colors ${
                          item.isSold
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-300'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200'
                        }`}
                      >
                        {item.isSold ? 'فرۆشراوە' : 'بەردەستە'}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(t.confirmRemove)) {
                            onDeleteItem(item.id);
                          }
                        }}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                        title={t.removeItem}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Primary Profile View
  return (
    <div className="max-w-xl mx-auto text-start space-y-4">
      {/* User Identity Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {profile.photoURL ? (
            <img
              src={profile.photoURL}
              alt={profile.name}
              className="w-14 h-14 rounded-2xl object-cover ring-2 ring-emerald-500/50 shadow-sm shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-black text-2xl flex items-center justify-center shadow-sm shrink-0">
              {profile.name.trim()[0] || '؟'}
            </div>
          )}
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 flex-wrap">
              <span>{profile.name}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                {profile.role}
              </span>
              {profile.uid ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {profile.authProvider === 'google'
                    ? 'هەژماری گووگڵ'
                    : profile.authProvider === 'phone'
                    ? 'ژمارەی مۆبایل'
                    : 'پشتڕاستکراوە'}
                </span>
              ) : (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                  میوان (نەچووەتە ژوورەوە)
                </span>
              )}
            </h2>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {profile.faculty || 'زانکۆ'}
            </div>
            <div className="text-xs text-slate-400 mt-0.5 font-mono" dir="ltr">
              {profile.email || profile.phoneNumber || profile.phone}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={() => setSubView('acc')}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            دەستکاری
          </button>

          {profile.uid ? (
            <button
              onClick={onLogout}
              className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="دەرچوون لە هەژمار"
            >
              <LogOut className="w-3.5 h-3.5 rtl:rotate-180" />
              <span>دەرچوون</span>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              title="چوونەژوورەوە بە فایەربەیس"
            >
              <LogIn className="w-3.5 h-3.5 rtl:rotate-180" />
              <span>چوونەژوورەوە</span>
            </button>
          )}
        </div>
      </div>

      {/* SELLER RATING CARD IN PROFILE */}
      <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
              {t.sellerRating} ({t.verifiedSeller})
            </h3>
          </div>
          <span className="text-xs text-amber-600 dark:text-amber-400 font-bold bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
            ئاستی باڵا
          </span>
        </div>

        <div className="flex items-center gap-5">
          <div className="text-center shrink-0">
            <div className="text-3xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
              {userRating.toFixed(1)}
            </div>
            <StarRating rating={userRating} size="sm" showText={false} />
            <div className="text-[11px] text-slate-400 mt-0.5">
              {userRatingCount} {t.ratingsCount}
            </div>
          </div>

          {/* Rating distribution progress bars */}
          <div className="flex-1 space-y-1.5 text-xs text-slate-500 dark:text-slate-400" dir="ltr">
            <div className="flex items-center gap-2">
              <span className="w-4 text-end text-[11px]">5★</span>
              <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: '85%' }} />
              </div>
              <span className="text-[10px] w-6 text-end">85%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 text-end text-[11px]">4★</span>
              <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: '12%' }} />
              </div>
              <span className="text-[10px] w-6 text-end">12%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 text-end text-[11px]">3★</span>
              <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: '3%' }} />
              </div>
              <span className="text-[10px] w-6 text-end">3%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Counter Strip */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setSubView('myItems')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-start hover:border-blue-400 transition-colors"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{t.myListings}</span>
            <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tabular-nums">
            {myItems.length}
          </div>
        </button>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-start">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{t.favorites}</span>
            <Heart className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tabular-nums">
            {favoritesCount}
          </div>
        </div>
      </div>

      {/* Menu Navigation List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 shadow-xs overflow-hidden">
        {/* Account */}
        <button
          onClick={() => setSubView('acc')}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-start"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                زانیاری هەژمار
              </div>
              <div className="text-xs text-slate-400">ناو، ئیمەیڵ، بەش و مۆبایل</div>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-slate-400 rtl:rotate-0 ltr:rotate-180" />
        </button>

        {/* My items */}
        <button
          onClick={() => setSubView('myItems')}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-start"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {t.myListings} ({myItems.length})
              </div>
              <div className="text-xs text-slate-400">بەڕێوەبردن، گۆڕینی دۆخ و سڕینەوە</div>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-slate-400 rtl:rotate-0 ltr:rotate-180" />
        </button>

        {/* AI Assistant Chatbot */}
        <button
          onClick={onOpenBot}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-start bg-gradient-to-l from-blue-50/40 dark:from-blue-950/20 to-transparent"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>{t.aiAssistantBtn}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                  AI
                </span>
              </div>
              <div className="text-xs text-slate-400">ڕاوێژی نرخ، سەلامەتی و کڕین</div>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-slate-400 rtl:rotate-0 ltr:rotate-180" />
        </button>

        {/* Settings */}
        <button
          onClick={() => setSubView('set')}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-start"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                ڕێکخستنەکان
              </div>
              <div className="text-xs text-slate-400">شاردنەوەی ژمارە، ئاگاداری و ڕیسێت</div>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-slate-400 rtl:rotate-0 ltr:rotate-180" />
        </button>

        {/* Safety */}
        <button
          onClick={() => setSubView('safe')}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-start"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                سەلامەتی بەکارهێنەر
              </div>
              <div className="text-xs text-slate-400">ڕێنمایی کڕینی سەلامەت و ڕاپۆرتکردن</div>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-slate-400 rtl:rotate-0 ltr:rotate-180" />
        </button>

        {/* About */}
        <button
          onClick={() => setSubView('about')}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-start"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {t.aboutTitle}
              </div>
              <div className="text-xs text-slate-400">ئامانج، یاسا و ناسنامە</div>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-slate-400 rtl:rotate-0 ltr:rotate-180" />
        </button>

        {/* Contact */}
        <button
          onClick={() => setSubView('contact')}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-start"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {t.contactTitle}
              </div>
              <div className="text-xs text-slate-400">پێشنیار، پەیوەندی بە کارگێڕی</div>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-slate-400 rtl:rotate-0 ltr:rotate-180" />
        </button>
      </div>
    </div>
  );
};
