import React, { useState, useRef } from 'react';
import {
  X,
  Sparkles,
  Upload,
  Eye,
  Check,
  ImagePlus,
  Trash2,
  Camera,
  Link as LinkIcon,
  Loader2,
  Star,
  Lock,
  Plus,
} from 'lucide-react';
import { MarketItem, UserProfile, CategoryType, ItemCondition } from '../types';
import { CATEGORIES } from '../data/initialItems';
import { formatPrice } from '../utils/formatters';
import { compressAndOptimizeImage, validateImageUrl } from '../utils/imageCompressor';

interface AddListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: MarketItem) => void;
  profile: UserProfile;
  onToast: (msg: string) => void;
  onOpenAuth?: () => void;
}

const EMOJI_OPTIONS = ['📚', '💻', '👕', '🪑', '🛠️', '📱', '🎧', '🎒', '📐', '⚽', '🔬', '🎨'];
const COLOR_OPTIONS = ['#dbeafe', '#dcfce7', '#ffe4e6', '#fef3c7', '#f3e8ff', '#e0f2fe'];

export const AddListingModal: React.FC<AddListingModalProps> = ({
  isOpen,
  onClose,
  onAddItem,
  profile,
  onToast,
  onOpenAuth,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Exclude<CategoryType, 'هەموو'>>('کتێب');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState(profile.phone || '');
  const [condition, setCondition] = useState<ItemCondition>('وەک نوێ');
  const [location, setLocation] = useState(profile.faculty || 'کەمپەسی زانکۆ');
  const [selectedEmoji, setSelectedEmoji] = useState('📚');
  const [selectedColor, setSelectedColor] = useState('#dbeafe');
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const isAuthenticated = Boolean(profile.uid);

  const handleCategoryChange = (newCat: Exclude<CategoryType, 'هەموو'>) => {
    setCategory(newCat);
    const catObj = CATEGORIES.find((c) => c.id === newCat);
    if (catObj) {
      setSelectedEmoji(catObj.emoji);
      setSelectedColor(catObj.bgLight);
    }
  };

  // Process and compress image files (gallery or camera)
  const processFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const remaining = 6 - images.length;
    if (remaining <= 0) {
      onToast('دەتوانیت تەنها تا ٦ وێنە بۆ ئەم بەرهەمە دابنێیت');
      return;
    }

    const filesArray = Array.from(files).slice(0, remaining);
    setIsProcessingImages(true);
    let successCount = 0;

    try {
      for (const file of filesArray) {
        if (!file.type.startsWith('image/')) {
          onToast(`فایلی ${file.name} وێنە نییە`);
          continue;
        }

        try {
          const optimizedDataUrl = await compressAndOptimizeImage(file, 1024, 1024, 0.78);
          setImages((prev) => {
            if (prev.length >= 6) return prev;
            return [...prev, optimizedDataUrl];
          });
          successCount++;
        } catch (err) {
          console.error('Error compressing image:', err);
          onToast(`کێشە لە خوێندنەوەی وێنەی ${file.name}`);
        }
      }

      if (successCount > 0) {
        onToast(`${successCount} وێنە بە سەرکەوتوویی زیادکرا`);
      }
    } finally {
      setIsProcessingImages(false);
    }
  };

  // Add image via URL
  const handleAddImageUrl = async () => {
    if (!imageUrlInput.trim()) return;
    if (images.length >= 6) {
      onToast('زۆرترین ڕێژە ٦ وێنەیە');
      return;
    }

    const url = imageUrlInput.trim();
    setIsProcessingImages(true);

    try {
      const isValid = await validateImageUrl(url);
      if (isValid) {
        setImages((prev) => [...prev, url]);
        setImageUrlInput('');
        setShowUrlInput(false);
        onToast('وێنەکە زیادکرا');
      } else {
        onToast('نەتوانرا وێنەکە لەم بەستەرە بکرێتەوە. تکایە بەستەری ڕاستەوخۆ دابنێ');
      }
    } finally {
      setIsProcessingImages(false);
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSetCoverImage = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      return [item, ...copy];
    });
    onToast('وێنەکە کرا بە وێنەی سەرەکی');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      onToast('تکایە سەرەتا ئەکاونت دروستبکە یان بچۆ ژوورەوە بۆ بڵاوکردنەوەی کاڵا');
      if (onOpenAuth) onOpenAuth();
      return;
    }

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
      sellerId: profile.uid,
      sellerName: profile.name || 'فرۆشیار',
      sellerRole: profile.role || 'قوتابی',
      phone: phone.trim() || profile.phone || '—',
      faculty: profile.faculty || 'زانکۆ',
      condition,
      createdAt: 'ئێستا',
      isMine: true,
      emoji: selectedEmoji,
      colorHex: selectedColor,
      location: location.trim(),
      images: images.length > 0 ? images : undefined,
      imageUrl: images.length > 0 ? images[0] : undefined,
      sellerRating: profile.rating || 5.0,
      sellerRatingCount: profile.ratingCount || 1,
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
      <div className="bg-white dark:bg-slate-900 w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 text-start">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              زیادکردنی کاڵای نوێ (فرۆشتن لە زانکۆ)
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

        {/* If user is not authenticated: Show blocker notice */}
        {!isAuthenticated && (
          <div className="mb-5 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs">
              <Lock className="w-5 h-5 text-amber-600 shrink-0" />
              <span>
                تەنها بەکارهێنەرانی خاوەن ئەکاونت دەتوانن کاڵا دابنێن. تکایە سەرەتا بچۆ ژوورەوە.
              </span>
            </div>
            {onOpenAuth && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 whitespace-nowrap shadow-xs cursor-pointer"
              >
                چوونەژوورەوە / دروستکردنی ئەکاونت
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ========================================================================= */}
          {/* MULTI-IMAGE UPLOAD & CAMERA SECTION (زیادکردنی وێنەی بەرهەم)                 */}
          {/* ========================================================================= */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>وێنەکانی بەرهەم (دەتوانیت تا ٦ وێنە دابنێیت)</span>
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                {images.length}/6 وێنە
              </span>
            </div>

            {/* Thumbnail previews */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className={`relative group aspect-square rounded-xl overflow-hidden border ${
                      idx === 0
                        ? 'border-blue-500 ring-2 ring-blue-500/30'
                        : 'border-slate-200 dark:border-slate-700'
                    } bg-slate-100 shadow-xs`}
                  >
                    <img src={img} alt={`وێنەی ${idx + 1}`} className="w-full h-full object-cover" />

                    {/* Cover badge */}
                    {idx === 0 ? (
                      <span className="absolute bottom-1 inset-x-1 text-[9px] bg-blue-600 text-white font-bold text-center py-0.5 rounded-sm shadow-sm flex items-center justify-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        سەرەکی
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetCoverImage(idx)}
                        className="absolute bottom-1 inset-x-1 text-[8px] bg-slate-900/80 hover:bg-blue-600 text-white font-semibold text-center py-0.5 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        بیکە بە سەرەکی
                      </button>
                    )}

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 end-1 w-5 h-5 rounded-full bg-slate-900/80 text-white flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity hover:bg-rose-600"
                      title="سڕینەوەی ئەم وێنەیە"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Processing spinner indicator */}
            {isProcessingImages && (
              <div className="py-2.5 px-3 mb-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs flex items-center gap-2 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>خەریکی ئامادەکردن و کەمکردنەوەی قەبارەی وێنەکانە بە بەرزترین ڕوونی...</span>
              </div>
            )}

            {/* Action buttons to add photos */}
            {images.length < 6 && (
              <div className="flex flex-wrap items-center gap-2">
                {/* 1. From Gallery / Files */}
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={isProcessingImages}
                  className="flex-1 min-w-[140px] flex items-center justify-center gap-1.5 p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-blue-50/50 dark:hover:bg-slate-700/60 transition-colors text-xs font-bold text-blue-600 dark:text-blue-400 disabled:opacity-50"
                >
                  <ImagePlus className="w-4 h-4" />
                  <span>+ هەڵبژاردن لە فایلەکان</span>
                </button>
                <input
                  ref={galleryInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    processFiles(e.target.files);
                    e.target.value = '';
                  }}
                  className="hidden"
                />

                {/* 2. Direct Camera */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isProcessingImages}
                  className="flex-1 min-w-[130px] flex items-center justify-center gap-1.5 p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-emerald-50/50 dark:hover:bg-slate-700/60 transition-colors text-xs font-bold text-emerald-600 dark:text-emerald-400 disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                  <span>📷 گرتنی وێنە (کامێرا)</span>
                </button>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => {
                    processFiles(e.target.files);
                    e.target.value = '';
                  }}
                  className="hidden"
                />

                {/* 3. Image URL link option */}
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1"
                  title="زیادکردن لە ڕێگەی بەستەری ئینتەرنێت"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>بەستەر</span>
                </button>
              </div>
            )}

            {/* URL Input Box */}
            {showUrlInput && (
              <div className="mt-2.5 flex items-center gap-1.5 animate-in fade-in">
                <input
                  type="url"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  dir="ltr"
                  className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  disabled={!imageUrlInput.trim() || isProcessingImages}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 disabled:opacity-50"
                >
                  زیادکردن
                </button>
              </div>
            )}

            <p className="text-[10px] text-slate-400 mt-1.5">
              هەموو وێنەکان بە شێوەیەکی ئۆتۆماتیکی چاکسازییان بۆ دەکرێت تا زۆر بە خێرایی لەسەر مۆبایل و کۆمپیوتەر بکرێنەوە.
            </p>
          </div>

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
                ڕەوش و باری کاڵاکە
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as ItemCondition)}
                className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="نوێ">✨ نوێ (بەکاری نەهاتووە)</option>
                <option value="وەک نوێ">👌 وەک نوێ (زۆر کەم بەکارهاتووە)</option>
                <option value="بەکارهاتوو">🔄 بەکارهاتوو (خاوێن و تەندروست)</option>
              </select>
            </div>
          </div>

          {/* Price & Meetup Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                نرخ (بە دیناری عێراقی - IQD) *
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="نموونە: 15000"
                min={0}
                step={500}
                className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
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

          {/* Fallback Emoji/Color Selector (when no photos uploaded) */}
          {images.length === 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                هێما و ڕەنگی دیزاین لە کاتی نەبوونی وێنە
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
          )}

          {/* Contact Phone */}
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
              className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-end"
            />
          </div>

          {/* Preview Toggle */}
          <div className="pt-1">
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
                  className="h-28 rounded-xl flex items-center justify-center text-3xl mb-2 overflow-hidden"
                  style={{ backgroundColor: selectedColor }}
                >
                  {images.length > 0 ? (
                    <img src={images[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    selectedEmoji
                  )}
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
          <div className="pt-3 flex items-center gap-3">
            <button
              type="submit"
              disabled={!isAuthenticated || isProcessingImages}
              className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
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
