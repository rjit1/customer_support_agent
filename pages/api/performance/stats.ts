import { NextApiRequest, NextApiResponse } from 'next'
import { getCacheStatus } from '../../../lib/contextCache'
import { getProductIndexStats } from '../../../lib/productMatcher'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const cacheStatus = getCacheStatus()
    const productIndexStats = getProductIndexStats()
    
    const stats = {
      timestamp: new Date().toISOString(),
      contextCache: cacheStatus,
      productIndex: productIndexStats,
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        memory: process.memoryUsage()
      }
    }

    res.status(200).json(stats)

  } catch (error) {
    console.error('Error fetching performance stats:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    })
  }
}