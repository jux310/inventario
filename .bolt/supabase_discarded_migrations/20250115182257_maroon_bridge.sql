/*
  # Fix Supabase connection and policies

  1. Changes
    - Drop and recreate all policies with proper permissions
    - Add explicit policies for inventory_history
    - Ensure storage policies are correct
    - Add missing indexes for performance

  2. Security
    - Enable public access for all operations
    - Maintain RLS but with permissive policies
*/

-- First, drop all existing policies to start fresh
DROP POLICY IF EXISTS "Enable read for all" ON items;
DROP POLICY IF EXISTS "Enable insert for all" ON items;
DROP POLICY IF EXISTS "Enable update for all" ON items;
DROP POLICY IF EXISTS "Enable delete for all" ON items;
DROP POLICY IF EXISTS "Enable read access for all users" ON inventory_history;
DROP POLICY IF EXISTS "Enable write access for all users" ON inventory_history;

-- Create comprehensive policies for items table
CREATE POLICY "items_select_policy"
  ON items FOR SELECT
  USING (true);

CREATE POLICY "items_insert_policy"
  ON items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "items_update_policy"
  ON items FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "items_delete_policy"
  ON items FOR DELETE
  USING (true);

-- Create comprehensive policies for inventory_history table
CREATE POLICY "history_select_policy"
  ON inventory_history FOR SELECT
  USING (true);

CREATE POLICY "history_insert_policy"
  ON inventory_history FOR INSERT
  WITH CHECK (true);

-- Ensure storage policies are correct
DROP POLICY IF EXISTS "Enable read access for all users" ON storage.objects;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON storage.objects;

CREATE POLICY "storage_select_policy"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'items');

CREATE POLICY "storage_insert_policy"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'items');

CREATE POLICY "storage_update_policy"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'items');

CREATE POLICY "storage_delete_policy"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'items');

-- Add or update indexes for better performance
DROP INDEX IF EXISTS idx_items_name;
DROP INDEX IF EXISTS idx_inventory_history_item_id;
DROP INDEX IF EXISTS idx_inventory_history_created_at;

CREATE INDEX IF NOT EXISTS idx_items_name ON items (name);
CREATE INDEX IF NOT EXISTS idx_inventory_history_item_id ON inventory_history (item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_history_created_at ON inventory_history (created_at DESC);

-- Verify RLS is enabled
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_history ENABLE ROW LEVEL SECURITY;