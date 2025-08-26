import { NextApiRequest, NextApiResponse } from 'next'
import { loadContextFiles } from '../../lib/loadContextFiles'
import { getChatHistory, saveChatMessage, formatChatHistoryForAI } from '../../lib/getChatMemory'
import { createUser, getUserById } from '../../lib/supabaseClient'
import { getCachedContextFiles } from '../../lib/contextCache'
import { getSmartProductContext } from '../../lib/productMatcher'
import { v4 as uuidv4 } from 'uuid'

interface ChatRequest {
  userId: string
  message: string
  userName?: string
  userEmail?: string
}

/**
 * Generate system prompt with context and memory - OPTIMIZED VERSION
 */
function generateSystemPrompt(contextFiles: any, chatHistory: string, smartProducts: string, userName?: string): string {
  return `You are Gurtoy AI, the professional customer support assistant for Gurtoy toy store (thegurtoys.com). You provide quick, helpful, and accurate responses to customer inquiries.

COMMUNICATION STYLE:
- Be concise and professional - limit responses to 3-4 sentences maximum
- Be warm but direct - customers value efficient service  
- Use bullet points for product recommendations (max 3 items)
- Always include ONE relevant product link when recommending items
- Greet customers warmly but get straight to helping them

CRITICAL LANGUAGE RULE - READ CAREFULLY:
- MANDATORY: Use ONLY Roman alphabet (A-Z, a-z, 0-9) - ZERO tolerance for Hindi script
- If customer speaks Hindi/Hinglish: Respond in HINGLISH with Roman letters ONLY
- CORRECT: "Ji haan! Aapke bachhe ke liye ye toys perfect hain"
- FORBIDDEN: "जी", "हैं", "के", "लिए" or any देवनागरी characters
- Use: ji, haan, aapke, bachhe, saal, kya, hai, yahan, paas, achhe (all in Roman)
- System will reject responses containing Hindi script characters

CORE INFORMATION:
${contextFiles.detail || 'Loading company details...'}

CONTACT INFORMATION:
${contextFiles.contact || 'Loading contact information...'}

SMART PRODUCT RECOMMENDATIONS:
${smartProducts}

PRIVACY POLICY:
${contextFiles.privacy || 'Loading privacy information...'}

CONVERSATION MEMORY:
${chatHistory}

RESPONSE RULES:
1. CONCISE: Keep responses under 60 words unless complex explanation needed
2. RELEVANT: Only recommend products from the SMART PRODUCT RECOMMENDATIONS section
3. LINKS: Include ONE verified product link per recommendation, format as: [Product Name](https://thegurtoys.com/products/product-slug)
4. PRODUCT MATCHING: Only recommend products that exist in the Smart Recommendations - verify URLs before suggesting
5. CONTACT: For purchases mention 8300000086, for queries mention 9592020898
6. PROFESSIONAL: Sound like a knowledgeable customer service representative  
7. MEMORY: Reference previous conversation context when relevant
8. AGE-APPROPRIATE: Always consider child's age for safety and development

${userName ? `Customer name: ${userName}` : ''}

CRITICAL: Be helpful, professional, and brief. Customers prefer quick, accurate answers over lengthy explanations.`
}

/**
 * Call GPT-5 Nano via A4F API
 */
async function callGPT5Nano(systemPrompt: string, userMessage: string): Promise<string> {
  try {
    const response = await fetch(`${process.env.A4F_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.A4F_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'provider-6/kimi-k2-instruct',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        max_tokens: 150, // Reduced for faster responses and lower costs
        temperature: 0.2, // Even lower for more consistent, faster responses
        top_p: 0.7, // Lower for more focused responses
        frequency_penalty: 0.4, // Higher to avoid repetitive language
        presence_penalty: 0.3, // Higher for more diverse responses
        stream: false // Ensure no streaming for consistent timing
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`A4F API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || 'I apologize, but I encountered an issue generating a response. Please try again or contact our support team.'

  } catch (error) {
    console.error('Error calling GPT-5 Nano:', error)
    return 'I apologize, but I\'m having trouble connecting right now. Please try again in a moment or contact our support team at 9592020898 for immediate assistance.'
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId, message, userName, userEmail }: ChatRequest = req.body
    console.log('=== AI Chat API Request ===')
    console.log('UserId:', userId)
    console.log('UserName:', userName) 
    console.log('UserEmail:', userEmail)
    console.log('Message:', message)

    if (!userId || !message) {
      console.log('❌ Missing required fields')
      return res.status(400).json({ error: 'Missing required fields: userId and message' })
    }

    // Ensure user exists
    console.log('🔍 Checking if user exists...')
    let user = await getUserById(userId)
    console.log('User lookup result:', user)
    
    if (!user) {
      console.log('🆕 User not found, creating new user...')
      user = await createUser({
        id: userId,
        name: userName || 'Anonymous User',
        email: userEmail || undefined,
      })
      console.log('User creation result:', user)
    }

    if (!user) {
      console.log('❌ Failed to create or retrieve user')
      return res.status(500).json({ error: 'Failed to create or retrieve user' })
    }

    console.log('✅ User confirmed:', user.id)

    // Load context files (cached) and chat history in parallel
    const [contextFiles, chatHistory] = await Promise.all([
      getCachedContextFiles(loadContextFiles),
      getChatHistory(userId, 6) // Reduced to 6 messages for faster processing
    ])

    if (!contextFiles) {
      console.error('Failed to load context files')
      return res.status(500).json({ error: 'Failed to load system context' })
    }

    // Format chat history for AI context
    const formattedHistory = formatChatHistoryForAI(chatHistory)
    
    // Generate smart product recommendations based on user query
    const smartProducts = getSmartProductContext(message, contextFiles.product)

    // Generate system prompt with smart recommendations
    const systemPrompt = generateSystemPrompt(contextFiles, formattedHistory, smartProducts, user.name)

    // Save user message
    const savedUserMessage = await saveChatMessage(userId, message, 'user')
    if (!savedUserMessage) {
      return res.status(500).json({ error: 'Failed to save user message' })
    }

    // Get AI response
    const aiResponse = await callGPT5Nano(systemPrompt, message)

    // Save assistant message
    const savedAssistantMessage = await saveChatMessage(userId, aiResponse, 'assistant')
    if (!savedAssistantMessage) {
      return res.status(500).json({ error: 'Failed to save assistant message' })
    }

    // Return both messages
    res.status(200).json({
      userMessage: savedUserMessage,
      assistantMessage: savedAssistantMessage,
      success: true
    })

  } catch (error) {
    console.error('Error in ai-chat API:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    })
  }
}
