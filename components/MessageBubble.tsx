import React from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'

interface MessageBubbleProps {
  message: string
  role: 'user' | 'assistant'
  timestamp?: string
  className?: string
}

const MessageBubble = React.forwardRef<HTMLDivElement, MessageBubbleProps>(({ 
  message, 
  role, 
  timestamp, 
  className = '' 
}, ref) => {
  const isUser = role === 'user'
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 ${className}`}
    >
      <div className={`flex max-w-xs lg:max-w-md ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 ${isUser ? 'ml-3' : 'mr-3'}`}>
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm
            ${isUser 
              ? 'bg-gradient-to-r from-primary-400 to-primary-600' 
              : 'bg-gradient-to-r from-secondary-400 to-secondary-600'
            }
          `}>
            {isUser ? '👤' : '🤖'}
          </div>
        </div>

        {/* Message Bubble */}
        <div className={`
          px-4 py-3 rounded-2xl shadow-chat font-poppins
          ${isUser 
            ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-br-md' 
            : 'bg-white text-gray-800 border border-gray-100 rounded-bl-md'
          }
        `}>
          <div className="text-sm leading-relaxed break-words">
            {isUser ? (
              <p className="whitespace-pre-wrap">{message}</p>
            ) : (
              <ReactMarkdown
                components={{
                  a: ({ node, ...props }) => (
                    <a
                      {...props}
                      className="text-primary-600 hover:text-primary-700 underline font-medium transition-colors duration-200"
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  ),
                  p: ({ node, ...props }) => (
                    <p {...props} className="whitespace-pre-wrap" />
                  ),
                  ul: ({ node, ...props }) => (
                    <ul {...props} className="list-disc list-inside my-2 space-y-1" />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol {...props} className="list-decimal list-inside my-2 space-y-1" />
                  ),
                  li: ({ node, ...props }) => (
                    <li {...props} className="ml-2" />
                  ),
                  strong: ({ node, ...props }) => (
                    <strong {...props} className="font-semibold" />
                  ),
                  em: ({ node, ...props }) => (
                    <em {...props} className="italic" />
                  )
                }}
              >
                {message}
              </ReactMarkdown>
            )}
          </div>
          {timestamp && (
            <p className={`
              text-xs mt-2 opacity-75
              ${isUser ? 'text-primary-100' : 'text-gray-500'}
            `}>
              {new Date(timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
})

MessageBubble.displayName = 'MessageBubble'

export default MessageBubble