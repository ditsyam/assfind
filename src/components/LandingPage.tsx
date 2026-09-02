import React, { useState } from 'react';
import { Sparkles, Shield, Lock, BookOpen, Brain, History, ArrowRight, CheckCircle2 } from 'lucide-react';

interface LandingPageProps {
  onGoogleSignIn: () => Promise<void>;
  onGuestSignIn: () => Promise<void>;
  onOpenThreatModal: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGoogleSignIn,
  onGuestSignIn,
  onOpenThreatModal,
}) => {
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingGuest, setLoadingGuest] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleGoogleClick = async () => {
    try {
      setLoadingGoogle(true);
      setAuthError(null);
      await onGoogleSignIn();
    } catch (err: any) {
      setAuthError(err?.message || 'Google Sign-In was cancelled or failed.');
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleGuestClick = async () => {
    try {
      setLoadingGuest(true);
      setAuthError(null);
      await onGuestSignIn();
    } catch (err: any) {
      setAuthError(err?.message || 'Guest Sign-In failed.');
    } finally {
      setLoadingGuest(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Bar */}
      <nav className="border-b border-slate-200 bg-white/90 backdrop-blur-xs py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg text-slate-900 tracking-tight">ReflectAI</span>
          </div>

          <button
            id="landing-threat-model-btn"
            onClick={onOpenThreatModal}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>Security Architecture</span>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-4 py-12 sm:py-16 text-center">
        {/* Security / Privacy Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-6">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span>Strict User Data Isolation & Cloud Firestore Backed</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Your Private Journal,{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
            Enriched with Gemini AI
          </span>
        </h1>

        <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Write multi-turn journal reflections, receive intelligent cognitive insights, and synthesize actionable next steps. Every thought is securely isolated to your authenticated account.
        </p>

        {/* Authentication Box */}
        <div className="mt-8 max-w-md mx-auto bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-base font-bold text-slate-800 mb-2">Sign in to Access Your Private Journal</h2>
          <p className="text-xs text-slate-500 mb-6">
            We use Firebase Authentication with Federated Google Sign-In. No passwords stored.
          </p>

          {authError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl text-left">
              {authError}
            </div>
          )}

          <div className="space-y-3">
            {/* Google Sign In Button */}
            <button
              id="google-signin-btn"
              onClick={handleGoogleClick}
              disabled={loadingGoogle || loadingGuest}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-sm font-semibold shadow-xs transition-all disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.7s.1-2 .4-2.7L1.6 6.4C.6 8.3 0 10.1 0 12s.6 3.7 1.6 5.6l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.3-6.7-5.3L1.6 16C3.5 19.8 7.4 23 12 23z"
                />
              </svg>
              <span>{loadingGoogle ? 'Authenticating...' : 'Sign in with Google'}</span>
            </button>

            {/* Guest / Instant Preview Button */}
            <button
              id="guest-signin-btn"
              onClick={handleGuestClick}
              disabled={loadingGoogle || loadingGuest}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <span>{loadingGuest ? 'Starting Session...' : 'Continue as Guest (Instant Preview)'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>Authenticated entries are isolated to your unique UID.</span>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-16 grid sm:grid-cols-3 gap-6 text-left">
          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <Brain className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Multi-Turn Reflections</h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Engage in multi-turn dialogues with Gemini 3.6 Flash with automated fallback ladders for maximum reliability.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Firestore Isolation</h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Rules strictly restrict document reads and writes to authenticated document owners (`request.auth.uid == userId`).
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center mb-3">
              <History className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Instant Synthesizer</h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Extract mood metrics, key learnings, and actionable steps with a single click to track personal growth.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 px-6 text-center text-xs text-slate-500">
        <p>ReflectAI • Built with Google GenAI SDK, Cloud Firestore & Firebase Auth</p>
      </footer>
    </div>
  );
};
