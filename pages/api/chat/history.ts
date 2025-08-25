import { NextApiRequest, NextApiResponse } from 'next'
import { getChatHistory } from '../../../lib/getChatMemory'

interface HistoryRequest {
  userId: string
  limit?: number
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId, limit = 50 }: HistoryRequest = req.body

    if (!userId) {
      return res.status(400).json({ error: 'Missing required field: userId' })
    }

    const chatHistory = await getChatHistory(userId, limit)

    res.status(200).json({
      chatHistory,
      success: true
    })

  } catch (error) {
    console.error('Error fetching chat history:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    })
  }
}