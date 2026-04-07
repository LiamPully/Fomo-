import { useCallback, useEffect, useRef } from 'react';

/**
 * useA11y - Accessibility helper hook
 *
 * Provides utilities for:
 * - Focus trapping in modals
 * - Announcing changes to screen readers
 * - Managing focus restoration
 * - Keyboard navigation
 */

/**
 * Trap focus within an element (for modals, dialogs, etc.)
 * @param {boolean} isActive - Whether to trap focus
 * @returns {React.RefObject} ref to attach to the container element
 */
export const useFocusTrap = (isActive) => {
  const containerRef = useRef(null);
  const previouslyFocusedElement = useRef(null);

  useEffect(() => {
    if (isActive) {
      // Store the currently focused element
      previouslyFocusedElement.current = document.activeElement;

      // Focus the first focusable element in the container
      const focusableElements = getFocusableElements(containerRef.current);
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }

      // Add keyboard listener
      const handleKeyDown = (e) => {
        if (e.key === 'Tab') {
          handleTabKey(e, containerRef.current);
        }
        if (e.key === 'Escape') {
          // Let parent handle escape
          return;
        }
      };

      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        // Restore focus when unmounting
        if (previouslyFocusedElement.current) {
          previouslyFocusedElement.current.focus();
        }
      };
    }
  }, [isActive]);

  return containerRef;
};

/**
 * Get all focusable elements within a container
 */
const getFocusableElements = (container) => {
  if (!container) return [];

  const focusableSelectors = [
    'button:not([disabled])',
    'a[href]',
    'input:not([disabled])',
    'textarea:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ];

  return Array.from(
    container.querySelectorAll(focusableSelectors.join(', '))
  );
};

/**
 * Handle Tab key to trap focus
 */
const handleTabKey = (e, container) => {
  const focusableElements = getFocusableElements(container);
  if (focusableElements.length === 0) return;

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (e.shiftKey) {
    // Shift + Tab: Move backwards
    if (document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    }
  } else {
    // Tab: Move forwards
    if (document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  }
};

/**
 * Announce message to screen readers
 * @param {string} message - Message to announce
 * @param {string} priority - 'polite' or 'assertive'
 */
export const announceToScreenReader = (message, priority = 'polite') => {
  // Create or find live region
  let liveRegion = document.getElementById(`aria-live-${priority}`);

  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = `aria-live-${priority}`;
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    document.body.appendChild(liveRegion);
  }

  // Clear and set message
  liveRegion.textContent = '';
  setTimeout(() => {
    liveRegion.textContent = message;
  }, 100);
};

/**
 * Hook for managing reduced motion preference
 */
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};

import { useState } from 'react';

/**
 * Hook for skip link navigation
 */
export const useSkipLink = (targetId) => {
  const handleSkip = useCallback((e) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.setAttribute('tabindex', '-1');
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  }, [targetId]);

  return handleSkip;
};

/**
 * Keyboard navigation helper for lists
 * @param {number} itemCount - Number of items in the list
 * @param {function} onSelect - Callback when item is selected
 * @returns {object} Keyboard handlers
 */
export const useListKeyboardNav = (itemCount, onSelect) => {
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const handleKeyDown = useCallback((e, index) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) => {
          const next = prev < itemCount - 1 ? prev + 1 : 0;
          return next;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) => {
          const next = prev > 0 ? prev - 1 : itemCount - 1;
          return next;
        });
        break;
      case 'Home':
        e.preventDefault();
        setFocusedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setFocusedIndex(itemCount - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (index >= 0) {
          onSelect(index);
        }
        break;
      default:
        break;
    }
  }, [itemCount, onSelect]);

  return {
    focusedIndex,
    setFocusedIndex,
    handleKeyDown
  };
};

/**
 * Generate ARIA attributes for a button
 */
export const getButtonA11yProps = ({
  label,
  isExpanded,
  hasPopup,
  controls
}) => ({
  'aria-label': label,
  ...(isExpanded !== undefined && { 'aria-expanded': isExpanded }),
  ...(hasPopup && { 'aria-haspopup': true }),
  ...(controls && { 'aria-controls': controls })
});

/**
 * Generate ARIA attributes for a modal/dialog
 */
export const getModalA11yProps = ({
  isOpen,
  titleId,
  descriptionId
}) => ({
  role: 'dialog',
  'aria-modal': true,
  'aria-labelledby': titleId,
  'aria-describedby': descriptionId,
  'aria-hidden': !isOpen
});

export default {
  useFocusTrap,
  announceToScreenReader,
  useReducedMotion,
  useSkipLink,
  useListKeyboardNav,
  getButtonA11yProps,
  getModalA11yProps
};
