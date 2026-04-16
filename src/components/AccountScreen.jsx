import { useState, useCallback } from 'react';
import '../styles/design-system.css';

const FONT = "'Sora', system-ui, sans-serif";
const GRAY1 = '#888880';
const GRAY2 = '#E4E1DA';
const GRAY3 = '#F7F5F1';
const BLACK = '#111111';
const ORANGE = '#E8783A';
const WHITE = '#FFFFFF';

/**
 * AccountScreen - Premium account management interface
 * Modern, card-based layout with smooth interactions
 */

// Icon Components
const I = ({ s = 20, c = "currentColor", children }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

const icons = {
  plus: <I><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></I>,
  evtab: <I><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></I>,
  edit: <I><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></I>,
  card: <I><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></I>,
  bell: <I><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></I>,
  info: <I><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></I>,
  chevron: <I><polyline points="9 18 15 12 9 6"/></I>,
  logout: <I><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></I>,
  user: <I><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></I>,
  eye: <I><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></I>,
  calendar: <I><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></I>,
};

const Icon = ({ name, s = 20, c = BLACK }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: s, height: s, color: c }}>
    {icons[name] || null}
  </span>
);

// Avatar Component with fallback
const Avatar = ({ name, size = 56 }) => {
  const initial = name?.charAt(0)?.toUpperCase() || '?';
  const bgColors = ['#E8783A', '#059669', '#2563EB', '#7C3AED', '#DC2626'];
  const bgColor = bgColors[name?.length % bgColors.length] || ORANGE;

  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: bgColor,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: FONT,
      fontSize: size * 0.4,
      fontWeight: 700,
      color: WHITE,
      flexShrink: 0,
    }}>
      {initial}
    </div>
  );
};

// Profile Header Section
const ProfileHeader = ({ user, onEdit }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
    animation: 'slideUp 0.3s ease backwards',
  }}>
    <Avatar name={user.name} size={64} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <h1 style={{
        fontFamily: FONT,
        fontSize: 24,
        fontWeight: 800,
        color: BLACK,
        marginBottom: 4,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {user.name}
      </h1>
      <p style={{
        fontFamily: FONT,
        fontSize: 14,
        color: GRAY1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {user.email}
      </p>
    </div>
    <button
      onClick={onEdit}
      style={{
        width: 44,
        height: 44,
        borderRadius: 14,
        border: `1.5px solid ${GRAY2}`,
        background: WHITE,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = GRAY3;
        e.currentTarget.style.borderColor = GRAY1;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = WHITE;
        e.currentTarget.style.borderColor = GRAY2;
      }}
    >
      <Icon name="edit" s={18} />
    </button>
  </div>
);

// Stats Card
const StatsCard = ({ label, value, icon, delay = 0 }) => (
  <div style={{
    background: WHITE,
    borderRadius: 16,
    padding: '18px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
    animation: 'slideUp 0.3s ease backwards',
    animationDelay: `${delay}s`,
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  }}>
    <div style={{
      width: 36,
      height: 36,
      borderRadius: 10,
      background: GRAY3,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Icon name={icon} s={18} />
    </div>
    <div>
      <p style={{
        fontFamily: FONT,
        fontSize: 22,
        fontWeight: 800,
        color: BLACK,
        marginBottom: 2,
      }}>
        {value}
      </p>
      <p style={{
        fontFamily: FONT,
        fontSize: 12,
        color: GRAY1,
        fontWeight: 500,
      }}>
        {label}
      </p>
    </div>
  </div>
);

// Stats Row
const StatsRow = ({ events, views, status }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    marginBottom: 28,
  }}>
    <StatsCard label="Events Published" value={events || 0} icon="calendar" delay={0.05} />
    <StatsCard label="Total Views" value={views || '0'} icon="eye" delay={0.1} />
  </div>
);

// Action Card
const ActionCard = ({ icon, label, sub, badge, variant = 'default', onClick, delay = 0 }) => {
  const [isPressed, setIsPressed] = useState(false);

  const isPrimary = variant === 'primary';

  return (
    <button
      onClick={onClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '16px',
        background: isPrimary ? BLACK : WHITE,
        borderRadius: 16,
        border: isPrimary ? 'none' : '1.5px solid transparent',
        cursor: 'pointer',
        marginBottom: 10,
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        transform: isPressed ? 'scale(0.98)' : 'scale(1)',
        animation: 'slideUp 0.3s ease backwards',
        animationDelay: `${delay}s`,
      }}
    >
      <div style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        background: isPrimary ? 'rgba(255,255,255,0.15)' : GRAY3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon name={icon} s={20} c={isPrimary ? WHITE : BLACK} />
      </div>
      <div style={{ flex: 1, textAlign: 'left' }}>
        <p style={{
          fontFamily: FONT,
          fontSize: 15,
          fontWeight: 700,
          color: isPrimary ? WHITE : BLACK,
          marginBottom: 2,
        }}>
          {label}
        </p>
        {sub && (
          <p style={{
            fontFamily: FONT,
            fontSize: 12,
            color: isPrimary ? 'rgba(255,255,255,0.7)' : GRAY1,
          }}>
            {sub}
          </p>
        )}
      </div>
      {badge && (
        <span style={{
          background: isPrimary ? ORANGE : `${ORANGE}22`,
          color: isPrimary ? WHITE : ORANGE,
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 700,
          padding: '4px 10px',
          fontFamily: FONT,
          flexShrink: 0,
        }}>
          {badge}
        </span>
      )}
      <Icon name="chevron" s={16} c={isPrimary ? 'rgba(255,255,255,0.6)' : GRAY1} />
    </button>
  );
};

// Section Title
const SectionTitle = ({ children }) => (
  <h2 style={{
    fontFamily: FONT,
    fontSize: 13,
    fontWeight: 700,
    color: GRAY1,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: 12,
    marginTop: 8,
  }}>
    {children}
  </h2>
);

// Menu Item
const MenuItem = ({ icon, label, value, onClick, delay = 0 }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '15px 16px',
        background: isHovered ? GRAY3 : WHITE,
        borderRadius: 14,
        border: 'none',
        cursor: 'pointer',
        marginBottom: 8,
        transition: 'background 0.15s ease',
        animation: 'slideUp 0.3s ease backwards',
        animationDelay: `${delay}s`,
      }}
    >
      <div style={{
        width: 38,
        height: 38,
        borderRadius: 10,
        background: GRAY3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon name={icon} s={18} />
      </div>
      <span style={{
        fontFamily: FONT,
        fontSize: 15,
        fontWeight: 600,
        color: BLACK,
        flex: 1,
        textAlign: 'left',
      }}>
        {label}
      </span>
      {value && (
        <span style={{
          fontFamily: FONT,
          fontSize: 13,
          color: GRAY1,
          fontWeight: 500,
        }}>
          {value}
        </span>
      )}
      <Icon name="chevron" s={16} c={GRAY1} />
    </button>
  );
};

// Empty State
const EmptyState = ({ onSignIn }) => (
  <div style={{
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    textAlign: 'center',
  }}>
    <div style={{
      width: 80,
      height: 80,
      borderRadius: 24,
      background: GRAY3,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    }}>
      <Icon name="user" s={36} c={GRAY1} />
    </div>
    <h2 style={{
      fontFamily: FONT,
      fontSize: 20,
      fontWeight: 800,
      color: BLACK,
      marginBottom: 8,
    }}>
      Sign in to your account
    </h2>
    <p style={{
      fontFamily: FONT,
      fontSize: 14,
      color: GRAY1,
      lineHeight: 1.6,
      marginBottom: 24,
      maxWidth: 260,
    }}>
      Create and manage your events, track views, and reach local audiences.
    </p>
    <button
      onClick={onSignIn}
      style={{
        background: BLACK,
        color: WHITE,
        border: 'none',
        borderRadius: 999,
        padding: '14px 36px',
        fontSize: 15,
        fontWeight: 700,
        cursor: 'pointer',
        fontFamily: FONT,
        transition: 'transform 0.15s ease',
      }}
      onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
      onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
    >
      Sign In
    </button>
  </div>
);

// Loading State
const LoadingState = () => (
  <div style={{
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  }}>
    <div style={{
      width: 40,
      height: 40,
      border: `3px solid ${GRAY2}`,
      borderTopColor: ORANGE,
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
    <style>{`
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

// Recovery State (when business profile is missing)
const RecoveryState = ({ onRetry }) => (
  <div style={{
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    textAlign: 'center',
  }}>
    <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
    <h2 style={{
      fontFamily: FONT,
      fontSize: 20,
      fontWeight: 800,
      color: BLACK,
      marginBottom: 8,
    }}>
      Setting up your profile
    </h2>
    <p style={{
      fontFamily: FONT,
      fontSize: 14,
      color: GRAY1,
      lineHeight: 1.6,
      marginBottom: 24,
      maxWidth: 280,
    }}>
      Your account was created but we're still setting up your business profile. This should only take a moment.
    </p>
    <button
      onClick={onRetry}
      style={{
        background: ORANGE,
        color: WHITE,
        border: 'none',
        borderRadius: 999,
        padding: '14px 36px',
        fontSize: 15,
        fontWeight: 700,
        cursor: 'pointer',
        fontFamily: FONT,
      }}
    >
      Try Again
    </button>
  </div>
);

// Main AccountScreen Component
const AccountScreen = ({
  user,
  events = [],
  onCreateEvent,
  onManageEvents,
  onEditProfile,
  onSignIn,
  onSignOut,
  onRefreshProfile,
  loading = false,
}) => {
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Handle sign out with confirmation
  const handleSignOut = useCallback(async () => {
    setIsSigningOut(true);
    try {
      await onSignOut();
    } finally {
      setIsSigningOut(false);
    }
  }, [onSignOut]);

  // Calculate stats
  const publishedEvents = events.filter(e => e.businessId === user?.id && e.status === 'published');
  const draftEvents = events.filter(e => e.businessId === user?.id && e.status === 'draft');
  const totalViews = publishedEvents.reduce((sum, e) => sum + (e.views || 0), 0);

  // Show appropriate state
  if (loading) {
    return <LoadingState />;
  }

  if (!user) {
    return <EmptyState onSignIn={onSignIn} />;
  }

  if (user && !user.businessLoaded) {
    return <RecoveryState onRetry={onRefreshProfile} />;
  }

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      overflowX: 'hidden',
      background: 'var(--color-bg, #F0EDE6)',
      padding: '20px 16px 100px',
      WebkitOverflowScrolling: 'touch',
    }}>
      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>

      {/* Profile Header */}
      <ProfileHeader user={user} onEdit={onEditProfile} />

      {/* Stats */}
      <StatsRow
        events={publishedEvents.length}
        views={totalViews >= 1000 ? `${(totalViews / 1000).toFixed(1)}K` : totalViews}
        status="active"
      />

      {/* Quick Actions */}
      <SectionTitle>Quick Actions</SectionTitle>
      <ActionCard
        icon="plus"
        label="Create New Event"
        sub="Publish in under 2 minutes"
        variant="primary"
        onClick={onCreateEvent}
        delay={0.15}
      />
      <ActionCard
        icon="evtab"
        label="Manage My Events"
        sub={`${publishedEvents.length} published${draftEvents.length > 0 ? `, ${draftEvents.length} drafts` : ''}`}
        badge={draftEvents.length > 0 ? `${draftEvents.length} drafts` : null}
        onClick={onManageEvents}
        delay={0.2}
      />

      {/* Settings */}
      <SectionTitle>Settings</SectionTitle>
      <MenuItem icon="edit" label="Edit Profile" onClick={onEditProfile} delay={0.25} />
      <MenuItem icon="card" label="Subscription" value="Free" delay={0.3} />
      <MenuItem icon="bell" label="Notifications" delay={0.35} />
      <MenuItem icon="info" label="Help & Support" delay={0.4} />

      {/* Sign Out */}
      <button
        onClick={handleSignOut}
        disabled={isSigningOut}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '15px 16px',
          background: 'transparent',
          border: `1.5px solid ${GRAY2}`,
          borderRadius: 14,
          cursor: isSigningOut ? 'not-allowed' : 'pointer',
          marginTop: 24,
          opacity: isSigningOut ? 0.7 : 1,
          transition: 'all 0.2s ease',
          animation: 'slideUp 0.3s ease backwards',
          animationDelay: '0.45s',
        }}
        onMouseEnter={(e) => {
          if (!isSigningOut) {
            e.currentTarget.style.borderColor = '#EF4444';
            e.currentTarget.style.background = '#FEF2F2';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = GRAY2;
          e.currentTarget.style.background = 'transparent';
        }}
      >
        <div style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: '#FEE2E2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon name="logout" s={18} c="#DC2626" />
        </div>
        <span style={{
          fontFamily: FONT,
          fontSize: 15,
          fontWeight: 600,
          color: '#DC2626',
          flex: 1,
          textAlign: 'left',
        }}>
          {isSigningOut ? 'Signing out...' : 'Sign Out'}
        </span>
      </button>
    </div>
  );
};

export default AccountScreen;