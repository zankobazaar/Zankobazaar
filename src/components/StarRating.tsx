import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number; // e.g. 4.8
  count?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRate?: (stars: number) => void;
  showText?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  count,
  size = 'md',
  interactive = false,
  onRate,
  showText = true,
}) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const starSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const activeRating = hoverRating !== null ? hoverRating : rating;

  return (
    <div className="inline-flex items-center gap-1.5 select-none" dir="ltr">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((starVal) => {
          const isFilled = activeRating >= starVal;
          const isHalf = !isFilled && activeRating >= starVal - 0.5;

          return (
            <button
              key={starVal}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onRate && onRate(starVal)}
              onMouseEnter={() => interactive && setHoverRating(starVal)}
              onMouseLeave={() => interactive && setHoverRating(null)}
              className={`p-0.5 transition-transform ${
                interactive ? 'cursor-pointer hover:scale-125 focus:outline-none' : 'cursor-default'
              }`}
              aria-label={`${starVal} ئەستێرە`}
            >
              <Star
                className={`${starSizes[size]} ${
                  isFilled
                    ? 'fill-amber-400 text-amber-400'
                    : isHalf
                    ? 'fill-amber-300/60 text-amber-400'
                    : 'text-slate-300 dark:text-slate-600'
                }`}
              />
            </button>
          );
        })}
      </div>

      {showText && (
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tabular-nums">
          {rating.toFixed(1)}
          {typeof count === 'number' && (
            <span className="text-[11px] font-normal text-slate-400 ms-1">
              ({count})
            </span>
          )}
        </span>
      )}
    </div>
  );
};
