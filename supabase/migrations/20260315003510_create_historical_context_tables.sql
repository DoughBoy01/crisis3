/*
  # Historical Context Reference Tables — Phase 1 Kaggle Integration

  ## Purpose
  Stores pre-computed historical context data derived from Kaggle commodity and conflict datasets.
  This allows the live dashboard to contextualise current prices against long-run baselines
  without querying large datasets at runtime.

  ## New Tables

  ### 1. commodity_percentiles
  Pre-computed price percentile bands for each tracked commodity, derived from
  World Bank Pink Sheet (1960–2022) and Major Commodity Prices datasets.
  Each row represents one commodity's historical distribution across multiple lookback windows.

  Columns:
  - commodity_id: identifier matching SYMBOL_CONFIG keys (e.g. 'BZ=F', 'ZW=F')
  - commodity_name: human-readable name
  - lookback_years: number of years used to compute percentiles (5, 10, 20)
  - p10, p25, p50, p75, p90: price percentile values in native currency/unit
  - mean_price: historical mean
  - std_dev: standard deviation (for z-score calculation)
  - min_price, max_price: historical range
  - currency: price currency (USD, USX)
  - unit: price unit (bbl, bu, MMBtu, oz)
  - data_source: which dataset provided the baseline
  - updated_at: when this record was last refreshed

  ### 2. commodity_seasonal_patterns
  Monthly seasonal demand/supply pressure indices derived from historical price seasonality.
  Used to overlay "seasonal demand pressure" context on live price signals.

  Columns:
  - commodity_id: matches SYMBOL_CONFIG keys
  - month_number: 1–12
  - seasonal_index: deviation from annual mean (1.0 = average; >1.0 = above-average demand pressure)
  - pressure_label: 'HIGH', 'MODERATE', 'NORMAL', 'LOW'
  - notes: plain-English explanation of why this month has this pressure

  ### 3. conflict_zone_baselines
  Historical conflict intensity baselines per zone, enabling "vs. baseline" comparison.
  Pre-computed from COW and GCRI-style datasets. Updated quarterly.

  Columns:
  - zone_id: matches CONFLICT_ZONE_CONFIGS ids (e.g. 'red-sea-yemen')
  - baseline_event_frequency: average monthly conflict events at this location (historical norm)
  - elevated_threshold: event count above which zone is elevated vs baseline
  - high_threshold: event count above which zone is high vs baseline
  - critical_threshold: event count above which zone is critical vs baseline
  - historical_commodity_impact_pct: average commodity price impact (%) during past escalations
  - comparable_events: JSON array of historical precedent event descriptions
  - notes: context notes

  ## Security
  - RLS enabled on all tables
  - Read-only access for authenticated and anon users (reference data, not PII)
  - No write policies for client; data managed via service role migrations/seeds
*/

CREATE TABLE IF NOT EXISTS commodity_percentiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commodity_id text NOT NULL,
  commodity_name text NOT NULL,
  lookback_years integer NOT NULL DEFAULT 10,
  p10 numeric,
  p25 numeric,
  p50 numeric,
  p75 numeric,
  p90 numeric,
  mean_price numeric,
  std_dev numeric,
  min_price numeric,
  max_price numeric,
  currency text NOT NULL DEFAULT 'USD',
  unit text NOT NULL DEFAULT 'unit',
  data_source text NOT NULL DEFAULT 'World Bank Pink Sheet',
  updated_at timestamptz DEFAULT now(),
  UNIQUE (commodity_id, lookback_years)
);

ALTER TABLE commodity_percentiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read commodity percentiles"
  ON commodity_percentiles FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE TABLE IF NOT EXISTS commodity_seasonal_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commodity_id text NOT NULL,
  month_number integer NOT NULL CHECK (month_number BETWEEN 1 AND 12),
  seasonal_index numeric NOT NULL DEFAULT 1.0,
  pressure_label text NOT NULL DEFAULT 'NORMAL',
  notes text,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (commodity_id, month_number)
);

ALTER TABLE commodity_seasonal_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read seasonal patterns"
  ON commodity_seasonal_patterns FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE TABLE IF NOT EXISTS conflict_zone_baselines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id text NOT NULL UNIQUE,
  zone_name text NOT NULL,
  baseline_event_frequency numeric NOT NULL DEFAULT 5,
  elevated_threshold integer NOT NULL DEFAULT 8,
  high_threshold integer NOT NULL DEFAULT 15,
  critical_threshold integer NOT NULL DEFAULT 25,
  historical_commodity_impact_pct numeric,
  comparable_events jsonb DEFAULT '[]'::jsonb,
  notes text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE conflict_zone_baselines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read conflict zone baselines"
  ON conflict_zone_baselines FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_commodity_percentiles_commodity_id ON commodity_percentiles (commodity_id);
CREATE INDEX IF NOT EXISTS idx_seasonal_patterns_commodity_month ON commodity_seasonal_patterns (commodity_id, month_number);
CREATE INDEX IF NOT EXISTS idx_conflict_zone_baselines_zone_id ON conflict_zone_baselines (zone_id);
