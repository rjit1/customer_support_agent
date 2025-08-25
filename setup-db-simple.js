const { createClient } = require('@supabase/supabase-js')

// Manual environment loading
const fs = require('fs')
const path = require('path')

console.log('📁 Loading environment variables...')
const envPath = path.join(__dirname, '.env.local')

if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local file not found')
  process.exit(1)
}

const envContent = fs.readFileSync(envPath, 'utf8')
const envVars = {}

envContent.split('\n').forEach(line => {
  const trimmed = line.trim()
  if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
    const [key, ...valueParts] = trimmed.split('=')
    envVars[key.trim()] = valueParts.join('=').trim()
  }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY

console.log('🔑 Supabase URL:', supabaseUrl ? '✅' : '❌')
console.log('🔑 Service Key:', supabaseServiceKey ? '✅' : '❌')

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function testConnection() {
  console.log('\n🔍 Testing Supabase connection...')
  
  try {
    // Try to access any table to test connection
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1)
    
    // If the table doesn't exist, that's fine - connection works
    if (error && error.code !== '42P01') {
      console.error('❌ Connection test failed:', error.message)
      return false
    }
    
    console.log('✅ Supabase connection successful!')
    return true
  } catch (error) {
    console.error('❌ Connection error:', error.message)
    return false
  }
}

async function createTables() {
  console.log('\n📊 Creating database tables...')
  
  try {
    // Check if users table exists
    console.log('🔍 Checking users table...')
    const { data: usersCheck, error: usersCheckError } = await supabase
      .from('users')
      .select('id')
      .limit(1)
    
    if (usersCheckError && usersCheckError.code === '42P01') {
      console.log('📋 Users table doesn\'t exist, need manual creation')
      console.log('⚠️ Please run the following SQL in your Supabase dashboard:')
      console.log(`
-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  name TEXT NOT NULL,
  preferred_language TEXT DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chats table  
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_chats_user_id ON chats(user_id);
CREATE INDEX idx_chats_created_at ON chats(created_at);
      `)
      return false
    } else if (usersCheckError) {
      console.error('❌ Error checking users table:', usersCheckError.message)
      return false
    }
    
    console.log('✅ Users table exists!')
    
    // Check chats table
    console.log('🔍 Checking chats table...')
    const { data: chatsCheck, error: chatsCheckError } = await supabase
      .from('chats')
      .select('id')
      .limit(1)
    
    if (chatsCheckError && chatsCheckError.code === '42P01') {
      console.log('💬 Chats table doesn\'t exist, creating manually...')
      // Table doesn't exist but users does, so we can try to create it
      return false
    } else if (chatsCheckError) {
      console.error('❌ Error checking chats table:', chatsCheckError.message)
      return false
    }
    
    console.log('✅ Chats table exists!')
    return true
    
  } catch (error) {
    console.error('❌ Error creating tables:', error.message)
    return false
  }
}

async function testDatabase() {
  console.log('\n🧪 Testing database operations...')
  
  try {
    // Test inserting a user
    const { data: testUser, error: insertError } = await supabase
      .from('users')
      .insert({
        name: 'Test User ' + Date.now(),
        email: `test${Date.now()}@example.com`
      })
      .select()
      .single()
    
    if (insertError) {
      console.error('❌ Failed to insert test user:', insertError.message)
      return false
    }
    
    console.log('✅ Test user created:', testUser.name)
    
    // Test inserting a chat message
    const { data: testChat, error: chatError } = await supabase
      .from('chats')
      .insert({
        user_id: testUser.id,
        message: 'Hello, this is a test message!',
        role: 'user'
      })
      .select()
      .single()
    
    if (chatError) {
      console.error('❌ Failed to insert test chat:', chatError.message)
      return false
    }
    
    console.log('✅ Test chat created:', testChat.message)
    
    // Clean up test data
    await supabase.from('chats').delete().eq('id', testChat.id)
    await supabase.from('users').delete().eq('id', testUser.id)
    
    console.log('✅ Test data cleaned up')
    return true
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message)
    return false
  }
}

async function main() {
  console.log('🚀 Gurtoy AI Database Setup\n')
  
  const connectionOk = await testConnection()
  if (!connectionOk) {
    console.error('❌ Cannot proceed without Supabase connection')
    process.exit(1)
  }
  
  const tablesOk = await createTables()
  if (!tablesOk) {
    console.error('❌ Please create tables manually using the SQL provided above')
    process.exit(1)
  }
  
  const testOk = await testDatabase()
  if (!testOk) {
    console.error('❌ Database tests failed')
    process.exit(1)
  }
  
  console.log('\n🎉 Database setup completed successfully!')
  console.log('✅ Your Gurtoy AI Chat system is ready to use!')
}

main().catch(error => {
  console.error('❌ Unexpected error:', error)
  process.exit(1)
})