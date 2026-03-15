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

export default function CommodityMiniChart({ items, className }: CommodityMiniChartProps) {
  if (items.length === 0) return null;

  const sorted = [...items].sort((a, b) => b.changePercent24h - a.changePercent24h);
  const maxAbs = Math.max(...sorted.map(i => Math.abs(i.changePercent24h)), 0.1);

  return (
    <div className={cn('space-y-1.5', className)}>
      {sorted.map(item => {
        const cp = item.changePercent24h;
        const barPct = (Math.abs(cp) / maxAbs) * 100;
        const positive = cp >= 0;
        const label = SHORT_NAMES[item.id] ?? item.shortName;

        return (
          <div key={item.id} className="flex items-center gap-2 group">
            <span className="text-[10px] text-muted-foreground/50 w-14 shrink-0 text-right font-mono truncate">
              {label}
            </span>

            <div className="flex-1 flex items-center gap-1 h-4">
              <div className="flex-1 flex items-center">
                {positive ? (
                  <div className="flex-1 relative h-3.5 flex items-center">
                    <div className="absolute inset-y-0 left-1/2 w-px bg-slate-700/60" />
                    <div
                      className="absolute inset-y-[3px] left-1/2 rounded-r bg-emerald-500/70 group-hover:bg-emerald-400/80 transition-colors"
                      style={{ width: `${barPct / 2}%` }}
                    />
                  </div>
                ) : (
                  <div className="flex-1 relative h-3.5 flex items-center">
                    <div className="absolute inset-y-0 left-1/2 w-px bg-slate-700/60" />
                    <div
                      className="absolute inset-y-[3px] rounded-l bg-red-500/70 group-hover:bg-red-400/80 transition-colors"
                      style={{
                        right: '50%',
                        width: `${barPct / 2}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            <span className={cn(
              'text-[10px] font-mono w-12 shrink-0 text-right font-semibold',
              positive ? 'text-emerald-400' : 'text-red-400',
            )}>
              {positive ? '+' : ''}{cp.toFixed(2)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
