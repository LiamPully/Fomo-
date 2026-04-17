import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useLocation } from "./hooks/useLocation";
import { useAuth } from "./hooks/useAuth";
import { MAIN_CATEGORIES, getCategoryColor } from "./lib/categories";
import { fetchEvents, createEvent, updateEvent, deleteEvent } from "./api/events";
import { canPublishEvent } from "./api/businesses";
import { calculateDistance } from "./lib/location";
import CategoryDropdown from "./components/CategoryDropdown";
import FilterModal from "./components/FilterModal";
import { SkeletonList } from "./components/SkeletonCard";
import LocationSearch from "./components/LocationSearch";
import AuthModal from "./components/AuthModal";
import CreateEvent from "./components/CreateEvent";
import AccountScreen from "./components/AccountScreen";
import EditProfileModal from "./components/EditProfileModal";
import ErrorBoundary from "./components/ErrorBoundary";
import "./styles/modern-design.css";

// Modern Design Tokens
const BG = "#F8F9FA";
const WHITE = "#FFFFFF";
const BLACK = "#1A1A1A";
const GRAY = "#5F6368";
const GRAY_LIGHT = "#F1F3F4";
const GRAY_MEDIUM = "#80868B";
const ACCENT = "#E85D3F";
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

// Icon Component
const Icon = ({ name, size = 20, color = BLACK }) => {
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
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {icons[name] || null}
    </svg>
  );
};

// Modern Event Card
const EventCard = ({ event, onClick, onEdit, onDelete, showActions }) => {
  const [isPressed, setIsPressed] = useState(false);
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

  return (
    <div
      onClick={() => !showActions && onClick(event)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      style={{
        background: WHITE,
        borderRadius: 16,
        overflow: 'hidden',
        cursor: showActions ? 'default' : 'pointer',
        marginBottom: 12,
        transform: isPressed ? 'scale(0.98)' : 'scale(1)',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        boxShadow: isPressed
          ? '0 2px 8px rgba(0,0,0,0.08)'
          : '0 4px 12px rgba(0,0,0,0.05)',
      }}
    >
      {/* Image */}
      <div style={{ height: 180, overflow: 'hidden', position: 'relative' }}>
        {!imgError ? (
          <img
            src={event.img}
            alt={event.title}
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
            position: 'absolute', top: 12, left: 12,
            background: ACCENT, color: WHITE,
            padding: '4px 10px', borderRadius: 20,
            fontSize: 11, fontWeight: 700,
          }}>
            Today
          </div>
        )}
        {event.status === 'draft' && (
          <div style={{
            position: 'absolute', top: 12, left: 12,
            background: GRAY, color: WHITE,
            padding: '4px 10px', borderRadius: 20,
            fontSize: 11, fontWeight: 700,
          }}>
            Draft
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '14px 16px 16px' }}>
        <div style={{
          display: 'inline-block',
          padding: '3px 8px',
          borderRadius: 6,
          background: `${catColor}15`,
          color: catColor,
          fontSize: 11, fontWeight: 600,
          marginBottom: 8,
        }}>
          {event.category}
        </div>

        <h3 style={{
          fontSize: 17, fontWeight: 700, color: BLACK,
          marginBottom: 6, lineHeight: 1.3,
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
};

// Modern Bottom Navigation
const BottomNav = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'events', label: 'Discover', icon: 'search' },
    { id: 'hub', label: 'Profile', icon: 'user' },
    { id: 'about', label: 'About', icon: 'info' },
  ];

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(0,0,0,0.05)',
      paddingBottom: 'env(safe-area-inset-bottom)',
      zIndex: 100,
    }}>
      <div style={{
        maxWidth: 430, margin: '0 auto',
        display: 'flex', justifyContent: 'space-around',
        padding: '10px 0',
      }}>
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 4, padding: '6px 20px',
                background: 'transparent', border: 'none',
                cursor: 'pointer',
              }}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div style={{
                padding: isActive ? '6px 16px' : '6px 0',
                borderRadius: 20,
                background: isActive ? BLACK : 'transparent',
                transition: 'all 0.2s ease',
              }}>
                <Icon
                  name={tab.icon}
                  size={20}
                  color={isActive ? WHITE : GRAY}
                />
              </div>
              <span style={{
                fontSize: 11, fontWeight: isActive ? 600 : 500,
                color: isActive ? BLACK : GRAY,
              }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Search Bar Component
const SearchBar = ({ value, onChange, onClear }) => {
  const inputRef = useRef(null);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      background: WHITE,
      borderRadius: 12,
      padding: '10px 14px',
      marginBottom: 16,
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    }}>
      <Icon name="search" size={18} color={GRAY} />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search events..."
        style={{
          flex: 1,
          border: 'none',
          outline: 'none',
          fontSize: 15,
          fontFamily: FONT,
          background: 'transparent',
        }}
        aria-label="Search events"
      />
      {value && (
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
          aria-label="Clear search"
        >
          <Icon name="x" size={16} color={GRAY} />
        </button>
      )}
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

// About Screen
const AboutScreen = () => {
  const appVersion = "1.0.0";

  return (
    <div style={{ padding: '16px 16px 100px' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: BLACK, marginBottom: 8 }}>
          About
        </h1>
        <p style={{ fontSize: 15, color: GRAY, lineHeight: 1.6 }}>
          Discover local markets, events, and happenings in your area.
        </p>
      </div>

      {/* App Info Card */}
      <div style={{
        background: WHITE,
        borderRadius: 16,
        padding: 24,
        marginBottom: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          background: ACCENT,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
          fontSize: 28,
        }}>
          🎯
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: BLACK, marginBottom: 4 }}>
          FOMO ZA
        </h2>
        <p style={{ fontSize: 14, color: GRAY }}>
          Version {appVersion}
        </p>
        <p style={{ fontSize: 15, color: GRAY, lineHeight: 1.6, marginTop: 12 }}>
          Your go-to app for discovering local events, markets, and happenings across South Africa.
          Never miss out on what's happening near you.
        </p>
      </div>

      {/* Features */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{
          fontSize: 13,
          fontWeight: 600,
          color: GRAY,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: 12,
        }}>
          Features
        </h2>
        {[
          { icon: '📍', title: 'Location-based discovery', desc: 'Find events near you' },
          { icon: '🔔', title: 'Real-time updates', desc: 'Latest events as they happen' },
          { icon: '📱', title: 'Easy event creation', desc: 'Publish your events in minutes' },
          { icon: '🎨', title: 'Beautiful design', desc: 'Clean, modern interface' },
        ].map((feature, i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '14px 16px',
            background: WHITE,
            borderRadius: 12,
            marginBottom: 8,
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          }}>
            <span style={{ fontSize: 24 }}>{feature.icon}</span>
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, color: BLACK }}>{feature.title}</p>
              <p style={{ fontSize: 13, color: GRAY }}>{feature.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Links */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{
          fontSize: 13,
          fontWeight: 600,
          color: GRAY,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: 12,
        }}>
          Legal
        </h2>
        {[
          { label: 'Terms of Service', action: () => {} },
          { label: 'Privacy Policy', action: () => {} },
          { label: 'Contact Support', action: () => {} },
        ].map((link, i) => (
          <button
            key={i}
            onClick={link.action}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              background: WHITE,
              border: 'none',
              borderRadius: 12,
              marginBottom: 8,
              cursor: 'pointer',
              fontSize: 15,
              fontWeight: 500,
              color: BLACK,
              fontFamily: FONT,
            }}
          >
            {link.label}
            <Icon name="chevronRight" size={16} color={GRAY} />
          </button>
        ))}
      </div>

      {/* Footer */}
      <p style={{
        textAlign: 'center',
        fontSize: 13,
        color: GRAY,
        marginTop: 32,
      }}>
        Made with ❤️ in South Africa
      </p>
    </div>
  );
};

// Main App
export default function App() {
  const [tab, setTab] = useState("events");
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showLoc, setShowLoc] = useState(true);
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

  const handleRegister = useCallback(async (email, password, name) => {
    const result = await signUp(email, password, name);
    if (result.success) {
      setShowAuth(false);
      setTab("hub");
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
    if (t === "hub" && !user) {
      setShowAuth(true);
      return;
    }
    setTab(t);
  }, [user]);

  const appUser = user ? {
    id: business?.id || user.id,
    name: business?.business_name || business?.name || user.email?.split('@')[0],
    email: user.email,
    count: business?.event_count || 0,
    businessLoaded: !!business,
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
      <div style={{
        width: '100%', maxWidth: 430, margin: '0 auto',
        minHeight: '100vh',
        background: BG,
        position: 'relative',
        fontFamily: FONT,
      }}>
        {/* Notification Toast */}
        {notification && (
          <div style={{
            position: 'fixed',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 300,
            background: notification.type === 'error' ? '#EA4335' : '#34A853',
            color: WHITE,
            padding: '12px 20px',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            animation: 'fadeInDown 0.3s ease',
          }}>
            {notification.message}
          </div>
        )}

        {/* Main Content */}
        <main id="main-content" style={{ paddingBottom: 80 }} role="main">
          {/* Events Screen */}
          {tab === "events" && (
            <div style={{ padding: '16px' }}>
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
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                onClear={() => setSearchQuery('')}
              />

              {/* Category Pills - Horizontal Scroll */}
              <div style={{
                display: 'flex', gap: 8,
                overflowX: 'auto',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                marginBottom: 16,
                paddingBottom: 4,
              }}>
                <button
                  onClick={() => setCat("all")}
                  style={{
                    padding: '8px 16px', borderRadius: 20,
                    border: 'none',
                    background: cat === "all" ? BLACK : WHITE,
                    color: cat === "all" ? WHITE : GRAY,
                    fontSize: 14, fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: cat === "all" ? 'none' : '0 1px 3px rgba(0,0,0,0.08)',
                  }}
                >
                  All
                </button>
                {MAIN_CATEGORIES.slice(0, 4).map(c => (
                  <button
                    key={c.id}
                    onClick={() => setCat(c.id)}
                    style={{
                      padding: '8px 16px', borderRadius: 20,
                      border: 'none',
                      background: cat === c.id ? c.color : WHITE,
                      color: cat === c.id ? WHITE : GRAY,
                      fontSize: 14, fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      boxShadow: cat === c.id ? 'none' : '0 1px 3px rgba(0,0,0,0.08)',
                    }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {/* Filter Bar */}
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: 16,
              }}>
                <span style={{ fontSize: 13, color: GRAY }}>
                  {eventsLoading ? 'Loading...' : `${filteredEvents.length} events`}
                </span>
                <button
                  onClick={() => setShowFilterModal(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 12px', borderRadius: 8,
                    background: WHITE, border: 'none',
                    fontSize: 13, fontWeight: 600, color: BLACK,
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  }}
                  aria-label="Open filters"
                >
                  <Icon name="filter" size={14} />
                  Filter
                </button>
              </div>

              {/* Events List */}
              {eventsLoading ? (
                <SkeletonList count={3} />
              ) : filteredEvents.length > 0 ? (
                filteredEvents.map(ev => (
                  <EventCard
                    key={ev.id}
                    event={ev}
                    onClick={setSelectedEvent}
                  />
                ))
              ) : (
                <div style={{
                  textAlign: 'center', padding: '60px 20px',
                }}>
                  <p style={{ fontSize: 16, fontWeight: 600, color: BLACK, marginBottom: 8 }}>
                    {searchQuery ? 'No events found' : 'No events yet'}
                  </p>
                  <p style={{ fontSize: 14, color: GRAY }}>
                    {searchQuery ? 'Try different search terms' : 'Check back soon!'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Account Screen */}
          {tab === "hub" && (
            <AccountScreen
              user={appUser}
              events={events}
              onCreateEvent={() => setShowCreate(true)}
              onManageEvents={() => setShowMyEv(true)}
              onEditProfile={() => setShowEditProfile(true)}
              onSignIn={() => setShowAuth(true)}
              onSignOut={handleSignOut}
              onRefreshProfile={refreshBusiness}
              loading={authLoading}
            />
          )}

          {/* About Screen */}
          {tab === "about" && <AboutScreen />}
        </main>

        {/* Bottom Navigation */}
        <BottomNav activeTab={tab} onTabChange={handleTab} />

        {/* Event Detail Screen */}
        {selectedEvent && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: WHITE,
            animation: 'slideInRight 0.3s ease',
          }}>
            <div style={{ height: '100%', overflowY: 'auto' }}>
              {/* Back button */}
              <button
                onClick={() => setSelectedEvent(null)}
                style={{
                  position: 'fixed', top: 16, left: 16, zIndex: 10,
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.95)',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}
                aria-label="Go back"
              >
                <Icon name="arrowLeft" size={20} />
              </button>

              {/* Share button */}
              <button
                onClick={() => handleShareEvent(selectedEvent)}
                style={{
                  position: 'fixed', top: 16, right: 16, zIndex: 10,
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.95)',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}
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
              <div style={{ padding: '20px 16px 100px' }}>
                <div style={{
                  display: 'inline-block',
                  padding: '4px 10px', borderRadius: 6,
                  background: `${getCategoryColor(selectedEvent.category)}15`,
                  color: getCategoryColor(selectedEvent.category),
                  fontSize: 12, fontWeight: 600,
                  marginBottom: 12,
                }}>
                  {selectedEvent.category}
                </div>

                <h1 style={{
                  fontSize: 24, fontWeight: 800, color: BLACK,
                  marginBottom: 8, lineHeight: 1.2,
                }}>
                  {selectedEvent.title}
                </h1>

                <p style={{ fontSize: 14, color: GRAY, marginBottom: 24 }}>
                  by {selectedEvent.organiser || 'Unknown organizer'}
                </p>

                {/* Event Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: GRAY_LIGHT,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon name="calendar" size={18} />
                    </div>
                    <div>
                      <p style={{ fontSize: 12, color: GRAY, marginBottom: 2 }}>When</p>
                      <p style={{ fontSize: 15, fontWeight: 600, color: BLACK }}>
                        {new Date(selectedEvent.start).toLocaleDateString('en-ZA', {
                          weekday: 'long', day: 'numeric', month: 'long'
                        })}
                      </p>
                      <p style={{ fontSize: 14, color: GRAY }}>
                        {new Date(selectedEvent.start).toLocaleTimeString('en-ZA', {
                          hour: '2-digit', minute: '2-digit'
                        })} – {new Date(selectedEvent.end).toLocaleTimeString('en-ZA', {
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: GRAY_LIGHT,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon name="location" size={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 12, color: GRAY, marginBottom: 2 }}>Where</p>
                      <p style={{ fontSize: 15, fontWeight: 600, color: BLACK }}>
                        {selectedEvent.location}
                      </p>
                      <p style={{ fontSize: 14, color: GRAY }}>
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
                            gap: 4,
                            marginTop: 8,
                            fontSize: 14,
                            color: ACCENT,
                            textDecoration: 'none',
                            fontWeight: 500,
                          }}
                        >
                          <Icon name="map" size={14} color={ACCENT} />
                          Open in Maps
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Buttons */}
                {(selectedEvent.phone || selectedEvent.whatsapp || selectedEvent.website || selectedEvent.instagram) && (
                  <div style={{ marginTop: 24 }}>
                    <h2 style={{ fontSize: 13, fontWeight: 600, color: GRAY, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Contact
                    </h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {selectedEvent.phone && (
                        <a
                          href={`tel:${selectedEvent.phone}`}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '10px 16px',
                            background: GRAY_LIGHT,
                            borderRadius: 20,
                            fontSize: 14,
                            color: BLACK,
                            textDecoration: 'none',
                            fontWeight: 500,
                          }}
                        >
                          <Icon name="phone" size={16} />
                          Call
                        </a>
                      )}
                      {selectedEvent.whatsapp && (
                        <a
                          href={`https://wa.me/${selectedEvent.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '10px 16px',
                            background: '#25D366',
                            borderRadius: 20,
                            fontSize: 14,
                            color: WHITE,
                            textDecoration: 'none',
                            fontWeight: 500,
                          }}
                        >
                          WhatsApp
                        </a>
                      )}
                      {selectedEvent.website && (
                        <a
                          href={selectedEvent.website.startsWith('http') ? selectedEvent.website : `https://${selectedEvent.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '10px 16px',
                            background: BLACK,
                            borderRadius: 20,
                            fontSize: 14,
                            color: WHITE,
                            textDecoration: 'none',
                            fontWeight: 500,
                          }}
                        >
                          <Icon name="external" size={14} color={WHITE} />
                          Website
                        </a>
                      )}
                      {selectedEvent.instagram && (
                        <a
                          href={`https://instagram.com/${selectedEvent.instagram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '10px 16px',
                            background: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)',
                            borderRadius: 20,
                            fontSize: 14,
                            color: WHITE,
                            textDecoration: 'none',
                            fontWeight: 500,
                          }}
                        >
                          Instagram
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div style={{ marginTop: 24 }}>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: BLACK, marginBottom: 8 }}>
                    About this event
                  </h2>
                  <p style={{ fontSize: 15, color: GRAY, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
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
