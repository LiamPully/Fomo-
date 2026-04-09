import { useState, useCallback, memo } from 'react';
import { getPasswordValidation } from '../hooks/useAuth';

/**
 * PasswordInput - Production-ready password input with strength meter
 *
 * Features:
 * - Show/hide password toggle
 * - Real-time password strength indicator
 * - Password requirements tooltip
 * - Accessible design
 * - Mobile-friendly
 */

// Colors from design system
const COLORS = {
  gray1: '#888880',
  gray2: '#E4E1DA',
  gray3: '#F7F5F1',
  black: '#111111',
  orange: '#E8783A',
  white: '#FFFFFF',
  success: '#059669',
  warning: '#D97706',
  error: '#DC2626',
};

// Strength colors
const STRENGTH_COLORS = {
  weak: '#DC2626',
  fair: '#D97706',
  good: '#E8783A',
  strong: '#059669',
  excellent: '#059669',
};

// Strength labels
const STRENGTH_LABELS = {
  weak: 'Weak',
  fair: 'Fair',
  good: 'Good',
  strong: 'Strong',
  excellent: 'Excellent',
};

/**
 * Password strength meter component
 */
const StrengthMeter = memo(({ strength, score }) => {
  const segments = 5;
  const filledSegments = Math.min(score, segments);

  return (
    <div
      style={{
        marginTop: '8px',
        marginBottom: '8px',
      }}
    >
      {/* Label */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '6px',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            color: COLORS.gray1,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Password strength
        </span>
        <span
          style={{
            fontSize: '11px',
            color: STRENGTH_COLORS[strength] || COLORS.gray1,
            fontWeight: 700,
          }}
        >
          {STRENGTH_LABELS[strength] || 'Weak'}
        </span>
      </div>

      {/* Bar */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          height: '4px',
        }}
      >
        {Array.from({ length: segments }).map((_, index) => (
          <div
            key={index}
            style={{
              flex: 1,
              height: '100%',
              borderRadius: '2px',
              backgroundColor:
                index < filledSegments
                  ? STRENGTH_COLORS[strength] || COLORS.gray2
                  : COLORS.gray2,
              transition: 'background-color 0.2s ease',
            }}
          />
        ))}
      </div>
    </div>
  );
});

StrengthMeter.displayName = 'StrengthMeter';

/**
 * Password requirements tooltip
 */
const RequirementsTooltip = memo(({ validation, isVisible }) => {
  if (!isVisible) return null;

  const requirements = [
    { key: 'length', label: 'At least 8 characters' },
    { key: 'uppercase', label: 'One uppercase letter' },
    { key: 'lowercase', label: 'One lowercase letter' },
    { key: 'number', label: 'One number' },
    { key: 'special', label: 'One special character (!@#$...)' },
  ];

  return (
    <div
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        marginTop: '8px',
        padding: '12px 14px',
        backgroundColor: COLORS.white,
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        zIndex: 100,
        border: `1px solid ${COLORS.gray2}`,
      }}
    >
      <p
        style={{
          fontSize: '11px',
          fontWeight: 700,
          color: COLORS.black,
          margin: '0 0 8px 0',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        Password requirements
      </p>
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
        }}
      >
        {requirements.map((req) => {
          const isMet = validation[req.key];
          return (
            <li
              key={req.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '3px 0',
                fontSize: '12px',
                color: isMet ? COLORS.success : COLORS.gray1,
                fontWeight: isMet ? 600 : 400,
                transition: 'color 0.15s ease',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  backgroundColor: isMet ? COLORS.success : COLORS.gray2,
                  color: COLORS.white,
                  fontSize: '9px',
                  fontWeight: 700,
                }}
              >
                {isMet ? '✓' : ''}
              </span>
              {req.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
});

RequirementsTooltip.displayName = 'RequirementsTooltip';

/**
 * Eye icon for show/hide toggle
 */
const EyeIcon = memo(({ visible }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: 'block' }}
  >
    {visible ? (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    ) : (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    )}
  </svg>
));

EyeIcon.displayName = 'EyeIcon';

/**
 * Main PasswordInput component
 */
const PasswordInput = memo(({
  value,
  onChange,
  onBlur,
  onFocus,
  placeholder = 'Password',
  error,
  showStrength = true,
  showRequirements = true,
  autoFocus = false,
  disabled = false,
  inputRef,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const validation = getPasswordValidation(value);

  const toggleVisibility = useCallback(() => {
    setIsVisible((prev) => !prev);
  }, []);

  const handleFocus = useCallback((e) => {
    setIsFocused(true);
    setShowTooltip(true);
    onFocus?.(e);
  }, [onFocus]);

  const handleBlur = useCallback((e) => {
    setIsFocused(false);
    // Delay hiding tooltip to allow clicking on it
    setTimeout(() => setShowTooltip(false), 200);
    onBlur?.(e);
  }, [onBlur]);

  const handleChange = useCallback((e) => {
    onChange?.(e.target.value);
  }, [onChange]);

  return (
    <div
      style={{
        position: 'relative',
        marginBottom: error || (showStrength && value) ? '12px' : '12px',
      }}
    >
      {/* Input wrapper */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <input
          ref={inputRef}
          type={isVisible ? 'text' : 'password'}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          autoComplete="current-password"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          autoFocus={autoFocus}
          disabled={disabled}
          style={{
            width: '100%',
            border: `1.5px solid ${error ? COLORS.orange : isFocused ? COLORS.black : COLORS.gray2}`,
            borderRadius: '14px',
            padding: '13px 45px 13px 15px',
            fontSize: '16px',
            outline: 'none',
            background: COLORS.gray3,
            fontFamily: "'Sora', system-ui, sans-serif",
            boxSizing: 'border-box',
            WebkitAppearance: 'none',
            touchAction: 'manipulation',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
            boxShadow: isFocused ? '0 0 0 3px rgba(232, 120, 58, 0.1)' : 'none',
            opacity: disabled ? 0.6 : 1,
          }}
        />

        {/* Show/hide toggle */}
        <button
          type="button"
          onClick={toggleVisibility}
          disabled={disabled}
          aria-label={isVisible ? 'Hide password' : 'Show password'}
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            padding: '6px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            color: COLORS.gray1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            transition: 'color 0.15s ease, background-color 0.15s ease',
            opacity: disabled ? 0.5 : 1,
          }}
          onMouseEnter={(e) => {
            if (!disabled) {
              e.currentTarget.style.color = COLORS.black;
              e.currentTarget.style.backgroundColor = COLORS.gray2;
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = COLORS.gray1;
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <EyeIcon visible={isVisible} />
        </button>
      </div>

      {/* Strength meter */}
      {showStrength && value && (
        <StrengthMeter strength={validation.strength} score={validation.score} />
      )}

      {/* Requirements tooltip */}
      {showRequirements && (
        <RequirementsTooltip
          validation={validation}
          isVisible={showTooltip && !validation.isValid}
        />
      )}
    </div>
  );
});

PasswordInput.displayName = 'PasswordInput';

export default PasswordInput;
export { StrengthMeter, RequirementsTooltip, getPasswordValidation };
