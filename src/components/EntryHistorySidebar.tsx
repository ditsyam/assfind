import React, { useState } from 'react';
import { Search, Plus, Trash2, Calendar, MessageSquare, Tag, Smile, Sparkles } from 'lucide-react';
import { JournalEntry } from '../types';

interface EntryHistorySidebarProps {
  entries: JournalEntry[];
  activeEntryId: string | null;
  onSelectEntry: (entry: JournalEntry) => void;
  onNewEntry: () => void;
  onDeleteEntry: (entryId: string) => void;
}

export const EntryHistorySidebar: React.FC<EntryHistorySidebarProps> = ({
  entries,
  activeEntryId,
  onSelectEntry,
  onNewEntry,
  onDeleteEntry,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState<string>('all');

  const moods = ['all', 'Inspired', 'Contemplative', 'Focused', 'Grateful', 'Calm', 'Challenged'];

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      (entry.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.summary || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.tags || []).some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      entry.messages.some((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesMood =
      selectedMood === 'all' ||
      (entry.mood && entry.mood.toLowerCase() === selectedMood.toLowerCase());

    return matchesSearch && matchesMood;
  });

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <aside className="w-full md:w-80 lg:w-88 flex flex-col bg-white border-r border-slate-200 h-full overflow-hidden shrink-0">
      {/* Top Header / Actions */}
      <div className="p-4 border-b border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span>Past Reflections</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
              {entries.length}
            </span>
          </h2>
          <button
            id="sidebar-new-entry-btn"
            onClick={onNewEntry}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="search-entries-input"
            type="text"
            placeholder="Search entries, keywords, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>

        {/* Mood filter chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
          {moods.map((mood) => (
            <button
              key={mood}
              onClick={() => setSelectedMood(mood)}
              className={`px-2.5 py-1 rounded-md capitalize whitespace-nowrap transition-colors ${
                selectedMood === mood
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {mood}
            </button>
          ))}
        </div>
      </div>

      {/* Entries List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-10 px-4">
            <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
              <Sparkles className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium text-slate-600">No reflections found</p>
            <p className="text-[11px] text-slate-400 mt-1">
              {entries.length === 0
                ? 'Create your first reflection to get started.'
                : 'Try clearing your search or mood filter.'}
            </p>
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const isActive = entry.id === activeEntryId;
            return (
              <div
                key={entry.id}
                id={`entry-item-${entry.id}`}
                onClick={() => onSelectEntry(entry)}
                className={`group relative p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  isActive
                    ? 'bg-indigo-50/70 border-indigo-200 shadow-xs'
                    : 'bg-white hover:bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3
                    className={`text-xs font-bold truncate ${
                      isActive ? 'text-indigo-950' : 'text-slate-800'
                    }`}
                  >
                    {entry.title || 'Untitled Reflection'}
                  </h3>
                  <button
                    id={`delete-entry-btn-${entry.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Are you sure you want to delete this reflection?')) {
                        onDeleteEntry(entry.id);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all"
                    title="Delete reflection"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Snippet / Summary */}
                <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                  {entry.summary ||
                    (entry.messages[0]?.content
                      ? entry.messages[0].content
                      : 'No messages in this reflection yet...')}
                </p>

                {/* Metadata Footer */}
                <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-slate-100/80 text-[10px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(entry.updatedAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {entry.messages.length}
                    </span>
                  </div>

                  {entry.mood && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                      <Smile className="w-2.5 h-2.5 text-indigo-500" />
                      {entry.mood}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
