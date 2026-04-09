/**
 * Security Configuration Constants
 * Centralized security settings for the application
 */

// Content Security Policy directives
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Required for React
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  'font-src': ["'self'", 'https://fonts.gstatic.com'],
  'img-src': ["'self'", 'data:', 'https:', 'blob:'],
  'connect-src': [
    "'self'",
    'https://*.supabase.co',
    'https://maps.googleapis.com',
    'https://picsum.photos',
    'https://*.googleapis.com'
  ],
  'frame-src': ["'self'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  // Additional security directives
  'object-src': ["'none'"], // Prevent Flash/Java applets
  'frame-ancestors': ["'none'"], // Prevent clickjacking
  'upgrade-insecure-requests': [], // Upgrade HTTP to HTTPS
};

// Build CSP header string
export const buildCSPHeader = () => {
  return Object.entries(CSP_DIRECTIVES)
    .map(([key, values]) => {
      if (values.length === 0) return key;
      return `${key} ${values.join(' ')}`;
    })
    .join('; ');
};

// Security headers configuration
export const SECURITY_HEADERS = {
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  // XSS protection (legacy browsers)
  'X-XSS-Protection': '1; mode=block',
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // Permissions policy (what browser features can be used)
  'Permissions-Policy': [
    'geolocation=(self)',
    'camera=()',
    'microphone=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()',
    'fullscreen=(self)',
    'autoplay=()'
  ].join(', '),
  // Remove server identification
  'X-Powered-By': '',
  // Strict transport security (HTTPS only)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  // Cross-origin policies
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
};

// Rate limiting defaults
export const RATE_LIMIT_DEFAULTS = {
  auth: { maxRequests: 5, windowMs: 60000 }, // 5 attempts per minute
  api: { maxRequests: 100, windowMs: 60000 }, // 100 requests per minute
  search: { maxRequests: 30, windowMs: 60000 }, // 30 searches per minute
  upload: { maxRequests: 5, windowMs: 300000 }, // 5 uploads per 5 minutes
};

// File upload security settings
export const FILE_UPLOAD_CONFIG = {
  maxSize: 5 * 1024 * 1024, // 5MB
  maxImageDimension: 4096, // Max width/height in pixels
  allowedTypes: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml'
  ],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'],
  // Magic numbers for file type verification (first few bytes)
  magicNumbers: {
    'image/jpeg': ['FF D8 FF'],
    'image/png': ['89 50 4E 47'],
    'image/gif': ['47 49 46 38'],
    'image/webp': ['52 49 46 46'],
  },
};

// Trusted iframe sources
export const TRUSTED_IFRAME_DOMAINS = [
  'google.com',
  'www.google.com',
  'maps.google.com',
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'player.vimeo.com',
  'open.spotify.com',
];

// Allowed URL schemes
export const ALLOWED_URL_SCHEMES = ['http:', 'https:', 'mailto:', 'tel:'];

// Dangerous HTML patterns to check
export const DANGEROUS_PATTERNS = {
  // Event handlers that can execute JavaScript
  eventHandlers: /\son\w+\s*=/i,
  // JavaScript URLs
  javascriptUrl: /javascript:/i,
  // Data URLs that could contain scripts
  dataUrl: /data:text\/html/i,
  // VBScript (IE)
  vbscript: /vbscript:/i,
  // Expression (IE CSS)
  expression: /expression\s*\(/i,
  // Mocha (old Firefox)
  mocha: /mocha:/i,
  // LiveScript
  livescript: /livescript:/i,
};

// Password policy
export const PASSWORD_POLICY = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: false, // Optional
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

// Session configuration
export const SESSION_CONFIG = {
  // How often to refresh token (in ms)
  refreshInterval: 5 * 60 * 1000, // 5 minutes
  // Max session duration
  maxDuration: 24 * 60 * 60 * 1000, // 24 hours
  // Warning before expiry
  expiryWarning: 5 * 60 * 1000, // 5 minutes
};

export default {
  CSP_DIRECTIVES,
  buildCSPHeader,
  SECURITY_HEADERS,
  RATE_LIMIT_DEFAULTS,
  FILE_UPLOAD_CONFIG,
  TRUSTED_IFRAME_DOMAINS,
  ALLOWED_URL_SCHEMES,
  DANGEROUS_PATTERNS,
  PASSWORD_POLICY,
  SESSION_CONFIG,
};