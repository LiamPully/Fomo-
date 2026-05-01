/**
 * Security Utilities for Production
 *
 * These utilities help protect the application in production by:
 * - Sanitizing user input to prevent XSS
 * - Validating data before rendering
 * - Providing safe error logging
 */

/**
 * Sanitizes HTML to prevent XSS attacks
 * Removes potentially dangerous tags and attributes
 */
export const sanitizeHtml = (input) => {
  if (typeof input !== 'string') return '';

  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };

  return input.replace(/[&<>"'`=/]/g, (s) => map[s]);
};

/**
 * Validates that a URL is safe (http/https only)
 */
export const isSafeUrl = (url) => {
  if (typeof url !== 'string') return false;

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Sanitizes a URL for safe rendering
 * Returns a safe URL or empty string if unsafe
 */
export const sanitizeUrl = (url) => {
  if (!url || typeof url !== 'string') return '';

  // Allow only http/https URLs
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // For relative URLs, ensure they don't contain javascript:
  if (url.toLowerCase().startsWith('javascript:')) {
    return '';
  }

  // Allow relative URLs that start with /
  if (url.startsWith('/')) {
    return url;
  }

  // Default: return empty for safety
  return '';
};

/**
 * Production-safe console logging
 * Automatically strips logs in production builds
 */
const isDevelopment = import.meta.env?.MODE === 'development' || process.env?.NODE_ENV === 'development';

export const safeLog = {
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  error: (...args) => {
    // Always log errors, but sanitize in production
    if (isDevelopment) {
      console.error(...args);
    } else {
      // In production, only log the error message without stack traces
      const sanitized = args.map(arg => {
        if (arg instanceof Error) {
          return arg.message;
        }
        if (typeof arg === 'object' && arg !== null) {
          try {
            return '[Object]';
          } catch {
            return '[Unserializable]';
          }
        }
        return arg;
      });
      console.error(...sanitized);
    }
  },
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  debug: (...args) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  }
};

/**
 * Rate limiting helper for client-side operations
 * Prevents excessive API calls
 */
export class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  canProceed() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      return false;
    }

    this.requests.push(now);
    return true;
  }

  getRemainingTime() {
    if (this.requests.length < this.maxRequests) return 0;
    const oldestRequest = this.requests[0];
    return this.windowMs - (Date.now() - oldestRequest);
  }
}

/**
 * Validates file upload for security
 * Checks type, size, and extension
 */
export const validateFileUpload = (file, options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
  } = options;

  const errors = [];

  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  // Check file size
  if (file.size > maxSize) {
    errors.push(`File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`);
  }

  // Check MIME type
  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type not allowed. Allowed: ${allowedTypes.join(', ')}`);
  }

  // Check extension
  const extension = '.' + file.name.split('.').pop().toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    errors.push(`File extension not allowed. Allowed: ${allowedExtensions.join(', ')}`);
  }

  // Check for double extensions (common attack vector)
  if (file.name.split('.').length > 2) {
    // Allow but warn - could be suspicious
    safeLog.warn('File has multiple extensions:', file.name);
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : null
  };
};

/**
 * Generates a cryptographically secure random token
 * Useful for CSRF protection
 */
export const generateSecureToken = (length = 32) => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Validates that an iframe source is from a trusted domain
 */
/**
 * Checks if input contains common XSS patterns
 */
export const containsXssPatterns = (input) => {
  if (typeof input !== 'string') return false;
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /data:text\/html/i,
    /vbscript:/i,
    /expression\s*\(/i,
  ];
  return dangerousPatterns.some(pattern => pattern.test(input));
};

/**
 * Validates a string with configurable rules
 */
export const validateString = (value, options = {}) => {
  const { required = false, maxLength = Infinity, minLength = 0, allowedChars } = options;
  if (required && (!value || !String(value).trim())) {
    return { valid: false, error: 'Value is required' };
  }
  const str = String(value || '');
  if (str.length < minLength) {
    return { valid: false, error: `Value must be at least ${minLength} characters` };
  }
  if (str.length > maxLength) {
    return { valid: false, error: `Value must be less than ${maxLength} characters` };
  }
  if (allowedChars && !allowedChars.test(str)) {
    return { valid: false, error: 'Value contains invalid characters' };
  }
  return { valid: true, value: str };
};

export const isTrustedIframeSource = (url, trustedDomains = []) => {
  if (!url || typeof url !== 'string') return false;

  const defaultTrusted = [
    'google.com',
    'maps.google.com',
    'www.google.com',
    'youtube.com',
    'www.youtube.com',
    'youtu.be'
  ];

  const allowedDomains = [...defaultTrusted, ...trustedDomains];

  try {
    const parsed = new URL(url);
    return allowedDomains.some(domain =>
      parsed.hostname === domain ||
      parsed.hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
};

/**
 * Secure storage wrapper with encryption for sensitive data
 * Note: This is for client-side storage only and provides minimal security
 */
export const secureStorage = {
  set: (key, value) => {
    try {
      const serialized = JSON.stringify(value);
      // Simple obfuscation (not true encryption, just prevents casual inspection)
      const obfuscated = btoa(unescape(encodeURIComponent(serialized)));
      localStorage.setItem(key, obfuscated);
    } catch (err) {
      safeLog.error('Failed to store data:', err);
    }
  },

  get: (key) => {
    try {
      const obfuscated = localStorage.getItem(key);
      if (!obfuscated) return null;
      const serialized = decodeURIComponent(escape(atob(obfuscated)));
      return JSON.parse(serialized);
    } catch (err) {
      safeLog.error('Failed to retrieve data:', err);
      return null;
    }
  },

  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      safeLog.error('Failed to remove data:', err);
    }
  },

  clear: () => {
    try {
      localStorage.clear();
    } catch (err) {
      safeLog.error('Failed to clear storage:', err);
    }
  }
};

export default {
  sanitizeHtml,
  isSafeUrl,
  sanitizeUrl,
  safeLog,
  RateLimiter,
  validateFileUpload,
  generateSecureToken,
  isTrustedIframeSource,
  secureStorage
};
