import { memo } from 'react';

// Airbnb-Inspired Empty States with emoji illustrations
const BG = '#F8F9FA';
const BLACK = '#1A1A1A';
const GRAY = '#5F6368';
const ACCENT = '#E85D3F';
const GRAY_LIGHT = '#F1F3F4';
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

/**
 * EmptyState - Reusable empty state component with illustration
 */
const EmptyState = memo(({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = 'default',
}) => {
  const variants = {
    default: {
      bg: GRAY_LIGHT,
      iconSize: 80,
      emoji: '📭',
    },
    search: {
      bg: GRAY_LIGHT,
      iconSize: 80,
      emoji: '🔍',
    },
    events: {
      bg: `${ACCENT}15`,
      iconSize: 80,
      emoji: '📅',
    },
    error: {
      bg: '#FEE2E2',
      iconSize: 80,
      emoji: '⚠️',
    },
    offline: {
      bg: GRAY_LIGHT,
      iconSize: 80,
      emoji: '📡',
    },
  };

  const style = variants[variant] || variants.default;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 32px',
        textAlign: 'center',
        animation: 'fadeIn 0.4s ease',
      }}
    >
      {/* Icon/Emoji container */}
      <div
        style={{
          width: style.iconSize,
          height: style.iconSize,
          borderRadius: 24,
          background: style.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
          fontSize: 40,
          boxShadow: '0 0 0 1px rgba(0,0,0,0.02), 0 2px 6px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.1)',
        }}
      >
        {icon || style.emoji}
      </div>

      {/* Title */}
      <h2
        style={{
          fontFamily: FONT,
          fontSize: 20,
          fontWeight: 700,
          color: BLACK,
          marginBottom: 8,
          lineHeight: 1.3,
          letterSpacing: '-0.3px',
        }}
      >
        {title}
      </h2>

      {/* Description */}
      <p
        style={{
          fontFamily: FONT,
          fontSize: 15,
          color: GRAY,
          lineHeight: 1.5,
          marginBottom: actionLabel ? 24 : 0,
          maxWidth: 280,
        }}
      >
        {description}
      </p>

      {/* Action button */}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            background: BLACK,
            color: 'white',
            border: 'none',
            borderRadius: 12,
            padding: '14px 28px',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: FONT,
            transition: 'transform 0.15s ease, box-shadow 0.25s ease',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.96)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          {actionLabel}
        </button>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
});

EmptyState.displayName = 'EmptyState';

/**
 * ErrorState - Network or general error state with retry
 */
export const ErrorState = memo(({
  title = 'Something went wrong',
  description = 'We couldn\'t load the data. Please check your connection and try again.',
  onRetry,
  variant = 'error',
}) => {
  return (
    <EmptyState
      variant={variant}
      icon="⚠️"
      title={title}
      description={description}
      actionLabel={onRetry ? 'Try Again' : null}
      onAction={onRetry}
    />
  );
});

ErrorState.displayName = 'ErrorState';

/**
 * OfflineState - Network offline state
 */
export const OfflineState = memo(({ onRetry }) => {
  return (
    <EmptyState
      variant="offline"
      icon="📡"
      title="You're offline"
      description="Please check your internet connection and try again."
      actionLabel={onRetry ? 'Try Again' : null}
      onAction={onRetry}
    />
  );
});

OfflineState.displayName = 'OfflineState';

/**
 * SearchEmptyState - No search results
 */
export const SearchEmptyState = memo(({ searchQuery, onClear }) => {
  return (
    <EmptyState
      variant="search"
      icon="🔍"
      title={`No results for "${searchQuery}"`}
      description="Try adjusting your search or filter to find what you're looking for."
      actionLabel="Clear Search"
      onAction={onClear}
    />
  );
});

SearchEmptyState.displayName = 'SearchEmptyState';

/**
 * EventsEmptyState - No events available
 */
export const EventsEmptyState = memo(({ onCreate }) => {
  return (
    <EmptyState
      variant="events"
      icon="📅"
      title="No events yet"
      description="Be the first to share an event with your community."
      actionLabel={onCreate ? 'Create Event' : null}
      onAction={onCreate}
    />
  );
});

EventsEmptyState.displayName = 'EventsEmptyState';

export default EmptyState;
