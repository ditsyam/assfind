import React from 'react';
import { Sparkles, Shield, LogOut, Plus, User as UserIcon, Bell, ShieldAlert, FileText, Database, GraduationCap } from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  user: UserProfile | null;
  onSignOut: () => void;
  onNewEntry: () => void;
  onOpenThreatModal: () => void;
  onOpenAdminDashboard: () => void;
  onOpenNotificationsModal: () => void;
  onOpenWorkspaceModal?: () => void;
  onOpenDeepResearch?: () => void;
  onOpenScholarModal?: () => void;
  entryCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onSignOut,
  onNewEntry,
  onOpenThreatModal,
  onOpenAdminDashboard,
  onOpenNotificationsModal,
  onOpenWorkspaceModal,
  onOpenDeepResearch,
  onOpenScholarModal,
  entryCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-900 tracking-tight">ReflectAI</span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                Gemini 3.6 Flash
              </span>
              <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                <Database className="w-3 h-3 text-emerald-600" />
                Firestore Live
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden md:block">
              Private Journaling &amp; Cognitive Reflection
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Scholar Academic Index Button */}
          {onOpenScholarModal && (
            <button
              id="scholar-header-btn"
              onClick={onOpenScholarModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
              title="Google Scholar Academic Index (scholarly + pandas)"
            >
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">Scholar Index</span>
            </button>
          )}

          {/* Deep Research Agent Button */}
          {onOpenDeepResearch && (
            <button
              id="deep-research-header-btn"
              onClick={onOpenDeepResearch}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors cursor-pointer"
              title="Gemini Deep Research Agent (Interactions API)"
            >
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="hidden sm:inline">Deep Research</span>
            </button>
          )}

          {/* Google Workspace (Docs & Slides) Button */}
          {onOpenWorkspaceModal && (
            <button
              id="workspace-header-btn"
              onClick={onOpenWorkspaceModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
              title="Google Docs & Slides Integration"
            >
              <FileText className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">Docs &amp; Slides</span>
            </button>
          )}

          {/* External Notifications Integration */}
          <button
            id="notifications-header-btn"
            onClick={onOpenNotificationsModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-100 border border-slate-200 transition-colors"
            title="External Notifications (Slack, Discord, Email)"
          >
            <Bell className="w-4 h-4 text-indigo-500" />
            <span className="hidden lg:inline">Webhooks</span>
          </button>

          {/* Admin RBAC Dashboard */}
          <button
            id="admin-dashboard-header-btn"
            onClick={onOpenAdminDashboard}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-100 border border-slate-200 transition-colors"
            title="Admin Dashboard & Role Governance"
          >
            <ShieldAlert className="w-4 h-4 text-purple-600" />
            <span className="hidden sm:inline">Admin RBAC</span>
          </button>

          {/* Security & Threat Model Indicator */}
          <button
            id="view-threat-model-header-btn"
            onClick={onOpenThreatModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-100 border border-slate-200 transition-colors"
            title="View Threat Model & Security Posture"
          >
            <Shield className="w-4 h-4 text-emerald-500" />
            <span className="hidden xl:inline">Threat Model</span>
          </button>

          {user && (
            <>
              {/* New Reflection Button */}
              <button
                id="header-new-reflection-btn"
                onClick={onNewEntry}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Reflection</span>
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
                <div className="hidden md:block text-left">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[120px]">
                      {user.displayName || (user.isAnonymous ? 'Guest User' : 'User')}
                    </p>
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded">
                      {user.role || 'member'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 truncate max-w-[120px]">
                    {user.email || `${entryCount} entries`}
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
