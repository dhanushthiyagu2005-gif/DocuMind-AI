import { motion } from 'framer-motion';
import { GitCompare, ArrowRight, FileText, Plus, Minus, Edit3, Check } from 'lucide-react';
import { useMemo, useState } from 'react';
import { documents } from '@/data/mockData';
import { diffData } from '@/data/mockData';
import { cn } from '@/lib/utils';
import type { DiffRow } from '@/types';

export function Compare() {
  const [docA, setDocA] = useState<string>(documents[0]?.id ?? '');
  const [docB, setDocB] = useState<string>(documents[3]?.id ?? '');

  const a = documents.find((d) => d.id === docA);
  const b = documents.find((d) => d.id === docB);

  const stats = useMemo(() => {
    const total = diffData.length;
    const changed = diffData.filter((r) => r.status === 'changed').length;
    const added = diffData.filter((r) => r.status === 'added').length;
    const removed = diffData.filter((r) => r.status === 'removed').length;
    const same = diffData.filter((r) => r.status === 'same').length;
    return { total, changed, added, removed, same };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow">
          <GitCompare className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Compare Documents</h1>
          <p className="text-sm text-slate-500">Select two documents to view a structured diff</p>
        </div>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-[1fr_auto_1fr]">
        <DocSelect label="Document A" value={docA} onChange={setDocA} />
        <div className="hidden items-center md:flex">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-500">
            <GitCompare className="h-5 w-5" />
          </div>
        </div>
        <DocSelect label="Document B" value={docB} onChange={setDocB} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Total fields" value={stats.total} color="text-slate-900" />
        <StatTile label="Changed" value={stats.changed} color="text-amber-600" />
        <StatTile label="Added" value={stats.added} color="text-emerald-600" />
        <StatTile label="Removed" value={stats.removed} color="text-rose-600" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <FileText className="h-4 w-4 text-brand-500" /> Differences
          </div>
          <div className="hidden text-xs text-slate-400 sm:block">Showing {diffData.length} fields</div>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/60 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-3 font-semibold">Field</th>
                <th className="px-5 py-3 font-semibold">
                  <span className="text-slate-600">{a?.name ?? 'Select A'}</span>
                </th>
                <th className="px-5 py-3 font-semibold">
                  <span className="text-slate-600">{b?.name ?? 'Select B'}</span>
                </th>
                <th className="px-5 py-3 font-semibold">Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {diffData.map((row, i) => (
                <DiffTableRowView key={i} row={row} delay={i * 0.03} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DocSelect({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 focus:border-brand-300 focus:outline-none focus:ring-4 focus:ring-brand-100"
      >
        {documents.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name} — {d.project}
          </option>
        ))}
      </select>
    </div>
  );
}

function DiffTableRowView({ row, delay }: { row: DiffRow; delay: number }) {
  const cfg = {
    changed: { icon: Edit3, cls: 'bg-amber-50 text-amber-700', label: 'Changed' },
    added: { icon: Plus, cls: 'bg-emerald-50 text-emerald-700', label: 'Added' },
    removed: { icon: Minus, cls: 'bg-rose-50 text-rose-700', label: 'Removed' },
    same: { icon: Check, cls: 'bg-slate-50 text-slate-500', label: 'Same' },
  }[row.status];
  const Icon = cfg.icon;

  return (
    <motion.tr
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="transition-colors hover:bg-slate-50/60"
    >
      <td className="px-5 py-3.5 font-medium text-slate-600">{row.label}</td>
      <td className={cn('px-5 py-3.5', row.status === 'removed' ? 'text-rose-600 line-through' : 'text-slate-700')}>
        {row.docA || '—'}
      </td>
      <td className={cn('px-5 py-3.5', row.status === 'added' ? 'text-emerald-600 font-medium' : 'text-slate-700')}>
        {row.docB || '—'}
      </td>
      <td className="px-5 py-3.5">
        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', cfg.cls)}>
          <Icon className="h-3.5 w-3.5" /> {cfg.label}
        </span>
      </td>
    </motion.tr>
  );
}

function StatTile({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-card">
      <div className={cn('text-2xl font-bold', color)}>{value}</div>
      <div className="mt-0.5 text-xs uppercase tracking-wide text-slate-400">{label}</div>
    </div>
  );
}
