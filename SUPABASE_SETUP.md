# SafeHaven Supabase Setup Guide

## Overview

This guide will help you set up your Supabase project for the SafeHaven community safety app. The app uses Supabase for:

- User authentication
- Profile management
- Incident reporting and tracking
- Media storage
- Comments and interactions

## Prerequisites

1. A Supabase account (sign up at [supabase.com](https://supabase.com))
2. A new or existing Supabase project
3. Node.js installed on your machine

## Setup Steps

### 1. Create a Supabase Project

If you haven't already, create a new Supabase project from the Supabase dashboard.

### 2. Get Your Supabase Credentials

From your Supabase project dashboard:

1. Go to Project Settings > API
2. Copy your Project URL and anon/public key
3. Update the `.env` file in your project with these values:

```
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Create Database Tables

You have two options to create the necessary database tables:

#### Option A: Run the Migration Script

```bash
npx supabase migration up
```

This will run the migration file located at `supabase/migrations/20240801_create_tables.sql`.

#### Option B: Manual Setup

You can manually create the tables by running the SQL commands in the Supabase SQL editor. The SQL commands are available in the `supabase/migrations/20240801_create_tables.sql` file.

### 4. Set Up Storage

1. Go to Storage in your Supabase dashboard
2. Create a new bucket called `media`
3. Set the bucket to public

### 5. Configure Authentication

1. Go to Authentication > Settings in your Supabase dashboard
2. Under Email Auth, make sure "Enable Email Signup" is turned on
3. Optionally, configure additional auth providers as needed

### 6. Generate TypeScript Types

To generate TypeScript types for your Supabase schema, run:

```bash
npm run types:supabase
```

Or manually:

```bash
npx supabase gen types typescript --project-id your_project_id > src/types/supabase.ts
```

## Database Schema

### Tables

1. **profiles** - User profile information
   - Linked to auth.users via foreign key
   - Contains name, email, phone, address, avatar_url

2. **incidents** - Safety incident reports
   - Contains type, description, location, coordinates, severity, media_url
   - Linked to user who reported it
   - Has status (pending, verified, resolved, deleted)

3. **comments** - User comments on incidents
   - Linked to incidents and users

### Row Level Security (RLS) Policies

The migration sets up the following RLS policies:

- Profiles are viewable by everyone
- Users can only insert/update their own profile
- Incidents are viewable by everyone
- Users can only insert/update their own incidents
- Admin users can update any incident
- Comments are viewable by everyone
- Users can only insert/update their own comments

## Testing Your Setup

After completing the setup, you can test your Supabase integration by:

1. Creating a new user account in the app
2. Submitting an incident report
3. Checking the Supabase dashboard to verify the data was saved correctly

## Troubleshooting

### Common Issues

1. **Foreign Key Constraint Errors**
   - Make sure the auth.users table exists and contains the user ID before trying to create a profile
   - The trigger should automatically create profiles for new users

2. **Storage Permission Errors**
   - Check that your storage bucket is set to public or has appropriate RLS policies

3. **Authentication Issues**
   - Verify your Supabase URL and anon key are correct in the .env file
   - Check that email auth is enabled in your Supabase settings

### Getting Help

If you encounter issues with your Supabase setup, you can:

- Check the Supabase documentation at [supabase.com/docs](https://supabase.com/docs)
- Join the Supabase Discord community
- Open an issue in the project repository
