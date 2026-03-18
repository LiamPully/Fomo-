# Security Documentation

This document outlines the security measures implemented in the Happenings/Fomo Markets application.

## Table of Contents

1. [Authentication Security](#authentication-security)
2. [Input Validation](#input-validation)
3. [API Security](#api-security)
4. [Content Security Policy](#content-security-policy)
5. [Rate Limiting](#rate-limiting)
6. [Environment Variables](#environment-variables)
7. [Production Checklist](#production-checklist)

---

## Authentication Security

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)

### Rate Limiting
- Sign in attempts limited to 5 per minute
- Rate limit resets after 60 seconds
- User sees countdown timer when rate limited

### Session Management
- Sessions persisted via Supabase Auth
- Automatic session recovery on page refresh
- Proper cleanup on sign out

### Error Sanitization
- Internal error details never exposed to users
- User-friendly error messages for common failures
- Database/SQL errors masked as generic server errors

---

## Input Validation

### Event Data Validation (`src/lib/validation.js`)
All event data is validated before database operations:

- **Title**: Required, 2-255 characters
- **Description**: Optional, max 5000 characters
- **Area**: Required, max 255 characters
- **Dates**: Valid ISO dates, end time must be after start time
- **Coordinates**: Latitude (-90 to 90), Longitude (-180 to 180)
- **URLs**: Must start with http:// or https://
- **Phone**: Max 50 characters, whitespace removed
- **Instagram**: Max 100 characters, @ prefix stripped

### Business Data Validation
- **Name**: Required, 2-255 characters
- **Email**: Valid email format required
- **Phone**: Max 50 characters
- **Website**: Valid URL format

### SQL Injection Prevention
- All user input sanitized before database queries
- Special characters (`%`, `_`, `\`) escaped in LIKE clauses
- UUID format validation on all ID parameters

---

## API Security

### Row Level Security (RLS)
All database tables have RLS policies enabled:

**Businesses Table:**
- Public can view all businesses
- Users can only insert/update/delete their own business

**Events Table:**
- Public can view published events only
- Business owners can CRUD their own events
- Draft/past/removed events only visible to owners

**Categories Table:**
- Public can view all categories
- Only admins can modify categories

### API Rate Limiting
- Fetch operations limited to 50-100 results
- Search limited to 50 results
- All list queries have `.limit()` applied

---

## Content Security Policy

The following CSP headers are applied in production:

```
default-src 'self'
script-src 'self' 'unsafe-inline' 'unsafe-eval'
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com
font-src 'self' https://fonts.gstatic.com
img-src 'self' data: https: blob:
connect-src 'self' https://*.supabase.co https://maps.googleapis.com https://picsum.photos
frame-src 'self'
base-uri 'self'
form-action 'self'
```

### Additional Security Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(self), camera=(), microphone=(), payment=()`

---

## Rate Limiting

### Client-Side Rate Limiting
Implemented via `useRateLimit` hook:

```javascript
const { isRateLimited, remainingTime, checkRateLimit, recordAttempt } = useRateLimit(5, 60000);
```

### Debouncing
Search inputs debounced to prevent excessive API calls:
```javascript
const { debouncedCallback } = useDebounce(callback, 300);
```

### Throttling
Scroll/resize handlers throttled:
```javascript
const { throttledCallback } = useThrottle(callback, 100);
```

---

## Environment Variables

### Required Variables
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GOOGLE_PLACES_API_KEY=your-google-api-key
```

### Security Notes
- **Never commit `.env` file** - it's in `.gitignore`
- Anon key is safe for client-side (RLS protects data)
- Google API key restricted to HTTP referrers in production
- Rotate keys immediately if exposed

---

## Production Checklist

Before deploying to production:

- [ ] Apply database schema with RLS policies
- [ ] Execute security triggers in Supabase
- [ ] Restrict Google Places API key (HTTP referrers only)
- [ ] Enable Supabase RLS on all tables
- [ ] Configure CSP headers in web server/reverse proxy
- [ ] Set up monitoring and error tracking (Sentry recommended)
- [ ] Remove console.log statements (Vite build does this automatically)
- [ ] Test rate limiting functionality
- [ ] Verify password validation works
- [ ] Test SQL injection prevention
- [ ] Review and rotate API keys

---

## Security Utilities

### `src/lib/security.js`
Security utilities available:

- `sanitizeHtml()` - XSS prevention
- `sanitizeUrl()` - URL validation
- `safeLog` - Production-safe logging
- `RateLimiter` - Client-side rate limiting
- `validateFileUpload()` - File upload validation
- `generateSecureToken()` - CSRF token generation
- `secureStorage` - Obfuscated localStorage

### `src/lib/validation.js`
Validation utilities:

- `validateEventData()` - Complete event validation
- `validateBusinessData()` - Business data validation
- `validateEmail()` - Email format validation
- `validateUUID()` - UUID format validation
- `sanitizeSqlInput()` - SQL injection prevention

---

## Reporting Security Issues

If you discover a security vulnerability:

1. **Do not** create a public issue
2. Email security concerns to: [your-security-email]
3. Include detailed steps to reproduce
4. Allow reasonable time for fixes before disclosure

---

## Security Updates

Last updated: 2026-03-18

### Recent Changes
- Added rate limiting to authentication
- Implemented input validation on all API functions
- Added CSP headers in production builds
- Created security utilities library
- Sanitized all error messages
- Added SQL injection prevention

### Planned Improvements
- Implement CSRF tokens for forms
- Add audit logging for sensitive operations
- Set up automated security scanning
- Implement API request signing
- Add device fingerprinting for suspicious activity
