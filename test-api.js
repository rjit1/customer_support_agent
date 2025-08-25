// Use native fetch (Node.js 18+)
const { v4: uuidv4 } = require('uuid')

async function testAIChatAPI() {
  console.log('🧪 Testing AI Chat API...\n')
  
  const userId = uuidv4() // Generate proper UUID
  const userName = 'API Test User'
  const userEmail = 'apitest@example.com'
  const message = 'Hello, I need help with toys!'
  
  try {
    console.log('📝 Sending test message...')
    console.log('  User ID:', userId)
    console.log('  Message:', message)
    
    const response = await fetch('http://localhost:3000/api/ai-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        message,
        userName,
        userEmail
      })
    })
    
    console.log('\n🌐 API Response:')
    console.log('  Status:', response.status)
    console.log('  Status Text:', response.statusText)
    
    if (response.ok) {
      const data = await response.json()
      console.log('  ✅ SUCCESS!')
      console.log('  User Message ID:', data.userMessage?.id)
      console.log('  Assistant Message:', data.assistantMessage?.message?.substring(0, 100) + '...')
      
      return true
    } else {
      const errorData = await response.json().catch(() => ({}))
      console.log('  ❌ FAILED!')
      console.log('  Error:', errorData.error || 'Unknown error')
      console.log('  Details:', errorData.details || 'No details')
      
      return false
    }
    
  } catch (error) {
    console.error('❌ Network/Connection Error:', error.message)
    return false
  }
}

async function testChatHistoryAPI() {
  console.log('\n🧪 Testing Chat History API...\n')
  
  const userId = uuidv4() // Generate proper UUID
  
  try {
    console.log('📝 Fetching chat history...')
    
    const response = await fetch('http://localhost:3000/api/chat/history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        limit: 10
      })
    })
    
    console.log('\n🌐 History API Response:')
    console.log('  Status:', response.status)
    
    if (response.ok) {
      const data = await response.json()
      console.log('  ✅ SUCCESS!')
      console.log('  Chat History Length:', data.chatHistory?.length || 0)
      
      return true
    } else {
      const errorData = await response.json().catch(() => ({}))
      console.log('  ❌ FAILED!')
      console.log('  Error:', errorData.error || 'Unknown error')
      
      return false
    }
    
  } catch (error) {
    console.error('❌ Network/Connection Error:', error.message)
    return false
  }
}

async function main() {
  console.log('🚀 API Integration Test')
  console.log('=======================\n')
  
  console.log('ℹ️  Make sure your dev server is running on http://localhost:3000\n')
  
  const aiChatSuccess = await testAIChatAPI()
  const historySuccess = await testChatHistoryAPI()
  
  console.log('\n📊 TEST SUMMARY:')
  console.log('─'.repeat(40))
  
  if (aiChatSuccess && historySuccess) {
    console.log('🎉 ALL TESTS PASSED!')
    console.log('✅ User creation is working')
    console.log('✅ Chat API is working')
    console.log('✅ History API is working')
    console.log('')
    console.log('🚀 Your app should now work correctly!')
  } else {
    console.log('🔴 SOME TESTS FAILED')
    console.log('❌ AI Chat API:', aiChatSuccess ? 'PASS' : 'FAIL')
    console.log('❌ History API:', historySuccess ? 'PASS' : 'FAIL')
    console.log('')
    console.log('🔧 Check the server logs for more details')
  }
}

main().catch(console.error)