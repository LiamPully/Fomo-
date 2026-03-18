import { useState, useRef, useEffect } from 'react';

const FONT = "'Sora', system-ui, sans-serif";
const GRAY1 = "#888880";
const GRAY2 = "#E4E1DA";
const GRAY3 = "#F7F5F1";
const BLACK = "#111111";
const WHITE = "#FFFFFF";

// Icon component
const I = ({ s = 18, c = "currentColor", children }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none"
    stroke={c} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

const icons = {
  pin: <I><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></I>,
  search: <I><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></I>,
  close: <I><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></I>,
  nav: <I><polygon points="3 11 22 2 13 21 11 13 3 11"/></I>
};

const Ico = ({ n, s = 18, c = "currentColor" }) => {
  const el = icons[n];
  if (!el) return null;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: s, height: s, flexShrink: 0, color: c }}>
      {el}
    </span>
  );
};

export const LocationSearch = ({
  value,
  onChange,
  onSelect,
  onUseCurrentLocation,
  predictions = [],
  loading = false,
  placeholder = "Search location..."
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCurrentLocation, setShowCurrentLocation] = useState(true);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    onChange(e.target.value);
    setIsOpen(true);
    setShowCurrentLocation(e.target.value.length === 0);
  };

  const handleSelect = (prediction) => {
    onSelect(prediction);
    setIsOpen(false);
  };

  const handleUseCurrentLocation = () => {
    if (onUseCurrentLocation) {
      onUseCurrentLocation();
      setIsOpen(false);
    }
  };

  const clearSearch = () => {
    onChange('');
    setShowCurrentLocation(true);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      {/* Search Input */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: GRAY3,
        border: `1.5px solid ${isOpen ? BLACK : GRAY2}`,
        borderRadius: 14,
        padding: "12px 14px",
        transition: "border-color 0.2s"
      }}>
        <Ico n="search" s={18} c={GRAY1} />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          style={{
            flex: 1,
            border: "none",
            background: "transparent",
            fontFamily: FONT,
            fontSize: 15,
            outline: "none",
            color: BLACK
          }}
        />
        {value && (
          <button
            onClick={clearSearch}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <Ico n="close" s={16} c={GRAY1} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          marginTop: 8,
          background: WHITE,
          borderRadius: 14,
          border: `1px solid ${GRAY2}`,
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          zIndex: 100,
          maxHeight: 300,
          overflowY: "auto"
        }}>
          {/* Use Current Location Option */}
          {showCurrentLocation && onUseCurrentLocation && (
            <button
              onClick={handleUseCurrentLocation}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 16px",
                background: "none",
                border: "none",
                borderBottom: `1px solid ${GRAY2}`,
                cursor: "pointer",
                textAlign: "left",
                fontFamily: FONT,
                fontSize: 14,
                color: BLACK
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = GRAY3}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <div style={{
                width: 36,
                height: 36,
                background: "#E8783A20",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}>
                <Ico n="nav" s={18} c="#E8783A" />
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 600 }}>Use my current location</p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: GRAY1 }}>Find events near you</p>
              </div>
            </button>
          )}

          {/* Loading State */}
          {loading && (
            <div style={{ padding: 20, textAlign: "center", color: GRAY1, fontFamily: FONT, fontSize: 14 }}>
              Searching...
            </div>
          )}

          {/* Predictions */}
          {!loading && predictions.length > 0 && (
            <div>
              {predictions.map((prediction, index) => (
                <button
                  key={prediction.place_id || index}
                  onClick={() => handleSelect(prediction)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    background: "none",
                    border: "none",
                    borderBottom: index < predictions.length - 1 ? `1px solid ${GRAY2}` : "none",
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: FONT,
                    fontSize: 14,
                    color: BLACK
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = GRAY3}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <Ico n="pin" s={16} c={GRAY1} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {prediction.description}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* No Results */}
          {!loading && !showCurrentLocation && predictions.length === 0 && value.length >= 3 && (
            <div style={{ padding: 20, textAlign: "center", color: GRAY1, fontFamily: FONT, fontSize: 14 }}>
              No locations found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationSearch;
