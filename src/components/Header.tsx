import React from 'react';
import { Sparkles, Shield, LogOut, Plus, User as UserIcon, BookOpen } from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  user: UserProfile | null;
  onSignOut: () => void;
  onNewEntry: () => void;
  onOpenThreatModal: () => void;
  entryCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onSignOut,
  onNewEntry,
  onOpenThreatModal,
  entryCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-900 tracking-tight">ReflectAI</span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                Gemini 3.6 Flash
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden md:block">
              Private Journaling & Cognitive Reflection
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Security & Threat Model Indicator */}
          <button
            id="view-threat-model-header-btn"
            onClick={onOpenThreatModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-100 border border-slate-200 transition-colors"
            title="View Threat Model & Security Posture"
          >
            <Shield className="w-4 h-4 text-emerald-500" />
            <span className="hidden md:inline">Security Posture</span>
          </button>

          {user && (
            <>
              {/* New Reflection Button */}
              <button
                id="header-new-reflection-btn"
                onClick={onNewEntry}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>New Reflection</span>
              </button>

              {/* User Profile Pill */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User profile'}
                    className="w-8 h-8 rounded-full border border-slate-300 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[140px]">
                    {user.displayName || (user.isAnonymous ? 'Guest User' : 'Authenticated')}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate max-w-[140px]">
                    {user.email || `${entryCount} saved ${entryCount === 1 ? 'entry' : 'entries'}`}
                  </p>
                </div>

                {/* Sign Out */}
                <button
                  id="signout-button"
                  onClick={onSignOut}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
