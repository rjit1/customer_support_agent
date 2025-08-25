const { createClient } = require('@supabase/supabase-js')

// Load environment variables from .env.local
const fs = require('fs')
const path = require('path')

const envPath = path.join(__dirname, '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')

const envVars = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#][^=]*?)=(.*)$/)
  if (match) {
    envVars[match[1].trim()] = match[2].trim()
  }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

console.log('🔗 Connecting to Supabase:', supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupDatabase() {
  console.log('🚀 Creating database tables...')
  
  try {
    // Create users table
    console.log('📋 Creating users table...')
    let { error: usersError } = await supabase.rpc('query', {
      query: `
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT UNIQUE,
          name TEXT NOT NULL,
          preferred_language TEXT DEFAULT 'en',
          avatar_url TEXT,
          phone TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          metadata JSONB DEFAULT '{}'::jsonb
        );
        
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
      `
    })

    if (usersError) {
      console.log('⚠️ Users table might already exist:', usersError.message)
    }

    // Create chats table
    console.log('💬 Creating chats table...')
    let { error: chatsError } = await supabase.rpc('query', {
      query: `
        CREATE TABLE IF NOT EXISTS chats (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          message TEXT NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
          tokens_used INTEGER DEFAULT 0,
          response_time_ms INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          metadata JSONB DEFAULT '{}'::jsonb
        );
        
        CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);
        CREATE INDEX IF NOT EXISTS idx_chats_created_at ON chats(created_at);
        CREATE INDEX IF NOT EXISTS idx_chats_role ON chats(role);
      `
    })

    if (chatsError) {
      console.log('⚠️ Chats table might already exist:', chatsError.message)
    }

    console.log('✅ Tables created successfully!')

    // Test the tables by inserting a test user
    console.log('🧪 Testing database...')
    
    const { data: testUser, error: testError } = await supabase
      .from('users')
      .insert({
        name: 'Database Test User',
        email: 'dbtest@example.com'
      })
      .select()
      .single()

    if (testError) {
      throw new Error(`Database test failed: ${testError.message}`)
    }

    console.log('✅ Database test passed! User created:', testUser.id)
    
    // Clean up test user
    await supabase
      .from('users')
      .delete()
      .eq('id', testUser.id)

    console.log('🎉 Database setup completed successfully!')
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    process.exit(1)
  }
}

setupDatabase()