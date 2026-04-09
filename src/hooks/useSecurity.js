import { useCallback, useRef } from 'react';
import { RateLimiter, containsXssPatterns, sanitizeHtml, safeLog } from '../lib/security';
import { validateString } from '../lib/validation';

/**
 * useSecurity Hook
 * Provides security utilities for components
 * @returns {Object} Security utilities
 */
export function useSecurity() {
  // Rate limiters for different actions
  const rateLimiters = useRef({
    submit: new RateLimiter(10, 60000), // 10 submits per minute
    api: new RateLimiter(100, 60000), // 100 API calls per minute
    upload: new RateLimiter(5, 300000), // 5 uploads per 5 minutes
  });

  /**
   * Check if action is rate limited
   * @param {string} action - Action type (submit, api, upload)
   * @returns {Object} Rate limit status
   */
  const checkRateLimit = useCallback((action = 'api') => {
    const limiter = rateLimiters.current[action];
    if (!limiter) return { allowed: true, remaining: 0 };

    const allowed = limiter.canProceed();
    const remaining = limiter.getRemainingTime();

    if (!allowed) {
      safeLog.warn(`Rate limit exceeded for ${action}`);
    }

    return { allowed, remainingTime: remaining };
  }, []);

  /**
   * Validates form data for XSS and injection attacks
   * @param {Object} data - Form data to validate
   * @returns {Object} Validation result
   */
  const validateFormData = useCallback((data) => {
    const errors = [];
    const sanitized = {};

    if (!data || typeof data !== 'object') {
      return { valid: false, errors: ['Invalid data'], data: {} };
    }

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        // Check for XSS patterns
        if (containsXssPatterns(value)) {
          errors.push(`Field "${key}" contains potentially dangerous content`);
          continue;
        }

        // Validate string length
        const result = validateString(value, {
          required: false,
          maxLength: 10000,
          name: key,
        });

        if (!result.valid) {
          errors.push(result.error);
        } else {
          sanitized[key] = result.value;
        }
      } else if (value !== null && value !== undefined) {
        sanitized[key] = value;
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      data: sanitized,
    };
  }, []);

  /**
   * Sanitizes content for display
   * @param {string} content - Content to sanitize
   * @param {Object} options - Sanitization options
   * @returns {string} Sanitized content
   */
  const sanitizeContent = useCallback((content, options = {}) => {
    const { allowHtml = false, maxLength = 10000 } = options;

    if (typeof content !== 'string') return '';

    // Check length
    if (content.length > maxLength) {
      content = content.slice(0, maxLength);
    }

    if (allowHtml) {
      // Escape HTML but preserve line breaks
      return sanitizeHtml(content, { strict: true });
    }

    // Strip all HTML
    return content.replace(/<[^]*?>/g, '');
  }, []);

  /**
   * Validates file before upload
   * @param {File} file - File to validate
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  const validateFile = useCallback((file, options = {}) => {
    const {
      maxSize = 5 * 1024 * 1024, // 5MB default
      allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
    } = options;

    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    // Check file size
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`,
      };
    }

    // Check MIME type
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type not allowed. Allowed: ${allowedTypes.join(', ')}`,
      };
    }

    // Check for double extensions (common attack)
    if (file.name.split('.').length > 2) {
      safeLog.warn('File has multiple extensions:', file.name);
    }

    // Check for suspicious extensions
    const dangerousExtensions = ['.exe', '.dll', '.bat', '.cmd', '.sh', '.php', '.js', '.jsp'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (dangerousExtensions.includes(ext)) {
      return { valid: false, error: 'File type not allowed' };
    }

    return { valid: true };
  }, []);

  /**
   * Creates a secure report of client-side security info
   * Useful for debugging and security audits
   * @returns {Object} Security info
   */
  const getSecurityInfo = useCallback(() => {
    return {
      https: window.location.protocol === 'https:',
      secureContext: window.isSecureContext,
      sandboxed: window.origin === 'null',
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
    };
  }, []);

  return {
    checkRateLimit,
    validateFormData,
    sanitizeContent,
    validateFile,
    getSecurityInfo,
  };
}

export default useSecurity;
