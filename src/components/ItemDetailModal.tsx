import React, { useState } from 'react';
import {
  X,
  Phone,
  MessageCircle,
  Share2,
  Heart,
  ShieldAlert,
  Building2,
  MapPin,
  CheckCircle2,
  Trash2,
  Send,
  UserCheck,
  Star,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Mic,
  Camera,
} from 'lucide-react';
import { MarketItem, AppSettings } from '../types';
import { formatPrice, getWhatsAppLink } from '../utils/formatters';
import { TRANSLATIONS } from '../utils/translations';
import { StarRating } from './StarRating';

interface ItemDetailModalProps {
  item: MarketItem;
  isOpen: boolean;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  settings: AppSettings;
  onToast: (msg: string) => void;
  onToggleSold?: (id: string) => void;
  onDeleteItem?: (id: string) => void;
  onOpenReport?: (itemTitle: string) => void;
  onRateSeller?: (itemId: string, rating: number) => void;
  onOpenSellerChat?: (item: MarketItem) => void;
  onOpenCampusMaps?: (query?: string) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  isFavorite,
  onToggleFavorite,
  settings,
  onToast,
  onToggleSold,
  onDeleteItem,
  onOpenReport,
  onRateSeller,
  onOpenSellerChat,
  onOpenCampusMaps,
}) => {
  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.ckb;
  const [quickMessage, setQuickMessage] = useState('');
  const [phoneRevealed, setPhoneRevealed] = useState(!settings.hidePhone);

  // Multiple Images gallery state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const imagesList = item.images && item.images.length > 0 ? item.images : (item.imageUrl ? [item.imageUrl] : []);

  // Star-rating input component state
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [hasSubmittedRating, setHasSubmittedRating] = useState(false);

  if (!isOpen) return null;

  const RATING_LABELS: Record<number, { ckb: string; en: string }> = {
    1: { ckb: 'لاوازە', en: 'Poor' },
    2: { ckb: 'قبووڵکراوە', en: 'Fair' },
    3: { ckb: 'باشە', en: 'Good' },
    4: { ckb: 'زۆر باشە', en: 'Very Good' },
    5: { ckb: 'نایاب و باوەڕپێکراوە', en: 'Excellent & Trusted' },
  };

  const handleShare = () => {
    const text = `${item.title} - ${formatPrice(item.price)} لە بازاڕی زانکۆ`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      onToast('کۆپی کرا / Copied to clipboard');
    } else {
      onToast('کۆپی کرا');
    }
  };

  const handleRequestPhone = () => {
    setPhoneRevealed(true);
    onToast(t.phoneRevealedToast);
  };

  const handleSendQuickMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickMessage.trim()) return;
    onToast(t.messageSent);
    setQuickMessage('');
  };

  const handleStarClick = (stars: number) => {
    setSelectedRating(stars);
    setHasSubmittedRating(true);
    if (onRateSeller) {
      onRateSeller(item.id, stars);
    }
    const label = settings.language === 'en' ? RATING_LABELS[stars].en : RATING_LABELS[stars].ckb;
    onToast(`${t.ratingSubmitted}: ${stars} ★ (${label})`);
  };

  const handleDelete = () => {
    if (confirm(t.confirmRemove)) {
      if (onDeleteItem) {
        onDeleteItem(item.id);
      }
      onClose();
    }
  };

  const nextImage = () => {
    if (imagesList.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % imagesList.length);
    }
  };

  const prevImage = () => {
    if (imagesList.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + imagesList.length) % imagesList.length);
    }
  };

  const activeHoverOrSelected = hoverRating !== null ? hoverRating : selectedRating;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 w-full sm:max-w-xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 text-start">
        {/* Header Action Row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleFavorite(item.id)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                isFavorite
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-500'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-500'
              }`}
              title={t.favorites}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={handleShare}
              className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
            {/* Delete button option */}
            {(item.isMine || onDeleteItem) && (
              <button
                onClick={handleDelete}
                className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/60 flex items-center justify-center transition-colors"
                title={t.removeItem}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* MULTI-IMAGE CAROUSEL & GALLERY (زیادکردنی زیاتر لە وێنەیەک)                 */}
        {/* ========================================================================= */}
        <div className="mb-4">
          <div
            className="relative h-52 sm:h-64 rounded-2xl flex items-center justify-center shadow-inner overflow-hidden select-none bg-slate-100 dark:bg-slate-800"
            style={{ backgroundColor: imagesList.length === 0 ? (item.colorHex || '#dbeafe') : undefined }}
          >
            {imagesList.length > 0 ? (
              <img
                src={imagesList[currentImageIndex]}
                alt={`${item.title} - ${currentImageIndex + 1}`}
                className="w-full h-full object-cover transition-all duration-300"
              />
            ) : (
              <span className="text-6xl">{item.emoji || '📦'}</span>
            )}

            {/* Next / Previous arrows if multiple images exist */}
            {imagesList.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevImage}
                  className="absolute start-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/60 text-white flex items-center justify-center hover:bg-slate-900/90 transition-colors shadow-md backdrop-blur-xs"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  className="absolute end-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/60 text-white flex items-center justify-center hover:bg-slate-900/90 transition-colors shadow-md backdrop-blur-xs"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5 rtl:rotate-180" />
                </button>
                {/* Photo counter index badge */}
                <div className="absolute top-3 end-3 bg-slate-950/70 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                  {currentImageIndex + 1} / {imagesList.length}
                </div>
              </>
            )}

            {item.isSold && (
              <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center">
                <span className="text-white bg-emerald-600 px-4 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shadow-lg">
                  <CheckCircle2 className="w-4 h-4" />
                  فرۆشراوە / Sold
                </span>
              </div>
            )}

            <div className="absolute bottom-3 end-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 shadow-xs">
              {item.condition}
            </div>
          </div>

          {/* Clickable Image Thumbnails Strip */}
          {imagesList.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1">
              {imagesList.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-transform ${
                    currentImageIndex === idx
                      ? 'border-blue-600 scale-105 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Category & Status */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
          <span className="text-blue-600 dark:text-blue-400 font-bold">{item.category}</span>
          <span aria-hidden="true">·</span>
          <span>{item.createdAt}</span>
          {item.location && (
            <>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                {item.location}
              </span>
            </>
          )}
        </div>

        {/* Title & Price */}
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 leading-snug mb-2">
          {item.title}
        </h2>

        <div className="text-2xl font-black text-blue-700 dark:text-blue-400 tabular-nums mb-4">
          {formatPrice(item.price)}
        </div>

        {/* Description */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-4 border border-slate-100 dark:border-slate-800">
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            وەسفی کاڵا
          </h4>
          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Seller Info Card with Rating */}
        <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-extrabold flex items-center justify-center text-lg shrink-0 shadow-sm">
              {item.sellerName.trim()[0] || '؟'}
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>{item.sellerName}</span>
                <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                  ({item.sellerRole})
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                <Building2 className="w-3 h-3 text-slate-400" />
                <span>{item.faculty}</span>
              </div>
            </div>
          </div>

          {/* Current Average Rating Display */}
          <div className="flex flex-col items-start sm:items-end gap-0.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-700">
            <div className="text-[11px] text-slate-400 font-medium">{t.sellerRating}</div>
            <StarRating
              rating={item.sellerRating || 4.8}
              count={item.sellerRatingCount || 12}
              size="md"
            />
          </div>
        </div>

        {/* Direct Seller Chat & Google Maps Campus Meetup Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          <button
            type="button"
            onClick={() => onOpenSellerChat && onOpenSellerChat(item)}
            className="w-full py-3 px-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-98 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>چات لەگەڵ فرۆشیار</span>
            <Mic className="w-3.5 h-3.5 text-amber-300" />
          </button>

          {onOpenCampusMaps && (
            <button
              type="button"
              onClick={() =>
                onOpenCampusMaps(
                  `باشترین و سەلامەتترین شوێنی بینین و گۆڕینەوەی ئەم کاڵایە لە دەوروبەری ${item.faculty || 'کەمپەسی زانکۆ'} لەسەر Google Maps چییە؟ شوێنەکان بە بەستەر دیاری بکە.`
                )
              }
              className="w-full py-3 px-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>شوێنی چاوپێکەوتن (Maps)</span>
            </button>
          )}
        </div>

        {/* VISUALLY APPEALING STAR-RATING INPUT COMPONENT (Using Lucide Icons) */}
        <div className="relative overflow-hidden bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/80 dark:border-amber-700/60 rounded-2xl p-4 mb-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-900 dark:text-amber-300">
                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
                <span>{t.rateSeller}</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                تکایە بەپێی ئەزموون و پەیوەندیکردنت ئەستێرە بدە بەم فرۆشیارە
              </p>
            </div>

            {/* Interactive Lucide Star Rating Inputs */}
            <div className="flex flex-col items-start sm:items-end gap-1.5">
              <div
                className="flex items-center gap-1 p-1 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-amber-200/80 dark:border-amber-800/80 shadow-xs"
                dir="ltr"
              >
                {[1, 2, 3, 4, 5].map((starVal) => {
                  const isHighlighted = activeHoverOrSelected >= starVal;

                  return (
                    <button
                      key={starVal}
                      type="button"
                      onClick={() => handleStarClick(starVal)}
                      onMouseEnter={() => setHoverRating(starVal)}
                      onMouseLeave={() => setHoverRating(null)}
                      className="group relative p-1 rounded-lg transition-transform hover:scale-125 active:scale-95 focus:outline-none"
                      aria-label={`${starVal} ئەستێرە`}
                    >
                      <Star
                        className={`w-6 h-6 transition-colors duration-150 ${
                          isHighlighted
                            ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                            : 'text-slate-300 dark:text-slate-600 hover:text-amber-300'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Feedback Text */}
              <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1 min-h-[18px]">
                {activeHoverOrSelected > 0 ? (
                  <>
                    <span>
                      {settings.language === 'en'
                        ? RATING_LABELS[activeHoverOrSelected].en
                        : RATING_LABELS[activeHoverOrSelected].ckb}
                    </span>
                    <span>({activeHoverOrSelected} / 5 ★)</span>
                    {hasSubmittedRating && (
                      <span className="text-emerald-600 dark:text-emerald-400 ms-1 flex items-center gap-0.5 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        تۆمارکرا
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-slate-400 font-normal">
                    کرتە لە ئەستێرەیەک بکە بۆ تۆمارکردن
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Call & WhatsApp actions */}
        <div className="space-y-3 mb-4">
          {!phoneRevealed ? (
            <button
              onClick={handleRequestPhone}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Phone className="w-4 h-4" />
              <span>{t.requestPhone}</span>
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              <a
                href={`tel:${item.phone}`}
                className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <Phone className="w-4 h-4" />
                <span>{t.callSeller}</span>
              </a>
              <a
                href={getWhatsAppLink(item.phone, item.title)}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{t.whatsappChat}</span>
              </a>
            </div>
          )}

          {/* Quick in-app message form */}
          <form onSubmit={handleSendQuickMessage} className="flex gap-2">
            <input
              type="text"
              value={quickMessage}
              onChange={(e) => setQuickMessage(e.target.value)}
              placeholder="پرسیارێک لە فرۆشیار بکە..."
              className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{t.send}</span>
            </button>
          </form>
        </div>

        {/* Safety Warning */}
        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-200/80 dark:border-slate-800 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400 mb-3">
          <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{t.campusMeetingAdvice}</p>
        </div>

        {/* Report / Delete link */}
        <div className="flex items-center justify-between text-xs pt-1">
          {onOpenReport && (
            <button
              onClick={() => {
                onClose();
                onOpenReport(item.title);
              }}
              className="text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:underline"
            >
              ڕاپۆرتکردنی ئەم ڕیکلامە
            </button>
          )}

          <button
            onClick={handleDelete}
            className="text-rose-600 dark:text-rose-400 font-bold hover:underline flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t.removeItem}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
