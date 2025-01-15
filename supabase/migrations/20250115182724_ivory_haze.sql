/*
  # Add trash feature
  
  1. Changes
    - Add `deleted` column to items table
    - Update policies to handle deleted items
    - Add index for deleted column
*/

-- Add deleted column to items table
ALTER TABLE items ADD COLUMN IF NOT EXISTS deleted boolean DEFAULT false;

-- Add index for deleted column
CREATE INDEX IF NOT EXISTS idx_items_deleted ON items (deleted);

-- Update policies to handle deleted items
DROP POLICY IF EXISTS "items_select_policy" ON items;
CREATE POLICY "items_select_policy"
  ON items FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "items_update_policy" ON items;
CREATE POLICY "items_update_policy"
  ON items FOR UPDATE
  USING (true)
  WITH CHECK (true);