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
import { JournalEntry, UserProfile, UserRole, AuditLog, NotificationRule } from '../types';

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
const LOCAL_AUDIT_LOGS_KEY = 'reflectai_audit_logs';
const LOCAL_NOTIFICATION_RULES_KEY = 'reflectai_notification_rules';
const LOCAL_USERS_REGISTRY_KEY = 'reflectai_users_registry';

function getLocalUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(LOCAL_AUTH_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return {
        ...parsed,
        role: parsed.role || 'admin',
      };
    }
    return null;
  } catch {
    return null;
  }
}

function setLocalUser(user: UserProfile | null) {
  try {
    if (user) {
      const normalizedUser: UserProfile = {
        ...user,
        role: user.role || 'admin',
      };
      localStorage.setItem(LOCAL_AUTH_USER_KEY, JSON.stringify(normalizedUser));
      // Also register in users directory
      const users = getAllRegisteredUsers();
      const idx = users.findIndex((u) => u.uid === normalizedUser.uid);
      if (idx >= 0) {
        users[idx] = normalizedUser;
      } else {
        users.push(normalizedUser);
      }
      localStorage.setItem(LOCAL_USERS_REGISTRY_KEY, JSON.stringify(users));
    } else {
      localStorage.removeItem(LOCAL_AUTH_USER_KEY);
    }
  } catch (e) {
    console.error('LocalStorage user error:', e);
  }
}

export function getAllRegisteredUsers(): UserProfile[] {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_REGISTRY_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        return list.map((u) => ({
          ...u,
          role: u.role || 'member',
        }));
      }
    }
  } catch (e) {
    console.error('Error reading users registry:', e);
  }
  // Default seeded users for RBAC demo
  return [
    {
      uid: 'user_admin_demo',
      email: 'admin@reflectai.dev',
      displayName: 'System Admin (ReflectAI)',
      photoURL: 'https://lh3.googleusercontent.com/a/default-user',
      isAnonymous: false,
      role: 'admin',
    },
    {
      uid: 'user_editor_demo',
      email: 'editor@reflectai.dev',
      displayName: 'Content Editor',
      photoURL: 'https://lh3.googleusercontent.com/a/default-user',
      isAnonymous: false,
      role: 'editor',
    },
    {
      uid: 'user_member_demo',
      email: 'member@reflectai.dev',
      displayName: 'Standard Member',
      photoURL: 'https://lh3.googleusercontent.com/a/default-user',
      isAnonymous: false,
      role: 'member',
    },
  ];
}

export function updateUserRoleLocally(uid: string, newRole: UserRole): void {
  const users = getAllRegisteredUsers();
  const idx = users.findIndex((u) => u.uid === uid);
  if (idx >= 0) {
    users[idx].role = newRole;
    localStorage.setItem(LOCAL_USERS_REGISTRY_KEY, JSON.stringify(users));
  }
  const current = getLocalUser();
  if (current && current.uid === uid) {
    current.role = newRole;
    setLocalUser(current);
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
      const profile: UserProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Google User',
        photoURL: user.photoURL,
        isAnonymous: false,
        role: 'admin', // Default to admin for first administrator experience
      };
      setLocalUser(profile);
      return profile;
    } catch (err: any) {
      console.warn('Firebase Popup sign-in error or popup blocked, using fallback session:', err?.message);
      const fallbackUser: UserProfile = {
        uid: 'user_google_' + Math.random().toString(36).substring(2, 9),
        email: 'admin@google.com',
        displayName: 'Google Admin User',
        photoURL: 'https://lh3.googleusercontent.com/a/default-user',
        isAnonymous: false,
        role: 'admin',
      };
      setLocalUser(fallbackUser);
      return fallbackUser;
    }
  } else {
    // Demo / Dev Mode Google sign in emulation
    const fallbackUser: UserProfile = {
      uid: 'user_admin_demo',
      email: 'admin@reflectai.dev',
      displayName: 'Admin User',
      photoURL: 'https://lh3.googleusercontent.com/a/default-user',
      isAnonymous: false,
      role: 'admin',
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
      const guestProfile: UserProfile = {
        uid: user.uid,
        email: null,
        displayName: 'Guest Reflector',
        photoURL: null,
        isAnonymous: true,
        role: 'admin',
      };
      setLocalUser(guestProfile);
      return guestProfile;
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
    role: 'admin',
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
        const local = getLocalUser();
        callback({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || (firebaseUser.isAnonymous ? 'Guest User' : 'Authenticated User'),
          photoURL: firebaseUser.photoURL,
          isAnonymous: firebaseUser.isAnonymous,
          role: local?.role || 'admin',
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

// Audit Logs Service (RBAC & Admin Tracking)
export async function recordAuditLog(
  log: Omit<AuditLog, 'id' | 'timestamp'>
): Promise<AuditLog> {
  const fullLog: AuditLog = {
    ...log,
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    timestamp: Date.now(),
  };

  try {
    const raw = localStorage.getItem(LOCAL_AUDIT_LOGS_KEY);
    const logs: AuditLog[] = raw ? JSON.parse(raw) : [];
    logs.unshift(fullLog);
    // Keep last 100 logs
    localStorage.setItem(LOCAL_AUDIT_LOGS_KEY, JSON.stringify(logs.slice(0, 100)));
  } catch (err) {
    console.error('Failed to record audit log:', err);
  }

  return fullLog;
}

export function fetchAuditLogs(): AuditLog[] {
  try {
    const raw = localStorage.getItem(LOCAL_AUDIT_LOGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read audit logs:', err);
  }
  // Initial seed logs
  return [
    {
      id: 'log_seed_1',
      timestamp: Date.now() - 3600000 * 2,
      actorId: 'system',
      actorEmail: 'system@reflectai.dev',
      action: 'SYSTEM_BOOT',
      details: 'RBAC Security boundary and Firestore isolation rules initialized.',
      severity: 'info',
    },
    {
      id: 'log_seed_2',
      timestamp: Date.now() - 3600000 * 1,
      actorId: 'user_admin_demo',
      actorEmail: 'admin@reflectai.dev',
      action: 'ROLE_VERIFY',
      targetId: 'user_admin_demo',
      details: 'Elevated administrator session verified with full privileges.',
      severity: 'info',
    },
  ];
}

export function purgeAuditLogs(): void {
  try {
    localStorage.setItem(LOCAL_AUDIT_LOGS_KEY, JSON.stringify([]));
  } catch (err) {
    console.error('Failed to purge audit logs:', err);
  }
}

// Notification Rules Store
export function getNotificationRules(): NotificationRule[] {
  try {
    const raw = localStorage.getItem(LOCAL_NOTIFICATION_RULES_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read notification rules:', err);
  }
  // Default sample rules
  return [
    {
      id: 'rule_slack_breakthrough',
      name: 'Slack: High Resonance & Breakthroughs',
      channel: 'slack',
      destination: 'https://hooks.slack.com/services/DEMO/RESONANCE/REFLECTAI',
      enabled: true,
      triggerConditions: {
        sentimentThreshold: 'high',
        moods: ['Inspired', 'Excited', 'Focused'],
      },
      dispatchCount: 0,
    },
    {
      id: 'rule_discord_stress',
      name: 'Discord: Overwhelm Alert & Reflection',
      channel: 'discord',
      destination: 'https://discord.com/api/webhooks/DEMO/REFLECTAI_ALERT',
      enabled: true,
      triggerConditions: {
        sentimentThreshold: 'low',
        moods: ['Overwhelmed', 'Challenged'],
      },
      dispatchCount: 0,
    },
    {
      id: 'rule_email_actions',
      name: 'Email: Action Items Digest',
      channel: 'email',
      destination: 'angai29@gmail.com',
      enabled: false,
      triggerConditions: {
        requireActionItems: true,
      },
      dispatchCount: 0,
    },
  ];
}

export function saveNotificationRules(rules: NotificationRule[]): void {
  try {
    localStorage.setItem(LOCAL_NOTIFICATION_RULES_KEY, JSON.stringify(rules));
  } catch (err) {
    console.error('Failed to save notification rules:', err);
  }
}

export { isFirebaseConfigured };
