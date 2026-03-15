/*
  # Add procurement_actions and market_outlook to daily_brief

  1. Changes
    - `daily_brief` table
      - Add `procurement_actions` (text[]) — array of specific recommended actions from AI
      - Add `market_outlook` (text) — what to watch during the trading session today

  2. Notes
    - Both columns are nullable so existing rows are unaffected
    - No RLS changes needed (existing policies cover these columns)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_brief' AND column_name = 'procurement_actions'
  ) THEN
    ALTER TABLE daily_brief ADD COLUMN procurement_actions text[] DEFAULT '{}';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_brief' AND column_name = 'market_outlook'
  ) THEN
    ALTER TABLE daily_brief ADD COLUMN market_outlook text DEFAULT '';
  END IF;
END $$;
