import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

/**
 * Browser Extension Error Suppression
 * These handlers catch and suppress common browser extension errors
 * that clutter the console but don't affect app functionality.
 */
const EXTENSION_ERROR_PATTERNS = [
  /runtime\.lastError/i,
  /FrameDoesNotExistError/i,
  /FrameIsBrowserFrameError/i,
  /extension/i,
  /chrome-extension/i,
  /moz-extension/i,
  /safari-extension/i,
  /webframe/i,
  /Unchecked runtime\.lastError/i,
];

const SENTRY_RATE_LIMIT_PATTERNS = [
  /Sentry.*429/i,
  /sentry.*rate/i,
  /429.*sentry/i,
];

/**
 * Check if an error should be suppressed
 */
const shouldSuppressError = (error) => {
  if (!error) return false;

  const errorString = typeof error === 'string' ? error : error.toString?.() || '';
  const errorMessage = error.message || errorString;

  // Suppress extension errors
  if (EXTENSION_ERROR_PATTERNS.some(pattern => pattern.test(errorMessage))) {
    return true;
  }

  // Suppress Sentry 429 errors
  if (SENTRY_RATE_LIMIT_PATTERNS.some(pattern => pattern.test(errorMessage))) {
    return true;
  }

  // Check for extension-related stack traces
  const stack = error.stack || '';
  if (stack.includes('chrome-extension:') ||
      stack.includes('moz-extension:') ||
      stack.includes('safari-extension:') ||
      stack.includes('extension://')) {
    return true;
  }

  return false;
};

// Wrap original console.error
const originalConsoleError = console.error;
console.error = function(...args) {
  const firstArg = args[0];

  // Check if this is an extension error
  if (firstArg && shouldSuppressError(firstArg)) {
    // Silently ignore extension errors in production
    if (import.meta.env.PROD) {
      return;
    }
    // In dev, log at a lower level for debugging
    console.debug('[Suppressed Extension Error]', ...args);
    return;
  }

  // Check for Sentry 429 errors
  if (typeof firstArg === 'string' &&
      (firstArg.includes('429') || firstArg.includes('rate limit')) &&
      args.some(arg => String(arg).toLowerCase().includes('sentry'))) {
    console.debug('[Sentry Rate Limit - Suppressed]', ...args);
    return;
  }

  originalConsoleError.apply(console, args);
};

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
  if (shouldSuppressError(event.error)) {
    event.preventDefault();
    console.debug('[Global Error Handler - Suppressed]', event.error);
    return true;
  }
  return false;
});

// Global handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  if (shouldSuppressError(event.reason)) {
    event.preventDefault();
    console.debug('[Unhandled Rejection - Suppressed]', event.reason);
    return true;
  }

  // Also suppress Sentry 429 errors in rejections
  const reasonString = String(event.reason);
  if (SENTRY_RATE_LIMIT_PATTERNS.some(pattern => pattern.test(reasonString))) {
    event.preventDefault();
    console.debug('[Sentry Rate Limit Rejection - Suppressed]', event.reason);
    return true;
  }

  return false;
});

// Intercept and filter out extension-related messages from chrome.runtime
if (typeof chrome !== 'undefined' && chrome.runtime) {
  const originalSendMessage = chrome.runtime.sendMessage;
  if (originalSendMessage) {
    chrome.runtime.sendMessage = function(...args) {
      try {
        return originalSendMessage.apply(this, args);
      } catch (error) {
        if (!shouldSuppressError(error)) {
          throw error;
        }
        console.debug('[chrome.runtime.sendMessage - Suppressed Error]', error);
      }
    };
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
