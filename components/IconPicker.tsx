import React from 'react';
import { useTheme } from './ThemeContext';

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
}

const COMMON_EMOJIS = [
    '🛒', '🍽️', '☕', '🍔', '👕', '🏠', '🚗', '⛽',
    '💪', '🎬', '💰', '✈️', '🎁', '🎓'
];

const IconPicker: React.FC<IconPickerProps> = ({ value, onChange }) => {
  return (
    <div>
      <label htmlFor="category-icon" className="block text-sm font-medium mb-3 text-[rgb(var(--color-text-muted-rgb))]">
        Icon (Emoji)
      </label>
      
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 flex items-center justify-center bg-[rgb(var(--color-card-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-xl text-2xl shadow-sm">
            {value || '❓'}
        </div>
        <input
            type="text"
            id="category-icon"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 p-3 bg-[rgb(var(--color-bg-rgb))] border border-[rgb(var(--color-border-rgb))] rounded-xl text-[rgb(var(--color-text-rgb))] focus:ring-2 focus:ring-[rgb(var(--color-primary-rgb))] focus:border-transparent outline-none transition-all placeholder-[rgb(var(--color-text-muted-rgb))]"
            placeholder="Type an emoji..."
            maxLength={2}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-[rgb(var(--color-text-muted-rgb))] mb-2">
            Suggested
        </label>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {COMMON_EMOJIS.map(emoji => (
                <button
                    key={emoji}
                    type="button"
                    onClick={() => onChange(emoji)}
                    className={`flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg hover:bg-[rgb(var(--color-card-rgb))] transition-colors text-lg ${value === emoji ? 'bg-[rgb(var(--color-primary-rgb))] text-white hover:bg-[rgb(var(--color-primary-hover-rgb))] shadow-md' : 'bg-[rgba(var(--color-card-rgb),0.5)] border border-[rgba(var(--color-border-rgb),0.5)]'}`}
                >
                    {emoji}
                </button>
            ))}
        </div>
      </div>
    </div>
  );
};

export default IconPicker;