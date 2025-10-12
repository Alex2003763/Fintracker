import React from 'react';
import { FinanceFlowIcon } from './icons';

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[rgb(var(--color-bg-rgb))] z-50 transition-colors">
      <div className="relative flex items-center justify-center">
        <div className="absolute h-24 w-24 rounded-full bg-green-500/20 animate-ping"></div>
        <FinanceFlowIcon className="h-16 w-16 text-green-500 pulsating-icon" />
      </div>
      <p className="mt-4 text-lg font-semibold text-[rgb(var(--color-text-muted-rgb))]">
        Loading Secure Session...
      </p>
    </div>
  );
};

export default LoadingScreen;