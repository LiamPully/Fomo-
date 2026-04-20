import { useState, useCallback, useMemo } from "react";
import "../styles/airbnb-inspired.css";

// Airbnb-Inspired Design Tokens
const BG = "#F8F9FA";
const WHITE = "#FFFFFF";
const BLACK = "#1A1A1A";
const GRAY = "#5F6368";
const GRAY_LIGHT = "#F1F3F4";
const GRAY_MEDIUM = "#80868B";
const ACCENT = "#E85D3F";
const ACCENT_LIGHT = "#FFF5F2";
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

const SHADOW_CARD = "0 0 0 1px rgba(0,0,0,0.02), 0 2px 6px rgba(0,0,0,0.04), 0 4px 8px rgba(0,0,0,0.1)";
const SHADOW_CARD_HOVER = "0 0 0 1px rgba(0,0,0,0.03), 0 4px 12px rgba(0,0,0,0.08), 0 8px 16px rgba(0,0,0,0.12)";

// Icon Component
const Icon = ({ name, size = 20, color = BLACK }) => {
  const icons = {
    plus: (
      <>
        <line x1="12" y1="5" x2="12" y2="19" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </>
    ),
    evtab: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" fill="none" />
        <line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </>
    ),
    edit: (
      <>
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
      </>
    ),
    card: (
      <>
        <rect x="1" y="4" width="22" height="16" rx="2" stroke={color} strokeWidth="2" fill="none" />
        <line x1="1" y1="10" x2="23" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill="none" />
        <line x1="12" y1="16" x2="12" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <line x1="12" y1="8" x2="12.01" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </>
    ),
    heart: (
      <>
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
      </>
    ),
    location: (
      <>
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
        <circle cx="12" cy="10" r="3" stroke={color} strokeWidth="2" fill="none" />
      </>
    ),
    user: (
      <>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
        <circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2" fill="none" />
      </>
    ),
    chevron: <polyline points="9 18 15 12 9 6" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />,
    logout: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />,
    ticket: (
      <>
        <path d="M2 9a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V9z" stroke={color} strokeWidth="2" fill="none" />
        <path d="M6 9v12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke={color} strokeWidth="2" fill="none" />
        <line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" />
        <line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="2" />
        <line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="2" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth="2" fill="none" />
      </>
    ),
    help: (
      <>
        <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill="none" />
        <line x1="12" y1="16" x2="12" y2="12" stroke={color} strokeWidth="2" />
        <path d="M12 8h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </>
    ),
    warning: (
      <>
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke={color} strokeWidth="2" fill="none" />
        <line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth="2" />
        <line x1="12" y1="17" x2="12.01" y2="17" stroke={color} strokeWidth="2" />
      </>
    ),
    trash: (
      <>
        <polyline points="3 6 5 6 21 6" stroke={color} strokeWidth="2" fill="none" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke={color} strokeWidth="2" fill="none" />
      </>
    ),
    star: (
      <>
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke={color} strokeWidth="2" fill="none" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill="none" />
        <polyline points="12 6 12 12 16 14" stroke={color} strokeWidth="2" fill="none" />
      </>
    ),
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {icons[name] || null}
    </svg>
  );
};

// Avatar Component
const Avatar = ({ name, size = 72, photoUrl, onClick }) => {
  const initial = name?.charAt(0)?.toUpperCase() || "?";
  const bgColors = ["#E85D3F", "#1E8E3E", "#1A73E8", "#9334E6", "#E37400"];
  const bgColor = bgColors[name?.length % bgColors.length] || ACCENT;

  return (
    <button
      onClick={onClick}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: photoUrl ? `url(${photoUrl}) center/cover` : bgColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT,
        fontSize: size * 0.4,
        fontWeight: 600,
        color: WHITE,
        flexShrink: 0,
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        border: "none",
        cursor: onClick ? "pointer" : "default",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {!photoUrl && initial}
      {onClick && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "30%",
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="edit" size={16} color={WHITE} />
        </div>
      )}
    </button>
  );
};

// Account Type Badge
const AccountTypeBadge = ({ type }) => {
  const badges = {
    event_goer: { label: "Free User", color: GRAY },
    organiser: { label: "Organiser", color: ACCENT },
    corporate: { label: "Corporate", color: "#1A73E8" },
  };
  const badge = badges[type] || badges.event_goer;

  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: badge.color,
        background: `${badge.color}15`,
        padding: "4px 10px",
        borderRadius: 999,
        fontFamily: FONT,
      }}
    >
      {badge.label}
    </span>
  );
};

// Profile Header
const ProfileHeader = ({ user, onEditPhoto, onEditProfile }) => {
  // Get first name only
  const firstName = user.firstName || user.name?.split(' ')[0] || 'User';
  // Generate username from email
  const username = user.email?.split('@')[0] || 'user';

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
        <Avatar name={user.name} photoUrl={user.photoUrl} onClick={onEditPhoto} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <h1
              style={{
                fontFamily: FONT,
                fontSize: 24,
                fontWeight: 700,
                color: BLACK,
                letterSpacing: "-0.5px",
              }}
            >
              {firstName}
            </h1>
          </div>
          <p
            style={{
              fontFamily: FONT,
              fontSize: 14,
              color: GRAY,
              marginBottom: 4,
            }}
          >
            @{username}
          </p>
          <AccountTypeBadge type={user.userType} />
        </div>
        <button
          onClick={onEditProfile}
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            border: `1.5px solid ${GRAY_LIGHT}`,
            background: WHITE,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <Icon name="edit" size={18} />
        </button>
      </div>
      <p style={{ fontSize: 14, color: GRAY, fontFamily: FONT }}>{user.email}</p>
    </div>
  );
};

// Stats Row
const StatsRow = ({ attended, upcoming, favorites, memberSince }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 12,
      marginBottom: 28,
    }}
  >
    {[
      { label: "Attended", value: attended || 0 },
      { label: "Upcoming", value: upcoming || 0 },
      { label: "Favourites", value: favorites || 0 },
      { label: "Member Since", value: memberSince || "New" },
    ].map((stat, i) => (
      <div
        key={i}
        style={{
          background: WHITE,
          borderRadius: 12,
          padding: "12px 8px",
          textAlign: "center",
          boxShadow: SHADOW_CARD,
        }}
      >
        <p
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: BLACK,
            margin: "0 0 4px 0",
            fontFamily: FONT,
          }}
        >
          {stat.value}
        </p>
        <p style={{ fontSize: 11, color: GRAY, margin: 0, fontFamily: FONT }}>
          {stat.label}
        </p>
      </div>
    ))}
  </div>
);

// My Events Tabs
const MyEventsSection = ({ events, onEventClick }) => {
  const [activeTab, setActiveTab] = useState("upcoming");

  const upcomingEvents = useMemo(
    () => events.filter((e) => new Date(e.start) > new Date()),
    [events]
  );
  const pastEvents = useMemo(
    () => events.filter((e) => new Date(e.start) <= new Date()),
    [events]
  );
  const favoriteEvents = useMemo(
    () => events.filter((e) => e.isFavorite),
    [events]
  );

  const tabs = [
    { id: "upcoming", label: "Upcoming", count: upcomingEvents.length },
    { id: "favorites", label: "Favourites", count: favoriteEvents.length },
    { id: "past", label: "Past", count: pastEvents.length },
  ];

  const displayEvents =
    activeTab === "upcoming"
      ? upcomingEvents
      : activeTab === "favorites"
      ? favoriteEvents
      : pastEvents;

  return (
    <div style={{ marginBottom: 28 }}>
      <h2
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: GRAY,
          textTransform: "uppercase",
          letterSpacing: "0.8px",
          marginBottom: 14,
          fontFamily: FONT,
        }}
      >
        My Events
      </h2>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 10,
              border: "none",
              background: activeTab === tab.id ? BLACK : GRAY_LIGHT,
              color: activeTab === tab.id ? WHITE : GRAY,
              fontSize: 13,
              fontWeight: 600,
              fontFamily: FONT,
              cursor: "pointer",
            }}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Events List */}
      {displayEvents.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {displayEvents.slice(0, 3).map((event) => (
            <button
              key={event.id}
              onClick={() => onEventClick?.(event)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: 12,
                background: WHITE,
                borderRadius: 12,
                border: "none",
                textAlign: "left",
                cursor: "pointer",
                boxShadow: SHADOW_CARD,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  background: `url(${event.img}) center/cover`,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: BLACK,
                    margin: "0 0 2px 0",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {event.title}
                </p>
                <p style={{ fontSize: 12, color: GRAY, margin: 0 }}>
                  {event.dateLabel}
                </p>
              </div>
              <Icon name="chevron" size={16} color={GRAY} />
            </button>
          ))}
        </div>
      ) : (
        <div
          style={{
            padding: 24,
            background: GRAY_LIGHT,
            borderRadius: 12,
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 14, color: GRAY, margin: 0, fontFamily: FONT }}>
            No {activeTab} events
          </p>
        </div>
      )}
    </div>
  );
};

// Menu Item
const MenuItem = ({ icon, label, value, onClick, danger }) => (
  <button
    onClick={onClick}
    style={{
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "14px 0",
      background: "transparent",
      border: "none",
      borderBottom: `1px solid ${GRAY_LIGHT}`,
      cursor: "pointer",
      textAlign: "left",
    }}
  >
    <Icon name={icon} size={20} color={danger ? "#EA4335" : GRAY} />
    <span
      style={{
        flex: 1,
        fontSize: 15,
        fontWeight: 500,
        color: danger ? "#EA4335" : BLACK,
        fontFamily: FONT,
      }}
    >
      {label}
    </span>
    {value && (
      <span style={{ fontSize: 14, color: GRAY, fontFamily: FONT }}>{value}</span>
    )}
    <Icon name="chevron" size={16} color={GRAY_MEDIUM} />
  </button>
);

// Section Title
const SectionTitle = ({ children }) => (
  <h2
    style={{
      fontSize: 12,
      fontWeight: 600,
      color: GRAY,
      textTransform: "uppercase",
      letterSpacing: "0.8px",
      marginBottom: 12,
      marginTop: 24,
      fontFamily: FONT,
    }}
  >
    {children}
  </h2>
);

// Empty State (Not Signed In)
const EmptyState = ({ onSignIn }) => (
  <div
    style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 32,
      textAlign: "center",
      minHeight: "60vh",
    }}
  >
    <div
      style={{
        width: 80,
        height: 80,
        borderRadius: 24,
        background: GRAY_LIGHT,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
      }}
    >
      <Icon name="user" size={36} color={GRAY_MEDIUM} />
    </div>
    <h2
      style={{
        fontFamily: FONT,
        fontSize: 20,
        fontWeight: 700,
        color: BLACK,
        marginBottom: 8,
      }}
    >
      Sign in to your account
    </h2>
    <p
      style={{
        fontFamily: FONT,
        fontSize: 14,
        color: GRAY,
        lineHeight: 1.6,
        marginBottom: 24,
        maxWidth: 260,
      }}
    >
      Create and manage your events, track views, and reach local audiences.
    </p>
    <button
      onClick={onSignIn}
      style={{
        background: BLACK,
        color: WHITE,
        border: "none",
        borderRadius: 24,
        padding: "14px 36px",
        fontSize: 15,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: FONT,
      }}
    >
      Sign In
    </button>
  </div>
);

// Loading State
const LoadingState = () => (
  <div
    style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 32,
      minHeight: "60vh",
    }}
  >
    <div
      style={{
        width: 36,
        height: 36,
        border: `3px solid ${GRAY_LIGHT}`,
        borderTopColor: ACCENT,
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }}
    />
    <style>{`
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

// Confirmation Modal
const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirm", danger = false }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 400,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div
        style={{
          background: WHITE,
          borderRadius: 16,
          padding: 24,
          width: "100%",
          maxWidth: 320,
          textAlign: "center",
        }}
      >
        <h3 style={{ fontSize: 18, fontWeight: 700, color: BLACK, marginBottom: 8, fontFamily: FONT }}>
          {title}
        </h3>
        <p style={{ fontSize: 14, color: GRAY, marginBottom: 24, fontFamily: FONT }}>{message}</p>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: 10,
              border: `1.5px solid ${GRAY_LIGHT}`,
              background: WHITE,
              fontSize: 15,
              fontWeight: 600,
              color: BLACK,
              cursor: "pointer",
              fontFamily: FONT,
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: 10,
              border: "none",
              background: danger ? "#EA4335" : BLACK,
              fontSize: 15,
              fontWeight: 600,
              color: WHITE,
              cursor: "pointer",
              fontFamily: FONT,
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// Main AccountScreen Component
const AccountScreen = ({
  user,
  events = [],
  onCreateEvent,
  onManageEvents,
  onEditProfile,
  onPrivacySettings,
  onNotificationPrefs,
  onSignIn,
  onSignOut,
  onEditLocation,
  loading = false,
}) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle sign out
  const handleSignOut = useCallback(async () => {
    setIsProcessing(true);
    try {
      await onSignOut();
    } finally {
      setIsProcessing(false);
      setShowLogoutConfirm(false);
    }
  }, [onSignOut]);

  // Calculate member since
  const memberSince = useMemo(() => {
    if (!user?.createdAt) return "New";
    const date = new Date(user.createdAt);
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }, [user?.createdAt]);

  // Calculate stats from events
  const attendedCount = useMemo(
    () => events.filter((e) => e.userAttended).length,
    [events]
  );
  const upcomingCount = useMemo(
    () => events.filter((e) => new Date(e.start) > new Date()).length,
    [events]
  );
  const favoritesCount = useMemo(
    () => events.filter((e) => e.isFavorite).length,
    [events]
  );

  if (loading) {
    return <LoadingState />;
  }

  if (!user) {
    return <EmptyState onSignIn={onSignIn} />;
  }

  return (
    <>
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          background: BG,
          padding: "20px 20px 120px",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* Profile Header */}
        <ProfileHeader
          user={user}
          onEditPhoto={onEditProfile}
          onEditProfile={onEditProfile}
        />

        {/* Stats */}
        <StatsRow
          attended={attendedCount}
          upcoming={upcomingCount}
          favorites={favoritesCount}
          memberSince={memberSince}
        />

        {/* My Events Section */}
        <MyEventsSection events={events} onEventClick={onManageEvents} />

        {/* Account Section */}
        <SectionTitle>Account</SectionTitle>
        <MenuItem icon="location" label="Location Settings" value={user.location || "Not set"} onClick={onEditLocation} />
        <MenuItem icon="edit" label="Profile Settings" onClick={onEditProfile} />
        <MenuItem icon="shield" label="Privacy Settings" onClick={onPrivacySettings} />
        <MenuItem icon="bell" label="Notification Preferences" onClick={onNotificationPrefs} />

        {/* Support Section */}
        <SectionTitle>Support</SectionTitle>
        <MenuItem icon="help" label="Get Help / FAQ" onClick={() => alert("FAQ coming soon! Contact support@fomoza.co.za for help.")} />
        <MenuItem icon="info" label="Report a Problem" onClick={() => alert("Report feature coming soon! Email issues to support@fomoza.co.za")} />
        <MenuItem icon="star" label="Rate the App" onClick={() => alert("Thanks for your support! Rating feature coming soon.")} />

        {/* Danger Zone */}
        <SectionTitle>Danger Zone</SectionTitle>
        <MenuItem
          icon="logout"
          label="Log Out"
          danger
          onClick={() => setShowLogoutConfirm(true)}
        />
        <MenuItem
          icon="trash"
          label="Delete Account"
          danger
          onClick={() => setShowDeleteConfirm(true)}
        />
      </div>

      {/* Logout Confirmation */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Log Out"
        message="Are you sure you want to log out?"
        confirmText={isProcessing ? "Logging out..." : "Log Out"}
        onConfirm={handleSignOut}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      {/* Delete Account Confirmation */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Account"
        message="This action cannot be undone. All your data will be permanently deleted."
        confirmText="Delete"
        danger
        onConfirm={() => {
          setShowDeleteConfirm(false);
          // TODO: Implement account deletion
          alert("Account deletion request submitted");
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
};

export default AccountScreen;
