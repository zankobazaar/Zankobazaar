import React from 'react';
import { CheckCircle, Info } from 'lucide-react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div
      role="status"
      className="fixed bottom-20 sm:bottom-8 inset-x-0 mx-auto w-max max-w-[90%] z-50 bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 px-4 py-2.5 rounded-full shadow-xl backdrop-blur-md flex items-center gap-2 text-xs sm:text-sm font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200"
    >
      <CheckCircle className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
      <span>{message}</span>
    </div>
  );
};
