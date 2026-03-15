import { BarChart, Bar, Cell, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';
import { cn } from '@/lib/utils';
import type { MarketItem } from '@/types';

interface CommodityMiniChartProps {
  items: MarketItem[];
  className?: string;
}

const SHORT_NAMES: Record<string, string> = {
  'BZ=F': 'Brent',
  'CL=F': 'WTI',
  'NG=F': 'Nat Gas',
  'ZW=F': 'Wheat',
  'ZC=F': 'Corn',
  'ZS=F': 'Soy',
  'GC=F': 'Gold',
  'DX=F': 'USD Idx',
  'GBPUSD=X': 'GBP/USD',
  'GBPEUR=X': 'GBP/EUR',
  '^GSPC': 'S&P 500',
  '^FTSE': 'FTSE',
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: number; payload: { label: string } }[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  const label = payload[0].payload.label;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded px-2 py-1">
      <p className="text-[10px] text-slate-300 font-mono">
        {label}: <span className={val >= 0 ? 'text-emerald-400' : 'text-red-400'}>
          {val >= 0 ? '+' : ''}{val.toFixed(2)}%
        </span>
      </p>
    </div>
  );
}

export default function CommodityMiniChart({ items, className }: CommodityMiniChartProps) {
  if (items.length === 0) return null;

  const sorted = [...items].sort((a, b) => b.changePercent24h - a.changePercent24h);

  const data = sorted.map(item => ({
    label: SHORT_NAMES[item.id] ?? item.shortName,
    value: item.changePercent24h,
  }));

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={sorted.length * 22}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 4, bottom: 0, left: 44 }}
          barSize={8}
        >
          <XAxis
            type="number"
            domain={['auto', 'auto']}
            hide
          />
          <YAxis
            type="category"
            dataKey="label"
            width={40}
            tick={{ fontSize: 10, fill: 'rgba(148,163,184,0.5)', fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <ReferenceLine x={0} stroke="rgba(148,163,184,0.2)" strokeWidth={1} />
          <Bar dataKey="value" radius={[0, 2, 2, 0]} isAnimationActive={false}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.value >= 0 ? 'rgba(52,211,153,0.7)' : 'rgba(239,68,68,0.7)'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
