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
} from 'lucide-react';
import { loginWithGoogle, loginWithPhone, verifyOtpCode } from '../services/authService';
import { UserProfile, LanguageCode } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (userProfile: Partial<UserProfile>) => void;
  onToast: (msg: string) => void;
  language?: LanguageCode;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  onToast,
  language = 'ckb',
}) => {
  const [authMethod, setAuthMethod] = useState<'select' | 'phone'>('select');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle Google Sign In
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
        authProvider: 'google',
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMessage('پەنجەرەی چوونەژوورەوە داخرا');
      } else {
        setErrorMessage(err.message || 'هەڵە لە چوونەژوورەوەی گووگڵ');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Phone Code Request
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
      setIsOtpSent(true);
      onToast('کۆدی پشتڕاستکردنەوە بە کورتەنامە (SMS) نێردرا!');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-phone-number') {
        setErrorMessage('ژمارەی مۆبایلەکە نادروستە. نموونە: 07501234567 یان +9647501234567');
      } else if (err.code === 'auth/too-many-requests') {
        setErrorMessage('داواکاری زۆر نێردراوە. تکایە پاش کەمێکی تر هەوڵبدەرەوە');
      } else {
        setErrorMessage('هەڵە لە ناردنی کۆد: ' + (err.message || 'تکایە دڵنیابەوە لە ژمارەکە'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP Verification
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
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMessage('کۆدەکە هەڵەیە یان کاتەکەی بەسەرچووە. تکایە دووبارە تاقی بکەرەوە');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setAuthMethod('select');
    setIsOtpSent(false);
    setOtpCode('');
    setErrorMessage(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-start relative overflow-hidden">
        {/* Decorative Top Accent */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-600 via-amber-500 to-emerald-500" />

        {/* Modal Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900 dark:text-slate-100">
                چوونەژوورەوەی زانکۆ
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sign in to University Marketplace
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Notice */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* METHOD SELECTION SCREEN */}
        {authMethod === 'select' && (
          <div className="space-y-3.5">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              بە یەک کلیک لە ڕێگەی ئەکاونتی فەرمیی گووگڵ یان ژمارەی مۆبایلەکەتەوە بچۆ ژوورەوە بۆ کڕین،
              فرۆشتن و گفتوگۆ لەگەڵ قوتابیانی زانکۆ.
            </p>

            {/* 1. Google Sign In Button */}
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
              <span>چوونەژوورەوە بە گووگڵ (Google Login)</span>
            </button>

            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
              <span className="bg-white dark:bg-slate-900 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider absolute">
                یان / OR
              </span>
            </div>

            {/* 2. Phone Sign In Button */}
            <button
              type="button"
              onClick={() => setAuthMethod('phone')}
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-sm transition-all active:scale-98 disabled:opacity-60 cursor-pointer"
            >
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>چوونەژوورەوە بە ژمارەی مۆبایل (Phone SMS)</span>
            </button>
          </div>
        )}

        {/* PHONE NUMBER & OTP VERIFICATION SCREEN */}
        {authMethod === 'phone' && (
          <div>
            {!isOtpSent ? (
              /* Step 1: Input Phone Number */
              <form onSubmit={handleSendPhoneOtp} className="space-y-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline mb-1"
                >
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-0 ltr:rotate-180" />
                  <span>گەڕانەوە بۆ شێوازەکانی تر</span>
                </button>

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
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                    کۆدێکی پشتڕاستکردنەوەی ٦ ژمارەیی بە SMS بۆ ئەم ژمارەیە دەنێردرێت.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !phoneNumber.trim()}
                  className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>ناردنی کۆد...</span>
                    </>
                  ) : (
                    <>
                      <span>ناردنی کۆدی پشتڕاستکردنەوە</span>
                      <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* Step 2: Input OTP Verification Code */
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                  <div>
                    <div className="font-bold">کۆدەکە بە سەرکەوتوویی نێردرا</div>
                    <div className="font-mono mt-0.5" dir="ltr">
                      {phoneNumber}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOtpSent(false)}
                    className="text-xs text-blue-600 dark:text-blue-400 underline font-semibold"
                  >
                    گۆڕینی ژمارە
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    کۆدی پشتڕاستکردنەوە (SMS OTP Code)
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
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>پشتڕاستکردنەوە...</span>
                    </>
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

        {/* Security Note Footer */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>پارێزراوە لە ڕێگەی فایەربەیس و سێرڤەری زانکۆ</span>
        </div>
      </div>
    </div>
  );
};
