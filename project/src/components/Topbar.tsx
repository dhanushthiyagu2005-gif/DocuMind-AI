import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, Upload, Menu, ChevronDown, CircleUser } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface TopbarProps {
  onUploadClick: () => void;
  onOpenMobile: () => void;
  search: string;
  onSearch: (v: string) => void;
}

export function Topbar({ onUploadClick, onOpenMobile, search, onSearch }: TopbarProps) {
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-slate-200 bg-white/85 px-4 backdrop-blur-md md:gap-3 md:px-6">
      <button
        onClick={onOpenMobile}
        className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="relative min-w-0 flex-1 sm:max-w-md md:max-w-lg lg:max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search documents, projects, people…"
          className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 transition-colors focus:border-brand-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-100"
        />
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <div className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative rounded-xl p-2.5 text-slate-500 hover:bg-slate-100"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
          </button>
          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-2 shadow-card-hover"
              >
                <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Notifications
                </div>
                {[
                  { t: 'Firmware_Release_Notes.docx processed', s: 'AI summary is ready', c: 'bg-emerald-500' },
                  { t: 'Supplier_Quality_Scorecard.xlsx failed', s: 'Corrupt file detected', c: 'bg-rose-500' },
                  { t: 'Weekly report generated', s: 'Delivered to 4 stakeholders', c: 'bg-blue-500' },
                ].map((n, i) => (
                  <div key={i} className="flex gap-3 rounded-lg px-3 py-2.5 hover:bg-slate-50">
                    <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.c)} />
                    <div className="text-sm">
                      <div className="font-medium text-slate-700">{n.t}</div>
                      <div className="text-xs text-slate-500">{n.s}</div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={onUploadClick}
          className="hidden items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition-transform hover:-translate-y-0.5 active:translate-y-0 sm:flex"
        >
          <Upload className="h-4 w-4" />
          Upload Document
        </button>

        <button
          onClick={onUploadClick}
          className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-glow sm:hidden"
          aria-label="Upload"
        >
          <Upload className="h-4 w-4" />
        </button>

        <button className="flex items-center gap-2 rounded-xl p-1 pr-2 hover:bg-slate-100">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-navy-900 text-white">
            <CircleUser className="h-5 w-5" />
          </div>
          <div className="hidden text-left md:block">
            <div className="text-xs font-semibold text-slate-700">Dhanush T</div>
            <div className="text-[11px] text-slate-400">Admin</div>
          </div>
          <ChevronDown className="hidden h-4 w-4 text-slate-400 md:block" />
        </button>
      </div>
    </header>
  );
}
