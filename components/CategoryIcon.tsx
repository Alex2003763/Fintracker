import React from 'react';
import { CATEGORY_ICON_MAP } from '../constants';

interface CategoryIconProps {
  category: string;
  emoji?: string;
  className?: string;
}

const CategoryIcon: React.FC<CategoryIconProps> = ({ category, emoji, className = 'h-6 w-6' }) => {
  // If custom emoji is provided, display it
  if (emoji) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <span className="text-2xl leading-none" style={{ fontSize: '1.5rem' }}>
          {emoji}
        </span>
      </div>
    );
  }

  // Otherwise, use the default SVG icon
  const IconComponent = CATEGORY_ICON_MAP[category];
  
  if (IconComponent) {
    return <IconComponent className={className} />;
  }

  // Fallback icon if no mapping exists
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
};

export default CategoryIcon;