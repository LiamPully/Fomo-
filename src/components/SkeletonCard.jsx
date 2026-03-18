const GRAY2 = '#E4E1DA';
const GRAY3 = '#F7F5F1';

export const SkeletonCard = () => {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
        border: `1px solid ${GRAY2}`,
      }}
    >
      {/* Image skeleton */}
      <div
        style={{
          height: 180,
          background: GRAY3,
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      />

      {/* Content skeleton */}
      <div style={{ padding: '16px' }}>
        {/* Category badge skeleton */}
        <div
          style={{
            width: 80,
            height: 22,
            background: GRAY3,
            borderRadius: 999,
            marginBottom: 10,
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />

        {/* Title skeleton */}
        <div
          style={{
            width: '70%',
            height: 22,
            background: GRAY3,
            borderRadius: 4,
            marginBottom: 8,
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />

        {/* Date/location skeleton */}
        <div
          style={{
            width: '50%',
            height: 16,
            background: GRAY3,
            borderRadius: 4,
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
};

export const SkeletonList = ({ count = 3 }) => {
  return (
    <div style={{ padding: '0 12px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
};

export default SkeletonCard;
