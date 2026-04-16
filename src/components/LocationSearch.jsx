import { useState, useCallback, useRef, memo, useEffect } from 'react';

const FONT = "'Sora', system-ui, sans-serif";
const GRAY1 = "#888880";
const GRAY2 = "#E4E1DA";
const GRAY3 = "#F7F5F1";
const BLACK = "#111111";
const WHITE = "#FFFFFF";
const ORANGE = "#E8783A";

// Icon component
const I = ({ s = 18, c = "currentColor", children }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none"
    stroke={c} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

const icons = {
  pin: <I><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></I>,
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

// Separate PredictionList component to isolate re-renders
const PredictionList = memo(({ predictions, onSelect, visible }) => {
  if (!visible || predictions.length === 0) return null;

  return (
    <div style={{
      background: "#fff",
      border: `1px solid ${GRAY2}`,
      borderRadius: 12,
      marginBottom: 12,
      maxHeight: 200,
      overflowY: "auto",
      WebkitOverflowScrolling: "touch"
    }}>
      {predictions.map((prediction, idx) => (
        <div
          key={prediction.place_id || idx}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSelect(prediction);
          }}
          style={{
            padding: "12px 16px",
            borderBottom: `1px solid ${idx < predictions.length - 1 ? GRAY2 : "transparent"}`,
            cursor: "pointer",
            fontFamily: FONT,
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            gap: 8
          }}
        >
          <Ico n="pin" s={14} c={GRAY1}/>
          <span>{prediction.description}</span>
        </div>
      ))}
    </div>
  );
});

// Stable input component that never re-renders from parent
const StableInput = memo(({ inputRef, onChange, hasError }) => {
  // This component never re-renders after initial mount
  // It manages its own DOM state
  return (
    <div style={{position: "relative", marginBottom: 12}}>
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
          border: `1.5px solid ${hasError ? "#E8783A" : GRAY2}`,
          borderRadius: 14,
          padding: "13px 16px",
          fontSize: 16,
          outline: "none",
          fontFamily: FONT,
          boxSizing: "border-box",
          background: GRAY3,
          WebkitAppearance: "none",
          touchAction: "manipulation"
        }}
      />
    </div>
  );
}, () => true); // Always return true for comparison - never re-render

const LocationSearch = memo(({ onSelect }) => {
  // Use ref for input to prevent re-render focus loss
  const inputRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState([]);

  // Store display value in ref to avoid re-renders during typing
  const displayValueRef = useRef("");
  const isTypingRef = useRef(false);
  const searchTimeoutRef = useRef(null);

  // Force update only when we need to show/hide predictions
  const [, forceUpdate] = useState({});

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handlePredictionSelect = useCallback(async (prediction) => {
    try {
      const { geocodeAddress } = await import('../lib/location.js');
      const result = await geocodeAddress(prediction.description);
      if (result.location) {
        const loc = {
          name: prediction.description,
          lat: result.location.lat,
          lng: result.location.lng
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
      setError('Failed to get coordinates');
      forceUpdate({});
    }
  }, [onSelect]);

  const handleChange = useCallback((e) => {
    const val = e.target.value;
    displayValueRef.current = val;
    setSelected(null);
    setError(null);
    isTypingRef.current = true;

    // Clear previous search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (val.length >= 3) {
      setLoading(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const { searchPlaces } = await import('../lib/location.js');
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
        const { geocodeAddress } = await import('../lib/location.js');
        const result = await geocodeAddress(val);
        if (result.location) {
          onSelect({
            name: val,
            lat: result.location.lat,
            lng: result.location.lng
          });
        } else {
          setError('Please select a valid location');
          forceUpdate({});
        }
      } catch (err) {
        setError('Failed to validate location');
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
        <div style={{
          position: "absolute",
          right: 12,
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none"
        }}>
          <span style={{fontSize: 12, color: GRAY1}}>...</span>
        </div>
      )}

      <PredictionList
        predictions={predictions}
        onSelect={handlePredictionSelect}
        visible={predictions.length > 0 && !selected}
      />

      {selected && (
        <div style={{
          background: "#E8783A15",
          border: `1px solid ${ORANGE}`,
          borderRadius: 12,
          padding: "10px 14px",
          marginBottom: 12,
          display: "flex",
          alignItems: "center",
          gap: 8
        }}>
          <Ico n="pin" s={14} c={ORANGE}/>
          <span style={{fontFamily: FONT, fontSize: 13, color: BLACK, flex: 1}}>{selected.name}</span>
          <button
            onClick={handleClear}
            style={{
              background: "none",
              border: "none",
              color: GRAY1,
              cursor: "pointer",
              fontSize: 12,
              padding: "4px 8px"
            }}
          >
            Change
          </button>
        </div>
      )}

      {error && (
        <div style={{color: "#E8783A", fontSize: 13, marginBottom: 12, fontFamily: FONT, textAlign: "center"}}>
          {error}
        </div>
      )}

      <button
        onClick={handleContinue}
        disabled={!displayValueRef.current?.trim() && !selected}
        style={{
          width: "100%",
          background: (!displayValueRef.current?.trim() && !selected) ? GRAY2 : BLACK,
          color: (!displayValueRef.current?.trim() && !selected) ? GRAY1 : WHITE,
          border: "none",
          borderRadius: 999,
          padding: "15px 0",
          fontSize: 15,
          fontWeight: 700,
          cursor: (!displayValueRef.current?.trim() && !selected) ? "not-allowed" : "pointer",
          fontFamily: FONT,
          marginBottom: 12
        }}
      >
        Continue
      </button>
    </>
  );
});

export default LocationSearch;
