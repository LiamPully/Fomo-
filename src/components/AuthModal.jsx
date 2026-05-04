import { useState, useCallback, useRef, useEffect, memo } from "react";
import {
  BG, WHITE, BLACK, GRAY, GRAY_LIGHT, GRAY_MEDIUM, ACCENT, ACCENT_LIGHT, FONT,
  SHADOW_CARD, OVERLAY_LIGHT, ERROR_LIGHT,
} from "../lib/theme";
import "../styles/airbnb-inspired.css";

// User Types Configuration
const USER_TYPES = [
  {
    id: "event_goer",
    emoji: "🎉",
    title: "Event Goer",
    description: "Discover and attend local events",
  },
  {
    id: "organiser",
    emoji: "🏢",
    title: "Business / Organiser",
    description: "Host and manage events",
  },
  {
    id: "corporate",
    emoji: "🤝",
    title: "Corporate",
    description: "Buy tickets for your team",
  },
];

// Business Types
const BUSINESS_TYPES = [
  { value: "", label: "Select business type" },
  { value: "venue", label: "Venue / Event Space" },
  { value: "promoter", label: "Event Promoter" },
  { value: "artist", label: "Artist / Performer" },
  { value: "food", label: "Food & Beverage" },
  { value: "retail", label: "Retail / Market" },
  { value: "nonprofit", label: "Non-Profit / Community" },
  { value: "other", label: "Other" },
];

// Industries
const INDUSTRIES = [
  { value: "", label: "Select industry" },
  { value: "tech", label: "Technology" },
  { value: "finance", label: "Finance / Banking" },
  { value: "healthcare", label: "Healthcare" },
  { value: "education", label: "Education" },
  { value: "retail", label: "Retail" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "consulting", label: "Consulting" },
  { value: "media", label: "Media / Entertainment" },
  { value: "hospitality", label: "Hospitality" },
  { value: "other", label: "Other" },
];

// Company Sizes
const COMPANY_SIZES = [
  { value: "", label: "Select size" },
  { value: "1-10", label: "1-10 employees" },
  { value: "11-50", label: "11-50 employees" },
  { value: "51-200", label: "51-200 employees" },
  { value: "200+", label: "200+ employees" },
];

/**
 * AuthModal - Multi-step authentication with user type selection
 *
 * Step 1: Choose user type
 * Step 2: Enter details (fields vary by type)
 */

// Input Component with error handling
const FormInput = memo(
  ({
    inputRef,
    type = "text",
    placeholder,
    hasError,
    errorMessage,
    autoFocus = false,
    onBlur,
  }) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
      <div style={{ marginBottom: hasError ? 8 : 16 }}>
        <div style={{ position: "relative" }}>
          <input
            ref={inputRef}
            type={inputType}
            placeholder={placeholder}
            autoComplete={isPassword ? "new-password" : "email"}
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
              outline: "none",
              background: WHITE,
              fontFamily: FONT,
              boxSizing: "border-box",
              WebkitAppearance: "none",
              touchAction: "manipulation",
              transition: "border-color 0.15s ease, box-shadow 0.15s ease",
              paddingRight: isPassword ? 50 : 16,
            }}
            onFocus={(e) => {
              e.target.style.borderColor = ACCENT;
              e.target.style.boxShadow = `0 0 0 3px ${ACCENT_LIGHT}`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = hasError ? ACCENT : GRAY_LIGHT;
              e.target.style.boxShadow = "none";
              if (onBlur) onBlur(e);
            }}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 4,
                color: GRAY,
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          )}
        </div>
        {hasError && errorMessage && (
          <p
            style={{
              fontSize: 12,
              color: ACCENT,
              margin: "4px 0 0 0",
              fontFamily: FONT,
            }}
          >
            {errorMessage}
          </p>
        )}
      </div>
    );
  },
);

FormInput.displayName = "FormInput";

// Select/Dropdown Component
const FormSelect = memo(({ selectRef, options, hasError, errorMessage }) => {
  return (
    <div style={{ marginBottom: hasError ? 8 : 16 }}>
      <select
        ref={selectRef}
        style={{
          width: "100%",
          border: `1.5px solid ${hasError ? ACCENT : GRAY_LIGHT}`,
          borderRadius: 12,
          padding: "14px 16px",
          fontSize: 15,
          outline: "none",
          background: WHITE,
          fontFamily: FONT,
          boxSizing: "border-box",
          WebkitAppearance: "none",
          MozAppearance: "none",
          appearance: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%235F6368' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 16px center",
          paddingRight: 40,
          cursor: "pointer",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = ACCENT;
          e.target.style.boxShadow = `0 0 0 3px ${ACCENT_LIGHT}`;
        }}
        onBlur={(e) => {
          e.target.style.borderColor = hasError ? ACCENT : GRAY_LIGHT;
          e.target.style.boxShadow = "none";
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {hasError && errorMessage && (
        <p
          style={{
            fontSize: 12,
            color: ACCENT,
            margin: "4px 0 0 0",
            fontFamily: FONT,
          }}
        >
          {errorMessage}
        </p>
      )}
    </div>
  );
});

FormSelect.displayName = "FormSelect";

// User Type Card Component
const UserTypeCard = memo(({ type, isSelected, onSelect }) => {
  return (
    <button
      onClick={() => onSelect(type.id)}
      style={{
        width: "100%",
        padding: "20px 16px",
        borderRadius: 16,
        border: `2px solid ${isSelected ? ACCENT : GRAY_LIGHT}`,
        background: isSelected ? ACCENT_LIGHT : WHITE,
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.2s ease",
        marginBottom: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <span style={{ fontSize: 32 }}>{type.emoji}</span>
        <div>
          <h3
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: BLACK,
              margin: "0 0 4px 0",
              fontFamily: FONT,
            }}
          >
            {type.title}
          </h3>
          <p
            style={{
              fontSize: 13,
              color: GRAY,
              margin: 0,
              fontFamily: FONT,
            }}
          >
            {type.description}
          </p>
        </div>
      </div>
    </button>
  );
});

UserTypeCard.displayName = "UserTypeCard";

// Step Indicator
const StepIndicator = memo(({ currentStep, totalSteps }) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: 8,
        marginBottom: 24,
      }}
    >
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i + 1 === currentStep ? 24 : 8,
            height: 8,
            borderRadius: 4,
            background: i + 1 <= currentStep ? ACCENT : GRAY_LIGHT,
            transition: "all 0.3s ease",
          }}
        />
      ))}
    </div>
  );
});

StepIndicator.displayName = "StepIndicator";

const AuthModal = ({
  open,
  onClose,
  onLogin,
  onRegister,
  error: authError,
  clearError,
}) => {
  const [mode, setMode] = useState("login");
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [localError, setLocalError] = useState(null);
  const [keepSignedIn, setKeepSignedIn] = useState(false);

  // Form refs
  const fullNameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  const businessNameRef = useRef(null);
  const businessTypeRef = useRef(null);
  const businessLocationRef = useRef(null);
  const websiteRef = useRef(null);
  const companyNameRef = useRef(null);
  const industryRef = useRef(null);
  const companySizeRef = useRef(null);

  // Clear errors when modal opens/closes
  useEffect(() => {
    if (open) {
      setLocalError(null);
      setFieldErrors({});
      if (clearError) clearError();
    }
  }, [open, clearError]);

  // Reset form when closing
  const handleClose = useCallback(() => {
    setMode("login");
    setStep(1);
    setUserType(null);
    setLocalError(null);
    setFieldErrors({});
    // Clear all refs
    [
      fullNameRef,
      emailRef,
      passwordRef,
      confirmPasswordRef,
      businessNameRef,
      businessTypeRef,
      businessLocationRef,
      websiteRef,
      companyNameRef,
      industryRef,
      companySizeRef,
    ].forEach((ref) => {
      if (ref.current) ref.current.value = "";
    });
    onClose();
  }, [onClose]);

  // Validation helpers
  const validateEmail = (email) => {
    if (!email || !email.trim()) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Please enter a valid email";
    return null;
  };

  const validatePassword = (pass) => {
    if (!pass) return "Password is required";
    if (pass.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(pass)) return "Password must contain an uppercase letter";
    if (!/[a-z]/.test(pass)) return "Password must contain a lowercase letter";
    if (!/[0-9]/.test(pass)) return "Password must contain a number";
    return null;
  };

  const validateConfirmPassword = (pass, confirm) => {
    if (!confirm) return "Please confirm your password";
    if (pass !== confirm) return "Passwords do not match";
    return null;
  };

  const validateName = (name) => {
    if (!name || !name.trim()) return "Full name is required";
    if (name.trim().length < 2) return "Name must be at least 2 characters";
    return null;
  };

  // Handle user type selection
  const handleUserTypeSelect = (type) => {
    setUserType(type);
    setLocalError(null);
  };

  // Continue to step 2
  const handleContinue = () => {
    if (!userType) {
      setLocalError("Please select an option to continue");
      return;
    }
    setStep(2);
    setLocalError(null);
  };

  // Go back to step 1
  const handleBack = () => {
    setStep(1);
    setLocalError(null);
    setFieldErrors({});
  };

  // Switch between login and register
  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === "login" ? "register" : "login"));
    setStep(1);
    setUserType(null);
    setLocalError(null);
    setFieldErrors({});
    if (clearError) clearError();
  }, [clearError]);

  // Validate all fields based on user type
  const validateForm = () => {
    const errors = {};

    // Common fields
    const nameError = validateName(fullNameRef.current?.value);
    if (nameError) errors.fullName = nameError;

    const emailError = validateEmail(emailRef.current?.value);
    if (emailError) errors.email = emailError;

    const passError = validatePassword(passwordRef.current?.value);
    if (passError) errors.password = passError;

    const confirmError = validateConfirmPassword(
      passwordRef.current?.value,
      confirmPasswordRef.current?.value,
    );
    if (confirmError) errors.confirmPassword = confirmError;

    // Type-specific fields
    if (userType === "organiser") {
      if (!businessNameRef.current?.value?.trim()) {
        errors.businessName = "Business name is required";
      }
      if (!businessTypeRef.current?.value) {
        errors.businessType = "Business type is required";
      }
    }

    if (userType === "corporate") {
      if (!companyNameRef.current?.value?.trim()) {
        errors.companyName = "Company name is required";
      }
      if (!industryRef.current?.value) {
        errors.industry = "Industry is required";
      }
      if (!companySizeRef.current?.value) {
        errors.companySize = "Company size is required";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit registration
  const submitRegistration = useCallback(async () => {
    if (loading) return;
    if (!validateForm()) return;

    setLoading(true);
    setLocalError(null);

    const registrationData = {
      email: emailRef.current?.value?.trim(),
      password: passwordRef.current?.value,
      fullName: fullNameRef.current?.value?.trim(),
      userType: userType,
    };

    // Add type-specific fields
    if (userType === "organiser") {
      registrationData.businessName = businessNameRef.current?.value?.trim();
      registrationData.businessType = businessTypeRef.current?.value;
      registrationData.businessLocation = businessLocationRef.current?.value?.trim();
      registrationData.website = websiteRef.current?.value?.trim();
    }

    if (userType === "corporate") {
      registrationData.companyName = companyNameRef.current?.value?.trim();
      registrationData.industry = industryRef.current?.value;
      registrationData.companySize = companySizeRef.current?.value;
    }

    try {
      await onRegister(registrationData);
      // Reset form on success
      handleClose();
    } catch (err) {
      setLocalError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [userType, onRegister, handleClose]);

  // Submit login
  const submitLogin = useCallback(async () => {
    if (loading) return;
    const email = emailRef.current?.value || "";
    const pass = passwordRef.current?.value || "";

    const errors = {};
    const emailError = validateEmail(email);
    if (emailError) errors.email = emailError;

    // For login, only validate that password is non-empty (strength is enforced at signup only)
    if (!pass) errors.password = "Password is required";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    setLocalError(null);

    try {
      await onLogin(email, pass, keepSignedIn);
      handleClose();
    } catch (err) {
      setLocalError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [onLogin, handleClose, keepSignedIn]);

  // Handle field blur for real-time validation
  const handleFieldBlur = (fieldName, validator) => {
    return (e) => {
      const error = validator(e.target.value);
      setFieldErrors((prev) => ({
        ...prev,
        [fieldName]: error,
      }));
    };
  };

  if (!open) return null;

  const displayError = localError || authError;

  // Step 1: User Type Selection
  const renderStep1 = () => (
    <>
      <h2
        style={{
          fontFamily: FONT,
          fontSize: 22,
          fontWeight: 700,
          color: BLACK,
          marginBottom: 6,
          textAlign: "center",
        }}
      >
        How will you use Fomoza?
      </h2>
      <p
        style={{
          fontFamily: FONT,
          fontSize: 14,
          color: GRAY,
          marginBottom: 24,
          textAlign: "center",
        }}
      >
        Choose the option that best describes you
      </p>

      {displayError && (
        <div
          style={{
            background: ERROR_LIGHT,
            borderRadius: 10,
            padding: "12px 16px",
            marginBottom: 16,
          }}
        >
          <p
            style={{
              fontFamily: FONT,
              fontSize: 13,
              color: ACCENT,
              margin: 0,
            }}
          >
            {displayError}
          </p>
        </div>
      )}

      {USER_TYPES.map((type) => (
        <UserTypeCard
          key={type.id}
          type={type}
          isSelected={userType === type.id}
          onSelect={handleUserTypeSelect}
        />
      ))}

      <button
        onClick={handleContinue}
        disabled={!userType || loading}
        style={{
          width: "100%",
          background: BLACK,
          color: WHITE,
          border: "none",
          borderRadius: 24,
          padding: "15px",
          fontSize: 16,
          fontWeight: 600,
          cursor: !userType || loading ? "not-allowed" : "pointer",
          fontFamily: FONT,
          marginTop: 8,
          opacity: !userType || loading ? 0.5 : 1,
          transition: "transform 0.15s ease, opacity 0.15s ease",
        }}
        onMouseDown={(e) =>
          userType && !loading && (e.currentTarget.style.transform = "scale(0.98)")
        }
        onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        Continue
      </button>

      <p
        style={{
          textAlign: "center",
          fontFamily: FONT,
          fontSize: 14,
          color: GRAY,
          marginTop: 16,
        }}
      >
        Already have an account?{" "}
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
          Sign in
        </button>
      </p>
    </>
  );

  // Step 2: Details Form
  const renderStep2 = () => {
    const typeLabel =
      userType === "event_goer"
        ? "Event Goer"
        : userType === "organiser"
          ? "Business / Organiser"
          : "Corporate";

    return (
      <>
        {/* Back Button */}
        <button
          onClick={handleBack}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: GRAY,
            fontSize: 14,
            fontFamily: FONT,
            fontWeight: 500,
          }}
        >
          ← Back
        </button>

        <h2
          style={{
            fontFamily: FONT,
            fontSize: 22,
            fontWeight: 700,
            color: BLACK,
            marginBottom: 6,
          }}
        >
          Create your account
        </h2>
        <p
          style={{
            fontFamily: FONT,
            fontSize: 14,
            color: GRAY,
            marginBottom: 24,
          }}
        >
          {typeLabel} account
        </p>

        {displayError && (
          <div
            style={{
              background: ERROR_LIGHT,
              borderRadius: 10,
              padding: "12px 16px",
              marginBottom: 16,
            }}
          >
            <p
              style={{
                fontFamily: FONT,
                fontSize: 13,
                color: ACCENT,
                margin: 0,
              }}
            >
              {displayError}
            </p>
          </div>
        )}

        {/* Full Name */}
        <FormInput
          inputRef={fullNameRef}
          type="text"
          placeholder="Full Name"
          hasError={!!fieldErrors.fullName}
          errorMessage={fieldErrors.fullName}
          autoFocus
          onBlur={handleFieldBlur("fullName", validateName)}
        />

        {/* Email */}
        <FormInput
          inputRef={emailRef}
          type="email"
          placeholder="Email address"
          hasError={!!fieldErrors.email}
          errorMessage={fieldErrors.email}
          onBlur={handleFieldBlur("email", validateEmail)}
        />

        {/* Password */}
        <FormInput
          inputRef={passwordRef}
          type="password"
          placeholder="Password"
          hasError={!!fieldErrors.password}
          errorMessage={fieldErrors.password}
          onBlur={handleFieldBlur("password", validatePassword)}
        />

        {/* Confirm Password */}
        <FormInput
          inputRef={confirmPasswordRef}
          type="password"
          placeholder="Confirm Password"
          hasError={!!fieldErrors.confirmPassword}
          errorMessage={fieldErrors.confirmPassword}
        />

        {/* Business / Organiser Fields */}
        {userType === "organiser" && (
          <>
            <div style={{ marginTop: 8 }} />
            <FormInput
              inputRef={businessNameRef}
              type="text"
              placeholder="Business Name"
              hasError={!!fieldErrors.businessName}
              errorMessage={fieldErrors.businessName}
            />
            <FormSelect
              selectRef={businessTypeRef}
              options={BUSINESS_TYPES}
              hasError={!!fieldErrors.businessType}
              errorMessage={fieldErrors.businessType}
            />
            <FormInput
              inputRef={businessLocationRef}
              type="text"
              placeholder="Business Location / City (Optional)"
              hasError={!!fieldErrors.businessLocation}
              errorMessage={fieldErrors.businessLocation}
            />
            <FormInput
              inputRef={websiteRef}
              type="text"
              placeholder="Website or Social Link (Optional)"
              hasError={!!fieldErrors.website}
              errorMessage={fieldErrors.website}
            />
          </>
        )}

        {/* Corporate Fields */}
        {userType === "corporate" && (
          <>
            <div style={{ marginTop: 8 }} />
            <FormInput
              inputRef={companyNameRef}
              type="text"
              placeholder="Company Name"
              hasError={!!fieldErrors.companyName}
              errorMessage={fieldErrors.companyName}
            />
            <FormSelect
              selectRef={industryRef}
              options={INDUSTRIES}
              hasError={!!fieldErrors.industry}
              errorMessage={fieldErrors.industry}
            />
            <FormSelect
              selectRef={companySizeRef}
              options={COMPANY_SIZES}
              hasError={!!fieldErrors.companySize}
              errorMessage={fieldErrors.companySize}
            />
          </>
        )}

        <button
          onClick={submitRegistration}
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
            marginTop: 8,
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
          {loading ? "Creating account…" : "Create Account"}
        </button>

        <p
          style={{
            textAlign: "center",
            fontFamily: FONT,
            fontSize: 14,
            color: GRAY,
          }}
        >
          Already have an account?{" "}
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
            Sign in
          </button>
        </p>
      </>
    );
  };

  // Login Form
  const renderLogin = () => (
    <>
      <h2
        style={{
          fontFamily: FONT,
          fontSize: 24,
          fontWeight: 700,
          color: BLACK,
          marginBottom: 6,
        }}
      >
        Welcome back
      </h2>
      <p
        style={{
          fontFamily: FONT,
          fontSize: 15,
          color: GRAY,
          marginBottom: 24,
        }}
      >
        Sign in to continue
      </p>

      {displayError && (
        <div
          style={{
            background: ERROR_LIGHT,
            borderRadius: 10,
            padding: "12px 16px",
            marginBottom: 16,
          }}
        >
          <p
            style={{
              fontFamily: FONT,
              fontSize: 13,
              color: ACCENT,
              margin: 0,
            }}
          >
            {displayError}
          </p>
        </div>
      )}

      <FormInput
        inputRef={emailRef}
        type="email"
        placeholder="Email address"
        hasError={!!fieldErrors.email}
        errorMessage={fieldErrors.email}
        autoFocus
      />

      <FormInput
        inputRef={passwordRef}
        type="password"
        placeholder="Password"
        hasError={!!fieldErrors.password}
        errorMessage={fieldErrors.password}
      />

      {/* Keep me signed in checkbox */}
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 16,
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <input
          type="checkbox"
          checked={keepSignedIn}
          onChange={(e) => setKeepSignedIn(e.target.checked)}
          style={{
            width: 18,
            height: 18,
            accentColor: ACCENT,
            cursor: "pointer",
          }}
        />
        <span
          style={{
            fontFamily: FONT,
            fontSize: 14,
            color: GRAY,
          }}
        >
          Keep me signed in
        </span>
      </label>

      <button
        onClick={submitLogin}
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
        {loading ? "Please wait…" : "Sign in"}
      </button>

      <p
        style={{
          textAlign: "center",
          fontFamily: FONT,
          fontSize: 14,
          color: GRAY,
        }}
      >
        Don't have an account?{" "}
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
          Sign up
        </button>
      </p>
    </>
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: OVERLAY_LIGHT,
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
          maxHeight: "90vh",
          overflowY: "auto",
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

        {/* Step indicator for registration */}
        {mode === "register" && (
          <StepIndicator currentStep={step} totalSteps={2} />
        )}

        {/* Content */}
        {mode === "login" ? renderLogin() : step === 1 ? renderStep1() : renderStep2()}
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
