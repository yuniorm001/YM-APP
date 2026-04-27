import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

const app = isFirebaseConfigured
  ? (getApps().length ? getApp() : initializeApp(firebaseConfig))
  : null;

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

export async function signInWithProvider(providerName) {
  if (!auth || !isFirebaseConfigured) {
    throw new Error('Firebase no está configurado. Falta el archivo .env con las credenciales.');
  }

  await setPersistence(auth, browserLocalPersistence);

  const provider = providerName === 'apple' ? appleProvider : googleProvider;
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export function subscribeToAuth(callback) {
  if (!auth || !isFirebaseConfigured) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(auth, callback);
}

export async function signOutUser() {
  if (!auth || !isFirebaseConfigured) return;
  await signOut(auth);
}

export async function loadCloudData(uid) {
  if (!db || !uid) return null;
  const ref = doc(db, 'users', uid, 'appData', 'main');
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data()?.payload ?? null : null;
}

export async function saveCloudData(uid, payload) {
  if (!db || !uid) return;
  const ref = doc(db, 'users', uid, 'appData', 'main');
  await setDoc(ref, {
    payload,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}
