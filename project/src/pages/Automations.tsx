import { motion } from 'framer-motion';
import {
  Workflow,
  Sparkles,
  FileBarChart,
  BellRing,
  ShieldCheck,
  LayoutDashboard,
  Play,
  Pause,
  Clock,
  Activity,
} from 'lucide-react';
import { useState } from 'react';
import { automations } from '@/data/mockData';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import type { Automation } from '@/types';

const iconMap: Record<string, LucideIcon> = {
  Sparkles,
  FileBarChart,
  BellRing,
  ShieldCheck,
  LayoutDashboard,
};

const categoryColor: Record<Automation['category'], string> = {
  summary: 'from-violet-500 to-indigo-600',
  report: 'from-blue-500 to-cyan-600',
  alert: 'from-amber-500 to-orange-600',
};

export function Automations() {
  const [items, setItems] = useState<Automation[]>(automations);

  const toggle = (id: string) => {
    setItems((prev) => prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)));
  };

  const activeCount = items.filter((a) => a.enabled).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow">
            <Workflow className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Automation Center</h1>
            <p className="text-sm text-slate-500">{activeCount} of {items.length} workflows active</p>
          </div>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
          <Workflow className="h-4 w-4" /> New Workflow
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((a, i) => {
          const Icon = iconMap[a.icon] ?? Sparkles;
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -3 }}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover"
            >
              <div className="flex items-start justify-between">
                <div className={cn('grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br text-white shadow-sm', categoryColor[a.category])}>
                  <Icon className="h-5 w-5" />
                </div>
                <Toggle enabled={a.enabled} onToggle={() => toggle(a.id)} />
              </div>

              <h3 className="mt-4 text-base font-semibold text-slate-900">{a.name}</h3>
              <p className="mt-1 flex-1 text-sm text-slate-500">{a.description}</p>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5" /> {a.runs} runs
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> {a.lastRun}
                </span>
              </div>

              <div className="mt-3">
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
                    a.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500',
                  )}
                >
                  <span className={cn('h-1.5 w-1.5 rounded-full', a.enabled ? 'bg-emerald-500' : 'bg-slate-400')} />
                  {a.enabled ? 'Active' : 'Paused'}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-card">
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">About automations</h3>
            <p className="mt-1 text-sm text-slate-500">
              Workflows run automatically based on the triggers shown. In this demo, toggles and run
              counts are illustrative — connecting a backend (FastAPI + AI API) will enable real
              execution and history.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      role="switch"
      aria-checked={enabled}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
        enabled ? 'bg-brand-600' : 'bg-slate-200',
      )}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={cn(
          'inline-block h-5 w-5 rounded-full bg-white shadow',
          enabled ? 'ml-auto mr-0.5' : 'ml-0.5',
        )}
      >
        <span className="sr-only">{enabled ? 'Pause' : 'Enable'}</span>
      </motion.span>
    </button>
  );
}

// keep Play/Pause referenced for potential icon use
void Play;
void Pause;
