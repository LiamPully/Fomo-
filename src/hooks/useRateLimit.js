import { useState, useCallback, useRef } from 'react';

/**
 * Hook for rate limiting authentication operations
 * Prevents brute force attacks on login/signup
 */
export function useRateLimit(maxAttempts = 5, windowMs = 60000) {
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const attempts = useRef([]);
  const timeoutRef = useRef(null);

  const checkRateLimit = useCallback(() => {
    const now = Date.now();
    // Remove attempts outside the window
    attempts.current = attempts.current.filter(time => now - time < windowMs);

    if (attempts.current.length >= maxAttempts) {
      const oldestAttempt = attempts.current[0];
      const waitTime = windowMs - (now - oldestAttempt);
      setIsRateLimited(true);
      setRemainingTime(Math.ceil(waitTime / 1000));

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set timeout to clear rate limit
      timeoutRef.current = setTimeout(() => {
        setIsRateLimited(false);
        setRemainingTime(0);
      }, waitTime);

      return false;
    }

    return true;
  }, [maxAttempts, windowMs]);

  const recordAttempt = useCallback(() => {
    attempts.current.push(Date.now());
  }, []);

  const resetRateLimit = useCallback(() => {
    attempts.current = [];
    setIsRateLimited(false);
    setRemainingTime(0);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return {
    isRateLimited,
    remainingTime,
    checkRateLimit,
    recordAttempt,
    resetRateLimit
  };
}

/**
 * Hook for debouncing expensive operations
 * Useful for search inputs
 */
export function useDebounce(callback, delay = 300) {
  const timeoutRef = useRef(null);

  const debouncedCallback = useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return { debouncedCallback, cancel };
}

/**
 * Hook for throttling frequent operations
 * Useful for scroll handlers, resize events
 */
export function useThrottle(callback, limit = 100) {
  const lastRun = useRef(Date.now());
  const timeoutRef = useRef(null);

  const throttledCallback = useCallback((...args) => {
    const now = Date.now();

    if (now - lastRun.current >= limit) {
      lastRun.current = now;
      callback(...args);
    } else {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Schedule the call
      timeoutRef.current = setTimeout(() => {
        lastRun.current = Date.now();
        callback(...args);
      }, limit - (now - lastRun.current));
    }
  }, [callback, limit]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return { throttledCallback, cancel };
}
