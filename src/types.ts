export type CategoryType = 'هەموو' | 'کتێب' | 'ئەلیکترۆنیات' | 'جلوبەرگ' | 'کەلوپەل' | 'خزمەتگوزاری';

export type UserRole = 'قوتابی' | 'مامۆستا' | 'کارمەند';

export type ItemCondition = 'نوێ' | 'وەک نوێ' | 'بەکارهاتوو';

export type LanguageCode = 'ckb' | 'en' | 'ar' | 'kmr';

export interface MarketItem {
  id: string;
  title: string;
  category: Exclude<CategoryType, 'هەموو'>;
  price: number;
  description: string;
  sellerName: string;
  sellerRole: UserRole;
  phone: string;
  faculty: string;
  condition: ItemCondition;
  createdAt: string;
  isMine?: boolean;
  isSold?: boolean;
  colorHex?: string;
  emoji?: string;
  location?: string;
  sellerRating?: number;
  sellerRatingCount?: number;
  images?: string[]; // Multiple photos support
  imageUrl?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  role: UserRole;
  faculty: string;
  phone: string;
  rating?: number;
  ratingCount?: number;
}

export interface AppSettings {
  hidePhone: boolean;
  notifications: boolean;
  theme: 'light' | 'dark' | 'auto';
  language: LanguageCode;
}

export interface ChatMessage {
  id: string;
  sender: 'bot' | 'me';
  text: string;
  time: string;
}

export interface DirectMessage {
  id: string;
  itemId: string;
  sender: 'me' | 'seller';
  text?: string;
  audioUrl?: string; // Voice recording Base64 / Blob URL
  audioDuration?: number; // Duration in seconds
  timestamp: number;
  time: string;
}

export interface UniversityInfo {
  id: string;
  name: {
    ckb: string;
    en: string;
    ar: string;
    kmr: string;
  };
  city: {
    ckb: string;
    en: string;
    ar: string;
    kmr: string;
  };
  type: 'public' | 'private' | 'polytechnic';
  website: string;
  founded: number;
  description: {
    ckb: string;
    en: string;
    ar: string;
    kmr: string;
  };
  campuses: string[];
}
