import React, { useState, memo, useMemo, useCallback } from 'react';

interface FormFieldProps {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = memo(({
  label,
  htmlFor,
  children,
  required = false,
  error,
  hint,
  className = '',
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-[rgb(var(--color-text-muted-rgb))]"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-sm text-red-500 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-sm text-[rgb(var(--color-text-muted-rgb))]">
          {hint}
        </p>
      )}
    </div>
  );
});

FormField.displayName = 'FormField';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = memo(({
  error,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}) => {
  const baseClasses = `
    block w-full px-3 py-2.5
    bg-[rgb(var(--color-card-muted-rgb))]
    border rounded-lg
    text-[rgb(var(--color-text-rgb))]
    placeholder:text-[rgb(var(--color-text-muted-rgb))]
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] focus:border-transparent
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const errorClasses = error
    ? 'border-red-300 focus:ring-red-500'
    : 'border-[rgb(var(--color-border-rgb))]';

  return (
    <div className="relative">
      {leftIcon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {leftIcon}
        </div>
      )}
      <input
        className={`${baseClasses} ${errorClasses} ${leftIcon ? 'pl-10' : ''} ${rightIcon ? 'pr-10' : ''} ${className}`}
        {...props}
      />
      {rightIcon && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          {rightIcon}
        </div>
      )}
    </div>
  );
});

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const Select: React.FC<SelectProps> = memo(({
  error,
  className = '',
  children,
  ...props
}) => {
  const baseClasses = `
    block w-full px-3 py-2.5
    bg-[rgb(var(--color-card-muted-rgb))]
    border rounded-lg
    text-[rgb(var(--color-text-rgb))]
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] focus:border-transparent
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const errorClasses = error
    ? 'border-red-300 focus:ring-red-500'
    : 'border-[rgb(var(--color-border-rgb))]';

  return (
    <select
      className={`${baseClasses} ${errorClasses} ${className}`}
      {...props}
    >
      {children}
    </select>
  );
});

Select.displayName = 'Select';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = memo(({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = useMemo(() =>
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
    []
  );

  const variantClasses = useMemo(() => ({
    primary: 'bg-[rgb(var(--color-primary-rgb))] text-[rgb(var(--color-primary-text-rgb))] hover:bg-[rgb(var(--color-primary-hover-rgb))] focus:ring-[rgb(var(--color-primary-rgb))]',
    secondary: 'bg-[rgb(var(--color-card-muted-rgb))] text-[rgb(var(--color-text-rgb))] hover:bg-[rgb(var(--color-border-rgb))] focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'text-[rgb(var(--color-text-rgb))] hover:bg-[rgb(var(--color-card-muted-rgb))] focus:ring-gray-500',
  }), []);

  const sizeClasses = useMemo(() => ({
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  }), []);

  const buttonClasses = useMemo(() =>
    `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`,
    [baseClasses, variantClasses, variant, sizeClasses, size, className]
  );

  const isDisabled = useMemo(() => disabled || loading, [disabled, loading]);

  return (
    <button
      className={buttonClasses}
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
});

Button.displayName = 'Button';

export interface ToggleButtonProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const ToggleButton: React.FC<ToggleButtonProps> = memo(({
  options,
  value,
  onChange,
  className = '',
}) => {
  const handleOptionClick = useCallback((optionValue: string) => {
    onChange(optionValue);
  }, [onChange]);

  return (
    <div className={`flex rounded-lg border p-1 bg-[rgb(var(--color-bg-rgb))] border-[rgb(var(--color-border-rgb))] ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => handleOptionClick(option.value)}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-semibold transition-all duration-200 ${
            value === option.value
              ? 'bg-[rgb(var(--color-card-rgb))] shadow-sm text-[rgb(var(--color-text-rgb))]'
              : 'text-[rgb(var(--color-text-muted-rgb))] hover:text-[rgb(var(--color-text-rgb))]'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
});

ToggleButton.displayName = 'ToggleButton';

export interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="flex items-center space-x-3 text-[rgb(var(--color-text-muted-rgb))]">
        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span>{message}</span>
      </div>
    </div>
  );
};

export interface SuccessStateProps {
  message?: string;
  onContinue?: () => void;
}

export const SuccessState: React.FC<SuccessStateProps> = ({
  message = 'Success!',
  onContinue
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-in zoom-in duration-300">
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-[rgb(var(--color-text-rgb))] mb-2">
        {message}
      </h3>
      {onContinue && (
        <Button onClick={onContinue} className="mt-4">
          Continue
        </Button>
      )}
    </div>
  );
};

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = '',
}) => {
  return (
    <div className={`border-b border-[rgb(var(--color-border-rgb))] bg-[rgb(var(--color-card-rgb))] ${className}`}>
      <div className="flex space-x-0">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`group relative flex items-center px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-out ${
              activeTab === tab.id
                ? 'border-b-2 border-[rgb(var(--color-primary-rgb))] text-[rgb(var(--color-primary-rgb))] bg-gradient-to-b from-[rgb(var(--color-primary-rgb))]/5 to-transparent'
                : 'border-b-2 border-transparent text-[rgb(var(--color-text-muted-rgb))] hover:text-[rgb(var(--color-text-rgb))] hover:bg-[rgb(var(--color-card-muted-rgb))]'
            }`}
          >
            {/* Icon with refined styling */}
            {tab.icon && (
              <span className={`mr-1.5 transition-all duration-200 ${
                activeTab === tab.id
                  ? 'text-[rgb(var(--color-primary-rgb))]'
                  : 'text-[rgb(var(--color-text-muted-rgb))] group-hover:text-[rgb(var(--color-text-rgb))]'
              }`}>
                {React.cloneElement(tab.icon, {
                  className: `h-3.5 w-3.5 ${activeTab === tab.id ? 'text-[rgb(var(--color-primary-rgb))]' : 'text-[rgb(var(--color-text-muted-rgb))] group-hover:text-[rgb(var(--color-text-rgb))]'}`,
                })}
              </span>
            )}

            {/* Label with refined typography */}
            <span className={`relative ${activeTab === tab.id ? 'font-semibold' : 'font-medium'}`}>
              {tab.label}
            </span>

            {/* Enhanced badge styling with better contrast */}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className={`ml-1.5 px-2 py-0.5 text-xs font-bold rounded-full transition-all duration-200 shadow-sm ${
                activeTab === tab.id
                  ? 'bg-white text-[rgb(var(--color-primary-rgb))] border border-[rgb(var(--color-primary-rgb))]'
                  : 'bg-[rgb(var(--color-primary-rgb))] text-white'
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};