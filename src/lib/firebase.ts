import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer, 
  setDoc, 
  getDoc 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// CRITICAL CONSTRAINT: Test connection on app boot
export async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// Sign in with Google using popup (safe in iframe / sandbox)
export async function signInWithGooglePopup() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

// Sign in with Google using full-page redirect (fallback if popup is blocked)
export async function signInWithGoogleRedirect() {
  await signInWithRedirect(auth, googleProvider);
}

// Check if user just returned from a Google OAuth redirect
export async function checkRedirectResult() {
  try {
    const result = await getRedirectResult(auth);
    return result?.user ?? null;
  } catch (error) {
    console.warn('Redirect auth result check:', error);
    return null;
  }
}

// Sync user to Firestore
export async function syncUserProfileToFirestore(user: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  role?: 'participant' | 'admin';
}) {
  const userRef = doc(db, 'users', user.uid);
  const data = {
    id: user.uid,
    email: user.email || '',
    name: user.displayName || 'Participant',
    photoUrl: user.photoURL || '',
    phone: '',
    college: "SVKM's NMIMS Global University, Dhule",
    role: user.role || 'participant',
    createdAt: new Date().toISOString()
  };

  try {
    await setDoc(userRef, data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
  }
}
