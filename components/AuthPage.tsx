import React, { useState, useEffect } from 'react';
import { FinTrackIcon } from './icons';
import { User } from '../types';
import { generateSalt, deriveKey, encryptData, decryptData } from '../utils/formatters';
import { authenticateWebAuthn, getBiometricSession, isWebAuthnSupported } from '../utils/webauthn';
import LoadingScreen from './LoadingScreen';
import PasswordStrengthMeter from './PasswordStrengthMeter';

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
                        // Trigger biometric prompt automatically on load if available
                        handleBiometricAuth(parsedUser);
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
    <div className="min-h-screen bg-[rgb(var(--color-bg-rgb))] flex items-center justify-center p-4 transition-colors">
      <div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl w-full bg-[rgb(var(--color-card-rgb))] rounded-2xl shadow-2xl overflow-hidden">
        <div className="hidden md:flex flex-col justify-center p-12 bg-green-600 text-white bg-opacity-90">
          <FinTrackIcon className="h-16 w-16 mb-4" />
          <h2 className="text-3xl font-bold">FinTrack</h2>
          <p className="mt-2">Take control of your finances with a clear, simple, and secure overview of your financial life.</p>
        </div>
        
        <div className="p-8 md:p-12">
          {isSignUp ? (
            <>
              <h1 className="text-3xl font-bold text-[rgb(var(--color-text-rgb))] mb-2">Create Your Secure Account</h1>
              <p className="text-[rgb(var(--color-text-muted-rgb))] mb-8">Your data will be encrypted with your password.</p>
              <form onSubmit={handleSignUp} className="space-y-4">
                <input type="text" placeholder="Username (min. 3 characters)" value={username} onChange={(e) => setUsername(e.target.value)} required className={inputClasses} />
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} placeholder="Password (min. 6 characters)" value={password} onChange={(e) => { setPassword(e.target.value); setPasswordStrength(calculatePasswordStrength(e.target.value)); }} required className={inputClasses} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-sm text-[rgb(var(--color-text-muted-rgb))]">
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {password.length > 0 && <PasswordStrengthMeter strength={passwordStrength} />}
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className={inputClasses} />
                </div>
                {error && <p className="text-sm text-red-500 text-left pt-1">{error}</p>}
                <button type="submit" className="w-full mt-4 py-3 px-4 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors">
                  Create Account
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-[rgb(var(--color-text-rgb))] mb-2">Welcome Back!</h1>
              <p className="text-[rgb(var(--color-text-muted-rgb))] mb-8">Sign in to decrypt your data.</p>
              <form onSubmit={handleSignIn} className="space-y-4">
                <input type="text" value={username} disabled className="w-full px-4 py-3 rounded-lg bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] text-[rgb(var(--color-text-muted-rgb))] cursor-not-allowed focus:outline-none" />
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus={!isBiometricAvailable} className={inputClasses} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-sm text-[rgb(var(--color-text-muted-rgb))]">
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {error && <p className="text-sm text-red-500 text-left pt-1">{error}</p>}
                
                <div className="flex flex-col gap-3 mt-4">
                    <button
                    type="submit"
                    disabled={isAuthenticating}
                    className="w-full py-3 px-4 bg-[rgb(var(--color-primary-rgb))] text-[rgb(var(--color-primary-text-rgb))] font-semibold rounded-lg shadow-md hover:bg-[rgb(var(--color-primary-hover-rgb))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] focus:ring-offset-2 transition-colors disabled:opacity-70"
                    >
                    Sign In
                    </button>

                    {isBiometricAvailable && storedUser && (
                        <button
                            type="button"
                            onClick={() => handleBiometricAuth(storedUser)}
                            disabled={isAuthenticating}
                            className="w-full py-3 px-4 bg-[rgb(var(--color-card-muted-rgb))] text-[rgb(var(--color-text-rgb))] font-semibold rounded-lg border border-[rgb(var(--color-border-rgb))] hover:bg-[rgb(var(--color-border-rgb))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] transition-colors flex justify-center items-center gap-2"
                        >
                            <span>👆</span> Authenticate with Biometrics
                        </button>
                    )}
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;