import React from 'react';
import { useTheme } from './ThemeContext';

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
}

const IconPicker: React.FC<IconPickerProps> = ({ value, onChange }) => {
  const { theme } = useTheme();

  return (
    <div>
      <label htmlFor="category-icon" className="block text-sm font-medium mb-1" style={{ color: 'rgb(var(--color-text-muted-rgb))' }}>
        Icon (Emoji)
      </label>
      <input
        type="text"
        id="category-icon"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-2 border rounded"
        style={{ backgroundColor: 'rgb(var(--color-bg-rgb))', borderColor: 'rgb(var(--color-border-rgb))', color: 'rgb(var(--color-text-rgb))' }}
        placeholder="e.g., 🛒"
        maxLength={2}
      />
    </div>
  );
};

export default IconPicker;