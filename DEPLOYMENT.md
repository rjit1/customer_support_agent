# 🚀 Gurtoy AI Chat System - Deployment Guide

This guide covers the complete deployment process for the Gurtoy AI customer support chat system.

## 📋 Prerequisites

- Node.js 18+ installed
- Supabase account
- A4F API account for GPT-5 Nano access
- Vercel account (for deployment)
- Domain name (optional)

## 🔧 Initial Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create `.env.local` file with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# A4F API Configuration for GPT-5 Nano
A4F_API_KEY=your_a4f_api_key
A4F_BASE_URL=https://api.a4f.co/v1

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## 🗄️ Database Setup

### 1. Create Supabase Project

1. Go to [Supabase](https://supabase.com)
2. Create a new project
3. Wait for the project to be ready
4. Copy the project URL and keys

### 2. Run Database Schema

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Run the contents of `supabase/schema.sql`

### 3. Set up Storage Bucket

1. Go to Storage in Supabase dashboard
2. Create a bucket named `ai-context`
3. Set bucket to private
4. Upload your context files:
   - `product.txt`
   - `contact.txt` 
   - `privacy.txt`
   - `detail.txt`

## 🤖 A4F API Setup

### 1. Get API Access

1. Sign up for A4F API account
2. Get your API key for GPT-5 Nano access
3. Verify your rate limits and billing setup

### 2. Test API Connection

```bash
# Test API connection
curl -X POST \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "model": "provider-6/gpt-5-nano",
       "messages": [{"role": "user", "content": "Hello"}],
       "max_tokens": 100
     }' \
     https://api.a4f.co/v1/chat/completions
```

## 🏗️ Local Development

### 1. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

### 2. Test Chat Functionality

1. Enter your name in the welcome modal
2. Send a test message
3. Verify AI responses are working
4. Check Supabase database for saved messages

## 🌐 Production Deployment

### 1. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow the prompts to link your project
```

### 2. Configure Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add all the environment variables from `.env.local`

### 3. Configure Domain (Optional)

1. Go to Domains in Vercel dashboard
2. Add your custom domain
3. Configure DNS settings as instructed

## 📊 Context Files Management

### Upload Context Files to Supabase

The system expects these files in the `ai-context` storage bucket:

#### `product.txt`
```
# Gurtoy Product Catalog
Complete list of products with categories and direct links to thegurtoys.com
```

#### `contact.txt`
```
# Contact Information
Phone: 8300000086 (Purchases), 9592020898 (Enquiries)
Address: Shop No. 6/7, Char Khamba Road, Model Town, Ludhiana
Email: thegurtoy@gmail.com
Website: www.thegurtoys.com
```

#### `privacy.txt`
```
# Privacy Policy
Complete privacy policy content for AI to reference
```

#### `detail.txt`
```
# Company Information
Owner: Kawardeep Singh Khurana
Brand positioning and company details
```

### Updating Context Files

1. Edit the files locally
2. Upload to Supabase Storage via dashboard
3. AI will automatically use updated content

## 🔍 Testing

### Run Type Checking

```bash
npm run type-check
```

### Run Linting

```bash
npm run lint
```

### Manual Testing Checklist

- [ ] Welcome modal appears for new users
- [ ] User registration works
- [ ] Chat messages save to database
- [ ] AI responses are contextual and relevant
- [ ] Context files are loading properly
- [ ] Error handling works for API failures
- [ ] Mobile responsiveness works
- [ ] Multiple conversation memory works

## 🎯 Performance Optimization

### 1. Database Indexing

The schema includes optimized indexes for:
- Chat history queries
- User lookups
- Timestamp-based sorting

### 2. API Caching

- Context files are cached to reduce storage calls
- Chat history is efficiently queried with limits

### 3. Frontend Optimization

- Lazy loading of components
- Optimized bundle size
- Image optimization

## 🔐 Security Considerations

### 1. Environment Variables

- Never commit `.env.local` to git
- Use different API keys for development and production
- Rotate API keys regularly

### 2. Database Security

- Row Level Security (RLS) is enabled
- Users can only access their own data
- Service role key is used only for server-side operations

### 3. Input Validation

- User input is sanitized before storage
- Message length limits are enforced
- XSS prevention measures are in place

## 📈 Monitoring & Analytics

### 1. Error Tracking

Consider adding error tracking:
- Sentry for error monitoring
- Vercel Analytics for performance
- Custom logging for chat quality

### 2. Usage Analytics

Track key metrics:
- User engagement
- Message volume
- Response accuracy
- Context file usage

## 🔄 Maintenance

### Regular Tasks

1. **Weekly:**
   - Monitor error logs
   - Check API usage/limits
   - Review chat quality

2. **Monthly:**
   - Update context files with new products
   - Clean up old chat data (optional)
   - Review and optimize performance

3. **Quarterly:**
   - Update dependencies
   - Review security settings
   - Backup database

## 🆘 Troubleshooting

### Common Issues

#### 1. AI Not Responding
- Check A4F API key validity
- Verify API rate limits
- Check network connectivity

#### 2. Database Connection Issues
- Verify Supabase credentials
- Check RLS policies
- Ensure tables exist

#### 3. Context Files Not Loading
- Verify bucket permissions
- Check file names match exactly
- Ensure files are in correct bucket

#### 4. Build Errors
- Run `npm run type-check`
- Clear `.next` folder
- Check all environment variables

### Support Contacts

- **Technical Issues:** Check GitHub issues
- **Supabase Support:** Supabase documentation
- **A4F API Issues:** A4F support channels

## 🎉 Launch Checklist

Before going live:

- [ ] All environment variables configured
- [ ] Database schema deployed
- [ ] Context files uploaded and tested
- [ ] AI responses tested and appropriate
- [ ] Error handling tested
- [ ] Performance tested under load
- [ ] Mobile experience tested
- [ ] Security review completed
- [ ] Monitoring setup
- [ ] Backup strategy in place

---

Your Gurtoy AI Chat system is now ready to provide amazing customer support! 🧸✨