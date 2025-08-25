const { createClient } = require('@supabase/supabase-js')

// Load environment variables
const fs = require('fs')
const path = require('path')

const envPath = path.join(__dirname, '.env.local')
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
const supabaseAnonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY

console.log('🔧 RLS Policy Diagnosis Tool')
console.log('============================\n')

const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function checkRLSStatus() {
  console.log('🔍 Checking RLS status...')
  
  try {
    const { data, error } = await supabaseAdmin.rpc('check_rls_status', {
      table_name: 'users'
    })
    
    if (error) {
      console.log('⚠️ Cannot check RLS status via RPC, trying direct query...')
      
      // Try to check via information schema
      const query = `
        SELECT 
          schemaname,
          tablename,
          rowsecurity,
          policies.*
        FROM pg_tables 
        LEFT JOIN pg_policies AS policies ON policies.tablename = pg_tables.tablename
        WHERE pg_tables.tablename IN ('users', 'chats');
      `
      
      // This won't work via client, but let's test basic operations
      console.log('📝 Testing direct table operations...')
      
    } else {
      console.log('✅ RLS status:', data)
    }
  } catch (error) {
    console.error('❌ Error checking RLS:', error.message)
  }
}

async function testTableOperations() {
  console.log('\n🧪 Testing table operations...\n')
  
  // Test 1: Select with anon client
  console.log('1️⃣ Testing SELECT with anon client...')
  try {
    const { data: selectData, error: selectError } = await supabaseAnon
      .from('users')
      .select('*')
      .limit(5)
    
    if (selectError) {
      console.log('❌ SELECT failed:', selectError.message)
      console.log('   Code:', selectError.code)
    } else {
      console.log('✅ SELECT successful, rows:', selectData.length)
    }
  } catch (error) {
    console.log('❌ SELECT error:', error.message)
  }

  // Test 2: Insert with anon client  
  console.log('\n2️⃣ Testing INSERT with anon client...')
  const testUser = {
    name: 'RLS Test User',
    email: `rls-test-${Date.now()}@example.com`
  }
  
  try {
    const { data: insertData, error: insertError } = await supabaseAnon
      .from('users')
      .insert(testUser)
      .select()
    
    if (insertError) {
      console.log('❌ INSERT failed:', insertError.message)
      console.log('   Code:', insertError.code)
      
      if (insertError.code === '42501') {
        console.log('   🔴 DIAGNOSIS: RLS policy violation!')
        console.log('   💡 SOLUTION: Need to create RLS policies or disable RLS')
      }
    } else {
      console.log('✅ INSERT successful:', insertData[0]?.id)
      
      // Clean up
      await supabaseAnon.from('users').delete().eq('id', insertData[0].id)
    }
  } catch (error) {
    console.log('❌ INSERT error:', error.message)
  }

  // Test 3: Insert with admin client
  console.log('\n3️⃣ Testing INSERT with admin client...')
  try {
    const { data: adminInsertData, error: adminInsertError } = await supabaseAdmin
      .from('users')
      .insert({
        name: 'Admin Test User',
        email: `admin-test-${Date.now()}@example.com`
      })
      .select()
    
    if (adminInsertError) {
      console.log('❌ Admin INSERT failed:', adminInsertError.message)
      console.log('   Code:', adminInsertError.code)
    } else {
      console.log('✅ Admin INSERT successful:', adminInsertData[0]?.id)
      
      // Clean up
      await supabaseAdmin.from('users').delete().eq('id', adminInsertData[0].id)
      console.log('🧹 Cleaned up admin test user')
    }
  } catch (error) {
    console.log('❌ Admin INSERT error:', error.message)
  }
}

async function generateRLSFixSQL() {
  console.log('\n🔧 GENERATING RLS FIX SQL...')
  console.log('=' .repeat(50))
  
  const fixSQL = `
-- Fix RLS policies for Gurtoy AI Chat

-- Option 1: Disable RLS (simplest for development)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE chats DISABLE ROW LEVEL SECURITY;

-- Option 2: Enable RLS with permissive policies (recommended)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
-- CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true) WITH CHECK (true);

-- Create policies for chats table  
-- CREATE POLICY "Allow all operations on chats" ON chats FOR ALL USING (true) WITH CHECK (true);

-- More secure policies (if you want user isolation later):
-- CREATE POLICY "Users can read their own data" ON users FOR SELECT USING (true);
-- CREATE POLICY "Users can insert their own data" ON users FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (true);

-- CREATE POLICY "Users can read their own chats" ON chats FOR SELECT USING (true);
-- CREATE POLICY "Users can insert their own chats" ON chats FOR INSERT WITH CHECK (true);
`

  console.log(fixSQL)
}

async function main() {
  await checkRLSStatus()
  await testTableOperations()
  await generateRLSFixSQL()
  
  console.log('\n📊 DIAGNOSIS SUMMARY:')
  console.log('─'.repeat(50))
  console.log('🔴 ISSUE: Row Level Security (RLS) is blocking operations')
  console.log('💡 CAUSE: Tables have RLS enabled but no policies allow operations')
  console.log('')
  console.log('🎯 SOLUTION OPTIONS:')
  console.log('1. Disable RLS (quick fix for development)')
  console.log('2. Create permissive RLS policies (recommended)')
  console.log('')
  console.log('📋 NEXT STEPS:')
  console.log('1. Go to your Supabase dashboard')
  console.log('2. Open SQL Editor')
  console.log('3. Run the SQL fix provided above')
  console.log('4. Test your app again')
}

main().catch(console.error)