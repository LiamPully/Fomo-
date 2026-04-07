import { useState, useCallback, useRef, useEffect, memo } from 'react';
import '../styles/design-system.css';

const FONT = "'Sora', system-ui, sans-serif";
const GRAY1 = '#888880';
const GRAY2 = '#E4E1DA';
const GRAY3 = '#F7F5F1';
const BLACK = '#111111';
const ORANGE = '#E8783A';
const WHITE = '#FFFFFF';

/**
 * AuthModal - Bulletproof authentication modal with mobile-safe inputs
 *
 * Uses completely uncontrolled inputs to prevent mobile keyboard issues.
 * Values are captured via refs, not React state.
 */

// Stable Input Component - Never re-renders after mount
const StableAuthInput = memo(({
  inputRef,
  type = 'text',
  placeholder,
  hasError,
  autoFocus = false
}) => {
  return (
    <input
      ref={inputRef}
      type={type}
      placeholder={placeholder}
      autoComplete={type === 'password' ? 'current-password' : 'email'}
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck="false"
      autoFocus={autoFocus}
      style={{
        width: '100%',
        border: `1.5px solid ${hasError ? ORANGE : GRAY2}`,
        borderRadius: 14,
        padding: '13px 15px',
        fontSize: 15,
        marginBottom: 12,
        outline: 'none',
        background: GRAY3,
        fontFamily: FONT,
        boxSizing: 'border-box',
        WebkitAppearance: 'none',
        touchAction: 'manipulation',
        transition: 'border-color 0.15s ease',
      }}
      onFocus={(e) => { e.target.style.borderColor = BLACK; }}
      onBlur={(e) => { e.target.style.borderColor = hasError ? ORANGE : GRAY2; }}
    />
  );
}, () => true); // Never re-render

StableAuthInput.displayName = 'StableAuthInput';

const AuthModal = ({ open, onClose, onLogin, onRegister, error: authError, clearError }) => {
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState(null);

  // Use refs for all form values - prevents re-renders during typing
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const passRef = useRef(null);

  // Clear errors when modal opens/closes or mode changes
  useEffect(() => {
    if (open) {
      setLocalError(null);
      if (clearError) clearError();
      // Focus first input after modal opens
      setTimeout(() => {
        if (mode === 'register' && nameRef.current) {
          nameRef.current.focus();
        } else if (emailRef.current) {
          emailRef.current.focus();
        }
      }, 100);
    }
  }, [open, mode, clearError]);

  // Reset form when closing
  const handleClose = useCallback(() => {
    // Clear all inputs
    if (nameRef.current) nameRef.current.value = '';
    if (emailRef.current) emailRef.current.value = '';
    if (passRef.current) passRef.current.value = '';
    setLocalError(null);
    onClose();
  }, [onClose]);

  const validateEmail = (email) => {
    if (!email || !email.trim()) return 'Please enter your email address';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return null;
  };

  const validatePassword = (pass) => {
    if (!pass) return 'Please enter your password';
    if (pass.length < 6) return 'Password must be at least 6 characters';
    return null;
  };

  const validateName = (name) => {
    if (!name || !name.trim()) return 'Please enter your business name';
    if (name.trim().length < 2) return 'Business name must be at least 2 characters';
    return null;
  };

  const submit = useCallback(async () => {
    setLocalError(null);
    if (clearError) clearError();

    // Get values from refs (no re-renders!)
    const email = emailRef.current?.value || '';
    const pass = passRef.current?.value || '';
    const name = nameRef.current?.value || '';

    // Validation
    const emailError = validateEmail(email);
    if (emailError) {
      setLocalError(emailError);
      return;
    }

    const passError = validatePassword(pass);
    if (passError) {
      setLocalError(passError);
      return;
    }

    if (mode === 'register') {
      const nameError = validateName(name);
      if (nameError) {
        setLocalError(nameError);
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await onLogin(email, pass);
      } else {
        await onRegister(email, pass, name);
      }
      // Clear inputs on success
      if (nameRef.current) nameRef.current.value = '';
      if (emailRef.current) emailRef.current.value = '';
      if (passRef.current) passRef.current.value = '';
    } catch (err) {
      setLocalError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [mode, onLogin, onRegister, clearError]);

  const toggleMode = useCallback(() => {
    setMode(prev => prev === 'login' ? 'register' : 'login');
    setLocalError(null);
    if (clearError) clearError();
  }, [clearError]);

  if (!open) return null;

  const displayError = localError || authError;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 90,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        style={{
          background: WHITE,
          borderRadius: '22px 22px 0 0',
          padding: '28px 20px 44px',
          animation: 'slideUp 0.25s ease',
        }}
      >
        <h2 style={{
          fontFamily: FONT,
          fontSize: 22,
          fontWeight: 800,
          color: BLACK,
          marginBottom: 6
        }}>
          {mode === 'login' ? 'Welcome back' : 'Create account'}
        </h2>
        <p style={{
          fontFamily: FONT,
          fontSize: 14,
          color: GRAY1,
          marginBottom: 22
        }}>
          {mode === 'login' ? 'Sign in to your Account.' : 'Join to publish local events.'}
        </p>

        {displayError && (
          <div style={{
            background: '#FEE2E2',
            border: '1px solid #FECACA',
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 16
          }}>
            <p style={{
              fontFamily: FONT,
              fontSize: 13,
              color: '#DC2626',
              margin: 0
            }}>
              {displayError}
            </p>
          </div>
        )}

        {mode === 'register' && (
          <StableAuthInput
            inputRef={nameRef}
            type="text"
            placeholder="Business name"
            hasError={displayError && displayError.toLowerCase().includes('name')}
          />
        )}

        <StableAuthInput
          inputRef={emailRef}
          type="email"
          placeholder="Email address"
          hasError={displayError && displayError.toLowerCase().includes('email')}
          autoFocus={mode === 'login'}
        />

        <StableAuthInput
          inputRef={passRef}
          type="password"
          placeholder="Password"
          hasError={displayError && displayError.toLowerCase().includes('password')}
        />

        <button
          onClick={submit}
          disabled={loading}
          style={{
            width: '100%',
            background: BLACK,
            color: WHITE,
            border: 'none',
            borderRadius: 999,
            padding: 15,
            fontSize: 15,
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: FONT,
            marginBottom: 14,
            opacity: loading ? 0.7 : 1,
            transition: 'opacity 0.15s ease',
          }}
        >
          {loading ? '…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>

        <p style={{
          textAlign: 'center',
          fontFamily: FONT,
          fontSize: 13,
          color: GRAY1
        }}>
          {mode === 'login' ? 'No account? ' : 'Already have one? '}
          <button
            onClick={toggleMode}
            style={{
              background: 'none',
              border: 'none',
              color: BLACK,
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: 13,
              fontFamily: FONT,
              padding: 0,
              marginLeft: 4
            }}
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
