import { useState, useEffect, useRef, useCallback, memo } from "react";
import { supabase } from "../lib/supabase";
import {
  BG, WHITE, BLACK, GRAY, GRAY_LIGHT, GRAY_MEDIUM, ACCENT, ACCENT_LIGHT, FONT,
  SHADOW_CARD, OVERLAY_DARK, ERROR, ERROR_LIGHT,
} from "../lib/theme";
import "../styles/airbnb-inspired.css";

// Optimistic update - closes immediately, syncs in background
const EditProfileModal = ({ open, onClose, user, onProfileUpdated }) => {
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const isMounted = useRef(true);

  // Load user data when modal opens
  useEffect(() => {
    isMounted.current = true;
    if (open && user) {
      setFullName(user.name || "");
      setBio(user.bio || "");
      setPhone(user.phone || "");
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    return () => { isMounted.current = false; };
  }, [open, user]);

  const validate = () => {
    if (!fullName || fullName.trim().length < 2) {
      return "Name must be at least 2 characters";
    }
    if (fullName.length > 100) {
      return "Name must be less than 100 characters";
    }
    return null;
  };

  // Optimistic save - update UI immediately, sync in background
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!user?.id) {
      setError("User not found");
      return;
    }

    const trimmedName = fullName.trim();
    const updates = {
      name: trimmedName,
      bio: bio.trim(),
      phone: phone.trim(),
    };

    // OPTIMISTIC UPDATE: Close modal and update UI immediately
    onClose();
    onProfileUpdated?.(updates);
    setSaving(true);

    // Background sync
    try {
      const promises = [];

      // Update user metadata (fast)
      promises.push(
        supabase.auth.updateUser({
          data: { full_name: trimmedName },
        }).catch(console.error)
      );

      // Update businesses table if user is an organiser
      if (user.userType === 'organiser') {
        promises.push(
          supabase
            .from("businesses")
            .update({
              business_name: trimmedName,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", user.id)
            .then(() => console.log("[EditProfile] Business updated"))
            .catch(err => console.error("[EditProfile] Business update failed:", err))
        );
      }

      // Update profiles table (universal)
      promises.push(
        supabase
          .from("profiles")
          .upsert({
            id: user.id,
            full_name: trimmedName,
            bio: bio.trim(),
            phone: phone.trim(),
            updated_at: new Date().toISOString(),
          })
          .then(() => console.log("[EditProfile] Profile updated"))
          .catch(err => console.error("[EditProfile] Profile update failed:", err))
      );

      await Promise.all(promises);

      if (isMounted.current) {
        setSaving(false);
      }
    } catch (err) {
      console.error("[EditProfile] Update error:", err);
      if (isMounted.current) {
        setSaving(false);
      }
    }
  }, [fullName, bio, phone, user, onClose, onProfileUpdated]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        background: OVERLAY_DARK,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        animation: "fadeIn 0.2s ease",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
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
        <div style={{ width: 36, height: 4, borderRadius: 2, background: GRAY_LIGHT, margin: "0 auto 20px" }} />

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <h2 style={{ fontFamily: FONT, fontSize: 22, fontWeight: 700, color: BLACK }}>
            Edit Profile
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 8 }}>
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={GRAY} strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <p style={{ fontFamily: FONT, fontSize: 14, color: GRAY, marginBottom: 24 }}>
          Update your profile information
        </p>

        {error && (
          <div style={{ background: ERROR_LIGHT, borderRadius: 12, padding: "12px 16px", marginBottom: 16 }}>
            <p style={{ fontFamily: FONT, fontSize: 14, color: ERROR, margin: 0 }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: GRAY, marginBottom: 6 }}>
              Full Name
            </label>
            <input
              ref={inputRef}
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              style={{
                width: "100%",
                border: `1.5px solid ${error ? ACCENT : GRAY_LIGHT}`,
                borderRadius: 12,
                padding: "14px 16px",
                fontSize: 15,
                fontFamily: FONT,
                boxSizing: "border-box",
                outline: "none",
                transition: "border-color 0.15s ease",
              }}
              onFocus={(e) => { e.target.style.borderColor = ACCENT; }}
              onBlur={(e) => { e.target.style.borderColor = error ? ACCENT : GRAY_LIGHT; }}
            />
          </div>

          {/* Bio */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: GRAY, marginBottom: 6 }}>
              Bio (optional)
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself"
              rows={3}
              style={{
                width: "100%",
                border: `1.5px solid ${GRAY_LIGHT}`,
                borderRadius: 12,
                padding: "14px 16px",
                fontSize: 15,
                fontFamily: FONT,
                boxSizing: "border-box",
                outline: "none",
                resize: "none",
                transition: "border-color 0.15s ease",
              }}
              onFocus={(e) => { e.target.style.borderColor = ACCENT; }}
              onBlur={(e) => { e.target.style.borderColor = GRAY_LIGHT; }}
            />
          </div>

          {/* Phone */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: GRAY, marginBottom: 6 }}>
              Phone (optional)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
              style={{
                width: "100%",
                border: `1.5px solid ${GRAY_LIGHT}`,
                borderRadius: 12,
                padding: "14px 16px",
                fontSize: 15,
                fontFamily: FONT,
                boxSizing: "border-box",
                outline: "none",
                transition: "border-color 0.15s ease",
              }}
              onFocus={(e) => { e.target.style.borderColor = ACCENT; }}
              onBlur={(e) => { e.target.style.borderColor = GRAY_LIGHT; }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "15px",
                borderRadius: 12,
                border: `1.5px solid ${GRAY_LIGHT}`,
                background: WHITE,
                color: BLACK,
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: FONT,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: "15px",
                borderRadius: 12,
                border: "none",
                background: BLACK,
                color: WHITE,
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: FONT,
              }}
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* Background save indicator */}
      {saving && (
        <div style={{
          position: "fixed",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          background: OVERLAY_DARK,
          color: WHITE,
          padding: "10px 20px",
          borderRadius: 20,
          fontSize: 13,
          fontFamily: FONT,
          zIndex: 400,
        }}>
          Syncing...
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default memo(EditProfileModal);
