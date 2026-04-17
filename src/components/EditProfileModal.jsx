import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase";
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
 * EditProfileModal - Modern profile editing modal
 */

const EditProfileModal = ({ open, onClose, user, onProfileUpdated }) => {
  const [businessName, setBusinessName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && user) {
      setBusinessName(user.name || "");
      setError(null);
      setSuccess(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open, user]);

  const validateBusinessName = (name) => {
    if (!name || name.trim().length < 2) {
      return "Business name must be at least 2 characters";
    }
    if (name.length > 100) {
      return "Business name must be less than 100 characters";
    }
    return null;
  };

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError(null);
      setSuccess(false);

      const validationError = validateBusinessName(businessName);
      if (validationError) {
        setError(validationError);
        return;
      }

      if (!user?.id) {
        setError("User not found");
        return;
      }

      setLoading(true);
      try {
        const { data, error: updateError } = await supabase
          .from("businesses")
          .update({
            business_name: businessName.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .select()
          .single();

        if (updateError) {
          console.error("Failed to update business:", updateError);
          setError("Failed to update profile. Please try again.");
          return;
        }

        const { error: metadataError } = await supabase.auth.updateUser({
          data: { business_name: businessName.trim() },
        });

        if (metadataError) {
          console.error("Failed to update user metadata:", metadataError);
        }

        setSuccess(true);
        onProfileUpdated?.(data);

        setTimeout(() => {
          onClose();
        }, 800);
      } catch (err) {
        console.error("Exception updating profile:", err);
        setError("An unexpected error occurred. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [businessName, user, onClose, onProfileUpdated],
  );

  const handleClose = useCallback(() => {
    setError(null);
    setSuccess(false);
    onClose();
  }, [onClose]);

  if (!open) return null;

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
          maxHeight: "80vh",
          overflowY: "auto",
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
          Edit Profile
        </h2>
        <p
          style={{
            fontFamily: FONT,
            fontSize: 15,
            color: GRAY,
            marginBottom: 24,
          }}
        >
          Update your business name and profile information.
        </p>

        {error && (
          <div
            style={{
              background: "#FEE2E2",
              borderRadius: 12,
              padding: "12px 16px",
              marginBottom: 16,
            }}
          >
            <p
              style={{
                fontFamily: FONT,
                fontSize: 14,
                color: "#EA4335",
                margin: 0,
              }}
            >
              {error}
            </p>
          </div>
        )}

        {success && (
          <div
            style={{
              background: "#E8F5E9",
              borderRadius: 12,
              padding: "12px 16px",
              marginBottom: 16,
            }}
          >
            <p
              style={{
                fontFamily: FONT,
                fontSize: 14,
                color: "#34A853",
                margin: 0,
              }}
            >
              Profile updated successfully!
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label
            style={{
              display: "block",
              fontFamily: FONT,
              fontSize: 13,
              fontWeight: 600,
              color: GRAY,
              marginBottom: 8,
            }}
          >
            Business Name
          </label>
          <input
            ref={inputRef}
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Enter your business name"
            disabled={loading}
            style={{
              width: "100%",
              border: `1.5px solid ${error ? ACCENT : GRAY_LIGHT}`,
              borderRadius: 12,
              padding: "14px 16px",
              fontSize: 15,
              marginBottom: 20,
              outline: "none",
              background: WHITE,
              fontFamily: FONT,
              boxSizing: "border-box",
              WebkitAppearance: "none",
              opacity: loading ? 0.7 : 1,
              transition: "border-color 0.15s ease, box-shadow 0.15s ease",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = ACCENT;
              e.target.style.boxShadow = `0 0 0 3px ${ACCENT_LIGHT}`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = error ? ACCENT : GRAY_LIGHT;
              e.target.style.boxShadow = "none";
            }}
          />

          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              style={{
                flex: 1,
                background: GRAY_LIGHT,
                color: BLACK,
                border: "none",
                borderRadius: 24,
                padding: "14px",
                fontSize: 15,
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: FONT,
                opacity: loading ? 0.7 : 1,
                transition: "transform 0.15s ease",
              }}
              onMouseDown={(e) =>
                !loading && (e.currentTarget.style.transform = "scale(0.98)")
              }
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || success}
              style={{
                flex: 1,
                background: BLACK,
                color: WHITE,
                border: "none",
                borderRadius: 24,
                padding: "14px",
                fontSize: 15,
                fontWeight: 600,
                cursor: loading || success ? "not-allowed" : "pointer",
                fontFamily: FONT,
                opacity: loading || success ? 0.7 : 1,
                transition: "transform 0.15s ease",
              }}
              onMouseDown={(e) =>
                !(loading || success) &&
                (e.currentTarget.style.transform = "scale(0.98)")
              }
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }
            >
              {loading ? "Saving…" : success ? "Saved!" : "Save Changes"}
            </button>
          </div>
        </form>
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

export default EditProfileModal;
