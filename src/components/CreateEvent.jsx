import { useState, useRef, useCallback, memo, useEffect } from "react";
import { TOP_LEVEL_CATEGORIES, SUB_CATEGORIES } from "../lib/categories";
import {
  uploadMultipleImages,
  deleteMultipleImages,
  createPreviewUrl,
  revokePreviewUrl,
  getFileInfo,
} from "../api/storage";
import {
  BG, WHITE, BLACK, GRAY, GRAY_LIGHT, GRAY_MEDIUM, ACCENT, ACCENT_LIGHT, FONT,
  SHADOW_CARD, SHADOW_CARD_HOVER, SHADOW_BUTTON, OVERLAY_DARK, ERROR, ERROR_LIGHT,
} from "../lib/theme";
import { safeLog } from "../lib/security";
import "../styles/airbnb-inspired.css";

// Icon component
const Icon = ({ name, size = 20, color = BLACK }) => {
  const icons = {
    back: (
      <>
        <polyline points="15 18 9 12 15 6" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    image: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="2" fill="none" />
        <circle cx="8.5" cy="8.5" r="1.5" fill={color} />
        <path d="M21 15l-5-5L5 21" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    x: (
      <>
        <line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </>
    ),
    plus: (
      <>
        <line x1="12" y1="5" x2="12" y2="19" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </>
    ),
    check: (
      <>
        <polyline points="20 6 9 17 4 12" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke={color} strokeWidth="2" fill="none" />
        <line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </>
    ),
    map: (
      <>
        <polygon points="1 6 1 22 8 18 16 22 21 18 21 2 16 6 8 2 1 6" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="8" y1="2" x2="8" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <line x1="16" y1="6" x2="16" y2="22" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </>
    ),
    phone: (
      <>
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.57 12.57 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.57 12.57 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    camera: (
      <>
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="13" r="4" stroke={color} strokeWidth="2" fill="none" />
      </>
    ),
    eye: (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" fill="none" />
      </>
    ),
    edit: (
      <>
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {icons[name] || null}
    </svg>
  );
};

// Step indicator component
const StepIndicator = memo(({ currentStep, totalSteps, stepLabels }) => {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 4,
              background: i + 1 <= currentStep ? ACCENT : GRAY_LIGHT,
              borderRadius: 2,
              marginRight: i < totalSteps - 1 ? 8 : 0,
              transition: "background 0.3s ease",
            }}
          />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {stepLabels.map((label, i) => (
          <span
            key={i}
            style={{
              fontFamily: FONT,
              fontSize: 12,
              fontWeight: i + 1 === currentStep ? 600 : 400,
              color: i + 1 === currentStep ? ACCENT : i + 1 < currentStep ? BLACK : GRAY_MEDIUM,
              transition: "color 0.3s ease",
            }}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
});

StepIndicator.displayName = "StepIndicator";

// Form input components
const FormInput = memo(({ inputRef, type = "text", placeholder, hasError, disabled = false, value = "", onChange, onBlur: externalOnBlur }) => {
  return (
    <input
      ref={inputRef}
      type={type}
      placeholder={placeholder}
      disabled={disabled}
      value={value}
      onChange={onChange}
      autoComplete="off"
      style={{
        width: "100%",
        border: `1.5px solid ${hasError ? ACCENT : GRAY_LIGHT}`,
        borderRadius: 12,
        padding: "14px 16px",
        fontSize: 15,
        outline: "none",
        background: WHITE,
        fontFamily: FONT,
        boxSizing: "border-box",
        marginBottom: hasError ? 6 : 0,
        WebkitAppearance: "none",
        touchAction: "manipulation",
        transition: "border-color 0.15s ease, box-shadow 0.15s ease",
      }}
      onFocus={(e) => {
        e.target.style.borderColor = ACCENT;
        e.target.style.boxShadow = `0 0 0 3px ${ACCENT_LIGHT}`;
      }}
      onBlur={(e) => {
        e.target.style.borderColor = hasError ? ACCENT : GRAY_LIGHT;
        e.target.style.boxShadow = "none";
        if (externalOnBlur) externalOnBlur(e);
      }}
    />
  );
});

FormInput.displayName = "FormInput";

const FormTextarea = memo(({ textareaRef, placeholder, hasError, disabled = false, value = "", onChange }) => {
  return (
    <textarea
      ref={textareaRef}
      placeholder={placeholder}
      rows={4}
      disabled={disabled}
      value={value}
      onChange={onChange}
      style={{
        width: "100%",
        border: `1.5px solid ${hasError ? ACCENT : GRAY_LIGHT}`,
        borderRadius: 12,
        padding: "14px 16px",
        fontSize: 15,
        outline: "none",
        background: WHITE,
        fontFamily: FONT,
        resize: "vertical",
        boxSizing: "border-box",
        marginBottom: hasError ? 6 : 0,
        minHeight: 100,
        WebkitAppearance: "none",
        touchAction: "manipulation",
        transition: "border-color 0.15s ease, box-shadow 0.15s ease",
      }}
      onFocus={(e) => {
        e.target.style.borderColor = ACCENT;
        e.target.style.boxShadow = `0 0 0 3px ${ACCENT_LIGHT}`;
      }}
      onBlur={(e) => {
        e.target.style.borderColor = hasError ? ACCENT : GRAY_LIGHT;
        e.target.style.boxShadow = "none";
      }}
    />
  );
});

FormTextarea.displayName = "FormTextarea";

const DateTimeInput = memo(({ inputRef, hasError, disabled = false, value = "", onChange }) => {
  return (
    <input
      ref={inputRef}
      type="datetime-local"
      disabled={disabled}
      value={value}
      onChange={onChange}
      style={{
        width: "100%",
        border: `1.5px solid ${hasError ? ACCENT : GRAY_LIGHT}`,
        borderRadius: 12,
        padding: "12px 14px",
        fontSize: 14,
        outline: "none",
        background: WHITE,
        fontFamily: FONT,
        boxSizing: "border-box",
        marginBottom: hasError ? 6 : 0,
        WebkitAppearance: "none",
        touchAction: "manipulation",
        transition: "border-color 0.15s ease, box-shadow 0.15s ease",
      }}
      onFocus={(e) => {
        e.target.style.borderColor = ACCENT;
        e.target.style.boxShadow = `0 0 0 3px ${ACCENT_LIGHT}`;
      }}
      onBlur={(e) => {
        e.target.style.borderColor = hasError ? ACCENT : GRAY_LIGHT;
        e.target.style.boxShadow = "none";
      }}
    />
  );
});

DateTimeInput.displayName = "DateTimeInput";

// Category button
const CategoryButton = memo(({ label, isActive, color, onClick }) => {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      style={{
        border: "none",
        background: isActive ? color : WHITE,
        color: isActive ? WHITE : BLACK,
        borderRadius: 9999,
        padding: "12px 20px",
        fontSize: 14,
        fontWeight: isActive ? 600 : 500,
        cursor: "pointer",
        fontFamily: FONT,
        transform: isPressed ? "scale(0.95)" : "scale(1)",
        transition: "all 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
        boxShadow: isActive ? SHADOW_BUTTON : SHADOW_CARD,
      }}
    >
      {label}
    </button>
  );
});

CategoryButton.displayName = "CategoryButton";

// Image Uploader Component
const ImageUploader = memo(({ onImagesChange, disabled = false, existingImages = [] }) => {
  const [images, setImages] = useState(existingImages);
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState([]);
  const fileInputRef = useRef(null);

  const MAX_IMAGES = 5;

  useEffect(() => {
    return () => {
      images.forEach((img) => {
        if (img.previewUrl && !img.url) revokePreviewUrl(img.previewUrl);
      });
    };
  }, []);

  useEffect(() => {
    if (existingImages.length > 0 && images.length === 0) {
      setImages(existingImages);
    }
  }, [existingImages]);

  const handleFiles = useCallback(
    (fileList) => {
      const newErrors = [];
      const files = Array.from(fileList).slice(0, MAX_IMAGES - images.length);

      const newImages = files
        .map((file) => {
          const info = getFileInfo(file);
          if (!info.isValid) {
            newErrors.push(`${file.name}: ${info.errors?.join(", ")}`);
            return null;
          }
          return {
            file,
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            previewUrl: createPreviewUrl(file),
            name: file.name,
            size: info.formattedSize,
            status: "pending",
          };
        })
        .filter(Boolean);

      if (newErrors.length > 0) {
        setErrors((prev) => [...prev, ...newErrors].slice(-3));
      }

      if (newImages.length > 0) {
        const updatedImages = [...images, ...newImages].slice(0, MAX_IMAGES);
        setImages(updatedImages);
        onImagesChange(updatedImages);
      }
    },
    [images, onImagesChange]
  );

  const handleDragOver = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) setIsDragging(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (!disabled && e.dataTransfer.files) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles, disabled]
  );

  const handleInputChange = useCallback(
    (e) => {
      if (e.target.files) {
        handleFiles(e.target.files);
        e.target.value = "";
      }
    },
    [handleFiles]
  );

  const removeImage = useCallback(
    (id) => {
      const image = images.find((img) => img.id === id);
      if (image?.previewUrl && !image.url) {
        revokePreviewUrl(image.previewUrl);
      }
      const updated = images.filter((img) => img.id !== id);
      setImages(updated);
      onImagesChange(updated);
      setErrors([]);
    },
    [images, onImagesChange]
  );

  return (
    <div style={{ marginBottom: 24 }}>
      <label
        style={{
          fontFamily: FONT,
          fontSize: 13,
          fontWeight: 600,
          color: GRAY,
          display: "block",
          marginBottom: 8,
        }}
      >
        Images ({images.length}/{MAX_IMAGES})
      </label>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() =>
          !disabled && images.length < MAX_IMAGES && fileInputRef.current?.click()
        }
        style={{
          border: `2px dashed ${isDragging ? ACCENT : errors.length > 0 ? ACCENT : GRAY_LIGHT}`,
          borderRadius: 14,
          padding: images.length === 0 ? "40px 20px" : "16px",
          background: isDragging ? ACCENT_LIGHT : WHITE,
          cursor: disabled || images.length >= MAX_IMAGES ? "not-allowed" : "pointer",
          textAlign: "center",
          transition: "all 0.2s ease",
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
          style={{ display: "none" }}
        />

        {images.length === 0 ? (
          <div>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: GRAY_LIGHT,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
              }}
            >
              <Icon name="image" size={24} color={GRAY} />
            </div>
            <p
              style={{
                fontFamily: FONT,
                fontSize: 15,
                color: BLACK,
                margin: "0 0 4px",
                fontWeight: 500,
              }}
            >
              Drop images here or tap to upload
            </p>
            <p
              style={{
                fontFamily: FONT,
                fontSize: 13,
                color: GRAY,
                margin: 0,
              }}
            >
              JPG, PNG, WebP up to 5MB each
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
              gap: 12,
            }}
          >
            {images.map((img, index) => (
              <div
                key={img.id}
                style={{
                  position: "relative",
                  aspectRatio: "1",
                  borderRadius: 10,
                  overflow: "hidden",
                  background: GRAY_LIGHT,
                }}
              >
                <img
                  src={img.previewUrl || img.url}
                  alt={img.name || img.originalName}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(img.id);
                  }}
                  disabled={disabled}
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: OVERLAY_DARK,
                    border: "none",
                    cursor: disabled ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                    transition: "transform 0.15s ease",
                  }}
                  onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.9)")}
                  onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  <Icon name="x" size={14} color={WHITE} />
                </button>

                <div
                  style={{
                    position: "absolute",
                    bottom: 6,
                    left: 6,
                    background: OVERLAY_DARK,
                    color: WHITE,
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontFamily: FONT,
                  }}
                >
                  {index + 1}
                </div>
              </div>
            ))}

            {images.length < MAX_IMAGES && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                style={{
                  aspectRatio: "1",
                  borderRadius: 10,
                  border: `2px dashed ${GRAY_LIGHT}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  background: GRAY_LIGHT,
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = ACCENT;
                  e.currentTarget.style.background = ACCENT_LIGHT;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = GRAY_LIGHT;
                  e.currentTarget.style.background = GRAY_LIGHT;
                }}
              >
                <Icon name="plus" size={24} color={GRAY} />
              </div>
            )}
          </div>
        )}
      </div>

      {errors.length > 0 && (
        <div
          style={{
            marginTop: 12,
            padding: "12px 14px",
            background: ERROR_LIGHT,
            borderRadius: 10,
          }}
        >
          {errors.map((error, i) => (
            <p
              key={i}
              style={{
                fontFamily: FONT,
                fontSize: 13,
                color: ERROR,
                margin: i === 0 ? 0 : "4px 0 0",
              }}
            >
              {error}
            </p>
          ))}
        </div>
      )}
    </div>
  );
});

ImageUploader.displayName = "ImageUploader";

// Label component
const FieldLabel = ({ children, required }) => (
  <label
    style={{
      fontFamily: FONT,
      fontSize: 13,
      fontWeight: 600,
      color: GRAY,
      display: "block",
      marginBottom: 8,
    }}
  >
    {children}
    {required && <span style={{ color: ACCENT, marginLeft: 4 }}>*</span>}
  </label>
);

// Error message component
const ErrorMessage = ({ message }) =>
  message ? (
    <p
      style={{
        color: ACCENT,
        fontSize: 13,
        marginBottom: 12,
        marginTop: -12,
        fontFamily: FONT,
      }}
    >
      {message}
    </p>
  ) : null;

// Navigation buttons
const NavigationButtons = ({ onBack, onNext, onPublish, onSaveDraft, isSubmitting, uploadProgress, isLastStep, isFirstStep }) => {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        marginTop: 32,
        paddingTop: 16,
        borderTop: `1px solid ${GRAY_LIGHT}`,
      }}
    >
      {!isFirstStep && (
        <button
          onClick={onBack}
          disabled={isSubmitting}
          style={{
            flex: 1,
            background: WHITE,
            color: BLACK,
            border: `1.5px solid ${GRAY_LIGHT}`,
            borderRadius: 12,
            padding: "14px 20px",
            fontSize: 15,
            fontWeight: 600,
            cursor: isSubmitting ? "not-allowed" : "pointer",
            fontFamily: FONT,
            opacity: isSubmitting ? 0.7 : 1,
            transition: "all 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          onMouseDown={(e) => !isSubmitting && (e.currentTarget.style.transform = "scale(0.96)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          Back
        </button>
      )}

      {isLastStep ? (
        <>
          <button
            onClick={onSaveDraft}
            disabled={isSubmitting}
            style={{
              flex: 1,
              background: WHITE,
              color: BLACK,
              border: "none",
              borderRadius: 12,
              padding: "14px 20px",
              fontSize: 15,
              fontWeight: 600,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              fontFamily: FONT,
              opacity: isSubmitting ? 0.7 : 1,
              transition: "all 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
              boxShadow: SHADOW_CARD,
            }}
            onMouseDown={(e) =>
              !isSubmitting && (e.currentTarget.style.transform = "scale(0.96)")
            }
            onMouseUp={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = SHADOW_CARD_HOVER;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = SHADOW_CARD;
            }}
          >
            {isSubmitting ? "Saving…" : "Save draft"}
          </button>
          <button
            onClick={onPublish}
            disabled={isSubmitting}
            style={{
              flex: 2,
              background: ACCENT,
              color: WHITE,
              border: "none",
              borderRadius: 12,
              padding: "14px 20px",
              fontSize: 15,
              fontWeight: 600,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              fontFamily: FONT,
              opacity: isSubmitting ? 0.7 : 1,
              transition: "all 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
              boxShadow: "0 4px 12px rgba(232,93,63,0.3)",
            }}
            onMouseDown={(e) =>
              !isSubmitting && (e.currentTarget.style.transform = "scale(0.96)")
            }
            onMouseUp={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(232,93,63,0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(232,93,63,0.3)";
            }}
          >
            {isSubmitting
              ? uploadProgress > 0
                ? `Uploading ${uploadProgress}%…`
                : "Publishing…"
              : "Publish event"}
          </button>
        </>
      ) : (
        <button
          onClick={onNext}
          disabled={isSubmitting}
          style={{
            flex: 1,
            background: BLACK,
            color: WHITE,
            border: "none",
            borderRadius: 12,
            padding: "14px 20px",
            fontSize: 15,
            fontWeight: 600,
            cursor: isSubmitting ? "not-allowed" : "pointer",
            fontFamily: FONT,
            opacity: isSubmitting ? 0.7 : 1,
            transition: "all 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
            boxShadow: SHADOW_BUTTON,
          }}
          onMouseDown={(e) =>
            !isSubmitting && (e.currentTarget.style.transform = "scale(0.96)")
          }
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = SHADOW_CARD_HOVER;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = SHADOW_BUTTON;
          }}
        >
          Continue
        </button>
      )}
    </div>
  );
};

const CreateEvent = ({ user, onSave, onBack }) => {
  // Step state
  const [currentStep, setCurrentStep] = useState(1);
  const TOTAL_STEPS = 4;
  const STEP_LABELS = ["Basics", "When & Where", "Contact & Photos", "Review"];

  // Form data state (persist across steps)
  const [formData, setFormData] = useState({
    title: "",
    desc: "",
    cat: "business",
    subCat: "",
    start: "",
    end: "",
    venue: "",
    area: "",
    phone: "",
    wa: "",
    web: "",
    ig: "",
    images: [],
  });

  // UI state
  const [showSubCats, setShowSubCats] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Refs
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

  // Update form data helper
  const updateFormData = useCallback((updates) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    // Clear errors for updated fields so the user sees feedback immediately
    setErrors((prev) => {
      const next = { ...prev };
      Object.keys(updates).forEach((key) => delete next[key]);
      return next;
    });
  }, []);

  // Category change handler
  const handleCatChange = useCallback(
    (catId) => {
      updateFormData({ cat: catId, subCat: "" });
      setShowSubCats(catId === "other");
    },
    [updateFormData]
  );

  // Step validation
  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!formData.title.trim()) {
          newErrors.title = "Event title is required";
        } else if (formData.title.trim().length < 2) {
          newErrors.title = "Title must be at least 2 characters";
        }
        if (!formData.desc.trim()) {
          newErrors.desc = "Description is required";
        }
        if (showSubCats && !formData.subCat) {
          newErrors.subCat = "Please select a subcategory";
        }
        break;

      case 2:
        if (!formData.start) {
          newErrors.start = "Start time is required";
        }
        if (!formData.end) {
          newErrors.end = "End time is required";
        }
        if (formData.start && formData.end && new Date(formData.start) >= new Date(formData.end)) {
          newErrors.end = "End time must be after start time";
        }
        if (!formData.area.trim()) {
          newErrors.area = "Area/City is required";
        }
        break;

      case 3:
        // Contact info is optional, but validate if provided
        if (formData.phone && !/^\+?[\d\s-()]{10,}$/.test(formData.phone)) {
          newErrors.phone = "Please enter a valid phone number";
        }
        if (formData.wa && !/^\+?[\d\s-()]{10,}$/.test(formData.wa)) {
          newErrors.wa = "Please enter a valid WhatsApp number";
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
      setErrors({});
    }
  }, [currentStep, formData, showSubCats]);

  const handleBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setErrors({});
  }, []);

  // Image handlers
  const handleImagesChange = useCallback((images) => {
    updateFormData({ images });
  }, [updateFormData]);

  // Submit handler
  const handleSubmit = useCallback(
    async (status) => {
      if (!validateStep(currentStep)) return;

      setIsSubmitting(true);
      setIsUploading(true);
      setUploadProgress(0);

      let uploadedImageData = [];

      try {
        // Upload images (non-blocking — event still publishes if upload fails)
        const pendingImages = formData.images.filter((img) => img.status === "pending");

        if (pendingImages.length > 0) {
          const { images: uploaded, errors: uploadErrors } = await uploadMultipleImages(
            pendingImages.map((img) => img.file),
            tempEventId.current,
            (current, total, percent) => {
              const overallProgress = (current / total) * 100 + percent / total;
              setUploadProgress(Math.round(overallProgress));
            }
          );

          if (uploadErrors.length > 0) {
            // Warn but don't block — storage bucket or RLS permissions may be missing
            const firstErr = uploadErrors[0]?.error || '';
            console.error('[CreateEvent] Upload errors:', uploadErrors);
            setErrors({
              submit: 'Images couldn\'t be uploaded. Check Supabase Storage → Policies for bucket "events-images": ensure INSERT (authenticated) and SELECT (anon) policies exist. Event will publish without images.',
            });
            // Continue to publish without images
          } else {
            uploadedImageData = uploaded;
          }
        }

        // Include already uploaded images
        const existingImages = formData.images
          .filter((img) => img.url)
          .map((img) => ({
            url: img.url,
            thumbnailUrl: img.thumbnailUrl,
            originalName: img.originalName,
          }));

        const submitData = {
          ...formData,
          status,
          images: [...existingImages, ...uploadedImageData],
        };

        await onSave(submitData);
      } catch (err) {
        safeLog.error("Save error:", err);
        setErrors({ submit: "Failed to save event. Please try again." });

        if (uploadedImageData.length > 0) {
          await deleteMultipleImages(uploadedImageData.map((img) => img.path));
        }
      } finally {
        setIsSubmitting(false);
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [currentStep, formData, onSave]
  );

  // Render step content
  const renderStep1 = () => (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ marginBottom: 24 }}>
        <h2
          style={{
            fontFamily: FONT,
            fontSize: 24,
            fontWeight: 700,
            color: BLACK,
            marginBottom: 8,
          }}
        >
          Let's start with the basics
        </h2>
        <p
          style={{
            fontFamily: FONT,
            fontSize: 15,
            color: GRAY,
            margin: 0,
          }}
        >
          What are you hosting? Give your event a great title and description.
        </p>
      </div>

      {/* Title */}
      <FieldLabel required>Event title</FieldLabel>
      <FormInput
        inputRef={titleRef}
        placeholder="e.g. Saturday Morning Market"
        hasError={!!errors.title}
        value={formData.title}
        onChange={(e) => updateFormData({ title: e.target.value })}
      />
      <ErrorMessage message={errors.title} />

      {/* Description */}
      <FieldLabel required>Description</FieldLabel>
      <FormTextarea
        textareaRef={descRef}
        placeholder="Tell people what to expect... What's happening? Who should come? What will they experience?"
        hasError={!!errors.desc}
        value={formData.desc}
        onChange={(e) => updateFormData({ desc: e.target.value })}
      />
      <ErrorMessage message={errors.desc} />

      {/* Category */}
      <FieldLabel required>Category</FieldLabel>
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: showSubCats ? 16 : 0,
        }}
      >
        {TOP_LEVEL_CATEGORIES.filter((c) => c.id !== "all").map((c) => (
          <CategoryButton
            key={c.id}
            label={c.name}
            isActive={formData.cat === c.id}
            color={c.color}
            onClick={() => handleCatChange(c.id)}
          />
        ))}
      </div>

      {/* Subcategory */}
      {showSubCats && (
        <div
          style={{
            marginTop: 16,
            padding: 20,
            background: WHITE,
            borderRadius: 16,
            boxShadow: SHADOW_CARD,
          }}
        >
          <p
            style={{
              fontFamily: FONT,
              fontSize: 12,
              fontWeight: 600,
              color: GRAY,
              marginBottom: 14,
              textTransform: "uppercase",
              letterSpacing: "0.8px",
            }}
          >
            Select a more specific category
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {SUB_CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => updateFormData({ subCat: c.id })}
                style={{
                  border: `1.5px solid ${formData.subCat === c.id ? c.color : GRAY_LIGHT}`,
                  background: formData.subCat === c.id ? c.color : WHITE,
                  color: formData.subCat === c.id ? WHITE : BLACK,
                  borderRadius: 20,
                  padding: "8px 14px",
                  fontSize: 13,
                  fontWeight: formData.subCat === c.id ? 600 : 500,
                  cursor: "pointer",
                  fontFamily: FONT,
                  transition: "all 0.15s ease",
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
          <ErrorMessage message={errors.subCat} />
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ marginBottom: 24 }}>
        <h2
          style={{
            fontFamily: FONT,
            fontSize: 24,
            fontWeight: 700,
            color: BLACK,
            marginBottom: 8,
          }}
        >
          When and where?
        </h2>
        <p
          style={{
            fontFamily: FONT,
            fontSize: 15,
            color: GRAY,
            margin: 0,
          }}
        >
          Help people find your event and know when to show up.
        </p>
      </div>

      {/* Date/Time */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 8 }}>
        <div>
          <FieldLabel required>Starts</FieldLabel>
          <DateTimeInput
            inputRef={startRef}
            hasError={!!errors.start}
            value={formData.start}
            onChange={(e) => updateFormData({ start: e.target.value })}
          />
          <ErrorMessage message={errors.start} />
        </div>
        <div>
          <FieldLabel required>Ends</FieldLabel>
          <DateTimeInput
            inputRef={endRef}
            hasError={!!errors.end}
            value={formData.end}
            onChange={(e) => updateFormData({ end: e.target.value })}
          />
          <ErrorMessage message={errors.end} />
        </div>
      </div>

      {/* Venue */}
      <FieldLabel>Venue</FieldLabel>
      <FormInput
        inputRef={venueRef}
        placeholder="e.g. The Old Biscuit Mill"
        value={formData.venue}
        onChange={(e) => updateFormData({ venue: e.target.value })}
      />

      {/* Area */}
      <FieldLabel required>Area / City</FieldLabel>
      <FormInput
        inputRef={areaRef}
        placeholder="e.g. Woodstock, Cape Town"
        hasError={!!errors.area}
        value={formData.area}
        onChange={(e) => updateFormData({ area: e.target.value })}
      />
      <ErrorMessage message={errors.area} />
    </div>
  );

  const renderStep3 = () => (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div style={{ marginBottom: 24 }}>
        <h2
          style={{
            fontFamily: FONT,
            fontSize: 24,
            fontWeight: 700,
            color: BLACK,
            marginBottom: 8,
          }}
        >
          How can people reach you?
        </h2>
        <p
          style={{
            fontFamily: FONT,
            fontSize: 15,
            color: GRAY,
            margin: 0,
          }}
        >
          Add contact details and photos to make your event stand out.
        </p>
      </div>

      {/* Contact Info Card */}
      <div
        style={{
          background: WHITE,
          borderRadius: 16,
          padding: 20,
          marginBottom: 24,
          boxShadow: SHADOW_CARD,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Icon name="phone" size={18} color={GRAY} />
          <span
            style={{
              fontFamily: FONT,
              fontSize: 14,
              fontWeight: 600,
              color: GRAY,
            }}
          >
            Contact Information
          </span>
        </div>

        <FieldLabel>Phone</FieldLabel>
        <FormInput
          inputRef={phoneRef}
          type="tel"
          placeholder="+27 82 000 0000"
          hasError={!!errors.phone}
          value={formData.phone}
          onChange={(e) => updateFormData({ phone: e.target.value })}
        />
        <ErrorMessage message={errors.phone} />

        <FieldLabel>WhatsApp</FieldLabel>
        <FormInput
          inputRef={waRef}
          type="tel"
          placeholder="+27 82 000 0000"
          hasError={!!errors.wa}
          value={formData.wa}
          onChange={(e) => updateFormData({ wa: e.target.value })}
        />
        <ErrorMessage message={errors.wa} />

        <FieldLabel>Website</FieldLabel>
        <FormInput
          inputRef={webRef}
          type="url"
          placeholder="yoursite.co.za"
          value={formData.web}
          onChange={(e) => updateFormData({ web: e.target.value })}
        />

        <FieldLabel>Instagram</FieldLabel>
        <FormInput
          inputRef={igRef}
          placeholder="@yourbusiness"
          value={formData.ig}
          onChange={(e) => updateFormData({ ig: e.target.value })}
        />
      </div>

      {/* Images */}
      <ImageUploader onImagesChange={handleImagesChange} disabled={isSubmitting} existingImages={formData.images} />

      {/* Upload Progress */}
      {isUploading && (
        <div
          style={{
            marginBottom: 20,
            padding: "14px 16px",
            background: WHITE,
            borderRadius: 12,
            boxShadow: SHADOW_CARD,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <span
              style={{
                fontFamily: FONT,
                fontSize: 14,
                fontWeight: 600,
                color: BLACK,
              }}
            >
              Uploading images…
            </span>
            <span
              style={{
                fontFamily: FONT,
                fontSize: 13,
                color: GRAY,
              }}
            >
              {uploadProgress}%
            </span>
          </div>
          <div
            style={{
              height: 4,
              background: GRAY_LIGHT,
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${uploadProgress}%`,
                height: "100%",
                background: ACCENT,
                borderRadius: 2,
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );

  const renderStep4 = () => {
    const category = TOP_LEVEL_CATEGORIES.find((c) => c.id === formData.cat);
    const subCategory = SUB_CATEGORIES.find((c) => c.id === formData.subCat);
    const formatDate = (dateStr) => {
      if (!dateStr) return "Not set";
      const date = new Date(dateStr);
      return date.toLocaleString("en-ZA", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    return (
      <div style={{ animation: "fadeIn 0.3s ease" }}>
        <div style={{ marginBottom: 24 }}>
          <h2
            style={{
              fontFamily: FONT,
              fontSize: 24,
              fontWeight: 700,
              color: BLACK,
              marginBottom: 8,
            }}
          >
            Review your event
          </h2>
          <p
            style={{
              fontFamily: FONT,
              fontSize: 15,
              color: GRAY,
              margin: 0,
            }}
          >
            Everything look good? Your event will be visible to everyone once published.
          </p>
        </div>

        {/* Event Preview Card */}
        <div
          style={{
            background: WHITE,
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: SHADOW_CARD,
            marginBottom: 24,
          }}
        >
          {/* Image preview */}
          {formData.images.length > 0 ? (
            <div
              style={{
                width: "100%",
                height: 200,
                background: GRAY_LIGHT,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <img
                src={formData.images[0].previewUrl || formData.images[0].url}
                alt="Event"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  background: OVERLAY_DARK,
                  color: WHITE,
                  padding: "6px 12px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: FONT,
                }}
              >
                {formData.images.length} photo{formData.images.length > 1 ? "s" : ""}
              </div>
            </div>
          ) : (
            <div
              style={{
                width: "100%",
                height: 120,
                background: ACCENT_LIGHT,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <Icon name="camera" size={32} color={ACCENT} />
              <span
                style={{
                  fontFamily: FONT,
                  fontSize: 13,
                  color: ACCENT,
                }}
              >
                No photos added
              </span>
            </div>
          )}

          {/* Content preview */}
          <div style={{ padding: 20 }}>
            <h3
              style={{
                fontFamily: FONT,
                fontSize: 20,
                fontWeight: 700,
                color: BLACK,
                marginBottom: 8,
                marginTop: 0,
              }}
            >
              {formData.title || "Untitled Event"}
            </h3>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 12,
              }}
            >
              <span
                style={{
                  background: category?.color || ACCENT,
                  color: WHITE,
                  padding: "4px 10px",
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: FONT,
                }}
              >
                {category?.name || "Event"}
              </span>
              {subCategory && (
                <span
                  style={{
                    background: GRAY_LIGHT,
                    color: GRAY,
                    padding: "4px 10px",
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 500,
                    fontFamily: FONT,
                  }}
                >
                  {subCategory.name}
                </span>
              )}
            </div>

            <p
              style={{
                fontFamily: FONT,
                fontSize: 14,
                color: GRAY,
                lineHeight: 1.5,
                marginBottom: 16,
                marginTop: 0,
              }}
            >
              {formData.desc || "No description provided"}
            </p>

            <div
              style={{
                borderTop: `1px solid ${GRAY_LIGHT}`,
                paddingTop: 16,
              }}
            >
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <Icon name="calendar" size={16} color={GRAY} />
                  <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: GRAY }}>
                    When
                  </span>
                </div>
                <p style={{ fontFamily: FONT, fontSize: 14, color: BLACK, margin: "0 0 0 24px" }}>
                  {formatDate(formData.start)}
                </p>
                <p style={{ fontFamily: FONT, fontSize: 14, color: GRAY, margin: "4px 0 0 24px" }}>
                  to {formatDate(formData.end)}
                </p>
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <Icon name="map" size={16} color={GRAY} />
                  <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: GRAY }}>
                    Where
                  </span>
                </div>
                <p style={{ fontFamily: FONT, fontSize: 14, color: BLACK, margin: "0 0 0 24px" }}>
                  {formData.venue || "Venue TBD"}
                </p>
                <p style={{ fontFamily: FONT, fontSize: 14, color: GRAY, margin: "4px 0 0 24px" }}>
                  {formData.area || "Area TBD"}
                </p>
              </div>

              {(formData.phone || formData.wa || formData.web || formData.ig) && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <Icon name="phone" size={16} color={GRAY} />
                    <span style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: GRAY }}>
                      Contact
                    </span>
                  </div>
                  {formData.phone && (
                    <p style={{ fontFamily: FONT, fontSize: 14, color: BLACK, margin: "0 0 0 24px" }}>
                      {formData.phone}
                    </p>
                  )}
                  {formData.web && (
                    <p style={{ fontFamily: FONT, fontSize: 14, color: ACCENT, margin: "4px 0 0 24px" }}>
                      {formData.web}
                    </p>
                  )}
                  {formData.ig && (
                    <p style={{ fontFamily: FONT, fontSize: 14, color: ACCENT, margin: "4px 0 0 24px" }}>
                      Instagram: {formData.ig}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Edit buttons */}
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <button
            onClick={() => setCurrentStep(1)}
            style={{
              background: GRAY_LIGHT,
              border: "none",
              borderRadius: 8,
              padding: "8px 14px",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: FONT,
              color: GRAY,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Icon name="edit" size={14} color={GRAY} />
            Edit basics
          </button>
          <button
            onClick={() => setCurrentStep(2)}
            style={{
              background: GRAY_LIGHT,
              border: "none",
              borderRadius: 8,
              padding: "8px 14px",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: FONT,
              color: GRAY,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Icon name="map" size={14} color={GRAY} />
            Edit location
          </button>
          <button
            onClick={() => setCurrentStep(3)}
            style={{
              background: GRAY_LIGHT,
              border: "none",
              borderRadius: 8,
              padding: "8px 14px",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: FONT,
              color: GRAY,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Icon name="phone" size={14} color={GRAY} />
            Edit contact
          </button>
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div
            style={{
              background: ERROR_LIGHT,
              borderRadius: 12,
              padding: "14px 16px",
              marginBottom: 16,
            }}
          >
            <p
              style={{
                fontFamily: FONT,
                fontSize: 14,
                color: ERROR,
                margin: 0,
              }}
            >
              {errors.submit}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 150,
        background: BG,
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        animation: "slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{ padding: "20px 20px 100px" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 24,
            position: "sticky",
            top: 0,
            background: BG,
            paddingTop: 12,
            paddingBottom: 12,
            zIndex: 10,
          }}
        >
          <button
            onClick={onBack}
            style={{
              background: WHITE,
              border: "none",
              borderRadius: 12,
              width: 44,
              height: 44,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: SHADOW_CARD,
              transition: "transform 0.15s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease",
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.92)")}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = SHADOW_CARD_HOVER;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = SHADOW_CARD;
            }}
          >
            <Icon name="back" size={20} />
          </button>
          <h1
            style={{
              fontFamily: FONT,
              fontSize: 20,
              fontWeight: 700,
              color: BLACK,
            }}
          >
            Create event
          </h1>
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} stepLabels={STEP_LABELS} />

        {/* Step Content */}
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}

        {/* Navigation */}
        <NavigationButtons
          onBack={handleBack}
          onNext={handleNext}
          onPublish={() => handleSubmit("published")}
          onSaveDraft={() => handleSubmit("draft")}
          isSubmitting={isSubmitting}
          uploadProgress={uploadProgress}
          isLastStep={currentStep === TOTAL_STEPS}
          isFirstStep={currentStep === 1}
        />
      </div>
    </div>
  );
};

export default CreateEvent;
