import { supabase } from './supabaseClient'
import fs from 'fs'
import path from 'path'

export interface ContextFiles {
  product: string
  contact: string
  privacy: string
  detail: string
}

/**
 * Load context files from local files in development or Supabase Storage in production
 * These files provide the AI with current information about products,
 * company details, contact info, and privacy policies
 */
export async function loadContextFiles(): Promise<ContextFiles | null> {
  try {
    const files = ['product.txt', 'contact.txt', 'privacy.txt', 'detail.txt']
    const contextFiles: Partial<ContextFiles> = {}

    // In development, try to load from local files first
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Loading context files from local filesystem')
      
      for (const fileName of files) {
        try {
          const filePath = path.join(process.cwd(), fileName)
          if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8')
            const key = fileName.replace('.txt', '') as keyof ContextFiles
            contextFiles[key] = content
            console.log(`Loaded ${fileName} from local filesystem`)
          } else {
            console.warn(`Local file ${fileName} not found at ${filePath}`)
          }
        } catch (error) {
          console.error(`Error reading local file ${fileName}:`, error)
        }
      }
      
      // If all local files loaded successfully, return them
      if (contextFiles.product && contextFiles.contact && 
          contextFiles.privacy && contextFiles.detail) {
        console.log('All context files loaded from local filesystem')
        return contextFiles as ContextFiles
      }
    }

    // Fallback to Supabase Storage (for production or if local files failed)
    console.log('Loading context files from Supabase Storage')
    
    const filePromises = files.map(async (fileName) => {
      // Try both lowercase and capitalized versions for compatibility
      let data, error;
      
      // First try original filename
      ({ data, error } = await supabase.storage
        .from('ai-context')
        .download(fileName));

      // If failed and it's contact.txt, try Contact.txt (capitalized)
      if (error && fileName === 'contact.txt') {
        console.log('Trying Contact.txt with capital C...');
        ({ data, error } = await supabase.storage
          .from('ai-context')
          .download('Contact.txt'));
      }

      if (error || !data) {
        console.error(`Error downloading ${fileName}:`, error)
        return null
      }

      const text = await data.text()
      return { fileName, content: text }
    })

    const results = await Promise.all(filePromises)

    // Process results and build context files object
    for (const result of results) {
      if (result) {
        const key = result.fileName.replace('.txt', '') as keyof ContextFiles
        contextFiles[key] = result.content
      }
    }

    // Ensure all required files are loaded
    if (!contextFiles.product || !contextFiles.contact || 
        !contextFiles.privacy || !contextFiles.detail) {
      console.error('Some context files failed to load from both local and Supabase')
      return null
    }

    return contextFiles as ContextFiles
  } catch (error) {
    console.error('Error loading context files:', error)
    return null
  }
}

/**
 * Load a specific context file
 */
export async function loadSpecificContextFile(fileName: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from('ai-context')
      .download(fileName)

    if (error || !data) {
      console.error(`Error downloading ${fileName}:`, error)
      return null
    }

    return await data.text()
  } catch (error) {
    console.error(`Error loading ${fileName}:`, error)
    return null
  }
}

/**
 * Upload context files to Supabase Storage (for admin use)
 */
export async function uploadContextFile(fileName: string, content: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from('ai-context')
      .upload(fileName, new Blob([content], { type: 'text/plain' }), {
        upsert: true,
        contentType: 'text/plain'
      })

    if (error) {
      console.error(`Error uploading ${fileName}:`, error)
      return false
    }

    return true
  } catch (error) {
    console.error(`Error uploading ${fileName}:`, error)
    return false
  }
}

/**
 * Get the last modified time of context files for caching
 */
export async function getContextFilesMetadata() {
  try {
    const { data, error } = await supabase.storage
      .from('ai-context')
      .list()

    if (error) {
      console.error('Error listing context files:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error getting context files metadata:', error)
    return null
  }
}