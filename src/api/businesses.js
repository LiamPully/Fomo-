import { supabase } from '../lib/supabase'
import { safeLog } from '../lib/security'
import { validateBusinessData, validateUUID } from '../lib/validation'

// Get or create business for current user
export const getOrCreateBusiness = async (userId, businessData) => {
  try {
    // Validate user ID
    const idCheck = validateUUID(userId);
    if (!idCheck.valid) {
      return { data: null, error: { message: idCheck.error } };
    }

    // Validate business data
    const validation = validateBusinessData(businessData);
    if (!validation.valid) {
      return {
        data: null,
        error: { message: validation.errors.join('. ') }
      };
    }

    // Check if business exists
    const { data: existing, error: fetchError } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError
    }

    if (existing) {
      return { data: existing, error: null }
    }

    // Create new business
    const { data, error } = await supabase
      .from('businesses')
      .insert([{
        user_id: userId,
        ...validation.data
      }])
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    safeLog.error('Error getting/creating business:', error)
    return { data: null, error }
  }
}

// Get business for current authenticated user
export const getMyBusiness = async () => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { data: null, error: { message: 'Authentication required' } };
    }

    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    safeLog.error('Error fetching own business:', error)
    return { data: null, error }
  }
}

// Get business by ID (public profile — strips sensitive fields)
export const getBusiness = async (id) => {
  try {
    // Validate ID
    const idCheck = validateUUID(id);
    if (!idCheck.valid) {
      return { data: null, error: { message: idCheck.error } };
    }

    const { data, error } = await supabase
      .from('businesses')
      .select('id, business_name, website, instagram, event_count, created_at')
      .eq('id', id)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    safeLog.error('Error fetching business:', error)
    return { data: null, error }
  }
}

// Update business — FIX: verify caller owns the business before updating
export const updateBusiness = async (id, updates) => {
  try {
    // Validate ID
    const idCheck = validateUUID(id);
    if (!idCheck.valid) {
      return { data: null, error: { message: idCheck.error } };
    }

    // Validate updates
    if (!updates || typeof updates !== 'object') {
      return { data: null, error: { message: 'Update data is required' } };
    }

    // FIX: verify the current user owns this business
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { data: null, error: { message: 'Authentication required' } };
    }

    const { data: bizCheck, error: bizError } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (bizError) {
      return { data: null, error: { message: 'Could not verify business ownership' } };
    }
    if (!bizCheck) {
      return { data: null, error: { message: 'Business not found or access denied' } };
    }

    // Partial validation for updates
    const sanitized = {};
    const errors = [];

    if (updates.business_name !== undefined) {
      if (typeof updates.business_name !== 'string' || updates.business_name.trim().length < 2) {
        errors.push('Business name must be at least 2 characters');
      } else {
        sanitized.business_name = updates.business_name.trim().slice(0, 255);
      }
    }

    if (updates.email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updates.email)) {
        errors.push('Invalid email format');
      } else {
        sanitized.email = updates.email.trim();
      }
    }

    if (updates.phone !== undefined) {
      sanitized.phone = String(updates.phone).replace(/\s/g, '').slice(0, 50);
    }

    if (updates.website !== undefined) {
      if (updates.website) {
        const urlRegex = /^https?:\/\/.+/;
        if (!urlRegex.test(updates.website)) {
          errors.push('Website must be a valid URL');
        } else {
          sanitized.website = updates.website.slice(0, 255);
        }
      } else {
        sanitized.website = null;
      }
    }

    if (updates.instagram !== undefined) {
      sanitized.instagram = updates.instagram
        ? String(updates.instagram).trim().slice(0, 100)
        : null;
    }

    if (errors.length > 0) {
      return { data: null, error: { message: errors.join('. ') } };
    }

    const { data, error } = await supabase
      .from('businesses')
      .update(sanitized)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    safeLog.error('Error updating business:', error)
    return { data: null, error }
  }
}

// Increment event count
// NOTE: This is now handled automatically by database triggers
// Keeping for backwards compatibility or manual adjustments
export const incrementEventCount = async (businessId) => {
  try {
    // Validate ID
    const idCheck = validateUUID(businessId);
    if (!idCheck.valid) {
      return { data: null, error: { message: idCheck.error } };
    }

    const { data: business, error: fetchError } = await supabase
      .from('businesses')
      .select('event_count')
      .eq('id', businessId)
      .single()

    if (fetchError) throw fetchError

    const { data, error } = await supabase
      .from('businesses')
      .update({ event_count: (business.event_count || 0) + 1 })
      .eq('id', businessId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    safeLog.error('Error incrementing event count:', error)
    return { data: null, error }
  }
}

// Check if business can publish more events
export const canPublishEvent = async (businessId) => {
  try {
    // Validate ID
    const idCheck = validateUUID(businessId);
    if (!idCheck.valid) {
      return { data: null, error: { message: idCheck.error } };
    }

    const { data, error } = await supabase
      .from('businesses')
      .select('subscription_status, event_count')
      .eq('id', businessId)
      .single()

    if (error) throw error

    // Paid users get 5 events, free users get 1 (freemium model)
    const limit = data.subscription_status === 'active' ? 5 : 1
    const canPublish = data.event_count < limit

    return {
      data: {
        canPublish,
        currentCount: data.event_count,
        limit,
        remaining: Math.max(0, limit - data.event_count)
      },
      error: null
    }
  } catch (error) {
    safeLog.error('Error checking publish ability:', error)
    return { data: null, error }
  }
}
