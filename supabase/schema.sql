-- Gurtoy AI Customer Support Database Schema
-- This schema defines the database structure for the AI chat system

-- Enable Row Level Security
-- This ensures users can only access their own data
-- Note: JWT secret is automatically handled by Supabase

-- Users Table
-- Stores customer information and preferences
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  name TEXT NOT NULL,
  preferred_language TEXT DEFAULT 'en',
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Chats Table
-- Stores all chat messages between users and the AI assistant
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  tokens_used INTEGER DEFAULT 0,
  response_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for chats table
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_created_at ON chats(created_at);
CREATE INDEX IF NOT EXISTS idx_chats_role ON chats(role);

-- Chat Sessions Table (Optional - for grouping related conversations)
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'New Conversation',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  message_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- Indexes for chat_sessions table
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_active ON chat_sessions(is_active);

-- Feedback Table
-- Stores user feedback on AI responses for improvement
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_type TEXT CHECK (feedback_type IN ('helpful', 'not_helpful', 'inappropriate', 'other')),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for feedback table
CREATE INDEX IF NOT EXISTS idx_feedback_chat_id ON feedback(chat_id);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON feedback(rating);

-- Context Files Tracking Table
-- Tracks when context files were last updated for cache invalidation
CREATE TABLE IF NOT EXISTS context_files_meta (
  filename TEXT PRIMARY KEY,
  last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  file_size INTEGER,
  checksum TEXT,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true
);

-- Analytics Table
-- Basic analytics for system performance and usage
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for analytics_events table
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at);

-- Functions and Triggers

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update trigger to users table
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get chat history for a user
CREATE OR REPLACE FUNCTION get_user_chat_history(user_uuid UUID, limit_count INTEGER DEFAULT 20)
RETURNS TABLE(
    id UUID,
    message TEXT,
    role TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    tokens_used INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT c.id, c.message, c.role, c.created_at, c.tokens_used
    FROM chats c
    WHERE c.user_id = user_uuid
    ORDER BY c.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old chats (for privacy compliance)
CREATE OR REPLACE FUNCTION cleanup_old_chats(days_old INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM chats 
    WHERE created_at < NOW() - INTERVAL '1 day' * days_old;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own data" ON users
    FOR ALL USING (id = auth.uid()::uuid);

CREATE POLICY "Users can insert own data" ON users
    FOR INSERT WITH CHECK (id = auth.uid()::uuid);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (id = auth.uid()::uuid);

-- Chats policies
CREATE POLICY "Users can view own chats" ON chats
    FOR ALL USING (user_id = auth.uid()::uuid);

CREATE POLICY "Users can insert own chats" ON chats
    FOR INSERT WITH CHECK (user_id = auth.uid()::uuid);

-- Chat sessions policies
CREATE POLICY "Users can manage own sessions" ON chat_sessions
    FOR ALL USING (user_id = auth.uid()::uuid);

-- Feedback policies
CREATE POLICY "Users can manage own feedback" ON feedback
    FOR ALL USING (user_id = auth.uid()::uuid);

-- Initial data for context files tracking
INSERT INTO context_files_meta (filename, last_modified, is_active) 
VALUES 
    ('product.txt', NOW(), true),
    ('contact.txt', NOW(), true),
    ('privacy.txt', NOW(), true),
    ('detail.txt', NOW(), true)
ON CONFLICT (filename) DO NOTHING;

-- Create storage bucket for context files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('ai-context', 'ai-context', false)
ON CONFLICT DO NOTHING;

-- Storage policies for context files
CREATE POLICY "Public can read context files" ON storage.objects
    FOR SELECT USING (bucket_id = 'ai-context');

CREATE POLICY "Admins can manage context files" ON storage.objects
    FOR ALL USING (bucket_id = 'ai-context' AND auth.jwt() ->> 'role' = 'admin');

-- Additional composite indexes for better performance on common queries
CREATE INDEX IF NOT EXISTS idx_chats_user_created 
    ON chats(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chats_user_role_created 
    ON chats(user_id, role, created_at DESC);

-- Comments for documentation
COMMENT ON TABLE users IS 'Customer information and preferences';
COMMENT ON TABLE chats IS 'Chat messages between users and AI assistant';
COMMENT ON TABLE feedback IS 'User feedback on AI responses for improvement';
COMMENT ON TABLE context_files_meta IS 'Metadata for context files used by AI';
COMMENT ON TABLE analytics_events IS 'System usage and performance analytics';

COMMENT ON COLUMN chats.tokens_used IS 'Number of tokens consumed by this message';
COMMENT ON COLUMN chats.response_time_ms IS 'AI response time in milliseconds';
COMMENT ON COLUMN users.metadata IS 'Additional user preferences and settings';
COMMENT ON COLUMN chats.metadata IS 'Additional message metadata (model used, temperature, etc.)';

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;