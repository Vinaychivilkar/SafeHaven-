-- Consolidated schema file that combines all necessary migrations

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  email TEXT,
  name TEXT,
  phone TEXT,
  address TEXT,
  avatar_url TEXT
);

-- Create incidents table
CREATE TABLE IF NOT EXISTS public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  latitude FLOAT8 NOT NULL,
  longitude FLOAT8 NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  media_url TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'resolved'))
);

-- Create storage bucket for media
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Set up Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Create policies for incidents
DROP POLICY IF EXISTS "Incidents are viewable by everyone" ON public.incidents;
CREATE POLICY "Incidents are viewable by everyone" 
  ON public.incidents FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own incidents" ON public.incidents;
CREATE POLICY "Users can insert their own incidents" 
  ON public.incidents FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own incidents" ON public.incidents;
CREATE POLICY "Users can update their own incidents" 
  ON public.incidents FOR UPDATE USING (auth.uid() = user_id);

-- Create storage policies
DROP POLICY IF EXISTS "Media is accessible to everyone" ON storage.objects;
CREATE POLICY "Media is accessible to everyone"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

DROP POLICY IF EXISTS "Users can upload media" ON storage.objects;
CREATE POLICY "Users can upload media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'media');

-- Create function to handle new user signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, split_part(NEW.email, '@', 1))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed data with valid UUIDs
INSERT INTO public.profiles (id, created_at, email, name, phone, address, avatar_url)
VALUES
  ('d0e70b5c-4b6d-4a13-a2c4-3e4e8b9d7c6b', NOW(), 'user1@example.com', 'Alex Davis', '+91 9876543210', 'Bandra, Mumbai', NULL),
  ('f1e80c6d-5c7e-5b24-b3d5-4f5f9c8e7d6e', NOW(), 'user2@example.com', 'Jamie Lee', '+91 9876543211', 'Andheri, Mumbai', NULL),
  ('a2f91d7e-6d8f-6c35-c4e6-5a6a0d9f8e7f', NOW(), 'user3@example.com', 'Sam Taylor', '+91 9876543212', 'Dadar, Mumbai', NULL),
  ('b3a02e8f-7e9a-7d46-d5f7-6b7b1e0a9f8a', NOW(), 'user4@example.com', 'Jordan Khan', '+91 9876543213', 'Juhu, Mumbai', NULL)
ON CONFLICT (id) DO NOTHING;

-- Seed data for incidents table with the valid UUIDs
INSERT INTO public.incidents (type, description, location, latitude, longitude, severity, media_url, user_id, status)
VALUES
  ('Suspicious Activity', 'Person looking into car windows in the parking lot', 'Bandra, Mumbai', 19.0596, 72.8295, 'medium', 'https://images.unsplash.com/photo-1517436073-3b1b1b1b1b1b?w=400&q=80', 'd0e70b5c-4b6d-4a13-a2c4-3e4e8b9d7c6b', 'verified'),
  ('Traffic Hazard', 'Large pothole causing cars to swerve suddenly', 'Andheri, Mumbai', 19.1136, 72.8697, 'high', 'https://images.unsplash.com/photo-1544984243-ec57ea16fe25?w=400&q=80', 'f1e80c6d-5c7e-5b24-b3d5-4f5f9c8e7d6e', 'pending'),
  ('Noise Complaint', 'Loud construction work outside permitted hours', 'Dadar, Mumbai', 19.0178, 72.8478, 'low', NULL, 'a2f91d7e-6d8f-6c35-c4e6-5a6a0d9f8e7f', 'resolved'),
  ('Property Damage', 'Graffiti on the wall of the community center', 'Juhu, Mumbai', 19.1075, 72.8263, 'medium', 'https://images.unsplash.com/photo-1580745294621-26c6873c38e7?w=400&q=80', 'b3a02e8f-7e9a-7d46-d5f7-6b7b1e0a9f8a', 'pending')
ON CONFLICT DO NOTHING;
