-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  email TEXT,
  name TEXT,
  phone TEXT,
  address TEXT,
  avatar_url TEXT
);

-- Create incidents table if it doesn't exist
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

-- Create storage bucket for media if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'media'
  ) THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);
  END IF;
END$$;

-- Set up RLS policies for profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to view all profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Profiles are viewable by everyone'
  ) THEN
    CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
      FOR SELECT USING (true);
  END IF;
END$$;

-- Allow users to update their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile" ON public.profiles
      FOR UPDATE USING (auth.uid() = id);
  END IF;
END$$;

-- Allow users to insert their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert their own profile'
  ) THEN
    CREATE POLICY "Users can insert their own profile" ON public.profiles
      FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END$$;

-- Set up RLS policies for incidents table
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

-- Allow users to view all incidents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'incidents' AND policyname = 'Incidents are viewable by everyone'
  ) THEN
    CREATE POLICY "Incidents are viewable by everyone" ON public.incidents
      FOR SELECT USING (true);
  END IF;
END$$;

-- Allow users to insert their own incidents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'incidents' AND policyname = 'Users can insert their own incidents'
  ) THEN
    CREATE POLICY "Users can insert their own incidents" ON public.incidents
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;

-- Allow users to update their own incidents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'incidents' AND policyname = 'Users can update their own incidents'
  ) THEN
    CREATE POLICY "Users can update their own incidents" ON public.incidents
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END$$;

-- Create trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END$$;

-- Set up storage policies for media bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.policies WHERE name = 'Media Access' AND bucket_id = 'media'
  ) THEN
    -- Allow public read access to all media files
    INSERT INTO storage.policies (name, bucket_id, definition)
    VALUES (
      'Media Access',
      'media',
      jsonb_build_object(
        'name', 'Media Access',
        'owner', null,
        'resource', 'object',
        'action', 'select',
        'condition', 'true'
      )
    );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.policies WHERE name = 'Media Upload' AND bucket_id = 'media'
  ) THEN
    -- Allow authenticated users to upload media
    INSERT INTO storage.policies (name, bucket_id, definition)
    VALUES (
      'Media Upload',
      'media',
      jsonb_build_object(
        'name', 'Media Upload',
        'owner', null,
        'resource', 'object',
        'action', 'insert',
        'condition', '(auth.role() = ''authenticated'')'
      )
    );
  END IF;
END$$;
