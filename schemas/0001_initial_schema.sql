-- 0001_initial_schema.sql
-- Translated from Supabase PostgreSQL to Cloudflare D1 (SQLite)

-- =========================================================================
-- TYPES & EXTENSIONS CONVERSION NOTES
-- =========================================================================
-- 1. uuid: SQLite does not have a native UUID type or gen_random_uuid().
--    -> Converted to TEXT. The application (Pages/Worker) MUST generate 
--       the UUID via `crypto.randomUUID()` during INSERT.
-- 2. jsonb: SQLite does not have JSONB, but has JSON functions over TEXT.
--    -> Converted to TEXT.
-- 3. timestamptz / date: SQLite stores dates as TEXT (ISO8601), REAL, or INTEGER.
--    -> Converted to TEXT (or INTEGER for epochs). Defaulting to CURRENT_TIMESTAMP.
-- 4. Arrays (e.g., text[]): SQLite does not support arrays.
--    -> Converted to TEXT (assumed to be stored as a JSON string array).
-- 5. true/false (boolean): SQLite uses 1 and 0.
--    -> Converted to INTEGER.
-- 6. RLS Policies: D1 does not support Row Level Security.
--    -> All ALTER TABLE ... ENABLE ROW LEVEL SECURITY deleted.
--    -> All CREATE POLICY statements deleted. Access control MUST be handled
--       in the Cloudflare Workers application logic.
-- 7. pg_cron & pg_net: Not supported in D1.
--    -> Scheduled tasks must be moved to Cloudflare Cron Triggers (wrangler.json).
--    -> HTTP calls must be handled in the Worker via native `fetch()`.
-- 8. Realtime / Publications: Not supported natively in D1.
--    -> Move to Cloudflare WebSockets or Durable Objects.
-- =========================================================================

CREATE TABLE IF NOT EXISTS feed_cache (
  id TEXT PRIMARY KEY, -- Was uuid DEFAULT gen_random_uuid()
  fetched_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, -- Was timestamptz
  payload TEXT NOT NULL DEFAULT '{}', -- Was jsonb
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP -- Was timestamptz
);

CREATE TABLE IF NOT EXISTS user_settings (
  session_id TEXT PRIMARY KEY,
  timezone TEXT NOT NULL DEFAULT 'Europe/London',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS daily_brief (
  id TEXT PRIMARY KEY, -- Was uuid
  brief_date TEXT NOT NULL, -- Was date
  generated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, -- Was timestamptz
  feed_snapshot_at TEXT,
  narrative TEXT NOT NULL DEFAULT '',
  three_things TEXT NOT NULL DEFAULT '[]', -- Was jsonb
  action_rationale TEXT NOT NULL DEFAULT '{}', -- Was jsonb
  geopolitical_context TEXT NOT NULL DEFAULT '',
  model TEXT NOT NULL DEFAULT 'gpt-4o',
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  price_snapshot TEXT, -- Was jsonb
  procurement_actions TEXT DEFAULT '[]', -- Was text[]
  market_outlook TEXT DEFAULT '',
  sector_news_digest TEXT DEFAULT '{}', -- Was jsonb
  sector_forward_outlook TEXT DEFAULT '{}', -- Was jsonb
  persona TEXT NOT NULL DEFAULT 'general',
  compounding_risk TEXT NOT NULL DEFAULT '',
  top_decision TEXT, -- Was jsonb
  shipping_lane_snapshot TEXT, -- Was jsonb
  fertilizer_detail TEXT, -- Was jsonb
  UNIQUE (brief_date, persona)
);
CREATE INDEX IF NOT EXISTS idx_daily_brief_date_persona ON daily_brief (brief_date, persona);

CREATE TABLE IF NOT EXISTS email_subscriptions (
  id TEXT PRIMARY KEY, -- Was uuid
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1, -- Was boolean true
  send_hour_utc INTEGER NOT NULL DEFAULT 6 CHECK (send_hour_utc >= 0 AND send_hour_utc <= 23),
  confirmed INTEGER NOT NULL DEFAULT 1, -- Was boolean true
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_sent_at TEXT,
  unsubscribe_token TEXT NOT NULL, -- Application must generate hex secure token
  persona TEXT NOT NULL DEFAULT 'general' CHECK (persona IN ('general', 'trader', 'agri', 'logistics', 'analyst'))
);

CREATE TABLE IF NOT EXISTS pipeline_runs (
  id TEXT PRIMARY KEY, -- Was uuid
  run_date TEXT NOT NULL, -- Was date
  triggered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total_duration_ms INTEGER,
  logs TEXT NOT NULL DEFAULT '[]', -- Was jsonb
  forced INTEGER NOT NULL DEFAULT 0, -- Was boolean false
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS commodity_percentiles (
  id TEXT PRIMARY KEY,
  commodity_id TEXT NOT NULL,
  commodity_name TEXT NOT NULL,
  lookback_years INTEGER NOT NULL DEFAULT 10,
  p10 REAL, -- Was numeric
  p25 REAL,
  p50 REAL,
  p75 REAL,
  p90 REAL,
  mean_price REAL,
  std_dev REAL,
  min_price REAL,
  max_price REAL,
  currency TEXT NOT NULL DEFAULT 'USD',
  unit TEXT NOT NULL DEFAULT 'unit',
  data_source TEXT NOT NULL DEFAULT 'World Bank Pink Sheet',
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (commodity_id, lookback_years)
);

CREATE TABLE IF NOT EXISTS commodity_seasonal_patterns (
  id TEXT PRIMARY KEY,
  commodity_id TEXT NOT NULL,
  month_number INTEGER NOT NULL CHECK (month_number BETWEEN 1 AND 12),
  seasonal_index REAL NOT NULL DEFAULT 1.0, -- Was numeric
  pressure_label TEXT NOT NULL DEFAULT 'NORMAL',
  notes TEXT,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (commodity_id, month_number)
);

CREATE TABLE IF NOT EXISTS conflict_zone_baselines (
  id TEXT PRIMARY KEY,
  zone_id TEXT NOT NULL UNIQUE,
  zone_name TEXT NOT NULL,
  baseline_event_frequency REAL NOT NULL DEFAULT 5, -- Was numeric
  elevated_threshold INTEGER NOT NULL DEFAULT 8,
  high_threshold INTEGER NOT NULL DEFAULT 15,
  critical_threshold INTEGER NOT NULL DEFAULT 25,
  historical_commodity_impact_pct REAL, -- Was numeric
  comparable_events TEXT DEFAULT '[]', -- Was jsonb
  notes TEXT,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS action_completions (
  id TEXT PRIMARY KEY, -- Was uuid
  session_id TEXT NOT NULL,
  action_id TEXT NOT NULL,
  completed_date TEXT NOT NULL, -- Was date DEFAULT CURRENT_DATE, application must pass date
  completed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(session_id, action_id, completed_date)
);
CREATE INDEX IF NOT EXISTS idx_action_completions_session_date ON action_completions(session_id, completed_date);

CREATE TABLE IF NOT EXISTS scouting_runs (
  id TEXT PRIMARY KEY, -- Was uuid
  run_date TEXT NOT NULL UNIQUE, -- Was date
  triggered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT DEFAULT NULL,
  duration_ms INTEGER DEFAULT NULL,
  forced INTEGER NOT NULL DEFAULT 0, -- Was boolean
  model TEXT NOT NULL DEFAULT 'gpt-4o',
  topics_queried TEXT DEFAULT '[]', -- Was jsonb
  intelligence TEXT DEFAULT '[]', -- Was jsonb
  total_prompt_tokens INTEGER DEFAULT 0,
  total_completion_tokens INTEGER DEFAULT 0,
  error TEXT DEFAULT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS scouting_runs_run_date_idx ON scouting_runs (run_date);

CREATE TABLE IF NOT EXISTS dismissed_intel (
  id TEXT PRIMARY KEY, -- Was uuid
  type TEXT NOT NULL CHECK (type IN ('scout_topic', 'news_story')),
  ref_id TEXT NOT NULL,
  ref_label TEXT NOT NULL,
  category TEXT,
  signal TEXT,
  reason TEXT,
  dismissed_by TEXT, -- Was uuid REFERENCES auth.users(id). FK removed intentionally for decoupled Auth
  dismissed_at TEXT DEFAULT CURRENT_TIMESTAMP,
  scouting_run_id TEXT, -- Was uuid
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS dismissed_intel_type_ref_idx ON dismissed_intel(type, ref_id);
CREATE INDEX IF NOT EXISTS dismissed_intel_run_idx ON dismissed_intel(scouting_run_id);
