/*
  # Add top_decision to daily_brief

  ## Summary
  Adds a structured `top_decision` JSONB column to the `daily_brief` table.
  This stores the single most important purchasing decision for the day,
  including the signal type (BUY/HOLD/ACT/WATCH), a specific deadline,
  estimated £ impact, the market it relates to, and the core rationale.

  ## New Columns
  - `top_decision` (jsonb, nullable): Structured object with fields:
    - `signal`: "BUY" | "HOLD" | "ACT" | "WATCH"
    - `headline`: Short imperative sentence (e.g. "Lock in diesel before 09:30 UK")
    - `deadline`: e.g. "before 09:30 UK" or "within 24h"
    - `market`: e.g. "Diesel / Brent Crude"
    - `gbp_impact`: e.g. "£8,400 exposure on 50,000L order"
    - `rationale`: 1-2 sentences of evidence
    - `confidence`: "HIGH" | "MEDIUM" | "LOW"
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_brief' AND column_name = 'top_decision'
  ) THEN
    ALTER TABLE daily_brief ADD COLUMN top_decision jsonb;
  END IF;
END $$;
