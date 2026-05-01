/**
 * API Module Exports
 * Centralized exports for all API modules
 */

// Events API
export {
  fetchEvents,
  fetchEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  fetchBusinessEvents,
  searchEvents,
  // Saved Events
  toggleSaveEvent,
  fetchSavedEvents,
  isEventSaved,
  // Categories
  fetchCategories,
} from './events';

// Storage API
export {
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
} from './storage';

// Businesses API
export {
  getOrCreateBusiness,
  getMyBusiness,
  getBusiness,
  updateBusiness,
  incrementEventCount,
  canPublishEvent,
} from './businesses';
