import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Self-heal token session if Google Cloud Secure Token API was not used before or was corrupted
auth.onAuthStateChanged(async (currentUser) => {
  if (currentUser) {
    try {
      await currentUser.getIdToken();
    } catch (err: any) {
      if (
        err?.code === 'auth/token-service-api-has-not-been-used' ||
        err?.message?.includes('token-service-api-has-not-been-used') ||
        err?.message?.includes('securetoken.googleapis.com')
      ) {
        console.warn('Clearing stale user auth session due to token service availability in GCP:', err);
        await auth.signOut().catch(() => {});
      }
    }
  }
});

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('token-service-api-has-not-been-used') ||
        error.message.includes('securetoken.googleapis.com'))
    ) {
      console.warn('Secure Token API requires activation in Google Cloud. Resetting session to restore Firestore.');
      try {
        await auth.signOut();
        await getDocFromServer(doc(db, 'test', 'connection'));
        return;
      } catch (inner) {
        // Fall through
      }
    }

    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

testConnection();
