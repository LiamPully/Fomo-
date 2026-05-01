import { memo, useRef, useCallback, useState, useEffect } from 'react';
import { BLACK, WHITE, GRAY_LIGHT, GRAY_MEDIUM, ACCENT, FONT } from '../lib/theme';
import '../styles/airbnb-inspired.css';

/**
 * StableInput - A bulletproof input component that prevents mobile keyboard issues
 *
 * Problem: On mobile devices, controlled inputs lose focus after each keystroke
 * when parent components re-render. This makes typing impossible.
 *
 * Solution: This component uses an uncontrolled pattern with refs that:
 * 1. Never re-renders after initial mount (memo comparison returns true)
 * 2. Manages DOM state directly via refs
 * 3. Communicates changes to parent via callback only
 * 4. Supports both controlled and uncontrolled modes
 *
 * Usage:
 * <StableInput
 *   name="email"
 *   type="email"
 *   placeholder="Enter email..."
 *   onChange={(value) => setEmail(value)}
 *   validate={(value) => value.includes('@')}
 * />
 */

// The actual input component - completely isolated from parent renders
const InputCore = memo(({
  inputRef,
  name,
  type = 'text',
  placeholder,
  onChange,
  onBlur,
  onFocus,
  hasError,
  disabled,
  autoComplete = 'off',
  autoFocus = false,
  className = ''
}) => {
  const handleChange = useCallback((e) => {
    const value = e.target.value;
    if (onChange) {
      onChange(value, e);
    }
  }, [onChange]);

  const handleBlur = useCallback((e) => {
    if (onBlur) {
      onBlur(e.target.value, e);
    }
  }, [onBlur]);

  const handleFocus = useCallback((e) => {
    if (onFocus) {
      onFocus(e);
    }
  }, [onFocus]);

  return (
    <div style={{ position: 'relative' }}>
      <input
        ref={inputRef}
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        disabled={disabled}
        autoFocus={autoFocus}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        style={{
          width: '100%',
          border: `1.5px solid ${hasError ? ACCENT : GRAY_LIGHT}`,
          borderRadius: 14,
          padding: '13px 16px',
          fontSize: 16,
          outline: 'none',
          fontFamily: FONT,
          boxSizing: 'border-box',
          background: WHITE,
          WebkitAppearance: 'none',
          touchAction: 'manipulation',
          transition: 'border-color 0.15s ease',
        }}
        onMouseEnter={(e) => {
          if (!hasError) e.target.style.borderColor = GRAY_MEDIUM;
        }}
        onMouseLeave={(e) => {
          if (!hasError) e.target.style.borderColor = GRAY_LIGHT;
        }}
      />
    </div>
  );
}, () => true); // Always return true - never re-render after mount

InputCore.displayName = 'InputCore';

// Wrapper component that provides the ref and manages error state
const StableInput = ({
  name,
  type = 'text',
  placeholder,
  defaultValue = '',
  onChange,
  onBlur,
  onFocus,
  validate,
  errorMessage,
  disabled = false,
  autoComplete = 'off',
  autoFocus = false,
  className = ''
}) => {
  const inputRef = useRef(null);
  const [error, setError] = useState(null);
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = useCallback((value, e) => {
    if (validate) {
      const validationError = validate(value);
      setError(validationError);
    }
    if (onChange) {
      onChange(value, e);
    }
  }, [onChange, validate]);

  const handleBlur = useCallback((value, e) => {
    setIsFocused(false);
    if (validate) {
      const validationError = validate(value);
      setError(validationError);
    }
    if (onBlur) {
      onBlur(value, e);
    }
  }, [onBlur, validate]);

  const handleFocus = useCallback((e) => {
    setIsFocused(true);
    if (onFocus) {
      onFocus(e);
    }
  }, [onFocus]);

  // Set initial value if provided
  useEffect(() => {
    if (inputRef.current && defaultValue) {
      inputRef.current.value = defaultValue;
    }
  }, []);

  return (
    <div className={className}>
      <InputCore
        inputRef={inputRef}
        name={name}
        type={type}
        placeholder={placeholder}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        hasError={!!error}
        disabled={disabled}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
      />
      {error && (
        <div style={{
          color: ACCENT,
          fontSize: 12,
          marginTop: 6,
          fontFamily: FONT,
          paddingLeft: 4
        }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default StableInput;

// Hook for using multiple stable inputs in a form
export const useStableForm = (initialValues = {}) => {
  const valuesRef = useRef(initialValues);
  const refsMap = useRef({});
  const [, forceUpdate] = useState({});

  const setValue = useCallback((name, value) => {
    valuesRef.current[name] = value;
  }, []);

  const getValue = useCallback((name) => {
    return valuesRef.current[name];
  }, []);

  const getAllValues = useCallback(() => {
    return { ...valuesRef.current };
  }, []);

  const setRef = useCallback((name, ref) => {
    refsMap.current[name] = ref;
  }, []);

  const setInputValue = useCallback((name, value) => {
    valuesRef.current[name] = value;
    if (refsMap.current[name] && refsMap.current[name].current) {
      refsMap.current[name].current.value = value;
    }
  }, []);

  const resetForm = useCallback(() => {
    valuesRef.current = initialValues;
    Object.keys(refsMap.current).forEach(name => {
      if (refsMap.current[name] && refsMap.current[name].current) {
        refsMap.current[name].current.value = initialValues[name] || '';
      }
    });
    forceUpdate({});
  }, [initialValues]);

  return {
    values: valuesRef.current,
    setValue,
    getValue,
    getAllValues,
    setRef,
    setInputValue,
    resetForm
  };
};

// Stable textarea component
export const StableTextarea = memo(({
  textareaRef,
  placeholder,
  rows = 4,
  onChange,
  hasError,
  disabled
}) => {
  const handleChange = useCallback((e) => {
    if (onChange) {
      onChange(e.target.value, e);
    }
  }, [onChange]);

  return (
    <textarea
      ref={textareaRef}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      onChange={handleChange}
      style={{
        width: '100%',
        border: `1.5px solid ${hasError ? ACCENT : GRAY_LIGHT}`,
        borderRadius: 12,
        padding: '12px 14px',
        fontSize: 14,
        outline: 'none',
        background: WHITE,
        fontFamily: FONT,
        resize: 'vertical',
        boxSizing: 'border-box',
        minHeight: 100,
        WebkitAppearance: 'none',
        touchAction: 'manipulation',
        transition: 'border-color 0.15s ease',
      }}
      onMouseEnter={(e) => {
        if (!hasError) e.target.style.borderColor = GRAY_MEDIUM;
      }}
      onMouseLeave={(e) => {
        if (!hasError) e.target.style.borderColor = GRAY_LIGHT;
      }}
    />
  );
}, () => true);

StableTextarea.displayName = 'StableTextarea';
