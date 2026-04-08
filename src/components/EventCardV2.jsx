import { useState } from 'react';
import { getCategoryColor } from '../lib/categories';
import '../styles/design-system-v2.css';

/**
 * EventCardV2 — Editorial, premium event card
 * Features: Large hero image, elegant typography, subtle animations
 */

const EventCardV2 = ({ event, onClick, variant = 'hero' }) => {
  const [imageError, setImageError] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const categoryColor = getCategoryColor(event.category);

  // Format date nicely
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();

    if (isToday) {
      return {
        primary: 'Today',
        secondary: date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }),
        isToday: true,
      };
    }

    return {
      primary: date.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' }),
      secondary: date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }),
      isToday: false,
    };
  };

  const dateInfo = formatDate(event.start);

  // Category emoji mapping
  const categoryEmoji = {
    'Market': '🛍️',
    'Food & Drink': '🍽️',
    'Music': '🎵',
    'Sport': '⚽',
    'Arts': '🎨',
    'Community': '🤝',
    'Nightlife': '🌙',
    'default': '📍',
  };

  const emoji = categoryEmoji[event.category] || categoryEmoji.default;

  if (variant === 'compact') {
    return (
      <article
        className="compact-card"
        onClick={() => onClick?.(event)}
        onTouchStart={() => setIsPressed(true)}
        onTouchEnd={() => setIsPressed(false)}
        style={{
          transform: isPressed ? 'scale(0.98)' : 'scale(1)',
          transition: 'transform 0.15s ease',
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 12,
            background: imageError ? 'var(--bg-tertiary)' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {!imageError ? (
            <img
              src={event.img}
              alt=""
              loading="lazy"
              onError={() => setImageError(true)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <span style={{ fontSize: 32 }}>{emoji}</span>
          )}
        </div>

        <div className="compact-card__content">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 6,
            }}
          >
            <span
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: categoryColor,
              }}
            >
              {event.category}
            </span>
            {dateInfo.isToday && (
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 700,
                  color: 'var(--accent)',
                  background: 'var(--accent-bg)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                Today
              </span>
            )}
          </div>

          <h3 className="compact-card__title">{event.title}</h3>

          <div className="compact-card__meta">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ opacity: 0.6 }}
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {event.area}
            </span>
            {event.distance && (
              <span
                style={{
                  marginLeft: 'auto',
                  fontWeight: 600,
                  color: 'var(--accent)',
                }}
              >
                {event.distance < 1
                  ? `${Math.round(event.distance * 1000)}m`
                  : `${event.distance.toFixed(1)}km`}
              </span>
            )}
          </div>
        </div>
      </article>
    );
  }

  // Hero variant (default)
  return (
    <article
      className="hero-card"
      onClick={() => onClick?.(event)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      style={{
        transform: isPressed ? 'scale(0.98)' : 'scale(1)',
      }}
    >
      <div className="hero-card__image-wrapper">
        {!imageError ? (
          <img
            src={event.img}
            alt={event.title}
            loading="lazy"
            onError={() => setImageError(true)}
            className="hero-card__image"
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-tertiary)',
              fontSize: 64,
            }}
          >
            {emoji}
          </div>
        )}

        {/* Today badge */}
        {dateInfo.isToday && (
          <div
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              background: 'var(--accent)',
              color: 'white',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: 'var(--text-sm)',
              fontWeight: 700,
              boxShadow: '0 2px 8px rgba(199, 91, 57, 0.3)',
            }}
          >
            Today
          </div>
        )}
      </div>

      <div className="hero-card__content">
        <div className="hero-card__category" style={{ color: categoryColor }}>
          <span>{emoji}</span>
          {event.category}
        </div>

        <h3 className="hero-card__title">{event.title}</h3>

        <div className="hero-card__meta">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>{dateInfo.primary} · {dateInfo.secondary}</span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 12,
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>{event.area}</span>
          {event.distance && (
            <span
              style={{
                marginLeft: 'auto',
                fontWeight: 600,
                color: 'var(--accent)',
              }}
            >
              {event.distance < 1
                ? `${Math.round(event.distance * 1000)}m`
                : `${event.distance.toFixed(1)}km`}
            </span>
          )}
        </div>
      </div>
    </article>
  );
};

export default EventCardV2;
