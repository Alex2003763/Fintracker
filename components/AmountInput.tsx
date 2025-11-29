import React, { useRef, useEffect } from 'react';

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  id?: string;
  autoFocus?: boolean;
}

const AmountInput: React.FC<AmountInputProps> = ({
  value,
  onChange,
  error,
  placeholder = '0.00',
  id,
  autoFocus
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    // Allow only numbers and one decimal point
    if (/^\d*\.?\d{0,2}$/.test(newValue)) {
      onChange(newValue);
    }
  };

  return (
    <div className="relative">
      <div className="relative flex items-center justify-center">
        <span className="text-4xl font-bold text-[rgb(var(--color-text-muted-rgb))] mr-1">$</span>
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="decimal"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={`w-full bg-transparent text-center text-5xl font-bold outline-none placeholder-[rgb(var(--color-text-muted-rgb))]/30 ${
            error ? 'text-red-500' : 'text-[rgb(var(--color-text-rgb))]'
          }`}
          style={{ maxWidth: '100%' }}
        />
      </div>
      {error && (
        <p className="text-red-500 text-sm text-center mt-2">{error}</p>
      )}
    </div>
  );
};

export default AmountInput;