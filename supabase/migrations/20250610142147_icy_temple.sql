/*
  # Golf Trip Database Schema

  1. New Tables
    - `users` - User profiles with golf-specific data
    - `tours` - Golf tour information (2025, 2026, etc.)
    - `courses` - Golf courses with hole data
    - `teams` - Team organization
    - `team_members` - Team membership relationships
    - `scores` - Individual hole scores
    - `fines` - Fine tracking system

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Team captains can manage their team data
    - Users can view their own data

  3. Constraints
    - Max 4 members per team
    - One captain per team
    - Valid handicap range (0-54)
    - Positive scores and fine amounts
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  surname text NOT NULL,
  handicap integer CHECK (handicap >= 0 AND handicap <= 54) DEFAULT 18,
  invited_by uuid REFERENCES users(id),
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tours table
CREATE TABLE IF NOT EXISTS tours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  year integer NOT NULL,
  start_date date,
  end_date date,
  location text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id uuid REFERENCES tours(id) ON DELETE CASCADE,
  name text NOT NULL,
  par integer NOT NULL DEFAULT 72,
  holes jsonb NOT NULL DEFAULT '[]',
  play_date date,
  created_at timestamptz DEFAULT now()
);

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id uuid REFERENCES tours(id) ON DELETE CASCADE,
  name text NOT NULL,
  captain_id uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(tour_id, name)
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Create scores table
CREATE TABLE IF NOT EXISTS scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  hole_number integer CHECK (hole_number >= 1 AND hole_number <= 18),
  strokes integer CHECK (strokes > 0),
  recorded_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, course_id, hole_number)
);

-- Create fines table
CREATE TABLE IF NOT EXISTS fines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  tour_id uuid REFERENCES tours(id) ON DELETE CASCADE,
  amount decimal(10,2) CHECK (amount > 0),
  reason text NOT NULL,
  description text,
  recorded_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE fines ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read all profiles"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can manage users"
  ON users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Tours policies
CREATE POLICY "Anyone can read tours"
  ON tours FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage tours"
  ON tours FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Courses policies
CREATE POLICY "Anyone can read courses"
  ON courses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage courses"
  ON courses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Teams policies
CREATE POLICY "Anyone can read teams"
  ON teams FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Captains and admins can manage teams"
  ON teams FOR ALL
  TO authenticated
  USING (
    captain_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Team members policies
CREATE POLICY "Anyone can read team members"
  ON team_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Captains and admins can manage team members"
  ON team_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams 
      WHERE id = team_id AND captain_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Scores policies
CREATE POLICY "Users can read all scores"
  ON scores FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage own scores"
  ON scores FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Captains can manage team scores"
  ON scores FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      JOIN teams t ON tm.team_id = t.id
      WHERE tm.user_id = scores.user_id 
      AND t.captain_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all scores"
  ON scores FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Fines policies
CREATE POLICY "Users can read all fines"
  ON fines FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage own fines"
  ON fines FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Captains can manage team fines"
  ON fines FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      JOIN teams t ON tm.team_id = t.id
      WHERE tm.user_id = fines.user_id 
      AND t.captain_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all fines"
  ON fines FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_user_course ON scores(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_fines_user_tour ON fines(user_id, tour_id);

-- Function to ensure team size limit
CREATE OR REPLACE FUNCTION check_team_size()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM team_members WHERE team_id = NEW.team_id) >= 4 THEN
    RAISE EXCEPTION 'Team cannot have more than 4 members';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce team size limit
CREATE TRIGGER enforce_team_size
  BEFORE INSERT ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION check_team_size();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scores_updated_at
  BEFORE UPDATE ON scores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();