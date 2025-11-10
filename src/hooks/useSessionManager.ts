import { useEffect, useState, useCallback } from 'react';
import { sessionManager, SessionState } from '@/lib/session/sessionManager';

export const useSessionManager = () => {
  const [sessionState, setSessionState] = useState<SessionState>(() => sessionManager.getState());
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Update session state periodically
    const interval = setInterval(() => {
      setSessionState(sessionManager.getState());
    }, 1000);

    // Mark as initialized after first check
    setIsInitialized(true);

    return () => clearInterval(interval);
  }, []);

  const extendSession = useCallback(() => {
    sessionManager.extendSession();
    setSessionState(sessionManager.getState());
  }, []);

  const logout = useCallback(() => {
    sessionManager.logout();
  }, []);

  const getSessionInfo = useCallback(() => {
    const state = sessionManager.getState();
    return {
      isActive: state.isActive,
      timeRemaining: state.timeRemaining,
      timeRemainingFormatted: formatTimeRemaining(state.timeRemaining),
      warningShown: state.warningShown,
      sessionId: state.sessionId,
      lastActivity: state.lastActivity,
    };
  }, []);

  return {
    sessionState,
    isInitialized,
    isActive: sessionState.isActive,
    timeRemaining: sessionState.timeRemaining,
    timeRemainingFormatted: formatTimeRemaining(sessionState.timeRemaining),
    warningShown: sessionState.warningShown,
    extendSession,
    logout,
    getSessionInfo,
  };
};

function formatTimeRemaining(milliseconds: number): string {
  if (milliseconds <= 0) return '00:00';

  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
