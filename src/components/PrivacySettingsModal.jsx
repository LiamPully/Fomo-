import { useState, useCallback, memo } from "react";
import { WHITE, BLACK, GRAY, GRAY_LIGHT, ACCENT, FONT, SHADOW_CARD, OVERLAY_DARK } from "../lib/theme";

// Toggle Switch Component
const Toggle = ({ checked, onChange, label, description }) => {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, padding: "16px 0", borderBottom: `1px solid ${GRAY_LIGHT}` }}>
      <div style={{ flex: 1 }}>
        <p style={{ fontFamily: FONT, fontSize: 15, fontWeight: 500, color: BLACK, margin: "0 0 4px 0" }}>{label}</p>
        {description && <p style={{ fontFamily: FONT, fontSize: 13, color: GRAY, margin: 0, lineHeight: 1.4 }}>{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: 48,
          height: 28,
          borderRadius: 14,
          background: checked ? ACCENT : GRAY_LIGHT,
          border: "none",
          cursor: "pointer",
          position: "relative",
          transition: "background 0.2s ease",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: WHITE,
            position: "absolute",
            top: 3,
            left: checked ? 23 : 3,
            transition: "left 0.2s ease",
            boxShadow: "0 2px 4px SHADOW_CARD",
          }}
        />
      </button>
    </div>
  );
};

const PrivacySettingsModal = ({ open, onClose, user }) => {
  const [settings, setSettings] = useState({
    profileVisible: true,
    showEmail: false,
    showPhone: false,
    allowEventInvites: true,
    allowMessages: true,
    dataSharing: false,
  });
  const [saving, setSaving] = useState(false);

  const handleToggle = useCallback((key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSaving(false);
    onClose();
  }, [onClose]);

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
          <h2 style={{ fontFamily: FONT, fontSize: 22, fontWeight: 700, color: BLACK }}>Privacy Settings</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 8 }}>
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={GRAY} strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <p style={{ fontFamily: FONT, fontSize: 14, color: GRAY, marginBottom: 24 }}>Control who can see your profile and contact you</p>

        {/* Profile Visibility */}
        <div style={{ marginBottom: 8 }}>
          <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: GRAY, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Profile Visibility</p>

          <Toggle
            checked={settings.profileVisible}
            onChange={() => handleToggle("profileVisible")}
            label="Public Profile"
            description="Allow others to view your profile and events"
          />

          <Toggle
            checked={settings.showEmail}
            onChange={() => handleToggle("showEmail")}
            label="Show Email"
            description="Display your email on your public profile"
          />

          <Toggle
            checked={settings.showPhone}
            onChange={() => handleToggle("showPhone")}
            label="Show Phone"
            description="Display your phone number on your public profile"
          />
        </div>

        {/* Communication */}
        <div style={{ marginBottom: 8 }}>
          <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: GRAY, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8, marginTop: 24 }}>Communication</p>

          <Toggle
            checked={settings.allowEventInvites}
            onChange={() => handleToggle("allowEventInvites")}
            label="Event Invites"
            description="Allow others to invite you to events"
          />

          <Toggle
            checked={settings.allowMessages}
            onChange={() => handleToggle("allowMessages")}
            label="Direct Messages"
            description="Allow others to send you direct messages"
          />
        </div>

        {/* Data */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: GRAY, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8, marginTop: 24 }}>Data</p>

          <Toggle
            checked={settings.dataSharing}
            onChange={() => handleToggle("dataSharing")}
            label="Analytics Sharing"
            description="Help us improve by sharing anonymous usage data"
          />
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: "100%",
            padding: "15px",
            borderRadius: 12,
            border: "none",
            background: BLACK,
            color: WHITE,
            fontSize: 15,
            fontWeight: 600,
            cursor: saving ? "not-allowed" : "pointer",
            fontFamily: FONT,
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Saving..." : "Save Preferences"}
        </button>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default memo(PrivacySettingsModal);
