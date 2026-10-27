import React, { useState } from 'react';
import { X, Sparkles, Upload, Eye, Check } from 'lucide-react';
import { MarketItem, UserProfile, CategoryType, ItemCondition } from '../types';
import { CATEGORIES } from '../data/initialItems';
import { formatPrice } from '../utils/formatters';

interface AddListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: MarketItem) => void;
  profile: UserProfile;
  onToast: (msg: string) => void;
}

const EMOJI_OPTIONS = ['📚', '💻', '👕', '🪑', '🛠️', '📱', '🎧', '🎒', '📐', '⚽', '🔬', '🎨'];
const COLOR_OPTIONS = ['#dbeafe', '#dcfce7', '#ffe4e6', '#fef3c7', '#f3e8ff', '#e0f2fe'];

export const AddListingModal: React.FC<AddListingModalProps> = ({
  isOpen,
  onClose,
  onAddItem,
  profile,
  onToast,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Exclude<CategoryType, 'هەموو'>>('کتێب');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState(profile.phone || '0750 000 0000');
  const [condition, setCondition] = useState<ItemCondition>('وەک نوێ');
  const [location, setLocation] = useState(profile.faculty || 'کەمپەسی زانکۆ');
  const [selectedEmoji, setSelectedEmoji] = useState('📚');
  const [selectedColor, setSelectedColor] = useState('#dbeafe');
  const [showPreview, setShowPreview] = useState(false);

  if (!isOpen) return null;

  const handleCategoryChange = (newCat: Exclude<CategoryType, 'هەموو'>) => {
    setCategory(newCat);
    const catObj = CATEGORIES.find((c) => c.id === newCat);
    if (catObj) {
      setSelectedEmoji(catObj.emoji);
      setSelectedColor(catObj.bgLight);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      onToast('تکایە ناونیشانی کاڵا بنووسە');
      return;
    }
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      onToast('تکایە نرخێکی دروست بنووسە');
      return;
    }
    if (!description.trim()) {
      onToast('تکایە وەسفی کاڵا بنووسە');
      return;
    }

    const newItem: MarketItem = {
      id: Date.now().toString(),
      title: title.trim(),
      category,
      price: numPrice,
      description: description.trim(),
      sellerName: profile.name,
      sellerRole: profile.role,
      phone: phone.trim() || '—',
      faculty: profile.faculty || 'زانکۆ',
      condition,
      createdAt: 'ئێستا',
      isMine: true,
      emoji: selectedEmoji,
      colorHex: selectedColor,
      location: location.trim(),
    };

    onAddItem(newItem);
    onToast('کاڵاکەت بە سەرکەوتوویی بڵاوکرایەوە');
    onClose();
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
      <div className="bg-white dark:bg-slate-900 w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 text-right">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              زیادکردنی کاڵایەکی نوێ
            </h2>
            <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md font-medium">
              بێ بەرامبەر
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              ناونیشانی کاڵا یان خزمەتگوزاری *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="نموونە: کتێبی بیرکاری ١، لاپتۆپی دل، هتد..."
              maxLength={70}
              className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Category & Condition */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                پۆلێنی سەرەکی
              </label>
              <select
                value={category}
                onChange={(e) =>
                  handleCategoryChange(e.target.value as Exclude<CategoryType, 'هەموو'>)
                }
                className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.filter((c) => c.id !== 'هەموو').map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                دۆخی کاڵا
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['نوێ', 'وەک نوێ', 'بەکارهاتوو'] as ItemCondition[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCondition(c)}
                    className={`py-2 px-1 text-xs font-bold rounded-xl border text-center transition-all ${
                      condition === c
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Price & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                نرخ بە دیناری عێراقی (د.ع) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="نموونە: 15000 (یان 0 ئەگەر دیاری/بەخۆڕایی بێت)"
                  className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 tabular-nums"
                  required
                />
                <span className="absolute end-3.5 top-2.5 text-xs text-slate-600 dark:text-slate-400 font-bold pointer-events-none">
                  د.ع
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                شوێنی چاوپێکەوتن لە ناو زانکۆ
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="نموونە: بەشە ناوخۆیی، کافتریای زانست..."
                className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              وەسف و وردەکارییەکان *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="باسی ڕەوش، مۆدێل، کاتی بەکارهێنان یان هۆکاری فرۆشتن بنووسە..."
              rows={3}
              className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Visual Icon & Background Theme Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              هەڵبژاردنی هێما و ڕەنگی بەرگ
            </label>
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedEmoji(emoji)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-transform ${
                      selectedEmoji === emoji
                        ? 'bg-blue-600 text-white scale-110 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 border-s border-slate-200 dark:border-slate-700 ps-2">
                {COLOR_OPTIONS.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setSelectedColor(col)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      selectedColor === col
                        ? 'border-blue-600 scale-125'
                        : 'border-white dark:border-slate-800'
                    }`}
                    style={{ backgroundColor: col }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              ژمارەی مۆبایل / پەیوەندی
            </label>
            <input
              type="tel"
              dir="ltr"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0750 000 0000"
              className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
            />
          </div>

          {/* Preview Toggle */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showPreview ? 'شاردنەوەی پێشبینین' : 'پێشبینینی کارتی کاڵاکە'}</span>
            </button>

            {showPreview && (
              <div className="mt-2.5 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/60 max-w-xs mx-auto border border-slate-200 dark:border-slate-700">
                <div
                  className="h-28 rounded-xl flex items-center justify-center text-3xl mb-2"
                  style={{ backgroundColor: selectedColor }}
                >
                  {selectedEmoji}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400 font-bold">{category}</div>
                <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                  {title || 'ناونیشانی کاڵاکەت'}
                </div>
                <div className="text-sm font-extrabold text-blue-700 dark:text-blue-400 mt-1">
                  {formatPrice(Number(price) || 0)}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center gap-3">
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Check className="w-4 h-4" />
              <span>بڵاوکردنەوەی کاڵا</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              پاشگەزبوونەوە
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
