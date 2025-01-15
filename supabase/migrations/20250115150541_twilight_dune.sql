/*
  # Add description field to items table

  1. Changes
    - Add `description` column to `items` table
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