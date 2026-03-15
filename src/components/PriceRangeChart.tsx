import { ComposedChart, XAxis, YAxis, ReferenceArea, ReferenceLine, ResponsiveContainer, Scatter } from 'recharts';
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

  const dotColor = price >= p75 ? '#ef4444' : price >= median ? '#f97316' : price <= p25 ? '#38bdf8' : '#34d399';
  const zoneColor = price > median ? 'rgba(249,115,22,0.15)' : 'rgba(52,211,153,0.12)';

  const scatterData = [{ x: 0.5, y: price }];

  return (
    <div className={cn('space-y-1', className)}>
      <div className="h-8">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
            <XAxis type="number" dataKey="x" domain={[0, 1]} hide />
            <YAxis type="number" dataKey="y" domain={[low, high]} hide />

            <ReferenceArea
              y1={p25}
              y2={p75}
              fill={zoneColor}
              fillOpacity={1}
              stroke="none"
            />

            <ReferenceLine y={p25} stroke="rgba(148,163,184,0.35)" strokeWidth={1} />
            <ReferenceLine y={median} stroke="rgba(148,163,184,0.55)" strokeWidth={1} strokeDasharray="2 2" />
            <ReferenceLine y={p75} stroke="rgba(148,163,184,0.35)" strokeWidth={1} />
            <ReferenceLine y={price} stroke={dotColor} strokeWidth={1.5} strokeOpacity={0.7} />

            <Scatter
              data={scatterData}
              fill={dotColor}
              line={false}
              shape={(props: any) => {
                const { cx, cy } = props;
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={5}
                    fill={dotColor}
                    stroke="#0f172a"
                    strokeWidth={2}
                  />
                );
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-[9px] text-muted-foreground/40 font-mono">
        <span>{fmt(p25, currency)}</span>
        <span className="text-muted-foreground/55">med {fmt(median, currency)}</span>
        <span>{fmt(p75, currency)}</span>
      </div>
    </div>
  );
}
