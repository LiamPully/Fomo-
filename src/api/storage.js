import { supabase } from '../lib/supabase';
import { validateFileUpload, safeLog } from '../lib/security';

/**
 * Storage API for Supabase Storage integration
 * Handles image uploads, thumbnails, and URL generation
 */

const STORAGE_BUCKET = 'event-images';
const MAX_WIDTH = 1200;
const THUMB_WIDTH = 400;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

/**
 * Compress and resize an image before upload
 * @param {File} file - Original image file
 * @param {number} maxWidth - Maximum width in pixels
 * @param {number} quality - JPEG quality (0-1)
 * @returns {Promise<Blob>} - Compressed image blob
 */
export const compressImage = async (file, maxWidth = MAX_WIDTH, quality = 0.85) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Calculate new dimensions
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Use better quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create image blob'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
};

/**
 * Generate a thumbnail version of the image
 * @param {File} file - Original image file
 * @returns {Promise<Blob>} - Thumbnail blob
 */
export const generateThumbnail = async (file) => {
  return compressImage(file, THUMB_WIDTH, 0.75);
};

/**
 * Generate a unique filename for storage
 * @param {string} originalName - Original filename
 * @returns {string} - Unique filename with timestamp
 */
const generateUniqueFilename = (originalName) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  const extension = originalName.split('.').pop().toLowerCase() || 'jpg';
  return `${timestamp}-${random}.${extension}`;
};

/**
 * Upload a single image to Supabase Storage
 * @param {File} file - Image file to upload
 * @param {string} eventId - Event ID for folder organization
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<{url: string, thumbnailUrl: string, error: Error}>}
 */
export const uploadImage = async (file, eventId, onProgress = () => {}) => {
  try {
    // Validate file
    const validation = validateFileUpload(file, {
      maxSize: MAX_FILE_SIZE,
      allowedTypes: ALLOWED_TYPES,
      allowedExtensions: ALLOWED_EXTENSIONS,
    });

    if (!validation.valid) {
      return {
        url: null,
        thumbnailUrl: null,
        error: new Error(validation.errors?.[0] || 'Invalid file'),
      };
    }

    // Generate unique filenames
    const filename = generateUniqueFilename(file.name);
    const thumbFilename = `thumb-${filename}`;
    const folderPath = eventId || 'temp';

    // Compress images
    onProgress(10);
    const [compressedBlob, thumbnailBlob] = await Promise.all([
      compressImage(file),
      generateThumbnail(file),
    ]);

    onProgress(30);

    // Upload main image
    const { data: mainData, error: mainError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(`${folderPath}/${filename}`, compressedBlob, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (mainError) throw mainError;

    onProgress(60);

    // Upload thumbnail
    const { data: thumbData, error: thumbError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(`${folderPath}/${thumbFilename}`, thumbnailBlob, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (thumbError) throw thumbError;

    onProgress(80);

    // Get public URLs
    const { data: { publicUrl: mainUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(`${folderPath}/${filename}`);

    const { data: { publicUrl: thumbUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(`${folderPath}/${thumbFilename}`);

    onProgress(100);

    return {
      url: mainUrl,
      thumbnailUrl: thumbUrl,
      path: `${folderPath}/${filename}`,
      thumbnailPath: `${folderPath}/${thumbFilename}`,
      error: null,
    };
  } catch (error) {
    safeLog.error('Upload error:', error);
    return {
      url: null,
      thumbnailUrl: null,
      error: error.message || 'Upload failed',
    };
  }
};

/**
 * Upload multiple images
 * @param {File[]} files - Array of image files
 * @param {string} eventId - Event ID
 * @param {Function} onProgress - Progress callback (current, total)
 * @returns {Promise<{images: Array, errors: Array}>}
 */
export const uploadMultipleImages = async (files, eventId, onProgress = () => {}) => {
  const images = [];
  const errors = [];

  for (let i = 0; i < files.length; i++) {
    const result = await uploadImage(
      files[i],
      eventId,
      (percent) => onProgress(i, files.length, percent)
    );

    if (result.error) {
      errors.push({ file: files[i].name, error: result.error });
    } else {
      images.push({
        url: result.url,
        thumbnailUrl: result.thumbnailUrl,
        path: result.path,
        thumbnailPath: result.thumbnailPath,
        originalName: files[i].name,
      });
    }
  }

  return { images, errors };
};

/**
 * Delete an image from storage
 * @param {string} path - Image path in storage
 * @returns {Promise<{error: Error}>}
 */
export const deleteImage = async (path) => {
  try {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([path]);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    safeLog.error('Delete error:', error);
    return { error: error.message || 'Delete failed' };
  }
};

/**
 * Delete multiple images
 * @param {string[]} paths - Array of image paths
 * @returns {Promise<{error: Error}>}
 */
export const deleteMultipleImages = async (paths) => {
  if (!paths || paths.length === 0) return { error: null };

  try {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove(paths);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    safeLog.error('Bulk delete error:', error);
    return { error: error.message || 'Delete failed' };
  }
};

/**
 * Create a preview URL for an image file
 * @param {File} file - Image file
 * @returns {string} - Object URL for preview
 */
export const createPreviewUrl = (file) => {
  return URL.createObjectURL(file);
};

/**
 * Revoke a preview URL to free memory
 * @param {string} url - Object URL to revoke
 */
export const revokePreviewUrl = (url) => {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};

/**
 * Get file info with validation
 * @param {File} file - File to check
 * @returns {Object} - File info with validation status
 */
export const getFileInfo = (file) => {
  const validation = validateFileUpload(file, {
    maxSize: MAX_FILE_SIZE,
    allowedTypes: ALLOWED_TYPES,
    allowedExtensions: ALLOWED_EXTENSIONS,
  });

  return {
    name: file.name,
    size: file.size,
    type: file.type,
    formattedSize: formatFileSize(file.size),
    isValid: validation.valid,
    errors: validation.errors,
  };
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted size string
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Initialize the storage bucket (should be called once during app setup)
 * Note: This requires service role key or should be done in Supabase dashboard
 * @returns {Promise<{error: Error}>}
 */
export const initializeStorage = async () => {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) throw listError;

    const bucketExists = buckets?.some(b => b.name === STORAGE_BUCKET);

    if (!bucketExists) {
      // Create bucket with public access
      const { error: createError } = await supabase.storage.createBucket(STORAGE_BUCKET, {
        public: true,
        fileSizeLimit: MAX_FILE_SIZE,
        allowedMimeTypes: ALLOWED_TYPES,
      });

      if (createError) throw createError;
      safeLog.log('Storage bucket created:', STORAGE_BUCKET);
    }

    return { error: null };
  } catch (error) {
    safeLog.error('Storage initialization error:', error);
    return { error: error.message || 'Failed to initialize storage' };
  }
};

/**
 * Get public URL for an image
 * @param {string} path - Image path in storage
 * @returns {string} - Public URL
 */
export const getImageUrl = (path) => {
  if (!path) return null;
  const { data: { publicUrl } } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path);
  return publicUrl;
};

export default {
  uploadImage,
  uploadMultipleImages,
  deleteImage,
  deleteMultipleImages,
  compressImage,
  generateThumbnail,
  createPreviewUrl,
  revokePreviewUrl,
  getFileInfo,
  initializeStorage,
  getImageUrl,
};
