import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Sparkles, ShieldCheck } from 'lucide-react';
import { ChatMessage } from '../types';

interface ChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateAdd?: () => void;
}

const FAQ_SUGGESTIONS = [
  'چۆن کاڵا زیاد بکەم؟',
  'چۆن سەلامەت بکڕم؟',
  'نرخ چۆن دیاری بکەم؟',
  'باشترین شوێن بۆ کۆبوونەوە لە کەمپەس؟',
  'ئایا دەتوانم کتێب بە بێ بەرامبەر بدەم؟',
];

const KNOWLEDGE_BASE: { regex: RegExp; response: string }[] = [
  {
    regex: /زیاد|فرۆش|بڵاو|دانان/,
    response:
      'بۆ زیادکردنی کاڵا یان خزمەتگوزاری:\n١. لە خوارەوە دوگمەی زەردی «+ زیادکردن» لێبدە.\n٢. ناونیشان، پۆل، نرخ بە دینار و وەسف بنووسە.\n٣. هێمایەکی گونجاو هەڵبژێرە و دوگمەی «بڵاوکردنەوە» دابگرە. دەستبەجێ بۆ هەمووان دەردەکەوێت!',
  },
  {
    regex: /سەلامەت|فێڵ|متمانە|پاراستن|ئاسایش/,
    response:
      'ڕێنماییە سەرەکییەکانی سەلامەتی بازاڕی زانکۆ:\n• هەمیشە لە شوێنی گشتی کەمپەس وەک کافتریا یان کتێبخانەی ناوەندی چاوپێکەوتن بکە.\n• پێش پارەدان کاڵاکە یان ئامێرەکە بە وردی بپشکنە.\n• هەرگیز زانیاری بانکی، کۆدی OTP یان وشەی نهێنی بۆ هیچ کەس مەپێچەرەوە.\n• ئەگەر نرخێک زۆر کەمتر بوو لە ئاسایی، وریا بە و لێکۆڵینەوە بکە.',
  },
  {
    regex: /نرخ|دینار|پارە|چەند/,
    response:
      'ئامۆژگاری دیاریکردنی نرخ:\n• بۆ کتێبی خوێندن: ٤٠٪ بۆ ٦٠٪ کەمتر لە نرخی بازاڕ دابنێ.\n• بۆ ئەلیکترۆنیات: تەمەنی بەکارهێنان و تەندروستی پاتری لەبەرچاو بگرە.\n• ئەگەر دەستنووس یان ڕاپۆرت و تەختەی کێشان بێت، ڕەچاوی بارودۆخی قوتابیان بکە.',
  },
  {
    regex: /شوێن|بینین|کەمپەس|کۆبوونەوە|کافتریا|کتێبخانە/,
    response:
      'شوێنە پێشنیارکراوەکان بۆ تەواوکردنی کڕین و فرۆشتن لە زانکۆ:\n١. کافتریای ناوەندی یان کافتریای کۆلێژەکان لە ڕۆژانی دەوام.\n٢. هۆڵی چاوەڕوانی یان حەوشەی بەردەم کتێبخانەی ناوەندی.\n٣. لای کارگێڕی بەشە ناوخۆییەکان بۆ ئەو کاڵایانەی تایبەتن بە بەشە ناوخۆیی.',
  },
  {
    regex: /کتێب|مەلزەمە|تێز|ڕاپۆرت|بەخۆڕایی|دیاری/,
    response:
      'بەڵێ! لە بازاڕی زانکۆدا دەتوانیت نرخی کاڵاکەت بە (0 د.ع) دابنێیت وەک دیاری (خێرخوازی) بۆ هاوڕێ و قوتابیانی نوێ. لە بەشی خزمەتگوزاریشدا دەتوانیت کاری چاپ، فۆرمات یان وانەی تایبەت پێشکەش بکەیت.',
  },
  {
    regex: /هەژمار|پرۆفایل|گۆڕین|ناوم|مۆبایل/,
    response:
      'دەتوانیت لە بەشی «پرۆفایل» پەڕەی «زانیاری هەژمار» بکەیتەوە بۆ دەستکاریکردنی ناو، ئیمەیڵ، پلە (قوتابی/مامۆستا/کارمەند) و کۆلێژەکەت.',
  },
];

export const ChatbotModal: React.FC<ChatbotModalProps> = ({
  isOpen,
  onClose,
  onNavigateAdd,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: 'سڵاو هاوزانکۆیی ئازیز! من یاریدەدەری زیرەکی بازاڕی زانکۆم. دەتوانیت هەر پرسیارێکت هەبێت دەربارەی کڕین، فرۆشتن، دیاریکردنی نرخ یان سەلامەتی لێم بپرسیت.',
      time: 'ئێستا',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!isOpen) return null;

  const handleSend = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'me',
      text: trimmed,
      time: 'ئێستا',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      let matched = KNOWLEDGE_BASE.find((k) => k.regex.test(trimmed));
      let replyText = matched
        ? matched.response
        : 'سوپاس بۆ پرسیارەکەت. سەبارەت بەم بابەتە، تکایە ڕەچاوی یاساکانی کەمپەس و سەلامەتی بکە. دەتوانیت لە بەشی «ڕێکخستنەکان» یان «پەیوەندیکردن» پەیام بۆ بەڕێوەبەرایەتی بازاڕی زانکۆ بنێریت بۆ یارمەتی زیاتر.';

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: replyText,
        time: 'ئێستا',
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 450);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 w-full sm:max-w-lg h-[85vh] sm:h-[620px] rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col text-right overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-extrabold text-sm flex items-center gap-1.5">
                <span>یاریدەدەری بازاڕی زانکۆ</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              </div>
              <div className="text-[11px] text-blue-100">
                ڕاوێژکاری کڕین، فرۆشتن و سەلامەتی
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50 dark:bg-slate-950/50">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-2 ${
                m.sender === 'me' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs ${
                  m.sender === 'me'
                    ? 'bg-blue-600 text-white'
                    : 'bg-amber-500/20 text-amber-800 dark:text-amber-400'
                }`}
              >
                {m.sender === 'me' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>
              <div
                className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm whitespace-pre-line leading-relaxed shadow-xs ${
                  m.sender === 'me'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-bl-none'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-2xl text-xs text-slate-500 flex items-center gap-1">
                <span>لە وەڵامدانەوەدایە</span>
                <span className="animate-pulse">...</span>
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* FAQ Quick Chips */}
        <div className="p-2 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
          <div className="flex items-center gap-1.5 whitespace-nowrap pb-1">
            {FAQ_SUGGESTIONS.map((faq) => (
              <button
                key={faq}
                onClick={() => handleSend(faq)}
                className="px-2.5 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {faq}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Input */}
        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputValue);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="پرسیارەکەت دەربارەی بازاڕی زانکۆ بنووسە..."
              className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white flex items-center justify-center transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
