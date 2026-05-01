import { useState, useCallback, memo } from 'react';
import {
  BLACK, WHITE, GRAY_LIGHT, GRAY_MEDIUM, WARNING, WARNING_LIGHT, SUCCESS, SUCCESS_LIGHT, FONT,
} from '../lib/theme';

/**
 * EmailVerificationBanner - Reminds users to verify their email
 *
 * Features:
 * - Shows when email is not verified
 * - Resend verification email functionality
 * - Dismissible
 * - Loading state for resend action
 */

/**
 * Email icon
 */
const EmailIcon = memo(() => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
));

EmailIcon.displayName = 'EmailIcon';

/**
 * Check icon
 */
const CheckIcon = memo(() => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20,6 9,17 4,12" />
  </svg>
));

CheckIcon.displayName = 'CheckIcon';

/**
 * X icon for dismiss button
 */
const XIcon = memo(() => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
));

XIcon.displayName = 'XIcon';

/**
 * Loading spinner
 */
const LoadingSpinner = memo(() => (
  <div
    style={{
      width: '14px',
      height: '14px',
      border: '2px solid currentColor',
      borderTopColor: 'transparent',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }}
  >
    <style>{`
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  </div>
));

LoadingSpinner.displayName = 'LoadingSpinner';

/**
 * EmailVerificationBanner component
 */
const EmailVerificationBanner = memo(({
  email,
  onResend,
  onDismiss,
  isSending = false,
  lastSentTime = null,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleDismiss = useCallback(() => {
    setIsDismissed(true);
    onDismiss?.();
  }, [onDismiss]);

  const handleResend = useCallback(async () => {
    const result = await onResend?.();
    if (result?.success) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    }
  }, [onResend]);

  // Calculate cooldown remaining
  const getCooldownRemaining = () => {
    if (!lastSentTime) return 0;
    const cooldownMs = 60000; // 1 minute cooldown
    const elapsed = Date.now() - lastSentTime;
    return Math.max(0, Math.ceil((cooldownMs - elapsed) / 1000));
  };

  const cooldownRemaining = getCooldownRemaining();
  const canResend = !isSending && cooldownRemaining === 0;

  if (isDismissed) return null;

  return (
    <div
      style={{
        backgroundColor: WARNING_LIGHT,
        border: `1px solid ${WARNING_LIGHT}`,
        borderRadius: '12px',
        padding: '12px 14px',
        marginBottom: '16px',
        position: 'relative',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start',
        }}
      >
        {/* Icon */}
        <div
          style={{
            flexShrink: 0,
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            backgroundColor: WHITE,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: WARNING,
          }}
        >
          <EmailIcon />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4
            style={{
              margin: '0 0 4px 0',
              fontSize: '14px',
              fontWeight: 700,
              color: BLACK,
              fontFamily: FONT,
            }}
          >
            Verify your email
          </h4>
          <p
            style={{
              margin: '0 0 10px 0',
              fontSize: '13px',
              color: GRAY_MEDIUM,
              lineHeight: 1.45,
              fontFamily: FONT,
            }}
          >
            Please check your inbox at{' '}
            <strong style={{ color: BLACK }}>{email}</strong> and click
            the verification link to complete your registration.
          </p>

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={handleResend}
              disabled={!canResend || isSending}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                backgroundColor: canResend && !isSending ? BLACK : GRAY_LIGHT,
                color: canResend && !isSending ? WHITE : GRAY_MEDIUM,
                border: 'none',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 700,
                fontFamily: FONT,
                cursor: canResend && !isSending ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s ease',
                opacity: canResend && !isSending ? 1 : 0.7,
              }}
            >
              {isSending ? (
                <>
                  <LoadingSpinner />
                  <span>Sending...\u003c/span>
                </>
              ) : showSuccess ? (
                <>
                  <CheckIcon />
                  <span>Sent!\u003c/span>
                </>
              ) : cooldownRemaining > 0 ? (
                <span>Resend in {cooldownRemaining}s\u003c/span>
              ) : (
                <span>Resend email\u003c/span>
              )}
            </button>
          </div>

          {/* Success message */}
          {showSuccess && (
            <div
              style={{
                marginTop: '8px',
                padding: '8px 12px',
                backgroundColor: SUCCESS_LIGHT,
                borderRadius: '8px',
                fontSize: '12px',
                color: SUCCESS,
                fontWeight: 600,
                animation: 'fadeIn 0.2s ease',
              }}
            >
              <style>{`
                @keyframes fadeIn {
                  from { opacity: 0; transform: translateY(-4px); }
                  to { opacity: 1; transform: translateY(0); }
                }
              `}</style>
              Verification email sent! Please check your inbox.
            </div>
          )}
        </div>

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          style={{
            flexShrink: 0,
            padding: '4px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: GRAY_MEDIUM,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            transition: 'color 0.15s ease, background-color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = BLACK;
            e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = GRAY_MEDIUM;
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <XIcon />
        </button>
      </div>
    </div>
  );
});

EmailVerificationBanner.displayName = 'EmailVerificationBanner';

export default EmailVerificationBanner;
