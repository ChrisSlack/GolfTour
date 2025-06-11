/*
  # Fix RLS policies for users table

  1. Security Changes
    - Drop existing restrictive policies that prevent profile creation and reading
    - Add policy for authenticated users to read their own profile data
    - Add policy for authenticated users to create their own profile
    - Keep existing admin and update policies intact

  2. Changes Made
    - Enable authenticated users to SELECT their own user data
    - Enable authenticated users to INSERT their own profile during registration
    - Maintain existing admin privileges and user update capabilities
*/

-- Drop the existing restrictive read policy if it exists
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;

-- Create a new policy that allows users to read their own profile
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Create a policy that allows users to create their own profile during registration
CREATE POLICY "Users can create own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);