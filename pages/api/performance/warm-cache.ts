import { NextApiRequest, NextApiResponse } from 'next'
import { loadContextFiles } from '../../../lib/loadContextFiles'
import { getCachedContextFiles, clearContextCache } from '../../../lib/contextCache'
import { getSmartProductContext } from '../../../lib/productMatcher'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { force = false } = req.body

    if (force) {
      clearContextCache()
    }

    // Warm context cache
    console.log('🔥 Warming context cache...')
    const contextFiles = await getCachedContextFiles(loadContextFiles)
    
    if (!contextFiles) {
      return res.status(500).json({ error: 'Failed to warm context cache' })
    }

    // Warm product index with sample queries
    const sampleQueries = [
      'car for 3 year old',
      'educational toys',
      'bike for boys',
      'doll for girls',
      'musical toys'
    ]

    console.log('🔥 Warming product index...')
    for (const query of sampleQueries) {
      getSmartProductContext(query, contextFiles.product)
    }

    res.status(200).json({
      success: true,
      message: 'Cache warmed successfully',
      contextFilesLoaded: true,
      productIndexWarmed: true,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error warming cache:', error)
    res.status(500).json({ 
      error: 'Failed to warm cache',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    })
  }
}