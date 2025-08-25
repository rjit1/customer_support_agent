// Test database operations directly using the same functions as the API

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

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// Recreate the same functions used in the API
async function createUser(userData) {
  try {
    console.log('Creating user with data:', userData)
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

async function getUserById(userId) {
  try {
    console.log('Fetching user by ID:', userId)
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

async function testUserFlow() {
  console.log('🧪 Testing Direct User Operations')
  console.log('==================================\n')
  
  const userId = 'direct-test-' + Date.now()
  const userName = 'Direct Test User'
  const userEmail = 'directtest@example.com'
  
  // Test 1: Check if user exists (should fail)
  console.log('1️⃣ Testing getUserById (should return null)...')
  let user = await getUserById(userId)
  
  if (user === null) {
    console.log('✅ Correctly returned null for non-existent user')
  } else {
    console.log('❌ Unexpected result:', user)
  }
  
  // Test 2: Create new user
  console.log('\n2️⃣ Testing createUser...')
  const newUser = await createUser({
    id: userId,
    name: userName,
    email: userEmail,
  })
  
  if (newUser) {
    console.log('✅ User creation successful')
    console.log('   ID:', newUser.id)
    console.log('   Name:', newUser.name)
    console.log('   Email:', newUser.email)
  } else {
    console.log('❌ User creation failed')
    return false
  }
  
  // Test 3: Retrieve created user
  console.log('\n3️⃣ Testing getUserById (should find user)...')
  const retrievedUser = await getUserById(userId)
  
  if (retrievedUser) {
    console.log('✅ User retrieval successful')
    console.log('   ID:', retrievedUser.id)
    console.log('   Name:', retrievedUser.name)
  } else {
    console.log('❌ User retrieval failed')
    return false
  }
  
  // Test 4: Simulate the exact API flow
  console.log('\n4️⃣ Testing exact API flow...')
  const apiUserId = 'api-flow-' + Date.now()
  
  console.log('🔍 Checking if user exists...')
  let apiUser = await getUserById(apiUserId)
  console.log('User lookup result:', apiUser)
  
  if (!apiUser) {
    console.log('🆕 User not found, creating new user...')
    apiUser = await createUser({
      id: apiUserId,
      name: 'API Flow Test',
      email: 'apiflow@example.com',
    })
    console.log('User creation result:', apiUser)
  }

  if (!apiUser) {
    console.log('❌ Failed to create or retrieve user (API FLOW ISSUE)')
    return false
  }

  console.log('✅ User confirmed:', apiUser.id)
  
  // Clean up
  console.log('\n🧹 Cleaning up test users...')
  await supabaseAdmin.from('users').delete().eq('id', userId)
  await supabaseAdmin.from('users').delete().eq('id', apiUserId)
  console.log('✅ Cleanup complete')
  
  return true
}

async function main() {
  const success = await testUserFlow()
  
  console.log('\n📊 RESULT:')
  console.log('─'.repeat(40))
  
  if (success) {
    console.log('🎉 ALL DIRECT DB OPERATIONS WORK!')
    console.log('✅ The database functions are working correctly')
    console.log('')
    console.log('🔧 This means the issue is likely in:')
    console.log('   - Environment variables in API context')
    console.log('   - API route execution environment')
    console.log('   - Next.js server-side context')
  } else {
    console.log('🔴 DIRECT DB OPERATIONS FAILED')
    console.log('❌ The core database functions have issues')
  }
}

main().catch(console.error)