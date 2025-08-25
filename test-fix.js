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

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testUserCreation() {
  console.log('🧪 Testing user creation after RLS fix...\n')
  
  const testUser = {
    name: 'Fix Test User',
    email: `fix-test-${Date.now()}@example.com`,
    preferred_language: 'en'
  }
  
  try {
    console.log('📝 Creating test user...')
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert(testUser)
      .select()
      .single()
    
    if (createError) {
      console.log('❌ User creation failed:', createError.message)
      console.log('   Code:', createError.code)
      
      if (createError.code === '42501') {
        console.log('   🔴 RLS is still blocking - run the SQL fix in Supabase dashboard!')
      }
      return false
    }
    
    console.log('✅ User created successfully!')
    console.log('   ID:', newUser.id)
    console.log('   Name:', newUser.name)
    
    // Test chat creation
    console.log('\n💬 Testing chat creation...')
    const { data: newChat, error: chatError } = await supabase
      .from('chats')
      .insert({
        user_id: newUser.id,
        message: 'Hello! This is a test message.',
        role: 'user'
      })
      .select()
      .single()
    
    if (chatError) {
      console.log('❌ Chat creation failed:', chatError.message)
    } else {
      console.log('✅ Chat created successfully!')
      console.log('   Message:', newChat.message)
      
      // Clean up chat
      await supabase.from('chats').delete().eq('id', newChat.id)
    }
    
    // Clean up user
    await supabase.from('users').delete().eq('id', newUser.id)
    console.log('🧹 Test data cleaned up')
    
    return true
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
    return false
  }
}

async function main() {
  console.log('🔧 Testing RLS Fix')
  console.log('==================\n')
  
  const success = await testUserCreation()
  
  console.log('\n📊 RESULT:')
  console.log('─'.repeat(30))
  
  if (success) {
    console.log('🎉 SUCCESS! RLS issue is fixed!')
    console.log('✅ Your app should now work correctly')
    console.log('')
    console.log('🚀 Next: Test your app at http://localhost:3000')
  } else {
    console.log('🔴 FAILED! RLS is still blocking operations')
    console.log('📋 Please run the SQL fix in your Supabase dashboard:')
    console.log('   ALTER TABLE users DISABLE ROW LEVEL SECURITY;')
    console.log('   ALTER TABLE chats DISABLE ROW LEVEL SECURITY;')
  }
}

main().catch(console.error)