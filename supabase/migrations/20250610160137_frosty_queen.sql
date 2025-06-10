/*
  # Add Score Statistics and Tracking

  1. New Columns
    - Add `three_putt` boolean to scores table for tracking 3-putts
    - Add `ring` boolean to scores table for tracking rings (hitting the pin)
    
  2. Security
    - Maintain existing RLS policies
    - No changes to permissions needed
*/

-- Add new columns to scores table for statistics tracking
DO $$
BEGIN
  -- Add three_putt column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scores' AND column_name = 'three_putt'
  ) THEN
    ALTER TABLE scores ADD COLUMN three_putt boolean DEFAULT false;
  END IF;

  -- Add ring column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scores' AND column_name = 'ring'
  ) THEN
    ALTER TABLE scores ADD COLUMN ring boolean DEFAULT false;
  END IF;
END $$;