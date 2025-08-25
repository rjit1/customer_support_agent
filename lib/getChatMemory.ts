import { supabaseAdmin, Chat } from './supabaseClient'

/**
 * Get chat history for a user (last N messages for memory context)
 */
export async function getChatHistory(userId: string, limit: number = 20): Promise<Chat[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('chats')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching chat history:', error)
      return []
    }

    // Return in chronological order (oldest first) for proper context
    return data.reverse()
  } catch (error) {
    console.error('Error fetching chat history:', error)
    return []
  }
}

/**
 * Save a chat message to the database
 */
export async function saveChatMessage(
  userId: string, 
  message: string, 
  role: 'user' | 'assistant'
): Promise<Chat | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('chats')
      .insert([{
        user_id: userId,
        message,
        role
      }])
      .select()
      .single()

    if (error) {
      console.error('Error saving chat message:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error saving chat message:', error)
    return null
  }
}

/**
 * Format chat history for AI context
 */
export function formatChatHistoryForAI(chatHistory: Chat[]): string {
  if (!chatHistory.length) {
    return "New conversation - no previous context."
  }

  // Extract key context: user needs, preferences, and previous recommendations
  const userMessages = chatHistory.filter(chat => chat.role === 'user')
  const lastUserMessage = userMessages[userMessages.length - 1]
  
  // Focus on recent context (last 5 exchanges) for better relevance
  const recentHistory = chatHistory.slice(-10).map(chat => {
    return `${chat.role}: ${chat.message.substring(0, 100)}${chat.message.length > 100 ? '...' : ''}`
  }).join('\n')

  // Extract user preferences/context from conversation
  let contextSummary = ''
  const childAge = extractChildAge(chatHistory)
  const interests = extractInterests(chatHistory)
  
  if (childAge) contextSummary += `Child age: ${childAge}. `
  if (interests.length > 0) contextSummary += `Interests: ${interests.join(', ')}. `

  return `Context: ${contextSummary}\nRecent messages:\n${recentHistory}\n`
}

/**
 * Extract child age from conversation history
 */
function extractChildAge(chatHistory: Chat[]): string | null {
  const ageRegex = /(\d+)\s*(year|month|yr|mo)/i
  for (const chat of chatHistory) {
    if (chat.role === 'user') {
      const match = chat.message.match(ageRegex)
      if (match) return `${match[1]} ${match[2].toLowerCase()}`
    }
  }
  return null
}

/**
 * Extract interests/topics from conversation
 */
function extractInterests(chatHistory: Chat[]): string[] {
  const interests: string[] = []
  const keywords = ['educational', 'puzzle', 'toy', 'car', 'doll', 'bike', 'outdoor', 'indoor', 'creative', 'building', 'musical']
  
  for (const chat of chatHistory) {
    if (chat.role === 'user') {
      keywords.forEach(keyword => {
        if (chat.message.toLowerCase().includes(keyword) && !interests.includes(keyword)) {
          interests.push(keyword)
        }
      })
    }
  }
  
  return interests.slice(0, 3) // Limit to top 3 interests
}

/**
 * Get conversation summary for long chat histories
 */
export async function getChatSummary(userId: string): Promise<string> {
  try {
    // For now, just return recent messages
    // In the future, this could use AI to summarize long conversations
    const recentChats = await getChatHistory(userId, 10)
    
    if (!recentChats.length) {
      return "New customer, no previous conversation history."
    }

    const userMessages = recentChats.filter(chat => chat.role === 'user')
    const topics = userMessages.map(chat => chat.message.substring(0, 100)).join(', ')
    
    return `Recent conversation topics: ${topics}`
  } catch (error) {
    console.error('Error getting chat summary:', error)
    return "Unable to retrieve conversation history."
  }
}

/**
 * Delete old chat messages (for privacy/cleanup)
 */
export async function cleanupOldChats(userId: string, daysOld: number = 90): Promise<boolean> {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const { error } = await supabaseAdmin
      .from('chats')
      .delete()
      .eq('user_id', userId)
      .lt('created_at', cutoffDate.toISOString())

    if (error) {
      console.error('Error cleaning up old chats:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error cleaning up old chats:', error)
    return false
  }
}

/**
 * Get chat statistics for analytics
 */
export async function getChatStats(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('chats')
      .select('role, created_at')
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching chat stats:', error)
      return null
    }

    const totalMessages = data.length
    const userMessages = data.filter(chat => chat.role === 'user').length
    const assistantMessages = data.filter(chat => chat.role === 'assistant').length
    
    const firstMessage = data.length > 0 ? new Date(data[data.length - 1].created_at) : null
    const lastMessage = data.length > 0 ? new Date(data[0].created_at) : null

    return {
      totalMessages,
      userMessages,
      assistantMessages,
      firstMessage,
      lastMessage,
      conversationDays: firstMessage && lastMessage ? 
        Math.ceil((lastMessage.getTime() - firstMessage.getTime()) / (1000 * 60 * 60 * 24)) : 0
    }
  } catch (error) {
    console.error('Error getting chat stats:', error)
    return null
  }
}