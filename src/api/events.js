import { supabase } from '../lib/supabase'
import { validateEventData, validateUUID } from '../lib/validation'
import { safeLog, sanitizeHtml } from '../lib/security'

// Fetch all published events
export const fetchEvents = async (filters = {}) => {
  try {
    let query = supabase
      .from('events')
      .select(`
        *,
        category:categories(name, color)
      `)
      .eq('status', 'published')
      .gte('end_time', new Date().toISOString())
      .order('start_time', { ascending: true })

    // Apply category filter - first get category ID
    if (filters.category && filters.category !== 'All') {
      const { data: categoryData } = await supabase
        .from('categories')
        .select('id')
        .eq('name', filters.category)
        .single()

      if (categoryData) {
        query = query.eq('category_id', categoryData.id)
      }
    }

    // Apply date filters
    if (filters.period) {
      const now = new Date()

      switch (filters.period) {
        case 'Today':
          const todayEnd = new Date(now)
          todayEnd.setHours(23, 59, 59, 999)
          query = query
            .gte('start_time', now.toISOString())
            .lte('start_time', todayEnd.toISOString())
          break

        case 'This Week':
          const weekEnd = new Date(now)
          weekEnd.setDate(weekEnd.getDate() + 7)
          query = query
            .gte('start_time', now.toISOString())
            .lte('start_time', weekEnd.toISOString())
          break

        case 'This Month':
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          query = query
            .gte('start_time', now.toISOString())
            .lte('start_time', monthEnd.toISOString())
          break
      }
    }

    // Apply location filter (sanitized)
    if (filters.area) {
      const sanitizedArea = filters.area
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_')
        .replace(/\\/g, '\\\\')
      query = query.ilike('area', `%${sanitizedArea}%`)
    }

    // Add limit for performance
    query = query.limit(100)

    const { data, error } = await query

    if (error) throw error

    return { data: data || [], error: null }
  } catch (error) {
    safeLog.error('Error fetching events:', error)
    return { data: null, error }
  }
}

// Fetch single event by ID
export const fetchEventById = async (id) => {
  try {
    // Validate ID
    const idCheck = validateUUID(id);
    if (!idCheck.valid) {
      return { data: null, error: { message: idCheck.error } };
    }

    // FIX: businesses table uses business_name, not name
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        category:categories(name, color),
        business:businesses(business_name, email, phone)
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    // Increment view count (async, fire-and-forget with error handling)
    try {
      await supabase.rpc('increment_event_view', { event_id: id })
    } catch (rpcError) {
      safeLog.warn('Failed to increment view count:', rpcError)
      // Don't fail the request if view count update fails
    }

    return { data, error: null }
  } catch (error) {
    safeLog.error('Error fetching event:', error)
    return { data: null, error }
  }
}

// Create new event
export const createEvent = async (eventData) => {
  try {
    // If business_id is missing, fetch current user's business
    let enrichedData = { ...eventData };
    if (!enrichedData.business_id) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: biz } = await supabase
          .from('businesses')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (biz) {
          enrichedData.business_id = biz.id;
        }
      }
    }

    // Validate input data
    const validation = validateEventData(enrichedData);
    if (!validation.valid) {
      return {
        data: null,
        error: { message: validation.errors.join('. ') }
      };
    }

    // Build insert data — map images array to single image_url for current schema
    const insertData = { ...validation.data };
    if (enrichedData.images && Array.isArray(enrichedData.images) && enrichedData.images.length > 0) {
      const first = enrichedData.images[0];
      insertData.image_url = typeof first === 'string' ? first : (first?.url || '');
    } else if (enrichedData.image_url) {
      insertData.image_url = enrichedData.image_url;
    }
    delete insertData.images;

    const { data, error } = await supabase
      .from('events')
      .insert([insertData])
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    safeLog.error('Error creating event:', error)
    return { data: null, error }
  }
}

// Update event — FIX: verify caller owns the event before updating
export const updateEvent = async (id, updates) => {
  try {
    // Validate ID
    const idCheck = validateUUID(id);
    if (!idCheck.valid) {
      return { data: null, error: { message: idCheck.error } };
    }

    // Validate update data (partial validation allowed)
    if (!updates || typeof updates !== 'object') {
      return { data: null, error: { message: 'Update data is required' } };
    }

    // FIX: verify the current user owns this event via their business
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { data: null, error: { message: 'Authentication required' } };
    }

    const { data: ownerCheck, error: ownerError } = await supabase
      .from('events')
      .select('id, business:businesses!inner(user_id)')
      .eq('id', id)
      .eq('business.user_id', user.id)
      .maybeSingle();

    if (ownerError) {
      return { data: null, error: { message: 'Could not verify event ownership' } };
    }
    if (!ownerCheck) {
      return { data: null, error: { message: 'Event not found or access denied' } };
    }

    // For updates, we do partial validation
    // Only validate fields that are being updated
    const sanitized = {};
    const errors = [];

    if (updates.title !== undefined) {
      if (typeof updates.title !== 'string' || updates.title.trim().length < 2) {
        errors.push('Title must be at least 2 characters');
      } else {
        sanitized.title = sanitizeHtml(updates.title.trim().slice(0, 255));
      }
    }

    if (updates.description !== undefined) {
      sanitized.description = sanitizeHtml(String(updates.description).slice(0, 5000));
    }

    if (updates.area !== undefined) {
      if (typeof updates.area !== 'string' || updates.area.trim().length < 1) {
        errors.push('Area is required');
      } else {
        sanitized.area = sanitizeHtml(updates.area.trim().slice(0, 255));
      }
    }

    if (updates.start_time !== undefined) {
      const startDate = new Date(updates.start_time);
      if (isNaN(startDate.getTime())) {
        errors.push('Invalid start time');
      } else {
        sanitized.start_time = updates.start_time;
      }
    }

    if (updates.end_time !== undefined) {
      const endDate = new Date(updates.end_time);
      if (isNaN(endDate.getTime())) {
        errors.push('Invalid end time');
      } else {
        sanitized.end_time = updates.end_time;
      }
    }

    if (updates.status !== undefined) {
      const validStatuses = ['published', 'draft', 'past', 'removed'];
      if (!validStatuses.includes(updates.status)) {
        errors.push('Invalid status');
      } else {
        sanitized.status = updates.status;
      }
    }

    if (updates.venue !== undefined) {
      sanitized.venue = String(updates.venue).trim().slice(0, 255);
    }

    if (updates.image_url !== undefined) {
      const urlRegex = /^https?:\/\/.+/;
      if (updates.image_url && !urlRegex.test(updates.image_url)) {
        errors.push('Image URL must be a valid URL');
      } else {
        sanitized.image_url = updates.image_url ? updates.image_url.slice(0, 500) : null;
      }
    }

    if (errors.length > 0) {
      return { data: null, error: { message: errors.join('. ') } };
    }

    const { data, error } = await supabase
      .from('events')
      .update(sanitized)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    safeLog.error('Error updating event:', error)
    return { data: null, error }
  }
}

// Delete event — FIX: verify caller owns the event before deleting
export const deleteEvent = async (id) => {
  try {
    // Validate ID
    const idCheck = validateUUID(id);
    if (!idCheck.valid) {
      return { error: { message: idCheck.error } };
    }

    // FIX: verify the current user owns this event via their business
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: { message: 'Authentication required' } };
    }

    const { data: ownerCheck, error: ownerError } = await supabase
      .from('events')
      .select('id, business:businesses!inner(user_id)')
      .eq('id', id)
      .eq('business.user_id', user.id)
      .maybeSingle();

    if (ownerError) {
      return { error: { message: 'Could not verify event ownership' } };
    }
    if (!ownerCheck) {
      return { error: { message: 'Event not found or access denied' } };
    }

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { error: null }
  } catch (error) {
    safeLog.error('Error deleting event:', error)
    return { error }
  }
}

// Fetch events by business — FIX: ensure caller can only fetch their own business's events
export const fetchBusinessEvents = async (businessId) => {
  try {
    // Validate ID
    const idCheck = validateUUID(businessId);
    if (!idCheck.valid) {
      return { data: null, error: { message: idCheck.error } };
    }

    // FIX: verify the current user owns this business
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { data: null, error: { message: 'Authentication required' } };
    }

    const { data: bizCheck, error: bizError } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', businessId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (bizError) {
      return { data: null, error: { message: 'Could not verify business ownership' } };
    }
    if (!bizCheck) {
      return { data: null, error: { message: 'Business not found or access denied' } };
    }

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('business_id', businessId)
      .order('start_time', { ascending: true })
      .limit(100)

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    safeLog.error('Error fetching business events:', error)
    return { data: null, error }
  }
}

// Search events by text
export const searchEvents = async (searchTerm) => {
  try {
    // Sanitize search term to prevent injection
    const sanitized = searchTerm
      .replace(/%/g, '\\%')
      .replace(/_/g, '\\_')
      .replace(/\\/g, '\\\\')
      .replace(/,/g, ' ')
      .replace(/[()]/g, ' ')

    // Use three parallel queries with individual ilike filters to avoid .or() string injection
    const [titleResult, descResult, areaResult] = await Promise.all([
      supabase.from('events').select('*').eq('status', 'published').ilike('title', `%${sanitized}%`).limit(50),
      supabase.from('events').select('*').eq('status', 'published').ilike('description', `%${sanitized}%`).limit(50),
      supabase.from('events').select('*').eq('status', 'published').ilike('area', `%${sanitized}%`).limit(50),
    ]);

    const seen = new Set();
    const merged = [];
    [titleResult, descResult, areaResult].forEach(result => {
      if (result.data) {
        result.data.forEach(event => {
          if (!seen.has(event.id)) {
            seen.add(event.id);
            merged.push(event);
          }
        });
      }
    });

    merged.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

    return { data: merged.slice(0, 50), error: null };
  } catch (error) {
    safeLog.error('Error searching events:', error)
    return { data: null, error }
  }
}

// ============================================================
// SAVED EVENTS API
// ============================================================

// Toggle save state for an event (saves if not saved, unsaves if already saved)
export const toggleSaveEvent = async (eventId) => {
  try {
    const idCheck = validateUUID(eventId);
    if (!idCheck.valid) {
      return { data: null, error: { message: idCheck.error } };
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { data: null, error: { message: 'Authentication required' } };
    }

    // Check if already saved
    const { data: existing } = await supabase
      .from('saved_events')
      .select('id')
      .eq('user_id', user.id)
      .eq('event_id', eventId)
      .maybeSingle();

    if (existing) {
      // Unsave
      const { error } = await supabase
        .from('saved_events')
        .delete()
        .eq('user_id', user.id)
        .eq('event_id', eventId);

      if (error) throw error;
      return { data: { saved: false }, error: null };
    } else {
      // Save
      const { error } = await supabase
        .from('saved_events')
        .insert([{ user_id: user.id, event_id: eventId }]);

      if (error) throw error;
      return { data: { saved: true }, error: null };
    }
  } catch (error) {
    safeLog.error('Error toggling save:', error)
    return { data: null, error }
  }
}

// Fetch all events saved by the current user
export const fetchSavedEvents = async () => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { data: null, error: { message: 'Authentication required' } };
    }

    const { data, error } = await supabase
      .from('saved_events')
      .select(`
        id,
        created_at,
        event:events(
          *,
          category:categories(name, color)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Flatten: return just the event objects
    const events = (data || [])
      .map(row => row.event)
      .filter(Boolean);

    return { data: events, error: null };
  } catch (error) {
    safeLog.error('Error fetching saved events:', error)
    return { data: null, error }
  }
}

// Check if a specific event is saved by the current user
export const isEventSaved = async (eventId) => {
  try {
    const idCheck = validateUUID(eventId);
    if (!idCheck.valid) {
      return { data: false, error: null };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: false, error: null };

    const { data } = await supabase
      .from('saved_events')
      .select('id')
      .eq('user_id', user.id)
      .eq('event_id', eventId)
      .maybeSingle();

    return { data: !!data, error: null };
  } catch (error) {
    safeLog.error('Error checking saved state:', error)
    return { data: false, error }
  }
}

// ============================================================
// CATEGORIES API
// ============================================================

// Fetch all categories
export const fetchCategories = async () => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, color')
      .order('name', { ascending: true });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    safeLog.error('Error fetching categories:', error)
    return { data: null, error }
  }
}
