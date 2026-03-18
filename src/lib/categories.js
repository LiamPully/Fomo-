// Category configuration for FOMO Markets
// Top-level categories shown in main filter
// Subcategories shown when "Other" is selected

// Main categories shown as visible bubble blocks (5 main categories)
export const MAIN_CATEGORIES = [
  { id: 'all', name: 'All', color: '#111111' },
  { id: 'food-drink', name: 'Food & Drink', color: '#DC2626' },
  { id: 'music', name: 'Music', color: '#7C3AED' },
  { id: 'markets', name: 'Markets', color: '#E8783A' },
  { id: 'other', name: 'Other', color: '#888880' },
];

// All top-level categories (including those in "Other" dropdown)
export const TOP_LEVEL_CATEGORIES = [
  { id: 'all', name: 'All', color: '#111111' },
  { id: 'business', name: 'Business', color: '#2563EB' },
  { id: 'family', name: 'Family', color: '#059669' },
  { id: 'kids', name: 'Kids', color: '#E8783A' },
  { id: 'food-drink', name: 'Food & Drink', color: '#DC2626' },
  { id: 'music', name: 'Music', color: '#7C3AED' },
  { id: 'sport-fitness', name: 'Sport & Fitness', color: '#0891B2' },
  { id: 'community', name: 'Community', color: '#059669' },
  { id: 'faith-christian', name: 'Faith / Christian', color: '#4A82C4' },
  { id: 'nightlife', name: 'Nightlife', color: '#7C3AED' },
  { id: 'other', name: 'Other', color: '#888880' },
];

// Subcategories shown when "Other" is selected
export const SUB_CATEGORIES = [
  { id: 'education', name: 'Education', color: '#4A82C4' },
  { id: 'markets', name: 'Markets', color: '#E8783A' },
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
  { id: 'other-other', name: 'Other', color: '#888880' },
];

// Helper to get category color by ID
export const getCategoryColor = (categoryId) => {
  const category = TOP_LEVEL_CATEGORIES.find(c => c.id === categoryId);
  if (category) return category.color;

  const subCategory = SUB_CATEGORIES.find(c => c.id === categoryId);
  if (subCategory) return subCategory.color;

  return '#888880'; // Default gray
};

// Helper to get category name by ID
export const getCategoryName = (categoryId) => {
  const category = TOP_LEVEL_CATEGORIES.find(c => c.id === categoryId);
  if (category) return category.name;

  const subCategory = SUB_CATEGORIES.find(c => c.id === categoryId);
  if (subCategory) return subCategory.name;

  return 'Other';
};

// Legacy category mapping for backward compatibility
// Maps old category names to new IDs
export const LEGACY_CATEGORY_MAP = {
  'Market': 'markets',
  'Event': 'community',
  'Fun': 'entertainment',
  'Other': 'other',
};

// Convert legacy category to new system
export const migrateLegacyCategory = (legacyCategory) => {
  return LEGACY_CATEGORY_MAP[legacyCategory] || 'other';
};
