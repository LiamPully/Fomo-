import { supabase } from '../lib/supabase'
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
      .single()

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
    console.error('Error getting/creating business:', error)
    return { data: null, error }
  }
}

// Get business by ID
export const getBusiness = async (id) => {
  try {
    // Validate ID
    const idCheck = validateUUID(id);
    if (!idCheck.valid) {
      return { data: null, error: { message: idCheck.error } };
    }

    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching business:', error)
    return { data: null, error }
  }
}

// Update business
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

    // Partial validation for updates
    const sanitized = {};
    const errors = [];

    if (updates.name !== undefined) {
      if (typeof updates.name !== 'string' || updates.name.trim().length < 2) {
        errors.push('Business name must be at least 2 characters');
      } else {
        sanitized.name = updates.name.trim().slice(0, 255);
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
      const urlRegex = /^https?:\/\/.+/;
      if (!urlRegex.test(updates.website)) {
        errors.push('Website must be a valid URL');
      } else {
        sanitized.website = updates.website.slice(0, 255);
      }
    }

    if (updates.instagram !== undefined) {
      sanitized.instagram = String(updates.instagram).trim().slice(0, 100);
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
    console.error('Error updating business:', error)
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
    console.error('Error incrementing event count:', error)
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
    console.error('Error checking publish ability:', error)
    return { data: null, error }
  }
}
