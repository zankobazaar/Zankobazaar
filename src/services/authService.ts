import {
  signInWithPopup,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  User,
  ConfirmationResult,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile } from '../types';

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

// ١. چوونەژوورەوە بە گۆگل (Login with Google)
const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async (): Promise<User> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    console.log('سەرکەوتوو بوو:', user);
    await saveUserData(user);
    return user;
  } catch (error: any) {
    console.error('هەڵە لە چوونەژوورەوەی گووگڵ:', error);
    throw error;
  }
};

// ٢. چوونەژوورەوە بە ژمارەی مۆبایل (Login with Phone)
export const setupRecaptcha = (containerId: string = 'recaptcha-container'): RecaptchaVerifier => {
  // Clear previous verifier if any
  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear();
    } catch (e) {
      // Ignored
    }
  }

  const verifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      console.log('reCAPTCHA solved');
    },
    'expired-callback': () => {
      console.warn('reCAPTCHA expired');
    },
  });

  window.recaptchaVerifier = verifier;
  return verifier;
};

export const loginWithPhone = async (
  phoneNumber: string,
  containerId: string = 'recaptcha-container'
): Promise<ConfirmationResult> => {
  try {
    const appVerifier = setupRecaptcha(containerId);
    // Ensure proper international formatting (defaulting to +964 if entered as 07...)
    let formattedPhone = phoneNumber.trim().replace(/\s+/g, '');
    if (formattedPhone.startsWith('07')) {
      formattedPhone = '+964' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }

    const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
    window.confirmationResult = confirmationResult;
    console.log('کۆدی پشتڕاستکردنەوە نێردرا بۆ مۆبایلەکەت:', formattedPhone);
    return confirmationResult;
  } catch (error: any) {
    console.error('هەڵە لە ناردنی کۆد:', error);
    throw error;
  }
};

// دوای ئەوەی بەکارهێنەر کۆدەکەی نووسی، ئەمە کار پێبکە:
export const verifyOtpCode = async (otpCode: string): Promise<User> => {
  if (!window.confirmationResult) {
    throw new Error('تکایە سەرەتا ژمارەی مۆبایل بنووسە و داوای کۆد بکە');
  }

  try {
    const result = await window.confirmationResult.confirm(otpCode.trim());
    const user = result.user;
    console.log('بە سەرکەوتوویی چووە ژوورەوە:', user);
    await saveUserData(user);
    return user;
  } catch (error: any) {
    console.error('کۆدەکە هەڵەیە یان بەسەرچووە:', error);
    throw error;
  }
};

// ٣. دروستکردنی ئەکاونت بە ئیمەیڵ و پاسۆرد (Create Account with Email & Password)
export const registerWithEmail = async (
  email: string,
  pass: string,
  extra: { name: string; faculty: string; role: 'قوتابی' | 'مامۆستا' | 'کارمەند'; phone: string }
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
      phone: extra.phone.trim(),
      email: user.email || email.trim(),
    });
    return user;
  } catch (error: any) {
    console.error('هەڵە لە دروستکردنی ئەکاونت:', error);
    throw error;
  }
};

// ٤. چوونەژوورەوە بە ئیمەیڵ و وشەی نهێنی (Sign In with Email & Password)
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

// نموونەی پاشەکەوتکردنی زانیاری بەکارهێنەر دوای چوونەژوورەوە
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
