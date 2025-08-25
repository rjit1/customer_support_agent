import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'
import { Chat as ChatType } from '../lib/supabaseClient'

interface ChatProps {
  userId: string
  userName?: string
  userEmail?: string
  onNewMessage?: (message: ChatType) => void
}

const Chat: React.FC<ChatProps> = ({ userId, userName, userEmail, onNewMessage }) => {
  const [messages, setMessages] = useState<ChatType[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  // Load initial chat history
  useEffect(() => {
    loadChatHistory()
  }, [userId])

  const loadChatHistory = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/chat/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      if (response.ok) {
        const { chatHistory } = await response.json()
        setMessages(chatHistory || [])
      }
    } catch (error) {
      console.error('Error loading chat history:', error)
      setError('Failed to load chat history')
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inputMessage.trim() || isTyping) return

    const userMessage = inputMessage.trim()
    setInputMessage('')
    setError(null)

    // Add user message immediately
    const newUserMessage: ChatType = {
      id: `temp-${Date.now()}`,
      user_id: userId,
      message: userMessage,
      role: 'user',
      created_at: new Date().toISOString()
    }
    
    setMessages(prev => [...prev, newUserMessage])
    setIsTyping(true)

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          message: userMessage,
          userName,
          userEmail
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message')
      }

      // Replace temp user message with the one from server and add AI response
      setMessages(prev => [
        ...prev.filter(msg => !msg.id.startsWith('temp-')),
        data.userMessage,
        data.assistantMessage
      ])

      // Notify parent component
      if (onNewMessage) {
        onNewMessage(data.assistantMessage)
      }

    } catch (error) {
      console.error('Error sending message:', error)
      setError(error instanceof Error ? error.message : 'Failed to send message')
      
      // Remove the temporary user message on error
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')))
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(e as any)
    }
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-chat-bg to-orange-50">
      {/* Chat Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm border-b border-gray-200 p-4 shadow-soft"
      >
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-secondary-400 to-secondary-600 rounded-full flex items-center justify-center mr-3">
            <span className="text-white text-xl">🤖</span>
          </div>
          <div>
            <h2 className="font-fredoka text-xl text-gray-800 font-bold">
              Gurtoy AI Assistant
            </h2>
            <p className="text-sm text-gray-600 font-poppins">
              Your friendly toy store helper
            </p>
          </div>
        </div>
      </motion.div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full"
            />
          </div>
        ) : (
          <>
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="text-6xl mb-4">🧸</div>
                <h3 className="font-fredoka text-2xl text-gray-700 mb-2">
                  Welcome to Gurtoy!
                </h3>
                <p className="text-gray-600 font-poppins">
                  Hi there! I'm your AI assistant. Ask me anything about our amazing toys, 
                  store information, or get product recommendations!
                </p>
                <div className="mt-6 flex justify-center space-x-2">
                  {['🚗', '🧸', '🎮', '🎨', '⚽', '🎪'].map((emoji, index) => (
                    <motion.div
                      key={index}
                      animate={{ 
                        y: [0, -10, 0],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{
                        duration: 2,
                        delay: index * 0.2,
                        repeat: Infinity,
                        repeatDelay: 3
                      }}
                      className="text-2xl"
                    >
                      {emoji}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <AnimatePresence mode="popLayout">
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message.message}
                    role={message.role}
                    timestamp={message.created_at}
                  />
                ))}
              </AnimatePresence>
            )}

            {isTyping && <TypingIndicator />}
            
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-xl p-3 mx-2"
              >
                <p className="text-red-600 text-sm font-poppins">
                  ⚠️ {error}
                </p>
              </motion.div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={sendMessage}
        className="bg-white/80 backdrop-blur-sm border-t border-gray-200 p-4"
      >
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here... 💬"
              disabled={isTyping}
              className="
                w-full px-4 py-3 border border-gray-300 rounded-2xl 
                focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent
                font-poppins text-gray-800 placeholder-gray-500
                disabled:opacity-50 disabled:cursor-not-allowed
                shadow-soft
              "
              maxLength={500}
            />
          </div>
          <motion.button
            type="submit"
            disabled={!inputMessage.trim() || isTyping}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="
              bg-gradient-to-r from-primary-500 to-primary-600 
              text-white p-3 rounded-2xl shadow-hover
              disabled:opacity-50 disabled:cursor-not-allowed
              disabled:transform-none
              transition-all duration-200
            "
          >
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" 
              />
            </svg>
          </motion.button>
        </div>
        
        <div className="flex justify-between items-center mt-2 px-2">
          <p className="text-xs text-gray-500 font-poppins">
            Press Enter to send, Shift+Enter for new line
          </p>
          <p className="text-xs text-gray-400 font-poppins">
            {inputMessage.length}/500
          </p>
        </div>
      </motion.form>
    </div>
  )
}

export default Chat