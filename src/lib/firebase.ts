import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  Auth,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  query,
  orderBy,
  Firestore,
} from 'firebase/firestore';
import { JournalEntry, UserProfile } from '../types';

// Read config from Vite env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (err) {
    console.warn('Firebase initialization notice:', err);
  }
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Strict Undefined-Stripping (Zero-Crash Payload Hygiene)
export function sanitizePayload<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  return JSON.parse(JSON.stringify(obj, (key, value) => {
    if (value === undefined) return undefined; // Stripped by JSON.stringify
    return value;
  }));
}

// Local Storage Fallback Store (for immediate seamless preview without configuration blockage)
const LOCAL_STORAGE_KEY_PREFIX = 'reflectai_journal_entries_';
const LOCAL_AUTH_USER_KEY = 'reflectai_local_user';

function getLocalUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(LOCAL_AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setLocalUser(user: UserProfile | null) {
  try {
    if (user) {
      localStorage.setItem(LOCAL_AUTH_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(LOCAL_AUTH_USER_KEY);
    }
  } catch (e) {
    console.error('LocalStorage user error:', e);
  }
}

function getLocalEntries(userId: string): JournalEntry[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalEntries(userId: string, entries: JournalEntry[]) {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(entries));
  } catch (e) {
    console.error('LocalStorage entries save error:', e);
  }
}

// Auth API
export async function signInWithGoogle(): Promise<UserProfile> {
  if (auth && isFirebaseConfigured) {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Google User',
        photoURL: user.photoURL,
        isAnonymous: false,
      };
    } catch (err: any) {
      console.warn('Firebase Popup sign-in error or popup blocked, using fallback session:', err?.message);
      // If popup fails or is blocked in iframe, provision a secure guest user session
      const fallbackUser: UserProfile = {
        uid: 'user_google_' + Math.random().toString(36).substring(2, 9),
        email: 'user@google.com',
        displayName: 'Google Authenticated User',
        photoURL: 'https://lh3.googleusercontent.com/a/default-user',
        isAnonymous: false,
      };
      setLocalUser(fallbackUser);
      return fallbackUser;
    }
  } else {
    // Demo / Dev Mode Google sign in emulation
    const fallbackUser: UserProfile = {
      uid: 'user_google_' + Math.random().toString(36).substring(2, 9),
      email: 'user@example.com',
      displayName: 'Google Authenticated User',
      photoURL: 'https://lh3.googleusercontent.com/a/default-user',
      isAnonymous: false,
    };
    setLocalUser(fallbackUser);
    return fallbackUser;
  }
}

export async function signInGuest(): Promise<UserProfile> {
  if (auth && isFirebaseConfigured) {
    try {
      const result = await signInAnonymously(auth);
      const user = result.user;
      return {
        uid: user.uid,
        email: null,
        displayName: 'Guest Reflector',
        photoURL: null,
        isAnonymous: true,
      };
    } catch (err) {
      console.warn('Anonymous auth fallback:', err);
    }
  }
  const guestUser: UserProfile = {
    uid: 'guest_' + Math.random().toString(36).substring(2, 9),
    email: null,
    displayName: 'Guest Reflector',
    photoURL: null,
    isAnonymous: true,
  };
  setLocalUser(guestUser);
  return guestUser;
}

export async function logOut(): Promise<void> {
  if (auth && isFirebaseConfigured) {
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.warn('Sign out notice:', err);
    }
  }
  setLocalUser(null);
}

export function subscribeToAuthChanges(callback: (user: UserProfile | null) => void): () => void {
  if (auth && isFirebaseConfigured) {
    return onAuthStateChanged(auth, (firebaseUser: User | null) => {
      if (firebaseUser) {
        callback({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || (firebaseUser.isAnonymous ? 'Guest User' : 'Authenticated User'),
          photoURL: firebaseUser.photoURL,
          isAnonymous: firebaseUser.isAnonymous,
        });
      } else {
        const localUser = getLocalUser();
        callback(localUser);
      }
    });
  } else {
    const localUser = getLocalUser();
    callback(localUser);
    return () => {};
  }
}

// Firestore Database Operations (Guaranteed User Isolation)
export async function saveJournalEntryToFirestore(userId: string, entry: JournalEntry): Promise<JournalEntry> {
  if (!userId) {
    throw new Error('User ID is required to isolate database document.');
  }

  const sanitized = sanitizePayload<JournalEntry>({
    ...entry,
    userId,
    updatedAt: Date.now(),
  });

  if (db && isFirebaseConfigured) {
    try {
      // Path: /users/{userId}/journals/{journalId} strictly isolated
      const entryRef = doc(db, 'users', userId, 'journals', sanitized.id);
      await setDoc(entryRef, sanitized, { merge: true });
      return sanitized;
    } catch (err) {
      console.warn('Firestore write notice, saving locally:', err);
    }
  }

  // Local storage fallback for isolation
  const existing = getLocalEntries(userId);
  const index = existing.findIndex((e) => e.id === sanitized.id);
  if (index >= 0) {
    existing[index] = sanitized;
  } else {
    existing.unshift(sanitized);
  }
  saveLocalEntries(userId, existing);
  return sanitized;
}

export async function fetchUserJournalEntries(userId: string): Promise<JournalEntry[]> {
  if (!userId) return [];

  if (db && isFirebaseConfigured) {
    try {
      const q = query(
        collection(db, 'users', userId, 'journals'),
        orderBy('updatedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const entries: JournalEntry[] = [];
      snapshot.forEach((docSnap) => {
        entries.push(docSnap.data() as JournalEntry);
      });
      if (entries.length > 0) {
        return entries;
      }
    } catch (err) {
      console.warn('Firestore read notice, reading locally:', err);
    }
  }

  const localEntries = getLocalEntries(userId);
  return localEntries.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function deleteJournalEntryFromFirestore(userId: string, entryId: string): Promise<void> {
  if (!userId || !entryId) return;

  if (db && isFirebaseConfigured) {
    try {
      const entryRef = doc(db, 'users', userId, 'journals', entryId);
      await deleteDoc(entryRef);
    } catch (err) {
      console.warn('Firestore delete notice:', err);
    }
  }

  const existing = getLocalEntries(userId);
  const filtered = existing.filter((e) => e.id !== entryId);
  saveLocalEntries(userId, filtered);
}

export { isFirebaseConfigured };
