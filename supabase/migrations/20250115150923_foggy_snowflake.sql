/*
  # Add description field to items

  1. Changes
    - Add optional description text field to items table if it doesn't exist
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'description'
  ) THEN
    ALTER TABLE items ADD COLUMN description text;
  END IF;
END $$;