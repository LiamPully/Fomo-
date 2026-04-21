// Centralized Design Tokens - Happenings App
// All screens must import from here to ensure visual consistency

// ============================================
// LIGHT THEME (Primary - used by all screens)
// ============================================
export const LIGHT_THEME = {
  // Background colors
  background: '#F8F9FA',
  backgroundSecondary: '#F1F3F4',

  // Card colors
  card: '#FFFFFF',
  cardHover: '#FAFAFA',

  // Text colors
  textPrimary: '#1A1A1A',
  textSecondary: '#5F6368',
  textMuted: '#80868B',

  // Accent/brand colors
  accent: '#E85D3F',
  accentLight: 'rgba(232, 93, 63, 0.15)',
  accentDark: '#D14A2F',

  // Utility colors
  white: '#FFFFFF',
  black: '#1A1A1A',
  border: 'rgba(0,0,0,0.08)',

  // Success/Status
  success: '#4ADE80',

  // Shadows (Airbnb-inspired three-layer system)
  shadowCard: '0 0 0 1px rgba(0,0,0,0.02), 0 2px 6px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.1)',
  shadowCardHover: '0 0 0 1px rgba(0,0,0,0.03), 0 4px 12px rgba(0,0,0,0.08), 0 8px 16px rgba(0,0,0,0.12)',
  shadowButton: '0 4px 12px rgba(0,0,0,0.08)',
  shadowNav: '0 -2px 10px rgba(0,0,0,0.05)',

  // Border radius
  radiusSmall: '8px',
  radiusMedium: '12px',
  radiusLarge: '16px',
  radiusXl: '20px',
  radiusFull: '9999px',

  // Typography
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontSizeXs: '11px',
  fontSizeSm: '12px',
  fontSizeMd: '14px',
  fontSizeLg: '15px',
  fontSizeXl: '16px',
  fontSize2xl: '18px',
  fontSize3xl: '20px',
  fontSize4xl: '26px',

  // Font weights
  fontWeightNormal: 400,
  fontWeightMedium: 500,
  fontWeightSemibold: 600,
  fontWeightBold: 700,
  fontWeightExtrabold: 800,

  // Spacing
  spacingXs: '4px',
  spacingSm: '8px',
  spacingMd: '12px',
  spacingLg: '16px',
  spacingXl: '20px',
  spacing2xl: '24px',
  spacing3xl: '28px',
  spacing4xl: '32px',

  // Animation
  transitionFast: '0.15s cubic-bezier(0.16, 1, 0.3, 1)',
  transitionNormal: '0.28s ease',
  transitionSlow: '0.4s cubic-bezier(0.16, 1, 0.3, 1)',
};

// ============================================
// DARK THEME (Deprecated - kept for reference)
// Note: All screens should use LIGHT_THEME for consistency
// ============================================
export const DARK_THEME = {
  background: '#1A1A2E',
  card: '#252542',
  cardHover: '#2E2E52',
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0C0',
  accent: '#E8503A',
  accentLight: 'rgba(232, 80, 58, 0.15)',
  shadowCard: '0 4px 16px rgba(0,0,0,0.2)',
};

// ============================================
// EXPORT INDIVIDUAL TOKENS (for backward compatibility)
// ============================================
export const BG = LIGHT_THEME.background;
export const WHITE = LIGHT_THEME.white;
export const BLACK = LIGHT_THEME.black;
export const GRAY = LIGHT_THEME.textSecondary;
export const GRAY_LIGHT = LIGHT_THEME.backgroundSecondary;
export const GRAY_MEDIUM = LIGHT_THEME.textMuted;
export const ACCENT = LIGHT_THEME.accent;
export const ACCENT_LIGHT = LIGHT_THEME.accentLight;
export const FONT = LIGHT_THEME.fontFamily;
export const SHADOW_CARD = LIGHT_THEME.shadowCard;
export const SHADOW_CARD_HOVER = LIGHT_THEME.shadowCardHover;
export const SHADOW_BUTTON = LIGHT_THEME.shadowButton;
export const SHADOW_NAV = LIGHT_THEME.shadowNav;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get greeting based on SAST timezone (South Africa Standard Time, UTC+2)
 * Time ranges:
 * - Morning: 5am to 11:59am
 * - Afternoon: 12pm to 4:59pm
 * - Evening: 5pm to 8:59pm
 * - Night: 9pm to 4:59am
 * @returns {string} Appropriate greeting
 */
export const getSASTGreeting = () => {
  // Get current time in SAST (Africa/Johannesburg)
  const now = new Date();
  const sastTime = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Johannesburg' }));
  const hour = sastTime.getHours();

  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 21) return 'Good evening';
  return 'Good evening'; // Night time (9pm-5am)
};

/**
 * Get user's first name from user object
 * Prioritizes firstName, then falls back to name split, then email
 * @param {Object} user - User object from auth
 * @returns {string} First name or fallback
 */
export const getUserFirstName = (user) => {
  if (!user) return 'there';
  return user.firstName
    || (user.name && user.name.split(' ')[0])
    || (user.email && user.email.split('@')[0])
    || 'there';
};

/**
 * Generate consistent attendee data for an event
 * Uses event ID as seed for consistent results
 * @param {string} eventId - Event ID
 * @returns {Object} Attendee count and avatars
 */
export const generateAttendeeData = (eventId) => {
  if (!eventId) {
    return { attendeeCount: 0, attendeeAvatars: [], isAttending: false };
  }

  // Use event ID to create a consistent seed
  const seed = eventId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const baseCount = (seed % 45) + 5; // 5-50 attendees
  const displayCount = Math.floor(baseCount / 5) * 5; // Round to nearest 5

  // Generate 3-5 avatar URLs for the avatar stack
  const avatarCount = Math.min(3, Math.floor((seed % 3) + 2));
  const avatars = [];
  for (let i = 0; i < avatarCount; i++) {
    avatars.push(`https://i.pravatar.cc/150?img=${(seed + i) % 70}`);
  }

  return {
    attendeeCount: displayCount,
    attendeeAvatars: avatars,
    isAttending: false
  };
};

// Default export for convenience
export default LIGHT_THEME;
