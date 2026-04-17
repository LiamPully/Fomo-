import { useState, useCallback, useRef, useEffect, memo } from "react";
import "../styles/modern-design.css";

// Modern Design Tokens
const BG = "#F8F9FA";
const WHITE = "#FFFFFF";
const BLACK = "#1A1A1A";
const GRAY = "#5F6368";
const GRAY_LIGHT = "#F1F3F4";
const GRAY_MEDIUM = "#80868B";
const ACCENT = "#E85D3F";
const ACCENT_LIGHT = "#FFF5F2";
const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

/**
 * AuthModal - Modern authentication modal with mobile-safe inputs
 *
 * Uses completely uncontrolled inputs to prevent mobile keyboard issues.
 * Values are captured via refs, not React state.
 */

// Stable Input Component - Never re-renders after mount
const StableAuthInput = memo(
  ({ inputRef, type = "text", placeholder, hasError, autoFocus = false }) => {
    return (
      <input
        ref={inputRef}
        type={type}
        placeholder={placeholder}
        autoComplete={type === "password" ? "current-password" : "email"}
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        autoFocus={autoFocus}
        style={{
          width: "100%",
          border: `1.5px solid ${hasError ? ACCENT : GRAY_LIGHT}`,
          borderRadius: 12,
          padding: "14px 16px",
          fontSize: 15,
          marginBottom: 12,
          outline: "none",
          background: WHITE,
          fontFamily: FONT,
          boxSizing: "border-box",
          WebkitAppearance: "none",
          touchAction: "manipulation",
          transition: "border-color 0.15s ease, box-shadow 0.15s ease",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = ACCENT;
          e.target.style.boxShadow = `0 0 0 3px ${ACCENT_LIGHT}`;
        }}
        onBlur={(e) => {
          e.target.style.borderColor = hasError ? ACCENT : GRAY_LIGHT;
          e.target.style.boxShadow = "none";
        }}
      />
    );
  },
  () => true,
);

StableAuthInput.displayName = "StableAuthInput";

const AuthModal = ({
  open,
  onClose,
  onLogin,
  onRegister,
  error: authError,
  clearError,
}) => {
  const [mode, setMode] = useState("login");
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
      setTimeout(() => {
        if (mode === "register" && nameRef.current) {
          nameRef.current.focus();
        } else if (emailRef.current) {
          emailRef.current.focus();
        }
      }, 100);
    }
  }, [open, mode, clearError]);

  // Reset form when closing
  const handleClose = useCallback(() => {
    if (nameRef.current) nameRef.current.value = "";
    if (emailRef.current) emailRef.current.value = "";
    if (passRef.current) passRef.current.value = "";
    setLocalError(null);
    onClose();
  }, [onClose]);

  const validateEmail = (email) => {
    if (!email || !email.trim()) return "Please enter your email address";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return null;
  };

  const validatePassword = (pass) => {
    if (!pass) return "Please enter your password";
    if (pass.length < 6) return "Password must be at least 6 characters";
    return null;
  };

  const validateName = (name) => {
    if (!name || !name.trim()) return "Please enter your business name";
    if (name.trim().length < 2)
      return "Business name must be at least 2 characters";
    return null;
  };

  const submit = useCallback(async () => {
    setLocalError(null);
    if (clearError) clearError();

    const email = emailRef.current?.value || "";
    const pass = passRef.current?.value || "";
    const name = nameRef.current?.value || "";

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

    if (mode === "register") {
      const nameError = validateName(name);
      if (nameError) {
        setLocalError(nameError);
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await onLogin(email, pass);
      } else {
        await onRegister(email, pass, name);
      }
      if (nameRef.current) nameRef.current.value = "";
      if (emailRef.current) emailRef.current.value = "";
      if (passRef.current) passRef.current.value = "";
    } catch (err) {
      setLocalError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [mode, onLogin, onRegister, clearError]);

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === "login" ? "register" : "login"));
    setLocalError(null);
    if (clearError) clearError();
  }, [clearError]);

  if (!open) return null;

  const displayError = localError || authError;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        animation: "fadeIn 0.2s ease",
      }}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        style={{
          background: WHITE,
          borderRadius: "20px 20px 0 0",
          padding: "24px 20px 40px",
          animation: "slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        {/* Handle bar */}
        <div
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            background: GRAY_LIGHT,
            margin: "0 auto 20px",
          }}
        />

        <h2
          style={{
            fontFamily: FONT,
            fontSize: 24,
            fontWeight: 700,
            color: BLACK,
            marginBottom: 6,
          }}
        >
          {mode === "login" ? "Welcome back" : "Create account"}
        </h2>
        <p
          style={{
            fontFamily: FONT,
            fontSize: 15,
            color: GRAY,
            marginBottom: 24,
          }}
        >
          {mode === "login"
            ? "Sign in to manage your events"
            : "Join to publish local events"}
        </p>

        {displayError && (
          <div
            style={{
              background: "#FEE2E2",
              borderRadius: 10,
              padding: "12px 16px",
              marginBottom: 16,
            }}
          >
            <p
              style={{
                fontFamily: FONT,
                fontSize: 13,
                color: "#EA4335",
                margin: 0,
              }}
            >
              {displayError}
            </p>
          </div>
        )}

        {mode === "register" && (
          <StableAuthInput
            inputRef={nameRef}
            type="text"
            placeholder="Business name"
            hasError={
              displayError && displayError.toLowerCase().includes("name")
            }
          />
        )}

        <StableAuthInput
          inputRef={emailRef}
          type="email"
          placeholder="Email address"
          hasError={
            displayError && displayError.toLowerCase().includes("email")
          }
          autoFocus={mode === "login"}
        />

        <StableAuthInput
          inputRef={passRef}
          type="password"
          placeholder="Password"
          hasError={
            displayError && displayError.toLowerCase().includes("password")
          }
        />

        <button
          onClick={submit}
          disabled={loading}
          style={{
            width: "100%",
            background: BLACK,
            color: WHITE,
            border: "none",
            borderRadius: 24,
            padding: "15px",
            fontSize: 16,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: FONT,
            marginTop: 4,
            marginBottom: 16,
            opacity: loading ? 0.7 : 1,
            transition: "transform 0.15s ease, opacity 0.15s ease",
          }}
          onMouseDown={(e) =>
            !loading && (e.currentTarget.style.transform = "scale(0.98)")
          }
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          {loading
            ? "Please wait…"
            : mode === "login"
              ? "Sign in"
              : "Create account"}
        </button>

        <p
          style={{
            textAlign: "center",
            fontFamily: FONT,
            fontSize: 14,
            color: GRAY,
          }}
        >
          {mode === "login" ? "Don't have an account? " : "Already have one? "}
          <button
            onClick={toggleMode}
            style={{
              background: "none",
              border: "none",
              color: ACCENT,
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 14,
              fontFamily: FONT,
              padding: 0,
            }}
          >
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default AuthModal;
