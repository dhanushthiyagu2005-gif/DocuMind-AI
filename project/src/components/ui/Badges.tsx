import { cn } from '@/lib/utils';
import type { DocStatus, DocType } from '@/types';

const statusConfig: Record<DocStatus, { label: string; cls: string; dot: string }> = {
  'ai-ready': { label: 'AI Ready', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', dot: 'bg-emerald-500' },
  processed: { label: 'Processed', cls: 'bg-blue-50 text-blue-700 ring-blue-600/20', dot: 'bg-blue-500' },
  processing: { label: 'Processing', cls: 'bg-amber-50 text-amber-700 ring-amber-600/20', dot: 'bg-amber-500' },
  queued: { label: 'Queued', cls: 'bg-slate-100 text-slate-600 ring-slate-500/20', dot: 'bg-slate-400' },
  failed: { label: 'Failed', cls: 'bg-rose-50 text-rose-700 ring-rose-600/20', dot: 'bg-rose-500' },
};

export function StatusBadge({ status, className }: { status: DocStatus; className?: string }) {
  const cfg = statusConfig[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        cfg.cls,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  );
}

const typeConfig: Record<DocType, { label: string; cls: string }> = {
  pdf: { label: 'PDF', cls: 'bg-rose-50 text-rose-600' },
  docx: { label: 'DOCX', cls: 'bg-blue-50 text-blue-600' },
  xlsx: { label: 'XLSX', cls: 'bg-emerald-50 text-emerald-600' },
};

export function FileTypeBadge({ type, className }: { type: DocType; className?: string }) {
  const cfg = typeConfig[type];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide',
        cfg.cls,
        className,
      )}
    >
      {cfg.label}
    </span>
  );
}
