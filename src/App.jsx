import { useState, useEffect, useMemo, useCallback, useRef, memo } from "react";
import { useLocation } from "./hooks/useLocation";
import { useAuth } from "./hooks/useAuth";
import { useScrollPosition } from "./hooks/useScrollPosition";
import { MAIN_CATEGORIES, getCategoryColor } from "./lib/categories";
import { getEventCover } from "./lib/covers";
import { fetchEvents, createEvent, updateEvent, deleteEvent, toggleSaveEvent, fetchSavedEvents } from "./api/events";
import { canPublishEvent } from "./api/businesses";
import { calculateDistance } from "./lib/location";
import { safeLog } from "./lib/security";
import {
  BG, WHITE, BLACK, GRAY, GRAY_LIGHT, GRAY_MEDIUM, ACCENT, ACCENT_LIGHT, FONT,
  SHADOW_CARD, SHADOW_CARD_HOVER, SHADOW_BUTTON, SHADOW_NAV, SHADOW_SM,
  LIGHT_THEME, getSASTGreeting, getUserFirstName,
  ERROR, ERROR_LIGHT, SUCCESS, OVERLAY_DARK,
} from "./lib/theme";
import CategoryDropdown from "./components/CategoryDropdown";
import FilterModal from "./components/FilterModal";
import { SkeletonList } from "./components/SkeletonCard";
import EmptyState from "./components/EmptyState";
import LocationSearch from "./components/LocationSearch";
import AuthModal from "./components/AuthModal";
import CreateEvent from "./components/CreateEvent";
import AccountScreen from "./components/AccountScreen";
import EditProfileModal from "./components/EditProfileModal";
import PrivacySettingsModal from "./components/PrivacySettingsModal";
import NotificationPreferencesModal from "./components/NotificationPreferencesModal";
import EmailVerificationBanner from "./components/EmailVerificationBanner";
import ErrorBoundary from "./components/ErrorBoundary";
import "./styles/airbnb-inspired.css";

// Icon Component - memoized to prevent re-renders
const Icon = memo(({ name, size = 20, color = BLACK }) => {
  const icons = {
    search: <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />,
    location: <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke={color} strokeWidth="2" fill="none" /><line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" /><line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" /><line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" /></>,
    user: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" /><circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" /></>,
    info: <><circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill="none" /><line x1="12" y1="16" x2="12" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" /><line x1="12" y1="8" x2="12.01" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" /></>,
    arrowLeft: <><line x1="19" y1="12" x2="5" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" /><polyline points="12 19 5 12 12 5" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></>,
    filter: <><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></>,
    chevronRight: <><polyline points="9 18 15 12 9 6" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></>,
    chevronLeft: <><polyline points="15 18 9 12 15 6" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></>,
    chevronDown: <><polyline points="6 9 12 15 18 9" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></>,
    chevronUp: <><polyline points="18 15 12 9 6 15" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19" stroke={color} strokeWidth="2" strokeLinecap="round" /><line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" /></>,
    x: <><line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" /><line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" /></>,
    phone: <><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.83 12.83 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.83 12.83 0 002.81.7A2 2 0 0122 16.92z" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" /></>,
    share: <><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" /><polyline points="16 6 12 2 8 6" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" /><line x1="12" y1="2" x2="12" y2="15" stroke={color} strokeWidth="2" strokeLinecap="round" /></>,
    external: <><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" /><polyline points="15 3 21 3 21 9" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" /><line x1="10" y1="14" x2="21" y2="3" stroke={color} strokeWidth="2" strokeLinecap="round" /></>,
    edit: <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" /></>,
    trash: <><polyline points="3 6 5 6 21 6" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" /></>,
    eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" /><circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" /></>,
    clock: <><circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill="none" /><polyline points="12 6 12 12 16 14" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" /></>,
    map: <><polygon points="1 6 1 22 8 18 16 22 21 18 21 2 15 6 8 2 1 6" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" /><line x1="8" y1="2" x2="8" y2="18" stroke={color} strokeWidth="2" /><line x1="16" y1="6" x2="16" y2="22" stroke={color} strokeWidth="2" /></>,
    home: <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /><polyline points="9 22 9 12 15 12 15 22" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></>,
    qr: <><rect x="3" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="2" fill="none" /><rect x="14" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="2" fill="none" /><rect x="3" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth="2" fill="none" /><path d="M17 17h-2v-2h2v2zm-4 0h-2v-2h2v2zm4-4h-2v-2h2v2zm-4-4h-2V7h2v2z" fill={color} /></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="2" fill="none" /><rect x="14" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="2" fill="none" /><rect x="3" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth="2" fill="none" /><rect x="14" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth="2" fill="none" /></>,
    list: <><line x1="8" y1="6" x2="21" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" /><line x1="8" y1="12" x2="21" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" /><line x1="8" y1="18" x2="21" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" /><line x1="3" y1="6" x2="3.01" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" /><line x1="3" y1="12" x2="3.01" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" /><line x1="3" y1="18" x2="3.01" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" /></>,
    moreHorizontal: <><circle cx="12" cy="12" r="1" fill={color} /><circle cx="19" cy="12" r="1" fill={color} /><circle cx="5" cy="12" r="1" fill={color} /></>,
    heart: <><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></>,
    heartFilled: <><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" fill={color} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></>,
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {icons[name] || null}
    </svg>
  );
});

Icon.displayName = 'Icon';

// Custom hook for scroll-aware bottom nav
function useBottomNavScroll() {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const currentY = window.scrollY;

          // Always visible at top of page
          if (currentY <= 60) {
            setIsVisible(true);
          } else if (currentY > lastScrollY.current && currentY > 60) {
            // Scrolling down past threshold - hide
            setIsVisible(false);
          } else if (currentY < lastScrollY.current) {
            // Scrolling up - show
            setIsVisible(true);
          }

          lastScrollY.current = currentY;
          ticking.current = false;
        });
        ticking.current = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return isVisible;
}

// Custom hook for staggered animations
function useStaggeredAnimation(itemCount, baseDelay = 240, staggerDelay = 60) {
  const [visibleItems, setVisibleItems] = useState([]);

  useEffect(() => {
    setVisibleItems([]);
    const timers = [];

    for (let i = 0; i < itemCount; i++) {
      const timer = setTimeout(() => {
        setVisibleItems(prev => [...prev, i]);
      }, baseDelay + (i * staggerDelay));
      timers.push(timer);
    }

    return () => timers.forEach(clearTimeout);
  }, [itemCount, baseDelay, staggerDelay]);

  return visibleItems;
}

// Airbnb-Style Category Pill
const CategoryPill = memo(({ label, isActive, color, onClick }) => {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      style={{
        padding: '10px 18px',
        borderRadius: 9999,
        border: 'none',
        background: isActive ? (color || BLACK) : WHITE,
        color: isActive ? WHITE : GRAY,
        fontSize: 14,
        fontWeight: 600,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transform: isPressed ? 'scale(0.95)' : 'scale(1)',
        transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: isActive ? 'none' : SHADOW_SM,
      }}
    >
      {label}
    </button>
  );
});

CategoryPill.displayName = 'CategoryPill';

// Airbnb-Style Contact Button for Event Detail
const ContactButton = ({ href, icon, label, variant = 'default', external }) => {
  const [isPressed, setIsPressed] = useState(false);

  const variants = {
    default: {
      bg: GRAY_LIGHT,
      color: BLACK,
      iconColor: BLACK,
    },
    whatsapp: {
      bg: '#25D366',
      color: WHITE,
      iconColor: WHITE,
    },
    dark: {
      bg: BLACK,
      color: WHITE,
      iconColor: WHITE,
    },
    instagram: {
      bg: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)',
      color: WHITE,
      iconColor: WHITE,
    },
  };

  const style = variants[variant];

  const Component = external ? 'a' : 'a';
  const props = external ? { target: '_blank', rel: 'noopener noreferrer' } : {};

  return (
    <Component
      href={href}
      {...props}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '12px 20px',
        background: style.bg,
        borderRadius: 9999,
        fontSize: 14,
        color: style.color,
        textDecoration: 'none',
        fontWeight: 600,
        transform: isPressed ? 'scale(0.96)' : 'scale(1)',
        transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: isPressed
          ? SHADOW_SM
          : SHADOW_CARD,
      }}
    >
      <Icon name={icon} size={16} color={style.iconColor} />
      {label}
    </Component>
  );
};

// Airbnb-Style Event Card with Three-Layer Shadow
const EventCard = memo(({ event, onClick, onEdit, onDelete, showActions, animationDelay = 0 }) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), animationDelay);
    return () => clearTimeout(timer);
  }, [animationDelay]);

  const categoryColors = {
    'Market': '#1E8E3E',
    'Fun': '#9334E6',
    'Event': '#E85D3F',
    'Other': '#5F6368',
    'Food & Drink': '#DC2626',
    'Music': '#7C3AED',
    'Markets': '#E8783A',
  };
  const catColor = categoryColors[event.category] || GRAY;

  const getShadow = () => {
    if (isPressed) {
      return SHADOW_SM;
    }
    if (isHovered) {
      return SHADOW_CARD_HOVER;
    }
    return SHADOW_CARD;
  };

  return (
    <div
      onClick={() => !showActions && onClick(event)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => { setIsPressed(false); setIsHovered(false); }}
      onMouseEnter={() => setIsHovered(true)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          !showActions && onClick(event);
        }
      }}
      role={showActions ? undefined : 'button'}
      tabIndex={showActions ? undefined : 0}
      aria-label={`View event: ${event.title}, ${event.category}, ${event.dateLabel}`}
      style={{
        background: WHITE,
        borderRadius: 20,
        overflow: 'hidden',
        cursor: showActions ? 'default' : 'pointer',
        marginBottom: 16,
        transform: isPressed ? 'scale(0.98)' : isVisible ? 'scale(1)' : 'scale(0.98)',
        opacity: isVisible ? 1 : 0,
        transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.28s ease',
        boxShadow: getShadow(),
        outline: 'none',
      }}
    >
      {/* Image */}
      <div style={{ height: 180, overflow: 'hidden', position: 'relative' }}>
        {!imgError ? (
          <img
            src={getEventCover(event)}
            alt={event.title}
            loading="lazy"
            decoding="async"
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: GRAY_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={GRAY} strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5" fill={GRAY}/><path d="M21 15l-5-5L5 21"/></svg>
          </div>
        )}
        {event.today && (
          <div style={{
            position: 'absolute',
            top: 12,
            left: 12,
            background: ACCENT,
            color: WHITE,
            padding: '6px 12px',
            borderRadius: 9999,
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            boxShadow: SHADOW_BUTTON,
          }}>
            Today
          </div>
        )}
        {event.status === 'draft' && (
          <div style={{
            position: 'absolute',
            top: event.today ? 44 : 12,
            left: 12,
            background: GRAY,
            color: WHITE,
            padding: '6px 12px',
            borderRadius: 9999,
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            boxShadow: SHADOW_BUTTON,
          }}>
            Draft
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '16px' }}>
        <div style={{
          display: 'inline-block',
          padding: '4px 10px',
          borderRadius: 8,
          background: `${catColor}15`,
          color: catColor,
          fontSize: 12,
          fontWeight: 600,
          marginBottom: 10,
          letterSpacing: '-0.2px',
        }}>
          {event.category}
        </div>

        <h3 title={event.title} style={{
          fontSize: 16,
          fontWeight: 700,
          color: BLACK,
          marginBottom: 8,
          lineHeight: 1.3,
          letterSpacing: '-0.3px',
        }}>
          {event.title}
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <Icon name="calendar" size={14} color={GRAY} />
          <span style={{ fontSize: 13, color: GRAY }}>{event.dateLabel}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="location" size={14} color={GRAY} />
            <span style={{ fontSize: 13, color: GRAY }}>{event.area}</span>
          </div>
          {event.distance !== undefined && (
            <span style={{
              fontSize: 12, fontWeight: 600, color: ACCENT,
            }}>
              {event.distance < 1
                ? `${Math.round(event.distance * 1000)}m`
                : `${event.distance.toFixed(1)}km`}
            </span>
          )}
        </div>

        {/* Action buttons for MyEvents */}
        {showActions && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${GRAY_LIGHT}` }}>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit?.(event); }}
              style={{
                flex: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '8px 12px',
                background: GRAY_LIGHT,
                border: 'none',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                color: BLACK,
                cursor: 'pointer',
              }}
            >
              <Icon name="edit" size={14} />
              Edit
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete?.(event); }}
              style={{
                flex: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '8px 12px',
                background: ERROR_LIGHT,
                border: 'none',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                color: ERROR,
                cursor: 'pointer',
              }}
            >
              <Icon name="trash" size={14} color={ERROR} />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

EventCard.displayName = 'EventCard';

// Category Card for 2-column grid
const CategoryCard = memo(({ category, onClick, animationDelay = 0 }) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), animationDelay);
    return () => clearTimeout(timer);
  }, [animationDelay]);

  return (
    <button
      onClick={onClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 16px',
        background: WHITE,
        borderRadius: 16,
        border: 'none',
        cursor: 'pointer',
        boxShadow: SHADOW_CARD,
        transform: isPressed ? 'scale(0.96)' : isVisible ? 'scale(1)' : 'scale(0.96)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: `${category.color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
          fontSize: 24,
        }}
      >
        {category.emoji}
      </div>
      <span
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: BLACK,
          textAlign: 'center',
        }}
      >
        {category.name}
      </span>
    </button>
  );
});

CategoryCard.displayName = 'CategoryCard';

// Horizontal Event Card for Upcoming Events
const HorizontalEventCard = memo(({ event, onClick, animationDelay = 0 }) => {
  const [isPressed, setIsPressed] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), animationDelay);
    return () => clearTimeout(timer);
  }, [animationDelay]);

  const catColors = {
    'Market': '#1E8E3E',
    'Fun': '#9334E6',
    'Event': '#E85D3F',
    'Other': '#5F6368',
    'Food & Drink': '#DC2626',
    'Music': '#7C3AED',
    'Markets': '#E8783A',
  };

  return (
    <div
      onClick={() => onClick(event)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      style={{
        flex: '0 0 auto',
        width: 260,
        background: WHITE,
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: isPressed
          ? SHADOW_SM
          : SHADOW_CARD,
        transform: isPressed ? 'scale(0.98)' : isVisible ? 'scale(1)' : 'scale(0.98)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
        cursor: 'pointer',
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', height: 140 }}>
        <img
          src={getEventCover(event)}
          alt={event.title}
          loading="lazy"
          decoding="async"
          onError={() => setImgError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        {/* Category badge */}
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            padding: '6px 12px',
            background: catColors[event.category] || GRAY,
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 700,
            color: WHITE,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {event.category}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '14px' }}>
        <h3
          title={event.title}
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: BLACK,
            marginBottom: 6,
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {event.title}
        </h3>
        <p
          style={{
            fontSize: 13,
            color: GRAY,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Icon name="calendar" size={14} color={GRAY} />
          {event.dateLabel}
        </p>
      </div>
    </div>
  );
});

HorizontalEventCard.displayName = 'HorizontalEventCard';

// Search Bar with filter icon inside
const HomeSearchBar = memo(({ value, onChange, onClear, animationDelay = 0 }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), animationDelay);
    return () => clearTimeout(timer);
  }, [animationDelay]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: WHITE,
        borderRadius: 32,
        padding: '12px 16px',
        boxShadow: isFocused ? SHADOW_CARD_HOVER : SHADOW_CARD,
        transition: 'box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.28s ease, transform 0.28s ease',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(16px)',
      }}
    >
      <Icon name="search" size={20} color={GRAY} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder="Search events..."
        style={{
          flex: 1,
          border: 'none',
          outline: 'none',
          fontSize: 16,
          fontFamily: FONT,
          background: 'transparent',
          color: BLACK,
        }}
      />
      {value ? (
        <button
          onClick={onClear}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="x" size={16} color={GRAY} />
        </button>
      ) : (
        <Icon name="filter" size={18} color={GRAY} />
      )}
    </div>
  );
});

HomeSearchBar.displayName = 'HomeSearchBar';

// Animated Header Component
const AnimatedHeader = memo(({ user, location, onSetLocation }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div style={{ marginBottom: 28, opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(16px)', transition: 'opacity 0.28s ease, transform 0.28s ease' }}>
      <p style={{ fontSize: 14, color: GRAY, marginBottom: 4 }}>
        Welcome Back!
      </p>
      <h1 style={{
        fontSize: 26,
        fontWeight: 800,
        color: BLACK,
        marginBottom: 8,
        letterSpacing: '-0.5px',
      }}>
        {user?.firstName || 'Guest'}
      </h1>
      {/* Location Display - Always visible and tappable */}
      <button
        onClick={onSetLocation}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 13,
          color: location?.name ? GRAY : ACCENT,
          background: 'none',
          border: 'none',
          padding: '4px 0',
          cursor: 'pointer',
          fontFamily: FONT,
        }}
      >
        <Icon name="location" size={14} color={location?.name ? GRAY : ACCENT} />
        {location?.name || 'Set your location'}
      </button>
    </div>
  );
});

AnimatedHeader.displayName = 'AnimatedHeader';

// Animated Section Title
const AnimatedSectionTitle = memo(({ title, animationDelay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), animationDelay);
    return () => clearTimeout(timer);
  }, [animationDelay]);

  return (
    <h2 style={{
      fontSize: 20,
      fontWeight: 700,
      color: BLACK,
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0)' : 'translateY(16px)',
      transition: 'opacity 0.28s ease, transform 0.28s ease',
    }}>
      {title}
    </h2>
  );
});

AnimatedSectionTitle.displayName = 'AnimatedSectionTitle';

// Dark Theme Design Tokens - DEPRECATED
// Use LIGHT_THEME from theme.js instead for visual consistency across all screens
const DARK_BG = LIGHT_THEME.background;
const DARK_CARD = LIGHT_THEME.card;
const DARK_CARD_HOVER = LIGHT_THEME.cardHover;
const DARK_TEXT = LIGHT_THEME.textPrimary;
const DARK_TEXT_SECONDARY = LIGHT_THEME.textSecondary;
// ACCENT and ACCENT_LIGHT are imported from theme.js

// Legacy greeting function - use getSASTGreeting from theme.js for SAST timezone
// Kept for backward compatibility
const getGreeting = () => getSASTGreeting();

// Category Pill Button (Dark Theme)
const DarkCategoryPill = memo(({ label, isActive, onClick, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 20px',
        borderRadius: 999,
        border: 'none',
        background: isActive ? ACCENT : DARK_CARD,
        color: isActive ? DARK_TEXT : DARK_TEXT_SECONDARY,
        fontSize: 14,
        fontWeight: 600,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: isActive ? '0 4px 16px rgba(232, 80, 58, 0.3)' : SHADOW_BUTTON,
      }}
    >
      {label}
    </button>
  );
});

DarkCategoryPill.displayName = 'DarkCategoryPill';

// Featured Event Card (Hero Section)
const FeaturedEventCard = memo(({ event, onClick }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      onClick={() => onClick?.(event)}
      style={{
        background: DARK_CARD,
        borderRadius: 24,
        overflow: 'hidden',
        boxShadow: SHADOW_CARD_HOVER,
        transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.98)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        cursor: 'pointer',
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', height: 180 }}>
        <img
          src={getEventCover(event)}
          alt={event.title}
          loading="lazy"
          decoding="async"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(to bottom, transparent 0%, rgba(26,26,46,0.8) 100%)',
        }} />
        <div style={{
          position: 'absolute',
          top: 12,
          right: 12,
          background: ACCENT,
          color: DARK_TEXT,
          padding: '6px 14px',
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          Trending
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '20px' }}>
        <h3 title={event.title} style={{
          fontSize: 20,
          fontWeight: 700,
          color: DARK_TEXT,
          marginBottom: 8,
          lineHeight: 1.3,
        }}>
          {event.title}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Icon name="calendar" size={16} color={ACCENT} />
          <span style={{ fontSize: 14, color: DARK_TEXT_SECONDARY }}>{event.dateLabel}</span>
        </div>
        <button style={{
          width: '100%',
          padding: '14px',
          borderRadius: 12,
          border: 'none',
          background: ACCENT,
          color: DARK_TEXT,
          fontSize: 15,
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          boxShadow: '0 4px 16px rgba(232, 80, 58, 0.3)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}>
          Join Event
          <Icon name="chevronRight" size={16} color={DARK_TEXT} />
        </button>
      </div>
    </div>
  );
});

FeaturedEventCard.displayName = 'FeaturedEventCard';

// Compact Event Card (for Popular This Weekend)
const CompactEventCard = memo(({ event, onClick, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      onClick={() => onClick?.(event)}
      style={{
        flex: '0 0 auto',
        width: 160,
        background: DARK_CARD,
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: SHADOW_CARD_HOVER,
        transform: isVisible ? 'translateY(0)' : 'translateY(15px)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        cursor: 'pointer',
      }}
    >
      <div style={{ position: 'relative', height: 100 }}>
        <img
          src={getEventCover(event)}
          alt={event.title}
          loading="lazy"
          decoding="async"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{
          position: 'absolute',
          bottom: 8,
          left: 8,
          background: OVERLAY_DARK,
          backdropFilter: 'blur(4px)',
          padding: '4px 8px',
          borderRadius: 8,
          fontSize: 11,
          fontWeight: 600,
          color: DARK_TEXT,
        }}>
          {event.category}
        </div>
      </div>
      <div style={{ padding: '12px' }}>
        <h4 title={event.title} style={{
          fontSize: 13,
          fontWeight: 600,
          color: DARK_TEXT,
          marginBottom: 4,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {event.title}
        </h4>
        <p style={{ fontSize: 12, color: DARK_TEXT_SECONDARY, margin: 0 }}>{event.dateLabel}</p>
      </div>
    </div>
  );
});

CompactEventCard.displayName = 'CompactEventCard';

// Event Card with Attendee Count (for Events Near You)
const EventCardWithAttendees = memo(({ event, onClick, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  // Use real attendee data from event or fallback
  const attendeeCount = event.attendeeCount || 0;
  const attendeeAvatars = event.attendeeAvatars || [];

  return (
    <div
      onClick={() => onClick?.(event)}
      style={{
        display: 'flex',
        gap: 14,
        background: LIGHT_THEME.card,
        borderRadius: 16,
        padding: 14,
        boxShadow: LIGHT_THEME.shadowCard,
        transform: isVisible ? 'translateX(0)' : 'translateX(-20px)',
        opacity: isVisible ? 1 : 0,
        transition: LIGHT_THEME.transitionSlow,
        cursor: 'pointer',
        border: `1px solid ${LIGHT_THEME.border}`,
      }}
    >
      {/* Image */}
      <div style={{
        width: 80,
        height: 80,
        borderRadius: 12,
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        <img
          src={getEventCover(event)}
          alt={event.title}
          loading="lazy"
          decoding="async"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{
          display: 'inline-block',
          padding: '3px 8px',
          borderRadius: 6,
          background: ACCENT_LIGHT,
          color: ACCENT,
          fontSize: 11,
          fontWeight: 600,
          marginBottom: 6,
          alignSelf: 'flex-start',
        }}>
          {event.category}
        </div>
        <h4 title={event.title} style={{
          fontSize: 15,
          fontWeight: 600,
          color: LIGHT_THEME.textPrimary,
          marginBottom: 4,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {event.title}
        </h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <Icon name="calendar" size={12} color={GRAY} />
          <span style={{ fontSize: 12, color: GRAY }}>{event.dateLabel}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="location" size={12} color={GRAY} />
          <span style={{ fontSize: 12, color: GRAY, flex: 1 }}>{event.area}</span>
          {attendeeCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginRight: 4 }}>
                {attendeeAvatars.slice(0, 3).map((avatar, i) => (
                  <img
                    key={i}
                    src={avatar}
                    alt=""
                    loading="lazy"
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      border: `2px solid ${LIGHT_THEME.card}`,
                      marginLeft: i > 0 ? -8 : 0,
                      objectFit: 'cover',
                    }}
                  />
                ))}
              </div>
              <span style={{ fontSize: 12, color: LIGHT_THEME.success, fontWeight: 600 }}>
                {attendeeCount} going
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

EventCardWithAttendees.displayName = 'EventCardWithAttendees';

// Section Header with "See all" link
const SectionHeader = memo(({ title, onSeeAll, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
      opacity: isVisible ? 1 : 0,
      transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
    }}>
      <h2 style={{
        fontSize: 20,
        fontWeight: 700,
        color: DARK_TEXT,
        letterSpacing: '-0.3px',
      }}>
        {title}
      </h2>
      {onSeeAll && (
        <button
          onClick={onSeeAll}
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: ACCENT,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          See all
          <Icon name="chevronRight" size={14} color={ACCENT} />
        </button>
      )}
    </div>
  );
});

SectionHeader.displayName = 'SectionHeader';

// Our Story / About Section
const OurStorySection = memo(() => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    const element = document.getElementById('our-story');
    if (element) observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const values = [
    { emoji: '🤝', title: 'Community', desc: 'Bringing people together' },
    { emoji: '📣', title: 'Visibility', desc: 'For local businesses' },
    { emoji: '📅', title: 'Everything', desc: 'All events in one place' },
  ];

  return (
    <div
      id="our-story"
      style={{
        background: WHITE,
        borderRadius: 24,
        padding: 28,
        marginTop: 32,
        marginBottom: 32,
        boxShadow: SHADOW_CARD_HOVER,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <h2 style={{
        fontSize: 22,
        fontWeight: 700,
        color: DARK_TEXT,
        marginBottom: 12,
      }}>
        Why We Built This
      </h2>
      <p style={{
        fontSize: 15,
        lineHeight: 1.7,
        color: DARK_TEXT_SECONDARY,
        marginBottom: 24,
      }}>
        We started this platform to bring people and communities closer together.
        Local businesses needed a better way to share their events, and people
        were tired of missing out because information was scattered across dozens
        of different platforms. Now, everything lives in one place — so you never
        miss a moment that matters.
      </p>

      {/* Core Values */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>
        {values.map((value, index) => (
          <div
            key={value.title}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: 16,
              background: GRAY_LIGHT,
              borderRadius: 16,
              border: `1px solid ${LIGHT_THEME.border}`,
              transform: isVisible ? 'translateX(0)' : 'translateX(-20px)',
              opacity: isVisible ? 1 : 0,
              transition: `all 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.1}s`,
            }}
          >
            <span style={{ fontSize: 28 }}>{value.emoji}</span>
            <div>
              <h3 style={{
                fontSize: 16,
                fontWeight: 700,
                color: DARK_TEXT,
                marginBottom: 2,
              }}>
                {value.title}
              </h3>
              <p style={{
                fontSize: 13,
                color: DARK_TEXT_SECONDARY,
                margin: 0,
              }}>
                {value.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

OurStorySection.displayName = 'OurStorySection';

// Main Home Screen Component - Beautiful Dark Theme
const HomeScreen = memo(({
  user,
  location,
  events,
  eventsLoading,
  onEventClick,
  onSeeAllClick,
  onSetLocation,
  onSearchFocus,
}) => {
  const [activeCategory, setActiveCategory] = useState('All');

  // All upcoming events — full horizontal scroll
  const allEvents = useMemo(() => {
    return events
      .filter(e => e.status !== 'removed' && new Date(e.start) > new Date())
      .sort((a, b) => new Date(a.start) - new Date(b.start));
  }, [events]);

  // Categories for pill buttons — derived from actual event data
  const categories = useMemo(() => {
    const cats = new Set(allEvents.map(e => e.category).filter(Boolean));
    return ['All', ...Array.from(cats).slice(0, 6)];
  }, [allEvents]);

  // Quick category filter (optional)
  const filteredEvents = useMemo(() => {
    if (activeCategory === 'All') return allEvents;
    const cat = activeCategory.toLowerCase();
    return allEvents.filter(e =>
      (e.category || '').toLowerCase().includes(cat)
    );
  }, [allEvents, activeCategory]);

  // Use getUserFirstName for consistent first name extraction
  const userName = getUserFirstName(user);

  return (
    <div style={{
      minHeight: '100vh',
      background: DARK_BG,
      padding: '24px 20px 120px',
      maxWidth: 390,
      margin: '0 auto',
    }}>
      {/* Header with Greeting */}
      <div style={{ marginBottom: 24 }}>
        <p style={{
          fontSize: 14,
          color: DARK_TEXT_SECONDARY,
          marginBottom: 4,
          transform: 'translateY(0)',
          opacity: 1,
          animation: 'fadeInDown 0.5s ease',
        }}>
          {getGreeting()} 👋
        </p>
        <h1 style={{
          fontSize: 28,
          fontWeight: 800,
          color: DARK_TEXT,
          lineHeight: 1.2,
          letterSpacing: '-0.5px',
          marginBottom: 8,
          animation: 'fadeInUp 0.5s ease 0.1s both',
        }}>
          Discover what's happening around you, {userName}
        </h1>
      </div>

      {/* Search Bar with Filter — tapping navigates to Search tab */}
      <div
        onClick={onSeeAllClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: DARK_CARD,
          borderRadius: 16,
          padding: '14px 18px',
          marginBottom: 28,
          boxShadow: SHADOW_CARD_HOVER,
          animation: 'fadeInUp 0.5s ease 0.2s both',
          cursor: 'pointer',
        }}
      >
        <Icon name="search" size={20} color={DARK_TEXT_SECONDARY} />
        <span
          style={{
            flex: 1,
            fontSize: 15,
            fontFamily: FONT,
            color: DARK_TEXT_SECONDARY,
            userSelect: 'none',
          }}
        >
          Search events...
        </span>
        <div style={{
          background: ACCENT_LIGHT,
          border: 'none',
          borderRadius: 10,
          padding: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Icon name="filter" size={18} color={ACCENT} />
        </div>
      </div>

      {/* Category Filter Row */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          paddingBottom: 4,
          WebkitOverflowScrolling: 'touch',
        }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '8px 16px',
                borderRadius: 999,
                border: 'none',
                fontSize: 14,
                fontWeight: activeCategory === cat ? 600 : 500,
                background: activeCategory === cat ? ACCENT : DARK_CARD,
                color: activeCategory === cat ? WHITE : DARK_TEXT_SECONDARY,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                flexShrink: 0,
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* All Events — horizontally scrollable */}
      <div style={{ marginBottom: 32 }}>
        <SectionHeader
          title={activeCategory === 'All' ? 'All Events' : `${activeCategory} Events`}
          onSeeAll={onSeeAllClick}
          delay={300}
        />
        <div style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          paddingBottom: 12,
          WebkitOverflowScrolling: 'touch',
          scrollSnapType: 'x mandatory',
        }}>
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event, index) => (
              <div key={event.id} style={{ scrollSnapAlign: 'start', flexShrink: 0 }}>
                <CompactEventCard
                  event={event}
                  onClick={onEventClick}
                  delay={400 + (index * 60)}
                />
              </div>
            ))
          ) : (
            <div style={{
              padding: 40,
              textAlign: 'center',
              background: DARK_CARD,
              borderRadius: 16,
              width: '100%',
            }}>
              <p style={{ color: DARK_TEXT_SECONDARY, margin: 0 }}>
                No upcoming events
              </p>
            </div>
          )}
          <div style={{ flex: '0 0 8px' }} />
        </div>
      </div>

      {/* Our Story / About Section */}
      <OurStorySection />

      {/* Footer / Bottom Padding */}
      <div style={{ height: 20 }} />

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
});

HomeScreen.displayName = 'HomeScreen';

// Location Picker Modal Component
const LocationPickerModal = memo(({
  isOpen,
  onClose,
  currentLocation,
  onUseCurrentLocation,
  onSelectLocation,
}) => {
  const [activeTab, setActiveTab] = useState('current');
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!searchQuery || searchQuery.length < 3) {
      setPredictions([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const { searchPlaces } = await import('./lib/location');
        const result = await searchPlaces(searchQuery);
        if (result.predictions) {
          setPredictions(result.predictions.slice(0, 5));
        }
      } catch (err) {
        safeLog.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleUseCurrentLocation = async () => {
    setPermissionError(null);
    try {
      const position = await onUseCurrentLocation();
      if (position) {
        onClose();
      } else {
        setPermissionError('Location permission denied. Please enable location services or enter manually.');
      }
    } catch (err) {
      setPermissionError('Unable to get your location. Please try again or enter manually.');
    }
  };

  const handleSelectPrediction = async (prediction) => {
    try {
      const { geocodeAddress } = await import('./lib/location');
      const result = await geocodeAddress(prediction.description);
      if (result.location) {
        onSelectLocation(result.location.lat, result.location.lng, prediction.description);
        onClose();
      }
    } catch (err) {
      safeLog.error('Geocoding error:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        background: OVERLAY_DARK,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: WHITE,
          borderRadius: '20px 20px 0 0',
          padding: '24px 20px 40px',
          maxHeight: '80vh',
          overflowY: 'auto',
          animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Handle bar */}
        <div
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            background: GRAY_LIGHT,
            margin: '0 auto 20px',
          }}
        />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: BLACK, margin: 0 }}>
            Set Location
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="x" size={24} color={GRAY} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <button
            onClick={() => setActiveTab('current')}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 12,
              border: 'none',
              background: activeTab === 'current' ? BLACK : GRAY_LIGHT,
              color: activeTab === 'current' ? WHITE : BLACK,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: FONT,
            }}
          >
            Use Current Location
          </button>
          <button
            onClick={() => {
              setActiveTab('manual');
              setTimeout(() => inputRef.current?.focus(), 100);
            }}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 12,
              border: 'none',
              background: activeTab === 'manual' ? BLACK : GRAY_LIGHT,
              color: activeTab === 'manual' ? WHITE : BLACK,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: FONT,
            }}
          >
            Enter Address
          </button>
        </div>

        {/* Current Location Tab */}
        {activeTab === 'current' && (
          <div>
            <button
              onClick={handleUseCurrentLocation}
              style={{
                width: '100%',
                padding: '16px',
                background: ACCENT,
                color: WHITE,
                border: 'none',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontFamily: FONT,
                transform: 'scale(1)',
                transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.96)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Icon name="location" size={18} color={WHITE} />
              Use My Current Location
            </button>

            {currentLocation?.name && (
              <div style={{ marginTop: 16, padding: 12, background: GRAY_LIGHT, borderRadius: 8 }}>
                <p style={{ margin: 0, fontSize: 13, color: GRAY }}>Current location:</p>
                <p style={{ margin: '4px 0 0 0', fontSize: 14, fontWeight: 600, color: BLACK }}>{currentLocation.name}</p>
              </div>
            )}

            {permissionError && (
              <div style={{ marginTop: 16, padding: 12, background: ERROR_LIGHT, borderRadius: 8 }}>
                <p style={{ margin: 0, fontSize: 13, color: ACCENT }}>{permissionError}</p>
              </div>
            )}
          </div>
        )}

        {/* Manual Entry Tab */}
        {activeTab === 'manual' && (
          <div>
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter your address or area..."
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  paddingLeft: 44,
                  border: `1.5px solid ${GRAY_LIGHT}`,
                  borderRadius: 12,
                  fontSize: 15,
                  fontFamily: FONT,
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = ACCENT;
                  e.target.style.boxShadow = `0 0 0 3px ${ACCENT_LIGHT}`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = GRAY_LIGHT;
                  e.target.style.boxShadow = 'none';
                }}
              />
              <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
                <Icon name="search" size={18} color={GRAY} />
              </div>
            </div>

            {/* Predictions */}
            {isLoading && (
              <p style={{ textAlign: 'center', color: GRAY, fontSize: 14 }}>Searching...</p>
            )}

            {predictions.length > 0 && (
              <div style={{ border: `1px solid ${GRAY_LIGHT}`, borderRadius: 12, overflow: 'hidden' }}>
                {predictions.map((prediction, index) => (
                  <button
                    key={prediction.place_id}
                    onClick={() => handleSelectPrediction(prediction)}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      background: index % 2 === 0 ? WHITE : GRAY_LIGHT,
                      border: 'none',
                      borderBottom: index < predictions.length - 1 ? `1px solid ${GRAY_LIGHT}` : 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: 14,
                      fontFamily: FONT,
                    }}
                  >
                    {prediction.description}
                  </button>
                ))}
              </div>
            )}

            {searchQuery.length >= 3 && !isLoading && predictions.length === 0 && (
              <p style={{ textAlign: 'center', color: GRAY, fontSize: 14 }}>No results found</p>
            )}
          </div>
        )}
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
});

LocationPickerModal.displayName = 'LocationPickerModal';

// Search Screen Component (Events/Discover Tab)
const SearchScreen = memo(({
  events,
  filteredEvents,
  eventsLoading,
  searchQuery,
  setSearchQuery,
  cat,
  setCat,
  onEventClick,
}) => {
  return (
    <div style={{ padding: '16px', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ marginBottom: 20, animation: 'fadeInUp 0.22s ease-out' }}>
        <h1 style={{
          fontSize: 26, fontWeight: 800, color: BLACK,
          marginBottom: 4, letterSpacing: '-0.5px',
        }}>
          Discover
        </h1>
        <p style={{ fontSize: 14, color: GRAY }}>
          Find local markets & events near you
        </p>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: 20, animation: 'fadeInUp 0.22s ease-out 0.05s both' }}>
        <HomeSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery('')}
        />
      </div>

      {/* Category Pills - Horizontal Scroll */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          marginBottom: 20,
          paddingBottom: 8,
          marginLeft: -16,
          marginRight: -16,
          paddingLeft: 16,
          paddingRight: 16,
          WebkitOverflowScrolling: 'touch',
          animation: 'fadeInUp 0.22s ease-out 0.1s both',
          cursor: 'grab',
          userSelect: 'none',
          touchAction: 'pan-x',
        }}
        onMouseDown={(e) => { e.currentTarget.style.cursor = 'grabbing'; }}
        onMouseUp={(e) => { e.currentTarget.style.cursor = 'grab'; }}
        onMouseLeave={(e) => { e.currentTarget.style.cursor = 'grab'; }}
        onTouchStart={(e) => { e.currentTarget.style.cursor = 'grabbing'; }}
        onTouchEnd={(e) => { e.currentTarget.style.cursor = 'grab'; }}
      >
        <CategoryPill
          label="All"
          isActive={cat === "all"}
          onClick={() => setCat("all")}
        />
        {MAIN_CATEGORIES.slice(0, 6).map(c => (
          <CategoryPill
            key={c.id}
            label={c.name}
            isActive={cat === c.id}
            color={c.color}
            onClick={() => setCat(c.id)}
          />
        ))}
      </div>

      {/* Events Count */}
      <div style={{ marginBottom: 16, animation: 'fadeInUp 0.22s ease-out 0.15s both' }}>
        <span style={{ fontSize: 13, color: GRAY }}>
          {eventsLoading ? 'Loading...' : `${filteredEvents.length} events`}
        </span>
      </div>

      {/* Events List */}
      {eventsLoading ? (
        <SkeletonList count={3} />
      ) : filteredEvents.length > 0 ? (
        <div className="event-grid" style={{ display: 'contents' }}>
          {filteredEvents.map((ev, index) => (
            <EventCard
              key={ev.id}
              event={ev}
              onClick={onEventClick}
              animationDelay={index * 60}
            />
          ))}
        </div>
      ) : searchQuery ? (
        <EmptyState
          variant="search"
          icon=""
          title={`No results for "${searchQuery}"`}
          description="Try adjusting your search or filter to find what you're looking for."
          actionLabel="Clear Search"
          onAction={() => setSearchQuery('')}
        />
      ) : (
        <EmptyState
          variant="events"
          icon=""
          title="No events yet"
          description="Check back soon for exciting events in your area!"
        />
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
});

SearchScreen.displayName = 'SearchScreen';

// Calendar Event Card
const CalendarEventCard = memo(({ event, onClick, animationDelay = 0 }) => {
  const [isPressed, setIsPressed] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), animationDelay);
    return () => clearTimeout(timer);
  }, [animationDelay]);

  const catColors = {
    'Market': '#1E8E3E',
    'Fun': '#9334E6',
    'Event': '#E85D3F',
    'Other': '#5F6368',
    'Food & Drink': '#DC2626',
    'Music': '#7C3AED',
    'Markets': '#E8783A',
  };

  return (
    <div
      onClick={() => onClick(event)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      style={{
        display: 'flex',
        gap: 12,
        padding: '12px',
        background: WHITE,
        borderRadius: 12,
        boxShadow: isPressed ? SHADOW_SM : SHADOW_CARD,
        transform: isPressed ? 'scale(0.97)' : isVisible ? 'scale(1)' : 'scale(0.97)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
        cursor: 'pointer',
      }}
    >
      {/* Event Image */}
      <div style={{ width: 80, height: 80, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
        <img
          src={getEventCover(event)}
          alt={event.title}
          loading="lazy"
          decoding="async"
          onError={() => setImgError(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      {/* Event Info */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{
          display: 'inline-block',
          padding: '2px 8px',
          borderRadius: 4,
          background: `${catColors[event.category] || GRAY}15`,
          color: catColors[event.category] || GRAY,
          fontSize: 11,
          fontWeight: 600,
          marginBottom: 6,
          alignSelf: 'flex-start',
        }}>
          {event.category}
        </div>
        <h4 title={event.title} style={{
          fontSize: 14,
          fontWeight: 700,
          color: BLACK,
          marginBottom: 4,
          lineHeight: 1.3,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {event.title}
        </h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icon name="clock" size={12} color={GRAY} />
          <span style={{ fontSize: 12, color: GRAY }}>
            {new Date(event.start).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
});

CalendarEventCard.displayName = 'CalendarEventCard';

// Calendar Screen Component
const CalendarScreen = memo(({
  events,
  onEventClick,
  onBack,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'list'
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState('next');

  // Get events grouped by date
  const eventsByDate = useMemo(() => {
    const grouped = {};
    events.forEach(event => {
      if (event.status !== 'removed') {
        const dateKey = new Date(event.start).toDateString();
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(event);
      }
    });
    return grouped;
  }, [events]);

  // Get days in month
  const getDaysInMonth = (year, month) => {
    const days = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    // Add empty cells for days before the first of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const days = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());

  // Navigation handlers with animation
  const goToPreviousMonth = () => {
    if (isAnimating) return;
    setAnimationDirection('prev');
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
      setIsAnimating(false);
    }, 100);
  };

  const goToNextMonth = () => {
    if (isAnimating) return;
    setAnimationDirection('next');
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
      setIsAnimating(false);
    }, 100);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  // Get events for selected date
  const selectedDateEvents = useMemo(() => {
    const dateKey = selectedDate.toDateString();
    return eventsByDate[dateKey] || [];
  }, [eventsByDate, selectedDate]);

  // Get upcoming events for current month
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter(e => e.status !== 'removed' && new Date(e.start) >= now)
      .sort((a, b) => new Date(a.start) - new Date(b.start))
      .slice(0, 10);
  }, [events]);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const today = new Date();
  const isToday = (date) => date && date.toDateString() === today.toDateString();
  const isSelected = (date) => date && date.toDateString() === selectedDate.toDateString();

  return (
    <div style={{ padding: '16px', paddingBottom: 100, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
        animation: 'fadeInUp 0.22s ease-out'
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
          }}
          aria-label="Go back"
        >
          <Icon name="arrowLeft" size={24} color={BLACK} />
        </button>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: BLACK, letterSpacing: '-0.5px' }}>
          Events Calendar
        </h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setViewMode('month')}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: 'none',
              background: viewMode === 'month' ? BLACK : GRAY_LIGHT,
              color: viewMode === 'month' ? WHITE : GRAY,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="grid" size={18} color={viewMode === 'month' ? WHITE : GRAY} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: 'none',
              background: viewMode === 'list' ? BLACK : GRAY_LIGHT,
              color: viewMode === 'list' ? WHITE : GRAY,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="list" size={18} color={viewMode === 'list' ? WHITE : GRAY} />
          </button>
        </div>
      </div>

      {viewMode === 'month' ? (
        <>
          {/* Month Navigation */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
            animation: 'fadeInUp 0.22s ease-out 0.05s both'
          }}>
            <button
              onClick={goToPreviousMonth}
              style={{
                padding: '8px',
                borderRadius: 8,
                border: 'none',
                background: GRAY_LIGHT,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: 'scale(1)',
                transition: 'transform 0.15s ease',
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.92)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Icon name="chevronLeft" size={20} />
            </button>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: BLACK }}>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={goToNextMonth}
              style={{
                padding: '8px',
                borderRadius: 8,
                border: 'none',
                background: GRAY_LIGHT,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: 'scale(1)',
                transition: 'transform 0.15s ease',
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.92)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Icon name="chevronRight" size={20} />
            </button>
          </div>

          {/* Calendar Grid */}
          <div style={{
            marginBottom: 24,
            animation: 'fadeInUp 0.22s ease-out 0.1s both'
          }}>
            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
              {dayNames.map(day => (
                <div key={day} style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: GRAY }}>
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 4,
                transform: isAnimating ? `translateX(${animationDirection === 'next' ? '-30px' : '30px'})` : 'translateX(0)',
                opacity: isAnimating ? 0 : 1,
                transition: 'transform 0.2s ease, opacity 0.2s ease',
              }}
            >
              {days.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} style={{ aspectRatio: '1' }} />;
                }

                const dateKey = date.toDateString();
                const dayEvents = eventsByDate[dateKey] || [];
                const hasEvents = dayEvents.length > 0;

                return (
                  <button
                    key={dateKey}
                    onClick={() => handleDateSelect(date)}
                    style={{
                      aspectRatio: '1',
                      borderRadius: 12,
                      border: 'none',
                      background: isSelected(date) ? ACCENT : isToday(date) ? ACCENT_LIGHT : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      padding: '4px',
                      position: 'relative',
                      transform: isSelected(date) ? 'scale(0.95)' : 'scale(1)',
                      transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  >
                    <span style={{
                      fontSize: 14,
                      fontWeight: isToday(date) || isSelected(date) ? 700 : 500,
                      color: isSelected(date) ? WHITE : isToday(date) ? ACCENT : BLACK,
                    }}>
                      {date.getDate()}
                    </span>

                    {/* Event thumbnails */}
                    {hasEvents && (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        marginTop: 2,
                        alignItems: 'center',
                      }}>
                        {dayEvents.slice(0, 3).map((event, idx) => (
                          <img
                            key={event.id}
                            src={getEventCover(event)}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: `2px solid ${isSelected(date) ? ACCENT : WHITE}`,
                              marginTop: idx > 0 ? -8 : 0,
                            }}
                          />
                        ))}
                        {dayEvents.length > 3 && (
                          <span style={{
                            fontSize: 9,
                            fontWeight: 600,
                            color: isSelected(date) ? WHITE : GRAY,
                            marginTop: 2,
                          }}>
                            +{dayEvents.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Events for selected date */}
          <div style={{ animation: 'fadeInUp 0.22s ease-out 0.15s both' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: BLACK, marginBottom: 12 }}>
              {isSelected(today) ? "Today's Events" : `Events on ${selectedDate.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' })}`}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {selectedDateEvents.length > 0 ? (
                selectedDateEvents.map((event, index) => (
                  <CalendarEventCard
                    key={event.id}
                    event={event}
                    onClick={onEventClick}
                    animationDelay={index * 60}
                  />
                ))
              ) : (
                <div style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  background: GRAY_LIGHT,
                  borderRadius: 12,
                }}>
                  <p style={{ fontSize: 14, color: GRAY, marginBottom: 8 }}>
                    No events on this day
                  </p>
                  <p style={{ fontSize: 13, color: GRAY_MEDIUM }}>
                    Explore upcoming events below
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming events this month */}
          <div style={{ marginTop: 32, animation: 'fadeInUp 0.22s ease-out 0.2s both' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: BLACK, marginBottom: 12 }}>
              Upcoming This Month
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {upcomingEvents
                .filter(e => new Date(e.start).getMonth() === currentDate.getMonth())
                .slice(0, 5)
                .map((event, index) => (
                  <CalendarEventCard
                    key={event.id}
                    event={event}
                    onClick={onEventClick}
                    animationDelay={index * 60}
                  />
                ))}
            </div>
          </div>
        </>
      ) : (
        /* List View */
        <div style={{ animation: 'fadeInUp 0.22s ease-out' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: BLACK, marginBottom: 12 }}>
            All Upcoming Events
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event, index) => (
                <CalendarEventCard
                  key={event.id}
                  event={event}
                  onClick={onEventClick}
                  animationDelay={index * 60}
                />
              ))
            ) : (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                background: GRAY_LIGHT,
                borderRadius: 12,
              }}>
                <p style={{ fontSize: 14, color: GRAY }}>
                  No upcoming events
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
});

CalendarScreen.displayName = 'CalendarScreen';

// Scroll-aware Bottom Navigation with 4 tabs
const BottomNav = ({ activeTab, onTabChange }) => {
  const isVisible = useBottomNavScroll();

  const tabs = [
    { id: 'home', icon: 'home', label: 'Home' },
    { id: 'events', icon: 'search', label: 'Search' },
    { id: 'calendar', icon: 'calendar', label: 'Calendar' },
    { id: 'profile', icon: 'user', label: 'Profile' },
  ];

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
      opacity: isVisible ? 1 : 0,
      transition: 'transform 0.3s ease, opacity 0.25s ease',
      pointerEvents: isVisible ? 'auto' : 'none',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        padding: '12px 16px calc(12px + env(safe-area-inset-bottom))',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          gap: 4,
          background: 'rgba(26,26,26,0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 999,
          padding: '6px 8px',
          boxShadow: SHADOW_CARD_HOVER,
          maxWidth: 380,
          width: '100%',
        }}>
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1,
                  minWidth: 60,
                  padding: '6px 8px',
                  background: isActive ? ACCENT : 'transparent',
                  borderRadius: 999,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  transform: isActive ? 'scale(1.05)' : 'scale(1)',
                }}
                onMouseDown={(e) => {
                  if (!isActive) e.currentTarget.style.transform = 'scale(0.95)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = isActive ? 'scale(1.05)' : 'scale(1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = isActive ? 'scale(1.05)' : 'scale(1)';
                }}
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon
                  name={tab.icon}
                  size={isActive ? 24 : 22}
                  color={isActive ? WHITE : GRAY}
                />
                <span style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: isActive ? WHITE : GRAY,
                  marginTop: 2,
                  opacity: isActive ? 1 : 0.7,
                  transition: 'opacity 0.15s ease',
                }}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// My Events Screen
const MyEventsScreen = ({ events, businessId, onBack, onCreate, onEdit, onDelete, loading }) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const myEvents = useMemo(() => {
    return events.filter(e => e.businessId === businessId || e.user_id === businessId);
  }, [events, businessId]);

  const filteredEvents = useMemo(() => {
    if (activeFilter === 'all') return myEvents;
    return myEvents.filter(e => e.status === activeFilter);
  }, [myEvents, activeFilter]);

  const handleDelete = async (event) => {
    if (deleteConfirm === event.id) {
      await onDelete?.(event);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(event.id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const publishedCount = myEvents.filter(e => e.status === 'published').length;
  const draftCount = myEvents.filter(e => e.status === 'draft').length;

  if (loading) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 150, background: BG, overflowY: 'auto' }}>
        <div style={{ padding: '16px 16px 100px' }}>
          <SkeletonList count={3} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 150, background: BG, overflowY: 'auto' }}>
      <div style={{ padding: '16px 16px 100px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button
            onClick={onBack}
            style={{
              background: WHITE,
              border: 'none',
              borderRadius: 12,
              width: 40,
              height: 40,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: SHADOW_SM,
              transition: 'transform 0.15s ease',
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            aria-label="Go back"
          >
            <Icon name="arrowLeft" size={20} />
          </button>
          <h1 style={{ fontFamily: FONT, fontSize: 22, fontWeight: 700, color: BLACK }}>
            My Events
          </h1>
          <button
            onClick={onCreate}
            style={{
              marginLeft: 'auto',
              background: BLACK,
              color: WHITE,
              border: 'none',
              borderRadius: 20,
              padding: '10px 16px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transform: 'scale(1)',
              transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.96)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Icon name="plus" size={16} color={WHITE} />
            New
          </button>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[
            { id: 'all', label: 'All', count: myEvents.length },
            { id: 'published', label: 'Published', count: publishedCount },
            { id: 'draft', label: 'Drafts', count: draftCount },
          ].map(filter => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              style={{
                padding: '8px 16px',
                borderRadius: 20,
                border: 'none',
                background: activeFilter === filter.id ? BLACK : WHITE,
                color: activeFilter === filter.id ? WHITE : GRAY,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: activeFilter === filter.id ? 'none' : SHADOW_SM,
                transform: 'scale(1)',
                transition: 'transform 0.15s ease',
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.96)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {filter.label}
              <span style={{
                background: activeFilter === filter.id ? 'rgba(255,255,255,0.2)' : GRAY_LIGHT,
                color: activeFilter === filter.id ? WHITE : GRAY,
                borderRadius: 10,
                padding: '2px 8px',
                fontSize: 12,
              }}>
                {filter.count}
              </span>
            </button>
          ))}
        </div>

        {/* Events List */}
        {filteredEvents.length > 0 ? (
          filteredEvents.map((ev, index) => (
            <EventCard
              key={ev.id}
              event={ev}
              showActions
              onEdit={onEdit}
              onDelete={() => handleDelete(ev)}
              animationDelay={index * 60}
            />
          ))
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
          }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: 24,
              background: GRAY_LIGHT,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: 40,
            }}>
              📭
            </div>
            <p style={{ fontSize: 18, fontWeight: 700, color: BLACK, marginBottom: 8 }}>
              {activeFilter === 'all' ? 'No events yet' : `No ${activeFilter} events`}
            </p>
            <p style={{ fontSize: 14, color: GRAY, marginBottom: 24 }}>
              {activeFilter === 'draft' ? 'Create an event and save it as a draft.' : 'Create your first event to get started.'}
            </p>
            <button
              onClick={onCreate}
              style={{
                background: BLACK,
                color: WHITE,
                border: 'none',
                borderRadius: 24,
                padding: '14px 28px',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                transform: 'scale(1)',
                transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.96)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              Create Event
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Favourites helpers (Supabase-backed)
const loadSavedEventIds = (savedEvents) => new Set((savedEvents || []).map(e => e.id));

// Main App
export default function App() {
  const [tab, setTab] = useState("home");
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [favouriteIds, setFavouriteIds] = useState(new Set());
  const [savedEvents, setSavedEvents] = useState([]);
  const [showLoc, setShowLoc] = useState(true);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [locLabel, setLocLabel] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showMyEv, setShowMyEv] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [showNotificationPrefs, setShowNotificationPrefs] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [notification, setNotification] = useState(null);
  const notificationTimeoutRef = useRef(null);
  const notify = useCallback((type, message, duration = 3000) => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    setNotification({ type, message });
    notificationTimeoutRef.current = setTimeout(() => setNotification(null), duration);
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  const [pageTransition, setPageTransition] = useState('idle');

  const { user, business, loading: authLoading, error: authError, signUp, signIn, signOut, refreshBusiness, refreshUser, deleteAccount, clearError } = useAuth();



  // Fetch events
  useEffect(() => {
    const loadEvents = async () => {
      setEventsLoading(true);
      const { data, error } = await fetchEvents();
      if (!error && data) {
        const formatted = data.map(event => ({
          id: event.id,
          title: event.title,
          organiser: event.organiser || '',
          category: event.category?.name || 'Other',
          today: new Date(event.start_time).toDateString() === new Date().toDateString(),
          dateLabel: `${new Date(event.start_time).toLocaleDateString('en-ZA',{weekday:'short',day:'numeric',month:'short'})} · ${new Date(event.start_time).toLocaleTimeString('en-ZA',{hour:'2-digit',minute:'2-digit'})}`,
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
          businessId: event.business_id,
          user_id: event.user_id,
        }));
        setEvents(formatted);
      } else {
        setEvents([]);
      }
      setEventsLoading(false);
    };
    loadEvents();
  }, []);

  const { location, requestLocation, setManualLocation, sortByDistance, filterByRadius } = useLocation();
  const [radiusKm, setRadiusKm] = useState(100);
  const [cat, setCat] = useState("all");
  const [sortBy, setSortBy] = useState("chronological");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState({
    sortBy: "chronological",
    period: "all",
    distance: 25,
    category: "all",
  });

  const handleApplyFilters = useCallback((newFilters) => {
    setFilters(newFilters);
    setSortBy(newFilters.sortBy);
    setCat(newFilters.category);
  }, []);

  // Fetch saved events from Supabase when user logs in
  useEffect(() => {
    if (!user) {
      setFavouriteIds(new Set());
      setSavedEvents([]);
      return;
    }
    fetchSavedEvents().then(({ data, error }) => {
      if (!error && data) {
        setSavedEvents(data);
        setFavouriteIds(loadSavedEventIds(data));
      }
    });
  }, [user]);

  // Toggle favourite for an event
  const handleToggleFavourite = useCallback(async (eventId) => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    const { data, error } = await toggleSaveEvent(eventId);
    if (error) return;
    setFavouriteIds(prev => {
      const next = new Set(prev);
      if (data?.saved) {
        next.add(eventId);
      } else {
        next.delete(eventId);
      }
      return next;
    });
    // Refresh saved events list
    fetchSavedEvents().then(({ data: refreshed }) => {
      if (refreshed) setSavedEvents(refreshed);
    });
  }, [user]);

  // Events enriched with isFavorite flag
  const enrichedEvents = useMemo(() => {
    return events.map(e => ({ ...e, isFavorite: favouriteIds.has(e.id) }));
  }, [events, favouriteIds]);

  const filteredEvents = useMemo(() => {
    let ev = enrichedEvents.filter(e => e.status !== "removed");

    if (cat !== "all") {
      ev = ev.filter(e => e.category?.toLowerCase() === cat.toLowerCase());
    }

    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      ev = ev.filter(e =>
        e.title?.toLowerCase().includes(query) ||
        e.desc?.toLowerCase().includes(query) ||
        e.area?.toLowerCase().includes(query)
      );
    }

    const sorted = [...ev];
    if (sortBy === "chronological") {
      sorted.sort((a, b) => new Date(a.start) - new Date(b.start));
    } else if (sortBy === "alphabetical") {
      sorted.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    } else if (sortBy === "distance" && location?.lat) {
      sorted.sort((a, b) => {
        if (!a.latitude) return 1;
        if (!b.latitude) return -1;
        const distA = calculateDistance(location.lat, location.lng, a.latitude, a.longitude);
        const distB = calculateDistance(location.lat, location.lng, b.latitude, b.longitude);
        return distA - distB;
      });
    }

    // Apply radius filter when location is set and a reasonable radius is chosen
    if (location?.lat && radiusKm > 0 && radiusKm < 5000) {
      return sorted.filter(e => {
        if (!e.latitude || !e.longitude) return false;
        const dist = calculateDistance(location.lat, location.lng, e.latitude, e.longitude);
        return dist <= radiusKm;
      });
    }

    return sorted;
  }, [enrichedEvents, cat, sortBy, debouncedSearchQuery, location]);

  const handleLogin = useCallback(async (email, password, keepSignedIn = false) => {
    const result = await signIn(email, password, keepSignedIn);
    if (result.success) {
      setShowAuth(false);
      setTab("home");
    }
    return result;
  }, [signIn]);

  const handleRegister = useCallback(async (registrationData) => {
    const result = await signUp(registrationData);
    if (result.success) {
      setShowAuth(false);
      switch (result.userType) {
        case 'event_goer':
          setTab("home");
          break;
        case 'organiser':
          setTab("profile");
          break;
        case 'corporate':
          setTab("home");
          break;
        default:
          setTab("home");
      }
    }
    return result;
  }, [signUp]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    setTab("events");
  }, [signOut]);

  const handleCreateEvent = useCallback(async (formData) => {
    const eventData = {
      title: formData.title,
      description: formData.desc,
      category_id: formData.cat,
      start_time: formData.start,
      end_time: formData.end,
      venue: formData.venue,
      area: formData.area,
      phone: formData.phone,
      whatsapp: formData.wa,
      website: formData.web,
      instagram: formData.ig,
      status: formData.status,
      images: formData.images,
    };

    const { data, error } = await createEvent(eventData);
    if (error) {
      notify('error', error.message);
      return;
    }

    if (data) {
      const newEvent = {
        id: data.id,
        title: data.title,
        organiser: business?.business_name || '',
        category: formData.cat,
        today: new Date(data.start_time).toDateString() === new Date().toDateString(),
        dateLabel: `${new Date(data.start_time).toLocaleDateString('en-ZA',{weekday:'short',day:'numeric',month:'short'})} · ${new Date(data.start_time).toLocaleTimeString('en-ZA',{hour:'2-digit',minute:'2-digit'})}`,
        start: data.start_time,
        end: data.end_time,
        area: data.area,
        location: data.venue || data.area,
        address: data.address || data.area,
        latitude: data.latitude,
        longitude: data.longitude,
        img: data.image_url || `https://picsum.photos/seed/${data.id}/800/500`,
        desc: data.description || '',
        status: data.status,
        businessId: data.business_id,
        user_id: data.user_id,
      };
      setEvents(prev => [newEvent, ...prev]);
      notify('success', 'Event created successfully!', 3000);
    }

    setShowCreate(false);
  }, [business]);

  const handleDeleteEvent = useCallback(async (event) => {
    const { error } = await deleteEvent(event.id);
    if (error) {
      notify('error', 'Failed to delete event');
      return;
    }
    setEvents(prev => prev.filter(e => e.id !== event.id));
    notify('success', 'Event deleted successfully', 3000);
  }, []);

  const tabTransitionRef = useRef(null);

  const handleTab = useCallback((t) => {
    if (t === "profile" && !user) {
      setShowAuth(true);
      return;
    }
    if (tabTransitionRef.current) {
      clearTimeout(tabTransitionRef.current);
    }
    setPageTransition('exiting');
    tabTransitionRef.current = setTimeout(() => {
      setTab(t);
      setPageTransition('entering');
      tabTransitionRef.current = setTimeout(() => setPageTransition('idle'), 220);
    }, 150);
  }, [user]);

  const appUser = user ? {
    id: business?.id || user.id,
    name: business?.business_name || business?.name || user.user_metadata?.full_name || user.email?.split('@')[0],
    firstName: (user.user_metadata?.full_name || user.email?.split('@')[0])?.split(' ')[0],
    email: user.email,
    count: business?.event_count || 0,
    businessLoaded: !!business || user.user_metadata?.user_type !== 'organiser',
    userType: user.user_metadata?.user_type || 'event_goer',
    photoUrl: user.user_metadata?.avatar_url,
    location: location?.name,
    createdAt: user.created_at,
  } : null;

  const handleLocationAllow = useCallback(async () => {
    const pos = await requestLocation();
    if (pos) {
      setLocLabel("Current location");
      setShowLoc(false);
    }
  }, [requestLocation]);

  const handleLocationManual = useCallback((locData) => {
    if (locData?.lat && locData?.lng) {
      setManualLocation(locData.lat, locData.lng, locData.name);
      setLocLabel(locData.name);
    }
    setShowLoc(false);
  }, [setManualLocation]);

  const handleLocationSkip = useCallback(() => {
    setLocLabel(null);
    setShowLoc(false);
  }, []);

  const handleShareEvent = useCallback(async (event) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?event=${event.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: `Check out ${event.title} on FOMO ZA`,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or failed
      }
    } else {
      navigator.clipboard?.writeText(shareUrl);
      notify('success', 'Link copied to clipboard!', 2000);
    }
  }, []);

  return (
    <ErrorBoundary>
      <div
        className="app-container"
        style={{
          width: '100%',
          maxWidth: 430,
          margin: '0 auto',
          minHeight: '100dvh',
          background: BG,
          position: 'relative',
          fontFamily: FONT,
          overflowX: 'hidden',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Notification Toast */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          style={{
            position: 'fixed',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 300,
            pointerEvents: 'none',
          }}
        >
          {notification && (
            <div
              style={{
                background: notification.type === 'error' ? ERROR : SUCCESS,
                color: WHITE,
                padding: '12px 20px',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                boxShadow: SHADOW_BUTTON,
                animation: 'fadeInDown 0.3s ease',
              }}
            >
              {notification.message}
            </div>
          )}
        </div>

        {/* Main Content */}
        <main id="main-content" style={{
          paddingBottom: 'calc(120px + env(safe-area-inset-bottom))',
          minHeight: '100%',
          overflowY: 'visible',
          overflowX: 'hidden',
        }} role="main"
        >
          {/* Home Screen */}
          {tab === "home" && (
            <div style={{
              opacity: pageTransition === 'exiting' ? 0 : pageTransition === 'entering' ? 1 : 1,
              transform: pageTransition === 'exiting' ? 'translateY(12px)' : pageTransition === 'entering' ? 'translateY(0)' : 'translateY(0)',
              transition: 'opacity 0.22s ease-out, transform 0.22s ease-out',
            }}>
              <HomeScreen
                user={appUser}
                location={location}
                events={enrichedEvents}
                eventsLoading={eventsLoading}
                onEventClick={setSelectedEvent}
                onSeeAllClick={() => handleTab("events")}
                onSetLocation={() => setShowLocationPicker(true)}
              />
            </div>
          )}

          {/* Search/Events Screen */}
          {tab === "events" && (
            <div style={{
              opacity: pageTransition === 'exiting' ? 0 : pageTransition === 'entering' ? 1 : 1,
              transform: pageTransition === 'exiting' ? 'translateY(12px)' : pageTransition === 'entering' ? 'translateY(0)' : 'translateY(0)',
              transition: 'opacity 0.22s ease-out, transform 0.22s ease-out',
            }}>
              <SearchScreen
                events={events}
                filteredEvents={filteredEvents}
                eventsLoading={eventsLoading}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                cat={cat}
                setCat={setCat}
                onEventClick={setSelectedEvent}
              />
            </div>
          )}

          {/* Calendar Screen */}
          {tab === "calendar" && (
            <div style={{
              opacity: pageTransition === 'exiting' ? 0 : pageTransition === 'entering' ? 1 : 1,
              transform: pageTransition === 'exiting' ? 'translateY(12px)' : pageTransition === 'entering' ? 'translateY(0)' : 'translateY(0)',
              transition: 'opacity 0.22s ease-out, transform 0.22s ease-out',
            }}>
              <CalendarScreen
                events={events}
                onEventClick={setSelectedEvent}
                onBack={() => handleTab("home")}
              />
            </div>
          )}

          {/* Profile Screen */}
          {tab === "profile" && (
            <div style={{
              opacity: pageTransition === 'exiting' ? 0 : pageTransition === 'entering' ? 1 : 1,
              transform: pageTransition === 'exiting' ? 'translateY(12px)' : pageTransition === 'entering' ? 'translateY(0)' : 'translateY(0)',
              transition: 'opacity 0.22s ease-out, transform 0.22s ease-out',
            }}>
              {user && !user.email_confirmed_at && (
                <div style={{ padding: '20px 20px 0' }}>
                  <EmailVerificationBanner
                    email={user.email}
                    onResend={async () => {
                      const { error } = await supabase.auth.resend({
                        type: 'signup',
                        email: user.email,
                      });
                      return { success: !error };
                    }}
                    onDismiss={() => {}}
                  />
                </div>
              )}
              <AccountScreen
                user={appUser}
                events={events}
                onCreateEvent={() => {
                  if (!user) {
                    setShowAuth(true);
                    return;
                  }
                  setShowCreate(true);
                }}
                onManageEvents={() => setShowMyEv(true)}
                onEditProfile={() => setShowEditProfile(true)}
                onPrivacySettings={() => setShowPrivacySettings(true)}
                onNotificationPrefs={() => setShowNotificationPrefs(true)}
                onSignIn={() => setShowAuth(true)}
                onSignOut={handleSignOut}
                onDeleteAccount={async () => {
                  const result = await deleteAccount();
                  if (result.success) {
                    setTab("home");
                  }
                  return result;
                }}
                onEditLocation={() => setShowLocationPicker(true)}
                loading={authLoading}
              />
            </div>
          )}
        </main>

        {/* Bottom Navigation */}
        <BottomNav activeTab={tab} onTabChange={handleTab} />

        {/* Location Picker Modal */}
        <LocationPickerModal
          isOpen={showLocationPicker}
          onClose={() => setShowLocationPicker(false)}
          currentLocation={location}
          onUseCurrentLocation={async () => {
            const pos = await requestLocation();
            return pos;
          }}
          onSelectLocation={(lat, lng, name) => {
            setManualLocation(lat, lng, name);
          }}
        />

        {/* Event Detail Screen */}
        {selectedEvent && (
          <div
            className="event-detail"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 200,
              background: WHITE,
              animation: 'slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div
              style={{
                height: '100%',
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {/* Back button */}
              <button
                onClick={() => setSelectedEvent(null)}
                style={{
                  position: 'fixed',
                  top: 16,
                  left: 16,
                  zIndex: 10,
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.95)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: SHADOW_CARD,
                  transition: 'transform 0.15s ease, box-shadow 0.25s ease',
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.92)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                aria-label="Go back"
              >
                <Icon name="arrowLeft" size={20} />
              </button>

              {/* Share button */}
              <button
                onClick={() => handleShareEvent(selectedEvent)}
                style={{
                  position: 'fixed',
                  top: 16,
                  right: 16,
                  zIndex: 10,
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.95)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: SHADOW_CARD,
                  transition: 'transform 0.15s ease, box-shadow 0.25s ease',
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.92)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                aria-label="Share event"
              >
                <Icon name="share" size={20} />
              </button>

              {/* Event Image */}
              <div style={{ height: 280, background: GRAY_LIGHT, position: 'relative' }}>
                <img
                  src={selectedEvent.img}
                  alt={selectedEvent.title}
                  loading="eager"
                  decoding="async"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', inset: 0, display: 'none', alignItems: 'center', justifyContent: 'center', background: GRAY_LIGHT }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={GRAY} strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5" fill={GRAY}/><path d="M21 15l-5-5L5 21"/></svg>
                </div>
              </div>

              {/* Event Content */}
              <div style={{ padding: '24px 20px 100px' }}>
                {/* Category badge */}
                <div style={{
                  display: 'inline-block',
                  padding: '6px 12px',
                  borderRadius: 9999,
                  background: `${getCategoryColor(selectedEvent.category)}15`,
                  color: getCategoryColor(selectedEvent.category),
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 16,
                  letterSpacing: '0.2px',
                }}>
                  {selectedEvent.category}
                </div>

                <h1 style={{
                  fontSize: 26,
                  fontWeight: 700,
                  color: BLACK,
                  marginBottom: 8,
                  lineHeight: 1.2,
                  letterSpacing: '-0.5px',
                }}>
                  {selectedEvent.title}
                </h1>

                <p style={{
                  fontSize: 15,
                  color: GRAY,
                  marginBottom: 28,
                  fontWeight: 400,
                }}>
                  by {selectedEvent.organiser || 'Unknown organizer'}
                </p>

                {/* Event Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* When */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: GRAY_LIGHT,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon name="calendar" size={20} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: 12,
                        color: GRAY,
                        marginBottom: 4,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        fontWeight: 500,
                      }}>
                        When
                      </p>
                      <p style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: BLACK,
                        marginBottom: 2,
                        letterSpacing: '-0.2px',
                      }}>
                        {new Date(selectedEvent.start).toLocaleDateString('en-ZA', {
                          weekday: 'long', day: 'numeric', month: 'long'
                        })}
                      </p>
                      <p style={{
                        fontSize: 14,
                        color: GRAY,
                        letterSpacing: '0.1px',
                      }}>
                        {new Date(selectedEvent.start).toLocaleTimeString('en-ZA', {
                          hour: '2-digit', minute: '2-digit'
                        })} – {new Date(selectedEvent.end).toLocaleTimeString('en-ZA', {
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Where */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: GRAY_LIGHT,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon name="location" size={20} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: 12,
                        color: GRAY,
                        marginBottom: 4,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        fontWeight: 500,
                      }}>
                        Where
                      </p>
                      <p style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: BLACK,
                        marginBottom: 2,
                        letterSpacing: '-0.2px',
                      }}>
                        {selectedEvent.location}
                      </p>
                      <p style={{
                        fontSize: 14,
                        color: GRAY,
                        letterSpacing: '0.1px',
                      }}>
                        {selectedEvent.address}
                      </p>
                      {selectedEvent.latitude && (
                        <a
                          href={`https://maps.google.com/?q=${selectedEvent.latitude},${selectedEvent.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            marginTop: 10,
                            fontSize: 14,
                            color: ACCENT,
                            textDecoration: 'none',
                            fontWeight: 600,
                            padding: '6px 0',
                          }}
                        >
                          <Icon name="map" size={16} color={ACCENT} />
                          Open in Maps
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Buttons */}
                {(selectedEvent.phone || selectedEvent.whatsapp || selectedEvent.website || selectedEvent.instagram) && (
                  <div style={{ marginTop: 32 }}>
                    <h2 style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: GRAY,
                      marginBottom: 14,
                      textTransform: 'uppercase',
                      letterSpacing: '0.8px',
                    }}>
                      Contact
                    </h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                      {selectedEvent.phone && (
                        <ContactButton
                          href={`tel:${selectedEvent.phone}`}
                          icon="phone"
                          label="Call"
                          variant="default"
                        />
                      )}
                      {selectedEvent.whatsapp && (
                        <ContactButton
                          href={`https://wa.me/${selectedEvent.whatsapp.replace(/\D/g, '')}`}
                          icon="phone"
                          label="WhatsApp"
                          variant="whatsapp"
                          external
                        />
                      )}
                      {selectedEvent.website && (
                        <ContactButton
                          href={selectedEvent.website.startsWith('http') ? selectedEvent.website : `https://${selectedEvent.website}`}
                          icon="external"
                          label="Website"
                          variant="dark"
                          external
                        />
                      )}
                      {selectedEvent.instagram && (
                        <ContactButton
                          href={`https://instagram.com/${selectedEvent.instagram.replace('@', '')}`}
                          icon="external"
                          label="Instagram"
                          variant="instagram"
                          external
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div style={{ marginTop: 32 }}>
                  <h2 style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: GRAY,
                    marginBottom: 14,
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                  }}>
                    About this event
                  </h2>
                  <p style={{
                    fontSize: 16,
                    color: BLACK,
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    letterSpacing: '0.1px',
                  }}>
                    {selectedEvent.desc || 'No description available.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* My Events Screen */}
        {showMyEv && (
          <MyEventsScreen
            events={events}
            businessId={appUser?.id}
            onBack={() => setShowMyEv(false)}
            onCreate={() => {
              if (!user) {
                setShowAuth(true);
                return;
              }
              setShowMyEv(false);
              setShowCreate(true);
            }}
            onEdit={(event) => {
              notify('info', 'Edit feature coming soon!', 2000);
            }}
            onDelete={handleDeleteEvent}
            loading={eventsLoading}
          />
        )}

        {/* Other Modals */}
        <AuthModal
          open={showAuth}
          onClose={() => setShowAuth(false)}
          onLogin={handleLogin}
          onRegister={handleRegister}
          error={authError}
          clearError={clearError}
        />

        <EditProfileModal
          open={showEditProfile}
          onClose={() => setShowEditProfile(false)}
          user={appUser}
          onProfileUpdated={() => {
            refreshBusiness();
            refreshUser();
          }}
        />

        <PrivacySettingsModal
          open={showPrivacySettings}
          onClose={() => setShowPrivacySettings(false)}
          user={appUser}
        />

        <NotificationPreferencesModal
          open={showNotificationPrefs}
          onClose={() => setShowNotificationPrefs(false)}
          user={appUser}
        />

        {showCreate && (
          <CreateEvent
            user={appUser}
            onSave={handleCreateEvent}
            onBack={() => setShowCreate(false)}
          />
        )}

        <FilterModal
          isOpen={showFilterModal}
          onClose={() => setShowFilterModal(false)}
          filters={filters}
          onApplyFilters={handleApplyFilters}
          hasLocation={!!location}
        />

        {/* Animations */}
        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
          @keyframes slideInUp {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes fadeInDown {
            from { transform: translateX(-50%) translateY(-20px); opacity: 0; }
            to { transform: translateX(-50%) translateY(0); opacity: 1; }
          }

          @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
            }
          }
        `}</style>
      </div>
    </ErrorBoundary>
  );
}
