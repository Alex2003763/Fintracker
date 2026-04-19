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
  showSkeleton?: boolean;
}

const SkeletonBlock: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = '', style }) => (
  <div
    className={`rounded-lg overflow-hidden relative ${className}`}
    style={{ background: 'rgba(var(--color-card-muted-rgb, 128 128 128), 0.25)', ...style }}
  >
    <div
      style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(90deg, transparent 0%, rgba(var(--color-text-rgb, 255 255 255), 0.08) 50%, transparent 100%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 1.6s ease-in-out infinite',
      }}
    />
  </div>
);

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message, showSkeleton = true }) => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [showSkeletonUI, setShowSkeletonUI] = useState(false);

  useEffect(() => {
    if (!message) {
      const intervalId = setInterval(() => {
        setMessageIndex((prev) => (prev + 1) % messages.length);
      }, 2000);
      return () => clearInterval(intervalId);
    }
  }, [message]);

  useEffect(() => {
    if (showSkeleton) {
      const t = setTimeout(() => setShowSkeletonUI(true), 400);
      return () => clearTimeout(t);
    }
  }, [showSkeleton]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: 'rgb(var(--color-bg-rgb, 243 244 246))' }}
    >
      <style>{`
        @keyframes skeleton-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes brand-fade-in {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes progress-indeterminate {
          0% { left: -40%; width: 40%; }
          60% { left: 100%; width: 40%; }
          100% { left: 100%; width: 0%; }
        }
        .loading-brand { animation: brand-fade-in 0.5s ease-out forwards; }
      `}</style>

      {/* Top progress bar */}
      <div
        className="w-full h-0.5 relative overflow-hidden"
        style={{ background: 'rgba(var(--color-text-rgb, 128 128 128), 0.1)' }}
      >
        <div
          className="absolute h-full rounded-full"
          style={{
            background: 'rgb(var(--color-primary-rgb, 37 99 235))',
            animation: 'progress-indeterminate 1.8s ease-in-out infinite',
          }}
        />
      </div>

      {showSkeletonUI ? (
        /* Skeleton Dashboard UI */
        <div className="flex-1 overflow-hidden p-4 md:p-6 flex flex-col gap-4">
          {/* Header skeleton */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FinTrackIcon
                className="h-8 w-8"
                style={{ color: 'rgb(var(--color-primary-rgb, 37 99 235))', opacity: 0.6 }}
              />
              <SkeletonBlock className="h-6 w-28" />
            </div>
            <div className="flex gap-2">
              <SkeletonBlock className="h-8 w-8 rounded-full" />
              <SkeletonBlock className="h-8 w-8 rounded-full" />
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="rounded-xl p-4 flex flex-col gap-2"
                style={{ background: 'rgba(var(--color-card-muted-rgb, 128 128 128), 0.15)' }}
              >
                <SkeletonBlock className="h-3 w-20" />
                <SkeletonBlock className="h-7 w-28" />
                <SkeletonBlock className="h-3 w-16" />
              </div>
            ))}
          </div>

          {/* Main chart + sidebar */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              className="md:col-span-2 rounded-xl p-4 flex flex-col gap-3"
              style={{ background: 'rgba(var(--color-card-muted-rgb, 128 128 128), 0.15)' }}
            >
              <SkeletonBlock className="h-4 w-32" />
              <div className="flex-1 flex items-end gap-2 pt-4" style={{ minHeight: 160 }}>
                {[60, 80, 50, 90, 70, 85, 65].map((h, i) => (
                  <SkeletonBlock key={i} className="flex-1 rounded" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
            <div
              className="rounded-xl p-4 flex flex-col gap-3"
              style={{ background: 'rgba(var(--color-card-muted-rgb, 128 128 128), 0.15)' }}
            >
              <SkeletonBlock className="h-4 w-24" />
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <SkeletonBlock className="h-8 w-8 rounded-full flex-shrink-0" />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <SkeletonBlock className="h-3 w-full" />
                    <SkeletonBlock className="h-2 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Initial brand splash */
        <div className="flex-1 flex flex-col items-center justify-center gap-4 loading-brand">
          <FinTrackIcon
            className="h-16 w-16"
            style={{ color: 'rgb(var(--color-primary-rgb, 37 99 235))' }}
          />
          <p
            className="text-base font-semibold"
            style={{ color: 'rgb(var(--color-text-muted-rgb, 107 114 128))' }}
          >
            {message || messages[messageIndex]}
          </p>
        </div>
      )}
    </div>
  );
};

export default LoadingScreen;
