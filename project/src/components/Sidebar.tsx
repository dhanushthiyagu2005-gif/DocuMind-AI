import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FolderKanban,
  Files,
  Sparkles,
  GitCompare,
  Workflow,
  Settings,
  ChevronLeft,
  BrainCircuit,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type NavKey =
  | 'dashboard'
  | 'projects'
  | 'documents'
  | 'assistant'
  | 'automations'
  | 'settings';

const nav: { key: NavKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'projects', label: 'Projects', icon: FolderKanban },
  { key: 'documents', label: 'All Documents', icon: Files },
  { key: 'assistant', label: 'AI Assistant', icon: Sparkles },
  { key: 'automations', label: 'Automations', icon: Workflow },
  { key: 'settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  active: NavKey;
  onNavigate: (k: NavKey) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({
  active,
  onNavigate,
  mobileOpen,
  onCloseMobile,
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  return (
    <>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCloseMobile}
            className="fixed inset-0 z-30 bg-navy-950/50 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        animate={{ width: collapsed ? 80 : 256 }}
        transition={{ type: 'spring', stiffness: 280, damping: 30 }}
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden flex-col bg-navy-950 text-slate-300 lg:flex',
        )}
      >
        <SidebarInner active={active} onNavigate={onNavigate} collapsed={collapsed} onToggleCollapse={onToggleCollapse} />
      </motion.aside>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            className="fixed inset-y-0 left-0 z-40 flex w-[256px] flex-col bg-navy-950 text-slate-300 lg:hidden"
          >
            <button
              onClick={onCloseMobile}
              className="absolute right-3 top-4 rounded-md p-1.5 text-slate-400 hover:bg-navy-800 hover:text-white"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarInner active={active} onNavigate={(k) => { onNavigate(k); onCloseMobile(); }} collapsed={false} onToggleCollapse={() => {}} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function SidebarInner({
  active,
  onNavigate,
  collapsed,
  onToggleCollapse,
}: {
  active: NavKey;
  onNavigate: (k: NavKey) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  return (
    <>
      <div className={cn('flex h-16 items-center gap-2.5 border-b border-navy-800/80 px-4', collapsed && 'justify-center px-0')}>
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-glow">
          <BrainCircuit className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="leading-tight">
            <div className="text-sm font-bold text-white">DocuMind AI</div>
            <div className="text-[11px] text-slate-400">Document Automation</div>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-thin px-3 py-4">
        {nav.map((item) => {
          const isActive = active === item.key;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={cn(
                'group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive ? 'text-white' : 'text-slate-400 hover:bg-navy-800/60 hover:text-white',
                collapsed && 'justify-center px-0',
              )}
              title={collapsed ? item.label : undefined}
            >
              {isActive && (
                <motion.div
                  layoutId="active-nav"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-brand-600/90 to-brand-700/80"
                  transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                />
              )}
              <Icon className={cn('relative z-10 h-5 w-5 shrink-0', isActive && 'text-white')} />
              {!collapsed && <span className="relative z-10">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="m-3 rounded-xl bg-navy-800/60 p-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <Sparkles className="h-4 w-4 text-brand-300" />
            AI Credits
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-navy-700">
            <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-brand-400 to-brand-600" />
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] text-slate-400">
            <span>6,820 used</span>
            <span>10,000</span>
          </div>
        </div>
      )}

      <div className={cn('hidden border-t border-navy-800/80 p-3 lg:block', collapsed && 'px-2')}>
        <button
          onClick={onToggleCollapse}
          className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium text-slate-400 hover:bg-navy-800 hover:text-white"
        >
          <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
          {!collapsed && 'Collapse'}
        </button>
      </div>
    </>
  );
}
