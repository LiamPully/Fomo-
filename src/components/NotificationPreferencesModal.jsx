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

const NotificationPreferencesModal = ({ open, onClose, user }) => {
  const [settings, setSettings] = useState({
    // Email notifications
    emailEventReminders: true,
    emailNewEvents: true,
    emailEventUpdates: true,
    emailPromotions: false,
    emailWeeklyDigest: true,

    // Push notifications
    pushEventReminders: true,
    pushMessages: true,
    pushEventInvites: true,
    pushNearYou: false,
    pushPriceDrops: true,
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
          <h2 style={{ fontFamily: FONT, fontSize: 22, fontWeight: 700, color: BLACK }}>Notifications</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 8 }}>
            <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={GRAY} strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <p style={{ fontFamily: FONT, fontSize: 14, color: GRAY, marginBottom: 24 }}>Choose what notifications you receive and how</p>

        {/* Email Notifications */}
        <div style={{ marginBottom: 8 }}>
          <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: GRAY, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Email Notifications</p>

          <Toggle
            checked={settings.emailEventReminders}
            onChange={() => handleToggle("emailEventReminders")}
            label="Event Reminders"
            description="Get reminded about events you're attending"
          />

          <Toggle
            checked={settings.emailNewEvents}
            onChange={() => handleToggle("emailNewEvents")}
            label="New Events"
            description="Be notified when events are posted in your area"
          />

          <Toggle
            checked={settings.emailEventUpdates}
            onChange={() => handleToggle("emailEventUpdates")}
            label="Event Updates"
            description="Changes to events you're following"
          />

          <Toggle
            checked={settings.emailPromotions}
            onChange={() => handleToggle("emailPromotions")}
            label="Promotions & Offers"
            description="Exclusive deals and promotional events"
          />

          <Toggle
            checked={settings.emailWeeklyDigest}
            onChange={() => handleToggle("emailWeeklyDigest")}
            label="Weekly Digest"
            description="A summary of events happening this week"
          />
        </div>

        {/* Push Notifications */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: GRAY, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8, marginTop: 24 }}>Push Notifications</p>

          <Toggle
            checked={settings.pushEventReminders}
            onChange={() => handleToggle("pushEventReminders")}
            label="Event Reminders"
            description="Real-time reminders before events start"
          />

          <Toggle
            checked={settings.pushMessages}
            onChange={() => handleToggle("pushMessages")}
            label="Messages"
            description="New messages from organizers and attendees"
          />

          <Toggle
            checked={settings.pushEventInvites}
            onChange={() => handleToggle("pushEventInvites")}
            label="Event Invites"
            description="When someone invites you to an event"
          />

          <Toggle
            checked={settings.pushNearYou}
            onChange={() => handleToggle("pushNearYou")}
            label="Events Near You"
            description="Discover events happening nearby"
          />

          <Toggle
            checked={settings.pushPriceDrops}
            onChange={() => handleToggle("pushPriceDrops")}
            label="Price Drops"
            description="When ticket prices drop for events you're watching"
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

export default memo(NotificationPreferencesModal);
