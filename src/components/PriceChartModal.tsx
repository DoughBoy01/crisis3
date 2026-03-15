import { useEffect, useRef } from 'react';
import { X, ExternalLink, TrendingUp, TrendingDown, BarChart3, Leaf } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { cn } from '@/lib/utils';
import type { MarketItem } from '../types';
import SignalBadge from './SignalBadge';

interface PriceChartModalProps {
  item: MarketItem;
  onClose: () => void;
}

function formatPrice(price: number, currency: string): string {
  if (currency === 'USX') return `${price.toLocaleString('en-GB', { maximumFractionDigits: 0 })}¢`;
  const sym = currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '$';
  return `${sym}${price.toLocaleString('en-GB', {
    minimumFractionDigits: price < 10 ? 3 : 2,
    maximumFractionDigits: price < 10 ? 3 : 2,
  })}`;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: number; payload: { timestamp: string } }[];
  currency: string;
  unit: string;
}

function CustomTooltip({ active, payload, currency, unit }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0];
  return (
    <div className="bg-slate-800 border border-slate-600/60 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-[10px] text-muted-foreground mb-0.5">{point.payload.timestamp}</p>
      <p className="text-sm font-bold text-slate-100">
        {formatPrice(point.value, currency)}
        <span className="text-xs font-normal text-muted-foreground ml-1">/{unit}</span>
      </p>
    </div>
  );
}

export default function PriceChartModal({ item, onClose }: PriceChartModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const positive = item.changePercent24h >= 0;
  const color = positive ? '#22c55e' : '#ef4444';
  const gradientId = 'modal-chart-gradient';

  const chartData = item.history.length > 0
    ? item.history
    : [];

  const values = chartData.map(p => p.value);
  const minVal = values.length ? Math.min(...values) : 0;
  const maxVal = values.length ? Math.max(...values) : 0;
  const padding = (maxVal - minVal) * 0.1 || maxVal * 0.05 || 1;

  const perc = item.percentileContext;
  const seasonal = item.seasonalContext;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-border/40">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <SignalBadge signal={item.signal} size="sm" />
              <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">{item.category}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-100 leading-tight">{item.name}</h2>
          </div>

          <div className="flex items-start gap-4 shrink-0">
            <div className="text-right">
              <div className="text-2xl font-bold text-slate-100 tracking-tight">
                {formatPrice(item.price, item.currency)}
                <span className="text-sm font-normal text-muted-foreground ml-1">/{item.unit}</span>
              </div>
              <div className="flex items-center gap-3 justify-end mt-0.5">
                <span className={cn('text-sm font-semibold flex items-center gap-1', positive ? 'text-emerald-400' : 'text-red-400')}>
                  {positive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  {positive ? '+' : ''}{item.changePercent24h.toFixed(2)}% today
                </span>
                <span className={cn('text-xs', item.changeWeeklyPercent >= 0 ? 'text-emerald-500/60' : 'text-red-500/60')}>
                  {item.changeWeeklyPercent >= 0 ? '+' : ''}{item.changeWeeklyPercent.toFixed(2)}% 7d
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-slate-200 transition-colors mt-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Chart */}
        <div className="px-6 pt-5 pb-2">
          {chartData.length < 2 ? (
            <div className="h-48 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Intraday price history not yet available for this session.</p>
            </div>
          ) : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis
                    dataKey="timestamp"
                    tick={{ fill: 'rgba(148,163,184,0.5)', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                    tickFormatter={(v: string) => {
                      if (!v) return '';
                      try {
                        const d = new Date(v);
                        if (isNaN(d.getTime())) return v.slice(0, 5);
                        return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                      } catch { return v.slice(0, 5); }
                    }}
                  />
                  <YAxis
                    domain={[minVal - padding, maxVal + padding]}
                    tick={{ fill: 'rgba(148,163,184,0.5)', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={60}
                    tickFormatter={(v: number) => formatPrice(v, item.currency)}
                  />
                  <Tooltip content={<CustomTooltip currency={item.currency} unit={item.unit} />} />
                  {perc && (
                    <ReferenceLine
                      y={perc.median}
                      stroke="rgba(148,163,184,0.25)"
                      strokeDasharray="4 4"
                      label={{ value: '10yr median', fill: 'rgba(148,163,184,0.4)', fontSize: 9, position: 'insideTopRight' }}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={color}
                    strokeWidth={2}
                    fill={`url(#${gradientId})`}
                    dot={false}
                    activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
                    isAnimationActive={true}
                    animationDuration={600}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Context panels */}
        <div className="px-6 pb-5 space-y-3">

          {/* Percentile context */}
          {perc && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-800/60 rounded-xl px-3 py-2.5 border border-slate-700/40">
                <p className="text-[10px] text-muted-foreground/60 mb-1 flex items-center gap-1">
                  <BarChart3 size={9} />
                  10-yr percentile
                </p>
                <p className={cn('text-sm font-bold', perc.color)}>{perc.rank}th · {perc.label}</p>
              </div>
              <div className="bg-slate-800/60 rounded-xl px-3 py-2.5 border border-slate-700/40">
                <p className="text-[10px] text-muted-foreground/60 mb-1">10-yr median</p>
                <p className="text-sm font-bold text-slate-200">{formatPrice(perc.median, item.currency)}</p>
              </div>
              <div className="bg-slate-800/60 rounded-xl px-3 py-2.5 border border-slate-700/40">
                <p className="text-[10px] text-muted-foreground/60 mb-1">P25 – P75 range</p>
                <p className="text-sm font-bold text-slate-200">
                  {formatPrice(perc.p25, item.currency)} – {formatPrice(perc.p75, item.currency)}
                </p>
              </div>
            </div>
          )}

          {/* Seasonal context */}
          {seasonal && seasonal.pressureLabel !== 'NORMAL' && (
            <div className="flex items-start gap-2 rounded-xl px-3 py-2.5 bg-slate-800/40 border border-slate-700/30">
              <Leaf size={12} className={cn('shrink-0 mt-0.5', seasonal.color)} />
              <div>
                <p className={cn('text-xs font-semibold', seasonal.color)}>Seasonal demand: {seasonal.pressureLabel}</p>
                {seasonal.notes && <p className="text-xs text-muted-foreground/60 mt-0.5 leading-relaxed">{seasonal.notes}</p>}
              </div>
            </div>
          )}

          {/* Rationale */}
          <div className="rounded-xl bg-slate-800/40 border border-slate-700/30 px-4 py-3">
            <p className="text-xs text-muted-foreground/60 mb-1 uppercase tracking-wider font-bold text-[10px]">Signal rationale</p>
            <p className="text-sm text-slate-300 leading-relaxed">{item.rationale}</p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            {perc && (
              <p className="text-[10px] text-muted-foreground/40">{perc.dataSource}</p>
            )}
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto inline-flex items-center gap-1.5 text-xs text-sky-400/70 hover:text-sky-400 transition-colors"
            >
              <ExternalLink size={11} />
              {item.source}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
