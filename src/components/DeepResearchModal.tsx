import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Search,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Copy,
  Check,
  BarChart3,
  ExternalLink,
  Code2,
  ChevronRight,
  Send,
  RefreshCw,
  Clock,
  BookOpen
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { DeepResearchSession, UserProfile } from '../types';

interface DeepResearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onInsertIntoJournal?: (title: string, content: string) => void;
}

const PRESET_QUERIES = [
  'Analisis komprehensif mengenai dampak AI terhadap pasar tenaga kerja global hingga tahun 2030.',
  'Empirical analysis of cognitive habits and daily journaling on executive performance & resilience.',
  'Technological trajectory of semiconductor wafer lithography and advanced packaging (2026-2032).',
  'Comparative study of neuroplasticity techniques for rapid skill acquisition and emotional regulation.',
];

export const DeepResearchModal: React.FC<DeepResearchModalProps> = ({
  isOpen,
  onClose,
  user,
  onInsertIntoJournal,
}) => {
  const [query, setQuery] = useState('Analisis komprehensif mengenai dampak AI terhadap pasar tenaga kerja global hingga tahun 2030.');
  const [visualization, setVisualization] = useState<'auto' | 'none'>('auto');
  const [collaborativePlanning, setCollaborativePlanning] = useState(false);
  const [activeSession, setActiveSession] = useState<DeepResearchSession | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [pollingActive, setPollingActive] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'research' | 'code' | 'history'>('research');
  const [history, setHistory] = useState<DeepResearchSession[]>([]);

  const pollIntervalRef = useRef<any>(null);

  // Stop polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const handleStartResearch = async () => {
    if (!query.trim()) return;

    setIsStarting(true);
    try {
      const res = await fetch('/api/research/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': user.role,
        },
        body: JSON.stringify({
          prompt: query.trim(),
          visualization,
          collaborativePlanning,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to start deep research.');
      }

      const data = await res.json();
      const newSession: DeepResearchSession = {
        id: data.sessionId,
        prompt: query.trim(),
        status: 'in_progress',
        steps: [
          { type: 'thought', text: 'Initializing deep research agent...' },
        ],
        startedAt: Date.now(),
        visualization,
      };

      setActiveSession(newSession);
      setHistory((prev) => [newSession, ...prev]);
      setPollingActive(true);

      // Start polling
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = setInterval(() => {
        pollStatus(data.sessionId);
      }, 3000);
    } catch (err: any) {
      console.error('Error starting research:', err);
      alert('Error: ' + err.message);
    } finally {
      setIsStarting(false);
    }
  };

  const pollStatus = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/research/status/${sessionId}`);
      if (!res.ok) return;

      const data = await res.json();
      setActiveSession((prev) => {
        if (!prev || prev.id !== sessionId) return prev;
        const updated: DeepResearchSession = {
          ...prev,
          status: data.status,
          report: data.report || prev.report,
          steps: data.steps || prev.steps,
          error: data.error,
          completedAt: data.status === 'completed' || data.status === 'failed' ? Date.now() : undefined,
        };

        // Update history
        setHistory((hList) => hList.map((h) => (h.id === sessionId ? updated : h)));
        return updated;
      });

      if (data.status === 'completed' || data.status === 'failed') {
        setPollingActive(false);
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      }
    } catch (pollErr) {
      console.warn('Polling error:', pollErr);
    }
  };

  const copyToClipboard = (text: string, type: 'code' | 'report') => {
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2000);
    }
  };

  const pythonSampleCode = `import os
import time
from google import genai
from google.genai import types
from dotenv import load_dotenv

# 1. Load environment variables
load_dotenv()

# 2. Initialize the Google GenAI SDK Client
# Reads GEMINI_API_KEY from environment
client = genai.Client()

def run_deep_research(prompt_query: str):
    print(f"🚀 Starting Gemini Deep Research for: '{prompt_query}'...")
    
    # 3. Create deep research interaction
    # Uses the managed Deep Research Agent (deep-research-preview-04-2026)
    interaction = client.interactions.create(
        agent="deep-research-preview-04-2026",
        input=prompt_query,
        background=True,
        agent_config={
            "type": "deep-research",
            "visualization": "auto",       # Enables automated charts/graphs
            "thinking_summaries": "auto",  # Displays reasoning traces
        }
    )
    
    interaction_id = interaction.id
    print(f"Interaction created. ID: {interaction_id}")
    
    # 4. Polling loop to track background agent progress
    while True:
        status_check = client.interactions.get(interaction_id=interaction_id)
        print(f"Current Agent Status: {status_check.status}...")
        
        if status_check.status in ["completed", "COMPLETED"]:
            print("\\n=== COMPREHENSIVE DEEP RESEARCH SYNTHESIS ===")
            # Extract combined output text from model steps
            full_text = ""
            for step in getattr(status_check, "steps", []):
                if getattr(step, "type", "") == "model_output":
                    for content in getattr(step, "content", []):
                        if getattr(content, "type", "") == "text":
                            full_text += getattr(content, "text", "")
            
            output = full_text or getattr(status_check, "output_text", "No text generated.")
            print(output)
            break
        elif status_check.status in ["failed", "FAILED"]:
            print("\\n❌ Deep Research process failed or encountered an error.")
            break
            
        time.sleep(5)  # Poll every 5 seconds

if __name__ == "__main__":
    query = "${query.replace(/"/g, '\\"')}"
    run_deep_research(query)`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[88vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50/70 via-purple-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-800">Gemini Deep Research Agent</h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200">
                  deep-research-preview-04-2026
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Multi-step autonomous deep research, iterative synthesis, citations & visualization
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tabs */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs">
              <button
                onClick={() => setSelectedTab('research')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  selectedTab === 'research'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Research Console
              </button>
              <button
                onClick={() => setSelectedTab('code')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                  selectedTab === 'code'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                Python SDK
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {selectedTab === 'code' ? (
            /* Python Code & SDK Guide View */
            <div className="flex-1 p-6 overflow-y-auto bg-slate-950 text-slate-100 font-mono text-xs flex flex-col">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                  <span className="ml-2 font-sans font-medium text-slate-300 text-sm">
                    deep_research_client.py (@google/genai SDK v2.4+)
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(pythonSampleCode, 'code')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied to clipboard' : 'Copy Python Code'}</span>
                </button>
              </div>

              <pre className="flex-1 text-slate-300 leading-relaxed overflow-x-auto selection:bg-indigo-900 selection:text-indigo-200">
                {pythonSampleCode}
              </pre>

              <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-slate-800 font-sans text-xs text-slate-400 space-y-2">
                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                  Key Fixes & Best Practices in this Implementation:
                </div>
                <ul className="list-disc pl-5 space-y-1 text-slate-300">
                  <li>Corrected import typo: <code className="text-emerald-400">from dotenv import load_dotenv</code> (was load_model).</li>
                  <li>Fixed quote encoding in string formatting (<code className="text-emerald-400">f"..."</code>).</li>
                  <li>Multi-step text aggregation: Combines all <code className="text-indigo-400">model_output</code> steps rather than relying solely on trailing <code className="text-indigo-400">output_text</code>.</li>
                  <li>Enabled auto visualization and thinking summaries in <code className="text-purple-400">agent_config</code>.</li>
                </ul>
              </div>
            </div>
          ) : (
            /* Main Research Console */
            <>
              {/* Left Column: Query Config & Steps */}
              <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-slate-200 p-4 sm:p-5 flex flex-col gap-4 bg-slate-50/50 overflow-y-auto">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Research Topic or Thesis
                  </label>
                  <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    rows={4}
                    placeholder="Enter research prompt, thesis, or complex question..."
                    className="w-full text-xs sm:text-sm p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-sm resize-none"
                  />
                </div>

                {/* Preset Prompts */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1.5">
                    Example Deep Research Prompts
                  </label>
                  <div className="space-y-1.5">
                    {PRESET_QUERIES.map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => setQuery(preset)}
                        className="w-full text-left text-[11px] p-2 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-slate-700 transition-all line-clamp-2 cursor-pointer"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Agent Settings */}
                <div className="space-y-2 pt-2 border-t border-slate-200 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Visualization:</span>
                    <button
                      onClick={() => setVisualization(v => v === 'auto' ? 'none' : 'auto')}
                      className={`px-2 py-1 rounded-md font-semibold text-[11px] transition-colors ${
                        visualization === 'auto'
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {visualization === 'auto' ? 'Auto Graphs ON' : 'Disabled'}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleStartResearch}
                  disabled={isStarting || pollingActive || !query.trim()}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium text-xs sm:text-sm shadow-md shadow-indigo-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all cursor-pointer mt-auto"
                >
                  {isStarting || pollingActive ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{pollingActive ? 'Agent Synthesizing...' : 'Launching Agent...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Start Deep Research</span>
                    </>
                  )}
                </button>
              </div>

              {/* Right Column: Live Proof of Work & Research Report */}
              <div className="flex-1 p-4 sm:p-6 flex flex-col overflow-y-auto bg-white">
                {activeSession ? (
                  <div className="flex-1 flex flex-col space-y-4">
                    {/* Status Banner */}
                    <div className="flex items-center justify-between p-3.5 rounded-xl border bg-slate-50 border-slate-200">
                      <div className="flex items-center gap-2.5">
                        {activeSession.status === 'completed' ? (
                          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        ) : activeSession.status === 'failed' ? (
                          <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
                            <AlertCircle className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center">
                            <Loader2 className="w-4 h-4 animate-spin" />
                          </div>
                        )}
                        <div>
                          <div className="text-xs font-bold text-slate-800">
                            {activeSession.status === 'completed'
                              ? 'Deep Research Completed'
                              : activeSession.status === 'failed'
                              ? 'Research Process Failed'
                              : 'Agent Actively Researching & Synthesizing'}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Session ID: <code className="bg-slate-200/70 px-1 rounded">{activeSession.id}</code>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      {activeSession.report && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => copyToClipboard(activeSession.report || '', 'report')}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedReport ? 'Copied' : 'Copy'}</span>
                          </button>

                          {onInsertIntoJournal && (
                            <button
                              onClick={() => {
                                onInsertIntoJournal(
                                  `Research: ${activeSession.prompt.slice(0, 40)}...`,
                                  activeSession.report || ''
                                );
                                onClose();
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>Insert as Journal Reflection</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Agent Proof of Work / Step Timeline */}
                    {activeSession.steps && activeSession.steps.length > 0 && (
                      <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/80">
                        <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-indigo-500" />
                          Agent Reasoning & Timeline ({activeSession.steps.length} steps)
                        </div>
                        <div className="space-y-1.5 max-h-36 overflow-y-auto text-xs">
                          {activeSession.steps.map((s, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-slate-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                              <span className="font-medium text-slate-700 capitalize text-[11px]">{s.type}:</span>
                              <span className="text-slate-600 text-[11px] line-clamp-2">{s.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Rendered Synthesis Report */}
                    <div className="flex-1 p-5 rounded-xl border border-slate-200 bg-white shadow-inner overflow-y-auto max-h-[50vh]">
                      {activeSession.report ? (
                        <div className="prose prose-slate prose-sm max-w-none prose-headings:font-bold prose-h1:text-indigo-950 prose-h2:text-indigo-900 prose-table:border prose-th:bg-slate-50 prose-th:p-2 prose-td:p-2">
                          <ReactMarkdown>{activeSession.report}</ReactMarkdown>
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
                          <p className="text-xs font-medium text-slate-600">Exploring citations, web context, and synthesizing deep analysis...</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Empty State */
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 mb-3">
                      <Search className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-700 mb-1">No Active Research Query</h3>
                    <p className="text-xs text-slate-500 max-w-sm mb-4">
                      Enter a topic or select a preset prompt to execute the Deep Research agent with multi-source synthesis.
                    </p>
                    <button
                      onClick={handleStartResearch}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium shadow-sm transition-colors cursor-pointer"
                    >
                      Run Sample Research
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
