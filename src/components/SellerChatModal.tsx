import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Mic,
  Square,
  Trash2,
  CheckCircle2,
  Building2,
  Clock,
  Sparkles,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { MarketItem, DirectMessage, LanguageCode } from '../types';
import { formatPrice } from '../utils/formatters';
import { VoiceMessagePlayer } from './VoiceMessagePlayer';

interface SellerChatModalProps {
  item: MarketItem;
  isOpen: boolean;
  onClose: () => void;
  language: LanguageCode;
  onToast: (msg: string) => void;
}

export const SellerChatModal: React.FC<SellerChatModalProps> = ({
  item,
  isOpen,
  onClose,
  language,
  onToast,
}) => {
  const [messages, setMessages] = useState<DirectMessage[]>(() => {
    try {
      const stored = localStorage.getItem(`chat_${item.id}`);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [
      {
        id: 'msg_init',
        itemId: item.id,
        sender: 'seller',
        text: `سڵاو! بەخێربێیت. من فرۆشیاری ئەم کاڵایەم (${item.title}). چۆن دەتوانم هاوکاریت بکەم؟`,
        time: 'ئێستا',
        timestamp: Date.now() - 60000,
      },
    ];
  });

  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Sync messages
  useEffect(() => {
    try {
      localStorage.setItem(`chat_${item.id}`, JSON.stringify(messages));
    } catch (e) {}
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  // Handle Text Send
  const handleSendText = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    const newMsg: DirectMessage = {
      id: Date.now().toString(),
      itemId: item.id,
      sender: 'me',
      text,
      time: 'ئێستا',
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');

    // Simulated reply after short delay
    setTimeout(() => {
      const replies = [
        'سوپاس بۆ پەیامەکەت! کاتژمێر چەند دەتوانیت لە کەمپەس بین؟',
        'بەڵێ هێشتا بەردەستە و لە بارودۆخێکی زۆر باشدایە.',
        'دەتوانین لە بەردەم کتێبخانەی ناوەندی یان کافتریای زانکۆ یەکتر ببینین.',
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];
      const sellerReply: DirectMessage = {
        id: (Date.now() + 1).toString(),
        itemId: item.id,
        sender: 'seller',
        text: randomReply,
        time: 'ئێستا',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, sellerReply]);
    }, 1200);
  };

  // Start Voice Recording
  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      onToast('مایکرۆفۆن لەسەر ئەم وێبگەڕە پشتگیری ناکرێت');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          const voiceMsg: DirectMessage = {
            id: Date.now().toString(),
            itemId: item.id,
            sender: 'me',
            audioUrl: base64Audio,
            audioDuration: recordingDuration || 1,
            time: 'ئێستا',
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, voiceMsg]);
          onToast('نامەی دەنگی نێردرا / Voice note sent');
        };

        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Microphone error:', err);
      onToast('تکایە ڕێگە بە مایکرۆفۆن بدە بۆ تۆمارکردنی دەنگ');
    }
  };

  // Stop & Send Voice Recording
  const stopAndSendRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerIntervalRef.current);
    }
  };

  // Cancel Recording
  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      audioChunksRef.current = [];
      setIsRecording(false);
      clearInterval(timerIntervalRef.current);
      onToast('تۆمارکردنی دەنگ هەڵوەشایەوە');
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
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
      <div className="bg-white dark:bg-slate-900 w-full sm:max-w-xl h-[92vh] sm:h-[650px] rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden text-start">
        {/* Header with Seller Info */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-black text-lg flex items-center justify-center shadow-xs">
              {item.sellerName.trim()[0] || '؟'}
            </div>
            <div>
              <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>{item.sellerName}</span>
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold px-1.5 py-0.2 rounded-full">
                  فرۆشیار
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                <Building2 className="w-3 h-3 text-slate-400" />
                <span className="truncate max-w-[170px]">{item.faculty}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <a
              href={`tel:${item.phone}`}
              className="w-9 h-9 rounded-xl bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 flex items-center justify-center shadow-xs transition-colors"
              title="پەیوەندی تەلەفۆن"
            >
              <Phone className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white dark:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center shadow-xs transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Pinned Product Context Strip */}
        <div className="px-4 py-2 bg-blue-50/70 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900/40 flex items-center justify-between gap-3 shrink-0 text-xs">
          <div className="flex items-center gap-2.5 truncate">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0 overflow-hidden"
              style={{ backgroundColor: item.colorHex || '#dbeafe' }}
            >
              {item.images && item.images.length > 0 ? (
                <img src={item.images[0]} alt="" className="w-full h-full object-cover" />
              ) : (
                <span>{item.emoji || '📦'}</span>
              )}
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
              {item.title}
            </span>
          </div>
          <span className="font-black text-blue-700 dark:text-blue-400 tabular-nums shrink-0">
            {formatPrice(item.price)}
          </span>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/60 dark:bg-slate-950/40">
          {messages.map((m) => {
            const isMe = m.sender === 'me';
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                {/* Voice Message vs Text Message */}
                {m.audioUrl ? (
                  <VoiceMessagePlayer
                    audioUrl={m.audioUrl}
                    duration={m.audioDuration}
                    isMe={isMe}
                  />
                ) : (
                  <div
                    className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm whitespace-pre-line leading-relaxed shadow-xs ${
                      isMe
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-bl-none'
                    }`}
                  >
                    {m.text}
                  </div>
                )}
                <span className="text-[10px] text-slate-400 mt-0.5 px-1 font-mono">
                  {m.time}
                </span>
              </div>
            );
          })}
          <div ref={chatBottomRef} />
        </div>

        {/* Input & Voice Recording Area */}
        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
          {isRecording ? (
            /* Active Voice Recording UI */
            <div className="flex items-center justify-between gap-3 p-2 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl animate-pulse">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping" />
                <span className="text-xs font-bold text-rose-700 dark:text-rose-400 font-mono">
                  {formatTimer(recordingDuration)}
                </span>
                <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                  تۆمارکردنی نامەی دەنگی...
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={cancelRecording}
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-colors"
                  title="هەڵوەشاندنەوە"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={stopAndSendRecording}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>تەواو و ناردن</span>
                </button>
              </div>
            </div>
          ) : (
            /* Standard Text & Mic Input UI */
            <form onSubmit={handleSendText} className="flex items-center gap-2">
              <button
                type="button"
                onClick={startRecording}
                className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-100 hover:text-amber-700 dark:hover:bg-slate-700 flex items-center justify-center transition-colors shrink-0"
                title="تۆمارکردنی نامەی دەنگی (Voice Note)"
                aria-label="تۆمارکردنی نامەی دەنگی"
              >
                <Mic className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="پەیامێک بنووسە یان نامەی دەنگی بنێرە..."
                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                type="submit"
                disabled={!inputText.trim()}
                className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white flex items-center justify-center transition-colors shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
