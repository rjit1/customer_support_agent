const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const SCHEMA_SQL = `
-- Gurtoy AI Customer Support Database Schema

-- Users Table
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

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Chats Table
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

-- Indexes for chats table
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_created_at ON chats(created_at);
CREATE INDEX IF NOT EXISTS idx_chats_role ON chats(role);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update trigger to users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Additional composite indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chats_user_created 
    ON chats(user_id, created_at DESC);
`

async function setupDatabase() {
  console.log('🚀 Setting up Gurtoy AI Chat database...')
  
  try {
    console.log('📊 Creating tables and indexes...')
    
    const { error } = await supabase.rpc('exec_sql', { 
      sql: SCHEMA_SQL 
    })
    
    if (error) {
      // If the RPC doesn't exist, fall back to individual queries
      console.log('⚡ Using fallback method...')
      
      // Split the SQL into individual statements
      const statements = SCHEMA_SQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0)
      
      for (const statement of statements) {
        if (statement.includes('CREATE') || statement.includes('DROP')) {
          console.log(`Executing: ${statement.substring(0, 50)}...`)
          
          const { error: stmtError } = await supabase.rpc('query', {
            query: statement
          })
          
          if (stmtError) {
            console.warn(`⚠️ Statement warning:`, stmtError.message)
            // Continue with other statements
          }
        }
      }
    }
    
    console.log('✅ Database schema setup complete!')
    
    // Test the connection by creating a test user
    console.log('🧪 Testing database connection...')
    
    const testUser = {
      id: '550e8400-e29b-41d4-a716-446655440000', // Fixed UUID for testing
      name: 'Test User',
      email: 'test@example.com',
      preferred_language: 'en'
    }
    
    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .upsert(testUser, { onConflict: 'id' })
      .select()
    
    if (insertError) {
      console.error('❌ Database test failed:', insertError.message)
      return false
    }
    
    console.log('✅ Database test successful!')
    
    // Clean up test user
    await supabase
      .from('users')
      .delete()
      .eq('id', testUser.id)
    
    console.log('🎉 Database setup completed successfully!')
    return true
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message)
    return false
  }
}

// Run the setup
setupDatabase()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  })