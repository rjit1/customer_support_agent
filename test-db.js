const { createClient } = require('@supabase/supabase-js')

// Load environment variables manually
const fs = require('fs')
const path = require('path')

console.log('🔧 Loading environment variables...')
const envPath = path.join(__dirname, '.env.local')

if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local not found')
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
const supabaseAnonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY

console.log('🔑 Environment Check:')
console.log('  - Supabase URL:', supabaseUrl ? '✅' : '❌')
console.log('  - Anon Key:', supabaseAnonKey ? '✅' : '❌')  
console.log('  - Service Key:', supabaseServiceKey ? '✅' : '❌')

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

// Test both clients
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function testTableExistence() {
  console.log('\n🔍 Testing table existence...')
  
  try {
    // Test with anon client (what the app uses)
    console.log('📝 Testing with anon client...')
    const { data: anonTest, error: anonError } = await supabaseAnon
      .from('users')
      .select('id')
      .limit(1)
    
    if (anonError) {
      console.log('❌ Anon client error:', anonError.message)
      if (anonError.code === '42P01') {
        console.log('   → Table "users" does not exist')
      }
    } else {
      console.log('✅ Anon client can access users table')
    }

    // Test with admin client
    console.log('🔧 Testing with admin client...')
    const { data: adminTest, error: adminError } = await supabaseAdmin
      .from('users')
      .select('id')
      .limit(1)
    
    if (adminError) {
      console.log('❌ Admin client error:', adminError.message)
      if (adminError.code === '42P01') {
        console.log('   → Table "users" does not exist')
      }
    } else {
      console.log('✅ Admin client can access users table')
    }

    return { anonError, adminError }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
    return { anonError: error, adminError: error }
  }
}

async function createTablesDirectly() {
  console.log('\n🔨 Attempting to create tables with admin client...')
  
  try {
    // Create users table
    console.log('👤 Creating users table...')
    const createUsersSQL = `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE,
        name TEXT NOT NULL,
        preferred_language TEXT DEFAULT 'en',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `
    
    const { data: usersResult, error: usersError } = await supabaseAdmin.rpc('exec_sql', {
      sql: createUsersSQL
    })
    
    if (usersError) {
      console.log('⚠️ Could not use exec_sql RPC:', usersError.message)
      
      // Try using postgREST schema API
      console.log('🔄 Trying alternative approach...')
      
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        }
      })
      
      console.log('🌐 API Response status:', response.status)
      
      if (response.ok) {
        console.log('✅ Can connect to Supabase API')
      } else {
        console.log('❌ Cannot connect to Supabase API')
        const errorText = await response.text()
        console.log('   Error:', errorText)
      }
      
    } else {
      console.log('✅ Users table creation attempted')
    }

  } catch (error) {
    console.error('❌ Error creating tables:', error.message)
  }
}

async function testUserCreation() {
  console.log('\n🧪 Testing user creation...')
  
  try {
    const testUser = {
      name: 'Database Test User',
      email: `dbtest-${Date.now()}@example.com`,
      preferred_language: 'en'
    }
    
    console.log('📝 Inserting test user with anon client...')
    const { data: anonUser, error: anonInsertError } = await supabaseAnon
      .from('users')
      .insert(testUser)
      .select()
      .single()
    
    if (anonInsertError) {
      console.log('❌ Anon insert failed:', anonInsertError.message)
      console.log('   Code:', anonInsertError.code)
    } else {
      console.log('✅ Anon insert successful:', anonUser.id)
      
      // Clean up
      await supabaseAnon.from('users').delete().eq('id', anonUser.id)
      console.log('🧹 Test user cleaned up')
      return true
    }

    console.log('📝 Trying with admin client...')
    const { data: adminUser, error: adminInsertError } = await supabaseAdmin
      .from('users')
      .insert(testUser)
      .select()
      .single()
    
    if (adminInsertError) {
      console.log('❌ Admin insert failed:', adminInsertError.message)
      console.log('   Code:', adminInsertError.code)
      return false
    } else {
      console.log('✅ Admin insert successful:', adminUser.id)
      
      // Clean up
      await supabaseAdmin.from('users').delete().eq('id', adminUser.id)
      console.log('🧹 Test user cleaned up')
      return true
    }

  } catch (error) {
    console.error('❌ Unexpected error in user creation test:', error)
    return false
  }
}

async function main() {
  console.log('🚀 Gurtoy Database Diagnosis\n')
  
  // Step 1: Test table existence
  const tableResults = await testTableExistence()
  
  // Step 2: If tables don't exist, try to create them
  if (tableResults.anonError?.code === '42P01' || tableResults.adminError?.code === '42P01') {
    await createTablesDirectly()
    
    // Re-test table existence after creation attempt
    console.log('\n🔄 Re-testing after creation attempt...')
    await testTableExistence()
  }
  
  // Step 3: Test user creation
  const creationSuccess = await testUserCreation()
  
  // Summary
  console.log('\n📊 DIAGNOSIS SUMMARY:')
  console.log('─'.repeat(50))
  
  if (tableResults.anonError?.code === '42P01') {
    console.log('🔴 ISSUE FOUND: Database tables do not exist')
    console.log('💡 SOLUTION: Create tables manually in Supabase dashboard')
  } else if (creationSuccess) {
    console.log('✅ Database is working correctly')
  } else {
    console.log('🔴 ISSUE: Tables exist but user creation fails')
    console.log('💡 Check RLS policies or permissions')
  }
  
  console.log('\n🎯 NEXT STEPS:')
  console.log('1. Go to your Supabase dashboard')
  console.log('2. Open SQL Editor')
  console.log('3. Run the SQL from create-tables.sql file')
  console.log('4. Test your app again')
  
}

main().catch(console.error)