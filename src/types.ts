export type UserRole = 'admin' | 'editor' | 'member';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
  role: UserRole;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  modelUsed?: string;
}

export interface JournalLocation {
  placeName: string;
  address?: string;
  lat: number;
  lng: number;
  placeId?: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  initialPrompt?: string;
  createdAt: number;
  updatedAt: number;
  mood: string;
  sentimentScore?: number;
  tags: string[];
  summary?: string;
  keyTakeaways?: string[];
  actionItems?: string[];
  followUpPrompt?: string;
  messages: ChatMessage[];
  isFavorite?: boolean;
  location?: JournalLocation | null;
}

export interface PromptSpark {
  id: string;
  category: 'Mindfulness' | 'Brainstorming' | 'Problem Solving' | 'Gratitude' | 'Growth';
  title: string;
  description: string;
  promptText: string;
}

export interface ThreatZoneAnalysis {
  zone: string;
  threatDescription: string;
  mitigationStrategy: string;
  status: 'active' | 'enforced';
}

export interface AuditLog {
  id: string;
  timestamp: number;
  actorId: string;
  actorEmail: string;
  action: string;
  targetId?: string;
  details: string;
  ipHash?: string;
  severity: 'info' | 'warn' | 'critical';
}

export type NotificationChannel = 'slack' | 'discord' | 'email';

export interface NotificationRule {
  id: string;
  name: string;
  channel: NotificationChannel;
  destination: string; // Webhook URL or Email address
  enabled: boolean;
  triggerConditions: {
    moods?: string[];
    sentimentThreshold?: 'any' | 'high' | 'low'; // high >= 8, low <= 4
    requireActionItems?: boolean;
    tags?: string[];
  };
  lastDispatchedAt?: number;
  dispatchCount: number;
}

export interface NotificationDispatchResult {
  ruleId: string;
  channel: NotificationChannel;
  success: boolean;
  timestamp: number;
  message: string;
}
