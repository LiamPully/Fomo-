import { useState, useEffect, useMemo, useCallback, useRef, memo } from "react";
import { useLocation } from "./hooks/useLocation";
import { useAuth } from "./hooks/useAuth";
import { useScrollPosition } from "./hooks/useScrollPosition";
import { MAIN_CATEGORIES, getCategoryColor } from "./lib/categories";
import { fetchEvents, createEvent, updateEvent, deleteEvent } from "./api/events";
import { canPublishEvent } from "./api/businesses";
import { calculateDistance } from "./lib/location";
import CategoryDropdown from "./components/CategoryDropdown";
import FilterModal from "./components/FilterModal";
import { SkeletonList } from "./components/SkeletonCard";
import EmptyState from "./components/EmptyState";
import LocationSearch from "./components/LocationSearch";
import AuthModal from "./components/AuthModal";
import CreateEvent from "./components/CreateEvent";
import AccountScreen from "./components/AccountScreen";
import EditProfileModal from "./components/EditProfileModal";
import ErrorBoundary from "./components/ErrorBoundary";
import "./styles/airbnb-inspired.css";

// Airbnb-Inspired Design Tokens (kept current warm colors)
const BG = "#F8F9FA";
const WHITE = "#FFFFFF";
const BLACK = "#1A1A1A";
const GRAY = "#5F6368";
const GRAY_LIGHT = "#F1F3F4";
const GRAY_MEDIUM = "#80868B";
const ACCENT = "#E85D3F";
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

// Airbnb Shadow System (three-layer warm shadows)
const SHADOW_CARD = "0 0 0 1px rgba(0,0,0,0.02), 0 2px 6px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.1)";
const SHADOW_CARD_HOVER = "0 0 0 1px rgba(0,0,0,0.03), 0 4px 12px rgba(0,0,0,0.08), 0 8px 16px rgba(0,0,0,0.12)";
const SHADOW_BUTTON = "0 4px 12px rgba(0,0,0,0.08)";
const SHADOW_NAV = "0 -2px 10px rgba(0,0,0,0.05)";

// Scroll-aware hook for bottom nav
const useScrollDirection = () => {
  const [scrollDirection, setScrollDirection] = useState('up');
  const [scrollY, setScrollY] = useState(0);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const NAV_HIDE_THRESHOLD = 80;

  useEffect(() => {
    const updateScrollDirection = () => {
      const currentY = window.scrollY || document.documentElement.scrollTop;

      if (Math.abs(currentY - lastScrollY.current) < 10) {
        ticking.current = false;
        return;
      }

      const direction = currentY > lastScrollY.current ? 'down' : 'up';

      // Only hide nav if scrolled past threshold
      if (direction === 'down' && currentY > NAV_HIDE_THRESHOLD) {
        setScrollDirection('down');
      } else if (direction === 'up' || currentY <= NAV_HIDE_THRESHOLD) {
        setScrollDirection('up');
      }

      setScrollY(currentY);
      lastScrollY.current = currentY;
      ticking.current = false;
    };

    const onScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(updateScrollDirection);
        ticking.current = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return { scrollDirection, scrollY };
};

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
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {icons[name] || null}
    </svg>
  );
});

Icon.displayName = 'Icon';

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
        borderRadius: 9999, // Full pill
        border: 'none',
        background: isActive ? (color || BLACK) : WHITE,
        color: isActive ? WHITE : GRAY,
        fontSize: 14,
        fontWeight: 600,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transform: isPressed ? 'scale(0.95)' : 'scale(1)',
        transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: isActive ? 'none' : '0 1px 3px rgba(0,0,0,0.08)',
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
        borderRadius: 9999, // Full pill
        fontSize: 14,
        color: style.color,
        textDecoration: 'none',
        fontWeight: 600,
        transform: isPressed ? 'scale(0.96)' : 'scale(1)',
        transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: isPressed
          ? '0 0 0 1px rgba(0,0,0,0.02), 0 2px 4px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.08)'
          : SHADOW_CARD,
      }}
    >
      <Icon name={icon} size={16} color={style.iconColor} />
      {label}
    </Component>
  );
};

// Airbnb-Style Event Card with Three-Layer Shadow
const EventCard = memo(({ event, onClick, onEdit, onDelete, showActions }) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

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

  // Three-layer Airbnb shadow system
  const getShadow = () => {
    if (isPressed) {
      return '0 0 0 1px rgba(0,0,0,0.02), 0 2px 4px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.08)';
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
        borderRadius: 20, // Airbnb uses 20px for cards
        overflow: 'hidden',
        cursor: showActions ? 'default' : 'pointer',
        marginBottom: 16,
        transform: isPressed ? 'scale(0.98)' : 'scale(1)',
        transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: getShadow(),
        outline: 'none',
      }}
    >
      {/* Image */}
      <div style={{ height: 180, overflow: 'hidden', position: 'relative' }}>
        {!imgError ? (
          <img
            src={event.img}
            alt={event.title}
            loading="lazy"
            decoding="async"
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: GRAY_LIGHT,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 48
          }}>
            {event.category === 'Market' ? '🛍️' : event.category === 'Fun' ? '🎉' : '📍'}
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
            borderRadius: 9999, // Full pill
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}>
            Today
          </div>
        )}
        {event.status === 'draft' && (
          <div style={{
            position: 'absolute',
            top: 12,
            left: 12,
            background: GRAY,
            color: WHITE,
            padding: '6px 12px',
            borderRadius: 9999,
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
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

        <h3 style={{
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
                background: '#FEE2E2',
                border: 'none',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                color: '#EA4335',
                cursor: 'pointer',
              }}
            >
              <Icon name="trash" size={14} color="#EA4335" />
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
const CategoryCard = memo(({ category, onClick }) => {
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
        transform: isPressed ? 'scale(0.96)' : 'scale(1)',
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
const HorizontalEventCard = memo(({ event, onClick }) => {
  const [isPressed, setIsPressed] = useState(false);
  const [imgError, setImgError] = useState(false);

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
          ? '0 0 0 1px rgba(0,0,0,0.02), 0 2px 4px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.08)'
          : SHADOW_CARD,
        transform: isPressed ? 'scale(0.98)' : 'scale(1)',
        transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
        cursor: 'pointer',
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', height: 140 }}>
        <img
          src={imgError ? `https://picsum.photos/seed/${event.id}/400/250` : event.img}
          alt={event.title}
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
const HomeSearchBar = memo(({ value, onChange, onClear }) => {
  const [isFocused, setIsFocused] = useState(false);

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
        transition: 'box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
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

// Main Home Screen Component - Simplified (Home Tab)
const HomeScreen = memo(({
  user,
  location,
  events,
  eventsLoading,
  onEventClick,
  onSeeAllClick,
  onSetLocation,
}) => {
  // Category data with emojis
  const categories = [
    { id: 'food-drink', name: 'Food & Drink', emoji: '🍔', color: '#DC2626' },
    { id: 'music', name: 'Music', emoji: '🎵', color: '#7C3AED' },
    { id: 'markets', name: 'Markets', emoji: '🛍️', color: '#E8783A' },
    { id: 'sport-fitness', name: 'Sports', emoji: '⚽', color: '#0891B2' },
    { id: 'community', name: 'Community', emoji: '🤝', color: '#059669' },
    { id: 'nightlife', name: 'Nightlife', emoji: '🌃', color: '#7C3AED' },
  ];

  // Get upcoming events (first 6)
  const upcomingEvents = useMemo(() => {
    return events
      .filter(e => e.status !== 'removed' && new Date(e.start) > new Date())
      .sort((a, b) => new Date(a.start) - new Date(b.start))
      .slice(0, 6);
  }, [events]);

  return (
    <div style={{ padding: '16px', paddingBottom: 100 }}>
      {/* Welcome Header */}
      <div style={{ marginBottom: 28 }}>
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

      {/* Upcoming Events - Horizontal Scroll */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}>
          <h2 style={{
            fontSize: 20,
            fontWeight: 700,
            color: BLACK,
          }}>
            Upcoming Events
          </h2>
          <button
            onClick={onSeeAllClick}
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: ACCENT,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            See All
          </button>
        </div>

        {eventsLoading ? (
          <div style={{
            display: 'flex',
            gap: 12,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{
                flex: '0 0 auto',
                width: 260,
                height: 220,
                background: GRAY_LIGHT,
                borderRadius: 16,
              }} />
            ))}
          </div>
        ) : upcomingEvents.length > 0 ? (
          <div style={{
            display: 'flex',
            gap: 12,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            marginLeft: -16,
            marginRight: -16,
            paddingLeft: 16,
            paddingRight: 16,
            paddingBottom: 8,
            WebkitOverflowScrolling: 'touch',
          }}
          >
            {upcomingEvents.map((ev) => (
              <HorizontalEventCard
                key={ev.id}
                event={ev}
                onClick={onEventClick}
              />
            ))}
            {/* Peek effect spacer */}
            <div style={{ flex: '0 0 16px' }} />
          </div>
        ) : (
          <EmptyState
            variant="events"
            title="No upcoming events"
            description="Check back soon for new events!"
          />
        )}
      </div>

      {/* Event Categories - 2 Column Grid */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{
          fontSize: 20,
          fontWeight: 700,
          color: BLACK,
          marginBottom: 16,
        }}>
          Browse by Category
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 12,
        }}>
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onClick={onSeeAllClick}
            />
          ))}
        </div>
      </div>
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
  const [activeTab, setActiveTab] = useState('current'); // 'current' or 'manual'
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  const inputRef = useRef(null);

  // Debounced search for places
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
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Handle use current location
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

  // Handle location selection
  const handleSelectPrediction = async (prediction) => {
    try {
      const { geocodeAddress } = await import('./lib/location');
      const result = await geocodeAddress(prediction.description);
      if (result.location) {
        onSelectLocation(result.location.lat, result.location.lng, prediction.description);
        onClose();
      }
    } catch (err) {
      console.error('Geocoding error:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        background: 'rgba(0,0,0,0.5)',
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
              }}
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
              <div style={{ marginTop: 16, padding: 12, background: '#FEE2E2', borderRadius: 8 }}>
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
      <div style={{ marginBottom: 20 }}>
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
      <div style={{ marginBottom: 20 }}>
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
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          marginBottom: 20,
          paddingBottom: 8,
          marginLeft: -16,
          marginRight: -16,
          paddingLeft: 16,
          paddingRight: 16,
          WebkitOverflowScrolling: 'touch',
        }}
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
      <div style={{ marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: GRAY }}>
          {eventsLoading ? 'Loading...' : `${filteredEvents.length} events`}
        </span>
      </div>

      {/* Events List */}
      {eventsLoading ? (
        <SkeletonList count={3} />
      ) : filteredEvents.length > 0 ? (
        <div className="event-grid" style={{ display: 'contents' }}>
          {filteredEvents.map(ev => (
            <EventCard
              key={ev.id}
              event={ev}
              onClick={onEventClick}
            />
          ))}
        </div>
      ) : searchQuery ? (
        <EmptyState
          variant="search"
          icon="🔍"
          title={`No results for "${searchQuery}"`}
          description="Try adjusting your search or filter to find what you're looking for."
          actionLabel="Clear Search"
          onAction={() => setSearchQuery('')}
        />
      ) : (
        <EmptyState
          variant="events"
          icon="📅"
          title="No events yet"
          description="Check back soon for exciting events in your area!"
        />
      )}
    </div>
  );
});

SearchScreen.displayName = 'SearchScreen';

// Floating Dark Bottom Navigation with 3 icons - Scroll Aware
const BottomNav = ({ activeTab, onTabChange, visible = true }) => {
  const tabs = [
    { id: 'home', icon: 'home' },
    { id: 'events', icon: 'search' },
    { id: 'profile', icon: 'user' },
  ];

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      left: '50%',
      transform: `translateX(-50%) translateY(${visible ? '0' : '100px'})`,
      zIndex: 100,
      maxWidth: 400,
      opacity: visible ? 1 : 0,
      transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      pointerEvents: visible ? 'auto' : 'none',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'rgba(26,26,26,0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 999,
        padding: '8px',
        paddingBottom: 'calc(8px + env(safe-area-inset-bottom))',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.2)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 56,
                height: 44,
                background: isActive ? ACCENT : 'transparent',
                borderRadius: 999,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.92)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              aria-label={tab.id}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                name={tab.icon}
                size={22}
                color={isActive ? WHITE : GRAY}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

// My Events Screen
const MyEventsScreen = ({ events, businessId, onBack, onCreate, onEdit, onDelete, loading }) => {
  const [activeFilter, setActiveFilter] = useState('all'); // all, published, drafts
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
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
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
            }}
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
                boxShadow: activeFilter === filter.id ? 'none' : '0 1px 3px rgba(0,0,0,0.08)',
              }}
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
          filteredEvents.map(ev => (
            <EventCard
              key={ev.id}
              event={ev}
              showActions
              onEdit={onEdit}
              onDelete={() => handleDelete(ev)}
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
              📅
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
              }}
            >
              Create Event
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Main App
export default function App() {
  const [tab, setTab] = useState("home");
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showLoc, setShowLoc] = useState(true);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  // Scroll-aware bottom nav behavior
  const { scrollDirection } = useScrollDirection();
  const [locLabel, setLocLabel] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showMyEv, setShowMyEv] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState(null);

  const { user, business, loading: authLoading, error: authError, signUp, signIn, signOut, refreshBusiness, clearError } = useAuth();

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

  // Apply filters from modal
  const handleApplyFilters = useCallback((newFilters) => {
    setFilters(newFilters);
    setSortBy(newFilters.sortBy);
    setCat(newFilters.category);
    // Could add period filtering here
  }, []);

  // Filtered events with search
  const filteredEvents = useMemo(() => {
    let ev = events.filter(e => e.status !== "removed");

    // Category filter
    if (cat !== "all") {
      ev = ev.filter(e => e.category?.toLowerCase() === cat.toLowerCase());
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      ev = ev.filter(e =>
        e.title?.toLowerCase().includes(query) ||
        e.desc?.toLowerCase().includes(query) ||
        e.area?.toLowerCase().includes(query)
      );
    }

    // Sort
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
    return sorted;
  }, [events, cat, sortBy, searchQuery, location]);

  // Auth handlers
  const handleLogin = useCallback(async (email, password) => {
    const result = await signIn(email, password);
    if (result.success) {
      setShowAuth(false);
      setTab("hub");
    }
    return result;
  }, [signIn]);

  const handleRegister = useCallback(async (registrationData) => {
    const result = await signUp(registrationData);
    if (result.success) {
      setShowAuth(false);
      // Route based on user type
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

  // Create event handler
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
      setNotification({ type: 'error', message: error.message });
      return;
    }

    // Add new event to local state
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
      setNotification({ type: 'success', message: 'Event created successfully!' });
      setTimeout(() => setNotification(null), 3000);
    }

    setShowCreate(false);
  }, [business]);

  // Delete event handler
  const handleDeleteEvent = useCallback(async (event) => {
    const { error } = await deleteEvent(event.id);
    if (error) {
      setNotification({ type: 'error', message: 'Failed to delete event' });
      return;
    }
    setEvents(prev => prev.filter(e => e.id !== event.id));
    setNotification({ type: 'success', message: 'Event deleted successfully' });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const handleTab = useCallback((t) => {
    if (t === "profile" && !user) {
      setShowAuth(true);
      return;
    }
    setTab(t);
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

  // Location handlers
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

  // Share event
  const handleShareEvent = useCallback(async (event) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: `Check out ${event.title} on FOMO ZA`,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled or failed
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard?.writeText(window.location.href);
      setNotification({ type: 'success', message: 'Link copied to clipboard!' });
      setTimeout(() => setNotification(null), 2000);
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
          height: '100dvh',
          maxHeight: '100dvh',
          background: BG,
          position: 'relative',
          fontFamily: FONT,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Notification Toast with ARIA live region */}
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
                background: notification.type === 'error' ? '#EA4335' : '#34A853',
                color: WHITE,
                padding: '12px 20px',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                animation: 'fadeInDown 0.3s ease',
              }}
            >
              {notification.message}
            </div>
          )}
        </div>

        {/* Main Content - Scrollable Container */}
        <main
          id="main-content"
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
            position: 'relative',
            paddingBottom: 'calc(100px + env(safe-area-inset-bottom))',
          }}
          role="main"
        >
          {/* Home Screen */}
          {tab === "home" && (
            <HomeScreen
              user={appUser}
              location={location}
              events={events}
              eventsLoading={eventsLoading}
              onEventClick={setSelectedEvent}
              onSeeAllClick={() => setTab("events")}
              onSetLocation={() => setShowLocationPicker(true)}
            />
          )}

          {/* Search/Events Screen */}
          {tab === "events" && (
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
          )}

          {/* Profile Screen */}
          {tab === "profile" && (
            <AccountScreen
              user={appUser}
              events={events}
              onCreateEvent={() => setShowCreate(true)}
              onManageEvents={() => setShowMyEv(true)}
              onEditProfile={() => setShowEditProfile(true)}
              onSignIn={() => setShowAuth(true)}
              onSignOut={handleSignOut}
              onEditLocation={() => setShowLocationPicker(true)}
              loading={authLoading}
            />
          )}

        </main>

        {/* Bottom Navigation - Fixed with scroll-aware visibility */}
        <BottomNav
          activeTab={tab}
          onTabChange={handleTab}
          visible={scrollDirection === 'up'}
        />

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

        {/* Event Detail Screen - Airbnb Style */}
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
              {/* Back button - Airbnb circular style */}
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

              {/* Share button - Airbnb circular style */}
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
              <div style={{ height: 280, background: GRAY_LIGHT }}>
                <img
                  src={selectedEvent.img}
                  alt={selectedEvent.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              {/* Event Content */}
              <div style={{ padding: '24px 20px 100px' }}>
                {/* Category badge - Airbnb style pill */}
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

                {/* Event Details - Airbnb style metadata cards */}
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

                {/* Contact Buttons - Airbnb style pill buttons */}
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
              setShowMyEv(false);
              setShowCreate(true);
            }}
            onEdit={(event) => {
              // TODO: Implement edit functionality
              setNotification({ type: 'info', message: 'Edit feature coming soon!' });
              setTimeout(() => setNotification(null), 2000);
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
          onProfileUpdated={refreshBusiness}
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
        `}</style>
      </div>
    </ErrorBoundary>
  );
}
