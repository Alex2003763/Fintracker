import React, { memo } from 'react';
import { CATEGORY_ICON_MAP } from '../constants';

interface CategoryIconProps {
  category: string;
  emoji?: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

// Size map — use size prop OR fall back to className
const SIZE_MAP = {
  xs: { container: 'h-5 w-5',  font: '0.95rem' },
  sm: { container: 'h-6 w-6',  font: '1.1rem'  },
  md: { container: 'h-8 w-8',  font: '1.35rem' },
  lg: { container: 'h-10 w-10', font: '1.6rem'  },
};

const CategoryIcon: React.FC<CategoryIconProps> = memo(({
  category,
  emoji,
  className,
  size,
}) => {
  const sizeStyle = size ? SIZE_MAP[size] : null;
  const containerClass = sizeStyle ? sizeStyle.container : (className ?? 'h-6 w-6');

  // ── Custom emoji ──────────────────────────────────────────────────────────
  if (emoji) {
    return (
      <span
        className={`flex items-center justify-center flex-shrink-0 select-none leading-none ${containerClass}`}
        role="img"
        aria-label={category}
        style={sizeStyle ? { fontSize: sizeStyle.font } : undefined}
      >
        {emoji}
      </span>
    );
  }

  // ── Mapped SVG icon ───────────────────────────────────────────────────────
  const IconComponent = CATEGORY_ICON_MAP[category];
  if (IconComponent) {
    return (
      <IconComponent
        className={`flex-shrink-0 ${containerClass}`}
        aria-label={category}
      />
    );
  }

  // ── Fallback: first letter avatar ─────────────────────────────────────────
  const letter = category?.trim()?.[0]?.toUpperCase() ?? '?';
  return (
    <span
      className={`flex items-center justify-center flex-shrink-0 rounded-full font-bold select-none
        bg-[rgb(var(--color-border-rgb))]/40 text-[rgb(var(--color-text-muted-rgb))]
        ${containerClass}`}
      role="img"
      aria-label={category || 'Unknown category'}
      style={sizeStyle
        ? { fontSize: `calc(${sizeStyle.font} * 0.55)` }
        : { fontSize: '0.6em' }
      }
    >
      {letter}
    </span>
  );
});

CategoryIcon.displayName = 'CategoryIcon';
export default CategoryIcon;