/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.NODE_ENV || 'development',
  },

  // Image optimization
  images: {
    domains: [
      'thegurtoys.com',
      'mmvacwevpvmejfoenyma.supabase.co'
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // Performance optimizations
  experimental: {
    scrollRestoration: true,
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production' 
              ? 'https://your-domain.com' 
              : '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ]
  },

  // Webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Custom webpack configurations can go here
    if (!dev && !isServer) {
      // Production optimizations
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': __dirname,
      }
    }
    
    return config
  },
}

module.exports = nextConfig