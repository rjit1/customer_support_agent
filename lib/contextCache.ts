import { ContextFiles } from './loadContextFiles'

interface CachedContext {
  data: ContextFiles
  lastModified: number
  expires: number
}

// In-memory cache with 5-minute TTL
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
let contextCache: CachedContext | null = null

/**
 * Smart context cache with TTL and modification checking
 */
export async function getCachedContextFiles(
  loadFunction: () => Promise<ContextFiles | null>
): Promise<ContextFiles | null> {
  const now = Date.now()
  
  // Check if cache is valid and not expired
  if (contextCache && now < contextCache.expires) {
    console.log('✅ Using cached context files')
    return contextCache.data
  }
  
  console.log('🔄 Loading fresh context files...')
  const freshData = await loadFunction()
  
  if (!freshData) {
    // Fallback to cache if available
    if (contextCache) {
      console.log('⚠️ Using stale cache due to load failure')
      return contextCache.data
    }
    return null
  }
  
  // Update cache
  contextCache = {
    data: freshData,
    lastModified: now,
    expires: now + CACHE_TTL
  }
  
  console.log('✅ Context files cached successfully')
  return freshData
}

/**
 * Clear cache manually (for admin operations)
 */
export function clearContextCache(): void {
  contextCache = null
  console.log('🗑️ Context cache cleared')
}

/**
 * Get cache status for monitoring
 */
export function getCacheStatus() {
  if (!contextCache) return { status: 'empty' }
  
  const now = Date.now()
  const isExpired = now >= contextCache.expires
  
  return {
    status: isExpired ? 'expired' : 'valid',
    age: now - contextCache.lastModified,
    timeToExpiry: contextCache.expires - now,
    lastModified: new Date(contextCache.lastModified).toISOString()
  }
}