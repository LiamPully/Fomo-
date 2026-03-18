import { useEffect, useRef } from 'react';

const FONT = "'Sora', system-ui, sans-serif";
const BLACK = '#111111';
const WHITE = '#FFFFFF';
const GRAY2 = '#E4E1DA';
const GRAY3 = '#F7F5F1';

// Additional categories shown in "Other" dropdown
const ADDITIONAL_CATEGORIES = [
  { id: 'business', name: 'Business', color: '#2563EB' },
  { id: 'family', name: 'Family', color: '#059669' },
  { id: 'kids', name: 'Kids', color: '#E8783A' },
  { id: 'sport-fitness', name: 'Sport & Fitness', color: '#0891B2' },
  { id: 'community', name: 'Community', color: '#059669' },
  { id: 'faith-christian', name: 'Faith / Christian', color: '#4A82C4' },
  { id: 'nightlife', name: 'Nightlife', color: '#7C3AED' },
];

// Subcategories shown in "More" section
const MORE_CATEGORIES = [
  { id: 'education', name: 'Education', color: '#4A82C4' },
  { id: 'arts-culture', name: 'Arts & Culture', color: '#7C3AED' },
  { id: 'workshops', name: 'Workshops', color: '#2563EB' },
  { id: 'networking', name: 'Networking', color: '#059669' },
  { id: 'charity', name: 'Charity', color: '#DC2626' },
  { id: 'outdoors', name: 'Outdoors', color: '#0891B2' },
  { id: 'wellness', name: 'Wellness', color: '#059669' },
  { id: 'tech', name: 'Tech', color: '#2563EB' },
  { id: 'entertainment', name: 'Entertainment', color: '#7C3AED' },
  { id: 'seasonal', name: 'Seasonal', color: '#E8783A' },
  { id: 'online', name: 'Online', color: '#4A82C4' },
];

export const CategoryDropdown = ({ isOpen, onClose, onSelect, selectedCategory }) => {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      style={{
        background: WHITE,
        borderRadius: 16,
        padding: '16px',
        marginTop: 8,
        marginBottom: 16,
        border: `1px solid ${GRAY2}`,
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        maxHeight: '400px',
        overflowY: 'auto',
      }}
    >
      {/* Additional Categories */}
      <div style={{ marginBottom: 20 }}>
        <p
          style={{
            fontFamily: FONT,
            fontSize: 12,
            fontWeight: 600,
            color: '#888880',
            marginBottom: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Categories
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {ADDITIONAL_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              style={{
                background: selectedCategory === cat.id ? cat.color : GRAY3,
                color: selectedCategory === cat.id ? WHITE : BLACK,
                border: 'none',
                borderRadius: 999,
                padding: '8px 14px',
                fontSize: 13,
                fontWeight: selectedCategory === cat.id ? 700 : 400,
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

      {/* More Categories */}
      <div>
        <p
          style={{
            fontFamily: FONT,
            fontSize: 12,
            fontWeight: 600,
            color: '#888880',
            marginBottom: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          More
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {MORE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              style={{
                background: selectedCategory === cat.id ? cat.color : GRAY3,
                color: selectedCategory === cat.id ? WHITE : BLACK,
                border: 'none',
                borderRadius: 999,
                padding: '8px 14px',
                fontSize: 13,
                fontWeight: selectedCategory === cat.id ? 700 : 400,
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
  );
};

export default CategoryDropdown;
