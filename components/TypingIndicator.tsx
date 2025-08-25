import React from 'react'
import { motion } from 'framer-motion'

interface TypingIndicatorProps {
  className?: string
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ className = '' }) => {
  return (
    <div className={`flex items-center space-x-1 p-4 ${className}`}>
      <div className="flex space-x-1">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="w-2 h-2 bg-gray-400 rounded-full"
            animate={{
              y: ["0%", "-50%", "0%"],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              delay: index * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      <span className="text-sm text-gray-500 ml-2 font-poppins">
        Gurtoy AI is typing...
      </span>
    </div>
  )
}

export default TypingIndicator