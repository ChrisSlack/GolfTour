/*
  # Fix User Profile Issues and Setup Admin

  1. User Profile Management
    - Create trigger to automatically create user profile on auth signup
    - Fix RLS policies to avoid recursion
    - Optimize queries for better performance

  2. Admin Setup
    - Function to promote existing users to admin
    - Ensure proper admin access

  3. Performance Improvements
    - Add indexes for common queries
    - Simplify RLS policies
*/

-- First, let's create a function to automatically create user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, surname, handicap)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', ''),
    COALESCE(new.raw_user_meta_data->>'surname', ''),
    COALESCE((new.raw_user_meta_data->>'handicap')::integer, 18)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Drop all existing problematic policies
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "Users can read all profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Create simplified, non-recursive policies
CREATE POLICY "Enable read access for authenticated users"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can insert users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT is_admin FROM users WHERE id = auth.uid()) = true
  );

CREATE POLICY "Admins can update any user"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT is_admin FROM users WHERE id = auth.uid()) = true
  );

CREATE POLICY "Admins can delete users"
  ON users
  FOR DELETE
  TO authenticated
  USING (
    (SELECT is_admin FROM users WHERE id = auth.uid()) = true
  );

-- Function to promote a user to admin (can be called manually)
CREATE OR REPLACE FUNCTION promote_user_to_admin(user_email text)
RETURNS void AS $$
BEGIN
  UPDATE users 
  SET is_admin = true 
  WHERE email = user_email;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create user profile for any existing auth users that don't have profiles
INSERT INTO users (id, email, name, surname, handicap, is_admin)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', 'User'),
  COALESCE(au.raw_user_meta_data->>'surname', ''),
  COALESCE((au.raw_user_meta_data->>'handicap')::integer, 18),
  false
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE u.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_users_email_admin ON users(email, is_admin);
CREATE INDEX IF NOT EXISTS idx_users_admin ON users(is_admin) WHERE is_admin = true;

-- Create a default tour if none exists
INSERT INTO tours (name, year, is_active)
SELECT 'Portugal Golf Trip', 2025, true
WHERE NOT EXISTS (SELECT 1 FROM tours WHERE year = 2025);