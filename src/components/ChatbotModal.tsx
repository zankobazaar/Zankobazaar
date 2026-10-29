import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Bot,
  User,
  Sparkles,
  ShieldCheck,
  Mic,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { ChatMessage } from '../types';

interface ChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateAdd?: () => void;
  onOpenLiveVoice?: () => void;
  onOpenCampusMaps?: () => void;
}

const FAQ_SUGGESTIONS = [
  'چۆن کاڵا زیاد بکەم؟',
  'چۆن سەلامەت بکڕم؟',
  'نرخ چۆن دیاری بکەم؟',
  'باشترین شوێن بۆ چاوپێکەوتن لە کەمپەس؟',
  'ئایا دەتوانم کتێب بە بێ بەرامبەر بدەم؟',
];

const KNOWLEDGE_BASE: { regex: RegExp; response: string }[] = [
  {
    regex: /زیاد|فرۆش|بڵاو|دانان/,
    response:
      'بۆ زیادکردنی کاڵا یان خزمەتگوزاری:\n١. لە خوارەوە دوگمەی «+ کاڵا زیاد بکە» لێبدە.\n٢. ناونیشان، پۆل، نرخ بە دینار و وەسف بنووسە.\n٣. دەتوانیت چەندین وێنە و ناونیشانی کەمپەس دابنێیت و بڵاوی بکەیتەوە!',
  },
  {
    regex: /سەلامەت|فێڵ|متمانە|پاراستن|ئاسایش/,
    response:
      'ڕێنماییە سەرەکییەکانی سەلامەتی بازاڕی زانکۆ:\n• هەمیشە لە شوێنی گشتی کەمپەس وەک کافتریا یان کتێبخانەی ناوەندی چاوپێکەوتن بکە.\n• دەتوانیت دوگمەی «نەخشەی زانکۆ» بەکاربێنیت بۆ دۆزینەوەی سەلامەتترین شوێن لەسەر Google Maps.\n• پێش پارەدان کاڵاکە یان ئامێرەکە بە وردی بپشکنە.',
  },
  {
    regex: /نرخ|دینار|پارە|چەند/,
    response:
      'ئامۆژگاری دیاریکردنی نرخ:\n• بۆ کتێبی خوێندن: ٤٠٪ بۆ ٦٠٪ کەمتر لە نرخی بازاڕ دابنێ.\n• بۆ ئەلیکترۆنیات: تەمەنی بەکارهێنان و تەندروستی پاتری لەبەرچاو بگرە.\n• ڕەچاوی بارودۆخی دارایی قوتابیان بکە.',
  },
  {
    regex: /شوێن|بینین|کەمپەس|کۆبوونەوە|کافتریا|کتێبخانە|نەخشە/,
    response:
      'شوێنە پێشنیارکراوەکانی چاوپێکەوتن:\n١. کافتریای ناوەندی یان بەردەم بەشەکان لە کاتی دەوامی فەرمی.\n٢. هۆڵی کتێبخانەی ناوەندی زانکۆ.\n٣. دەتوانیت لە ڕێگەی تایبەتمەندی Google Maps نەخشەی تەواوی شوێنە سەلامەتەکان ببینی!',
  },
];

export const ChatbotModal: React.FC<ChatbotModalProps> = ({
  isOpen,
  onClose,
  onNavigateAdd,
  onOpenLiveVoice,
  onOpenCampusMaps,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: 'سڵاو هاوزانکۆیی ئازیز! من یاریدەدەری زیرەکی بازاڕی زانکۆم (Gemini 3.8 Flash). دەتوانیت پرسیارم لێبکەیت دەربارەی کاڵاکان، دیاریکردنی نرخ، یان شوێنی چاوپێکەوتن لە کەمپەس، هەروەها دەتوانیت پەیوەندی دەنگی زیندوو یان نەخشە بکەیتەوە!',
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

  const handleSend = async (text: string) => {
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

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: messages.slice(-5),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.text) {
          const botMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            sender: 'bot',
            text: data.text,
            time: 'ئێستا',
          };
          setMessages((prev) => [...prev, botMsg]);
          setIsTyping(false);
          return;
        }
      }
    } catch (e) {
      console.warn('Backend Gemini Chat failed, falling back to local KB:', e);
    }

    // Fallback response
    let matched = KNOWLEDGE_BASE.find((k) => k.regex.test(trimmed));
    let replyText = matched
      ? matched.response
      : 'سوپاس بۆ پرسیارەکەت هاوزانکۆیی ئازیز! سەبارەت بەم بابەتە، هەمیشە دەتوانیت لە ڕێگەی نەخشەی کەمپەس شوێنی چاوپێکەوتن بدۆزیتەوە یان گفتوگۆی دەنگی ڕاستەوخۆ دەستپێبکەیت بۆ وەڵامی خێرا.';

    const botMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      sender: 'bot',
      text: replyText,
      time: 'ئێستا',
    };

    setMessages((prev) => [...prev, botMsg]);
    setIsTyping(false);
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
      <div className="bg-white dark:bg-slate-900 w-full sm:max-w-lg h-[85vh] sm:h-[620px] rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col text-start overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-extrabold text-sm flex items-center gap-1.5">
                <span>یاریدەدەری زیرەکی زانکۆ بازار</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              </div>
              <div className="text-[11px] text-blue-100 flex items-center gap-2">
                <span>Gemini 3.8 Flash</span>
                <span>•</span>
                <span>پشتگیری دەنگ و نەخشە</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feature Actions Ribbon: Live Voice & Campus Maps */}
        <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-2">
          {onOpenLiveVoice && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLiveVoice();
              }}
              className="flex-1 py-1.5 px-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>گفتوگۆی دەنگی (Live API)</span>
            </button>
          )}

          {onOpenCampusMaps && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCampusMaps();
              }}
              className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>نەخشەی زانکۆ (Maps)</span>
            </button>
          )}
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
                    : 'bg-indigo-600 text-white'
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
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-2xl text-xs text-slate-500 flex items-center gap-1">
                <span>لە وەڵامدانەوەدایە (Gemini)</span>
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
                className="px-2.5 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
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
              placeholder="پرسیارەکەت بنووسە یان داوای شوێن و نرخ بکە..."
              className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
