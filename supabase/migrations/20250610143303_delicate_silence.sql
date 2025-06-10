/*
  # Fix RLS policies for users table

  1. Policy Changes
    - Drop the problematic "Admins can manage users" policy that causes infinite recursion
    - Create separate, specific policies for INSERT, UPDATE, and DELETE operations for admins
    - Keep existing "Users can read all profiles" and "Users can update own profile" policies

  2. Security
    - Admins can perform INSERT, UPDATE, DELETE operations on any user record
    - All authenticated users can read all user profiles (existing policy)
    - Users can update their own profile (existing policy)
    - No recursive policy calls that would cause infinite loops
*/

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Admins can manage users" ON users;

-- Create specific admin policies for non-SELECT operations
CREATE POLICY "Admins can insert users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users au
      JOIN users u ON au.id = u.id
      WHERE au.id = auth.uid() AND u.is_admin = true
    )
  );

CREATE POLICY "Admins can update users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users au
      JOIN users u ON au.id = u.id
      WHERE au.id = auth.uid() AND u.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users au
      JOIN users u ON au.id = u.id
      WHERE au.id = auth.uid() AND u.is_admin = true
    )
  );

CREATE POLICY "Admins can delete users"
  ON users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users au
      JOIN users u ON au.id = u.id
      WHERE au.id = auth.uid() AND u.is_admin = true
    )
  );