/*
  # Fix RLS policies for items table

  1. Changes
    - Drop existing policies
    - Create new comprehensive policies for items table
    - Add explicit insert policy
    - Add explicit update policy for current_units

  2. Security
    - Enable public access for all operations
    - Maintain RLS enabled but with permissive policies
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON items;
DROP POLICY IF EXISTS "Enable write access for all users" ON items;
DROP POLICY IF EXISTS "Enable update for all users" ON items;

-- Create new comprehensive policies
CREATE POLICY "Enable read for all"
  ON items FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable insert for all"
  ON items FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Enable update for all"
  ON items FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for all"
  ON items FOR DELETE
  TO public
  USING (true);