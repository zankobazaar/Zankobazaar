import React, { useState } from 'react';
import {
  X,
  Mail,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Loader2,
  Lock,
  User as UserIcon,
  LogIn,
  UserPlus,
  Info,
  GraduationCap,
  Building2,
} from 'lucide-react';
import {
  loginWithGoogle,
  registerWithEmail,
  loginWithEmail,
} from '../services/authService';
import { UserProfile, LanguageCode, UserRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onAuthSuccess: (userProfile: Partial<UserProfile>) => void;
  onToast: (msg: string) => void;
  language?: LanguageCode;
  isGate?: boolean;
}

const UNIVERSITIES_LIST = [
  'زانکۆی سەلاحەدین - هەولێر',
  'زانکۆی سلێمانی',
  'زانکۆی دهۆک',
  'زانکۆی پۆلیتەکنیکی هەولێر',
  'زانکۆی پۆلیتەکنیکی سلێمانی',
  'زانکۆی پۆلیتەکنیکی دهۆک',
  'زانکۆی سۆران',
  'زانکۆی کۆیە',
  'زانکۆی زاخۆ',
  'زانکۆی گەرمیان',
  'زانکۆی ڕاپەڕین',
  'زانکۆی هەڵەبجە',
  'زانکۆی پزیشكیی هەولێر',
  'زانکۆی تیشكی نێودەوڵەتی (TIU)',
  'زانکۆی ئەمریکی لە کوردستان (AUK)',
  'زانکۆی کۆمار بۆ زانست و تەکنەلۆجیا',
  'زانکۆی جیهان',
  'زانکۆی لوبنانی فەڕەنسی (LFU)',
  'زانکۆی نەورۆز',
  'پەیمانگای تەکنیکی هەولێر',
  'پەیمانگای تەکنیکی سلێمانی',
  'پەیمانگای تەکنیکی دهۆک',
  'زانکۆ یان پەیمانگایەکی تر',
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  onToast,
  language = 'ckb',
  isGate = false,
}) => {
  // Mode: Sign In vs Sign Up
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  // Sign Up profile fields
  const [fullName, setFullName] = useState('');
  const [university, setUniversity] = useState(UNIVERSITIES_LIST[0]);
  const [role, setRole] = useState<UserRole>('قوتابی');

  // Email login / register state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Status & error handling
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoNotice, setInfoNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  // 1. Google Authentication (Sign In & Sign Up)
  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setInfoNotice(null);

    try {
      const extraData: Partial<UserProfile> = {
        role,
        faculty: university,
      };
      const user = await loginWithGoogle(extraData);
      onToast(`بەخێربێیت ${user.displayName || user.email || ''}!`);
      onAuthSuccess({
        uid: user.uid,
        name: user.displayName || 'بەکارهێنەری گووگڵ',
        email: user.email || '',
        photoURL: user.photoURL || undefined,
        phoneNumber: user.phoneNumber || undefined,
        phone: user.phoneNumber || '',
        role,
        faculty: university,
        authProvider: 'google',
      });
      if (onClose) onClose();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMessage('پەنجەرەی گووگڵ داخرا پێش تەواوبوون.');
      } else if (err.code === 'auth/operation-not-allowed' || err.message?.includes('operation-not-allowed')) {
        setErrorMessage(
          'خزمەتگوزاری Google Sign-in لە Firebase Console چالاک نەکراوە. دەتوانیت بە ئیمەیڵ بچیتە ژوورەوە.'
        );
      } else if (
        err.code === 'auth/token-service-api-has-not-been-used' ||
        err.message?.includes('token-service-api-has-not-been-used') ||
        err.message?.includes('securetoken.googleapis.com')
      ) {
        setErrorMessage(
          'پێویستە خزمەتگوزاری Secure Token API لە Google Cloud چالاک بکرێت (auth/token-service-api-has-not-been-used).'
        );
      } else {
        setErrorMessage(err.message || 'هەڵە لە چوونەژوورەوە بە گووگڵ');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Email Auth (Register or Sign In)
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('تکایە ئیمەیڵ و وشەی نهێنی بنووسە');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (authMode === 'signup') {
        if (!fullName.trim()) {
          setErrorMessage('تکایە ناوی تەواو بنووسە');
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setErrorMessage('وشەی نهێنی پێویستە لانیکەم ٦ پیت بێت');
          setIsLoading(false);
          return;
        }

        const user = await registerWithEmail(email, password, {
          name: fullName,
          faculty: university,
          role,
          phone: '',
        });

        onToast(`ئەکاونتەکەت دروستکرا! بەخێربێیت ${fullName}`);
        onAuthSuccess({
          uid: user.uid,
          name: fullName.trim(),
          email: user.email || email.trim(),
          role,
          faculty: university,
          phone: '',
          authProvider: 'email',
        });
      } else {
        const user = await loginWithEmail(email, password);
        onToast('بە سەرکەوتوویی چوویە ژوورەوە!');
        onAuthSuccess({
          uid: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'بەکارهێنەر',
          email: user.email || email.trim(),
          authProvider: 'email',
        });
      }

      if (onClose) onClose();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setErrorMessage('ئەم ئیمەیڵە پێشتر تۆمارکراوە. تکایە بەشی چوونەژوورەوە بەکاربێنە.');
      } else if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/user-not-found'
      ) {
        setErrorMessage('ئیمەیڵ یان وشەی نهێنی هەڵەیە');
      } else if (err.code === 'auth/operation-not-allowed') {
        setErrorMessage(
          'خزمەتگوزاری Email/Password لە Firebase Console چالاک نەکراوە (Authentication > Sign-in method).'
        );
      } else {
        setErrorMessage(err.message || 'هەڵە لە چوونەژوورەوە بە ئیمەیڵ');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 overflow-y-auto ${
        isGate ? 'bg-slate-900/90 backdrop-blur-md' : 'bg-slate-950/65 backdrop-blur-sm'
      }`}
      onClick={(e) => {
        if (!isGate && e.target === e.currentTarget && !isLoading && onClose) {
          onClose();
        }
      }}
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-7 text-start relative overflow-hidden my-auto max-h-[92vh] overflow-y-auto">
        {/* Accent Top Gradient */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-600 via-amber-500 to-emerald-500" />

        {/* Modal Header */}
        <div className="flex items-start justify-between mb-4 mt-1">
          <div className="flex items-center gap-3">
            <img
              src="/public/assets/aistudio/Gemini_Generated_Image_dqd0x1dqd0x1dqd0_779672db.jpg"
              alt="زانکۆ بازار"
              className="w-12 h-12 rounded-2xl object-cover shadow-sm ring-2 ring-blue-500/20 shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg sm:text-xl text-slate-900 dark:text-slate-100">
                  زانکۆ بازار
                </h3>
                <span className="text-[10px] bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold px-2 py-0.5 rounded-full">
                  پلاتفۆرمی زانکۆ
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {authMode === 'signup'
                  ? 'دروستکردنی هەژماری نوێ بۆ کڕین و فرۆشتن'
                  : 'چوونەژوورەوە بۆ هەژماری زانکۆ بازار'}
              </p>
            </div>
          </div>

          {!isGate && onClose && (
            <button
              onClick={onClose}
              disabled={isLoading}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Mandatory Gate Notice */}
        {isGate && (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-2xl flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-200">
            <Lock className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              بۆ متمانە و پاراستنی قوتابیان، پێویستە سەرەتا بە هەژماری گووگڵ یان ئیمەیڵ بچیتە ژوورەوە.
            </span>
          </div>
        )}

        {/* Main Mode Toggle: Sign In vs Sign Up */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl mb-5">
          <button
            type="button"
            onClick={() => {
              setAuthMode('signin');
              setErrorMessage(null);
              setInfoNotice(null);
            }}
            className={`py-2.5 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              authMode === 'signin'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>چوونەژوورەوە (Sign In)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMode('signup');
              setErrorMessage(null);
              setInfoNotice(null);
            }}
            className={`py-2.5 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              authMode === 'signup'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>دروستکردنی ئەکاونت (Sign Up)</span>
          </button>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
            <div className="flex-1 leading-relaxed">
              <p className="font-semibold">{errorMessage}</p>
              {errorMessage.includes('auth/operation-not-allowed') && (
                <div className="mt-2 pt-2 border-t border-rose-200 dark:border-rose-800 text-[11px] text-rose-600 dark:text-rose-300">
                  <span className="font-bold">چارەسەر لە کۆنسۆڵی فایەربەیس:</span>
                  <ol className="list-decimal list-inside mt-1 space-y-0.5">
                    <li>بچۆ بۆ کۆنسۆڵی Firebase بۆ پڕۆژەکەت</li>
                    <li>لە بەشی Authentication کلیک لەسەر Sign-in method بکە</li>
                    <li>خزمەتگوزاری گووگڵ (Google) یان Email/Password چالاک بکە</li>
                  </ol>
                </div>
              )}
              {(errorMessage.includes('token-service-api-has-not-been-used') ||
                errorMessage.includes('Secure Token API')) && (
                <div className="mt-2 pt-2 border-t border-rose-200 dark:border-rose-800 text-[11px] text-rose-600 dark:text-rose-300">
                  <span className="font-bold">چالاککردنی Secure Token:</span>
                  <p className="mt-1">
                    پێویستە ئەم خزمەتگوزارییە لە Google Cloud Console بۆ پڕۆژەکەت چالاک بێت:
                  </p>
                  <a
                    href="https://console.developers.google.com/apis/api/securetoken.googleapis.com/overview?project=624280796929"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-1 font-bold underline text-blue-600 dark:text-blue-400"
                  >
                    کلیک لێرە بکە بۆ کردنەوەی پەڕەی چالاککردن
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Informative Guidance Banner */}
        {infoNotice && (
          <div className="mb-4 p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-800 dark:text-blue-200 flex items-start gap-2.5 animate-in fade-in">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
            <div className="flex-1 leading-relaxed">
              <span>{infoNotice}</span>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* OPTION 1: GOOGLE (Sign In & Sign Up)                     */}
        {/* ======================================================== */}
        <div className="mb-4">
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm flex items-center justify-center gap-3 shadow-xs transition-all active:scale-98 disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>
              {authMode === 'signup'
                ? 'خۆتۆمارکردن بە هەژماری گووگڵ (Google)'
                : 'چوونەژوورەوە بە هەژماری گووگڵ (Google)'}
            </span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
          <span className="bg-white dark:bg-slate-900 px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider absolute">
            یان بە ئیمەیڵ و پاسۆرد
          </span>
        </div>

        {/* ======================================================== */}
        {/* OPTION 2: EMAIL & PASSWORD AUTHENTICATION                */}
        {/* ======================================================== */}
        <form onSubmit={handleEmailAuth} className="space-y-3.5">
          {authMode === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ناوی تەواو *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="ناوی خۆت بنووسە (نموونە: هێمن عەلی)"
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <UserIcon className="w-4 h-4 text-slate-400 absolute end-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ڕۆڵی ئەکادیمی *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  >
                    <option value="قوتابی">🎓 قوتابی</option>
                    <option value="مامۆستا">👨‍🏫 مامۆستا</option>
                    <option value="کارمەند">💼 کارمەند</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    زانکۆ یان پەیمانگا
                  </label>
                  <select
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 truncate"
                  >
                    {UNIVERSITIES_LIST.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              ئیمەیڵ (Email Address) *
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@univ.edu.krd یان gmail"
                dir="ltr"
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                required
              />
              <Mail className="w-4 h-4 text-slate-400 absolute end-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              وشەی نهێنی (Password) *
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="لانیکەم ٦ پیت یان ژمارە"
                dir="ltr"
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                minLength={6}
              />
              <Lock className="w-4 h-4 text-slate-400 absolute end-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98 disabled:opacity-50 cursor-pointer mt-1"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {authMode === 'signup'
                    ? 'دروستکردنی ئەکاونت (Sign Up)'
                    : 'چوونەژوورەوە بە ئیمەیڵ (Sign In)'}
                </span>
              </>
            )}
          </button>
        </form>

        {/* Security / Academic Trust Footer */}
        <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>سیستەمی پارێزراوی زانکۆ بازار</span>
          </div>
          <span className="font-mono text-[10px]">Google & Email Auth</span>
        </div>
      </div>
    </div>
  );
};
