import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import {
  Send,
  Sparkles,
  Smile,
  Copy,
  Check,
  RotateCcw,
  CloudCheck,
  ShieldCheck,
  Lightbulb,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { JournalEntry, ChatMessage, PromptSpark } from '../types';
import { PROMPT_SPARKS } from '../lib/sparks';

interface JournalEditorProps {
  entry: JournalEntry;
  onUpdateEntry: (updated: Partial<JournalEntry>) => void;
  onSendMessage: (messageText: string) => Promise<void>;
  isLoading: boolean;
  saveStatus: 'saved' | 'saving' | 'error';
  errorMessage: string | null;
  onRetrySave?: () => void;
}

export const JournalEditor: React.FC<JournalEditorProps> = ({
  entry,
  onUpdateEntry,
  onSendMessage,
  isLoading,
  saveStatus,
  errorMessage,
  onRetrySave,
}) => {
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const moods = [
    'Reflective',
    'Inspired',
    'Focused',
    'Grateful',
    'Calm',
    'Challenged',
    'Excited',
    'Overwhelmed',
  ];

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entry.messages, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const text = inputText.trim();
    setInputText('');
    await onSendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const handleApplySpark = (spark: PromptSpark) => {
    setInputText(spark.promptText);
    if (!entry.title || entry.title === 'Untitled Reflection') {
      onUpdateEntry({ title: spark.title, mood: spark.category });
    }
    textareaRef.current?.focus();
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/50 overflow-hidden">
      {/* Editor Top Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
        {/* Title & Mood Selection */}
        <div className="flex-1 min-w-[260px] flex items-center gap-3">
          <input
            id="journal-title-input"
            type="text"
            value={entry.title}
            onChange={(e) => onUpdateEntry({ title: e.target.value })}
            placeholder="Title your reflection..."
            className="text-base sm:text-lg font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-hidden transition-all w-full max-w-md"
          />

          {/* Mood Selector Pill */}
          <div className="relative shrink-0">
            <select
              id="mood-select-dropdown"
              value={entry.mood || 'Reflective'}
              onChange={(e) => onUpdateEntry({ mood: e.target.value })}
              className="text-xs font-semibold bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-colors cursor-pointer"
            >
              {moods.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Save & Isolation Status */}
        <div className="flex items-center gap-3 text-xs">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Saving to Firestore...</span>
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Isolated &amp; Saved</span>
            </span>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center gap-2 text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Save failed</span>
              {onRetrySave && (
                <button
                  onClick={onRetrySave}
                  className="underline hover:text-rose-800 font-bold"
                >
                  Retry
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Error Banner if any */}
      {errorMessage && (
        <div className="bg-rose-50 border-b border-rose-200 px-6 py-2 text-xs text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Messages Canvas */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Starter Sparks Carousel if conversation is fresh */}
        {entry.messages.length === 0 && (
          <div className="max-w-2xl mx-auto space-y-4 my-4">
            <div className="text-center">
              <div className="w-10 h-10 mx-auto rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
                <Lightbulb className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Choose a Reflection Spark or Start Writing</h3>
              <p className="text-xs text-slate-500 mt-1">
                ReflectAI will listen, synthesize your thoughts, and respond with deep inquiry.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 pt-2">
              {PROMPT_SPARKS.map((spark) => (
                <button
                  key={spark.id}
                  onClick={() => handleApplySpark(spark)}
                  className="p-3 bg-white hover:bg-indigo-50/40 border border-slate-200 hover:border-indigo-300 rounded-xl text-left transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-900">
                      {spark.title}
                    </span>
                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {spark.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    {spark.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message Thread */}
        <div className="max-w-3xl mx-auto space-y-5">
          {entry.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div className="flex items-center gap-2 mb-1 px-1">
                <span className="text-[11px] font-semibold text-slate-500">
                  {msg.role === 'user' ? 'You' : 'ReflectAI'}
                </span>
                {msg.modelUsed && (
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">
                    {msg.modelUsed}
                  </span>
                )}
                <span className="text-[10px] text-slate-400">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              {/* Message Bubble */}
              <div
                className={`relative group max-w-2xl rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-slate-900 text-white rounded-tr-xs shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs shadow-xs'
                }`}
              >
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div className="prose prose-sm prose-slate max-w-none">
                    <Markdown>{msg.content}</Markdown>
                  </div>
                )}

                {/* Quick Copy Button */}
                <button
                  onClick={() => handleCopyText(msg.id, msg.content)}
                  className={`absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                    msg.role === 'user'
                      ? 'text-slate-400 hover:text-white bg-slate-800'
                      : 'text-slate-400 hover:text-slate-700 bg-slate-100'
                  }`}
                  title="Copy text"
                >
                  {copiedId === msg.id ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>
          ))}

          {/* Loading Indicator for Gemini AI */}
          {isLoading && (
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-2 mb-1 px-1">
                <span className="text-[11px] font-semibold text-slate-500">ReflectAI</span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-600">
                  Thinking...
                </span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs flex items-center gap-2 text-slate-500 text-xs">
                <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]" />
                <span className="ml-1 text-slate-600 font-medium">Reflecting on your entry...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Sticky Bottom Input Bar */}
      <div className="bg-white border-t border-slate-200 p-4">
        <form
          onSubmit={handleSend}
          className="max-w-3xl mx-auto relative bg-slate-50 border border-slate-300 rounded-2xl focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all p-2"
        >
          <textarea
            id="reflection-input-textarea"
            ref={textareaRef}
            rows={3}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write your journal entry, thought, or question for Gemini... (Press Cmd+Enter to send)"
            disabled={isLoading}
            className="w-full bg-transparent px-2 py-1 text-sm text-slate-800 placeholder-slate-400 resize-none focus:outline-hidden leading-relaxed"
          />

          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 px-2 text-xs">
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              <strong>Tip:</strong> Press <kbd className="px-1 py-0.5 bg-slate-200 rounded text-[10px]">Cmd</kbd> + <kbd className="px-1 py-0.5 bg-slate-200 rounded text-[10px]">Enter</kbd> to submit
            </span>

            <div className="flex items-center gap-2 ml-auto">
              <button
                id="send-reflection-btn"
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all disabled:opacity-40 disabled:hover:bg-slate-900 shadow-xs"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
