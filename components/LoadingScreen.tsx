import React, { useState, useEffect } from 'react';
import { FinTrackIcon } from './icons';

const messages = [
  "Loading Secure Session...",
  "Encrypting your data...",
  "Getting things ready...",
  "Almost there...",
];

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message }) => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!message) {
      const intervalId = setInterval(() => {
        setMessageIndex((prevIndex) => (prevIndex + 1) % messages.length);
      }, 2000);
      return () => clearInterval(intervalId);
    }
  }, [message]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[rgb(var(--color-bg-rgb))] z-50 transition-colors">
      <style>
        {`
          @keyframes subtle-pulse {
            0%, 100% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.05);
              opacity: 0.7;
            }
          }
          .subtle-pulsing-icon {
            animation: subtle-pulse 2s ease-in-out infinite;
          }
        `}
      </style>
      <div className="relative flex items-center justify-center">
        <FinTrackIcon className="h-16 w-16 text-green-500 subtle-pulsing-icon" />
      </div>
      <p className="mt-4 text-lg font-semibold text-[rgb(var(--color-text-muted-rgb))]">
        {message || messages[messageIndex]}
      </p>
    </div>
  );
};

export default LoadingScreen;