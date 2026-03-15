import { useState } from "react";
import { TrendingUp, TrendingDown, Minus, Eye, ChevronDown, ChevronRight, ExternalLink, Zap, Globe, Ship, Sprout, BarChart2, DollarSign, Shield, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TopicIntelligence, ScoutingRun, ScoutSignal, ScoutCategory } from "@/types";

interface ScoutIntelPanelProps {
  run: ScoutingRun | null;
  loading: boolean;
}

const SIGNAL_CONFIG: Record<ScoutSignal, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  BULLISH:  { label: "Bullish",  color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: TrendingUp },
  BEARISH:  { label: "Bearish",  color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/30",     icon: TrendingDown },
  NEUTRAL:  { label: "Neutral",  color: "text-slate-400",   bg: "bg-slate-700/30",   border: "border-slate-600/30",   icon: Minus },
  WATCH:    { label: "Watch",    color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/30",   icon: Eye },
};

const CATEGORY_CONFIG: Record<ScoutCategory, { label: string; color: string; icon: React.ElementType }> = {
  energy:       { label: "Energy",      color: "text-orange-400", icon: Zap },
  agricultural: { label: "Agriculture", color: "text-lime-400",   icon: Sprout },
  freight:      { label: "Freight",     color: "text-sky-400",    icon: Ship },
  fertilizer:   { label: "Fertilizer",  color: "text-yellow-400", icon: Sprout },
  metals:       { label: "Metals",      color: "text-slate-300",  icon: BarChart2 },
  fx:           { label: "FX",          color: "text-teal-400",   icon: DollarSign },
  geopolitical: { label: "Geopolitical",color: "text-red-400",    icon: Globe },
  policy:       { label: "Policy",      color: "text-blue-400",   icon: Landmark },
};

const CATEGORY_ORDER: ScoutCategory[] = ['energy', 'agricultural', 'freight', 'fertilizer', 'metals', 'fx', 'geopolitical', 'policy'];

function SignalBadge({ signal }: { signal: ScoutSignal }) {
  const cfg = SIGNAL_CONFIG[signal];
  const Icon = cfg.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded border", cfg.color, cfg.bg, cfg.border)}>
      <Icon size={8} />
      {cfg.label}
    </span>
  );
}

function TopicCard({ topic }: { topic: TopicIntelligence }) {
  const [expanded, setExpanded] = useState(false);
  const catCfg = CATEGORY_CONFIG[topic.category] ?? CATEGORY_CONFIG.geopolitical;
  const CatIcon = catCfg.icon;

  return (
    <div className="rounded-lg border border-border/30 bg-slate-800/30 overflow-hidden transition-colors hover:border-border/50">
      <button
        className="w-full flex items-start gap-3 px-3.5 py-3 text-left"
        onClick={() => setExpanded(o => !o)}
      >
        <div className={cn("mt-0.5 shrink-0", catCfg.color)}>
          <CatIcon size={13} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[11px] font-semibold text-slate-200 leading-tight">{topic.topic_label}</span>
            <SignalBadge signal={topic.signal} />
          </div>
          <p className="text-[10px] text-muted-foreground/70 leading-relaxed line-clamp-2">{topic.summary}</p>
        </div>
        <div className="shrink-0 text-muted-foreground/40 mt-0.5">
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </div>
      </button>

      {expanded && (
        <div className="px-3.5 pb-3.5 border-t border-border/20 bg-slate-900/20 space-y-3 pt-3">
          <div>
            <p className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-wider mb-1.5">Key Findings</p>
            <ul className="space-y-1.5">
              {topic.findings.map((f, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-slate-500 shrink-0 mt-1.5" />
                  <span className="text-[10px] text-slate-300 leading-relaxed">{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {topic.sources.length > 0 && (
            <div>
              <p className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-wider mb-1.5">Sources</p>
              <div className="flex flex-wrap gap-1.5">
                {topic.sources.map((src, i) => (
                  <a
                    key={i}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[9px] text-sky-400/80 hover:text-sky-300 bg-sky-500/5 border border-sky-500/20 hover:border-sky-400/40 rounded px-1.5 py-0.5 transition-colors"
                  >
                    <ExternalLink size={8} />
                    {src.title.length > 36 ? src.title.slice(0, 36) + "…" : src.title}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SignalSummaryBar({ intelligence }: { intelligence: TopicIntelligence[] }) {
  const counts: Record<ScoutSignal, number> = { BULLISH: 0, BEARISH: 0, NEUTRAL: 0, WATCH: 0 };
  for (const t of intelligence) counts[t.signal]++;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {(Object.entries(counts) as [ScoutSignal, number][]).map(([sig, count]) => {
        if (count === 0) return null;
        const cfg = SIGNAL_CONFIG[sig];
        const Icon = cfg.icon;
        return (
          <div key={sig} className={cn("flex items-center gap-1 text-[9px] font-bold tracking-widest uppercase", cfg.color)}>
            <Icon size={9} />
            <span>{count}</span>
            <span className="font-normal text-muted-foreground/50">{cfg.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function ScoutIntelPanel({ run, loading }: ScoutIntelPanelProps) {
  const [activeCategory, setActiveCategory] = useState<ScoutCategory | null>(null);

  if (loading) {
    return (
      <div className="space-y-2 animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-16 rounded-lg bg-slate-800/30 border border-border/20" />
        ))}
      </div>
    );
  }

  if (!run) {
    return (
      <div className="text-center py-8 text-muted-foreground/50">
        <Shield size={20} className="mx-auto mb-2 opacity-30" />
        <p className="text-xs">No scout data available yet.</p>
        <p className="text-[10px] mt-1 opacity-60">Scout runs overnight before market open.</p>
      </div>
    );
  }

  const intelligence = run.intelligence ?? [];
  const sortedIntel = [...intelligence].sort((a, b) => {
    return CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
  });

  const filtered = activeCategory
    ? sortedIntel.filter(t => t.category === activeCategory)
    : sortedIntel;

  const presentCategories = Array.from(new Set(sortedIntel.map(t => t.category)));

  const runDate = new Date(run.run_date).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short'
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <SignalSummaryBar intelligence={intelligence} />
        </div>
        <div className="text-[9px] text-muted-foreground/40">
          {runDate} · {intelligence.length} topics
          {run.duration_ms && ` · ${(run.duration_ms / 1000).toFixed(0)}s`}
        </div>
      </div>

      {presentCategories.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveCategory(null)}
            className={cn(
              "text-[9px] font-semibold tracking-wider uppercase px-2 py-1 rounded border transition-colors",
              activeCategory === null
                ? "bg-slate-600/40 border-slate-500/50 text-slate-200"
                : "border-border/30 text-muted-foreground/50 hover:text-slate-300 hover:border-border/50"
            )}
          >
            All
          </button>
          {presentCategories.map(cat => {
            const cfg = CATEGORY_CONFIG[cat] ?? CATEGORY_CONFIG.geopolitical;
            const Icon = cfg.icon;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                className={cn(
                  "inline-flex items-center gap-1 text-[9px] font-semibold tracking-wider uppercase px-2 py-1 rounded border transition-colors",
                  activeCategory === cat
                    ? cn("border-current/40 bg-current/5", cfg.color)
                    : "border-border/30 text-muted-foreground/50 hover:text-slate-300 hover:border-border/50"
                )}
              >
                <Icon size={9} />
                {cfg.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(topic => (
          <TopicCard key={topic.topic_id} topic={topic} />
        ))}
      </div>
    </div>
  );
}
