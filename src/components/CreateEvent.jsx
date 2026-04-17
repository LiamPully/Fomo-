import { useState, useRef, useCallback, memo, useEffect } from "react";
import { TOP_LEVEL_CATEGORIES, SUB_CATEGORIES } from "../lib/categories";
import {
  uploadMultipleImages,
  deleteMultipleImages,
  createPreviewUrl,
  revokePreviewUrl,
  getFileInfo,
} from "../api/storage";
import "../styles/modern-design.css";

// Modern Design Tokens
const BG = "#F8F9FA";
const WHITE = "#FFFFFF";
const BLACK = "#1A1A1A";
const GRAY = "#5F6368";
const GRAY_LIGHT = "#F1F3F4";
const GRAY_MEDIUM = "#80868B";
const ACCENT = "#E85D3F";
const ACCENT_LIGHT = "#FFF5F2";
const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

/**
 * CreateEvent - Modern event creation form with bulletproof mobile inputs
 */

// Stable Input - Never re-renders
const StableInput = memo(
  ({ inputRef, type = "text", placeholder, hasError, disabled = false }) => {
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
          width: "100%",
          border: `1.5px solid ${hasError ? ACCENT : GRAY_LIGHT}`,
          borderRadius: 12,
          padding: "14px 16px",
          fontSize: 15,
          outline: "none",
          background: WHITE,
          fontFamily: FONT,
          boxSizing: "border-box",
          marginBottom: hasError ? 6 : 18,
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
  },
  () => true,
);

StableInput.displayName = "StableInput";

// Stable Textarea - Never re-renders
const StableTextarea = memo(
  ({ textareaRef, placeholder, hasError, disabled = false }) => {
    return (
      <textarea
        ref={textareaRef}
        placeholder={placeholder}
        rows={4}
        disabled={disabled}
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
          marginBottom: hasError ? 6 : 18,
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
  },
  () => true,
);

StableTextarea.displayName = "StableTextarea";

// Stable DateTime Input - Never re-renders
const StableDateTimeInput = memo(
  ({ inputRef, hasError, disabled = false }) => {
    return (
      <input
        ref={inputRef}
        type="datetime-local"
        disabled={disabled}
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
          marginBottom: hasError ? 6 : 18,
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
  },
  () => true,
);

StableDateTimeInput.displayName = "StableDateTimeInput";

// Icon component
const Icon = ({ name, size = 20, color = BLACK }) => {
  const icons = {
    back: (
      <>
        <polyline
          points="15 18 9 12 15 6"
          stroke={color}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
    image: (
      <>
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="2"
          stroke={color}
          strokeWidth="2"
          fill="none"
        />
        <circle cx="8.5" cy="8.5" r="1.5" fill={color} />
        <path
          d="M21 15l-5-5L5 21"
          stroke={color}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
    x: (
      <>
        <line
          x1="18"
          y1="6"
          x2="6"
          y2="18"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="6"
          y1="6"
          x2="18"
          y2="18"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </>
    ),
    plus: (
      <>
        <line
          x1="12"
          y1="5"
          x2="12"
          y2="19"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="5"
          y1="12"
          x2="19"
          y2="12"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </>
    ),
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {icons[name] || null}
    </svg>
  );
};

// Image Upload Component with drag-and-drop
const ImageUploader = memo(
  ({ onImagesChange, disabled = false }) => {
    const [images, setImages] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [errors, setErrors] = useState([]);
    const fileInputRef = useRef(null);

    const MAX_IMAGES = 5;

    useEffect(() => {
      return () => {
        images.forEach((img) => {
          if (img.previewUrl) revokePreviewUrl(img.previewUrl);
        });
      };
    }, []);

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
      [images, onImagesChange],
    );

    const handleDragOver = useCallback(
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) setIsDragging(true);
      },
      [disabled],
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
      [handleFiles, disabled],
    );

    const handleInputChange = useCallback(
      (e) => {
        if (e.target.files) {
          handleFiles(e.target.files);
          e.target.value = "";
        }
      },
      [handleFiles],
    );

    const removeImage = useCallback(
      (id) => {
        const image = images.find((img) => img.id === id);
        if (image?.previewUrl) {
          revokePreviewUrl(image.previewUrl);
        }
        const updated = images.filter((img) => img.id !== id);
        setImages(updated);
        onImagesChange(updated);
        setErrors([]);
      },
      [images, onImagesChange],
    );

    const clearErrors = useCallback(() => {
      setErrors([]);
    }, []);

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
            !disabled &&
            images.length < MAX_IMAGES &&
            fileInputRef.current?.click()
          }
          style={{
            border: `2px dashed ${isDragging ? ACCENT : errors.length > 0 ? ACCENT : GRAY_LIGHT}`,
            borderRadius: 14,
            padding: images.length === 0 ? "40px 20px" : "16px",
            background: isDragging ? ACCENT_LIGHT : WHITE,
            cursor:
              disabled || images.length >= MAX_IMAGES
                ? "not-allowed"
                : "pointer",
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
                    src={img.previewUrl}
                    alt={img.name}
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
                      background: "rgba(0,0,0,0.7)",
                      border: "none",
                      cursor: disabled ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                      transition: "transform 0.15s ease",
                    }}
                    onMouseDown={(e) =>
                      (e.currentTarget.style.transform = "scale(0.9)")
                    }
                    onMouseUp={(e) =>
                      (e.currentTarget.style.transform = "scale(1)")
                    }
                  >
                    <Icon name="x" size={14} color={WHITE} />
                  </button>

                  <div
                    style={{
                      position: "absolute",
                      bottom: 6,
                      left: 6,
                      background: "rgba(0,0,0,0.6)",
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
              background: "#FEE2E2",
              borderRadius: 10,
            }}
          >
            {errors.map((error, i) => (
              <p
                key={i}
                style={{
                  fontFamily: FONT,
                  fontSize: 13,
                  color: "#EA4335",
                  margin: i === 0 ? 0 : "4px 0 0",
                }}
              >
                {error}
              </p>
            ))}
            <button
              onClick={clearErrors}
              style={{
                fontFamily: FONT,
                fontSize: 12,
                color: GRAY,
                background: "none",
                border: "none",
                padding: "8px 0 0",
                cursor: "pointer",
              }}
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    );
  },
  (prev, next) => prev.disabled === next.disabled,
);

ImageUploader.displayName = "ImageUploader";

const CreateEvent = ({ user, onSave, onBack }) => {
  const [cat, setCat] = useState("business");
  const [subCat, setSubCat] = useState("");
  const [showSubCats, setShowSubCats] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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
    setSubCat("");
    setShowSubCats(catId === "other");
  }, []);

  const validateForm = () => {
    const newErrors = {};

    const title = titleRef.current?.value || "";
    const desc = descRef.current?.value || "";
    const start = startRef.current?.value || "";
    const end = endRef.current?.value || "";
    const area = areaRef.current?.value || "";

    if (!title.trim()) {
      newErrors.title = "Event title is required";
    } else if (title.trim().length < 2) {
      newErrors.title = "Title must be at least 2 characters";
    }

    if (!desc.trim()) {
      newErrors.desc = "Description is required";
    }

    if (!start) {
      newErrors.start = "Start time is required";
    }

    if (!end) {
      newErrors.end = "End time is required";
    }

    if (start && end && new Date(start) >= new Date(end)) {
      newErrors.end = "End time must be after start time";
    }

    if (!area.trim()) {
      newErrors.area = "Area/City is required";
    }

    if (showSubCats && !subCat) {
      newErrors.subCat = "Please select a subcategory";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImagesChange = useCallback((images) => {
    setUploadedImages(images);
  }, []);

  const handleSave = useCallback(
    async (status) => {
      if (!validateForm()) return;

      setIsSubmitting(true);
      setIsUploading(true);
      setUploadProgress(0);

      let uploadedImageData = [];

      try {
        if (uploadedImages.length > 0) {
          const filesToUpload = uploadedImages.filter(
            (img) => img.status === "pending",
          );

          if (filesToUpload.length > 0) {
            const { images: uploaded, errors: uploadErrors } =
              await uploadMultipleImages(
                filesToUpload.map((img) => img.file),
                tempEventId.current,
                (current, total, percent) => {
                  const overallProgress =
                    (current / total) * 100 + percent / total;
                  setUploadProgress(Math.round(overallProgress));
                },
              );

            if (uploadErrors.length > 0) {
              setErrors({
                submit: `Failed to upload ${uploadErrors.length} image(s). ${uploadErrors[0]?.error || ""}`,
              });
              setIsSubmitting(false);
              setIsUploading(false);
              return;
            }

            uploadedImageData = uploaded;
          }
        }

        const formData = {
          title: titleRef.current?.value || "",
          desc: descRef.current?.value || "",
          cat: cat,
          subCat: subCat,
          start: startRef.current?.value || "",
          end: endRef.current?.value || "",
          venue: venueRef.current?.value || "",
          area: areaRef.current?.value || "",
          phone: phoneRef.current?.value || "",
          wa: waRef.current?.value || "",
          web: webRef.current?.value || "",
          ig: igRef.current?.value || "",
          status: status,
          images: uploadedImageData.map((img) => ({
            url: img.url,
            thumbnailUrl: img.thumbnailUrl,
            originalName: img.originalName,
          })),
        };

        await onSave(formData);
      } catch (err) {
        console.error("Save error:", err);
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
    [cat, subCat, onSave, showSubCats, uploadedImages],
  );

  const Lbl = ({ c, required }) => (
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
      {c}
      {required && <span style={{ color: ACCENT, marginLeft: 4 }}>*</span>}
    </label>
  );

  const ErrorMsg = ({ msg }) =>
    msg ? (
      <p
        style={{
          color: ACCENT,
          fontSize: 13,
          marginBottom: 12,
          fontFamily: FONT,
        }}
      >
        {msg}
      </p>
    ) : null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 150,
        background: BG,
        overflowY: "auto",
      }}
    >
      <div style={{ padding: "16px 16px 100px" }}>
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
            paddingTop: 8,
            paddingBottom: 8,
            zIndex: 10,
          }}
        >
          <button
            onClick={onBack}
            style={{
              background: WHITE,
              border: "none",
              borderRadius: 12,
              width: 40,
              height: 40,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              transition: "transform 0.15s ease",
            }}
            onMouseDown={(e) =>
              (e.currentTarget.style.transform = "scale(0.95)")
            }
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <Icon name="back" size={20} />
          </button>
          <h1
            style={{
              fontFamily: FONT,
              fontSize: 22,
              fontWeight: 700,
              color: BLACK,
            }}
          >
            Create event
          </h1>
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div
            style={{
              background: "#FEE2E2",
              borderRadius: 12,
              padding: "14px 16px",
              marginBottom: 20,
            }}
          >
            <p
              style={{
                fontFamily: FONT,
                fontSize: 14,
                color: "#EA4335",
                margin: 0,
              }}
            >
              {errors.submit}
            </p>
          </div>
        )}

        {/* Title */}
        <Lbl c="Event title" required />
        <StableInput
          inputRef={titleRef}
          placeholder="e.g. Saturday Morning Market"
          hasError={!!errors.title}
        />
        <ErrorMsg msg={errors.title} />

        {/* Description */}
        <Lbl c="Description" required />
        <StableTextarea
          textareaRef={descRef}
          placeholder="Tell people what to expect…"
          hasError={!!errors.desc}
        />
        <ErrorMsg msg={errors.desc} />

        {/* Category */}
        <Lbl c="Category" required />
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          {TOP_LEVEL_CATEGORIES.filter((c) => c.id !== "all").map((c) => (
            <button
              key={c.id}
              onClick={() => handleCatChange(c.id)}
              style={{
                border: "none",
                background: cat === c.id ? c.color : WHITE,
                color: cat === c.id ? WHITE : BLACK,
                borderRadius: 20,
                padding: "10px 18px",
                fontSize: 14,
                fontWeight: cat === c.id ? 600 : 500,
                cursor: "pointer",
                fontFamily: FONT,
                boxShadow:
                  cat === c.id
                    ? "0 2px 8px rgba(0,0,0,0.15)"
                    : "0 1px 3px rgba(0,0,0,0.08)",
                transition: "all 0.15s ease",
              }}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Subcategory selector */}
        {showSubCats && (
          <div
            style={{
              marginBottom: 20,
              padding: 16,
              background: WHITE,
              borderRadius: 14,
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <p
              style={{
                fontFamily: FONT,
                fontSize: 13,
                fontWeight: 600,
                color: GRAY,
                marginBottom: 12,
              }}
            >
              Select a more specific category
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {SUB_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSubCat(c.id)}
                  style={{
                    border: `1.5px solid ${subCat === c.id ? c.color : GRAY_LIGHT}`,
                    background: subCat === c.id ? c.color : WHITE,
                    color: subCat === c.id ? WHITE : BLACK,
                    borderRadius: 20,
                    padding: "8px 14px",
                    fontSize: 13,
                    fontWeight: subCat === c.id ? 600 : 500,
                    cursor: "pointer",
                    fontFamily: FONT,
                    transition: "all 0.15s ease",
                  }}
                >
                  {c.name}
                </button>
              ))}
            </div>
            <ErrorMsg msg={errors.subCat} />
          </div>
        )}

        {/* Date/Time */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          <div>
            <Lbl c="Start" required />
            <StableDateTimeInput
              inputRef={startRef}
              hasError={!!errors.start}
            />
            <ErrorMsg msg={errors.start} />
          </div>
          <div>
            <Lbl c="End" required />
            <StableDateTimeInput inputRef={endRef} hasError={!!errors.end} />
            <ErrorMsg msg={errors.end} />
          </div>
        </div>

        {/* Venue */}
        <Lbl c="Venue" />
        <StableInput
          inputRef={venueRef}
          placeholder="e.g. The Old Biscuit Mill"
        />

        {/* Area */}
        <Lbl c="Area / City" required />
        <StableInput
          inputRef={areaRef}
          placeholder="e.g. Woodstock, Cape Town"
          hasError={!!errors.area}
        />
        <ErrorMsg msg={errors.area} />

        {/* Contact Info */}
        <div
          style={{
            background: WHITE,
            borderRadius: 14,
            padding: 16,
            marginBottom: 24,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <p
            style={{
              fontFamily: FONT,
              fontSize: 13,
              fontWeight: 600,
              color: GRAY,
              marginBottom: 16,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Contact Information
          </p>

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
          <StableInput inputRef={igRef} placeholder="@yourbusiness" />
        </div>

        {/* Image Upload */}
        <ImageUploader
          onImagesChange={handleImagesChange}
          disabled={isSubmitting || isUploading}
        />

        {/* Upload Progress */}
        {isUploading && (
          <div
            style={{
              marginBottom: 20,
              padding: "14px 16px",
              background: WHITE,
              borderRadius: 12,
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
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

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 8,
            position: "sticky",
            bottom: 20,
            background: BG,
            paddingTop: 12,
          }}
        >
          <button
            onClick={() => handleSave("draft")}
            disabled={isSubmitting || isUploading}
            style={{
              flex: 1,
              background: WHITE,
              color: BLACK,
              border: `1.5px solid ${GRAY_LIGHT}`,
              borderRadius: 24,
              padding: "14px",
              fontSize: 15,
              fontWeight: 600,
              cursor: isSubmitting || isUploading ? "not-allowed" : "pointer",
              fontFamily: FONT,
              opacity: isSubmitting || isUploading ? 0.7 : 1,
              transition: "all 0.15s ease",
            }}
          >
            {isUploading ? "Uploading…" : "Save draft"}
          </button>
          <button
            onClick={() => handleSave("published")}
            disabled={isSubmitting || isUploading}
            style={{
              flex: 2,
              background: BLACK,
              color: WHITE,
              border: "none",
              borderRadius: 24,
              padding: "14px",
              fontSize: 15,
              fontWeight: 600,
              cursor: isSubmitting || isUploading ? "not-allowed" : "pointer",
              fontFamily: FONT,
              opacity: isSubmitting || isUploading ? 0.7 : 1,
              transition: "transform 0.15s ease",
            }}
            onMouseDown={(e) =>
              !(isSubmitting || isUploading) &&
              (e.currentTarget.style.transform = "scale(0.98)")
            }
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            {isUploading
              ? `Uploading ${uploadProgress}%…`
              : isSubmitting
                ? "Publishing…"
                : "Publish event"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;
