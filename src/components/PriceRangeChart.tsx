import { cn } from '@/lib/utils';
import type { PercentileContext } from '@/types';

interface PriceRangeChartProps {
  price: number;
  perc: PercentileContext;
  currency: string;
  unit: string;
  className?: string;
}

function fmt(v: number, currency: string): string {
  if (currency === 'USX') return `${v.toFixed(0)}¢`;
  const sym = currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '$';
  return `${sym}${v >= 1000 ? v.toLocaleString('en-GB', { maximumFractionDigits: 0 }) : v.toFixed(v < 10 ? 2 : 0)}`;
}

export default function PriceRangeChart({ price, perc, currency, className }: PriceRangeChartProps) {
  const { p25, median, p75 } = perc;

  const low = p25 * 0.75;
  const high = p75 * 1.25;
  const range = high - low || 1;

  function pct(v: number) {
    return Math.max(0, Math.min(100, ((v - low) / range) * 100));
  }

  const p25Pct = pct(p25);
  const medPct = pct(median);
  const p75Pct = pct(p75);
  const curPct = pct(price);

  const aboveMedian = price > median;
  const dotColor = price >= p75 ? '#ef4444' : price >= median ? '#f97316' : price <= p25 ? '#38bdf8' : '#34d399';
  const zoneColor = aboveMedian ? 'bg-orange-500/20' : 'bg-emerald-500/20';

  return (
    <div className={cn('space-y-2', className)}>
      <div className="relative h-5" style={{ userSelect: 'none' }}>
        <div className="absolute top-[8px] left-0 right-0 h-[3px] rounded-full bg-slate-700/60" />

        <div
          className={cn('absolute top-[8px] h-[3px] rounded-sm', zoneColor)}
          style={{
            left: `${Math.min(p25Pct, curPct)}%`,
            right: `${100 - Math.max(p75Pct, curPct)}%`,
          }}
        />

        <div
          className="absolute top-[6px] h-[7px] w-px bg-slate-500/60"
          style={{ left: `${p25Pct}%` }}
        />
        <div
          className="absolute top-[5px] h-[9px] w-px bg-slate-400/80"
          style={{ left: `${medPct}%` }}
        />
        <div
          className="absolute top-[6px] h-[7px] w-px bg-slate-500/60"
          style={{ left: `${p75Pct}%` }}
        />

        <div
          className="absolute top-[4px] w-[11px] h-[11px] rounded-full border-2 border-slate-900 shadow-sm -translate-x-1/2 transition-all duration-500"
          style={{ left: `${curPct}%`, backgroundColor: dotColor }}
        />
      </div>

      <div className="flex items-center justify-between text-[9px] text-muted-foreground/40 font-mono">
        <span>{fmt(p25, currency)}</span>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-muted-foreground/55">med {fmt(median, currency)}</span>
        </div>
        <span>{fmt(p75, currency)}</span>
      </div>
    </div>
  );
}
