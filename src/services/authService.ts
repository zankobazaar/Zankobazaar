import {
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';

// Format Iraqi and international phone numbers cleanly (used for item contact details)
export function formatPhoneNumber(rawPhone: string): string {
  let cleaned = rawPhone.trim().replace(/[\s\-\(\)]/g, '');
  if (cleaned.startsWith('07')) {
    cleaned = '+964' + cleaned.substring(1);
  } else if (/^7[3-9]\d{8}$/.test(cleaned)) {
    cleaned = '+964' + cleaned;
  } else if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.substring(2);
  } else if (!cleaned.startsWith('+') && cleaned.length > 0) {
    cleaned = '+' + cleaned;
  }
  return cleaned;
}

// ١. چوونەژوورەوە و خۆتۆمارکردن بە گووگڵ (Sign In / Up with Google)
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export const loginWithGoogle = async (additionalData?: Partial<UserProfile>): Promise<User> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    console.log('چوونەژوورەوەی گووگڵ سەرکەوتوو بوو:', user.uid);
    await saveUserData(user, additionalData);
    return user;
  } catch (error: any) {
    console.error('هەڵە لە چوونەژوورەوەی گووگڵ:', error);
    if (error.code === 'auth/operation-not-allowed') {
      throw new Error(
        'خزمەتگوزاری چوونەژوورەوەی Google لە Firebase Console چالاک نەکراوە (Authentication > Sign-in method > Google).'
      );
    }
    if (
      error.code === 'auth/token-service-api-has-not-been-used' ||
      error.message?.includes('token-service-api-has-not-been-used') ||
      error.message?.includes('securetoken.googleapis.com')
    ) {
      throw new Error(
        'پێویستە خزمەتگوزاری Secure Token API لە Google Cloud چالاک بکرێت (auth/token-service-api-has-not-been-used).'
      );
    }
    throw error;
  }
};

// ٢. دروستکردنی ئەکاونت بە ئیمەیڵ و پاسۆرد (Create Account with Email & Password)
export const registerWithEmail = async (
  email: string,
  pass: string,
  extra: { name: string; faculty: string; role: UserRole; phone?: string }
): Promise<User> => {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    const user = cred.user;
    if (extra.name.trim()) {
      await updateProfile(user, { displayName: extra.name.trim() });
    }
    await saveUserData(user, {
      name: extra.name.trim(),
      faculty: extra.faculty.trim(),
      role: extra.role,
      phone: extra.phone ? extra.phone.trim() : '',
      email: user.email || email.trim(),
    });
    return user;
  } catch (error: any) {
    console.error('هەڵە لە دروستکردنی ئەکاونت:', error);
    if (error.code === 'auth/operation-not-allowed') {
      throw new Error(
        'خزمەتگوزاری Email/Password لە Firebase Console چالاک نەکراوە (Authentication > Sign-in method > Email/Password).'
      );
    }
    throw error;
  }
};

// ٣. چوونەژوورەوە بە ئیمەیڵ و وشەی نهێنی (Sign In with Email & Password)
export const loginWithEmail = async (email: string, pass: string): Promise<User> => {
  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
    const user = cred.user;
    await saveUserData(user);
    return user;
  } catch (error: any) {
    console.error('هەڵە لە چوونەژوورەوە بە ئیمەیڵ:', error);
    throw error;
  }
};

// پاشەکەوتکردنی زانیاری بەکارهێنەر لە بنکەدراوەی Firestore
export const saveUserData = async (
  user: User,
  additionalData?: Partial<UserProfile>
): Promise<void> => {
  const userDocPath = `users/${user.uid}`;
  try {
    const dataToSave = {
      uid: user.uid,
      name:
        additionalData?.name ||
        user.displayName ||
        (user.email ? user.email.split('@')[0] : 'بەکارهێنەر'),
      email: user.email || additionalData?.email || null,
      phoneNumber: user.phoneNumber || additionalData?.phone || null,
      photoURL: user.photoURL || null,
      role: additionalData?.role || 'قوتابی',
      faculty: additionalData?.faculty || 'زانکۆ',
      phone: additionalData?.phone || user.phoneNumber || '',
      lastLogin: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'users', user.uid), dataToSave, { merge: true });
    console.log('داتاکانی بەکارهێنەر پاشەکەوت کران:', user.uid);
  } catch (error: any) {
    console.error('کێشە لە پاشەکەوتکردنی داتا:', error);
    try {
      handleFirestoreError(error, OperationType.WRITE, userDocPath);
    } catch (e) {
      // Handled
    }
  }
};

// وەرگرتنی داتای پرۆفایل لە فایەربەیس
export const getUserDataFromFirestore = async (uid: string): Promise<UserProfile | null> => {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.warn('Could not fetch user profile from Firestore:', error);
    return null;
  }
};

// دەرچوون لە هەژمار (Sign Out)
export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
    console.log('بە سەرکەوتوویی دەردەچوو');
  } catch (error) {
    console.error('هەڵە لە دەرچوون:', error);
    throw error;
  }
};

// گوێگرتن لە دۆخی بەکارهێنەر (Auth State Listener)
export const subscribeToAuth = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
