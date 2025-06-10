/*
  # Performance optimization migration

  1. Indexes
    - Add composite indexes for common queries
    - Add partial indexes for better performance
  
  2. Functions
    - Optimize user profile creation
    - Add better error handling
  
  3. Policies
    - Simplify RLS policies for better performance
*/

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = true;

-- Optimize the user profile creation function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, surname, handicap, is_admin)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', ''),
    COALESCE(new.raw_user_meta_data->>'surname', ''),
    COALESCE((new.raw_user_meta_data->>'handicap')::integer, 18),
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth process
    RAISE WARNING 'Failed to create user profile for %: %', new.id, SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a simple function to check if user is admin (for better performance)
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = user_id AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Update RLS policies to use the function for better performance
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can update any user" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

CREATE POLICY "Admins can insert users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update any user"
  ON users
  FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete users"
  ON users
  FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_team_members_team_user ON team_members(team_id, user_id);
CREATE INDEX IF NOT EXISTS idx_scores_user_course_hole ON scores(user_id, course_id, hole_number);
CREATE INDEX IF NOT EXISTS idx_fines_user_tour ON fines(user_id, tour_id);
CREATE INDEX IF NOT EXISTS idx_courses_tour_date ON courses(tour_id, play_date);

-- Analyze tables for better query planning
ANALYZE users;
ANALYZE tours;
ANALYZE courses;
ANALYZE teams;
ANALYZE team_members;
ANALYZE scores;
ANALYZE fines;