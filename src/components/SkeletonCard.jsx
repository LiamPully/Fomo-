import { memo } from 'react';
import { GRAY_LIGHT, GRAY_MEDIUM, SHADOW_CARD } from '../lib/theme';

/**
 * SkeletonCard - Airbnb-style shimmer loading card
 * Features gradient shimmer animation instead of simple pulse
 */
export const SkeletonCard = memo(() => {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 16,
        boxShadow: SHADOW_CARD,
      }}
    >
      {/* Image skeleton with shimmer */}
      <div
        className="skeleton-shimmer"
        style={{
          height: 180,
          background: GRAY_LIGHT,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
            animation: 'shimmer 1.5s ease-in-out infinite',
            transform: 'translateX(-100%)',
          }}
        />
      </div>

      {/* Content skeleton */}
      <div style={{ padding: '16px' }}>
        {/* Category badge skeleton */}
        <div
          className="skeleton-shimmer"
          style={{
            width: 80,
            height: 24,
            background: GRAY_LIGHT,
            borderRadius: 999,
            marginBottom: 12,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)',
              animation: 'shimmer 1.5s ease-in-out infinite',
              transform: 'translateX(-100%)',
            }}
          />
        </div>

        {/* Title skeleton - two lines */}
        <div
          className="skeleton-shimmer"
          style={{
            width: '85%',
            height: 20,
            background: GRAY_LIGHT,
            borderRadius: 4,
            marginBottom: 8,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)',
              animation: 'shimmer 1.5s ease-in-out infinite',
              transform: 'translateX(-100%)',
            }}
          />
        </div>

        <div
          className="skeleton-shimmer"
          style={{
            width: '60%',
            height: 20,
            background: GRAY_LIGHT,
            borderRadius: 4,
            marginBottom: 12,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)',
              animation: 'shimmer 1.5s ease-in-out infinite',
              transform: 'translateX(-100%)',
            }}
          />
        </div>

        {/* Date/location skeleton */}
        <div
          className="skeleton-shimmer"
          style={{
            width: '50%',
            height: 16,
            background: GRAY_MEDIUM,
            borderRadius: 4,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)',
              animation: 'shimmer 1.5s ease-in-out infinite',
              transform: 'translateX(-100%)',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
});

SkeletonCard.displayName = 'SkeletonCard';

/**
 * SkeletonStats - Loading state for stats cards
 */
export const SkeletonStats = memo(() => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 12,
        marginBottom: 24,
      }}
    >
      {[1, 2].map((i) => (
        <div
          key={i}
          style={{
            background: 'white',
            borderRadius: 16,
            padding: '16px',
            boxShadow: SHADOW_CARD,
          }}
        >
          {/* Icon skeleton */}
          <div
            className="skeleton-shimmer"
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: GRAY_LIGHT,
              marginBottom: 12,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)',
                animation: 'shimmer 1.5s ease-in-out infinite',
                transform: 'translateX(-100%)',
              }}
            />
          </div>

          {/* Value skeleton */}
          <div
            className="skeleton-shimmer"
            style={{
              width: '60%',
              height: 28,
              background: GRAY_LIGHT,
              borderRadius: 4,
              marginBottom: 6,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)',
                animation: 'shimmer 1.5s ease-in-out infinite',
                transform: 'translateX(-100%)',
              }}
            />
          </div>

          {/* Label skeleton */}
          <div
            className="skeleton-shimmer"
            style={{
              width: '80%',
              height: 14,
              background: GRAY_MEDIUM,
              borderRadius: 4,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)',
                animation: 'shimmer 1.5s ease-in-out infinite',
                transform: 'translateX(-100%)',
              }}
            />
          </div>
        </div>
      ))}

      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
});

SkeletonStats.displayName = 'SkeletonStats';

/**
 * SkeletonProfile - Loading state for profile header
 */
export const SkeletonProfile = memo(() => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        marginBottom: 28,
      }}
    >
      {/* Avatar skeleton */}
      <div
        className="skeleton-shimmer"
        style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: GRAY_LIGHT,
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)',
            animation: 'shimmer 1.5s ease-in-out infinite',
            transform: 'translateX(-100%)',
          }}
        />
      </div>

      {/* Text skeletons */}
      <div style={{ flex: 1 }}>
        <div
          className="skeleton-shimmer"
          style={{
            width: '70%',
            height: 24,
            background: GRAY_LIGHT,
            borderRadius: 4,
            marginBottom: 8,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)',
              animation: 'shimmer 1.5s ease-in-out infinite',
              transform: 'translateX(-100%)',
            }}
          />
        </div>
        <div
          className="skeleton-shimmer"
          style={{
            width: '50%',
            height: 16,
            background: GRAY_MEDIUM,
            borderRadius: 4,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)',
              animation: 'shimmer 1.5s ease-in-out infinite',
              transform: 'translateX(-100%)',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
});

SkeletonProfile.displayName = 'SkeletonProfile';

/**
 * SkeletonList - Multiple skeleton cards
 */
export const SkeletonList = memo(({ count = 3 }) => {
  return (
    <div style={{ padding: '0 16px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
});

SkeletonList.displayName = 'SkeletonList';

export default SkeletonCard;
