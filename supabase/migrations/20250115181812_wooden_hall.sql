/*
  # Clean database for production

  1. Changes
    - Remove all test data from tables
    - Remove all files from storage
    - Keep table structure and policies intact

  2. Important Notes
    - This is a one-time cleanup operation
    - All existing data will be permanently deleted
    - Table structure, indexes, and policies remain unchanged
*/

-- Clean inventory_history table
TRUNCATE TABLE inventory_history;

-- Clean items table
TRUNCATE TABLE items CASCADE;

-- Clean storage
DO $$
BEGIN
  -- Delete all files in the items bucket
  DELETE FROM storage.objects
  WHERE bucket_id = 'items';
END $$;