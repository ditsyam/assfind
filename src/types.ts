export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  modelUsed?: string;
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
