import { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { saveBiometricSession } from '../utils/webauthn';

export function useAuth(SESSION_TIMEOUT_MS: number) {
  const [user, setUser] = useState<User | null>(null);
  const [sessionKey, setSessionKey] = useState<CryptoKey | null>(null);
  const lastActivity = useRef(Date.now());

  // Biometric session save
  useEffect(() => {
    const handleSaveBiometricSession = async () => {
      if (sessionKey) {
        await saveBiometricSession(sessionKey);
      }
    };
    window.addEventListener('saveBiometricSession', handleSaveBiometricSession);
    return () => window.removeEventListener('saveBiometricSession', handleSaveBiometricSession);
  }, [sessionKey]);

  // Session timeout
  useEffect(() => {
    if (!sessionKey) return;
    const handleActivity = () => {
      lastActivity.current = Date.now();
    };
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keypress', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastActivity.current > SESSION_TIMEOUT_MS) {
        setUser(null);
        setSessionKey(null);
        // TODO: 觸發 toast/modal 通知 session 過期
      }
    }, 10000);
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      clearInterval(interval);
    };
  }, [sessionKey, SESSION_TIMEOUT_MS]);

  return {
    user,
    setUser,
    sessionKey,
    setSessionKey,
    lastActivity
  };
}
