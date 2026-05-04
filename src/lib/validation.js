// API Input Validation Utilities
import { sanitizeHtml } from './security';

/**
 * Sanitizes a string input to prevent SQL injection
 * Escapes special characters used in SQL LIKE clauses
 */
export const sanitizeSqlInput = (input) => {
  if (typeof input !== 'string') return '';
  return input
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
    .replace(/\\/g, '\\\\');
};

/**
 * Validates and sanitizes an email address
 */
export const validateEmail = (email) => {
  if (typeof email !== 'string') return { valid: false, error: 'Email must be a string' };
  const trimmed = email.trim();
  if (!trimmed) return { valid: false, error: 'Email is required' };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Invalid email format' };
  }

  return { valid: true, value: trimmed };
};

/**
 * Validates a UUID string
 */
export const validateUUID = (id) => {
  if (typeof id !== 'string') return { valid: false, error: 'ID must be a string' };

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return { valid: false, error: 'Invalid ID format' };
  }

  return { valid: true, value: id };
};

/**
 * Validates event data before creation/update
 */
export const validateEventData = (data) => {
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Invalid event data'], data: {} };
  }
  const errors = [];
  const sanitized = {};

  // Required fields
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length < 2) {
    errors.push('Title is required and must be at least 2 characters');
  } else {
    sanitized.title = sanitizeHtml(data.title.trim().slice(0, 255)); // Max length + XSS sanitize
  }

  if (!data.area || typeof data.area !== 'string' || data.area.trim().length < 1) {
    errors.push('Area/location is required');
  } else {
    sanitized.area = sanitizeHtml(data.area.trim().slice(0, 255));
  }

  // Date validation
  if (!data.start_time) {
    errors.push('Start time is required');
  } else {
    const startDate = new Date(data.start_time);
    if (isNaN(startDate.getTime())) {
      errors.push('Invalid start time format');
    } else {
      sanitized.start_time = data.start_time;
    }
  }

  if (!data.end_time) {
    errors.push('End time is required');
  } else {
    const endDate = new Date(data.end_time);
    if (isNaN(endDate.getTime())) {
      errors.push('Invalid end time format');
    } else {
      sanitized.end_time = data.end_time;
    }
  }

  // Validate end is after start
  if (sanitized.start_time && sanitized.end_time) {
    if (new Date(sanitized.end_time) <= new Date(sanitized.start_time)) {
      errors.push('End time must be after start time');
    }
  }

  // Optional fields with sanitization
  if (data.description) {
    sanitized.description = sanitizeHtml(String(data.description).slice(0, 5000)); // Max 5000 chars + XSS sanitize
  }

  if (data.venue) {
    sanitized.venue = sanitizeHtml(String(data.venue).trim().slice(0, 255));
  }

  if (data.organiser) {
    sanitized.organiser = sanitizeHtml(String(data.organiser).trim().slice(0, 255));
  }

  // Phone validation (basic)
  if (data.phone) {
    const phone = String(data.phone).replace(/\s/g, '');
    if (phone.length > 50) {
      errors.push('Phone number is too long');
    } else {
      sanitized.phone = phone;
    }
  }

  if (data.whatsapp) {
    const wa = String(data.whatsapp).replace(/\D/g, '');
    if (wa.length > 50) {
      errors.push('WhatsApp number is too long');
    } else {
      sanitized.whatsapp = wa;
    }
  }

  // URL validation
  const urlRegex = /^https?:\/\/.+/;
  if (data.website) {
    if (!urlRegex.test(data.website)) {
      errors.push('Website must be a valid URL starting with http:// or https://');
    } else {
      sanitized.website = data.website.slice(0, 255);
    }
  }

  if (data.image_url) {
    if (!urlRegex.test(data.image_url)) {
      errors.push('Image URL must be a valid URL');
    } else {
      sanitized.image_url = data.image_url.slice(0, 500);
    }
  }

  // Instagram handle validation
  if (data.instagram) {
    const ig = String(data.instagram).trim();
    if (ig.length > 100) {
      errors.push('Instagram handle is too long');
    } else {
      sanitized.instagram = ig.startsWith('@') ? ig.slice(1) : ig;
    }
  }

  // Status validation
  const validStatuses = ['published', 'draft', 'past', 'removed'];
  if (data.status && !validStatuses.includes(data.status)) {
    errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
  } else {
    sanitized.status = data.status || 'draft';
  }

  // Category ID validation
  if (data.category_id) {
    const catId = parseInt(data.category_id, 10);
    if (isNaN(catId) || catId < 1) {
      errors.push('Invalid category ID');
    } else {
      sanitized.category_id = catId;
    }
  }

  // Images array validation
  if (data.images) {
    if (!Array.isArray(data.images)) {
      errors.push('Images must be an array');
    } else if (data.images.length > 10) {
      errors.push('Maximum 10 images allowed');
    } else {
      // Validate each image object
      const sanitizedImages = data.images.map(img => {
        if (typeof img === 'string') {
          // Legacy string URL support
          return { url: img };
        }
        if (typeof img === 'object' && img !== null) {
          return {
            url: String(img.url || '').slice(0, 500),
            thumbnailUrl: img.thumbnailUrl ? String(img.thumbnailUrl).slice(0, 500) : null,
            originalName: img.originalName ? String(img.originalName).slice(0, 255) : null,
          };
        }
        return null;
      }).filter(Boolean);
      sanitized.images = sanitizedImages;
    }
  }

  // Business ID validation (required)
  if (!data.business_id) {
    errors.push('Business ID is required');
  } else {
    const uuidCheck = validateUUID(data.business_id);
    if (!uuidCheck.valid) {
      errors.push('Invalid business ID');
    } else {
      sanitized.business_id = data.business_id;
    }
  }

  // Coordinates validation
  if (data.latitude !== undefined && data.latitude !== null) {
    const lat = parseFloat(data.latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.push('Latitude must be between -90 and 90');
    } else {
      sanitized.latitude = lat;
    }
  }

  if (data.longitude !== undefined && data.longitude !== null) {
    const lng = parseFloat(data.longitude);
    if (isNaN(lng) || lng < -180 || lng > 180) {
      errors.push('Longitude must be between -180 and 180');
    } else {
      sanitized.longitude = lng;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    data: sanitized,
  };
};

/**
 * Validates business data
 */
export const validateBusinessData = (data) => {
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Invalid business data'], data: {} };
  }
  const errors = [];
  const sanitized = {};

  if (!data.business_name || typeof data.business_name !== 'string' || data.business_name.trim().length < 2) {
    errors.push('Business name is required and must be at least 2 characters');
  } else {
    sanitized.business_name = sanitizeHtml(data.business_name.trim().slice(0, 255));
  }

  if (!data.email) {
    errors.push('Email is required');
  } else {
    const emailCheck = validateEmail(data.email);
    if (!emailCheck.valid) {
      errors.push(emailCheck.error);
    } else {
      sanitized.email = emailCheck.value;
    }
  }

  if (data.phone) {
    const phone = String(data.phone).replace(/\s/g, '');
    if (phone.length > 50) {
      errors.push('Phone number is too long');
    } else {
      sanitized.phone = phone;
    }
  }

  if (data.website) {
    const urlRegex = /^https?:\/\/.+/;
    if (!urlRegex.test(data.website)) {
      errors.push('Website must be a valid URL');
    } else {
      sanitized.website = data.website.slice(0, 255);
    }
  }

  if (data.instagram) {
    sanitized.instagram = String(data.instagram).trim().slice(0, 100);
  }

  return {
    valid: errors.length === 0,
    errors,
    data: sanitized,
  };
};
