import { useState, useEffect } from 'react';
import { getHistoricalContext } from '@/lib/api';

export interface CommodityPercentile {
  commodity_id: string;
  commodity_name: string;
  lookback_years: number;
  p10: number | null;
  p25: number | null;
  p50: number | null;
  p75: number | null;
  p90: number | null;
  mean_price: number | null;
  std_dev: number | null;
  min_price: number | null;
  max_price: number | null;
  currency: string;
  unit: string;
  data_source: string;
}

export interface SeasonalPattern {
  commodity_id: string;
  month_number: number;
  seasonal_index: number;
  pressure_label: string;
  notes: string | null;
}

export interface ConflictZoneBaseline {
  zone_id: string;
  zone_name: string;
  baseline_event_frequency: number;
  elevated_threshold: number;
  high_threshold: number;
  critical_threshold: number;
  historical_commodity_impact_pct: number | null;
  comparable_events: ComparableEvent[];
  notes: string | null;
}

export interface ComparableEvent {
  year: number;
  event: string;
  brent_impact_pct?: number;
  wheat_impact_pct?: number;
  freight_impact_pct?: number;
  impact_pct?: number;
  duration_days?: number;
  description: string;
  commodity?: string;
}

export interface HistoricalContext {
  percentiles: CommodityPercentile[];
  seasonal: SeasonalPattern[];
  conflictBaselines: ConflictZoneBaseline[];
}

export function computePercentileRank(price: number, perc: CommodityPercentile): number | null {
  if (!perc.p10 || !perc.p25 || !perc.p50 || !perc.p75 || !perc.p90) return null;
  if (price <= perc.p10) return 5;
  if (price <= perc.p25) return Math.round(10 + ((price - perc.p10) / (perc.p25 - perc.p10)) * 15);
  if (price <= perc.p50) return Math.round(25 + ((price - perc.p25) / (perc.p50 - perc.p25)) * 25);
  if (price <= perc.p75) return Math.round(50 + ((price - perc.p50) / (perc.p75 - perc.p50)) * 25);
  if (price <= perc.p90) return Math.round(75 + ((price - perc.p75) / (perc.p90 - perc.p75)) * 15);
  return Math.min(99, Math.round(90 + ((price - perc.p90) / (perc.p90 * 0.2)) * 9));
}

export function getPercentileLabel(rank: number): { label: string; color: string; bg: string } {
  if (rank >= 90) return { label: 'Near 10-yr high', color: 'text-red-400', bg: 'bg-red-500/15' };
  if (rank >= 75) return { label: 'Above 10-yr avg', color: 'text-orange-400', bg: 'bg-orange-500/12' };
  if (rank >= 50) return { label: 'Mid-range', color: 'text-amber-400', bg: 'bg-amber-500/10' };
  if (rank >= 25) return { label: 'Below 10-yr avg', color: 'text-emerald-400', bg: 'bg-emerald-500/12' };
  return { label: 'Near 10-yr low', color: 'text-sky-400', bg: 'bg-sky-500/12' };
}

export function getSeasonalPressure(commodity_id: string, seasonal: SeasonalPattern[], month?: number): SeasonalPattern | null {
  const m = month ?? new Date().getMonth() + 1;
  return seasonal.find(s => s.commodity_id === commodity_id && s.month_number === m) ?? null;
}

export function getConflictBaseline(zone_id: string, baselines: ConflictZoneBaseline[]): ConflictZoneBaseline | null {
  return baselines.find(b => b.zone_id === zone_id) ?? null;
}

export function scoreVsBaseline(
  evidenceCount: number,
  baseline: ConflictZoneBaseline,
): { label: string; vsBaseline: string; color: string } {
  const norm = baseline.baseline_event_frequency;
  const ratio = evidenceCount / norm;
  if (evidenceCount >= baseline.critical_threshold) {
    return { label: 'Critical intensity', vsBaseline: `${Math.round((ratio - 1) * 100)}% above norm`, color: 'text-red-400' };
  }
  if (evidenceCount >= baseline.high_threshold) {
    return { label: 'Elevated intensity', vsBaseline: `${Math.round((ratio - 1) * 100)}% above norm`, color: 'text-orange-400' };
  }
  if (evidenceCount >= baseline.elevated_threshold) {
    return { label: 'Above baseline', vsBaseline: `${Math.round((ratio - 1) * 100)}% above norm`, color: 'text-amber-400' };
  }
  if (ratio >= 1) {
    return { label: 'Near baseline', vsBaseline: `+${Math.round((ratio - 1) * 100)}% vs norm`, color: 'text-yellow-400' };
  }
  return { label: 'Below baseline', vsBaseline: `${Math.round((1 - ratio) * 100)}% below norm`, color: 'text-emerald-400' };
}

export function useHistoricalContext(): {
  context: HistoricalContext | null;
  loading: boolean;
  error: string | null;
} {
  const [context, setContext] = useState<HistoricalContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      setLoading(true);
      setError(null);

      try {
        // Fetch from new API endpoints concurrently
        const [percentilesData, seasonalData, conflictBaselinesData] = await Promise.all([
          getHistoricalContext('percentiles'),
          getHistoricalContext('seasonality'),
          getHistoricalContext('conflicts')
        ]);

        if (!cancelled) {
          setContext({
            percentiles: (percentilesData || []).filter(p => p.lookback_years === 10),
            seasonal: seasonalData || [],
            conflictBaselines: conflictBaselinesData || [],
          });
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAll();
    return () => { cancelled = true; };
  }, []);

  return { context, loading, error };
}
