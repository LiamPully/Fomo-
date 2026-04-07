import { Component } from 'react';
import '../styles/design-system.css';

const FONT = "'Sora', system-ui, sans-serif";
const BLACK = '#111111';
const WHITE = '#FFFFFF';
const ORANGE = '#E8783A';
const GRAY1 = '#888880';
const GRAY3 = '#F7F5F1';

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
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });

    // In production, send to error reporting service
    if (import.meta.env.PROD) {
      // Example: Sentry, LogRocket, etc.
      // Sentry.captureException(error, { extra: errorInfo });
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
            background: '#F0EDE6',
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
              boxShadow: '0 4px 24px rgba(0,0,0,0.1)'
            }}
          >
            {/* Error Icon */}
            <div
              style={{
                width: 72,
                height: 72,
                background: '#FEE2E2',
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
                stroke="#DC2626"
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
                color: GRAY1,
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
                  background: GRAY3,
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
                  color: GRAY1,
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
              color: GRAY1
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
