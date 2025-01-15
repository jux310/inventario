/*
  # Add description field and update policies

  1. Changes
    - Add optional description text field to items table
    - Update policies to allow anonymous access
  
  2. Security
    - Enable public access to items and inventory_history
    - Keep RLS enabled but allow all operations
*/

-- Add description column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'description'
  ) THEN
    ALTER TABLE items ADD COLUMN description text;
  END IF;
END $$;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable full access for authenticated users" ON items;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON inventory_history;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON inventory_history;

-- Create new policies for public access
CREATE POLICY "Enable full access for all users" ON items
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable full access for all users" ON inventory_history
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);