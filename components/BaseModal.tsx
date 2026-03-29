import React, { useEffect, useRef, useCallback, memo, useState } from 'react';
import { createPortal } from 'react-dom';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  variant?: 'default' | 'sidebar' | 'sheet';
  animation?: 'slide-up' | 'scale' | 'fade';
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  disableContentPadding?: boolean;
  footer?: React.ReactNode;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
const SIZE_CLASSES: Record<string, string> = {
  sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl', full: 'max-w-full',
};

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let lockCount = 0;
const lockScroll = () => { 
  if (lockCount++ === 0) {
    document.body.style.overflow = 'hidden';
  }
};
const unlockScroll = () => { 
  lockCount = 0;
  document.body.style.overflow = '';
};

// ─── Liquid Glass CSS ────────────────────────────────────────────────────────
const LIQUID_GLASS_CSS = `
  @keyframes lg-backdrop-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes lg-backdrop-out {
    from { opacity: 1; }
    to   { opacity: 0; }
  }

  /* Slide up from bottom of screen */
  @keyframes lg-slide-up-in {
    0%   { opacity: 0;   transform: translateY(100vh); }
    55%  { opacity: 1;   transform: translateY(-8px) scale(1.008); }
    75%  { transform: translateY(4px) scale(0.998); }
    100% { opacity: 1;   transform: translateY(0) scale(1); }
  }
  @keyframes lg-slide-up-out {
    0%   { opacity: 1; transform: translateY(0) scale(1); }
    100% { opacity: 0; transform: translateY(100vh); }
  }

  @keyframes lg-scale-in {
    0%   { opacity: 0; transform: scale(0.88); filter: blur(4px); }
    60%  { opacity: 1; transform: scale(1.03); filter: blur(0); }
    80%  { transform: scale(0.99); }
    100% { opacity: 1; transform: scale(1); }
  }
  @keyframes lg-scale-out {
    0%   { opacity: 1; transform: scale(1); filter: blur(0); }
    100% { opacity: 0; transform: scale(0.90); filter: blur(3px); }
  }

  @keyframes lg-fade-in {
    from { opacity: 0; filter: blur(6px); }
    to   { opacity: 1; filter: blur(0); }
  }
  @keyframes lg-fade-out {
    from { opacity: 1; filter: blur(0); }
    to   { opacity: 0; filter: blur(4px); }
  }

  @keyframes lg-sidebar-in {
    0%   { opacity: 0; transform: translateX(100%) scale(0.98); }
    60%  { transform: translateX(-4px) scale(1.002); }
    100% { opacity: 1; transform: translateX(0) scale(1); }
  }
  @keyframes lg-sidebar-out {
    from { opacity: 1; transform: translateX(0); }
    to   { opacity: 0; transform: translateX(100%); }
  }

  @keyframes lg-header-in {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes lg-content-in {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes lg-handle-pulse {
    0%, 100% { opacity: 0.4; transform: scaleX(1); }
    50%      { opacity: 0.7; transform: scaleX(1.15); }
  }

  /* ── Backdrop ── */
  .lg-backdrop {
    position: absolute;
    inset: 0;
    z-index: -1;
    backdrop-filter: blur(20px) saturate(1.4);
    -webkit-backdrop-filter: blur(20px) saturate(1.4);
  }
  .lg-backdrop-enter { animation: lg-backdrop-in  0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
  .lg-backdrop-exit  { animation: lg-backdrop-out 0.25s cubic-bezier(0.4, 0, 1, 1)   forwards; }

  /* ── Panel ── */
  .lg-panel {
    background: rgba(255, 255, 255, 0.14);
    backdrop-filter: saturate(200%) blur(48px) brightness(1.06);
    -webkit-backdrop-filter: saturate(200%) blur(48px) brightness(1.06);
    border: 1px solid rgba(255, 255, 255, 0.26);
    box-shadow:
      0 2px 0 0 rgba(255,255,255,0.4) inset,
      0 -1px 0 0 rgba(255,255,255,0.06) inset,
      1px 0 0 0 rgba(255,255,255,0.12) inset,
      -1px 0 0 0 rgba(255,255,255,0.12) inset,
      0 40px 100px rgba(0,0,0,0.22),
      0 12px 32px rgba(0,0,0,0.14),
      0 4px 8px rgba(0,0,0,0.08);
    will-change: transform, opacity;
  }

  :root.theme-dark-slate .lg-panel,
  :root.theme-dark-green .lg-panel,
  :root.theme-dark-crimson .lg-panel,
  .dark .lg-panel {
    background: rgba(22, 22, 30, 0.62);
    border-color: rgba(255, 255, 255, 0.10);
    box-shadow:
      0 2px 0 0 rgba(255,255,255,0.14) inset,
      0 -1px 0 0 rgba(255,255,255,0.04) inset,
      1px 0 0 0 rgba(255,255,255,0.06) inset,
      -1px 0 0 0 rgba(255,255,255,0.06) inset,
      0 40px 100px rgba(0,0,0,0.55),
      0 12px 32px rgba(0,0,0,0.35),
      0 4px 8px rgba(0,0,0,0.2);
  }

  /* ── Animation variants ── */
  .lg-anim-slide-up-enter { animation: lg-slide-up-in  0.52s cubic-bezier(0.34, 1.28, 0.64, 1) forwards; }
  .lg-anim-slide-up-exit  { animation: lg-slide-up-out 0.28s cubic-bezier(0.4, 0, 1, 1)         forwards; }
  .lg-anim-scale-enter    { animation: lg-scale-in     0.45s cubic-bezier(0.34, 1.28, 0.64, 1) forwards; }
  .lg-anim-scale-exit     { animation: lg-scale-out    0.22s cubic-bezier(0.4, 0, 1, 1)         forwards; }
  .lg-anim-fade-enter     { animation: lg-fade-in      0.3s  ease                               forwards; }
  .lg-anim-fade-exit      { animation: lg-fade-out     0.2s  ease                               forwards; }
  .lg-anim-sidebar-enter  { animation: lg-sidebar-in   0.45s cubic-bezier(0.34, 1.1, 0.64, 1)  forwards; }
  .lg-anim-sidebar-exit   { animation: lg-sidebar-out  0.25s cubic-bezier(0.4, 0, 1, 1)         forwards; }

  /* ── Stagger children ── */
  .lg-header-animate  { animation: lg-header-in  0.35s cubic-bezier(0.4, 0, 0.2, 1) 0.12s both; }
  .lg-content-animate { animation: lg-content-in 0.4s  cubic-bezier(0.4, 0, 0.2, 1) 0.18s both; }

  /* ── Specular top edge ── */
  .lg-specular {
    position: absolute;
    top: 0;
    left: 8%;
    right: 8%;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255,255,255,0.7) 35%,
      rgba(255,255,255,0.7) 65%,
      transparent
    );
    pointer-events: none;
    opacity: 0.8;
    z-index: 1;
  }

  /* ── Dividers ── */
  .lg-divider {
    height: 1px;
    flex-shrink: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255,255,255,0.22) 25%,
      rgba(255,255,255,0.22) 75%,
      transparent 100%
    );
  }
  :root.theme-dark-slate .lg-divider,
  :root.theme-dark-green .lg-divider,
  :root.theme-dark-crimson .lg-divider,
  .dark .lg-divider {
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255,255,255,0.09) 25%,
      rgba(255,255,255,0.09) 75%,
      transparent 100%
    );
  }

  /* ── Drag handle ── */
  .lg-handle {
    width: 36px;
    height: 4px;
    border-radius: 2px;
    background: rgba(150,150,160,0.38);
    margin: 10px auto 4px;
    flex-shrink: 0;
    animation: lg-handle-pulse 2.5s ease-in-out 0.6s infinite;
  }

  /* ── Close button ── */
  .lg-close {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(120,120,135,0.20);
    border: 1px solid rgba(255,255,255,0.18);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    color: rgba(120,120,135,0.9);
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.15s, border-color 0.15s, transform 0.15s, color 0.15s;
    touch-action: manipulation;
  }
  .lg-close:hover {
    background: rgba(120,120,135,0.32);
    border-color: rgba(255,255,255,0.28);
    color: rgba(60,60,70,0.9);
  }
  :root.theme-dark-slate .lg-close:hover,
  :root.theme-dark-green .lg-close:hover,
  :root.theme-dark-crimson .lg-close:hover,
  .dark .lg-close:hover {
    color: rgba(220,220,230,0.9);
  }
  .lg-close:active { transform: scale(0.88); }

  /* ── Scrollbar ── */
  .lg-body::-webkit-scrollbar { width: 3px; }
  .lg-body::-webkit-scrollbar-track { background: transparent; }
  .lg-body::-webkit-scrollbar-thumb {
    background: rgba(120,120,130,0.28);
    border-radius: 3px;
  }

  /* ── Reduced motion ── */
  @media (prefers-reduced-motion: reduce) {
    .lg-backdrop-enter, .lg-backdrop-exit,
    .lg-anim-slide-up-enter, .lg-anim-slide-up-exit,
    .lg-anim-scale-enter, .lg-anim-scale-exit,
    .lg-anim-fade-enter, .lg-anim-fade-exit,
    .lg-anim-sidebar-enter, .lg-anim-sidebar-exit,
    .lg-header-animate, .lg-content-animate,
    .lg-handle { animation: none; }
  }
`;

let cssInjected = false;
const injectCSS = () => {
  if (cssInjected || typeof document === 'undefined') return;
  const el = document.createElement('style');
  el.id = 'liquid-glass-modal';
  el.textContent = LIQUID_GLASS_CSS;
  document.head.appendChild(el);
  cssInjected = true;
};

export const BaseModal: React.FC<BaseModalProps> = memo(({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'md',
  variant = 'default',
  animation = 'slide-up',
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className = '',
  disableContentPadding = false,
  footer,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
}) => {
  injectCSS();

  const modalRef  = useRef<HTMLDivElement>(null);
  const prevFocus = useRef<HTMLElement | null>(null);
  const [phase, setPhase] = useState<'closed' | 'entering' | 'open' | 'exiting'>('closed');

  const isSidebar  = variant === 'sidebar';
  const isSheet    = variant === 'sheet';
  const isMobile   = typeof window !== 'undefined' && window.innerWidth < 640;
  const showHandle = isSheet || isMobile;

  // ── Phase management ──────────────────────────────────────────────────────
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    if (isOpen) {
      if (phase === 'closed') {
        prevFocus.current = document.activeElement as HTMLElement;
        lockScroll();
        setPhase('entering');
        timeoutId = setTimeout(() => setPhase('open'), 520);
      }
    } else if (phase !== 'closed' && phase !== 'exiting') {
      setPhase('exiting');
      timeoutId = setTimeout(() => {
        setPhase('closed');
        unlockScroll();
        prevFocus.current?.focus();
      }, 300);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isOpen, phase]);

  // Handle sudden unmount
  useEffect(() => {
    return () => {
      if (phase !== 'closed') {
        unlockScroll();
      }
    };
  }, [phase]);

  // ── Focus first focusable element ─────────────────────────────────────────
  useEffect(() => {
    if (phase === 'entering') {
      const firstInput = modalRef.current?.querySelector<HTMLElement>('input:not([type="hidden"]), select, textarea');
      const firstAny = modalRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      const target = firstInput || firstAny;
      if (target) {
        target.focus();
      }
    }
  }, [phase]);

  // ── Keyboard trap ─────────────────────────────────────────────────────────
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) { console.log('[BaseModal] Escape key pressed, triggering onClose'); onClose(); return; }
    if (e.key === 'Tab' && modalRef.current) {
      const all = Array.from(modalRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!all.length) return;
      const [first, last] = [all[0], all[all.length - 1]];
      if (e.shiftKey && document.activeElement === first)      { last.focus();  e.preventDefault(); }
      else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
    }
  }, [closeOnEscape, onClose]);

  useEffect(() => {
    if (phase === 'closed') return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [phase, handleKeyDown]);

  if (phase === 'closed') return null;

  // ── Animation class ───────────────────────────────────────────────────────
  const isExiting = phase === 'exiting';
  const getAnimClass = () => {
    if (prefersReducedMotion) return '';
    if (isSidebar)
      return isExiting ? 'lg-anim-sidebar-exit' : 'lg-anim-sidebar-enter';
    const key = animation === 'scale' ? 'scale' : animation === 'fade' ? 'fade' : 'slide-up';
    return isExiting ? `lg-anim-${key}-exit` : `lg-anim-${key}-enter`;
  };

  // ── Layout ────────────────────────────────────────────────────────────────
  const wrapperAlign = isSidebar
    ? 'items-stretch justify-end p-0'
    : 'items-end justify-center p-0';

  const panelShape = isSidebar
    ? 'h-full max-h-screen w-full max-w-xs rounded-none'
    : `w-full ${SIZE_CLASSES[size]} mx-0 sm:mx-auto rounded-t-[32px]`;

  return createPortal(
    <div
      className={`fixed inset-0 z-[9999] flex overscroll-contain ${wrapperAlign} ${className}`}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel ?? title}
      aria-describedby={ariaDescribedBy}
      onClick={closeOnBackdropClick ? (e) => {
        if (e.target === e.currentTarget) {
          console.log('[BaseModal] Backdrop clicked, trigger onClose');
          onClose();
        }
      } : undefined}
    >
      {/* ── Backdrop ───────────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className={`lg-backdrop ${isExiting ? 'lg-backdrop-exit' : 'lg-backdrop-enter'}`}
        style={{
          background: 'radial-gradient(ellipse at 50% 100%, rgba(0,0,0,0.28), rgba(0,0,0,0.52))',
        }}
      />

      {/* ── Panel ──────────────────────────────────────────────────────── */}
      <div
        ref={modalRef}
        className={`
          lg-panel relative flex flex-col
          max-h-[95vh] sm:max-h-[90vh]
          overflow-hidden
          ${panelShape}
          ${getAnimClass()}
        `}
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* Specular top edge */}
        <div className="lg-specular" aria-hidden="true" />

        {/* Drag handle */}
        {showHandle && <div className="lg-handle" />}

        {/* ── Header ─────────────────────────────────────────────────── */}
        {(title || showCloseButton) && (
          <>
            <div className={`
              lg-header-animate flex items-start justify-between gap-3 px-5
              ${showHandle ? 'pt-1 pb-3' : 'pt-5 pb-3'}
            `}>
              {title ? (
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-bold tracking-tight leading-snug text-[rgb(var(--color-text-rgb))]">
                    {title}
                  </h2>
                  {subtitle && (
                    <p className="mt-0.5 text-xs leading-snug text-[rgb(var(--color-text-muted-rgb))] opacity-75">
                      {subtitle}
                    </p>
                  )}
                </div>
              ) : <div className="flex-1" />}

              {showCloseButton && (
                <button onClick={onClose} className="lg-close" aria-label="Close">
                  <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.8}
                      d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <div className="lg-divider" />
          </>
        )}

        {/* ── Content ────────────────────────────────────────────────── */}
        <div className={`
          lg-body lg-content-animate flex-1 overflow-y-auto overscroll-contain
          ${disableContentPadding ? '' : 'px-5 py-4'}
        `}>
          {children}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        {footer && (
          <>
            <div className="lg-divider" />
            <div className="lg-header-animate px-5 py-4 flex-shrink-0">
              {footer}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
});

BaseModal.displayName = 'BaseModal';
export default BaseModal;