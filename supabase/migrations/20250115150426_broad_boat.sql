/*
  # Add description field to items table

  1. Changes
    - Add description column to items table
*/

ALTER TABLE items ADD COLUMN IF NOT EXISTS description text;