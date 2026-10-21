import React from 'react';
import { Download } from 'lucide-react';

export const num = (v: unknown): number => (typeof v === 'number' && !Number.isNaN(v) ? v : 0);

export const pct = (part: number, whole: number): string => (whole > 0 ? `${Math.round((part / whole) * 100)}%` : '—');

export function formatTs(value: any): string {
  if (!value) return '—';
  const d: Date = typeof value?.toDate === 'function' ? value.toDate() : new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
}

export function tsMs(value: any): number {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? 0 : t;
}

export const Tile = ({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) => (
  <div className="glass rounded-2xl p-4">
    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">{label}</p>
    <p className="text-2xl font-display font-black text-white mt-1 tabular-nums">{value}</p>
    {hint && <p className="text-[10px] text-slate-500 mt-1">{hint}</p>}
  </div>
);

export const Section = ({
  title,
  subtitle,
  onExport,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  onExport?: () => void;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <section className="mb-10">
    <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
      <div>
        <h2 className="font-display text-lg font-black text-white">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {actions}
        {onExport && (
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-xs font-bold text-slate-300 hover:text-white"
          >
            <Download size={12} /> CSV
          </button>
        )}
      </div>
    </div>
    {children}
  </section>
);

export const Table = ({ head, children, empty }: { head: string[]; children: React.ReactNode; empty?: string }) => {
  const hasRows = React.Children.count(children) > 0;
  return (
    <div className="glass rounded-2xl overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-white/10">
            {head.map((h) => (
              <th key={h} className="px-3 py-2.5 font-bold whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&>tr]:border-b [&>tr]:border-white/5 [&>tr:last-child]:border-0">{children}</tbody>
      </table>
      {!hasRows && <p className="px-4 py-6 text-center text-slate-600 text-xs">{empty ?? 'Nothing here yet.'}</p>}
    </div>
  );
};

export const Td = ({ children, className = '' }: { children?: React.ReactNode; className?: string }) => (
  <td className={`px-3 py-2 align-top text-slate-300 ${className}`}>{children}</td>
);

export const Bar = ({ value, max, color = 'bg-brand-secondary', className = 'w-24' }: { value: number; max: number; color?: string; className?: string }) => (
  <div className={`h-1.5 bg-white/10 rounded-full overflow-hidden ${className}`}>
    <div className={`h-full ${color}`} style={{ width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%` }} />
  </div>
);
