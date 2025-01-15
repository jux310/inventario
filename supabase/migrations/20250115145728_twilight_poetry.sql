/*
  # Set up anonymous authentication

  1. Changes
    - Create an anonymous user for basic authentication
    - Enable email authentication
    - Set up authentication policies
*/

-- Enable email authentication
UPDATE auth.providers
SET enabled = true
WHERE provider = 'email';

-- Create anonymous user if it doesn't exist
DO $$
DECLARE
  user_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'anonymous@example.com'
  ) INTO user_exists;

  IF NOT user_exists THEN
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    )
    VALUES (
      gen_random_uuid(),
      auth.uid(),
      jsonb_build_object(
        'sub', auth.uid(),
        'email', 'anonymous@example.com'
      ),
      'email',
      now(),
      now(),
      now()
    );
  END IF;
END $$;