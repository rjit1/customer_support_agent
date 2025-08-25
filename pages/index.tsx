import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { motion } from 'framer-motion'
import Chat from '../components/Chat'
import { v4 as uuidv4 } from 'uuid'

export default function Home() {
  const [userId, setUserId] = useState<string>('')
  const [userName, setUserName] = useState<string>('')
  const [userEmail, setUserEmail] = useState<string>('')
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Check if user already has a session
    const existingUserId = localStorage.getItem('gurtoy_user_id')
    const existingUserName = localStorage.getItem('gurtoy_user_name')
    const existingUserEmail = localStorage.getItem('gurtoy_user_email')

    if (existingUserId) {
      setUserId(existingUserId)
      setUserName(existingUserName || '')
      setUserEmail(existingUserEmail || '')
      setIsWelcomeModalOpen(false)
    }
  }, [])

  const startChat = async () => {
    if (!userName.trim()) {
      alert('Please enter your name to start chatting!')
      return
    }

    setIsLoading(true)
    
    try {
      const newUserId = uuidv4()
      
      // Save to localStorage
      localStorage.setItem('gurtoy_user_id', newUserId)
      localStorage.setItem('gurtoy_user_name', userName)
      localStorage.setItem('gurtoy_user_email', userEmail)

      setUserId(newUserId)
      setIsWelcomeModalOpen(false)
    } catch (error) {
      console.error('Error starting chat:', error)
      alert('Failed to start chat. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const resetChat = () => {
    localStorage.removeItem('gurtoy_user_id')
    localStorage.removeItem('gurtoy_user_name')
    localStorage.removeItem('gurtoy_user_email')
    setUserId('')
    setUserName('')
    setUserEmail('')
    setIsWelcomeModalOpen(true)
  }

  return (
    <>
      <Head>
        <title>Gurtoy AI Assistant - Customer Support Chat</title>
        <meta 
          name="description" 
          content="Get instant help with Gurtoy AI Assistant. Find the perfect toys, get store information, and receive personalized recommendations for your family." 
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 font-poppins">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-sm shadow-soft border-b border-gray-100"
        >
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <motion.div
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3
                  }}
                  className="text-3xl mr-3"
                >
                  🧸
                </motion.div>
                <div>
                  <h1 className="font-fredoka text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                    Gurtoy AI Assistant
                  </h1>
                  <p className="text-gray-600 text-sm">
                    Your friendly toy store helper
                  </p>
                </div>
              </div>
              
              {userId && (
                <div className="flex items-center space-x-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-gray-700">
                      Welcome, {userName}!
                    </p>
                    <p className="text-xs text-gray-500">
                      Connected to Gurtoy support
                    </p>
                  </div>
                  <button
                    onClick={resetChat}
                    className="
                      text-gray-500 hover:text-red-500 transition-colors
                      p-2 rounded-lg hover:bg-red-50
                    "
                    title="Start new chat"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto p-4 h-[calc(100vh-100px)]">
          {isWelcomeModalOpen ? (
            /* Welcome Modal */
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center h-full"
            >
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4">
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 2
                  }}
                  className="text-center text-6xl mb-6"
                >
                  🤖🧸
                </motion.div>
                
                <h2 className="font-fredoka text-3xl font-bold text-center text-gray-800 mb-2">
                  Welcome to Gurtoy!
                </h2>
                <p className="text-center text-gray-600 mb-6">
                  I'm your AI assistant ready to help you find the perfect toys, 
                  answer questions, and provide personalized recommendations!
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Enter your name"
                      className="
                        w-full px-4 py-3 border border-gray-300 rounded-xl
                        focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent
                        font-poppins
                      "
                      maxLength={50}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email (optional)
                    </label>
                    <input
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="
                        w-full px-4 py-3 border border-gray-300 rounded-xl
                        focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent
                        font-poppins
                      "
                      maxLength={100}
                    />
                  </div>

                  <motion.button
                    onClick={startChat}
                    disabled={isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="
                      w-full bg-gradient-to-r from-primary-500 to-secondary-500
                      text-white font-semibold py-3 px-6 rounded-xl
                      shadow-hover transition-all duration-300
                      disabled:opacity-50 disabled:cursor-not-allowed
                      disabled:transform-none
                    "
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                        />
                        Starting Chat...
                      </div>
                    ) : (
                      'Start Chatting! 💬'
                    )}
                  </motion.button>
                </div>

                <div className="mt-6 text-center">
                  <p className="text-xs text-gray-500">
                    By continuing, you agree to our{' '}
                    <a href="https://thegurtoys.com/privacy" className="text-primary-600 hover:underline">
                      Privacy Policy
                    </a>
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            /* Chat Interface */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl h-full overflow-hidden"
            >
              <Chat 
                userId={userId}
                userName={userName}
                userEmail={userEmail}
                onNewMessage={(message) => {
                  console.log('New message received:', message)
                }}
              />
            </motion.div>
          )}
        </main>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center py-4 text-sm text-gray-500"
        >
          <p>
            Powered by Gurtoy AI • Visit{' '}
            <a 
              href="https://thegurtoys.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline"
            >
              thegurtoys.com
            </a>
            {' '}for our full toy collection
          </p>
        </motion.footer>
      </div>
    </>
  )
}