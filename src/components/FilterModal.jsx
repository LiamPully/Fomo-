import { useEffect, useRef, useState } from "react";
import { MAIN_CATEGORIES } from "../lib/categories";
import {
  BG, WHITE, BLACK, GRAY, GRAY_LIGHT, GRAY_MEDIUM, ACCENT, FONT,
  SHADOW_CARD, SHADOW_BUTTON, OVERLAY_LIGHT,
} from "../lib/theme";
import "../styles/airbnb-inspired.css";

const SORT_OPTIONS = [
  { id: "chronological", label: "Date", desc: "Soonest first" },
  { id: "alphabetical", label: "Alphabetical", desc: "A to Z" },
  { id: "distance", label: "Distance", desc: "Nearest first" },
  { id: "popularity", label: "Popularity", desc: "Most viewed" },
];

const DATE_OPTIONS = [
  { id: "all", label: "All Time" },
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
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
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
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
      sortBy: "chronological",
      period: "all",
      distance: 25,
      category: "all",
    });
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: OVERLAY_LIGHT,
        zIndex: 200,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div
        ref={modalRef}
        style={{
          background: BG,
          borderRadius: "20px 20px 0 0",
          width: "100%",
          maxWidth: 430,
          maxHeight: "85vh",
          overflowY: "auto",
          animation: "slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        {/* Handle bar */}
        <div
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            background: GRAY_LIGHT,
            margin: "12px auto 8px",
          }}
        />

        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 20px 16px",
            position: "sticky",
            top: 0,
            background: BG,
            zIndex: 10,
          }}
        >
          <h2
            style={{
              fontFamily: FONT,
              fontSize: 22,
              fontWeight: 700,
              color: BLACK,
              margin: 0,
            }}
          >
            Filters
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 8,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke={GRAY}
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
        <div style={{ padding: "20px" }}>
          {/* Sort By Section */}
          <div style={{ marginBottom: 28 }}>
            <p
              style={{
                fontFamily: FONT,
                fontSize: 13,
                fontWeight: 600,
                color: GRAY,
                marginBottom: 12,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Sort By
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleSortChange(opt.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 16px",
                    background:
                      localFilters.sortBy === opt.id ? WHITE : "transparent",
                    border: `1.5px solid ${localFilters.sortBy === opt.id ? BLACK : GRAY_LIGHT}`,
                    borderRadius: 12,
                    cursor: "pointer",
                    fontFamily: FONT,
                    textAlign: "left",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: localFilters.sortBy === opt.id ? 600 : 500,
                        color: BLACK,
                        display: "block",
                      }}
                    >
                      {opt.label}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        color: GRAY,
                        marginTop: 2,
                        display: "block",
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
                        borderRadius: "50%",
                        background: ACCENT,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
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
                fontSize: 13,
                fontWeight: 600,
                color: GRAY,
                marginBottom: 12,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Date Range
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {DATE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleDateChange(opt.id)}
                  style={{
                    background: localFilters.period === opt.id ? BLACK : WHITE,
                    color: localFilters.period === opt.id ? WHITE : BLACK,
                    border: "none",
                    borderRadius: 20,
                    padding: "10px 18px",
                    fontSize: 14,
                    fontWeight: localFilters.period === opt.id ? 600 : 500,
                    cursor: "pointer",
                    fontFamily: FONT,
                    whiteSpace: "nowrap",
                    transition: "all 0.15s ease",
                    boxShadow:
                      localFilters.period === opt.id
                        ? SHADOW_BUTTON
                        : SHADOW_CARD,
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
                  fontSize: 13,
                  fontWeight: 600,
                  color: GRAY,
                  marginBottom: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Distance
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {DISTANCE_OPTIONS.map((dist) => (
                  <button
                    key={dist}
                    onClick={() => handleDistanceChange(dist)}
                    style={{
                      background:
                        localFilters.distance === dist ? ACCENT : WHITE,
                      color: localFilters.distance === dist ? WHITE : BLACK,
                      border: "none",
                      borderRadius: 20,
                      padding: "10px 18px",
                      fontSize: 14,
                      fontWeight: localFilters.distance === dist ? 600 : 500,
                      cursor: "pointer",
                      fontFamily: FONT,
                      whiteSpace: "nowrap",
                      transition: "all 0.15s ease",
                      boxShadow:
                        localFilters.distance === dist
                          ? "0 2px 8px rgba(232,93,63,0.3)"
                          : SHADOW_CARD,
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
                fontSize: 13,
                fontWeight: 600,
                color: GRAY,
                marginBottom: 12,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Category
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {MAIN_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  style={{
                    background:
                      localFilters.category === cat.id ? cat.color : WHITE,
                    color: localFilters.category === cat.id ? WHITE : BLACK,
                    border: "none",
                    borderRadius: 20,
                    padding: "10px 18px",
                    fontSize: 14,
                    fontWeight: localFilters.category === cat.id ? 600 : 500,
                    cursor: "pointer",
                    fontFamily: FONT,
                    whiteSpace: "nowrap",
                    transition: "all 0.15s ease",
                    boxShadow:
                      localFilters.category === cat.id
                        ? SHADOW_BUTTON
                        : SHADOW_CARD,
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
            display: "flex",
            gap: 12,
            padding: "16px 20px 24px",
            borderTop: `1px solid ${GRAY_LIGHT}`,
            position: "sticky",
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
              border: `1.5px solid ${GRAY_LIGHT}`,
              borderRadius: 24,
              padding: "14px 24px",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: FONT,
              transition: "all 0.15s ease",
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
              border: "none",
              borderRadius: 24,
              padding: "14px 24px",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: FONT,
              transition: "transform 0.15s ease",
            }}
            onMouseDown={(e) =>
              (e.currentTarget.style.transform = "scale(0.98)")
            }
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            Apply Filters
          </button>
        </div>

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
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
