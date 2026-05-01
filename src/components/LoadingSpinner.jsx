import { ACCENT } from '../lib/theme';

export const LoadingSpinner = ({ size = 40 }) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px',
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          border: `3px solid ${ACCENT}20`,
          borderTop: `3px solid ${ACCENT}`,
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      >
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default LoadingSpinner;
