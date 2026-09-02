import React from 'react';
import { ShieldCheck, Lock, AlertTriangle, Database, Cpu, X, ExternalLink } from 'lucide-react';
import { ThreatZoneAnalysis } from '../types';

interface ThreatModelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const THREAT_ZONES: ThreatZoneAnalysis[] = [
  {
    zone: '1. Input Surfaces',
    threatDescription: 'Untrusted user journal input, prompt injection, and oversized payloads.',
    mitigationStrategy: 'Strict top-level express.json() payload limits (10MB), null-safe destructuring, and explicit system instruction separation from user contents.',
    status: 'enforced',
  },
  {
    zone: '2. Planning & Reasoning',
    threatDescription: 'Model hallucination, service unavailability, rate limit exhaustion (429/503).',
    mitigationStrategy: 'Automated 4-tier Gemini model fallback ladder (gemini-3.6-flash → gemini-3.1-flash-lite → gemini-flash-latest → gemini-3.7-flash) with structured JSON schemas.',
    status: 'enforced',
  },
  {
    zone: '3. Tool Execution',
    threatDescription: 'Dynamic code execution risks, SSRF, or unintended privilege escalation.',
    mitigationStrategy: 'Zero dynamic code evaluation; strictly sandboxed server endpoints with parameterized GenAI client invocation and no direct OS shell exposure.',
    status: 'enforced',
  },
  {
    zone: '4. Memory & State',
    threatDescription: 'Cross-user data leakage, unauthorized read/write access to private reflections.',
    mitigationStrategy: 'Owner-bound Firestore Security Rules (match /users/{userId}/journals/{journalId} if request.auth.uid == userId) and client-side sanitization stripping undefined fields.',
    status: 'enforced',
  },
  {
    zone: '5. Inter-System & Secrets',
    threatDescription: 'API key leakage to client browsers, hardcoded credentials in source control.',
    mitigationStrategy: 'Server-side API proxying for GEMINI_API_KEY with Secret Manager integration pattern; zero client-side exposure of secret AI credentials.',
    status: 'enforced',
  },
];

export const ThreatModelModal: React.FC<ThreatModelModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div 
        id="threat-model-modal"
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="font-semibold text-lg tracking-tight">Agentic Threat Modeling & Security Architecture</h2>
          </div>
          <button
            id="close-threat-modal-btn"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
            <Lock className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-900">Zero Insecure Defaults & Data Isolation Policy</p>
              <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                All journal entries and Gemini conversations are isolated to individual authenticated user IDs via Firestore Security Rules. Gemini API keys are safeguarded entirely on the Express backend service.
              </p>
            </div>
          </div>

          {/* Threat Summary Table */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              5-Zone Threat Summary Matrix (OWASP & LLM Guidelines)
            </h3>
            
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Threat Zone</th>
                    <th className="py-3 px-4">Potential Risk</th>
                    <th className="py-3 px-4">Enforced Countermeasure</th>
                    <th className="py-3 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {THREAT_ZONES.map((zone, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">{zone.zone}</td>
                      <td className="py-3 px-4">{zone.threatDescription}</td>
                      <td className="py-3 px-4 text-slate-700 font-mono text-[11px] leading-relaxed">{zone.mitigationStrategy}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-800">
                          {zone.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Firestore Security Rules Preview */}
          <div className="bg-slate-900 rounded-xl p-4 text-slate-200 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-slate-400">
                <Database className="w-4 h-4 text-sky-400" />
                <span>firestore.rules Enforcement</span>
              </div>
              <span className="text-[10px] bg-slate-800 text-sky-300 px-2 py-0.5 rounded">Owner-Bound</span>
            </div>
            <pre className="text-slate-300 overflow-x-auto">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/journals/{journalId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            id="dismiss-threat-modal-btn"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
