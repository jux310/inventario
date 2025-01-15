/*
  # Create Items and Inventory History Tables

  1. New Tables
    - `items`
      - `id` (uuid, primary key)
      - `name` (text)
      - `image_url` (text)
      - `current_units` (integer)
      - `restock_point` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `inventory_history`
      - `id` (uuid, primary key)
      - `item_id` (uuid, foreign key)
      - `units` (integer)
      - `type` (text) - 'add' or 'remove'
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create items table
CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  image_url text,
  current_units integer NOT NULL DEFAULT 0,
  restock_point integer NOT NULL DEFAULT 10,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create inventory history table
CREATE TABLE IF NOT EXISTS inventory_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES items(id) ON DELETE CASCADE,
  units integer NOT NULL,
  type text NOT NULL CHECK (type IN ('add', 'remove')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON items
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON items
  FOR UPDATE TO authenticated USING (true);

-- History policies
CREATE POLICY "Enable read access for authenticated users" ON inventory_history
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON inventory_history
  FOR INSERT TO authenticated WITH CHECK (true);

-- Function to update items.updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();