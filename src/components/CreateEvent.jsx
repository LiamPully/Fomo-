import { useState, useRef, useCallback, memo, useEffect } from 'react';
import { TOP_LEVEL_CATEGORIES, SUB_CATEGORIES } from '../lib/categories';
import { uploadMultipleImages, deleteMultipleImages, createPreviewUrl, revokePreviewUrl, getFileInfo } from '../api/storage';
import '../styles/design-system.css';

const FONT = "'Sora', system-ui, sans-serif";
const GRAY1 = '#888880';
const GRAY2 = '#E4E1DA';
const GRAY3 = '#F7F5F1';
const BLACK = '#111111';
const WHITE = '#FFFFFF';
const ACCENT = '#C75B39';

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

// Image Upload Component with drag-and-drop
const ImageUploader = memo(({ onImagesChange, disabled = false }) => {
  const [images, setImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [errors, setErrors] = useState([]);
  const fileInputRef = useRef(null);

  const MAX_IMAGES = 5;
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      images.forEach(img => {
        if (img.previewUrl) revokePreviewUrl(img.previewUrl);
      });
    };
  }, []);

  const handleFiles = useCallback((fileList) => {
    const newErrors = [];
    const files = Array.from(fileList).slice(0, MAX_IMAGES - images.length);

    const newImages = files.map(file => {
      const info = getFileInfo(file);

      if (!info.isValid) {
        newErrors.push(`${file.name}: ${info.errors?.join(', ')}`);
        return null;
      }

      return {
        file,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        previewUrl: createPreviewUrl(file),
        name: file.name,
        size: info.formattedSize,
        status: 'pending',
        progress: 0,
      };
    }).filter(Boolean);

    if (newErrors.length > 0) {
      setErrors(prev => [...prev, ...newErrors].slice(-3));
    }

    if (newImages.length > 0) {
      const updatedImages = [...images, ...newImages].slice(0, MAX_IMAGES);
      setImages(updatedImages);
      onImagesChange(updatedImages);
    }
  }, [images, onImagesChange]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (!disabled && e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles, disabled]);

  const handleInputChange = useCallback((e) => {
    if (e.target.files) {
      handleFiles(e.target.files);
      e.target.value = ''; // Reset for re-upload
    }
  }, [handleFiles]);

  const removeImage = useCallback((id) => {
    const image = images.find(img => img.id === id);
    if (image?.previewUrl) {
      revokePreviewUrl(image.previewUrl);
    }
    const updated = images.filter(img => img.id !== id);
    setImages(updated);
    onImagesChange(updated);
    setErrors([]);
  }, [images, onImagesChange]);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  return (
    <div style={{ marginBottom: 18 }}>
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
        Images ({images.length}/{MAX_IMAGES})
      </label>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && images.length < MAX_IMAGES && fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragging ? BLACK : errors.length > 0 ? '#E8783A' : GRAY2}`,
          borderRadius: 12,
          padding: images.length === 0 ? '40px 20px' : '16px',
          background: isDragging ? GRAY3 : WHITE,
          cursor: disabled || images.length >= MAX_IMAGES ? 'not-allowed' : 'pointer',
          textAlign: 'center',
          transition: 'all 0.2s ease',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleInputChange}
          disabled={disabled || images.length >= MAX_IMAGES}
          style={{ display: 'none' }}
        />

        {images.length === 0 ? (
          <div>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: GRAY3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={GRAY1} strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </div>
            <p style={{
              fontFamily: FONT,
              fontSize: 14,
              color: BLACK,
              margin: '0 0 4px',
              fontWeight: 500,
            }}>
              Drop images here or click to upload
            </p>
            <p style={{
              fontFamily: FONT,
              fontSize: 12,
              color: GRAY1,
              margin: 0,
            }}>
              JPG, PNG, WebP up to 5MB each
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
            gap: 12,
          }}>
            {images.map((img, index) => (
              <div
                key={img.id}
                style={{
                  position: 'relative',
                  aspectRatio: '1',
                  borderRadius: 8,
                  overflow: 'hidden',
                  background: GRAY3,
                }}
              >
                <img
                  src={img.previewUrl}
                  alt={img.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />

                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(img.id);
                  }}
                  disabled={disabled}
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.7)',
                    border: 'none',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={WHITE} strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>

                {/* Progress overlay */}
                {img.status === 'uploading' && (
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    background: 'rgba(0,0,0,0.2)',
                  }}>
                    <div style={{
                      width: `${img.progress}%`,
                      height: '100%',
                      background: ACCENT,
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                )}

                {/* Index badge */}
                <div style={{
                  position: 'absolute',
                  bottom: 4,
                  left: 4,
                  background: 'rgba(0,0,0,0.6)',
                  color: WHITE,
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: 4,
                  fontFamily: FONT,
                }}>
                  {index + 1}
                </div>
              </div>
            ))}

            {/* Add more button */}
            {images.length < MAX_IMAGES && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                style={{
                  aspectRatio: '1',
                  borderRadius: 8,
                  border: `2px dashed ${GRAY2}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  background: GRAY3,
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={GRAY1} strokeWidth="1.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error messages */}
      {errors.length > 0 && (
        <div style={{
          marginTop: 8,
          padding: '10px 12px',
          background: '#FEE2E2',
          borderRadius: 8,
        }}>
          {errors.map((error, i) => (
            <p key={i} style={{
              fontFamily: FONT,
              fontSize: 12,
              color: '#DC2626',
              margin: i === 0 ? 0 : '4px 0 0',
            }}>
              {error}
            </p>
          ))}
          <button
            onClick={clearErrors}
            style={{
              fontFamily: FONT,
              fontSize: 11,
              color: GRAY1,
              background: 'none',
              border: 'none',
              padding: '4px 0 0',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}, (prev, next) => prev.disabled === next.disabled);

ImageUploader.displayName = 'ImageUploader';

const CreateEvent = ({ user, onSave, onBack }) => {
  const [cat, setCat] = useState('business');
  const [subCat, setSubCat] = useState('');
  const [showSubCats, setShowSubCats] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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
  const tempEventId = useRef(`temp-${Date.now()}`);

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

  const handleImagesChange = useCallback((images) => {
    setUploadedImages(images);
  }, []);

  const handleSave = useCallback(async (status) => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setIsUploading(true);
    setUploadProgress(0);

    let uploadedImageData = [];

    try {
      // Upload images first if any
      if (uploadedImages.length > 0) {
        const filesToUpload = uploadedImages.filter(img => img.status === 'pending');

        if (filesToUpload.length > 0) {
          const { images: uploaded, errors: uploadErrors } = await uploadMultipleImages(
            filesToUpload.map(img => img.file),
            tempEventId.current,
            (current, total, percent) => {
              const overallProgress = ((current / total) * 100) + (percent / total);
              setUploadProgress(Math.round(overallProgress));
            }
          );

          if (uploadErrors.length > 0) {
            setErrors({
              submit: `Failed to upload ${uploadErrors.length} image(s). ${uploadErrors[0]?.error || ''}`
            });
            setIsSubmitting(false);
            setIsUploading(false);
            return;
          }

          uploadedImageData = uploaded;
        }
      }

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
        status: status,
        images: uploadedImageData.map(img => ({
          url: img.url,
          thumbnailUrl: img.thumbnailUrl,
          originalName: img.originalName,
        })),
      };

      await onSave(formData);
    } catch (err) {
      console.error('Save error:', err);
      setErrors({ submit: 'Failed to save event. Please try again.' });

      // Cleanup uploaded images on error
      if (uploadedImageData.length > 0) {
        await deleteMultipleImages(uploadedImageData.map(img => img.path));
      }
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [cat, subCat, onSave, showSubCats, uploadedImages]);

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

        {/* Image Upload */}
        <ImageUploader
          onImagesChange={handleImagesChange}
          disabled={isSubmitting || isUploading}
        />

        {/* Upload Progress */}
        {isUploading && (
          <div style={{
            marginBottom: 16,
            padding: '12px 16px',
            background: GRAY3,
            borderRadius: 12,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}>
              <span style={{
                fontFamily: FONT,
                fontSize: 13,
                fontWeight: 600,
                color: BLACK,
              }}>
                Uploading images…
              </span>
              <span style={{
                fontFamily: FONT,
                fontSize: 12,
                color: GRAY1,
              }}>
                {uploadProgress}%
              </span>
            </div>
            <div style={{
              height: 4,
              background: GRAY2,
              borderRadius: 2,
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${uploadProgress}%`,
                height: '100%',
                background: ACCENT,
                borderRadius: 2,
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button
            onClick={() => handleSave('draft')}
            disabled={isSubmitting || isUploading}
            style={{
              flex: 1,
              background: GRAY3,
              color: BLACK,
              border: 'none',
              borderRadius: 999,
              padding: 14,
              fontSize: 14,
              fontWeight: 600,
              cursor: isSubmitting || isUploading ? 'not-allowed' : 'pointer',
              fontFamily: FONT,
              opacity: isSubmitting || isUploading ? 0.7 : 1
            }}
          >
            {isUploading ? 'Uploading…' : 'Save draft'}
          </button>
          <button
            onClick={() => handleSave('published')}
            disabled={isSubmitting || isUploading}
            style={{
              flex: 2,
              background: BLACK,
              color: WHITE,
              border: 'none',
              borderRadius: 999,
              padding: 14,
              fontSize: 14,
              fontWeight: 700,
              cursor: isSubmitting || isUploading ? 'not-allowed' : 'pointer',
              fontFamily: FONT,
              opacity: isSubmitting || isUploading ? 0.7 : 1
            }}
          >
            {isUploading ? `Uploading ${uploadProgress}%…` : isSubmitting ? 'Publishing…' : 'Publish event'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;
