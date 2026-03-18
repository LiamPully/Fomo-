import { useEffect, useRef, useState } from 'react';
import { MAIN_CATEGORIES } from '../lib/categories';

const FONT = "'Sora', system-ui, sans-serif";
const BG = '#F0EDE6';
const BLACK = '#111111';
const WHITE = '#FFFFFF';
const ORANGE = '#E8783A';
const GRAY1 = '#888880';
const GRAY2 = '#E4E1DA';
const GRAY3 = '#F7F5F1';

const SORT_OPTIONS = [
  { id: 'chronological', label: 'Date', desc: 'Soonest first' },
  { id: 'alphabetical', label: 'Alphabetical', desc: 'A to Z' },
  { id: 'distance', label: 'Distance', desc: 'Nearest first' },
  { id: 'popularity', label: 'Popularity', desc: 'Most viewed' },
];

const DATE_OPTIONS = [
  { id: 'all', label: 'All Time' },
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
];

const DISTANCE_OPTIONS = [5, 10, 25, 50, 100];

export const FilterModal = ({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  hasLocation,
}) => {
  const modalRef = useRef(null);
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters, isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  const handleSortChange = (sortId) => {
    setLocalFilters((prev) => ({ ...prev, sortBy: sortId }));
  };

  const handleDateChange = (dateId) => {
    setLocalFilters((prev) => ({ ...prev, period: dateId }));
  };

  const handleDistanceChange = (distance) => {
    setLocalFilters((prev) => ({ ...prev, distance }));
  };

  const handleCategoryChange = (categoryId) => {
    setLocalFilters((prev) => ({ ...prev, category: categoryId }));
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    setLocalFilters({
      sortBy: 'chronological',
      period: 'all',
      distance: 25,
      category: 'all',
    });
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        ref={modalRef}
        style={{
          background: BG,
          borderRadius: '24px 24px 0 0',
          width: '100%',
          maxWidth: 430,
          maxHeight: '85vh',
          overflowY: 'auto',
          animation: 'slideUp 0.3s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 20px 16px',
            borderBottom: `1px solid ${GRAY2}`,
            position: 'sticky',
            top: 0,
            background: BG,
            zIndex: 10,
          }}
        >
          <h2
            style={{
              fontFamily: FONT,
              fontSize: 20,
              fontWeight: 800,
              color: BLACK,
              margin: 0,
            }}
          >
            Filter
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 8,
              borderRadius: 999,
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke={GRAY1}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          {/* Sort By Section */}
          <div style={{ marginBottom: 28 }}>
            <p
              style={{
                fontFamily: FONT,
                fontSize: 14,
                fontWeight: 700,
                color: BLACK,
                marginBottom: 12,
              }}
            >
              Sort By
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleSortChange(opt.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    background: localFilters.sortBy === opt.id ? WHITE : 'transparent',
                    border: `1.5px solid ${localFilters.sortBy === opt.id ? BLACK : GRAY2}`,
                    borderRadius: 12,
                    cursor: 'pointer',
                    fontFamily: FONT,
                    textAlign: 'left',
                    transition: 'all .15s',
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: localFilters.sortBy === opt.id ? 700 : 600,
                        color: BLACK,
                        display: 'block',
                      }}
                    >
                      {opt.label}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: GRAY1,
                        marginTop: 2,
                        display: 'block',
                      }}
                    >
                      {opt.desc}
                    </span>
                  </div>
                  {localFilters.sortBy === opt.id && (
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: ORANGE,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={WHITE}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range Section */}
          <div style={{ marginBottom: 28 }}>
            <p
              style={{
                fontFamily: FONT,
                fontSize: 14,
                fontWeight: 700,
                color: BLACK,
                marginBottom: 12,
              }}
            >
              Date Range
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {DATE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleDateChange(opt.id)}
                  style={{
                    background: localFilters.period === opt.id ? BLACK : WHITE,
                    color: localFilters.period === opt.id ? WHITE : BLACK,
                    border: `1.5px solid ${localFilters.period === opt.id ? BLACK : GRAY2}`,
                    borderRadius: 999,
                    padding: '10px 18px',
                    fontSize: 13,
                    fontWeight: localFilters.period === opt.id ? 700 : 500,
                    cursor: 'pointer',
                    fontFamily: FONT,
                    whiteSpace: 'nowrap',
                    transition: 'all .15s',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Distance Section - only if location is available */}
          {hasLocation && (
            <div style={{ marginBottom: 28 }}>
              <p
                style={{
                  fontFamily: FONT,
                  fontSize: 14,
                  fontWeight: 700,
                  color: BLACK,
                  marginBottom: 12,
                }}
              >
                Distance
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {DISTANCE_OPTIONS.map((dist) => (
                  <button
                    key={dist}
                    onClick={() => handleDistanceChange(dist)}
                    style={{
                      background: localFilters.distance === dist ? ORANGE : WHITE,
                      color: localFilters.distance === dist ? WHITE : BLACK,
                      border: 'none',
                      borderRadius: 999,
                      padding: '10px 18px',
                      fontSize: 13,
                      fontWeight: localFilters.distance === dist ? 700 : 500,
                      cursor: 'pointer',
                      fontFamily: FONT,
                      whiteSpace: 'nowrap',
                      transition: 'all .15s',
                    }}
                  >
                    {dist}km
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Category Section */}
          <div style={{ marginBottom: 100 }}>
            <p
              style={{
                fontFamily: FONT,
                fontSize: 14,
                fontWeight: 700,
                color: BLACK,
                marginBottom: 12,
              }}
            >
              Category
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {MAIN_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  style={{
                    background: localFilters.category === cat.id ? cat.color : WHITE,
                    color: localFilters.category === cat.id ? WHITE : BLACK,
                    border: 'none',
                    borderRadius: 999,
                    padding: '10px 18px',
                    fontSize: 13,
                    fontWeight: localFilters.category === cat.id ? 700 : 500,
                    cursor: 'pointer',
                    fontFamily: FONT,
                    whiteSpace: 'nowrap',
                    transition: 'all .15s',
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            padding: '16px 20px 24px',
            borderTop: `1px solid ${GRAY2}`,
            position: 'sticky',
            bottom: 0,
            background: BG,
          }}
        >
          <button
            onClick={handleReset}
            style={{
              flex: 1,
              background: WHITE,
              color: BLACK,
              border: `1.5px solid ${GRAY2}`,
              borderRadius: 999,
              padding: '14px 24px',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: FONT,
              transition: 'all .15s',
            }}
          >
            Reset
          </button>
          <button
            onClick={handleApply}
            style={{
              flex: 2,
              background: BLACK,
              color: WHITE,
              border: 'none',
              borderRadius: 999,
              padding: '14px 24px',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: FONT,
              transition: 'all .15s',
            }}
          >
            Apply Filters
          </button>
        </div>

        <style>{`
          @keyframes slideUp {
            from {
              transform: translateY(100%);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default FilterModal;
