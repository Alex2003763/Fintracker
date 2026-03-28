import React, { useRef, useEffect, useCallback, useState } from 'react';

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  id?: string;
  autoFocus?: boolean;
  currencySymbol?: string;
  maxValue?: number;
  label?: string;
}

const AmountInput: React.FC<AmountInputProps> = ({
  value,
  onChange,
  error,
  placeholder = '0',
  id,
  autoFocus,
  currencySymbol = '$',
  maxValue,
  label,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (autoFocus) setTimeout(() => inputRef.current?.focus(), 180);
  }, [autoFocus]);

  useEffect(() => {
    if (error) { setShake(true); setTimeout(() => setShake(false), 500); }
  }, [error]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (!/^\d*\.?\d{0,2}$/.test(raw)) return;
    if (maxValue !== undefined && parseFloat(raw) > maxValue) return;
    onChange(raw);
  }, [onChange, maxValue]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    if (!value) return;
    if (!value.includes('.'))     onChange(value + '.00');
    else if (value.endsWith('.')) onChange(value + '00');
    else if (/\.\d$/.test(value)) onChange(value + '0');
  }, [value, onChange]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }, []);

  const handleClear = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    onChange('');
    inputRef.current?.focus();
  }, [onChange]);

  const quickAmounts = [10, 50, 100, 500];
  const handleQuick = (amount: number) => {
    onChange(amount.toFixed(2));
    inputRef.current?.focus();
    if (navigator.vibrate) navigator.vibrate(8);
  };

  const isEmpty   = !value;
  const hasError  = !!error;
  const showClear = !!value && isFocused;

  const getSize = () => {
    const len = (value || placeholder).length;
    if (len <= 4)  return { num: 'text-[52px]', sym: 'text-[26px]', pb: 'pb-1.5' };
    if (len <= 7)  return { num: 'text-[40px]', sym: 'text-[20px]', pb: 'pb-1' };
    if (len <= 10) return { num: 'text-[32px]', sym: 'text-[16px]', pb: 'pb-0.5' };
    return           { num: 'text-[26px]', sym: 'text-[13px]', pb: 'pb-0' };
  };
  const sz = getSize();

  return (
    <div className={`flex flex-col w-full gap-2.5 ${shake ? 'animate-shake' : ''}`}>

      {/* ── Glass container ── */}
      <div
        className={`
          relative w-full overflow-hidden rounded-[24px]
          cursor-text transition-all duration-300
          ${hasError ? 'ring-1 ring-red-500/50' : isFocused ? 'ring-1 ring-[rgb(var(--color-primary-rgb))]/40' : ''}
        `}
        style={{
          background: isFocused
            ? 'linear-gradient(160deg, rgba(var(--color-card-muted-rgb),0.9) 0%, rgba(var(--color-card-muted-rgb),0.6) 100%)'
            : 'linear-gradient(160deg, rgba(var(--color-card-muted-rgb),0.7) 0%, rgba(var(--color-card-muted-rgb),0.4) 100%)',
          backdropFilter: 'blur(32px) saturate(1.5)',
          WebkitBackdropFilter: 'blur(32px) saturate(1.5)',
          boxShadow: isFocused
            ? `0 0 0 1px rgba(255,255,255,0.10),
               0 12px 40px rgba(0,0,0,0.18),
               inset 0 2px 0 rgba(255,255,255,0.14),
               inset 0 -1px 0 rgba(0,0,0,0.08)`
            : `0 0 0 1px rgba(255,255,255,0.06),
               0 4px 16px rgba(0,0,0,0.10),
               inset 0 1.5px 0 rgba(255,255,255,0.10)`,
          transition: 'all 0.3s ease',
        }}
        onClick={() => inputRef.current?.focus()}
      >
        {/* Top specular stripe */}
        <div
          aria-hidden
          className="absolute top-0 inset-x-0 h-px pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent 5%, rgba(255,255,255,0.5) 35%, rgba(255,255,255,0.5) 65%, transparent 95%)',
            opacity: 0.65,
          }}
        />

        {/* Subtle inner glow when focused */}
        {isFocused && (
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none rounded-[24px]"
            style={{
              background: 'radial-gradient(ellipse at 50% 0%, rgba(var(--color-primary-rgb),0.08) 0%, transparent 70%)',
            }}
          />
        )}

        {/* ── Amount display ── */}
        <div className="flex items-baseline justify-center gap-1 px-5 pt-8 pb-6">
          {/* Currency symbol */}
          <span className={`
            font-bold leading-none select-none flex-shrink-0
            transition-all duration-200 ${sz.sym} ${sz.pb}
            ${hasError
              ? 'text-red-400'
              : isEmpty
                ? 'text-[rgb(var(--color-text-muted-rgb))]/20'
                : 'text-[rgb(var(--color-text-muted-rgb))]/55'
            }
          `}>
            {currencySymbol}
          </span>

          {/* Input */}
          <input
            ref={inputRef}
            id={id}
            type="text"
            inputMode="decimal"
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            aria-label={label ?? 'Amount'}
            aria-invalid={hasError}
            aria-describedby={hasError ? `${id}-error` : undefined}
            className={`
              bg-transparent text-center font-bold leading-none outline-none
              transition-all duration-200
              placeholder-[rgb(var(--color-text-muted-rgb))]/18
              ${sz.num}
              ${hasError ? 'text-red-500' : 'text-[rgb(var(--color-text-rgb))]'}
            `}
            style={{
              width: Math.max((value || placeholder).length, 2) + 'ch',
              minWidth: '2ch',
              maxWidth: 'calc(100% - 64px)',
            }}
          />

          {/* Clear button */}
          <div className={`
            ${sz.pb} transition-all duration-150
            ${showClear ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'}
          `}>
            <button
              type="button"
              onMouseDown={handleClear}
              className="w-5 h-5 rounded-full bg-[rgb(var(--color-text-muted-rgb))]/15 flex items-center justify-center hover:bg-[rgb(var(--color-text-muted-rgb))]/28 active:scale-85 transition-all touch-manipulation"
              aria-label="Clear"
            >
              <svg width="8" height="8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Focus underline */}
        <div className="relative h-px mx-8 mb-1">
          <div className="absolute inset-0 rounded-full bg-[rgb(var(--color-border-rgb))]/20" />
          <div className={`
            absolute inset-y-0 left-1/2 -translate-x-1/2 rounded-full
            transition-all duration-350 ease-out
            ${hasError
              ? 'w-full bg-red-500'
              : isFocused
                ? 'w-full bg-[rgb(var(--color-primary-rgb))]/70'
                : 'w-0 bg-transparent'
            }
          `} />
        </div>

        {/* ── Quick chips INSIDE bottom of box ── */}
        <div className="flex gap-2 px-4 pt-3 pb-4">
          {quickAmounts.map(amount => {
            const isActive = value === amount.toFixed(2);
            return (
              <button
                key={amount}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); handleQuick(amount); }}
                className={`
                  flex-1 py-2 rounded-xl text-xs font-semibold
                  transition-all duration-150 active:scale-95 touch-manipulation
                  ${isActive
                    ? 'bg-[rgb(var(--color-primary-rgb))] text-white shadow-sm shadow-[rgb(var(--color-primary-rgb))]/30'
                    : 'bg-[rgb(var(--color-background-rgb))]/30 text-[rgb(var(--color-text-muted-rgb))]/70 hover:bg-[rgb(var(--color-background-rgb))]/50 hover:text-[rgb(var(--color-text-muted-rgb))]'
                  }
                `}
              >
                {currencySymbol}{amount}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Error ── */}
      <div className={`
        flex items-center gap-1.5 text-xs font-medium text-red-400 px-1
        transition-all duration-200 overflow-hidden
        ${hasError ? 'max-h-8 opacity-100' : 'max-h-0 opacity-0'}
      `}>
        {hasError && (
          <>
            <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="flex-shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <span id={`${id}-error`} role="alert">{error}</span>
          </>
        )}
      </div>

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          15%      { transform: translateX(-5px); }
          30%      { transform: translateX(4px); }
          45%      { transform: translateX(-3px); }
          60%      { transform: translateX(2px); }
          75%      { transform: translateX(-1px); }
        }
        .animate-shake { animation: shake 0.45s cubic-bezier(0.36,0.07,0.19,0.97); }
      `}</style>
    </div>
  );
};

export default AmountInput;