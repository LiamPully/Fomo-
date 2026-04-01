// Role Selection Component
// Shown after login/signup if user hasn't selected a role

import { useState } from 'react';

const BG = "#F0EDE6";
const WHITE = "#FFFFFF";
const BLACK = "#111111";
const ORANGE = "#E8783A";
const GRAY1 = "#888880";
const GRAY2 = "#E4E1DA";
const FONT = "'Sora', system-ui, sans-serif";

export default function RoleSelection({ onSelect, onSkip }) {
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!selected) return;
    setLoading(true);
    await onSelect(selected);
    setLoading(false);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: BG,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: FONT,
      }}
    >
      <div style={{ maxWidth: 400, width: "100%", textAlign: "center" }}>
        {/* Header */}
        <h1
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: BLACK,
            marginBottom: 8,
            lineHeight: 1.2,
          }}
        >
          How will you use Fomo?
        </h1>
        <p
          style={{
            fontSize: 14,
            color: GRAY1,
            marginBottom: 32,
          }}
        >
          Select your account type to get started
        </p>

        {/* Options */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
          {/* Customer Option */}
          <button
            onClick={() => setSelected("customer")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "20px",
              background: WHITE,
              border: `2px solid ${selected === "customer" ? ORANGE : GRAY2}`,
              borderRadius: 16,
              cursor: "pointer",
              transition: "all 0.2s ease",
              textAlign: "left",
              width: "100%",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: selected === "customer" ? "#FFF7ED" : GRAY2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                flexShrink: 0,
              }}
            >
              👤
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: BLACK,
                  marginBottom: 4,
                }}
              >
                Customer
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: GRAY1,
                  lineHeight: 1.4,
                }}
              >
                Browse events, save favorites, and discover local happenings
              </div>
            </div>
            {selected === "customer" && (
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: ORANGE,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7L5.5 10.5L12 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </button>

          {/* Business Option */}
          <button
            onClick={() => setSelected("business")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "20px",
              background: WHITE,
              border: `2px solid ${selected === "business" ? ORANGE : GRAY2}`,
              borderRadius: 16,
              cursor: "pointer",
              transition: "all 0.2s ease",
              textAlign: "left",
              width: "100%",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: selected === "business" ? "#FFF7ED" : GRAY2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                flexShrink: 0,
              }}
            >
              🏢
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: BLACK,
                  marginBottom: 4,
                }}
              >
                Business
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: GRAY1,
                  lineHeight: 1.4,
                }}
              >
                Publish events, manage your listings, and reach customers
              </div>
            </div>
            {selected === "business" && (
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: ORANGE,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7L5.5 10.5L12 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </button>
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={!selected || loading}
          style={{
            width: "100%",
            padding: "16px",
            background: selected ? BLACK : GRAY2,
            color: WHITE,
            border: "none",
            borderRadius: 999,
            fontSize: 15,
            fontWeight: 700,
            cursor: selected ? "pointer" : "not-allowed",
            fontFamily: FONT,
            marginBottom: 16,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "..." : "Continue"}
        </button>

        {/* Skip Option */}
        {onSkip && (
          <button
            onClick={onSkip}
            style={{
              background: "none",
              border: "none",
              color: GRAY1,
              fontSize: 14,
              fontFamily: FONT,
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
}
