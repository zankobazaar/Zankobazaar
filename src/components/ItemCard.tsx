import React from 'react';
import { Heart, CheckCircle2, Trash2, Star, Camera } from 'lucide-react';
import { MarketItem, LanguageCode } from '../types';
import { formatPrice } from '../utils/formatters';
import { TRANSLATIONS } from '../utils/translations';

interface ItemCardProps {
  item: MarketItem;
  isFavorite: boolean;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onClick: (item: MarketItem) => void;
  onDeleteItem?: (id: string, e: React.MouseEvent) => void;
  language?: LanguageCode;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  isFavorite,
  onToggleFavorite,
  onClick,
  onDeleteItem,
  language = 'ckb',
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.ckb;
  const hasImages = item.images && item.images.length > 0;
  const displayImage = hasImages ? item.images![0] : item.imageUrl;

  return (
    <article
      onClick={() => onClick(item)}
      className="group relative bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500/50 transition-all cursor-pointer flex flex-col text-start"
    >
      {/* Top Media Container: Image or Emoji */}
      <div
        className="relative h-36 sm:h-44 flex items-center justify-center text-4xl sm:text-5xl select-none transition-transform group-hover:scale-[1.02] overflow-hidden"
        style={{ backgroundColor: item.colorHex || '#e2e8f0' }}
      >
        {displayImage ? (
          <img
            src={displayImage}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <span>{item.emoji || '📦'}</span>
        )}

        {/* Multi-image badge */}
        {hasImages && item.images!.length > 1 && (
          <div className="absolute bottom-2.5 start-2.5 bg-slate-900/75 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-xs shadow-xs">
            <Camera className="w-3 h-3 text-amber-300" />
            <span>{item.images!.length} وێنە</span>
          </div>
        )}

        {/* Favorite Button */}
        <button
          type="button"
          onClick={(e) => onToggleFavorite(item.id, e)}
          className={`absolute top-2.5 start-2.5 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md shadow-sm transition-transform active:scale-90 ${
            isFavorite
              ? 'bg-rose-500 text-white'
              : 'bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 hover:text-rose-500'
          }`}
          aria-label="Favorite toggle"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        {/* Optional Delete Quick Button for Owner */}
        {item.isMine && onDeleteItem && (
          <button
            type="button"
            onClick={(e) => onDeleteItem(item.id, e)}
            className="absolute top-2.5 end-2.5 w-8 h-8 rounded-full bg-white/80 dark:bg-slate-900/80 text-rose-600 hover:bg-rose-600 hover:text-white flex items-center justify-center backdrop-blur-md shadow-sm transition-colors"
            title={t.removeItem}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Condition tag */}
        <div className="absolute bottom-2.5 end-2.5 text-[11px] font-medium px-2 py-0.5 rounded-md bg-white/90 dark:bg-slate-950/80 text-slate-700 dark:text-slate-300 backdrop-blur-sm">
          {item.condition}
        </div>

        {/* Sold Badge */}
        {item.isSold && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center">
            <span className="text-white bg-emerald-600 px-3 py-1 rounded-lg text-xs font-bold tracking-wide flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              فرۆشراوە
            </span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between gap-2">
        <div>
          {/* Unboxed Metadata: Category, Rating & Location */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span className="font-semibold text-blue-600 dark:text-blue-400">{item.category}</span>
            {item.sellerRating && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-500">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span className="tabular-nums">{item.sellerRating.toFixed(1)}</span>
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-snug line-clamp-2">
            {item.title}
          </h3>
        </div>

        {/* Bottom Strip: Price & Seller info */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-end justify-between gap-2">
          <div>
            <div className="text-[11px] text-slate-400">{t.price}</div>
            <div className="text-base sm:text-lg font-extrabold text-blue-700 dark:text-blue-400 tabular-nums">
              {formatPrice(item.price)}
            </div>
          </div>

          <div className="text-end text-xs text-slate-500 dark:text-slate-400">
            <div className="font-semibold truncate max-w-[95px] text-slate-800 dark:text-slate-200">
              {item.sellerName}
            </div>
            <div className="text-[10px] text-slate-400">
              {item.sellerRole}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};
