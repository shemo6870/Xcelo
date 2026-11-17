import { useEffect } from 'react';

// Counter to track nested active modals/popups
let lockCount = 0;
let originalBodyOverflow = '';
let originalBodyPaddingRight = '';
let scrollYPosition = 0;

export function lockBodyScroll() {
  if (typeof document === 'undefined') return;

  if (lockCount === 0) {
    originalBodyOverflow = document.body.style.overflow;
    originalBodyPaddingRight = document.body.style.paddingRight;
    scrollYPosition = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;

    // Prevent layout shift when vertical scrollbar disappears
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    // Lock body without moving window scroll
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open-scroll-lock');
  }

  lockCount++;
}

export function unlockBodyScroll() {
  if (typeof document === 'undefined') return;

  lockCount = Math.max(0, lockCount - 1);

  if (lockCount === 0) {
    document.body.style.overflow = originalBodyOverflow;
    document.body.style.paddingRight = originalBodyPaddingRight;
    document.body.classList.remove('modal-open-scroll-lock');

    // Ensure scroll position remains exactly where the user was
    if (typeof window !== 'undefined' && scrollYPosition) {
      window.scrollTo(0, scrollYPosition);
    }
  }
}

/**
 * Hook to lock background scrolling while a modal/popup is open.
 * Supports multiple nested modals cleanly using reference counting.
 */
export function useBodyScrollLock(isLocked: boolean = true) {
  useEffect(() => {
    if (!isLocked) return;

    lockBodyScroll();

    return () => {
      unlockBodyScroll();
    };
  }, [isLocked]);
}
