# Gurtoy AI Customer Support System

This repository contains the context files and configuration for the AI-powered customer support system for **thegurtoys.com**.

## 🎯 System Overview

The AI customer support system provides intelligent, multilingual assistance for Gurtoy toy store customers. The system uses context files to provide accurate, personalized responses about products, policies, and store information.

## 📁 Context Files Structure

### 1. `Contact.txt` - Customer Support Information
Contains all contact details, social media links, store location, and customer service guidelines.

**Key Information:**
- Phone numbers for purchases (8300000086) and enquiries (9592020898)
- Store address: Shop No. 6/7, Char Khamba Road, Model Town, Ludhiana
- Social media links (Facebook, Instagram, YouTube, etc.)
- Customer service protocols

### 2. `detail.txt` - Brand & Company Information
Comprehensive information about Gurtoy brand, company philosophy, and product categories.

**Key Information:**
- Owner: Kawardeep Singh Khurana
- Brand positioning and specialization
- Product category overview
- Customer service philosophy
- AI assistant tone guidelines

### 3. `privacy.txt` - Privacy Policy & Data Protection
Complete privacy policy covering data collection, usage, and protection measures.

**Key Information:**
- Information collection practices
- Data usage and sharing policies
- Security measures
- Customer rights and choices
- Children's privacy protection
- AI chat interaction policies

### 4. `product.txt` - Product Catalog
Structured catalog of all Gurtoy products organized by categories with direct website links.

**Key Categories:**
- Ride-On Toys & Vehicles (Electric bikes, push cars, scooters)
- Baby Care Products (Strollers, high chairs, carriers)
- Educational Toys & Puzzles (Learning toys, alphabet puzzles)
- Plush & Soft Toys (Teddy bears, character plushies)
- Outdoor Play Equipment (Sports items, slides)
- Pretend Play Sets (Doctor sets, kitchen toys)
- And 15+ more categories with 400+ products

## 🤖 AI System Integration

### How Context Files Are Used:

1. **Dynamic Loading**: Files are loaded during each AI conversation to provide current information
2. **Contextual Responses**: AI uses relevant sections based on customer queries
3. **Product Recommendations**: Structured product data enables intelligent suggestions
4. **Consistent Information**: All responses align with official store policies and contact details

### File Format Guidelines:

- **Markdown Structure**: All files use markdown for better readability
- **Hierarchical Organization**: Clear headers and sections for easy parsing
- **Direct Links**: Product URLs point directly to thegurtoys.com pages
- **Customer-Friendly Language**: Written in a warm, family-friendly tone

## 🔄 Maintenance & Updates

### Regular Updates Needed:
- **Product Catalog**: Add new products, update URLs, remove discontinued items
- **Contact Information**: Update phone numbers, addresses, or social media links
- **Policies**: Reflect any changes in privacy policy or company information
- **Seasonal Content**: Add holiday-specific products or promotions

### Update Process:
1. Modify relevant `.txt` files
2. Maintain markdown formatting
3. Test AI responses with updated context
4. Deploy changes to Supabase storage bucket

## 📊 Usage Statistics & Optimization

The AI system tracks:
- Most frequently requested product categories
- Common customer questions
- Contact information requests
- Policy-related queries

Use this data to:
- Prioritize product information in context files
- Add FAQ sections for common queries
- Optimize file structure for faster loading
- Improve AI response accuracy

## 🔧 Technical Implementation

### Supabase Integration:
- Files stored in `ai-context` bucket
- Loaded dynamically during API calls
- Cached for performance optimization
- Version controlled for rollback capabilities

### AI Model Context:
- GPT-5 Nano processes structured context data
- Multilingual support (auto-detection)
- Memory system maintains conversation history
- Tone matching for toy store personality

## 🎨 Brand Consistency

### Tone Guidelines:
- **Friendly & Helpful**: Warm, welcoming customer service
- **Family-Oriented**: Understanding of parents' needs
- **Product-Focused**: Knowledgeable about toy categories
- **Safety-Conscious**: Emphasizes age-appropriate recommendations
- **Multilingual**: Responsive in customer's preferred language

### Response Patterns:
- Always include relevant product links
- Provide appropriate contact information
- Suggest alternative products when needed
- Maintain positive, encouraging tone
- Respect privacy and data protection

## 📞 Emergency Contacts

For urgent updates or system issues:
- **Owner**: Kawardeep Singh Khurana - 8300000086
- **General Support**: 9592020898
- **Email**: thegurtoy@gmail.com

---

**This AI customer support system is designed to enhance customer experience while maintaining the personal touch that makes Gurtoy special. Regular maintenance of these context files ensures accurate, helpful, and up-to-date customer service.**