import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useScrollPosition — Track scroll position and direction
 *
 * Features:
 * - Tracks current scroll Y position
 * - Detects scroll direction (up/down)
 * - Provides isScrolled boolean (scrolled past threshold)
 * - Throttled updates for performance
 * - Supports both window and element scrolling
 *
 * @param {Object} options
 * @param {number} options.threshold - Pixels to scroll before isScrolled becomes true (default: 50)
 * @param {number} options.throttleMs - Throttle delay in ms (default: 16ms ~ 60fps)
 * @param {boolean} options.hideOnScrollDown - Hide header when scrolling down (default: true)
 * @param {number} options.hideThreshold - Pixels to scroll down before hiding (default: 100)
 * @returns {Object} { scrollY, scrollDirection, isScrolled, isHidden, scrollProgress }
 *
 * @example
 * const { scrollY, isScrolled, isHidden } = useScrollPosition({ threshold: 100 });
 */

export function useScrollPosition(options = {}) {
  const {
    threshold = 50,
    throttleMs = 16,
    hideOnScrollDown = true,
    hideThreshold = 100,
  } = options;

  const [scrollY, setScrollY] = useState(0);
  const [scrollDirection, setScrollDirection] = useState('up');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const scrollStartY = useRef(0);

  const handleScroll = useCallback(() => {
    if (!ticking.current) {
      window.requestAnimationFrame(() => {
        const currentScrollY = window.scrollY || window.pageYOffset || 0;

        // Determine scroll direction
        const direction = currentScrollY > lastScrollY.current ? 'down' : 'up';
        setScrollDirection(direction);

        // Check if scrolled past threshold
        setIsScrolled(currentScrollY > threshold);

        // Calculate scroll progress (0-1) based on page height
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? currentScrollY / docHeight : 0;
        setScrollProgress(Math.min(1, Math.max(0, progress)));

        // Handle hide-on-scroll behavior
        if (hideOnScrollDown) {
          if (direction === 'down' && currentScrollY > hideThreshold) {
            setIsHidden(true);
          } else if (direction === 'up') {
            setIsHidden(false);
            scrollStartY.current = currentScrollY;
          }
        }

        setScrollY(currentScrollY);
        lastScrollY.current = currentScrollY;
        ticking.current = false;
      });

      ticking.current = true;
    }
  }, [threshold, hideOnScrollDown, hideThreshold]);

  useEffect(() => {
    // Check initial scroll position
    const initialScrollY = window.scrollY || window.pageYOffset || 0;
    setScrollY(initialScrollY);
    setIsScrolled(initialScrollY > threshold);
    lastScrollY.current = initialScrollY;

    // Add scroll listener with throttling via requestAnimationFrame
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll, threshold]);

  return {
    scrollY,
    scrollDirection,
    isScrolled,
    isHidden,
    scrollProgress,
  };
}

/**
 * useElementScroll — Track scroll position of a specific element
 *
 * @param {React.RefObject} elementRef - Ref to the scrollable element
 * @param {Object} options - Same options as useScrollPosition
 * @returns {Object} Scroll state for the element
 */

export function useElementScroll(elementRef, options = {}) {
  const {
    threshold = 50,
    hideOnScrollDown = true,
    hideThreshold = 100,
  } = options;

  const [scrollY, setScrollY] = useState(0);
  const [scrollDirection, setScrollDirection] = useState('up');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  const lastScrollY = useRef(0);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleScroll = () => {
      const currentScrollY = element.scrollTop;

      const direction = currentScrollY > lastScrollY.current ? 'down' : 'up';
      setScrollDirection(direction);
      setIsScrolled(currentScrollY > threshold);

      if (hideOnScrollDown) {
        if (direction === 'down' && currentScrollY > hideThreshold) {
          setIsHidden(true);
        } else if (direction === 'up') {
          setIsHidden(false);
        }
      }

      setScrollY(currentScrollY);
      lastScrollY.current = currentScrollY;
    };

    element.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      element.removeEventListener('scroll', handleScroll);
    };
  }, [elementRef, threshold, hideOnScrollDown, hideThreshold]);

  return {
    scrollY,
    scrollDirection,
    isScrolled,
    isHidden,
  };
}

export default useScrollPosition;
