import React, { useEffect, useRef, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  variant?: 'default' | 'sidebar';
  animation?: 'slide-up' | 'scale' | 'fade' | 'bounce';
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  disableContentPadding?: boolean;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

export const BaseModal: React.FC<BaseModalProps> = memo(({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  variant = 'default',
  animation = 'slide-up',
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className = '',
  disableContentPadding = false,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const hasOpenedRef = useRef(false);

  // Size configurations - mobile optimized
   const sizeClasses = {
     sm: 'max-w-sm mx-4',
     md: 'max-w-md mx-4',
     lg: 'max-w-lg mx-4',
     xl: 'max-w-xl mx-4',
     full: 'max-w-full mx-2 sm:mx-4',
   };

  const variantClasses = {
    default: '',
    sidebar: 'h-full max-h-screen rounded-l-2xl rounded-r-none',
  };

  // Detect if user prefers reduced motion and mobile device
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.innerWidth < 768;

  // Animation configurations with mobile optimizations
  const animationClasses = {
    'slide-up': {
      backdrop: `modal-fade-in`,
      modal: `animate-slide-in-from-bottom`,
      modalBase: `transform transition-all ease-out`,
      modalEnter: 'opacity-100 translate-y-0 scale-100',
      modalExit: 'opacity-0 translate-y-full scale-95',
    },
    'scale': {
      backdrop: `modal-fade-in`,
      modal: `animate-zoom-in`,
      modalBase: `transform transition-all ease-out`,
      modalEnter: 'opacity-100 scale-100',
      modalExit: 'opacity-0 scale-90',
    },
    'fade': {
      backdrop: `modal-fade-in`,
      modal: `modal-fade-in`,
      modalBase: `transform transition-all ease-out`,
      modalEnter: 'opacity-100',
      modalExit: 'opacity-0',
    },
    'bounce': {
      backdrop: `modal-fade-in`,
      modal: `animate-slide-in-from-bottom`,
      modalBase: `transform transition-all ease-out`,
      modalEnter: 'opacity-100 translate-y-0 scale-100',
      modalExit: 'opacity-0 translate-y-full scale-95',
    },
  };

  const currentAnimation = animationClasses[animation];

  // Focus management
  const handleFocus = useCallback(() => {
    if (modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstFocusableElement = focusableElements[0] as HTMLElement;
      if (firstFocusableElement) {
        firstFocusableElement.focus();
      }
    }
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && closeOnEscape) {
      onClose();
      return;
    }

    if (event.key === 'Tab') {
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          event.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          event.preventDefault();
        }
      }
    }
  }, [closeOnEscape, onClose]);

  // Lifecycle effects
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      // Lock body scroll
      document.body.style.overflow = 'hidden';
      
      // Also try to lock the main content container if it exists
      const mainContent = document.querySelector('.main-content');
      if (mainContent instanceof HTMLElement) {
          mainContent.style.overflow = 'hidden';
      }

      document.addEventListener('keydown', handleKeyDown);

      // Focus modal after animation - ONLY if not already opened to prevent stealing focus on re-renders
      if (!hasOpenedRef.current) {
         setTimeout(handleFocus, 150);
         hasOpenedRef.current = true;
      }
    } else {
      document.body.style.overflow = 'unset';
      
      // Unlock main content
      const mainContent = document.querySelector('.main-content');
      if (mainContent instanceof HTMLElement) {
          mainContent.style.overflow = ''; // Reset to default (usually handled by class)
      }

      document.removeEventListener('keydown', handleKeyDown);
      hasOpenedRef.current = false;

      // Return focus to previous element
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    }

    return () => {
      document.body.style.overflow = 'unset';
      const mainContent = document.querySelector('.main-content');
      if (mainContent instanceof HTMLElement) {
          mainContent.style.overflow = '';
      }
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown, handleFocus]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnBackdropClick) {
      onClose();
    }
  };

  return createPortal(
    <div
      className={`
        fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-2 sm:p-4
        bg-black/60 backdrop-blur-sm
        ${currentAnimation.backdrop}
        ${className}
      `}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel || title}
      aria-describedby={ariaDescribedBy}
      style={{ overscrollBehavior: 'contain' }}
    >
      <div
        ref={modalRef}
        className={`
          bg-[rgb(var(--color-card-rgb))]
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          w-full rounded-t-2xl sm:rounded-2xl shadow-2xl
          max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col
          ${currentAnimation.modalBase}
          ${currentAnimation.modal}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {title && (
          <div className={`
            flex items-center justify-between p-4 sm:p-6 pb-3 sm:pb-4 border-b border-[rgb(var(--color-border-rgb))]
            transform transition-all ${prefersReducedMotion || isMobile ? 'duration-150' : 'duration-300'} ease-out
            ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
          `} style={{ transitionDelay: isOpen ? (prefersReducedMotion || isMobile ? '50ms' : '100ms') : '0ms' }}>
            <h2 className="text-lg sm:text-xl font-semibold text-[rgb(var(--color-text-rgb))] pr-4">
              {title}
            </h2>
            {showCloseButton && (
              <button
                onClick={onClose}
                className={`
                  p-2 -mr-2 text-[rgb(var(--color-text-muted-rgb))] hover:text-[rgb(var(--color-text-rgb))] hover:bg-[rgb(var(--color-card-muted-rgb))] rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0
                  transform transition-all ${prefersReducedMotion || isMobile ? 'duration-100' : 'duration-200'} ease-out
                  ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}
                `}
                style={{ transitionDelay: isOpen ? (prefersReducedMotion || isMobile ? '100ms' : '200ms') : '0ms' }}
                aria-label="Close modal"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className={`
          flex-1 ${disableContentPadding ? '' : 'overflow-y-auto'}
          transform transition-all ${prefersReducedMotion || isMobile ? 'duration-150' : 'duration-300'} ease-out
          ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
        `} style={{ transitionDelay: isOpen ? (prefersReducedMotion || isMobile ? '75ms' : '150ms') : '0ms' }}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
});

export default BaseModal;