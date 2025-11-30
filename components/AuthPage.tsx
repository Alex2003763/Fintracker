import React, { useState, useEffect } from 'react';
import { FinanceFlowIcon } from './icons';
import { User } from '../types';
import { generateSalt, deriveKey, encryptData, decryptData } from '../utils/formatters';
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
    try {
      const userString = localStorage.getItem('financeFlowUser');
      if (userString) {
        const parsedUser = JSON.parse(userString);
        if (parsedUser.salt && parsedUser.passwordCheck) {
            setStoredUser(parsedUser);
            setUsername(parsedUser.username);
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
  }, []);

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
        
        localStorage.removeItem('financeFlowTransactions');
        localStorage.removeItem('financeFlowGoals');
        localStorage.removeItem('financeFlowBills');
        localStorage.removeItem('financeFlowNotifications');

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
          <FinanceFlowIcon className="h-16 w-16 mb-4" />
          <h2 className="text-3xl font-bold">FinanceFlow</h2>
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
                  <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus className={inputClasses} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-sm text-[rgb(var(--color-text-muted-rgb))]">
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {error && <p className="text-sm text-red-500 text-left pt-1">{error}</p>}
                <button
                  type="submit"
                  className="w-full mt-4 py-3 px-4 bg-[rgb(var(--color-primary-rgb))] text-[rgb(var(--color-primary-text-rgb))] font-semibold rounded-lg shadow-md hover:bg-[rgb(var(--color-primary-hover-rgb))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] focus:ring-offset-2 transition-colors"
                >
                  Sign In
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;