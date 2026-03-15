/*
  # Add persona preference to email_subscriptions

  ## Summary
  Adds a `persona` column to the `email_subscriptions` table so that the morning brief
  email can be personalised to each subscriber's role.

  ## Changes
  ### Modified Tables
  - `email_subscriptions`
    - New column `persona` (text, default 'general') — stores the subscriber's chosen
      persona: 'general' | 'trader' | 'agri' | 'logistics' | 'analyst'
    - A CHECK constraint ensures only valid persona values are accepted

  ## Notes
  - Existing subscribers default to 'general' (plain-English business overview)
  - No data is lost; this is an additive change only
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_subscriptions' AND column_name = 'persona'
  ) THEN
    ALTER TABLE email_subscriptions
      ADD COLUMN persona text NOT NULL DEFAULT 'general'
      CHECK (persona IN ('general', 'trader', 'agri', 'logistics', 'analyst'));
  END IF;
END $$;
