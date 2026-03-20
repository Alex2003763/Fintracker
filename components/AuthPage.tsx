import React, { useState, useEffect } from 'react';
import { FinTrackIcon } from './icons';
import { User } from '../types';
import { generateSalt, deriveKey, encryptData, decryptData } from '../utils/formatters';
import { authenticateWebAuthn, getBiometricSession, isWebAuthnSupported } from '../utils/webauthn';
import LoadingScreen from './LoadingScreen';
import PasswordStrengthMeter from './PasswordStrengthMeter';
import Button from './Button';

interface AuthPageProps {
  onAuth: (user: User, sessionKey: CryptoKey) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onAuth }) => {
  const [storedUser, setStoredUser] = useState<User | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/)) strength++;
    if (password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;
    return Math.min(strength, 4);
  };

  useEffect(() => {
    const checkUserAndBiometrics = async () => {
        try {
            const userString = localStorage.getItem('fintrackUser');
            if (userString) {
                const parsedUser = JSON.parse(userString);
                if (parsedUser.salt && parsedUser.passwordCheck) {
                    setStoredUser(parsedUser);
                    setUsername(parsedUser.username);

                    // Check if biometrics are enabled and supported
                    if (isWebAuthnSupported() && parsedUser.biometricEnabled) {
                        setIsBiometricAvailable(true);
                        // Auto-trigger removed to prevent errors in some browsers/contexts
                        // User can click the button manually
                    }
                } else {
                    setIsSignUp(true);
                }
            } else {
                setIsSignUp(true);
            }
        } catch (e) {
            console.error("Failed to parse user from localStorage", e);
            setIsSignUp(true);
        } finally {
            setIsLoading(false);
        }
    };
    
    checkUserAndBiometrics();
  }, []);

  const handleBiometricAuth = async (userToAuth: User) => {
      if (isAuthenticating) return;
      setIsAuthenticating(true);
      setError('');
      
      try {
          const isAuthenticated = await authenticateWebAuthn(userToAuth.biometricCredentialId);
          if (isAuthenticated) {
              const sessionKey = await getBiometricSession();
              if (sessionKey) {
                  onAuth(userToAuth, sessionKey);
              } else {
                  setError('Biometric session expired. Please log in with password.');
                  setIsBiometricAvailable(false); // Force password fallback
              }
          }
          // If simply cancelled/failed, we just remain on screen for password entry
      } catch (e) {
          console.error('Biometric auth error', e);
          setError('Biometric authentication failed.');
      } finally {
          setIsAuthenticating(false);
      }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (username.length < 3) {
      setError('Username must be at least 3 characters long.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    try {
        const salt = generateSalt();
        const key = await deriveKey(password, salt);
        const passwordCheckEncrypted = await encryptData(JSON.stringify({ check: 'ok' }), key);

        const newUser: User = { 
            username, 
            salt, 
            passwordCheck: JSON.stringify(passwordCheckEncrypted), 
            avatar: '' 
        };
        
        localStorage.removeItem('fintrackTransactions');
        localStorage.removeItem('fintrackGoals');
        localStorage.removeItem('fintrackBills');
        localStorage.removeItem('fintrackNotifications');

        onAuth(newUser, key);
    } catch (err) {
        console.error(err);
        setError('Could not create account due to an encryption error. Please try again.');
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!storedUser) return;

    try {
        const key = await deriveKey(password, storedUser.salt);
        const decryptedCheck = await decryptData(JSON.parse(storedUser.passwordCheck), key);
        
        if (decryptedCheck && JSON.parse(decryptedCheck).check === 'ok') {
            onAuth(storedUser, key);
        } else {
            setError('Incorrect password. Please try again.');
        }
    } catch (err) {
        console.error(err);
        setError('Failed to sign in. Please check your password.');
    }
  };

  const inputClasses = "w-full px-4 py-3 rounded-lg bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] text-[rgb(var(--color-text-rgb))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] transition-colors";

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-[100dvh] bg-[rgb(var(--color-bg-rgb))] flex items-center justify-center p-4 transition-colors">
      <div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl w-full bg-[rgb(var(--color-card-rgb))] rounded-3xl shadow-xl overflow-hidden border border-[rgb(var(--color-border-rgb))] border-opacity-50">
        <div className="hidden md:flex flex-col justify-center p-12 bg-gradient-to-br from-[rgb(var(--color-primary-rgb))] to-[rgb(var(--color-primary-hover-rgb))] text-white">
          <FinTrackIcon className="h-20 w-20 mb-6 drop-shadow-md text-white" />
          <h2 className="text-4xl font-extrabold tracking-tight mb-4">FinTrack</h2>
          <p className="text-lg text-white/90 leading-relaxed font-medium">Take control of your finances with a clear, simple, and secure overview of your financial life.</p>
        </div>
        
        <div className="p-8 md:p-12 lg:p-14 flex flex-col justify-center">
          <div className="md:hidden flex flex-col items-center mb-8">
             <FinTrackIcon className="h-16 w-16 mb-4 text-[rgb(var(--color-primary-rgb))]" />
             <h2 className="text-3xl font-bold text-[rgb(var(--color-text-rgb))] tracking-tight">FinTrack</h2>
          </div>

          {isSignUp ? (
            <div className="animate-fade-in-up">
              <h1 className="text-3xl font-bold text-[rgb(var(--color-text-rgb))] mb-2 tracking-tight">Create Account</h1>
              <p className="text-[rgb(var(--color-text-muted-rgb))] mb-8 font-medium">Your data is secured locally on your device.</p>
              <form onSubmit={handleSignUp} className="space-y-5">
                <input type="text" placeholder="Username (min. 3 characters)" value={username} onChange={(e) => setUsername(e.target.value)} required className={inputClasses} />
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} placeholder="Password (min. 6 characters)" value={password} onChange={(e) => { setPassword(e.target.value); setPasswordStrength(calculatePasswordStrength(e.target.value)); }} required className={inputClasses} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-4 flex items-center text-sm font-medium text-[rgb(var(--color-text-muted-rgb))] hover:text-[rgb(var(--color-text-rgb))] transition-colors">
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {password.length > 0 && <PasswordStrengthMeter strength={passwordStrength} />}
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className={inputClasses} />
                </div>
                {error && <p className="text-sm text-red-500 font-medium py-1">{error}</p>}
                <Button type="submit" variant="primary" fullWidth size="lg" className="mt-2 text-base h-12 shadow-md">
                  Create Secure Account
                </Button>
              </form>
            </div>
          ) : (
            <div className="animate-fade-in-up">
              <h1 className="text-3xl font-bold text-[rgb(var(--color-text-rgb))] mb-2 tracking-tight">Welcome Back</h1>
              <p className="text-[rgb(var(--color-text-muted-rgb))] mb-8 font-medium">Sign in to securely access your data.</p>
              <form onSubmit={handleSignIn} className="space-y-5">
                <input type="text" value={username} disabled className="w-full px-4 py-3 rounded-lg bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] text-[rgb(var(--color-text-muted-rgb))] cursor-not-allowed focus:outline-none opacity-80" />
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} placeholder="Enter you password" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus={!isBiometricAvailable} className={inputClasses} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-4 flex items-center text-sm font-medium text-[rgb(var(--color-text-muted-rgb))] hover:text-[rgb(var(--color-text-rgb))] transition-colors">
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {error && <p className="text-sm text-red-500 font-medium py-1">{error}</p>}
                
                <div className="flex flex-col gap-4 mt-2">
                    <Button
                    type="submit"
                    disabled={isAuthenticating || !password}
                    variant="primary"
                    fullWidth
                    size="lg"
                    className="h-12 shadow-md"
                    >
                    Sign In
                    </Button>

                    {isBiometricAvailable && storedUser && (
                        <div className="relative flex items-center py-1">
                           <div className="flex-grow border-t border-[rgb(var(--color-border-rgb))]"></div>
                           <span className="flex-shrink-0 mx-4 text-[rgb(var(--color-text-muted-rgb))] text-xs font-semibold uppercase tracking-wider">or sign in with</span>
                           <div className="flex-grow border-t border-[rgb(var(--color-border-rgb))]"></div>
                        </div>
                    )}
                    
                    {isBiometricAvailable && storedUser && (
                        <Button
                            type="button"
                            onClick={() => handleBiometricAuth(storedUser)}
                            disabled={isAuthenticating}
                            variant="secondary"
                            fullWidth
                            size="lg"
                            className="h-12 bg-white/5 dark:bg-black/20 backdrop-blur-sm border border-[rgb(var(--color-border-rgb))]"
                        >
                            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                            </svg>
                            Use Biometrics
                        </Button>
                    )}
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;