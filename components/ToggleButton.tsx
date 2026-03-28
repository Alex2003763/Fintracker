import React from 'react';

interface ToggleButtonProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const ToggleButton: React.FC<ToggleButtonProps> = ({
  checked,
  onChange,
  disabled = false,
  size = 'md'
}) => {
  const sizeConfig = {
    sm: { width: 60, height: 28, text: 'text-xs' },
    md: { width: 70, height: 32, text: 'text-sm' },
    lg: { width: 80, height: 36, text: 'text-base' }
  };

  const config = sizeConfig[size];

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) onChange();
      }}
      disabled={disabled}
      className={`
        relative inline-flex items-center justify-center rounded-lg font-medium
        transition-all duration-200 ease-in-out
        focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[rgb(var(--color-primary-rgb))]
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
        ${checked 
          ? 'bg-[rgb(var(--color-primary-rgb))] text-white' 
          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
        }
      `}
      style={{
        width: `${config.width}px`,
        height: `${config.height}px`,
      }}
      aria-pressed={checked}
    >
      <span className={`font-semibold ${config.text}`}>
        {checked ? 'ON' : 'OFF'}
      </span>
    </button>
  );
};

export default ToggleButton;
