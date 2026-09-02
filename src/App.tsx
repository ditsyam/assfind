import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole, JournalEntry } from './types';
import {
  subscribeToAuthChanges,
  signInWithGoogle,
  signInGuest,
  logOut,
} from './lib/firebase';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { ThreatModelModal } from './components/ThreatModelModal';
import { AdminDashboard } from './components/AdminDashboard';
import { NotificationsModal } from './components/NotificationsModal';
import { WorkspaceModal } from './components/WorkspaceModal';
import { DeepResearchModal } from './components/DeepResearchModal';
import { ScholarModal } from './components/ScholarModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isThreatModalOpen, setIsThreatModalOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [isDeepResearchModalOpen, setIsDeepResearchModalOpen] = useState(false);
  const [isScholarModalOpen, setIsScholarModalOpen] = useState(false);
  const [activeEntryForWorkspace, setActiveEntryForWorkspace] = useState<JournalEntry | null>(null);
  const [newEntryTriggerKey, setNewEntryTriggerKey] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      setCurrentUser(user);
      setIsAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    const user = await signInWithGoogle();
    setCurrentUser(user);
  };

  const handleGuestSignIn = async () => {
    const user = await signInGuest();
    setCurrentUser(user);
  };

  const handleSignOut = async () => {
    await logOut();
    setCurrentUser(null);
  };

  const handleHeaderNewEntry = () => {
    setNewEntryTriggerKey((k) => k + 1);
  };

  const handleSwitchUserRole = (newRole: UserRole) => {
    if (currentUser) {
      setCurrentUser({
        ...currentUser,
        role: newRole,
      });
    }
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
          <p className="text-xs font-medium text-slate-500">Initializing ReflectAI...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {currentUser ? (
        <>
          <Header
            user={currentUser}
            onSignOut={handleSignOut}
            onNewEntry={handleHeaderNewEntry}
            onOpenThreatModal={() => setIsThreatModalOpen(true)}
            onOpenAdminDashboard={() => setIsAdminDashboardOpen(true)}
            onOpenNotificationsModal={() => setIsNotificationsModalOpen(true)}
            onOpenWorkspaceModal={() => setIsWorkspaceModalOpen(true)}
            onOpenDeepResearch={() => setIsDeepResearchModalOpen(true)}
            onOpenScholarModal={() => setIsScholarModalOpen(true)}
            entryCount={0}
          />
          <Dashboard
            key={`${currentUser.uid}_${newEntryTriggerKey}`}
            user={currentUser}
            onOpenNotifications={() => setIsNotificationsModalOpen(true)}
            onOpenWorkspace={() => setIsWorkspaceModalOpen(true)}
            onOpenDeepResearch={() => setIsDeepResearchModalOpen(true)}
            onOpenScholar={() => setIsScholarModalOpen(true)}
            onActiveEntryChange={(entry) => setActiveEntryForWorkspace(entry)}
          />
        </>
      ) : (
        <LandingPage
          onGoogleSignIn={handleGoogleSignIn}
          onGuestSignIn={handleGuestSignIn}
          onOpenThreatModal={() => setIsThreatModalOpen(true)}
        />
      )}

      {/* Security Architecture & Threat Model Modal */}
      <ThreatModelModal
        isOpen={isThreatModalOpen}
        onClose={() => setIsThreatModalOpen(false)}
      />

      {/* Admin & RBAC Governance Dashboard */}
      {currentUser && (
        <AdminDashboard
          isOpen={isAdminDashboardOpen}
          onClose={() => setIsAdminDashboardOpen(false)}
          currentUser={currentUser}
          onSwitchUserRole={handleSwitchUserRole}
        />
      )}

      {/* External Notifications & Webhooks Modal */}
      <NotificationsModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
      />

      {/* Google Workspace (Docs & Slides) Modal */}
      {currentUser && (
        <WorkspaceModal
          isOpen={isWorkspaceModalOpen}
          onClose={() => setIsWorkspaceModalOpen(false)}
          activeEntry={activeEntryForWorkspace}
          user={currentUser}
        />
      )}

      {/* Gemini Deep Research Agent Modal */}
      {currentUser && (
        <DeepResearchModal
          isOpen={isDeepResearchModalOpen}
          onClose={() => setIsDeepResearchModalOpen(false)}
          user={currentUser}
        />
      )}

      {/* Google Scholar Academic Index Modal */}
      {currentUser && (
        <ScholarModal
          isOpen={isScholarModalOpen}
          onClose={() => setIsScholarModalOpen(false)}
          user={currentUser}
        />
      )}
    </div>
  );
}

