// Smart product matching without embeddings using keyword matching and scoring
interface ProductMatch {
  url: string
  slug: string
  name: string
  score: number
  keywords: string[]
}

// Cached product index for fast lookup
let productIndex: ProductMatch[] | null = null
let indexLastUpdated = 0
const INDEX_CACHE_TTL = 10 * 60 * 1000 // 10 minutes

/**
 * Parse products and build searchable index
 */
function buildProductIndex(productData: string): ProductMatch[] {
  const products: ProductMatch[] = []
  const lines = productData.split('\n').filter(line => line.trim())
  
  for (const url of lines) {
    if (!url.startsWith('https://thegurtoys.com/products/')) continue
    
    const slug = url.split('/').pop() || ''
    const name = slug
      .replace(/gurtoy-/g, '')
      .replace(/-/g, ' ')
      .toLowerCase()
    
    // Extract keywords for matching
    const keywords = extractKeywords(name)
    
    products.push({
      url,
      slug,
      name,
      score: 0,
      keywords
    })
  }
  
  return products
}

/**
 * Extract searchable keywords from product name
 */
function extractKeywords(name: string): string[] {
  // Common toy categories and attributes
  const categories = ['car', 'bike', 'doll', 'toy', 'kids', 'baby', 'ride', 'push', 'scooter', 'stroller']
  const attributes = ['rechargeable', 'battery', 'electric', 'educational', 'musical', 'interactive']
  const ageGroups = ['baby', 'toddler', 'kids', 'child', 'infant']
  const colors = ['pink', 'blue', 'red', 'green', 'yellow', 'white', 'black', 'navy']
  
  const allKeywords = [...categories, ...attributes, ...ageGroups, ...colors]
  const words = name.toLowerCase().split(/\s+/)
  
  return words.filter(word => 
    word.length > 2 && (
      allKeywords.includes(word) || 
      words.length <= 5 // Include all words for short product names
    )
  )
}

/**
 * Smart product search with scoring algorithm
 */
export function findRelevantProducts(
  query: string, 
  productData: string, 
  limit: number = 3
): ProductMatch[] {
  const now = Date.now()
  
  // Build/refresh index if needed
  if (!productIndex || now - indexLastUpdated > INDEX_CACHE_TTL) {
    console.log('🔄 Rebuilding product index...')
    productIndex = buildProductIndex(productData)
    indexLastUpdated = now
  }
  
  const searchTerms = extractSearchTerms(query.toLowerCase())
  if (searchTerms.length === 0) return []
  
  // Score each product
  const scoredProducts = productIndex.map(product => ({
    ...product,
    score: calculateRelevanceScore(searchTerms, product)
  }))
  
  // Return top matches with score > 0
  return scoredProducts
    .filter(p => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

/**
 * Extract search terms from user query
 */
function extractSearchTerms(query: string): string[] {
  // Age pattern matching
  const ageMatch = query.match(/(\d+)\s*(year|month|yr|mo|saal)/i)
  const terms: string[] = []
  
  if (ageMatch) {
    const age = parseInt(ageMatch[1])
    if (age <= 2) terms.push('baby', 'toddler')
    else if (age <= 5) terms.push('kids', 'child')
    else terms.push('kids')
  }
  
  // Gender detection
  if (/\b(boy|boys|ladka|beta)\b/i.test(query)) terms.push('boys')
  if (/\b(girl|girls|ladki|beti)\b/i.test(query)) terms.push('girls')
  
  // Product categories
  const categories = {
    'car|gaadi|vehicle': ['car', 'vehicle'],
    'bike|cycle|bicycle': ['bike', 'cycle'],
    'doll|barbie|gudiya': ['doll'],
    'educational|learning|study': ['educational'],
    'music|musical|song': ['musical'],
    'outdoor|bahar': ['outdoor', 'ride'],
    'indoor|ghar': ['indoor'],
    'creative|art|drawing': ['creative', 'art']
  }
  
  for (const [pattern, keywords] of Object.entries(categories)) {
    if (new RegExp(pattern, 'i').test(query)) {
      terms.push(...keywords)
    }
  }
  
  // Extract other meaningful words (3+ chars)
  const words = query.replace(/[^\w\s]/g, '').split(/\s+/)
  const meaningfulWords = words.filter(w => w.length >= 3 && !/^(for|and|the|with|can|you|please|want|need|looking|good|best)$/i.test(w))
  terms.push(...meaningfulWords)
  
  // Remove duplicates using Array.from instead of spread operator
  return Array.from(new Set(terms))
}

/**
 * Calculate relevance score between search terms and product
 */
function calculateRelevanceScore(searchTerms: string[], product: ProductMatch): number {
  let score = 0
  const productText = `${product.name} ${product.keywords.join(' ')}`.toLowerCase()
  
  for (const term of searchTerms) {
    // Exact match bonus
    if (productText.includes(term)) {
      score += 10
    }
    
    // Partial match
    if (productText.includes(term.substring(0, Math.min(4, term.length)))) {
      score += 3
    }
    
    // Keyword match bonus
    if (product.keywords.includes(term)) {
      score += 15
    }
  }
  
  // Boost for common product types
  const popularProducts = ['car', 'bike', 'doll', 'educational', 'stroller', 'scooter']
  for (const popular of popularProducts) {
    if (productText.includes(popular)) {
      score += 2
    }
  }
  
  return score
}

/**
 * Get product context for AI - returns only relevant products instead of full catalog
 */
export function getSmartProductContext(query: string, productData: string): string {
  const relevantProducts = findRelevantProducts(query, productData, 8)
  
  if (relevantProducts.length === 0) {
    return "Current conversation doesn't require specific product recommendations. Provide general guidance."
  }
  
  const productList = relevantProducts
    .map(p => `- [${p.name.replace(/\b\w/g, l => l.toUpperCase())}](${p.url})`)
    .join('\n')
  
  return `RELEVANT PRODUCTS (recommend max 3):\n${productList}\n\nIMPORTANT: Only recommend products from this list. Verify URLs exist before suggesting.`
}

/**
 * Cache statistics for monitoring
 */
export function getProductIndexStats() {
  return {
    indexed: productIndex?.length || 0,
    lastUpdated: indexLastUpdated ? new Date(indexLastUpdated).toISOString() : null,
    cacheAge: indexLastUpdated ? Date.now() - indexLastUpdated : 0
  }
}