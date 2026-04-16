import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const FONT = "'Sora', system-ui, sans-serif";
const GRAY1 = '#888880';
const GRAY2 = '#E4E1DA';
const GRAY3 = '#F7F5F1';
const BLACK = '#111111';
const ORANGE = '#E8783A';
const WHITE = '#FFFFFF';

/**
 * EditProfileModal - Allow users to edit their business profile
 */

const EditProfileModal = ({ open, onClose, user, onProfileUpdated }) => {
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef(null);

  // Load current business name when modal opens
  useEffect(() => {
    if (open && user) {
      setBusinessName(user.name || '');
      setError(null);
      setSuccess(false);
      // Focus input after modal opens
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open, user]);

  const validateBusinessName = (name) => {
    if (!name || name.trim().length < 2) {
      return 'Business name must be at least 2 characters';
    }
    if (name.length > 100) {
      return 'Business name must be less than 100 characters';
    }
    return null;
  };

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const validationError = validateBusinessName(businessName);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!user?.id) {
      setError('User not found');
      return;
    }

    setLoading(true);
    try {
      // Update the business record
      const { data, error: updateError } = await supabase
        .from('businesses')
        .update({
          business_name: businessName.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Failed to update business:', updateError);
        setError('Failed to update profile. Please try again.');
        return;
      }

      // Also update user metadata
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { business_name: businessName.trim() }
      });

      if (metadataError) {
        console.error('Failed to update user metadata:', metadataError);
      }

      setSuccess(true);
      onProfileUpdated?.(data);

      // Close modal after short delay
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err) {
      console.error('Exception updating profile:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [businessName, user, onClose, onProfileUpdated]);

  const handleClose = useCallback(() => {
    setError(null);
    setSuccess(false);
    onClose();
  }, [onClose]);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>

      <div
        style={{
          background: WHITE,
          borderRadius: '22px 22px 0 0',
          padding: '28px 20px 44px',
          animation: 'slideUp 0.3s ease',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
      >
        <h2 style={{
          fontFamily: FONT,
          fontSize: 22,
          fontWeight: 800,
          color: BLACK,
          marginBottom: 6,
        }}>
          Edit Profile
        </h2>
        <p style={{
          fontFamily: FONT,
          fontSize: 14,
          color: GRAY1,
          marginBottom: 24,
        }}>
          Update your business name and profile information.
        </p>

        {error && (
          <div style={{
            background: '#FEE2E2',
            border: '1px solid #FECACA',
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 16,
          }}>
            <p style={{
              fontFamily: FONT,
              fontSize: 13,
              color: '#DC2626',
              margin: 0,
            }}>
              {error}
            </p>
          </div>
        )}

        {success && (
          <div style={{
            background: '#D1FAE5',
            border: '1px solid #86EFAC',
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 16,
          }}>
            <p style={{
              fontFamily: FONT,
              fontSize: 13,
              color: '#059669',
              margin: 0,
            }}>
              Profile updated successfully!
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label style={{
            display: 'block',
            fontFamily: FONT,
            fontSize: 13,
            fontWeight: 600,
            color: GRAY1,
            marginBottom: 8,
          }}>
            Business Name
          </label>
          <input
            ref={inputRef}
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Enter your business name"
            disabled={loading}
            style={{
              width: '100%',
              border: `1.5px solid ${error ? ORANGE : GRAY2}`,
              borderRadius: 14,
              padding: '13px 15px',
              fontSize: 15,
              marginBottom: 20,
              outline: 'none',
              background: GRAY3,
              fontFamily: FONT,
              boxSizing: 'border-box',
              WebkitAppearance: 'none',
              opacity: loading ? 0.7 : 1,
            }}
            onFocus={(e) => { e.target.style.borderColor = BLACK; }}
            onBlur={(e) => { e.target.style.borderColor = error ? ORANGE : GRAY2; }}
          />

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              style={{
                flex: 1,
                background: GRAY3,
                color: BLACK,
                border: 'none',
                borderRadius: 999,
                padding: 15,
                fontSize: 15,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: FONT,
                opacity: loading ? 0.7 : 1,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || success}
              style={{
                flex: 1,
                background: BLACK,
                color: WHITE,
                border: 'none',
                borderRadius: 999,
                padding: 15,
                fontSize: 15,
                fontWeight: 700,
                cursor: loading || success ? 'not-allowed' : 'pointer',
                fontFamily: FONT,
                opacity: loading || success ? 0.7 : 1,
              }}
            >
              {loading ? 'Saving...' : success ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
