/*
  # Fix RLS policies for items table

  1. Changes
    - Drop existing policies
    - Create new policies with proper permissions for all operations
  
  2. Security
    - Enable full CRUD access for authenticated users
    - Maintain RLS enabled
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON items;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON items;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON items;

-- Create new comprehensive policies
CREATE POLICY "Enable full access for authenticated users" ON items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);