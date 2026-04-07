import { useState, useRef, useCallback, memo } from 'react';
import { TOP_LEVEL_CATEGORIES, SUB_CATEGORIES } from '../lib/categories';
import '../styles/design-system.css';

const FONT = "'Sora', system-ui, sans-serif";
const GRAY1 = '#888880';
const GRAY2 = '#E4E1DA';
const GRAY3 = '#F7F5F1';
const BLACK = '#111111';
const WHITE = '#FFFFFF';

/**
 * CreateEvent - Event creation form with bulletproof mobile inputs
 *
 * Uses completely uncontrolled inputs to prevent mobile keyboard issues.
 */

// Stable Input - Never re-renders
const StableInput = memo(({
  inputRef,
  type = 'text',
  placeholder,
  hasError,
  disabled = false
}) => {
  return (
    <input
      ref={inputRef}
      type={type}
      placeholder={placeholder}
      disabled={disabled}
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck="false"
      style={{
        width: '100%',
        border: `1.5px solid ${hasError ? '#E8783A' : GRAY2}`,
        borderRadius: 12,
        padding: '12px 14px',
        fontSize: 14,
        outline: 'none',
        background: GRAY3,
        fontFamily: FONT,
        boxSizing: 'border-box',
        marginBottom: 18,
        WebkitAppearance: 'none',
        touchAction: 'manipulation',
        transition: 'border-color 0.15s ease',
      }}
      onFocus={(e) => { e.target.style.borderColor = BLACK; }}
      onBlur={(e) => { e.target.style.borderColor = hasError ? '#E8783A' : GRAY2; }}
    />
  );
}, () => true);

StableInput.displayName = 'StableInput';

// Stable Textarea - Never re-renders
const StableTextarea = memo(({
  textareaRef,
  placeholder,
  hasError,
  disabled = false
}) => {
  return (
    <textarea
      ref={textareaRef}
      placeholder={placeholder}
      rows={4}
      disabled={disabled}
      style={{
        width: '100%',
        border: `1.5px solid ${hasError ? '#E8783A' : GRAY2}`,
        borderRadius: 12,
        padding: '12px 14px',
        fontSize: 14,
        outline: 'none',
        background: GRAY3,
        fontFamily: FONT,
        resize: 'vertical',
        boxSizing: 'border-box',
        marginBottom: 18,
        minHeight: 100,
        WebkitAppearance: 'none',
        touchAction: 'manipulation',
        transition: 'border-color 0.15s ease',
      }}
      onFocus={(e) => { e.target.style.borderColor = BLACK; }}
      onBlur={(e) => { e.target.style.borderColor = hasError ? '#E8783A' : GRAY2; }}
    />
  );
}, () => true);

StableTextarea.displayName = 'StableTextarea';

// Stable DateTime Input - Never re-renders
const StableDateTimeInput = memo(({
  inputRef,
  hasError,
  disabled = false
}) => {
  return (
    <input
      ref={inputRef}
      type="datetime-local"
      disabled={disabled}
      style={{
        width: '100%',
        border: `1.5px solid ${hasError ? '#E8783A' : GRAY2}`,
        borderRadius: 12,
        padding: '12px 10px',
        fontSize: 12,
        outline: 'none',
        background: GRAY3,
        fontFamily: FONT,
        boxSizing: 'border-box',
        marginBottom: 18,
        WebkitAppearance: 'none',
        touchAction: 'manipulation',
      }}
      onFocus={(e) => { e.target.style.borderColor = BLACK; }}
      onBlur={(e) => { e.target.style.borderColor = hasError ? '#E8783A' : GRAY2; }}
    />
  );
}, () => true);

StableDateTimeInput.displayName = 'StableDateTimeInput';

// Icon component
const I = ({ s = 18, c = 'currentColor', children }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none"
    stroke={c} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

const icons = {
  back: <I><polyline points="15 18 9 12 15 6"/></I>,
};

const Ico = ({ n, s = 18, c = 'currentColor' }) => {
  const el = icons[n];
  if (!el) return null;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: s,
      height: s,
      flexShrink: 0,
      color: c
    }}>
      {el}
    </span>
  );
};

const CreateEvent = ({ user, onSave, onBack }) => {
  const [cat, setCat] = useState('business');
  const [subCat, setSubCat] = useState('');
  const [showSubCats, setShowSubCats] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs for all form fields
  const titleRef = useRef(null);
  const descRef = useRef(null);
  const startRef = useRef(null);
  const endRef = useRef(null);
  const venueRef = useRef(null);
  const areaRef = useRef(null);
  const phoneRef = useRef(null);
  const waRef = useRef(null);
  const webRef = useRef(null);
  const igRef = useRef(null);

  const handleCatChange = useCallback((catId) => {
    setCat(catId);
    setSubCat('');
    setShowSubCats(catId === 'other');
  }, []);

  const validateForm = () => {
    const newErrors = {};

    const title = titleRef.current?.value || '';
    const desc = descRef.current?.value || '';
    const start = startRef.current?.value || '';
    const end = endRef.current?.value || '';
    const area = areaRef.current?.value || '';

    if (!title.trim()) {
      newErrors.title = 'Event title is required';
    } else if (title.trim().length < 2) {
      newErrors.title = 'Title must be at least 2 characters';
    }

    if (!desc.trim()) {
      newErrors.desc = 'Description is required';
    }

    if (!start) {
      newErrors.start = 'Start time is required';
    }

    if (!end) {
      newErrors.end = 'End time is required';
    }

    if (start && end && new Date(start) >= new Date(end)) {
      newErrors.end = 'End time must be after start time';
    }

    if (!area.trim()) {
      newErrors.area = 'Area/City is required';
    }

    if (showSubCats && !subCat) {
      newErrors.subCat = 'Please select a subcategory';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = useCallback(async (status) => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const formData = {
        title: titleRef.current?.value || '',
        desc: descRef.current?.value || '',
        cat: cat,
        subCat: subCat,
        start: startRef.current?.value || '',
        end: endRef.current?.value || '',
        venue: venueRef.current?.value || '',
        area: areaRef.current?.value || '',
        phone: phoneRef.current?.value || '',
        wa: waRef.current?.value || '',
        web: webRef.current?.value || '',
        ig: igRef.current?.value || '',
        status: status
      };

      await onSave(formData);
    } catch (err) {
      console.error('Save error:', err);
      setErrors({ submit: 'Failed to save event. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  }, [cat, subCat, onSave, showSubCats]);

  const Lbl = ({ c }) => (
    <label style={{
      fontFamily: FONT,
      fontSize: 11,
      fontWeight: 700,
      color: GRAY1,
      letterSpacing: '0.7px',
      textTransform: 'uppercase',
      display: 'block',
      marginBottom: 6
    }}>
      {c}
    </label>
  );

  return (
    <div style={{ background: WHITE, height: '100%', overflowY: 'auto' }}>
      <div style={{ padding: '16px 16px 100px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <button
            onClick={onBack}
            style={{
              background: GRAY3,
              border: 'none',
              borderRadius: '50%',
              width: 38,
              height: 38,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Ico n="back" s={18} c={BLACK} />
          </button>
          <h1 style={{
            fontFamily: FONT,
            fontSize: 22,
            fontWeight: 800,
            color: BLACK
          }}>
            Create event
          </h1>
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div style={{
            background: '#FEE2E2',
            border: '1px solid #FECACA',
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 16
          }}>
            <p style={{
              fontFamily: FONT,
              fontSize: 13,
              color: '#DC2626',
              margin: 0
            }}>
              {errors.submit}
            </p>
          </div>
        )}

        {/* Title */}
        <Lbl c="Event title *" />
        <StableInput
          inputRef={titleRef}
          placeholder="e.g. Saturday Morning Market"
          hasError={!!errors.title}
        />
        {errors.title && (
          <div style={{
            color: '#E8783A',
            fontSize: 12,
            marginTop: -14,
            marginBottom: 14,
            fontFamily: FONT
          }}>
            {errors.title}
          </div>
        )}

        {/* Description */}
        <Lbl c="Description *" />
        <StableTextarea
          textareaRef={descRef}
          placeholder="Tell people what to expect…"
          hasError={!!errors.desc}
        />
        {errors.desc && (
          <div style={{
            color: '#E8783A',
            fontSize: 12,
            marginTop: -14,
            marginBottom: 14,
            fontFamily: FONT
          }}>
            {errors.desc}
          </div>
        )}

        {/* Category */}
        <Lbl c="Category *" />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {TOP_LEVEL_CATEGORIES.filter(c => c.id !== 'all').map(c => (
            <button
              key={c.id}
              onClick={() => handleCatChange(c.id)}
              style={{
                border: `1.5px solid ${cat === c.id ? c.color : GRAY2}`,
                background: cat === c.id ? c.color : WHITE,
                color: cat === c.id ? WHITE : BLACK,
                borderRadius: 999,
                padding: '8px 14px',
                fontSize: 12,
                fontWeight: cat === c.id ? 700 : 400,
                cursor: 'pointer',
                fontFamily: FONT
              }}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Subcategory selector */}
        {showSubCats && (
          <div style={{
            marginBottom: 20,
            padding: 16,
            background: GRAY3,
            borderRadius: 12
          }}>
            <p style={{
              fontFamily: FONT,
              fontSize: 12,
              fontWeight: 700,
              color: GRAY1,
              marginBottom: 10
            }}>
              Select a more specific category:
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {SUB_CATEGORIES.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSubCat(c.id)}
                  style={{
                    border: `1.5px solid ${subCat === c.id ? c.color : GRAY2}`,
                    background: subCat === c.id ? c.color : WHITE,
                    color: subCat === c.id ? WHITE : BLACK,
                    borderRadius: 999,
                    padding: '6px 12px',
                    fontSize: 11,
                    fontWeight: subCat === c.id ? 700 : 400,
                    cursor: 'pointer',
                    fontFamily: FONT
                  }}
                >
                  {c.name}
                </button>
              ))}
            </div>
            {errors.subCat && (
              <div style={{
                color: '#E8783A',
                fontSize: 12,
                marginTop: 8,
                fontFamily: FONT
              }}>
                {errors.subCat}
              </div>
            )}
          </div>
        )}

        {/* Date/Time */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <Lbl c="Start *" />
            <StableDateTimeInput
              inputRef={startRef}
              hasError={!!errors.start}
            />
            {errors.start && (
              <div style={{
                color: '#E8783A',
                fontSize: 11,
                marginTop: -14,
                marginBottom: 14,
                fontFamily: FONT
              }}>
                {errors.start}
              </div>
            )}
          </div>
          <div>
            <Lbl c="End *" />
            <StableDateTimeInput
              inputRef={endRef}
              hasError={!!errors.end}
            />
            {errors.end && (
              <div style={{
                color: '#E8783A',
                fontSize: 11,
                marginTop: -14,
                marginBottom: 14,
                fontFamily: FONT
              }}>
                {errors.end}
              </div>
            )}
          </div>
        </div>

        {/* Venue */}
        <Lbl c="Venue" />
        <StableInput
          inputRef={venueRef}
          placeholder="e.g. The Old Biscuit Mill"
        />

        {/* Area */}
        <Lbl c="Area / City *" />
        <StableInput
          inputRef={areaRef}
          placeholder="e.g. Woodstock, Cape Town"
          hasError={!!errors.area}
        />
        {errors.area && (
          <div style={{
            color: '#E8783A',
            fontSize: 12,
            marginTop: -14,
            marginBottom: 14,
            fontFamily: FONT
          }}>
            {errors.area}
          </div>
        )}

        {/* Contact Info */}
        <Lbl c="Phone" />
        <StableInput
          inputRef={phoneRef}
          type="tel"
          placeholder="+27 82 000 0000"
        />

        <Lbl c="WhatsApp" />
        <StableInput
          inputRef={waRef}
          type="tel"
          placeholder="+27 82 000 0000"
        />

        <Lbl c="Website" />
        <StableInput
          inputRef={webRef}
          type="url"
          placeholder="yoursite.co.za"
        />

        <Lbl c="Instagram" />
        <StableInput
          inputRef={igRef}
          placeholder="@yourbusiness"
        />

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button
            onClick={() => handleSave('draft')}
            disabled={isSubmitting}
            style={{
              flex: 1,
              background: GRAY3,
              color: BLACK,
              border: 'none',
              borderRadius: 999,
              padding: 14,
              fontSize: 14,
              fontWeight: 600,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontFamily: FONT,
              opacity: isSubmitting ? 0.7 : 1
            }}
          >
            Save draft
          </button>
          <button
            onClick={() => handleSave('published')}
            disabled={isSubmitting}
            style={{
              flex: 2,
              background: BLACK,
              color: WHITE,
              border: 'none',
              borderRadius: 999,
              padding: 14,
              fontSize: 14,
              fontWeight: 700,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontFamily: FONT,
              opacity: isSubmitting ? 0.7 : 1
            }}
          >
            {isSubmitting ? 'Publishing…' : 'Publish event'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;
