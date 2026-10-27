import React, { useState } from 'react';
import {
  X,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Loader2,
  Lock,
  User as UserIcon,
  GraduationCap,
  Building2,
  LogIn,
  UserPlus,
} from 'lucide-react';
import {
  loginWithGoogle,
  loginWithPhone,
  verifyOtpCode,
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
  isGate?: boolean; // When true, behaves as mandatory entry gate (no close button)
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
  const [activeTab, setActiveTab] = useState<'quick' | 'register' | 'email-login'>('quick');
  const [phoneStep, setPhoneStep] = useState<'input' | 'otp'>('input');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regFaculty, setRegFaculty] = useState(UNIVERSITIES_LIST[0]);
  const [regRole, setRegRole] = useState<UserRole>('قوتابی');

  // Email login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // 1. Google Login
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const user = await loginWithGoogle();
      onToast(`بەخێربێیت ${user.displayName || user.email || ''}!`);
      onAuthSuccess({
        uid: user.uid,
        name: user.displayName || 'بەکارهێنەری گووگڵ',
        email: user.email || '',
        photoURL: user.photoURL || undefined,
        phoneNumber: user.phoneNumber || undefined,
        phone: user.phoneNumber || '',
        authProvider: 'google',
      });
      if (onClose) onClose();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMessage('پەنجەرەی گووگڵ داخرا پێش تەواوبوون');
      } else {
        setErrorMessage(err.message || 'کێشە لە چوونەژوورەوەی گووگڵ');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Phone SMS OTP Request
  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      setErrorMessage('تکایە ژمارەی مۆبایل بنووسە');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await loginWithPhone(phoneNumber.trim(), 'recaptcha-container');
      setPhoneStep('otp');
      onToast('کۆدی پشتڕاستکردنەوە بە کورتەنامە (SMS) نێردرا!');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-phone-number') {
        setErrorMessage('ژمارەی مۆبایل نادروستە. نموونە: 07501234567 یان +9647501234567');
      } else if (err.code === 'auth/too-many-requests') {
        setErrorMessage('داواکاری زۆر نێردراوە. تکایە پاش کەمێکی تر هەوڵبدەرەوە');
      } else {
        setErrorMessage('کێشە لە ناردنی کۆد: ' + (err.message || 'دڵنیابەوە لە ژمارەکە'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Verify Phone OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      setErrorMessage('تکایە کۆدی ٦ ژمارەیی بنووسە');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const user = await verifyOtpCode(otpCode.trim());
      onToast('بە سەرکەوتوویی چووە ژوورەوە!');
      onAuthSuccess({
        uid: user.uid,
        name: `قوتابی (${user.phoneNumber?.slice(-4) || 'مۆبایل'})`,
        phoneNumber: user.phoneNumber || phoneNumber,
        phone: user.phoneNumber || phoneNumber,
        email: user.email || '',
        authProvider: 'phone',
      });
      if (onClose) onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMessage('کۆدەکە هەڵەیە یان بەسەرچووە. تکایە دووبارە تاقی بکەرەوە');
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Register with Email & Password
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) {
      setErrorMessage('تکایە ناوی تەواو بنووسە');
      return;
    }
    if (!regEmail.trim()) {
      setErrorMessage('تکایە ئیمەیڵی فەرمی یان کەسی بنووسە');
      return;
    }
    if (regPass.length < 6) {
      setErrorMessage('پێویستە وشەی نهێنی لانیکەم ٦ پیت یان ژمارە بێت');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const user = await registerWithEmail(regEmail, regPass, {
        name: regName,
        faculty: regFaculty,
        role: regRole,
        phone: regPhone,
      });

      onToast(`ئەکاونتەکەت بە سەرکەوتوویی دروستکرا! بەخێربێیت ${regName}`);
      onAuthSuccess({
        uid: user.uid,
        name: regName.trim(),
        email: user.email || regEmail.trim(),
        faculty: regFaculty,
        role: regRole,
        phone: regPhone.trim(),
        authProvider: 'email',
      });
      if (onClose) onClose();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setErrorMessage('ئەم ئیمەیڵە پێشتر بەکارهاتووە. تکایە بچۆ ژوورەوە یان ئیمەیڵێکی تر بەکاربێنە');
      } else if (err.code === 'auth/invalid-email') {
        setErrorMessage('شێوازی ئیمەیڵەکە دروست نییە');
      } else if (err.code === 'auth/weak-password') {
        setErrorMessage('وشەی نهێنی زۆر لاوازە (لانیکەم ٦ پیت)');
      } else {
        setErrorMessage('هەڵە لە دروستکردنی ئەکاونت: ' + (err.message || 'تکایە دووبارە تاقی بکەرەوە'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Sign In with Email & Password
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPass) {
      setErrorMessage('تکایە ئیمەیڵ و وشەی نهێنی بنووسە');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const user = await loginWithEmail(loginEmail, loginPass);
      onToast(`بە سەرکەوتوویی چووە ژوورەوە!`);
      onAuthSuccess({
        uid: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'بەکارهێنەر',
        email: user.email || loginEmail.trim(),
        authProvider: 'email',
      });
      if (onClose) onClose();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setErrorMessage('ئیمەیڵ یان وشەی نهێنی هەڵەیە');
      } else {
        setErrorMessage('هەڵە لە چوونەژوورەوە: ' + (err.message || 'دووبارە تاقی بکەرەوە'));
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
        isGate ? 'bg-slate-900/85 backdrop-blur-md' : 'bg-slate-950/60 backdrop-blur-sm'
      }`}
      onClick={(e) => {
        if (!isGate && e.target === e.currentTarget && !isLoading && onClose) {
          onClose();
        }
      }}
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-7 text-start relative overflow-hidden my-auto">
        {/* Accent Top Gradient */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-600 via-amber-500 to-emerald-500" />

        {/* Modal / Gate Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <img
              src="/public/assets/aistudio/Gemini_Generated_Image_dqd0x1dqd0x1dqd0_779672db.jpg"
              alt="بازاڕی زانکۆ"
              className="w-12 h-12 rounded-2xl object-cover shadow-sm ring-2 ring-blue-500/20"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg sm:text-xl text-slate-900 dark:text-slate-100">
                  بازاڕی زانکۆ
                </h3>
                <span className="text-[10px] bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold px-2 py-0.5 rounded-full">
                  تایبەت بە زانکۆ
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isGate
                  ? 'پێویستە ئەکاونتت هەبێت بۆ بینین، کڕین، و فرۆشتنی کاڵاکان'
                  : 'چوونەژوورەوە و دروستکردنی هەژمار'}
              </p>
            </div>
          </div>

          {!isGate && onClose && (
            <button
              onClick={onClose}
              disabled={isLoading}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Notice for Mandatory Gate */}
        {isGate && (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-2xl flex items-center gap-2 text-xs text-amber-800 dark:text-amber-200">
            <Lock className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              بۆ پاراستنی ئاسایش و متمانەی زانکۆ، تەنها بەکارهێنەرانی خاوەن ئەکاونت دەتوانن بچنە ژوورەوە و کاڵا دابنێن.
            </span>
          </div>
        )}

        {/* Auth Method Navigation Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl mb-5">
          <button
            type="button"
            onClick={() => {
              setActiveTab('quick');
              setErrorMessage(null);
            }}
            className={`py-2 px-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'quick'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>چوونەژوورەوە</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setErrorMessage(null);
            }}
            className={`py-2 px-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'register'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>ئەکاونتی نوێ</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('email-login');
              setErrorMessage(null);
            }}
            className={`py-2 px-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'email-login'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>ئیمەیڵ</span>
          </button>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* ======================================================= */}
        {/* TAB 1: QUICK SIGN IN (Google & Phone OTP)                */}
        {/* ======================================================= */}
        {activeTab === 'quick' && (
          <div className="space-y-4">
            {/* Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm flex items-center justify-center gap-3 shadow-xs transition-all active:scale-98 disabled:opacity-60 cursor-pointer"
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
              <span>چوونەژوورەوەی خێرا بە گووگڵ (Google)</span>
            </button>

            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
              <span className="bg-white dark:bg-slate-900 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider absolute">
                یان بە ژمارەی مۆبایل
              </span>
            </div>

            {/* Phone Step 1: Input */}
            {phoneStep === 'input' && (
              <form onSubmit={handleSendPhoneOtp} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    ژمارەی مۆبایل (Phone Number)
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="0750 123 4567 یان +964 750..."
                      dir="ltr"
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      required
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute end-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !phoneNumber.trim()}
                  className="w-full py-3.5 rounded-2xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                      <span>ناردنی کۆدی کورتەنامە...</span>
                    </>
                  ) : (
                    <>
                      <Phone className="w-4 h-4 text-emerald-400" />
                      <span>ناردنی کۆدی SMS بە مۆبایل</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Phone Step 2: OTP */}
            {phoneStep === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-3">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                  <div>
                    <div className="font-bold">کۆد نێردرا بۆ مۆبایلەکەت</div>
                    <div className="font-mono mt-0.5" dir="ltr">
                      {phoneNumber}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPhoneStep('input')}
                    className="text-xs text-blue-600 dark:text-blue-400 underline font-semibold"
                  >
                    گۆڕینی ژمارە
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    کۆدی نهێنی (SMS OTP Code)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • • • •"
                      dir="ltr"
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-center text-lg tracking-widest text-slate-900 dark:text-slate-100 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                      required
                    />
                    <KeyRound className="w-4 h-4 text-slate-400 absolute end-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otpCode.length < 6}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>پشتڕاستکردنەوە و چوونەژوورەوە</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ======================================================= */}
        {/* TAB 2: REGISTER NEW ACCOUNT (دروستکردنی ئەکاونتی نوێ)      */}
        {/* ======================================================= */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ناوی تەواو *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="نموونە: هێمن کاروان"
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <UserIcon className="w-4 h-4 text-slate-400 absolute end-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ڕۆڵی ئەکادیمی *
                </label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as UserRole)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                >
                  <option value="قوتابی">🎓 قوتابی</option>
                  <option value="مامۆستا">👨‍🏫 مامۆستا</option>
                  <option value="کارمەند">💼 کارمەند</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ژمارەی مۆبایل (بۆ کڕیاران)
                </label>
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="0750 000 0000"
                  dir="ltr"
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                زانکۆ یان پەیمانگا *
              </label>
              <div className="relative">
                <select
                  value={regFaculty}
                  onChange={(e) => setRegFaculty(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {UNIVERSITIES_LIST.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ئیمەیڵ (Email) *
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="name@university.edu.iq یان gmail"
                  dir="ltr"
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  value={regPass}
                  onChange={(e) => setRegPass(e.target.value)}
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
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98 disabled:opacity-50 cursor-pointer mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>دروستکردنی هەژمار...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>دروستکردنی ئەکاونت و چوونەژوورەوە</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* ======================================================= */}
        {/* TAB 3: SIGN IN WITH EMAIL & PASSWORD                     */}
        {/* ======================================================= */}
        {activeTab === 'email-login' && (
          <form onSubmit={handleEmailLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                ئیمەیڵ (Email)
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@univ.edu.iq"
                  dir="ltr"
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <Mail className="w-4 h-4 text-slate-400 absolute end-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                وشەی نهێنی (Password)
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  placeholder="••••••••"
                  dir="ltr"
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <Lock className="w-4 h-4 text-slate-400 absolute end-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>پشکنینی هەژمار...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>چوونەژوورەوە</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Security & Academic Trust Footer */}
        <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>سیستەمی پارێزراوی زانکۆ</span>
          </div>
          <span className="font-mono text-[10px]">v2.5 University Auth</span>
        </div>
      </div>
    </div>
  );
};
