/*
  # Seed Initial Data

  1. Create Portugal Golf Trip 2025 tour
  2. Add golf courses with hole data
  3. Create sample admin user (will be replaced with real auth)
*/

-- Insert Portugal Golf Trip 2025
INSERT INTO tours (name, year, start_date, end_date, location, is_active)
VALUES (
  'Portugal Golf Trip',
  2025,
  '2025-07-01',
  '2025-07-06',
  'Algarve, Portugal',
  true
) ON CONFLICT DO NOTHING;

-- Get the tour ID for course insertion
DO $$
DECLARE
  tour_uuid uuid;
BEGIN
  SELECT id INTO tour_uuid FROM tours WHERE year = 2025 AND name = 'Portugal Golf Trip';
  
  -- Insert NAU Morgado Course
  INSERT INTO courses (tour_id, name, par, play_date, holes)
  VALUES (
    tour_uuid,
    'NAU Morgado Course',
    73,
    '2025-07-02',
    '[
      {"par": 4, "hcp": 13}, {"par": 5, "hcp": 3}, {"par": 4, "hcp": 7}, {"par": 5, "hcp": 1},
      {"par": 3, "hcp": 15}, {"par": 4, "hcp": 11}, {"par": 4, "hcp": 9}, {"par": 3, "hcp": 17},
      {"par": 5, "hcp": 5}, {"par": 4, "hcp": 12}, {"par": 4, "hcp": 4}, {"par": 3, "hcp": 16},
      {"par": 4, "hcp": 10}, {"par": 4, "hcp": 2}, {"par": 5, "hcp": 6}, {"par": 3, "hcp": 18},
      {"par": 4, "hcp": 14}, {"par": 4, "hcp": 8}
    ]'::jsonb
  ) ON CONFLICT DO NOTHING;

  -- Insert Amendoeira Golf Resort (Faldo Course)
  INSERT INTO courses (tour_id, name, par, play_date, holes)
  VALUES (
    tour_uuid,
    'Amendoeira Golf Resort (Faldo Course)',
    72,
    '2025-07-03',
    '[
      {"par": 4, "hcp": 9}, {"par": 4, "hcp": 5}, {"par": 4, "hcp": 1}, {"par": 5, "hcp": 7},
      {"par": 3, "hcp": 17}, {"par": 4, "hcp": 13}, {"par": 5, "hcp": 3}, {"par": 3, "hcp": 15},
      {"par": 4, "hcp": 11}, {"par": 4, "hcp": 10}, {"par": 5, "hcp": 2}, {"par": 4, "hcp": 6},
      {"par": 3, "hcp": 18}, {"par": 4, "hcp": 14}, {"par": 4, "hcp": 8}, {"par": 5, "hcp": 4},
      {"par": 3, "hcp": 16}, {"par": 4, "hcp": 12}
    ]'::jsonb
  ) ON CONFLICT DO NOTHING;

  -- Insert Quinta do Lago South Course
  INSERT INTO courses (tour_id, name, par, play_date, holes)
  VALUES (
    tour_uuid,
    'Quinta do Lago South Course',
    71,
    '2025-07-05',
    '[
      {"par": 4, "hcp": 6}, {"par": 5, "hcp": 12}, {"par": 4, "hcp": 2}, {"par": 4, "hcp": 16},
      {"par": 3, "hcp": 18}, {"par": 4, "hcp": 8}, {"par": 5, "hcp": 4}, {"par": 3, "hcp": 14},
      {"par": 4, "hcp": 10}, {"par": 4, "hcp": 7}, {"par": 4, "hcp": 1}, {"par": 3, "hcp": 17},
      {"par": 4, "hcp": 13}, {"par": 4, "hcp": 3}, {"par": 5, "hcp": 11}, {"par": 3, "hcp": 15},
      {"par": 4, "hcp": 9}, {"par": 4, "hcp": 5}
    ]'::jsonb
  ) ON CONFLICT DO NOTHING;
END $$;