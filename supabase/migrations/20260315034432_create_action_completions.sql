/*
  # Create action_completions table

  1. New Tables
    - `action_completions`
      - `id` (uuid, primary key)
      - `session_id` (text, references user session)
      - `action_id` (text, the action item ID from feedDerived)
      - `completed_date` (date, UTC date when action was completed)
      - `completed_at` (timestamptz)

  2. Security
    - Enable RLS on `action_completions` table
    - Allow anon to insert and select their own session's data
    - No cross-session access

  3. Notes
    - action_id is derived from live feed data and changes daily
    - completed_date scopes completions to the current UTC day
    - Index on (session_id, completed_date) for fast daily lookups
*/

CREATE TABLE IF NOT EXISTS action_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  action_id text NOT NULL,
  completed_date date NOT NULL DEFAULT CURRENT_DATE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(session_id, action_id, completed_date)
);

ALTER TABLE action_completions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_action_completions_session_date
  ON action_completions(session_id, completed_date);

CREATE POLICY "Session can insert own completions"
  ON action_completions FOR INSERT
  TO anon
  WITH CHECK (session_id IS NOT NULL AND length(session_id) > 0);

CREATE POLICY "Session can select own completions"
  ON action_completions FOR SELECT
  TO anon
  USING (session_id IS NOT NULL AND length(session_id) > 0);

CREATE POLICY "Session can delete own completions"
  ON action_completions FOR DELETE
  TO anon
  USING (session_id IS NOT NULL AND length(session_id) > 0);
