import React, { useState } from 'react';
import {
  Bell,
  Send,
  Plus,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Mail,
  MessageSquare,
  ShieldCheck,
  Radio,
  Loader2,
} from 'lucide-react';
import {
  NotificationRule,
  NotificationChannel,
  NotificationDispatchResult,
  JournalEntry,
} from '../types';
import { getNotificationRules, saveNotificationRules } from '../lib/firebase';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeEntry?: JournalEntry | null;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  activeEntry,
}) => {
  const [rules, setRules] = useState<NotificationRule[]>(getNotificationRules());
  const [activeTab, setActiveTab] = useState<'rules' | 'test' | 'schema'>('rules');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [newRuleName, setNewRuleName] = useState('');
  const [newChannel, setNewChannel] = useState<NotificationChannel>('slack');
  const [newDestination, setNewDestination] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggleRule = (id: string) => {
    const updated = rules.map((r) =>
      r.id === id ? { ...r, enabled: !r.enabled } : r
    );
    setRules(updated);
    saveNotificationRules(updated);
  };

  const handleDeleteRule = (id: string) => {
    const updated = rules.filter((r) => r.id !== id);
    setRules(updated);
    saveNotificationRules(updated);
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim() || !newDestination.trim()) return;

    const newRule: NotificationRule = {
      id: 'rule_' + Date.now(),
      name: newRuleName.trim(),
      channel: newChannel,
      destination: newDestination.trim(),
      enabled: true,
      triggerConditions: {
        sentimentThreshold: 'any',
      },
      dispatchCount: 0,
    };

    const updated = [...rules, newRule];
    setRules(updated);
    saveNotificationRules(updated);
    setNewRuleName('');
    setNewDestination('');
    setStatusMessage('New integration rule created.');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleTestDispatch = async (rule: NotificationRule) => {
    setIsTesting(true);
    setTestResult(null);

    const sampleEntry = activeEntry || {
      id: 'sample_entry',
      userId: 'test_user',
      title: 'Cognitive Breakthrough & Decision Architecture',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      mood: 'Inspired',
      sentimentScore: 9,
      tags: ['Strategy', 'Clarity', 'Growth'],
      summary:
        'Synthesized actionable clarity regarding strategic project priorities and cognitive momentum.',
      keyTakeaways: [
        'Decouple non-essential operational friction',
        'Establish automated notification hooks for critical milestones',
      ],
      messages: [],
      location: {
        placeName: 'Kyoto Zen Gardens',
        lat: 35.0165,
        lng: 135.6713,
      },
    };

    try {
      const res = await fetch('/api/notifications/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rule,
          entry: sampleEntry,
          synthesis: {
            summary: sampleEntry.summary,
            mood: sampleEntry.mood,
            sentimentScore: sampleEntry.sentimentScore,
            keyTakeaways: sampleEntry.keyTakeaways,
          },
        }),
      });

      const data = await res.json();
      setTestResult(data);
      if (data.success) {
        // Increment dispatch count
        const updated = rules.map((r) =>
          r.id === rule.id
            ? { ...r, dispatchCount: r.dispatchCount + 1, lastDispatchedAt: Date.now() }
            : r
        );
        setRules(updated);
        saveNotificationRules(updated);
      }
    } catch (err: any) {
      setTestResult({ error: err?.message || 'Failed to dispatch notification.' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                External Notification Hooks (Slack, Discord, Email)
              </h3>
              <p className="text-xs text-slate-500">
                Automated webhook dispatches when reflections are parsed and synthesized
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="px-6 border-b border-slate-200 flex gap-6 text-xs font-semibold bg-white">
          <button
            onClick={() => setActiveTab('rules')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'rules'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Active Webhooks &amp; Rules ({rules.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'test'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Interactive Dispatch Tester</span>
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`py-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'schema'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Payload Schemas &amp; SSRF Shield</span>
          </button>
        </div>

        {statusMessage && (
          <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-2 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          {/* TAB 1: Rules & Channels */}
          {activeTab === 'rules' && (
            <div className="space-y-5">
              {/* Rules List */}
              <div className="space-y-2.5">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-[200px]">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 ${
                          rule.channel === 'slack'
                            ? 'bg-[#4A154B]'
                            : rule.channel === 'discord'
                            ? 'bg-[#5865F2]'
                            : 'bg-emerald-600'
                        }`}
                      >
                        {rule.channel === 'slack' && <MessageSquare className="w-4 h-4" />}
                        {rule.channel === 'discord' && <MessageSquare className="w-4 h-4" />}
                        {rule.channel === 'email' && <Mail className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {rule.name}
                          </p>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                            {rule.channel}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono truncate max-w-xs sm:max-w-md">
                          {rule.destination}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleTestDispatch(rule)}
                        disabled={isTesting}
                        className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" /> Test
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleRule(rule.id)}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-colors ${
                          rule.enabled
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {rule.enabled ? 'Enabled' : 'Disabled'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Integration Rule */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Connect New Webhook or Notification Channel</span>
                </h4>
                <form onSubmit={handleAddRule} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={newRuleName}
                      onChange={(e) => setNewRuleName(e.target.value)}
                      placeholder="Rule name (e.g. Discord Team Alert)"
                      className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:border-indigo-500"
                    />
                    <select
                      value={newChannel}
                      onChange={(e) => setNewChannel(e.target.value as NotificationChannel)}
                      className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:border-indigo-500"
                    >
                      <option value="slack">Slack Webhook</option>
                      <option value="discord">Discord Webhook</option>
                      <option value="email">Email Alert</option>
                    </select>
                    <input
                      type="text"
                      value={newDestination}
                      onChange={(e) => setNewDestination(e.target.value)}
                      placeholder={
                        newChannel === 'email'
                          ? 'user@example.com'
                          : 'https://hooks.slack.com/services/...'
                      }
                      className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!newRuleName.trim() || !newDestination.trim()}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-40 transition-colors"
                    >
                      Add Integration Hook
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: Interactive Dispatch Tester */}
          {activeTab === 'test' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <h4 className="text-xs font-bold text-slate-800 mb-1">
                  Trigger Test Notification Dispatch
                </h4>
                <p className="text-xs text-slate-500 mb-3">
                  Simulates a journal synthesis trigger and validates payload formation and SSRF boundaries.
                </p>
                <div className="flex flex-wrap gap-2">
                  {rules.map((rule) => (
                    <button
                      key={rule.id}
                      onClick={() => handleTestDispatch(rule)}
                      disabled={isTesting}
                      className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-all disabled:opacity-50"
                    >
                      {isTesting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>Test {rule.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {testResult && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      Dispatch Response &amp; Payload Inspector
                    </span>
                    {testResult.success ? (
                      <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 200 OK Dispatched
                      </span>
                    ) : (
                      <span className="text-xs text-rose-600 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Error
                      </span>
                    )}
                  </div>
                  <pre className="text-[11px] font-mono bg-slate-900 text-emerald-400 p-3 rounded-lg overflow-x-auto max-h-60">
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Schemas & SSRF Defense */}
          {activeTab === 'schema' && (
            <div className="space-y-4 text-xs">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>SSRF Defense &amp; Sanitization Standard</span>
                </h4>
                <p className="text-slate-600 leading-relaxed">
                  All destination endpoints undergo strict backend URL validation. Calls to
                  <code>127.0.0.1</code>, <code>localhost</code>, <code>169.254.0.0/16</code>, and private IPv4 subnets (<code>10.0.0.0/8</code>, <code>192.168.0.0/16</code>) are blocked to prevent internal infrastructure probing.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                  <span className="font-bold text-slate-800 block mb-1">Slack Block Kit Standard</span>
                  <p className="text-[11px] text-slate-500 font-mono bg-slate-50 p-2 rounded">
                    type: "header" &rarr; type: "section" (fields: Title, Mood, Resonance, Location) &rarr; "section" (Executive Summary)
                  </p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                  <span className="font-bold text-slate-800 block mb-1">Discord Embeds Standard</span>
                  <p className="text-[11px] text-slate-500 font-mono bg-slate-50 p-2 rounded">
                    embeds: [ &#123; title, description, color (adaptive mood), fields, timestamp &#125; ]
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-colors shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
