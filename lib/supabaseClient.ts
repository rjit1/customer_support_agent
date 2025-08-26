import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Service role client for server-side operations with connection pooling
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  db: {
    schema: 'public'
  },
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  realtime: {
    params: {
      eventsPerSecond: -1
    }
  },
  global: {
    headers: {
      'x-connection-pool': 'enabled'
    }
  }
})

// Database types
export interface User {
  id: string
  email?: string
  name?: string
  preferred_language?: string
  created_at: string
}

export interface Chat {
  id: string
  user_id: string
  message: string
  role: 'user' | 'assistant'
  created_at: string
}

// Helper functions for user management (use admin client for server-side operations)
export async function createUser(userData: Partial<User>): Promise<User | null> {
  try {
    console.log('Creating user with data:', userData)
    
    // If an ID is provided, validate it's a UUID format
    if (userData.id) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(userData.id)) {
        console.error('Invalid UUID format for user ID:', userData.id)
        return null
      }
    }
    
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert([userData])
      .select()
      .single()

    if (error) {
      console.error('Error creating user:', error)
      return null
    }

    console.log('User created successfully:', data)
    return data
  } catch (error) {
    console.error('Error creating user:', error)
    return null
  }
}

export async function getUserById(userId: string): Promise<User | null> {
  try {
    console.log('Fetching user by ID:', userId)
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId)) {
      console.error('Invalid UUID format for user ID:', userId)
      return null
    }
    
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user:', error)
      return null
    }

    console.log('User fetched successfully:', data)
    return data
  } catch (error) {
    console.error('Error fetching user:', error)
    return null
  }
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
  try {
    console.log('Updating user:', userId, 'with:', updates)
    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user:', error)
      return null
    }

    console.log('User updated successfully:', data)
    return data
  } catch (error) {
    console.error('Error updating user:', error)
    return null
  }
}