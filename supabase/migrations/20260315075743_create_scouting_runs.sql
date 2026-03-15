/*
  # Create scouting_runs table

  ## Summary
  Stores the output of the OpenAI-powered scouting agent that runs once per day
  before the main pipeline to gather targeted intelligence across 8 topic areas.

  ## New Tables
  - `scouting_runs`
    - `id` (uuid, primary key)
    - `run_date` (date) — UTC date the scout ran (unique, one per day)
    - `triggered_at` (timestamptz) — exact time the scout started
    - `completed_at` (timestamptz) — when scouting finished
    - `duration_ms` (int) — total time taken
    - `forced` (boolean) — whether this was a manual/forced run vs scheduled
    - `model` (text) — OpenAI model used
    - `topics_queried` (jsonb) — array of topic strings that were searched
    - `intelligence` (jsonb) — structured output per topic: { topic, query, findings[], sources[], summary }
    - `total_prompt_tokens` (int)
    - `total_completion_tokens` (int)
    - `error` (text) — null on success, error message on failure
    - `created_at` (timestamptz)

  ## Security
  - RLS enabled
  - Anon users can SELECT (read-only intelligence for pipeline and frontend)
  - Service role can INSERT/UPDATE via edge functions

  ## Notes
  - Unique constraint on run_date prevents duplicate daily runs
  - The pipeline checks this table before running to avoid re-scouting the same day
  - forced=true bypasses the once-per-day check
*/

CREATE TABLE IF NOT EXISTS scouting_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_date date NOT NULL,
  triggered_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz DEFAULT NULL,
  duration_ms int DEFAULT NULL,
  forced boolean NOT NULL DEFAULT false,
  model text NOT NULL DEFAULT 'gpt-4o',
  topics_queried jsonb DEFAULT '[]'::jsonb,
  intelligence jsonb DEFAULT '[]'::jsonb,
  total_prompt_tokens int DEFAULT 0,
  total_completion_tokens int DEFAULT 0,
  error text DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT scouting_runs_run_date_key UNIQUE (run_date)
);

ALTER TABLE scouting_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read scouting runs"
  ON scouting_runs
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Service role can insert scouting runs"
  ON scouting_runs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update scouting runs"
  ON scouting_runs
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS scouting_runs_run_date_idx ON scouting_runs (run_date DESC);
