import { useState, useCallback, useRef, memo, useEffect } from "react";
import "../styles/modern-design.css";

// Modern Design Tokens
const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
const GRAY = "#5F6368";
const GRAY_LIGHT = "#F1F3F4";
const GRAY_MEDIUM = "#80868B";
const BLACK = "#1A1A1A";
const WHITE = "#FFFFFF";
const ACCENT = "#E85D3F";
const ACCENT_LIGHT = "#FFF5F2";

// Icon component
const Icon = ({ name, size = 18, color = BLACK }) => {
  const icons = {
    pin: (
      <>
        <path
          d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
          stroke={color}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx="12"
          cy="10"
          r="3"
          stroke={color}
          strokeWidth="2"
          fill="none"
        />
      </>
    ),
    search: (
      <>
        <circle
          cx="11"
          cy="11"
          r="8"
          stroke={color}
          strokeWidth="2"
          fill="none"
        />
        <line
          x1="21"
          y1="21"
          x2="16.65"
          y2="16.65"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </>
    ),
    x: (
      <>
        <line
          x1="18"
          y1="6"
          x2="6"
          y2="18"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="6"
          y1="6"
          x2="18"
          y2="18"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </>
    ),
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {icons[name] || null}
    </svg>
  );
};

// Separate PredictionList component to isolate re-renders
const PredictionList = memo(({ predictions, onSelect, visible }) => {
  if (!visible || predictions.length === 0) return null;

  return (
    <div
      style={{
        background: WHITE,
        border: `1px solid ${GRAY_LIGHT}`,
        borderRadius: 12,
        marginBottom: 12,
        maxHeight: 200,
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      }}
    >
      {predictions.map((prediction, idx) => (
        <div
          key={prediction.place_id || idx}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSelect(prediction);
          }}
          style={{
            padding: "14px 16px",
            borderBottom: `1px solid ${idx < predictions.length - 1 ? GRAY_LIGHT : "transparent"}`,
            cursor: "pointer",
            fontFamily: FONT,
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            gap: 10,
            transition: "background 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = GRAY_LIGHT)}
          onMouseLeave={(e) => (e.currentTarget.style.background = WHITE)}
        >
          <Icon name="pin" size={16} color={GRAY} />
          <span style={{ color: BLACK }}>{prediction.description}</span>
        </div>
      ))}
    </div>
  );
});

// Stable input component that never re-renders from parent
const StableInput = memo(
  ({ inputRef, onChange, hasError }) => {
    return (
      <div style={{ position: "relative", marginBottom: 12 }}>
        <div
          style={{
            position: "absolute",
            left: 14,
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
          }}
        >
          <Icon name="search" size={18} color={GRAY} />
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search for address, street, suburb, or city..."
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          onChange={onChange}
          style={{
            width: "100%",
            border: `1.5px solid ${hasError ? ACCENT : GRAY_LIGHT}`,
            borderRadius: 12,
            padding: "14px 16px 14px 44px",
            fontSize: 15,
            outline: "none",
            fontFamily: FONT,
            boxSizing: "border-box",
            background: WHITE,
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
      </div>
    );
  },
  () => true,
);

const LocationSearch = memo(({ onSelect }) => {
  const inputRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState([]);

  const displayValueRef = useRef("");
  const isTypingRef = useRef(false);
  const searchTimeoutRef = useRef(null);

  const [, forceUpdate] = useState({});

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handlePredictionSelect = useCallback(
    async (prediction) => {
      try {
        const { geocodeAddress } = await import("../lib/location.js");
        const result = await geocodeAddress(prediction.description);
        if (result.location) {
          const loc = {
            name: prediction.description,
            lat: result.location.lat,
            lng: result.location.lng,
          };
          setSelected(loc);
          displayValueRef.current = prediction.description;
          if (inputRef.current) {
            inputRef.current.value = prediction.description;
          }
          setPredictions([]);
          setError(null);
          onSelect(loc);
        }
      } catch (err) {
        setError("Failed to get coordinates");
        forceUpdate({});
      }
    },
    [onSelect],
  );

  const handleChange = useCallback((e) => {
    const val = e.target.value;
    displayValueRef.current = val;
    setSelected(null);
    setError(null);
    isTypingRef.current = true;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (val.length >= 3) {
      setLoading(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const { searchPlaces } = await import("../lib/location.js");
          const result = await searchPlaces(val);
          if (isTypingRef.current) {
            setPredictions(result.predictions || []);
          }
        } catch (err) {
          if (isTypingRef.current) {
            setPredictions([]);
          }
        } finally {
          if (isTypingRef.current) {
            setLoading(false);
          }
        }
      }, 300);
    } else {
      setPredictions([]);
      setLoading(false);
    }
  }, []);

  const handleContinue = useCallback(async () => {
    const val = displayValueRef.current;

    if (selected) {
      onSelect(selected);
    } else if (val.trim()) {
      try {
        const { geocodeAddress } = await import("../lib/location.js");
        const result = await geocodeAddress(val);
        if (result.location) {
          onSelect({
            name: val,
            lat: result.location.lat,
            lng: result.location.lng,
          });
        } else {
          setError("Please select a valid location");
          forceUpdate({});
        }
      } catch (err) {
        setError("Failed to validate location");
        forceUpdate({});
      }
    }
  }, [selected, onSelect]);

  const handleClear = useCallback(() => {
    setSelected(null);
    displayValueRef.current = "";
    setPredictions([]);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.focus();
    }
  }, []);

  return (
    <>
      <StableInput
        inputRef={inputRef}
        onChange={handleChange}
        hasError={!!error}
      />

      {loading && (
        <div
          style={{
            position: "absolute",
            right: 14,
            top: 14,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              border: `2px solid ${GRAY_LIGHT}`,
              borderTopColor: ACCENT,
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
        </div>
      )}

      <PredictionList
        predictions={predictions}
        onSelect={handlePredictionSelect}
        visible={predictions.length > 0 && !selected}
      />

      {selected && (
        <div
          style={{
            background: ACCENT_LIGHT,
            border: `1.5px solid ${ACCENT}`,
            borderRadius: 12,
            padding: "12px 14px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Icon name="pin" size={16} color={ACCENT} />
          <span
            style={{
              fontFamily: FONT,
              fontSize: 14,
              color: BLACK,
              flex: 1,
              fontWeight: 500,
            }}
          >
            {selected.name}
          </span>
          <button
            onClick={handleClear}
            style={{
              background: "none",
              border: "none",
              color: GRAY,
              cursor: "pointer",
              fontSize: 12,
              padding: "4px 8px",
              fontFamily: FONT,
              fontWeight: 500,
            }}
          >
            Change
          </button>
        </div>
      )}

      {error && (
        <div
          style={{
            color: ACCENT,
            fontSize: 14,
            marginBottom: 16,
            fontFamily: FONT,
            textAlign: "center",
            background: ACCENT_LIGHT,
            padding: "10px",
            borderRadius: 8,
          }}
        >
          {error}
        </div>
      )}

      <button
        onClick={handleContinue}
        disabled={!displayValueRef.current?.trim() && !selected}
        style={{
          width: "100%",
          background:
            !displayValueRef.current?.trim() && !selected ? GRAY_LIGHT : BLACK,
          color:
            !displayValueRef.current?.trim() && !selected ? GRAY_MEDIUM : WHITE,
          border: "none",
          borderRadius: 24,
          padding: "15px 0",
          fontSize: 15,
          fontWeight: 600,
          cursor:
            !displayValueRef.current?.trim() && !selected
              ? "not-allowed"
              : "pointer",
          fontFamily: FONT,
          marginBottom: 12,
          transition: "transform 0.15s ease",
        }}
        onMouseDown={(e) =>
          (displayValueRef.current?.trim() || selected) &&
          (e.currentTarget.style.transform = "scale(0.98)")
        }
        onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        Continue
      </button>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
});

export default LocationSearch;
