import { Component } from 'react';
import { BG, BLACK, WHITE, GRAY, GRAY_LIGHT, GRAY_MEDIUM, ACCENT, ERROR, ERROR_LIGHT, FONT, SHADOW_CARD } from '../lib/theme';
import '../styles/airbnb-inspired.css';

/**
 * Browser extension error patterns to suppress
 * These errors come from browser extensions and don't affect app functionality
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

/**
 * Check if an error is from a browser extension (not the app)
 */
const isExtensionError = (error) => {
  if (!error) return false;

  const errorString = typeof error === 'string' ? error : error.toString?.() || '';
  const errorMessage = error.message || errorString;

  // Check against known extension error patterns
  if (EXTENSION_ERROR_PATTERNS.some(pattern => pattern.test(errorMessage))) {
    return true;
  }

  // Check stack trace for extension origins
  const stack = error.stack || '';
  if (stack.includes('chrome-extension:') ||
      stack.includes('moz-extension:') ||
      stack.includes('safari-extension:') ||
      stack.includes('extension://')) {
    return true;
  }

  return false;
};

/**
 * Check if this is a Sentry rate limit error
 */
const isSentryRateLimitError = (error) => {
  if (!error) return false;
  const errorString = String(error.message || error);
  return /Sentry.*429/i.test(errorString) ||
         /sentry.*rate/i.test(errorString) ||
         /429.*sentry/i.test(errorString);
};

/**
 * Safe Sentry capture that checks if Sentry is defined
 */
const safeSentryCapture = (error, context) => {
  if (typeof window !== 'undefined' && window.Sentry && typeof window.Sentry.captureException === 'function') {
    try {
      window.Sentry.captureException(error, { extra: context });
    } catch (sentryError) {
      // Silently fail if Sentry itself has issues
      console.debug('[Sentry capture failed]', sentryError);
    }
  }
};

/**
 * ErrorBoundary - Catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the entire app.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isExtensionError: false
    };
  }

  static getDerivedStateFromError(error) {
    // Check if this is an extension error - if so, don't show fallback UI
    if (isExtensionError(error)) {
      console.debug('[ErrorBoundary] Suppressed extension error:', error);
      return { hasError: false, isExtensionError: true, error };
    }

    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Handle extension errors silently
    if (isExtensionError(error)) {
      console.debug('[ErrorBoundary] Extension error caught and suppressed:', error, errorInfo);
      this.setState({ errorInfo, isExtensionError: true });

      // Auto-recover from extension errors after a short delay
      setTimeout(() => {
        this.setState({ hasError: false, error: null, errorInfo: null, isExtensionError: false });
      }, 100);
      return;
    }

    // Handle Sentry rate limit errors
    if (isSentryRateLimitError(error)) {
      console.debug('[ErrorBoundary] Sentry rate limit error suppressed');
      this.setState({ errorInfo, isExtensionError: true });
      return;
    }

    // Log actual app errors
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });

    // In production, send to error reporting service (only for real app errors)
    if (import.meta.env.PROD) {
      safeSentryCapture(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });

    // Call parent's onReset if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    // If this was just an extension error that's been suppressed, render children normally
    if (!this.state.hasError && this.state.isExtensionError) {
      return this.props.children;
    }

    if (this.state.hasError) {
      // Custom fallback UI
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            background: BG,
            fontFamily: FONT
          }}
        >
          <div
            style={{
              background: WHITE,
              borderRadius: 24,
              padding: '40px 32px',
              maxWidth: 400,
              width: '100%',
              textAlign: 'center',
              boxShadow: SHADOW_CARD
            }}
          >
            {/* Error Icon */}
            <div
              style={{
                width: 72,
                height: 72,
                background: ERROR_LIGHT,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px'
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke={ERROR}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            <h1
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: BLACK,
                marginBottom: 8,
                letterSpacing: '-0.3px'
              }}
            >
              Something went wrong
            </h1>

            <p
              style={{
                fontSize: 14,
                color: GRAY_MEDIUM,
                lineHeight: 1.6,
                marginBottom: 24
              }}
            >
              We apologize for the inconvenience. The app encountered an unexpected error.
            </p>

            {/* Error details in development */}
            {import.meta.env.DEV && this.state.error && (
              <details
                style={{
                  background: GRAY_LIGHT,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 24,
                  textAlign: 'left',
                  fontSize: 12,
                  fontFamily: 'monospace',
                  color: BLACK,
                  overflow: 'auto',
                  maxHeight: 200
                }}
              >
                <summary style={{ cursor: 'pointer', fontWeight: 700 }}>
                  Error Details
                </summary>
                <pre style={{ marginTop: 12, whiteSpace: 'pre-wrap' }}>
                  {this.state.error?.toString()}
                </pre>
                {this.state.errorInfo && (
                  <pre style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
            )}

            <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
              <button
                onClick={this.handleReset}
                style={{
                  background: BLACK,
                  color: WHITE,
                  border: 'none',
                  borderRadius: 999,
                  padding: '14px 28px',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: FONT,
                  width: '100%'
                }}
              >
                Try Again
              </button>

              <button
                onClick={this.handleReload}
                style={{
                  background: 'transparent',
                  color: GRAY_MEDIUM,
                  border: 'none',
                  borderRadius: 999,
                  padding: '12px 24px',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: FONT
                }}
              >
                Reload Page
              </button>
            </div>
          </div>

          <p
            style={{
              marginTop: 24,
              fontSize: 12,
              color: GRAY_MEDIUM
            }}
          >
            If this problem persists, please contact support.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundary
export const withErrorBoundary = (Component, options = {}) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...options}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

export default ErrorBoundary;
