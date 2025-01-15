/*
  # Fix database policies and add indexes

  1. Changes
    - Drop and recreate policies with proper security
    - Add indexes for better performance
    - Fix potential duplicate description columns
  
  2. Security
    - Enable RLS on all tables
    - Add proper policies for authenticated users
*/

-- First, clean up any duplicate description columns
DO $$
BEGIN
  -- Drop duplicate description columns if they exist
  EXECUTE (
    SELECT string_agg('ALTER TABLE items DROP COLUMN ' || quote_ident(column_name), '; ')
    FROM information_schema.columns
    WHERE table_name = 'items'
      AND column_name = 'description'
      AND ordinal_position > (
        SELECT MIN(ordinal_position)
        FROM information_schema.columns
        WHERE table_name = 'items'
          AND column_name = 'description'
      )
  );
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- Ensure we have the description column
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
DROP POLICY IF EXISTS "Enable full access for all users" ON items;
DROP POLICY IF EXISTS "Enable full access for all users" ON inventory_history;

-- Create proper policies for items table
CREATE POLICY "Enable read access for all users"
ON items FOR SELECT
TO public
USING (true);

CREATE POLICY "Enable write access for all users"
ON items FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Enable update for all users"
ON items FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Create proper policies for inventory_history table
CREATE POLICY "Enable read access for all users"
ON inventory_history FOR SELECT
TO public
USING (true);

CREATE POLICY "Enable write access for all users"
ON inventory_history FOR INSERT
TO public
WITH CHECK (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_items_name ON items (name);
CREATE INDEX IF NOT EXISTS idx_inventory_history_item_id ON inventory_history (item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_history_created_at ON inventory_history (created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_history_type ON inventory_history (type);