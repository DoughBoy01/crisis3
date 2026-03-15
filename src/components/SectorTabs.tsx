import { ShoppingCart, FlaskConical, Ship, HardHat, LineChart } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SectorId } from '../types';

interface Sector {
  id: SectorId;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  activeBg: string;
  activeBorder: string;
  activeText: string;
}

const sectors: Sector[] = [
  {
    id: 'food_importer',
    label: 'Food Importers',
    description: 'Fertilizer · Grain · Food Inflation',
    icon: ShoppingCart,
    color: 'text-amber-400',
    activeBg: 'bg-amber-500/10',
    activeBorder: 'border-amber-500/40',
    activeText: 'text-amber-300',
  },
  {
    id: 'chemicals',
    label: 'Chemicals & Plastics',
    description: 'Gas Feedstock · LNG · Petrochemicals',
    icon: FlaskConical,
    color: 'text-cyan-400',
    activeBg: 'bg-cyan-500/10',
    activeBorder: 'border-cyan-500/40',
    activeText: 'text-cyan-300',
  },
  {
    id: 'freight_3pl',
    label: 'Freight & 3PL',
    description: 'War Risk · Container Rates · Suez',
    icon: Ship,
    color: 'text-sky-400',
    activeBg: 'bg-sky-500/10',
    activeBorder: 'border-sky-500/40',
    activeText: 'text-sky-300',
  },
  {
    id: 'construction',
    label: 'Construction & Plant',
    description: 'Steel · Fuel · Equipment Costs',
    icon: HardHat,
    color: 'text-orange-400',
    activeBg: 'bg-orange-500/10',
    activeBorder: 'border-orange-500/40',
    activeText: 'text-orange-300',
  },
  {
    id: 'financial',
    label: 'IFA / Portfolio',
    description: 'Pre-London Open · Macro Brief',
    icon: LineChart,
    color: 'text-emerald-400',
    activeBg: 'bg-emerald-500/10',
    activeBorder: 'border-emerald-500/40',
    activeText: 'text-emerald-300',
  },
];

interface SectorTabsProps {
  active: SectorId | null;
  onChange: (id: SectorId | null) => void;
}

export default function SectorTabs({ active, onChange }: SectorTabsProps) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {sectors.map(sector => {
        const Icon = sector.icon;
        const isActive = active === sector.id;
        return (
          <button
            key={sector.id}
            onClick={() => onChange(isActive ? null : sector.id)}
            title={sector.description}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-all duration-150',
              isActive
                ? `${sector.activeBg} ${sector.activeBorder} ${sector.activeText}`
                : 'bg-slate-800/50 border-border/50 text-muted-foreground hover:border-slate-600 hover:text-slate-300'
            )}
          >
            <Icon size={11} className={cn('shrink-0', isActive ? sector.color : '')} />
            <span className="hidden sm:inline">{sector.label}</span>
            <span className="sm:hidden">{sector.label.split(' ')[0]}</span>
          </button>
        );
      })}
      {active && (
        <button
          onClick={() => onChange(null)}
          className="px-2 py-1 rounded-md text-[10px] text-muted-foreground/60 hover:text-muted-foreground border border-transparent hover:border-border/50 transition-colors"
        >
          Clear
        </button>
      )}
    </div>
  );
}
