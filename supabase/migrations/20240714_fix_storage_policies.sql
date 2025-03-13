-- Create storage schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS storage;

-- Create storage.buckets table if it doesn't exist
CREATE TABLE IF NOT EXISTS storage.buckets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  public BOOLEAN DEFAULT FALSE
);

-- Create storage.objects table if it doesn't exist
CREATE TABLE IF NOT EXISTS storage.objects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bucket_id TEXT REFERENCES storage.buckets(id),
  name TEXT,
  owner UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB,
  path_tokens TEXT[] GENERATED ALWAYS AS (string_to_array(name, '/')) STORED
);

-- Create storage.policies table if it doesn't exist
CREATE TABLE IF NOT EXISTS storage.policies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  bucket_id TEXT REFERENCES storage.buckets(id),
  definition JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure media bucket exists
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Recreate storage policies
DROP POLICY IF EXISTS "Media is accessible to everyone" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload media" ON storage.objects;

CREATE POLICY "Media is accessible to everyone"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

CREATE POLICY "Users can upload media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'media');

-- Add policy to storage.policies table
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES ('Media Access', 'media', '{"version": "1", "statements": [{"effect": "allow", "principal": "*", "action": "select"}]}')
ON CONFLICT DO NOTHING;
