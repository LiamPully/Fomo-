import { useState, useCallback, useEffect, useRef, memo } from 'react';

const FONT = "'Sora', system-ui, sans-serif";
const GRAY1 = "#888880";
const GRAY2 = "#E4E1DA";
const GRAY3 = "#F7F5F1";
const BLACK = "#111111";
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

const LocationSearch = memo(({ onSelect }) => {
  const inputRef = useRef(null);
  const [displayValue, setDisplayValue] = useState("");
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);

  // Focus input on mount only
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle input changes
  const onChange = useCallback((e) => {
    const val = e.target.value;
    setDisplayValue(val);
    setSelected(null);
    setError(null);

    // Clear previous search
    if (window._searchTimeout) clearTimeout(window._searchTimeout);

    if (val.length >= 3) {
      setLoading(true);
      window._searchTimeout = setTimeout(async () => {
        try {
          const { searchPlaces } = await import('../lib/location.js');
          const result = await searchPlaces(val);
          setPredictions(result.predictions || []);
        } catch (err) {
          setPredictions([]);
        } finally {
          setLoading(false);
        }
      }, 300);
    } else {
      setPredictions([]);
      setLoading(false);
    }
  }, []);

  const onPredictionClick = useCallback(async (prediction) => {
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
        setDisplayValue(prediction.description);
        setPredictions([]);
        onSelect(loc);
      }
    } catch (err) {
      setError('Failed to get coordinates');
    }
  }, [onSelect]);

  const onContinue = useCallback(async () => {
    if (selected) {
      onSelect(selected);
    } else if (displayValue.trim()) {
      try {
        const { geocodeAddress } = await import('../lib/location.js');
        const result = await geocodeAddress(displayValue);
        if (result.location) {
          onSelect({
            name: displayValue,
            lat: result.location.lat,
            lng: result.location.lng
          });
        } else {
          setError('Please select a valid location');
        }
      } catch (err) {
        setError('Failed to validate location');
      }
    }
  }, [selected, displayValue, onSelect]);

  const onClear = useCallback(() => {
    setSelected(null);
    setDisplayValue("");
    setPredictions([]);
    inputRef.current?.focus();
  }, []);

  return (
    <>
      <div style={{position:"relative",marginBottom:12}}>
        <input
          ref={inputRef}
          value={displayValue}
          onChange={onChange}
          placeholder="Search for address, street, suburb, or city..."
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          style={{width:"100%",border:`1.5px solid ${error?"#E8783A":GRAY2}`,borderRadius:14,padding:"13px 16px",fontSize:16,outline:"none",fontFamily:FONT,boxSizing:"border-box",background:GRAY3,WebkitAppearance:"none",touchAction:"manipulation"}}
        />
        {loading && (
          <div style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)"}}>
            <span style={{fontSize:12,color:GRAY1}}>...</span>
          </div>
        )}
      </div>

      {predictions.length > 0 && !selected && (
        <div style={{background:"#fff",border:`1px solid ${GRAY2}`,borderRadius:12,marginBottom:12,maxHeight:200,overflowY:"auto"}}>
          {predictions.map((prediction, idx) => (
            <div
              key={prediction.place_id || idx}
              onClick={() => onPredictionClick(prediction)}
              style={{padding:"12px 16px",borderBottom:`1px solid ${idx < predictions.length - 1 ? GRAY2 : "transparent"}`,cursor:"pointer",fontFamily:FONT,fontSize:14,display:"flex",alignItems:"center",gap:8}}
            >
              <Ico n="pin" s={14} c={GRAY1}/>
              <span>{prediction.description}</span>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div style={{background:"#E8783A15",border:`1px solid ${ORANGE}`,borderRadius:12,padding:"10px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
          <Ico n="pin" s={14} c={ORANGE}/>
          <span style={{fontFamily:FONT,fontSize:13,color:BLACK,flex:1}}>{selected.name}</span>
          <button onClick={onClear} style={{background:"none",border:"none",color:GRAY1,cursor:"pointer",fontSize:12}}>Change</button>
        </div>
      )}

      {error && (
        <div style={{color:"#E8783A",fontSize:13,marginBottom:12,fontFamily:FONT,textAlign:"center"}}>{error}</div>
      )}

      <button
        onClick={onContinue}
        disabled={!displayValue.trim() && !selected}
        style={{width:"100%",background:(!displayValue.trim()&&!selected)?GRAY2:BLACK,color:(!displayValue.trim()&&!selected)?GRAY1:WHITE,border:"none",borderRadius:999,padding:"15px 0",fontSize:15,fontWeight:700,cursor:(!displayValue.trim()&&!selected)?"not-allowed":"pointer",fontFamily:FONT,marginBottom:12}}
      >
        Continue
      </button>
    </>
  );
});

export default LocationSearch;
