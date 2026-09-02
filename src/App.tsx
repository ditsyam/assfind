import React, { useState, useEffect } from 'react';
import { UserProfile } from './types';
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

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isThreatModalOpen, setIsThreatModalOpen] = useState(false);
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
            entryCount={0}
          />
          <Dashboard key={`${currentUser.uid}_${newEntryTriggerKey}`} user={currentUser} />
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
    </div>
  );
}
