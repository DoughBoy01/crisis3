/*
  # Add Shipping Lane Snapshot and Fertilizer Detail to Daily Brief

  ## Summary
  Adds two new JSONB columns to the `daily_brief` table to support
  richer email content without requiring users to open the dashboard:

  1. `shipping_lane_snapshot` — AI-generated RAG status for each of the 5 key
     shipping lanes (Red Sea, Hormuz, Black Sea, Panama, English Channel).
     Stored as an array of objects with: lane, status (RED/AMBER/GREEN),
     statusLabel, impact, freightImpact, latestSignal.

  2. `fertilizer_detail` — Structured intelligence on specific fertilizer
     products: Urea, DAP/MAP, Ammonia, Potash. Each entry includes:
     product, direction (UP/DOWN/STABLE), priceSignal, supplyRisk, actionNote.

  ## Security
  - No new tables; columns added to existing `daily_brief` table
  - Existing RLS policies on `daily_brief` remain unchanged
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_brief' AND column_name = 'shipping_lane_snapshot'
  ) THEN
    ALTER TABLE daily_brief ADD COLUMN shipping_lane_snapshot jsonb DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'daily_brief' AND column_name = 'fertilizer_detail'
  ) THEN
    ALTER TABLE daily_brief ADD COLUMN fertilizer_detail jsonb DEFAULT NULL;
  END IF;
END $$;
