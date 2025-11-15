import React, { useState, useEffect } from 'react';
import { FinanceFlowIcon } from './icons';
import { User } from '../types';
import { generateSalt, deriveKey, encryptData, decryptData } from '../utils/formatters';
import LoadingScreen from './LoadingScreen';
import { TRANSACTION_CATEGORIES } from '../constants';

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

  useEffect(() => {
    let timeoutId: number;
    try {
      const userString = localStorage.getItem('financeFlowUser');
      if (userString) {
        const parsedUser = JSON.parse(userString);
        // Basic check for new user model. If old model (with password), force sign up.
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
        timeoutId = window.setTimeout(() => setIsLoading(false), 500); // Add a small delay for smoother transition
    }
    return () => clearTimeout(timeoutId);
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
            avatar: '',
            customCategories: {
                expense: { ...TRANSACTION_CATEGORIES.expense },
                income: { ...TRANSACTION_CATEGORIES.income }
            }
        };
        
        // Clear old unencrypted data if it exists
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

  const inputClasses = "w-full px-4 py-3 rounded-lg bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] text-[rgb(var(--color-text-rgb))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))]";

  const renderSignUp = () => (
    <>
      <h1 className="text-3xl font-bold text-[rgb(var(--color-text-rgb))] mb-2">Create Your Secure Account</h1>
      <p className="text-[rgb(var(--color-text-muted-rgb))] mb-8">Your data will be encrypted with your password.</p>
      <form onSubmit={handleSignUp} className="space-y-4">
        <input
          type="text"
          placeholder="Username (min. 3 characters)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className={inputClasses}
        />
        <input
          type="password"
          placeholder="Password (min. 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className={inputClasses}
        />
        <input
          type="password"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className={inputClasses}
        />
        {error && <p className="text-sm text-red-500 text-left pt-1">{error}</p>}
        <button
          type="submit"
          className="w-full mt-4 py-3 px-4 bg-[rgb(var(--color-primary-rgb))] text-[rgb(var(--color-primary-text-rgb))] font-semibold rounded-lg shadow-md hover:bg-[rgb(var(--color-primary-hover-rgb))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] focus:ring-offset-2 transition-colors"
        >
          Create Account
        </button>
      </form>
    </>
  );

  const renderSignIn = () => (
    <>
      <h1 className="text-3xl font-bold text-[rgb(var(--color-text-rgb))] mb-2">Welcome Back!</h1>
      <p className="text-[rgb(var(--color-text-muted-rgb))] mb-8">Sign in to decrypt your data.</p>
      <form onSubmit={handleSignIn} className="space-y-4">
         <input
              type="text"
              value={username}
              disabled
              className="w-full px-4 py-3 rounded-lg bg-[rgb(var(--color-card-muted-rgb))] border border-[rgb(var(--color-border-rgb))] text-[rgb(var(--color-text-muted-rgb))] cursor-not-allowed focus:outline-none"
          />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoFocus
          className={inputClasses}
        />
        {error && <p className="text-sm text-red-500 text-left pt-1">{error}</p>}
        <button
          type="submit"
          className="w-full mt-4 py-3 px-4 bg-[rgb(var(--color-primary-rgb))] text-[rgb(var(--color-primary-text-rgb))] font-semibold rounded-lg shadow-md hover:bg-[rgb(var(--color-primary-hover-rgb))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] focus:ring-offset-2 transition-colors"
        >
          Sign In
        </button>
      </form>
    </>
  );

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[rgb(var(--color-bg-rgb))] p-4 transition-colors">
      <div className="p-8 bg-[rgb(var(--color-card-rgb))] rounded-2xl shadow-lg max-w-sm w-full transition-colors animate-fade-in-up">
        <div className="flex justify-center mb-6">
          <FinanceFlowIcon className="h-12 w-12 text-green-500" />
        </div>
        {isSignUp ? renderSignUp() : renderSignIn()}
      </div>
    </div>
  );
};

export default AuthPage;