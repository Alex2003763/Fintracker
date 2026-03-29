import React, { memo } from 'react';
import { CATEGORY_ICON_MAP } from '../constants';

interface CategoryIconProps {
  category: string;
  emoji?: string;
  /** Extra Tailwind classes added on top of size classes — NOT for sizing */
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

// ─── Size tokens ──────────────────────────────────────────────────────────────
// wh        → Tailwind w/h
// emojiPx   → font-size for emoji span (fits inside container with 10% padding)
// letterPx  → font-size for letter avatar (≈55% of container)
type SizeKey = NonNullable<CategoryIconProps['size']>;
const SIZE: Record<SizeKey, { wh: string; emojiPx: string; letterPx: string }> = {
  xs: { wh: 'w-5 h-5',    emojiPx: '0.85rem', letterPx: '0.58rem' },
  sm: { wh: 'w-6 h-6',    emojiPx: '1rem',    letterPx: '0.65rem' },
  md: { wh: 'w-8 h-8',    emojiPx: '1.25rem', letterPx: '0.78rem' },
  lg: { wh: 'w-10 h-10',  emojiPx: '1.5rem',  letterPx: '0.9rem'  },
  xl: { wh: 'w-12 h-12',  emojiPx: '1.8rem',  letterPx: '1.05rem' },
};

// ─── Deterministic fallback palette ──────────────────────────────────────────
// 8 muted hues — same category always gets same color, no random flicker.
// Uses bg/text pairs optimised for both light and dark surfaces.
const FALLBACK_PALETTES = [
  { bg: 'rgba(99,102,241,0.13)',  color: '#6366f1' },  // indigo
  { bg: 'rgba(16,185,129,0.13)', color: '#059669' },  // emerald
  { bg: 'rgba(245,158,11,0.13)', color: '#d97706' },  // amber
  { bg: 'rgba(239,68,68,0.13)',  color: '#dc2626' },  // red
  { bg: 'rgba(59,130,246,0.13)', color: '#2563eb' },  // blue
  { bg: 'rgba(168,85,247,0.13)', color: '#9333ea' },  // purple
  { bg: 'rgba(236,72,153,0.13)', color: '#db2777' },  // pink
  { bg: 'rgba(20,184,166,0.13)', color: '#0d9488' },  // teal
] as const;

/** djb2-lite hash — O(n) on category length, negligible cost */
const hashStr = (s: string): number => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return Math.abs(h) % FALLBACK_PALETTES.length;
};

// Cross-platform emoji font stack (Apple → Windows → Linux → fallback)
const EMOJI_FONTS =
  '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","EmojiOne Color","Android Emoji",sans-serif';

// ─── Component ────────────────────────────────────────────────────────────────
const CategoryIcon: React.FC<CategoryIconProps> = memo(({
  category,
  emoji,
  className = '',
  size = 'sm',          // ← sensible default; no more className-as-size fallback
}) => {
  const s = SIZE[size];

  // ── Branch 1: Custom emoji ────────────────────────────────────────────────
  if (emoji) {
    return (
      <span
        className={`flex items-center justify-center flex-shrink-0 select-none leading-none ${s.wh} ${className}`}
        role="img"
        aria-label={category}
        style={{ fontSize: s.emojiPx, fontFamily: EMOJI_FONTS }}
      >
        {emoji}
      </span>
    );
  }

  // ── Branch 2: Mapped SVG icon ─────────────────────────────────────────────
  const IconComponent = category ? CATEGORY_ICON_MAP[category] : undefined;
  if (typeof IconComponent === 'function') {
    return (
      <IconComponent
        className={`flex-shrink-0 ${s.wh} ${className}`}
        aria-label={category}
      />
    );
  }

  // ── Branch 3: Letter avatar — deterministic colour per category ───────────
  const letter   = category?.trim()[0]?.toUpperCase() ?? '?';
  const palette  = FALLBACK_PALETTES[hashStr(category ?? '')];

  return (
    <span
      className={`
        flex items-center justify-center flex-shrink-0 select-none
        rounded-full font-semibold tracking-wide
        ${s.wh} ${className}
      `}
      role="img"
      aria-label={category || 'Unknown category'}
      style={{
        fontSize:   s.letterPx,
        background: palette.bg,
        color:      palette.color,
      }}
    >
      {letter}
    </span>
  );
});

CategoryIcon.displayName = 'CategoryIcon';
export default CategoryIcon;