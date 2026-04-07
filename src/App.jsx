import { useState, useEffect, useMemo, useCallback, useRef, memo, Suspense } from "react";
import { useLocation } from "./hooks/useLocation";
import { useAuth } from "./hooks/useAuth";
import { MAIN_CATEGORIES, TOP_LEVEL_CATEGORIES, SUB_CATEGORIES, getCategoryColor } from "./lib/categories";
import { fetchEvents, createEvent } from "./api/events";
import { canPublishEvent } from "./api/businesses";
import { calculateDistance } from "./lib/location";
import CategoryDropdown from "./components/CategoryDropdown";
import FilterModal from "./components/FilterModal";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { SkeletonList } from "./components/SkeletonCard";
import LocationSearch from "./components/LocationSearch";
import AuthModal from "./components/AuthModal";
import CreateEvent from "./components/CreateEvent";
import ErrorBoundary from "./components/ErrorBoundary";
import "./styles/design-system.css";

/* ─────────────────────────────────────────────────────────────
   DESIGN TOKENS  (extracted frame-by-frame from the video)
───────────────────────────────────────────────────────────── */
const BG   = "#F0EDE6";   // warm greige background
const WHITE = "#FFFFFF";
const BLACK = "#111111";
const ORANGE = "#E8783A"; // primary accent
const GRAY1  = "#888880"; // muted text
const GRAY2  = "#E4E1DA"; // borders / dividers
const GRAY3  = "#F7F5F1"; // input / chip backgrounds
const FONT   = "'Sora', system-ui, sans-serif";

/* category label colors - now imported from categories.js */

/* ─────────────────────────────────────────────────────────────
   MOCK DATA  – matches every event visible in the video
───────────────────────────────────────────────────────────── */
const EVENTS = [
  {
    id:"1", title:"Oranjezicht City Farm Market", organiser:"OZCF",
    category:"Market", today:true,
    dateLabel:"Fri, 6 Mar · 09:00–14:00",
    start:"2026-03-06T09:00", end:"2026-03-06T14:00",
    area:"V&A Waterfront, Cape Town",
    location:"V&A Waterfront", address:"V&A Waterfront\nCape Town",
    latitude:-33.9035, longitude:18.4200,
    phone:"+27 21 424 0805", website:"ozcfmarket.com", instagram:"@ozcfmarket",
    img:"https://picsum.photos/seed/market1/800/500",
    desc:"Cape Town's favourite weekly market. Fresh local produce, artisan goods, food stalls and a stunning harbour view every Friday and Saturday.",
  },
  {
    id:"2", title:"Neighbourhood Goods Market", organiser:"NGM",
    category:"Market",
    dateLabel:"Sat, 7 Mar · 09:30–15:00",
    start:"2026-03-07T09:30", end:"2026-03-07T15:00",
    area:"Woodstock, Cape Town",
    location:"The Old Biscuit Mill", address:"375 Albert Rd\nWoodstock, Cape Town",
    latitude:-33.9275, longitude:18.4570,
    phone:"+27 21 448 1438", instagram:"@neighbourgoodsmarket",
    img:"https://picsum.photos/seed/market2/800/500",
    desc:"The iconic Saturday market at the Old Biscuit Mill. Artisan food, craft goods, flowers and world-class coffee every week.",
  },
  {
    id:"3", title:"Greenside Morning Farmers Market", organiser:"Greenside Market",
    category:"Market",
    dateLabel:"Mon, 9 Mar · 07:30–12:00",
    start:"2026-03-09T07:30", end:"2026-03-09T12:00",
    area:"Greenside, Johannesburg",
    location:"Greenside", address:"Greenside\nJohannesburg",
    latitude:-26.1520, longitude:28.0180,
    phone:"+27 82 111 2233",
    img:"https://picsum.photos/seed/market3/800/500",
    desc:"A relaxed community market with organic produce, homemade preserves and fresh flowers every Monday morning.",
  },
  {
    id:"4", title:"Durban Street Food Festival", organiser:"Durban Events Co",
    category:"Fun",
    dateLabel:"Tue, 10 Mar · 11:00–20:00",
    start:"2026-03-10T11:00", end:"2026-03-10T20:00",
    area:"Stamford Hill, Durban",
    location:"Moses Mabhida Stadium Precinct",
    address:"44 Isaiah Ntshangase Rd, Durban\nStamford Hill, Durban",
    latitude:-29.8290, longitude:31.0300,
    phone:"+27 31 000 5678", whatsapp:"+27310005678",
    img:"https://picsum.photos/seed/food4/800/500",
    desc:"A celebration of Durban's incredible street food scene. From bunny chow to vetkoek, breyani to grilled corn — if you love bold flavours, this is your weekend. Street performers, DJ sets, and family fun.",
  },
  {
    id:"5", title:"Cape Town Art Fair Pop-Up", organiser:"CT Art Collective",
    category:"Event",
    dateLabel:"Wed, 11 Mar · 10:00–18:00",
    start:"2026-03-11T10:00", end:"2026-03-11T18:00",
    area:"De Waterkant, Cape Town",
    location:"Cape Quarter Lifestyle Village",
    address:"Napier St, De Waterkant\nDe Waterkant, Cape Town",
    latitude:-33.9150, longitude:18.4120,
    instagram:"@ctartcollective",
    img:"https://picsum.photos/seed/art5/800/500",
    desc:"Discover emerging South African artists at this curated pop-up gallery. Over 40 artists showing paintings, photography, sculpture, and digital art. Buy original works or browse for inspiration.",
  },
  {
    id:"6", title:"Trail Run: Table Mountain Explorer", organiser:"Trail Run SA",
    category:"Fun",
    dateLabel:"Thu, 12 Mar · 06:30–13:00",
    start:"2026-03-12T06:30", end:"2026-03-12T13:00",
    area:"Gardens, Cape Town",
    location:"Tafelberg Road Parking",
    address:"Tafelberg Rd, Table Mountain\nGardens, Cape Town",
    latitude:-33.9500, longitude:18.4000,
    phone:"+27 72 999 3344", website:"trailrunsa.co.za",
    img:"https://picsum.photos/seed/trail6/800/500",
    desc:"Join 300 runners for a breathtaking trail run on the slopes of Table Mountain. Three distance options: 10km, 21km, and 42km. All levels welcome. Medals, refreshments, and stunning views guaranteed.",
  },
  {
    id:"7", title:"Pretoria Night Market", organiser:"Tshwane Events",
    category:"Market",
    dateLabel:"Fri, 13 Mar · 17:00–22:30",
    start:"2026-03-13T17:00", end:"2026-03-13T22:30",
    area:"Pretoria CBD, Pretoria",
    location:"Church Square", address:"Church Square\nPretoria CBD, Pretoria",
    latitude:-25.7460, longitude:28.1880,
    phone:"+27 12 358 4000",
    img:"https://picsum.photos/seed/night7/800/500",
    desc:"Pretoria's favourite evening market under the stars. Street food, craft beers, live music and artisan goods in the heart of the city.",
  },
  {
    id:"8", title:"Maboneng Sunday Market", organiser:"Maboneng Precinct",
    category:"Market",
    dateLabel:"Sat, 14 Mar · 10:00–16:00",
    start:"2026-03-14T10:00", end:"2026-03-14T16:00",
    area:"Maboneng, Johannesburg",
    location:"Arts on Main", address:"264 Fox St\nMaboneng, Johannesburg",
    latitude:-26.2040, longitude:28.0600,
    phone:"+27 11 447 8194",
    img:"https://picsum.photos/seed/maboneng8/800/500",
    desc:"The iconic Sunday market in Maboneng. Artists, makers, food vendors and musicians come together in Joburg's most creative neighbourhood.",
  },
  {
    id:"9", title:"Yoga in the Botanical Gardens", organiser:"Mindful Cape Town",
    category:"Other",
    dateLabel:"Sun, 8 Mar · 06:30–08:30",
    start:"2026-03-08T06:30", end:"2026-03-08T08:30",
    area:"Newlands, Cape Town",
    location:"Kirstenbosch National Botanical Garden",
    address:"Rhodes Dr, Newlands\nNewlands, Cape Town",
    latitude:-33.9900, longitude:18.4300,
    phone:"+27 82 444 7890", whatsapp:"+27824447890",
    img:"https://picsum.photos/seed/yoga9/800/500",
    desc:"Find your centre among the ferns and fynbos. A 90-minute sunrise yoga session with certified instructor Thandi Mokoena. All levels welcome. Bring your own mat.",
  },
  {
    id:"10", title:"Joburg Craft Beer Festival", organiser:"Brew Culture SA",
    category:"Fun",
    dateLabel:"Sat, 14 Mar · 12:00–22:00",
    start:"2026-03-14T12:00", end:"2026-03-14T22:00",
    area:"Newtown, Johannesburg",
    location:"Newtown Junction", address:"Newtown Junction\nJohannesburg",
    latitude:-26.2030, longitude:28.0350,
    phone:"+27 11 838 5678", website:"craftbeersa.co.za",
    img:"https://picsum.photos/seed/beer10/800/500",
    desc:"80+ craft beers from across SA. Live music all day, food trucks, and a home-brewing competition. 18+ only.",
  },
  {
    id:"11", title:"Cape Town Jazz Festival", organiser:"CTIJF",
    category:"Event",
    dateLabel:"Fri, 27 Mar · 17:00–00:00",
    start:"2026-03-27T17:00", end:"2026-03-28T00:00",
    area:"Cape Town CBD",
    location:"CTICC & Artscape", address:"Convention Square\nCape Town",
    latitude:-33.9180, longitude:18.4220,
    phone:"+27 21 671 0506", website:"capetownjazzfest.com",
    img:"https://picsum.photos/seed/jazz11/800/500",
    desc:"Africa's Grand Jazz Festival returns. Two stages, 40+ artists, world-class performances and the magic of Cape Town at night.",
  },
  {
    id:"12", title:"Soweto Wine & Lifestyle Festival", organiser:"SWF",
    category:"Event",
    dateLabel:"Sat, 28 Mar · 11:00–21:00",
    start:"2026-03-28T11:00", end:"2026-03-28T21:00",
    area:"Soweto, Johannesburg",
    location:"Ubuntu Kraal Brewery", address:"Vilakazi St\nOrlando West, Soweto",
    latitude:-26.2450, longitude:27.9100,
    phone:"+27 11 936 3116", instagram:"@sowetowinefest",
    img:"https://picsum.photos/seed/wine12/800/500",
    desc:"The ultimate celebration of SA wine culture, food and music in the heart of Soweto. Wine tastings, gourmet street food and live performances.",
  },
];

// Placeholder ads - dormant business-facing copy
const PLACEHOLDER_ADS = [
  { text:"Put your ad here", subtext:"Reach local audiences", cta:"Learn more", bg:"#2563EB" },
  { text:"Your business could be featured here", subtext:"Sponsored placements available", cta:"Contact us", bg:"#059669" },
  { text:"Sponsored placement available", subtext:"Get in front of local event-goers", cta:"Find out more", bg:"#7C3AED" },
  { text:"Advertise with us", subtext:"Coming soon", cta:"Get notified", bg:"#DC2626" },
];

/* ─────────────────────────────────────────────────────────────
   UTILS
───────────────────────────────────────────────────────────── */
const fmtLong    = s => new Date(s).toLocaleDateString("en-ZA",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
const fmtHHMM    = s => new Date(s).toLocaleTimeString("en-ZA",{hour:"2-digit",minute:"2-digit"});
const isThisWeek = s => { const t=new Date(s),n=new Date(),e=new Date(); e.setDate(n.getDate()+7); return t>=n&&t<=e; };
const isThisMo   = s => { const t=new Date(s),n=new Date(); return t.getMonth()===n.getMonth()&&t.getFullYear()===n.getFullYear(); };
const isToday    = s => new Date(s).toDateString()===new Date().toDateString();

/* ─────────────────────────────────────────────────────────────
   SVG ICON PRIMITIVES
───────────────────────────────────────────────────────────── */
const I = ({s=18,c="currentColor",children}) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none"
    stroke={c} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);
const icons = {
  cal:    <I><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></I>,
  clk:    <I><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></I>,
  pin:    <I><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></I>,
  search: <I><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></I>,
  back:   <I><polyline points="15 18 9 12 15 6"/></I>,
  phone:  <I><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.42 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.69a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></I>,
  globe:  <I><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></I>,
  ig:     <I><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></I>,
  wa:     <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>,
  nav:    <I><polygon points="3 11 22 2 13 21 11 13 3 11"/></I>,
  filter: <I><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="12" y1="18" x2="12" y2="18" strokeWidth="3"/></I>,
  evtab:  <I><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></I>,
  grid:   <I><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></I>,
  info:   <I><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></I>,
  plus:   <I><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></I>,
  check:  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  card:   <I><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></I>,
  edit:   <I><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></I>,
};
const Ico = ({n,s=18,c="currentColor"}) => {
  const el = icons[n];
  if (!el) return null;
  // clone with size+color
  return <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:s,height:s,flexShrink:0,color:c}}>
    {el}
  </span>;
};
// Sized icon helper
const SIco = ({n,s,c}) => <Ico n={n} s={s} c={c}/>;

/* ─────────────────────────────────────────────────────────────
   ISOLATED SEARCH INPUT - Won't re-render when predictions change
───────────────────────────────────────────────────────────── */
const SearchInput = memo(({ onSelect, initialError }) => {
  const inputRef = useRef(null);
  const [displayValue, setDisplayValue] = useState("");
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(initialError);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle input changes without re-rendering parent
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
          const { searchPlaces } = await import('./lib/location.js');
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
      const { geocodeAddress } = await import('./lib/location.js');
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
        const { geocodeAddress } = await import('./lib/location.js');
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
        <div style={{background:WHITE,border:`1px solid ${GRAY2}`,borderRadius:12,marginBottom:12,maxHeight:200,overflowY:"auto"}}>
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

/* ─────────────────────────────────────────────────────────────
   LOCATION MODAL  (bottom sheet) - with Google Places autocomplete
───────────────────────────────────────────────────────────── */
const LocationModal = ({open,onAllow,onManual,onSkip}) => {
  const [showM,setShowM]=useState(false);

  // Reset state when modal opens
  useEffect(()=>{
    if(open){
      setShowM(false);
    }
  },[open]);

  const handleSelect = useCallback((loc) =>{
    onManual(loc);
  },[onManual]);

  if (!open) return null;
  return (
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:80,background:"rgba(0,0,0,0.45)",display:"flex",flexDirection:"column",justifyContent:"flex-end"}} onClick={(e)=>{e.target === e.currentTarget && e.stopPropagation()}}>
      <div style={{background:WHITE,borderRadius:"22px 22px 0 0",padding:"28px 20px 44px",maxHeight:"85dvh",overflowY:"auto",WebkitOverflowScrolling:"touch"}} onClick={(e)=>e.stopPropagation()}>
        {/* Pin icon */}
        <div style={{width:52,height:52,background:GRAY3,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px"}}>
          <span style={{color:BLACK}}><Ico n="pin" s={24} c={BLACK}/></span>
        </div>
        <h2 style={{fontFamily:FONT,fontSize:22,fontWeight:800,textAlign:"center",color:BLACK,marginBottom:10}}>What's near you?</h2>
        <p style={{fontFamily:FONT,fontSize:14,color:GRAY1,textAlign:"center",lineHeight:1.6,marginBottom:28,padding:"0 10px"}}>
          Allow location access to see events happening close to you, sorted by distance.
        </p>
        {!showM ? (<>
          <button onClick={onAllow} style={{width:"100%",background:BLACK,color:WHITE,border:"none",borderRadius:999,padding:"15px 0",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:FONT,marginBottom:12,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            <Ico n="nav" s={15} c={WHITE}/> Use My Location
          </button>
          <button onClick={()=>setShowM(true)} style={{width:"100%",background:WHITE,color:BLACK,border:`1.5px solid ${GRAY2}`,borderRadius:999,padding:"14px 0",fontSize:15,fontWeight:500,cursor:"pointer",fontFamily:FONT,marginBottom:18}}>
            Enter location manually
          </button>
          <button onClick={()=>onSkip?.()||onManual(null)} style={{width:"100%",background:"none",border:"none",color:GRAY1,fontSize:14,cursor:"pointer",fontFamily:FONT}}>
            Skip for now
          </button>
        </>) : (<>
          <LocationSearch key="location-search" onSelect={handleSelect} />
          <button onClick={()=>setShowM(false)} style={{width:"100%",background:"none",border:"none",color:GRAY1,fontSize:14,cursor:"pointer",fontFamily:FONT,marginTop:12}}>
            ← Back
          </button>
        </>)}
      </div>
    </div>
  );
};

// LocationSearch component handles the input separately to prevent keyboard issues
const MemoizedLocationModal = memo(LocationModal);

/* ─────────────────────────────────────────────────────────────
   AD BANNER (Dormant - Business-facing placeholders)
───────────────────────────────────────────────────────────── */
const AdBanner = () => {
  const [idx,setIdx]=useState(0);
  const [vis,setVis]=useState(true);
  useEffect(()=>{
    const iv=setInterval(()=>{
      setVis(false);
      setTimeout(()=>{setIdx(i=>(i+1)%PLACEHOLDER_ADS.length);setVis(true);},350);
    },7000);
    return ()=>clearInterval(iv);
  },[]);
  const ad=PLACEHOLDER_ADS[idx];
  return (
    <div style={{background:ad.bg,borderTop:`1px solid ${GRAY2}`,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",opacity:vis?1:0,transition:"opacity .35s",flexShrink:0}}>
      <div style={{display:"flex",flexDirection:"column",gap:2,overflow:"hidden"}}>
        <span style={{fontFamily:FONT,fontSize:13,fontWeight:700,color:WHITE,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ad.text}</span>
        <span style={{fontFamily:FONT,fontSize:11,color:"rgba(255,255,255,0.8)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ad.subtext}</span>
      </div>
      <button style={{background:"rgba(255,255,255,0.2)",color:WHITE,border:"1px solid rgba(255,255,255,0.3)",borderRadius:999,padding:"6px 14px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:FONT,flexShrink:0,marginLeft:12,backdropFilter:"blur(4px)"}}>{ad.cta}</button>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   EVENT CARD  (matches video exactly)
───────────────────────────────────────────────────────────── */
const EventCard = ({event,onClick}) => {
  const [err,setErr]=useState(false);
  return (
    <div
      onClick={()=>onClick(event)}
      style={{background:WHITE,borderRadius:16,overflow:"hidden",cursor:"pointer",marginBottom:10,flexShrink:0}}
    >
      {/* Full-bleed hero photo */}
      <div style={{width:"100%",height:200,overflow:"hidden",borderRadius:"16px 16px 0 0"}}>
        {!err
          ? <img src={event.img} alt={event.title} onError={()=>setErr(true)}
              style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
          : <div style={{width:"100%",height:"100%",background:GRAY2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:44}}>
              {event.category==="markets"?"🛍️":event.category==="food-drink"?"🍽️":event.category==="music"?"🎵":event.category==="sport-fitness"?"⚽":event.category==="faith-christian"?"✝️":event.category==="kids"?"🧸":event.category==="nightlife"?"🌙":"🎭"}
            </div>
        }
      </div>
      {/* Info section */}
      <div style={{padding:"12px 16px 16px"}}>
        {/* Category + Today badge */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
          <span style={{fontFamily:FONT,fontSize:12,fontWeight:700,color:getCategoryColor(event.category)}}>{event.category}</span>
          {event.today && <span style={{fontFamily:FONT,fontSize:12,fontWeight:700,color:ORANGE}}>Today</span>}
        </div>
        {/* Title */}
        <h3 style={{fontFamily:FONT,fontSize:18,fontWeight:800,color:BLACK,marginBottom:8,lineHeight:1.25,letterSpacing:"-0.2px"}}>{event.title}</h3>
        {/* Date */}
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
          <Ico n="cal" s={13} c={GRAY1}/>
          <span style={{fontFamily:FONT,fontSize:13,color:GRAY1}}>{event.dateLabel}</span>
        </div>
        {/* Location + Distance + View */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:6,flex:1}}>
            <Ico n="pin" s={13} c={GRAY1}/>
            <span style={{fontFamily:FONT,fontSize:13,color:GRAY1}}>{event.area}</span>
            {event.distance !== undefined && event.distance !== null && (
              <span style={{fontFamily:FONT,fontSize:12,color:ORANGE,fontWeight:600,whiteSpace:"nowrap"}}>
                {event.distance < 1 ? `${Math.round(event.distance * 1000)}m` : `${event.distance.toFixed(1)}km`}
              </span>
            )}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:1}}>
            <span style={{fontFamily:FONT,fontSize:13,fontWeight:700,color:BLACK}}>View</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={BLACK} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   EVENT DETAIL SCREEN
───────────────────────────────────────────────────────────── */
const EventDetail = ({event,onBack}) => {
  const [err,setErr]=useState(false);
  const catC = getCategoryColor(event.category);

  const ContactBtn = ({icon,label,href,bg,textColor}) => (
    <a href={href} target="_blank" rel="noreferrer" style={{
      display:"inline-flex",alignItems:"center",gap:7,
      background:bg||WHITE,color:textColor||BLACK,
      border:`1.5px solid ${bg?"transparent":GRAY2}`,
      borderRadius:999,padding:"10px 18px",fontSize:14,fontWeight:600,
      textDecoration:"none",fontFamily:FONT,whiteSpace:"nowrap",
    }}>
      {icon}{label}
    </a>
  );

  return (
    <div style={{background:WHITE,height:"100%",overflowY:"auto"}}>
      {/* Full-bleed hero */}
      <div style={{position:"relative",height:280,flexShrink:0}}>
        {!err
          ? <img src={event.img} alt={event.title} onError={()=>setErr(true)}
              style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>
          : <div style={{width:"100%",height:"100%",background:GRAY2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:64}}>
              {event.category==="markets"?"🛍️":event.category==="food-drink"?"🍽️":event.category==="music"?"🎵":event.category==="sport-fitness"?"⚽":event.category==="faith-christian"?"✝️":event.category==="kids"?"🧸":event.category==="nightlife"?"🌙":"🎭"}
            </div>
        }
        {/* Back button */}
        <button onClick={onBack} style={{position:"absolute",top:54,left:16,background:"rgba(255,255,255,0.92)",border:"none",borderRadius:"50%",width:38,height:38,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:"0 2px 8px rgba(0,0,0,0.18)"}}>
          <Ico n="back" s={18} c={BLACK}/>
        </button>
      </div>

      {/* Content */}
      <div style={{padding:"20px 20px 52px",background:WHITE}}>
        {/* Category pill (light bg in detail view) */}
        <div style={{display:"inline-block",background:catC+"1A",borderRadius:7,padding:"4px 10px",marginBottom:12}}>
          <span style={{fontFamily:FONT,fontSize:12,fontWeight:700,color:catC}}>{event.category}</span>
        </div>

        <h1 style={{fontFamily:FONT,fontSize:26,fontWeight:900,color:BLACK,lineHeight:1.15,marginBottom:5,letterSpacing:"-0.3px"}}>{event.title}</h1>
        <p style={{fontFamily:FONT,fontSize:13,color:GRAY1,marginBottom:24}}>by {event.organiser}</p>

        {/* Info rows — colored icon chip, label, value */}
        {[
          {icon:"cal", chipC:"#4A82C4", label:"DATE",     val:fmtLong(event.start)},
          {icon:"clk", chipC:ORANGE,    label:"TIME",     val:`${fmtHHMM(event.start)} – ${fmtHHMM(event.end)}`},
          {icon:"pin", chipC:"#E05C5C", label:"LOCATION", val:(event.location||"")+(event.address?"\n"+event.address:"")},
        ].map(({icon,chipC,label,val})=>(
          <div key={label} style={{display:"flex",gap:14,marginBottom:18,alignItems:"flex-start"}}>
            <div style={{width:38,height:38,background:chipC+"1A",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}>
              <span style={{color:chipC}}><Ico n={icon} s={16} c={chipC}/></span>
            </div>
            <div>
              <p style={{fontFamily:FONT,fontSize:10,fontWeight:700,color:GRAY1,letterSpacing:"0.9px",textTransform:"uppercase",marginBottom:3}}>{label}</p>
              {val.split("\n").map((line,i)=>(
                <p key={i} style={{fontFamily:FONT,fontSize:15,fontWeight:i===0?700:400,color:BLACK,lineHeight:1.5}}>{line}</p>
              ))}
            </div>
          </div>
        ))}

        <div style={{height:1,background:GRAY2,margin:"18px 0"}}/>

        <h2 style={{fontFamily:FONT,fontSize:17,fontWeight:800,color:BLACK,marginBottom:10}}>About this event</h2>
        <p style={{fontFamily:FONT,fontSize:14.5,color:"#444",lineHeight:1.78,marginBottom:28}}>{event.desc}</p>

        <div style={{height:1,background:GRAY2,marginBottom:18}}/>

        <h2 style={{fontFamily:FONT,fontSize:17,fontWeight:800,color:BLACK,marginBottom:14}}>Get in touch</h2>
        <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
          {event.phone     && <ContactBtn href={`tel:${event.phone}`} icon={<Ico n="phone" s={14} c={BLACK}/>} label="Call"/>}
          {event.whatsapp  && <ContactBtn href={`https://wa.me/${event.whatsapp}`} icon={<span style={{color:"#fff"}}><Ico n="wa" s={14} c="#fff"/></span>} label="WhatsApp" bg="#25D366" textColor="#fff"/>}
          {event.website   && <ContactBtn href={`https://${event.website}`} icon={<Ico n="globe" s={14} c={BLACK}/>} label="Website"/>}
          {event.instagram && <ContactBtn href={`https://instagram.com/${event.instagram.replace("@","")}`} icon={<Ico n="ig" s={14} c="#fff"/>} label="Instagram" bg="#E1306C" textColor="#fff"/>}
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   EVENTS SCREEN  (main feed)
───────────────────────────────────────────────────────────── */
const EventsScreen = ({events,user,locLabel,radiusKm,onRadiusChange,onEventClick,onSignIn,showAds,userLocation,eventsLoading}) => {
  const [period,setPeriod]=useState("all");
  const [cat,setCat]=useState("all");
  const [showRadius,setShowRadius]=useState(false);
  const [sortBy,setSortBy]=useState("chronological");
  const [showFilterModal,setShowFilterModal]=useState(false);
  const [showOtherCategories,setShowOtherCategories]=useState(false);
  const filterButtonRef=useRef(null);

  // Helper function to get sort label
  const getSortLabel = (sortId) => {
    switch(sortId) {
      case 'chronological': return 'Date';
      case 'alphabetical': return 'Alphabetical';
      case 'distance': return 'Distance';
      case 'popularity': return 'Popularity';
      default: return 'Date';
    }
  };

  const filtered = useMemo(()=>{
    let ev=events.filter(e=>e.status!=="removed");
    if (cat!=="all"){
      // Check if it's a main category or subcategory
      const subCatIds = SUB_CATEGORIES.map(s=>s.id);
      const additionalCatIds = ['business','family','kids','sport-fitness','community','faith-christian','nightlife'];
      ev=ev.filter(e=>{
        // Match by category ID
        if (e.category===cat) return true;
        // Match by category name (for backward compatibility)
        const catName = typeof e.category === 'string' ? e.category.toLowerCase().replace(/\s+/g,'-') : '';
        if (catName===cat) return true;
        // If "other" is selected, include events with subcategory IDs or additional category IDs
        if (cat==="other" && (subCatIds.includes(e.category) || additionalCatIds.includes(e.category))) return true;
        return false;
      });
    }
    if (period==="today" || period==="Today")    ev=ev.filter(e=>isToday(e.start));
    else if (period==="week" || period==="This Week")  ev=ev.filter(e=>isThisWeek(e.start));
    else if (period==="month" || period==="This Month") ev=ev.filter(e=>isThisMo(e.start));

    // Apply sorting
    const sorted=[...ev];
    if (sortBy==="chronological"){
      sorted.sort((a,b)=>new Date(a.start)-new Date(b.start));
    } else if (sortBy==="alphabetical"){
      sorted.sort((a,b)=>(a.title||"").localeCompare(b.title||""));
    } else if (sortBy==="distance"){
      if (userLocation?.lat && userLocation?.lng){
        sorted.sort((a,b)=>{
          if (!a.latitude || !a.longitude) return 1;
          if (!b.latitude || !b.longitude) return -1;
          const distA=calculateDistance(userLocation.lat,userLocation.lng,a.latitude,a.longitude);
          const distB=calculateDistance(userLocation.lat,userLocation.lng,b.latitude,b.longitude);
          return distA-distB;
        });
      }
    } else if (sortBy==="popularity"){
      sorted.sort((a,b)=>(b.viewCount||0)-(a.viewCount||0));
    }
    return sorted;
  },[events,cat,period,sortBy,userLocation]);

  // Check if events have distance (meaning location filtering is active)
  const hasDistanceFiltering = events.some(e => e.distance !== undefined);

  return (
    <div style={{flex:1,overflowY:"auto",background:BG}}>
      {/* ── Sticky header ── */}
      <div style={{background:BG,padding:"16px 16px 0",position:"sticky",top:0,zIndex:10}}>
        {/* Title */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
          <h1 style={{fontFamily:FONT,fontSize:36,fontWeight:900,color:BLACK,lineHeight:1.05,letterSpacing:"-0.5px"}}>
            What's<br/>happening?
          </h1>
          <button style={{background:"none",border:"none",cursor:"pointer",padding:4,marginTop:6}}>
            <Ico n="search" s={22} c={BLACK}/>
          </button>
        </div>
        {/* Location pill with radius selector */}
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
          <button style={{display:"inline-flex",alignItems:"center",gap:5,background:"none",border:`1px solid ${GRAY2}`,borderRadius:999,padding:"5px 12px",fontSize:13,color:GRAY1,cursor:"pointer",fontFamily:FONT}}>
            <Ico n="pin" s={12} c={GRAY1}/>{locLabel||"All locations"}
          </button>
          {hasDistanceFiltering && (
            <button
              onClick={()=>setShowRadius(!showRadius)}
              style={{display:"inline-flex",alignItems:"center",gap:4,background:ORANGE,color:WHITE,border:"none",borderRadius:999,padding:"5px 10px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:FONT}}
            >
              Within {radiusKm}km
              <Ico n="filter" s={10} c={WHITE}/>
            </button>
          )}
        </div>

        {/* Radius selector dropdown */}
        {showRadius && hasDistanceFiltering && (
          <div style={{background:WHITE,borderRadius:12,padding:"12px 16px",marginBottom:16,border:`1px solid ${GRAY2}`}}>
            <p style={{fontFamily:FONT,fontSize:12,color:GRAY1,marginBottom:8}}>Show events within:</p>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {[10, 25, 50, 100, 200].map(r => (
                <button
                  key={r}
                  onClick={()=>{onRadiusChange(r);setShowRadius(false);}}
                  style={{
                    background:radiusKm===r?BLACK:GRAY3,
                    color:radiusKm===r?WHITE:BLACK,
                    border:"none",
                    borderRadius:999,
                    padding:"6px 14px",
                    fontSize:13,
                    fontWeight:radiusKm===r?700:400,
                    cursor:"pointer",
                    fontFamily:FONT
                  }}
                >
                  {r}km
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Category pills — selected = solid with category color */}
        <div style={{display:"flex",gap:8,flexWrap:"wrap",paddingBottom:8}}>
          {MAIN_CATEGORIES.map(c=>(
            <button
              key={c.id}
              onClick={()=>{
                setCat(c.id);
                if (c.id === 'other') {
                  setShowOtherCategories(!showOtherCategories);
                } else {
                  setShowOtherCategories(false);
                }
              }}
              style={{
                background: cat===c.id ? c.color : WHITE,
                color: cat===c.id ? WHITE : BLACK,
                border: `1.5px solid ${cat===c.id ? c.color : GRAY2}`,
                borderRadius: 999,
                padding: '8px 18px',
                fontSize: 14,
                fontWeight: cat===c.id ? 700 : 500,
                cursor: 'pointer',
                fontFamily: FONT,
                whiteSpace: 'nowrap',
                transition: 'all .15s',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {c.name}
              {c.id === 'other' && (
                <span style={{
                  fontSize: 10,
                  transform: showOtherCategories ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform .15s',
                  display: 'inline-block',
                }}>
                  ▼
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Other Categories Dropdown */}
        <CategoryDropdown
          isOpen={showOtherCategories}
          onClose={()=>setShowOtherCategories(false)}
          onSelect={(catId) => {
            setCat(catId);
            setShowOtherCategories(false);
          }}
          selectedCategory={cat}
        />

        {/* Count + Filter button */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingBottom:8,position:"relative"}} ref={filterButtonRef}>
          <span style={{fontFamily:FONT,fontSize:13,color:GRAY1}}>{eventsLoading ? 'Loading...' : `${filtered.length} events`}</span>
          <button
            onClick={()=>setShowFilterModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: BLACK,
              color: WHITE,
              border: 'none',
              borderRadius: 999,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: FONT,
              transition: 'all .15s',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={WHITE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            Filter
          </button>
        </div>
      </div>

      {/* Filter Modal */}
      <FilterModal
        isOpen={showFilterModal}
        onClose={()=>setShowFilterModal(false)}
        filters={{
          sortBy,
          period,
          distance: radiusKm,
          category: cat,
        }}
        onApplyFilters={(newFilters) => {
          setSortBy(newFilters.sortBy);
          setPeriod(newFilters.period);
          onRadiusChange(newFilters.distance);
          setCat(newFilters.category);
        }}
        hasLocation={!!userLocation}
      />

      {/* ── Feed ── */}
      <div style={{padding:"0 12px",paddingBottom:100}}>
        {eventsLoading ? (
          <SkeletonList count={3} />
        ) : filtered.length>0 ? (
          filtered.map(ev=><EventCard key={ev.id} event={ev} onClick={onEventClick}/>)
        ) : (
          <div style={{textAlign:"center",padding:"64px 24px",color:GRAY1}}>
            <p style={{fontFamily:FONT,fontSize:16,fontWeight:700,marginBottom:6}}>No events found</p>
            <p style={{fontFamily:FONT,fontSize:13}}>{hasDistanceFiltering ? `Try increasing the search radius or changing filters.` : `Try a different filter.`}</p>
          </div>
        )}
        {/* Business CTA */}
        {!user && (
          <div style={{background:BLACK,borderRadius:20,padding:"28px 24px",textAlign:"center",marginBottom:16}}>
            <p style={{fontFamily:FONT,fontSize:18,fontWeight:800,color:WHITE,marginBottom:8}}>Promote your event</p>
            <p style={{fontFamily:FONT,fontSize:13,color:"#888",marginBottom:20,lineHeight:1.5}}>Reach local audiences from R50/month</p>
            <button onClick={onSignIn} style={{background:ORANGE,color:WHITE,border:"none",borderRadius:999,padding:"12px 28px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:FONT}}>Get started →</button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   HUB SCREEN
───────────────────────────────────────────────────────────── */
const HubScreen = ({user,events,onCreateEvent,onMyEvents,onSignIn,onRefreshProfile}) => {
  if (!user) return (
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,background:BG}}>
      <div style={{fontSize:52,marginBottom:20}}>🏪</div>
      <h2 style={{fontFamily:FONT,fontSize:22,fontWeight:800,color:BLACK,marginBottom:8,textAlign:"center"}}>Your business account</h2>
      <p style={{fontFamily:FONT,fontSize:14,color:GRAY1,textAlign:"center",lineHeight:1.65,marginBottom:32,maxWidth:260}}>Sign in to create events and reach local audiences.</p>
      <button onClick={onSignIn} style={{background:BLACK,color:WHITE,border:"none",borderRadius:999,padding:"14px 36px",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:FONT}}>Sign in</button>
    </div>
  );

  // Show recovery UI if user exists but business profile is missing
  if (user && !user.businessLoaded) {
    return (
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:32,background:BG}}>
        <div style={{fontSize:48,marginBottom:16}}>⏳</div>
        <h2 style={{fontFamily:FONT,fontSize:20,fontWeight:800,color:BLACK,marginBottom:8,textAlign:"center"}}>Setting up your profile</h2>
        <p style={{fontFamily:FONT,fontSize:14,color:GRAY1,textAlign:"center",lineHeight:1.65,marginBottom:24,maxWidth:280}}>Your account was created but we're still setting up your business profile. This should only take a moment.</p>
        <button onClick={onRefreshProfile} style={{background:ORANGE,color:WHITE,border:"none",borderRadius:999,padding:"14px 36px",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:FONT}}>Try Again</button>
      </div>
    );
  }

  const myPub=events.filter(e=>e.businessId===user.id&&e.status==="published");

  const MenuItem=({icon,label,sub,badge,onClick})=>{
    const [hov,setHov]=useState(false);
    return (
      <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
        style={{display:"flex",alignItems:"center",gap:14,padding:"15px 16px",background:hov?GRAY3:WHITE,borderRadius:16,marginBottom:10,cursor:"pointer",transition:"background .15s"}}>
        <div style={{width:42,height:42,background:GRAY3,borderRadius:13,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <Ico n={icon} s={19} c={BLACK}/>
        </div>
        <div style={{flex:1}}>
          <p style={{fontFamily:FONT,fontSize:15,fontWeight:700,color:BLACK,marginBottom:2}}>{label}</p>
          {sub&&<p style={{fontFamily:FONT,fontSize:12,color:GRAY1}}>{sub}</p>}
        </div>
        {badge&&<span style={{background:ORANGE+"22",color:ORANGE,borderRadius:999,fontSize:11,fontWeight:700,padding:"3px 10px",fontFamily:FONT}}>{badge}</span>}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GRAY1} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </div>
    );
  };

  return (
    <div style={{flex:1,overflowY:"auto",background:BG,padding:"16px 16px 80px"}}>
      <div style={{marginBottom:24}}>
        <h1 style={{fontFamily:FONT,fontSize:30,fontWeight:900,color:BLACK,marginBottom:4}}>Account</h1>
        <p style={{fontFamily:FONT,fontSize:14,color:GRAY1}}>{user.name}</p>
      </div>

      <MenuItem icon="plus"  label="Create event"  sub="Publish your event for free" onClick={onCreateEvent}/>
      <MenuItem icon="evtab" label="My Events"      sub="Drafts, published and past" badge={myPub.length>0?`${myPub.length} live`:null} onClick={onMyEvents}/>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   ABOUT SCREEN
───────────────────────────────────────────────────────────── */
const AboutScreen = ({onSignUp}) => (
  <div style={{flex:1,overflowY:"auto",background:BG,padding:"16px 16px 80px"}}>
    <h1 style={{fontFamily:FONT,fontSize:34,fontWeight:900,color:BLACK,lineHeight:1.1,marginBottom:18,letterSpacing:"-0.5px"}}>
      We're here for<br/>the local stuff.
    </h1>
    <p style={{fontFamily:FONT,fontSize:15,color:"#555",lineHeight:1.8,marginBottom:28}}>
      There's always something happening nearby — a market, a pop-up, a community event. Finding it shouldn't be hard. We built Fomo Markets to fix that.
    </p>
    <div style={{background:WHITE,borderRadius:20,padding:24,marginBottom:14}}>
      <h2 style={{fontFamily:FONT,fontSize:18,fontWeight:800,color:BLACK,marginBottom:10}}>Our story</h2>
      <p style={{fontFamily:FONT,fontSize:14,color:"#555",lineHeight:1.8}}>
        Started by South Africans frustrated that local markets, pop-ups and community events were impossible to find. Facebook gets buried. Instagram disappears. Local needed a better home.
      </p>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:28}}>
      {[["🛍️","Support local","Every event puts money in a local pocket."],["📍","Made for SA","Built for Mzansi communities."],["🔍","Easy discovery","Find what's on near you, right now."],["💛","Free to browse","No account needed. Just show up."]].map(([e,t,d])=>(
        <div key={t} style={{background:WHITE,borderRadius:16,padding:18}}>
          <div style={{fontSize:24,marginBottom:10}}>{e}</div>
          <p style={{fontFamily:FONT,fontSize:14,fontWeight:700,color:BLACK,marginBottom:5}}>{t}</p>
          <p style={{fontFamily:FONT,fontSize:12,color:GRAY1,lineHeight:1.6}}>{d}</p>
        </div>
      ))}
    </div>
    <div style={{background:BLACK,borderRadius:20,padding:"28px 24px",textAlign:"center"}}>
      <p style={{fontFamily:FONT,fontSize:20,fontWeight:800,color:WHITE,marginBottom:8}}>Promote your business</p>
      <p style={{fontFamily:FONT,fontSize:13,color:"#888",lineHeight:1.6,marginBottom:22,maxWidth:260,margin:"0 auto 22px"}}>
        Join SA businesses reaching local audiences — it's free.
      </p>
      <button onClick={onSignUp} style={{background:ORANGE,color:WHITE,border:"none",borderRadius:999,padding:"13px 28px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:FONT}}>Create business account →</button>
    </div>
  </div>
);


/* ─────────────────────────────────────────────────────────────
   MY EVENTS
───────────────────────────────────────────────────────────── */
const MyEvents = ({events,userId,onBack}) => {
  const [tab,setTab]=useState("Published");
  const mine=events.filter(e=>e.businessId===userId);
  const groups={Published:mine.filter(e=>e.status==="published"),Drafts:mine.filter(e=>e.status==="draft"),Past:mine.filter(e=>e.status==="past")};
  return (
    <div style={{background:BG,height:"100%",overflowY:"auto"}}>
      <div style={{padding:"16px 16px 80px"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
          <button onClick={onBack} style={{background:WHITE,border:"none",borderRadius:"50%",width:38,height:38,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 1px 4px rgba(0,0,0,0.08)"}}>
            <Ico n="back" s={18} c={BLACK}/>
          </button>
          <h1 style={{fontFamily:FONT,fontSize:24,fontWeight:800,color:BLACK}}>My Events</h1>
        </div>
        <div style={{display:"flex",background:WHITE,borderRadius:999,padding:4,marginBottom:20,width:"fit-content"}}>
          {["Published","Drafts","Past"].map(t=>(
            <button key={t} onClick={()=>setTab(t)}
              style={{background:tab===t?BLACK:"transparent",color:tab===t?WHITE:GRAY1,border:"none",borderRadius:999,padding:"8px 18px",fontSize:13,fontWeight:tab===t?700:400,cursor:"pointer",fontFamily:FONT}}>
              {t}{groups[t].length>0&&<span style={{marginLeft:5,background:tab===t?"rgba(255,255,255,0.2)":GRAY2,borderRadius:999,fontSize:10,padding:"1px 6px"}}>{groups[t].length}</span>}
            </button>
          ))}
        </div>
        {groups[tab].length>0?groups[tab].map(ev=>(
          <div key={ev.id} style={{background:WHITE,borderRadius:16,padding:"15px 16px",marginBottom:10,display:"flex",alignItems:"center",gap:12}}>
            <div style={{flex:1,minWidth:0}}>
              <span style={{fontFamily:FONT,fontSize:11,fontWeight:700,color:getCategoryColor(ev.category)}}>{ev.category}</span>
              <p style={{fontFamily:FONT,fontSize:14,fontWeight:700,color:BLACK,marginTop:3,marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ev.title}</p>
              <p style={{fontFamily:FONT,fontSize:12,color:GRAY1}}>{ev.area}</p>
            </div>
            <button style={{background:GRAY3,border:"none",borderRadius:10,width:34,height:34,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <Ico n="edit" s={14} c={BLACK}/>
            </button>
          </div>
        )):(
          <div style={{textAlign:"center",padding:"48px 24px",color:GRAY1}}>
            <p style={{fontFamily:FONT,fontSize:15,fontWeight:700,marginBottom:6}}>No {tab.toLowerCase()} events</p>
            <p style={{fontFamily:FONT,fontSize:13}}>They'll appear here once created.</p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   TOP NAV  (logo + brand name + auth button)
───────────────────────────────────────────────────────────── */
const TopNav = ({user,onSignIn,onSignOut}) => (
  <div style={{background:BG,borderBottom:`1px solid ${GRAY2}`,padding:"0 16px",height:54,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,zIndex:25,position:"relative"}}>
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <div style={{width:32,height:32,background:ORANGE,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M4 3v12M14 3v12M4 9h10" stroke={WHITE} strokeWidth="2.2" strokeLinecap="round"/>
        </svg>
      </div>
      <span style={{fontFamily:FONT,fontSize:17,fontWeight:900,color:BLACK,letterSpacing:"-0.4px"}}>
        Fomo Markets<span style={{color:ORANGE}}>.</span>
      </span>
    </div>
    {user ? (
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontFamily:FONT,fontSize:12,color:GRAY1,maxWidth:90,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.name}</span>
        <button onClick={onSignOut} style={{background:GRAY3,border:`1px solid ${GRAY2}`,borderRadius:999,padding:"5px 12px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:FONT,color:BLACK}}>Sign out</button>
      </div>
    ) : (
      <button onClick={onSignIn} style={{background:BLACK,color:WHITE,border:"none",borderRadius:999,padding:"7px 16px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:FONT}}>Sign in</button>
    )}
  </div>
);

/* ─────────────────────────────────────────────────────────────
   BOTTOM NAV
───────────────────────────────────────────────────────────── */
const BottomNav = ({tab,onTab}) => (
  <div style={{display:"flex",background:WHITE,borderTop:`1px solid ${GRAY2}`,position:"absolute",bottom:0,left:0,right:0,paddingBottom:18,zIndex:20}}>
    {[{id:"events",icon:"evtab",label:"Events"},{id:"hub",icon:"grid",label:"Account"},{id:"about",icon:"info",label:"About"}].map(({id,icon,label})=>(
      <button key={id} onClick={()=>onTab(id)}
        style={{flex:1,background:"none",border:"none",padding:"10px 8px 0",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
        <Ico n={icon} s={23} c={tab===id?BLACK:GRAY1}/>
        <span style={{fontFamily:FONT,fontSize:10,fontWeight:tab===id?700:400,color:tab===id?BLACK:GRAY1}}>{label}</span>
      </button>
    ))}
  </div>
);

/* ─────────────────────────────────────────────────────────────
   ROOT APP - with Supabase Auth
───────────────────────────────────────────────────────────── */
export default function App() {
  const [tab,setTab]                  = useState("events");
  const [events,setEvents]            = useState([]);
  const [eventsLoading,setEventsLoading] = useState(true);
  const [selectedEvent,setSelected]   = useState(null);
  const [showLoc,setShowLoc]          = useState(true);
  const [locLabel,setLocLabel]        = useState(null);
  const [showAuth,setShowAuth]        = useState(false);
  const [showCreate,setShowCreate]    = useState(false);
  const [showMyEv,setShowMyEv]        = useState(false);
  // Supabase Auth hook
  const { user, business, loading: authLoading, error: authError, signUp, signIn, signOut, refreshBusiness, clearError } = useAuth();

  // Fetch events from Supabase on mount
  useEffect(() => {
    const loadEvents = async () => {
      setEventsLoading(true);
      const { data, error } = await fetchEvents();
      if (error) {
        console.error('Failed to load events:', error);
        // Fallback to empty array on error
        setEvents([]);
      } else {
        // Transform Supabase data to match app format
        const formattedEvents = data?.map(event => ({
          id: event.id,
          title: event.title,
          organiser: event.organiser || '',
          category: event.category?.name || 'Other',
          today: new Date(event.start_time).toDateString() === new Date().toDateString(),
          dateLabel: `${new Date(event.start_time).toLocaleDateString('en-ZA',{weekday:'short',day:'numeric',month:'short'})} · ${new Date(event.start_time).toLocaleTimeString('en-ZA',{hour:'2-digit',minute:'2-digit'})}–${new Date(event.end_time).toLocaleTimeString('en-ZA',{hour:'2-digit',minute:'2-digit'})}`,
          start: event.start_time,
          end: event.end_time,
          area: event.area,
          location: event.venue || event.area,
          address: event.address || event.area,
          latitude: event.latitude,
          longitude: event.longitude,
          phone: event.phone,
          whatsapp: event.whatsapp,
          website: event.website,
          instagram: event.instagram,
          img: event.image_url || `https://picsum.photos/seed/${event.id}/800/500`,
          desc: event.description || '',
          status: event.status,
          featured: event.featured,
          viewCount: event.view_count,
        })) || [];
        setEvents(formattedEvents);
      }
      setEventsLoading(false);
    };
    loadEvents();
  }, []);

  // Location services
  const { location, requestLocation, setManualLocation, sortByDistance, filterByRadius } = useLocation();
  const [radiusKm, setRadiusKm] = useState(100); // Default 100km radius

  // Handle login
  const handleLogin = useCallback(async(email,password)=>{
    const result = await signIn(email,password);
    if(result.success){
      setShowAuth(false);
      setTab("hub");
    }
    return result;
  },[signIn]);

  // Handle register
  const handleRegister = useCallback(async(email,password,name)=>{
    const result = await signUp(email,password,name);
    if(result.success){
      setShowAuth(false);
      setTab("hub");
    }
    return result;
  },[signUp]);

  // Handle sign out
  const handleSignOut = useCallback(async()=>{
    await signOut();
    setTab("events");
  },[signOut]);

  const handleSave = useCallback(async(data)=>{
    try {
      // Check publishing permissions if trying to publish
      if (data.status === "published" && business?.id) {
        const { data: publishCheck, error: publishError } = await canPublishEvent(business.id);
        if (publishError || !publishCheck?.canPublish) {
          alert(`Cannot publish event: ${publishCheck?.remaining === 0 ? 'Event limit reached. Please upgrade your subscription.' : 'Unable to verify publishing permissions.'}`);
          return;
        }
      }

      // Transform form data to database schema
      const eventData = {
        business_id: business?.id,
        category_id: data.categoryId || 1, // Default to 'Market' category
        title: data.title || data.name,
        description: data.desc || data.description,
        organiser: business?.name || user?.email,
        venue: data.venue,
        area: data.area,
        address: data.area, // Using area as address fallback
        latitude: data.latitude,
        longitude: data.longitude,
        phone: data.phone,
        whatsapp: data.wa?.replace(/\D/g,""),
        website: data.web,
        instagram: data.ig,
        start_time: data.start,
        end_time: data.end,
        image_url: `https://picsum.photos/seed/new${Date.now()}/800/500`,
        status: data.status || 'draft',
        featured: false,
      };

      // Persist to database
      const { data: savedEvent, error } = await createEvent(eventData);

      if (error) {
        console.error('Failed to create event:', error);
        alert('Failed to save event. Please try again.');
        return;
      }

      if (savedEvent) {
        // Transform saved event to local format for UI
        const ev = {
          id: savedEvent.id,
          businessId: savedEvent.business_id,
          category: data.cat || 'Market',
          title: savedEvent.title,
          description: savedEvent.description,
          organiser: savedEvent.organiser,
          today: false,
          dateLabel: savedEvent.start_time
            ? `${new Date(savedEvent.start_time).toLocaleDateString("en-ZA",{weekday:"short",day:"numeric",month:"short"})} · ${fmtHHMM(savedEvent.start_time)}–${fmtHHMM(savedEvent.end_time)}`
            : "",
          start: savedEvent.start_time,
          end: savedEvent.end_time,
          img: savedEvent.image_url,
          area: savedEvent.area,
          venue: savedEvent.venue,
          address: savedEvent.address,
          phone: savedEvent.phone,
          whatsapp: savedEvent.whatsapp,
          website: savedEvent.website,
          instagram: savedEvent.instagram,
          status: savedEvent.status,
          featured: savedEvent.featured,
        };

        setEvents(evs => [ev, ...evs]);

        if(data.status === "published"){
          await refreshBusiness();
        }
      }

      setShowCreate(false);
    } catch (err) {
      console.error('Error in handleSave:', err);
      alert('An unexpected error occurred. Please try again.');
    }
  },[user, business, refreshBusiness]);

  const showAds=!user;

  const handleTab=useCallback((t)=>{
    if(t==="hub"&&!user){setShowAuth(true);return;}
    setTab(t);
  },[user]);

  // Stable callbacks for LocationModal to prevent re-renders
  const handleLocationAllow = useCallback(async()=>{
    const pos = await requestLocation();
    if (pos) {
      setLocLabel("Current location");
      setShowLoc(false);
    }
  },[requestLocation]);

  const handleLocationManual = useCallback((locData)=>{
    if (locData && locData.lat && locData.lng) {
      setManualLocation(locData.lat, locData.lng, locData.name);
      setLocLabel(locData.name);
    } else if (locData === null) {
      setLocLabel(null);
    }
    setShowLoc(false);
  },[setManualLocation]);

  const handleLocationSkip = useCallback(()=>{
    setLocLabel(null);
    setShowLoc(false);
  },[]);

  // Build user object for components (combining auth user + business)
  const appUser = user?{
    id: business?.id||user.id,
    name: business?.business_name||business?.name||user.email?.split('@')[0],
    email: user.email,
    count: business?.event_count||0,
    businessLoaded: !!business,
  }:null;

  return (
    <ErrorBoundary>
    <div className="app-container" style={{width:"100%",maxWidth:430,margin:"0 auto",height:"100vh",position:"relative",display:"flex",flexDirection:"column",background:BG,overflow:"hidden",fontFamily:FONT,boxShadow:"0 0 40px rgba(0,0,0,0.15)"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800;900&display=swap');
        *{margin:0;padding:0;box-sizing:border-box;}
        ::-webkit-scrollbar{display:none;}
        @keyframes slideUp{from{transform:translateY(60px);opacity:0;}to{transform:translateY(0);opacity:1;}}
        button{-webkit-tap-highlight-color:transparent;outline:none;}
        a{-webkit-tap-highlight-color:transparent;}
        input,textarea{font-family:'Sora',system-ui,sans-serif;}
        body { background: #e0ddd6; }
      `}</style>

      {/* ── Content area ── */}
      <div style={{flex:1,overflow:"hidden",position:"relative",display:"flex",flexDirection:"column"}}>

        {/* Top nav — always visible unless inside stack screen */}
        {!selectedEvent&&!showCreate&&!showMyEv&&(
          <TopNav user={appUser} onSignIn={()=>setShowAuth(true)} onSignOut={handleSignOut}/>
        )}

        {/* Stack screen overlays (slide in over tabs) */}
        {selectedEvent&&(
          <div style={{position:"absolute",inset:0,zIndex:30,background:WHITE}}>
            <EventDetail event={selectedEvent} onBack={()=>setSelected(null)}/>
          </div>
        )}
        {showCreate&&appUser&&(
          <div style={{position:"absolute",inset:0,zIndex:30}}>
            <CreateEvent user={appUser} onSave={handleSave} onBack={()=>setShowCreate(false)}/>
          </div>
        )}
        {showMyEv&&appUser&&(
          <div style={{position:"absolute",inset:0,zIndex:30}}>
            <MyEvents events={events} userId={appUser.id} onBack={()=>setShowMyEv(false)}/>
          </div>
        )}

        {/* Tab screens */}
        <div style={{display:"flex",flexDirection:"column",height:"100%",paddingBottom:60}}>
          {tab==="events"&&<EventsScreen events={location?filterByRadius(sortByDistance(events),radiusKm):events} user={appUser} locLabel={locLabel||"All locations"} radiusKm={radiusKm} onRadiusChange={setRadiusKm} onEventClick={setSelected} onSignIn={()=>setShowAuth(true)} showAds={showAds} userLocation={location} eventsLoading={eventsLoading}/>}
          {tab==="hub"   &&<HubScreen user={appUser} events={events} onCreateEvent={()=>setShowCreate(true)} onMyEvents={()=>setShowMyEv(true)} onSignIn={()=>setShowAuth(true)} onRefreshProfile={refreshBusiness}/>}
          {tab==="about" &&<AboutScreen onSignUp={()=>setShowAuth(true)}/>}
        </div>

        {/* Ad banner sits just above bottom nav */}
        {showAds&&!selectedEvent&&!showCreate&&!showMyEv&&(
          <div style={{position:"absolute",bottom:60,left:0,right:0,zIndex:15}}>
            <AdBanner/>
          </div>
        )}

        {/* Bottom nav */}
        <BottomNav tab={tab} onTab={handleTab}/>

        {/* Modals */}
        <MemoizedLocationModal
          open={showLoc&&tab==="events"&&!selectedEvent}
          onAllow={handleLocationAllow}
          onManual={handleLocationManual}
          onSkip={handleLocationSkip}
        />
        <AuthModal
          open={showAuth}
          onClose={()=>setShowAuth(false)}
          onLogin={handleLogin}
          onRegister={handleRegister}
          error={authError}
          clearError={clearError}
        />
      </div>
    </div>
    </ErrorBoundary>
  );
}
