/*
  # Create storage bucket for item images

  1. Changes
    - Create a new storage bucket for item images
    - Set up RLS policies for the bucket
  
  2. Security
    - Enable authenticated users to upload and read images
*/

-- Create a new storage bucket for item images
INSERT INTO storage.buckets (id, name, public)
VALUES ('items', 'items', true);

-- Create policies for the bucket
CREATE POLICY "Enable read access for all users"
ON storage.objects FOR SELECT
USING (bucket_id = 'items');

CREATE POLICY "Enable insert access for authenticated users"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'items');

CREATE POLICY "Enable update access for authenticated users"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'items');

CREATE POLICY "Enable delete access for authenticated users"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'items');