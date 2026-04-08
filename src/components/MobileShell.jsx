import { useState, useEffect, useRef } from 'react';
import '../styles/design-system-v2.css';

/**
 * MobileShell — Premium mobile app container
 * Provides native app feel with gesture support and smooth transitions
 */

const MobileShell = ({ children, currentTab, onTabChange, user }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const contentRef = useRef(null);

  // Track scroll for header blur effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(contentRef.current?.scrollTop > 20);
    };

    const content = contentRef.current;
    if (content) {
      content.addEventListener('scroll', handleScroll, { passive: true });
      return () => content.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Prevent bounce on iOS
  useEffect(() => {
    const preventBounce = (e) => {
      const element = e.target;
      if (element.scrollHeight <= element.clientHeight) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchmove', preventBounce, { passive: false });
    return () => document.removeEventListener('touchmove', preventBounce);
  }, []);

  const tabs = [
    { id: 'events', label: 'Explore', icon: CompassIcon },
    { id: 'hub', label: user ? 'Profile' : 'Sign In', icon: user ? ProfileIcon : SignInIcon },
    { id: 'about', label: 'About', icon: InfoIcon },
  ];

  return (
    <div className="app-container-v2">
      {/* Status bar background for iOS */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 'env(safe-area-inset-top)',
          background: isScrolled ? 'rgba(247, 243, 238, 0.95)' : 'transparent',
          backdropFilter: isScrolled ? 'blur(20px)' : 'none',
          zIndex: 1000,
          transition: 'all 0.3s ease',
        }}
      />

      {/* Main content area */}
      <div
        ref={contentRef}
        style={{
          flex: 1,
          overflow: 'auto',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: 'calc(80px + env(safe-area-inset-bottom))',
        }}
      >
        {children}
      </div>

      {/* Bottom Navigation */}
      <nav className="bottom-nav-v2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`}
            >
              <Icon
                style={{
                  width: 24,
                  height: 24,
                  strokeWidth: isActive ? 2.5 : 2,
                  transition: 'all 0.2s ease',
                }}
              />
              <span style={{ marginTop: 4 }}>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

// Icon Components
const CompassIcon = ({ style }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={style}>
    <circle cx="12" cy="12" r="10" strokeWidth="2" />
    <path
      d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ProfileIcon = ({ style }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={style}>
    <path
      d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle cx="12" cy="7" r="4" strokeWidth="2" />
  </svg>
);

const SignInIcon = ({ style }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={style}>
    <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" strokeWidth="2" strokeLinecap="round" />
    <path d="M11 16l-4-4m0 0l4-4m-4 4h14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const InfoIcon = ({ style }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={style}>
    <circle cx="12" cy="12" r="10" strokeWidth="2" />
    <path d="M12 16v-4" strokeWidth="2" strokeLinecap="round" />
    <path d="M12 8h.01" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export default MobileShell;
