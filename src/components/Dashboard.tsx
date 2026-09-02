import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UserProfile, JournalEntry, ChatMessage } from '../types';
import {
  saveJournalEntryToFirestore,
  fetchUserJournalEntries,
  deleteJournalEntryFromFirestore,
} from '../lib/firebase';
import { EntryHistorySidebar } from './EntryHistorySidebar';
import { JournalEditor } from './JournalEditor';
import { InsightsPanel } from './InsightsPanel';

interface DashboardProps {
  user: UserProfile;
  onOpenNotifications?: () => void;
  onOpenWorkspace?: () => void;
  onOpenDeepResearch?: () => void;
  onOpenScholar?: () => void;
  onActiveEntryChange?: (entry: JournalEntry | null) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  onOpenNotifications,
  onOpenWorkspace,
  onOpenDeepResearch,
  onOpenScholar,
  onActiveEntryChange,
}) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(null);
  const [isLoadingGemini, setIsLoadingGemini] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isInitialLoad = useRef(true);

  // Helper to create a new blank reflection entry
  const createNewEntry = useCallback(() => {
    const newEntry: JournalEntry = {
      id: 'entry_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      userId: user.uid,
      title: 'Untitled Reflection',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      mood: 'Reflective',
      tags: [],
      messages: [],
    };
    return newEntry;
  }, [user.uid]);

  // Load entries for current user on mount or auth switch
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const userEntries = await fetchUserJournalEntries(user.uid);
        if (isMounted) {
          setEntries(userEntries);
          if (userEntries.length > 0) {
            setActiveEntry(userEntries[0]);
          } else {
            const fresh = createNewEntry();
            setActiveEntry(fresh);
          }
        }
      } catch (err) {
        console.error('Failed to load user entries:', err);
      } finally {
        isInitialLoad.current = false;
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [user.uid, createNewEntry]);

  // Propagate active entry to parent for Workspace modals
  useEffect(() => {
    onActiveEntryChange?.(activeEntry);
  }, [activeEntry, onActiveEntryChange]);

  // Debounced/direct save helper to Firestore
  const persistEntry = async (entryToSave: JournalEntry) => {
    try {
      setSaveStatus('saving');
      setErrorMessage(null);
      const saved = await saveJournalEntryToFirestore(user.uid, entryToSave);
      setSaveStatus('saved');
      setEntries((prev) => {
        const index = prev.findIndex((e) => e.id === saved.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = saved;
          return updated.sort((a, b) => b.updatedAt - a.updatedAt);
        }
        return [saved, ...prev];
      });
    } catch (err: any) {
      console.error('Error persisting journal entry:', err);
      setSaveStatus('error');
      setErrorMessage(err?.message || 'Failed to save entry to database.');
    }
  };

  // Handle entry property updates (title, mood, etc.)
  const handleUpdateActiveEntry = (patch: Partial<JournalEntry>) => {
    if (!activeEntry) return;
    const updated: JournalEntry = {
      ...activeEntry,
      ...patch,
      updatedAt: Date.now(),
    };
    setActiveEntry(updated);
    persistEntry(updated);
  };

  // Handle new user reflection submission to Gemini
  const handleSendMessage = async (userText: string) => {
    if (!activeEntry) return;

    const userMessage: ChatMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: userText,
      timestamp: Date.now(),
    };

    const updatedMessages = [...activeEntry.messages, userMessage];

    // Auto-generate a title if it is still default
    let updatedTitle = activeEntry.title;
    if (updatedTitle === 'Untitled Reflection' || !updatedTitle) {
      updatedTitle = userText.slice(0, 35) + (userText.length > 35 ? '...' : '');
    }

    const currentEntryState: JournalEntry = {
      ...activeEntry,
      title: updatedTitle,
      messages: updatedMessages,
      updatedAt: Date.now(),
    };

    setActiveEntry(currentEntryState);
    await persistEntry(currentEntryState);

    // Call Gemini API through our secure backend route with fallback ladder
    setIsLoadingGemini(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          currentEntryTitle: updatedTitle,
          mood: activeEntry.mood,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned ${response.status}`);
      }

      const data = await response.json();
      const geminiMessage: ChatMessage = {
        id: 'msg_' + Date.now() + '_ai',
        role: 'model',
        content: data.reply,
        timestamp: Date.now(),
        modelUsed: data.modelUsed,
      };

      const finalState: JournalEntry = {
        ...currentEntryState,
        messages: [...updatedMessages, geminiMessage],
        updatedAt: Date.now(),
      };

      setActiveEntry(finalState);
      await persistEntry(finalState);
    } catch (err: any) {
      console.error('Error receiving Gemini response:', err);
      setErrorMessage(
        `Gemini AI notice: ${err?.message || 'Unable to generate reflection response'}. Please verify your API key.`
      );
    } finally {
      setIsLoadingGemini(false);
    }
  };

  // Handle generating summary, mood analysis & takeaways
  const handleGenerateSummary = async () => {
    if (!activeEntry || activeEntry.messages.length === 0) return;

    setIsSummarizing(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: activeEntry.title,
          content: activeEntry.messages.map((m) => `${m.role}: ${m.content}`).join('\n\n'),
          messages: activeEntry.messages,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to synthesize summary (${response.status})`);
      }

      const summaryData = await response.json();

      const updatedState: JournalEntry = {
        ...activeEntry,
        summary: summaryData.summary,
        mood: summaryData.mood || activeEntry.mood,
        sentimentScore: summaryData.sentimentScore,
        tags: summaryData.tags || activeEntry.tags,
        keyTakeaways: summaryData.keyTakeaways || [],
        actionItems: summaryData.actionItems || [],
        followUpPrompt: summaryData.followUpPrompt,
        updatedAt: Date.now(),
      };

      setActiveEntry(updatedState);
      await persistEntry(updatedState);
    } catch (err: any) {
      console.error('Error generating summary:', err);
      setErrorMessage(err?.message || 'Failed to generate summary.');
    } finally {
      setIsSummarizing(false);
    }
  };

  // Handle deleting entry
  const handleDeleteEntry = async (entryId: string) => {
    try {
      await deleteJournalEntryFromFirestore(user.uid, entryId);
      const remaining = entries.filter((e) => e.id !== entryId);
      setEntries(remaining);
      if (activeEntry?.id === entryId) {
        if (remaining.length > 0) {
          setActiveEntry(remaining[0]);
        } else {
          const fresh = createNewEntry();
          setActiveEntry(fresh);
        }
      }
    } catch (err) {
      console.error('Error deleting entry:', err);
    }
  };

  // Handle starting a new entry
  const handleStartNewEntry = () => {
    const fresh = createNewEntry();
    setActiveEntry(fresh);
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-4rem)] overflow-hidden bg-white">
      {/* 1. Left Sidebar: History of Past User Entries */}
      <EntryHistorySidebar
        entries={entries}
        activeEntryId={activeEntry?.id || null}
        onSelectEntry={(entry) => setActiveEntry(entry)}
        onNewEntry={handleStartNewEntry}
        onDeleteEntry={handleDeleteEntry}
      />

      {/* 2. Center: Active Journal & Multi-Turn Reflection Canvas */}
      {activeEntry ? (
        <JournalEditor
          entry={activeEntry}
          onUpdateEntry={handleUpdateActiveEntry}
          onSendMessage={handleSendMessage}
          isLoading={isLoadingGemini}
          saveStatus={saveStatus}
          errorMessage={errorMessage}
          onRetrySave={() => activeEntry && persistEntry(activeEntry)}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center p-8 text-center text-slate-500">
          <p>Select an entry or start a new reflection</p>
        </div>
      )}

      {/* 3. Right Panel: Structured AI Summaries & Insights */}
      {activeEntry && (
        <InsightsPanel
          entry={activeEntry}
          onGenerateSummary={handleGenerateSummary}
          isSummarizing={isSummarizing}
          onOpenNotifications={onOpenNotifications}
          onOpenWorkspace={onOpenWorkspace}
          onOpenDeepResearch={onOpenDeepResearch}
          onOpenScholar={onOpenScholar}
        />
      )}
    </div>
  );
};
