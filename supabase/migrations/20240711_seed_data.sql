-- Seed data for profiles table
INSERT INTO public.profiles (id, created_at, email, name, phone, address, avatar_url)
VALUES
  ('mock-user1', NOW(), 'user1@example.com', 'Alex Davis', '+91 9876543210', 'Bandra, Mumbai', NULL),
  ('mock-user2', NOW(), 'user2@example.com', 'Jamie Lee', '+91 9876543211', 'Andheri, Mumbai', NULL),
  ('mock-user3', NOW(), 'user3@example.com', 'Sam Taylor', '+91 9876543212', 'Dadar, Mumbai', NULL),
  ('mock-user4', NOW(), 'user4@example.com', 'Jordan Khan', '+91 9876543213', 'Juhu, Mumbai', NULL)
ON CONFLICT (id) DO NOTHING;

-- Seed data for incidents table
INSERT INTO public.incidents (type, description, location, latitude, longitude, severity, media_url, user_id, status)
VALUES
  ('Suspicious Activity', 'Person looking into car windows in the parking lot', 'Bandra, Mumbai', 19.0596, 72.8295, 'medium', 'https://images.unsplash.com/photo-1517436073-3b1b1b1b1b1b?w=400&q=80', 'mock-user1', 'verified'),
  ('Traffic Hazard', 'Large pothole causing cars to swerve suddenly', 'Andheri, Mumbai', 19.1136, 72.8697, 'high', 'https://images.unsplash.com/photo-1544984243-ec57ea16fe25?w=400&q=80', 'mock-user2', 'pending'),
  ('Noise Complaint', 'Loud construction work outside permitted hours', 'Dadar, Mumbai', 19.0178, 72.8478, 'low', NULL, 'mock-user3', 'resolved'),
  ('Property Damage', 'Graffiti on the wall of the community center', 'Juhu, Mumbai', 19.1075, 72.8263, 'medium', 'https://images.unsplash.com/photo-1580745294621-26c6873c38e7?w=400&q=80', 'mock-user4', 'pending')
ON CONFLICT DO NOTHING;
