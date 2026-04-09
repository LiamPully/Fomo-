import { supabase } from '../lib/supabase'
import { validateEventData, validateUUID } from '../lib/validation'

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
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching events:', error)
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
      console.warn('Failed to increment view count:', rpcError)
      // Don't fail the request if view count update fails
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error fetching event:', error)
    return { data: null, error }
  }
}

// Create new event
export const createEvent = async (eventData) => {
  try {
    // Validate input data
    const validation = validateEventData(eventData);
    if (!validation.valid) {
      return {
        data: null,
        error: { message: validation.errors.join('. ') }
      };
    }

    // Prepare data for insert, including images
    const insertData = {
      ...validation.data,
      images: eventData.images || [],
    };

    const { data, error } = await supabase
      .from('events')
      .insert([insertData])
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error creating event:', error)
    return { data: null, error }
  }
}

// Update event
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

    // For updates, we do partial validation
    // Only validate fields that are being updated
    const sanitized = {};
    const errors = [];

    if (updates.title !== undefined) {
      if (typeof updates.title !== 'string' || updates.title.trim().length < 2) {
        errors.push('Title must be at least 2 characters');
      } else {
        sanitized.title = updates.title.trim().slice(0, 255);
      }
    }

    if (updates.description !== undefined) {
      sanitized.description = String(updates.description).slice(0, 5000);
    }

    if (updates.area !== undefined) {
      if (typeof updates.area !== 'string' || updates.area.trim().length < 1) {
        errors.push('Area is required');
      } else {
        sanitized.area = updates.area.trim().slice(0, 255);
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
    console.error('Error updating event:', error)
    return { data: null, error }
  }
}

// Delete event
export const deleteEvent = async (id) => {
  try {
    // Validate ID
    const idCheck = validateUUID(id);
    if (!idCheck.valid) {
      return { error: { message: idCheck.error } };
    }

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('Error deleting event:', error)
    return { error }
  }
}

// Fetch events by business
export const fetchBusinessEvents = async (businessId) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('business_id', businessId)
      .order('start_time', { ascending: true })
      .limit(100)

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error fetching business events:', error)
    return { data: null, error }
  }
}

// Search events by text
export const searchEvents = async (searchTerm) => {
  try {
    // Sanitize search term to prevent SQL injection
    const sanitized = searchTerm
      .replace(/%/g, '\\%')
      .replace(/_/g, '\\_')
      .replace(/\\/g, '\\\\')

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'published')
      .or(`title.ilike.%${sanitized}%,description.ilike.%${sanitized}%,area.ilike.%${sanitized}%`)
      .order('start_time', { ascending: true })
      .limit(50)

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error searching events:', error)
    return { data: null, error }
  }
}
