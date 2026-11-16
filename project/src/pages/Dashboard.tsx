
import type { DocStatus, DocType } from '@/types';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FolderKanban,
  Files,
  Sparkles,
  Loader2,
  ArrowUpRight,
  type LucideIcon,
} from 'lucide-react';

import { getDocuments } from '../api';
import { StatusBadge, FileTypeBadge } from '@/components/ui/Badges';
import { cn } from '@/lib/utils';
import type { NavKey } from '@/components/Sidebar';

interface DashboardProps {
  search: string;
  onNavigate: (k: NavKey) => void;
  onOpenProject: (id: string) => void;
}

interface ApiDocument {
  id: string;
  filename: string;
  content_type?: string | null;
  file_size?: number | null;
  file_path?: string | null;
  extracted_text?: string | null;
  page_count?: number | null;
  status?: string | null;
  created_at?: string | null;
}

interface DashboardDocument {
  id: string;
  name: string;
  type: string;
  project: string;
  sizeKb: number;
  updatedAt: string;
  status: string;
  aiReady: boolean;
}

function AnimatedNumber({ value }: { value: number }) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-3xl font-bold tracking-tight text-slate-900"
    >
      {value}
    </motion.span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tint,
  delay,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  tint: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -3 }}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover"
    >
      <div className="flex items-start justify-between">
        <div className={cn('grid h-11 w-11 place-items-center rounded-xl', tint)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4">
        <AnimatedNumber value={value} />
        <p className="mt-1 text-sm text-slate-500">{label}</p>
      </div>
    </motion.div>
  );
}

function formatSize(sizeBytes: number) {
  if (!sizeBytes || sizeBytes <= 0) return '—';

  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateValue?: string | null) {
  if (!dateValue) return '—';

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString();
}

function getFileType(document: ApiDocument): DocType {
  const filename = document.filename || '';
  const extension = filename.split('.').pop()?.toLowerCase();

  if (extension === 'pdf') return 'pdf';
  if (extension === 'docx') return 'docx';
  if (extension === 'xlsx') return 'xlsx';

  return 'pdf';
}
function normalizeDocument(document: ApiDocument): DashboardDocument {
  const rawStatus = (document.status || 'queued').toLowerCase();

  const validStatuses: DocStatus[] = [
    'ai-ready',
    'processed',
    'processing',
    'queued',
    'failed',
  ];

  const status: DocStatus = validStatuses.includes(rawStatus as DocStatus)
    ? (rawStatus as DocStatus)
    : 'queued';

  return {
    id: document.id,
    name: document.filename || 'Untitled document',
    type: getFileType(document),
    project: '—',
    sizeKb: document.file_size || 0,
    updatedAt: document.created_at || '',
    status,
    aiReady: status === 'ai-ready' || status === 'processed',
  };
}

export function Dashboard({
  search,
  onNavigate,
}: DashboardProps) {
  const [documents, setDocuments] = useState<DashboardDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadDocuments() {
      try {
        setLoading(true);
        setError('');

        const result = await getDocuments();

        if (!Array.isArray(result)) {
          throw new Error('The backend did not return a document list.');
        }

        if (isMounted) {
          setDocuments(result.map(normalizeDocument));
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Could not load documents from the backend.',
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadDocuments();

    return () => {
      isMounted = false;
    };
  }, []);

  const totalDocs = documents.length;

  const aiReady = documents.filter((document) => document.aiReady).length;

  const processing = documents.filter((document) => {
    const status = document.status.toLowerCase();

    return status === 'processing' || status === 'queued';
  }).length;

  const filteredDocs = useMemo(() => {
    if (!search.trim()) {
      return documents;
    }

    const query = search.toLowerCase();

    return documents.filter((document) =>
      document.name.toLowerCase().includes(query),
    );
  }, [documents, search]);

  const recentDocs = filteredDocs.slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome back
          </h1>

          <p className="text-sm text-slate-500">
            Here's what's happening across your document workspace today.
          </p>
        </div>

        <button
          onClick={() => onNavigate('documents')}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          View all documents <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={FolderKanban}
          label="Active Projects"
          value={0}
          tint="bg-blue-50 text-blue-600"
          delay={0}
        />

        <StatCard
          icon={Files}
          label="Total Documents"
          value={totalDocs}
          tint="bg-indigo-50 text-indigo-600"
          delay={0.05}
        />

        <StatCard
          icon={Sparkles}
          label="AI-Ready Documents"
          value={aiReady}
          tint="bg-emerald-50 text-emerald-600"
          delay={0.1}
        />

        <StatCard
          icon={Loader2}
          label="In Processing"
          value={processing}
          tint="bg-amber-50 text-amber-600"
          delay={0.15}
        />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Projects</h2>

          <button
            onClick={() => onNavigate('projects')}
            className="text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            See all
          </button>
        </div>

        <EmptyState message="No projects available yet." />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Recent Documents
          </h2>

          <button
            onClick={() => onNavigate('documents')}
            className="text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            See all
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          {loading ? (
            <div className="flex items-center justify-center gap-2 px-6 py-12 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading documents...
            </div>
          ) : error ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-medium text-red-600">
                Could not load documents
              </p>

              <p className="mt-2 text-sm text-slate-500">{error}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50/60 text-xs uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="px-5 py-3 font-semibold">File</th>
                      <th className="px-5 py-3 font-semibold">Project</th>
                      <th className="px-5 py-3 font-semibold">Size</th>
                      <th className="px-5 py-3 font-semibold">Updated</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {recentDocs.map((document) => (
                      <tr
                        key={document.id}
                        className="transition-colors hover:bg-slate-50/60"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <FileTypeBadge type={document.type} />

                            <span className="font-medium text-slate-700">
                              {document.name}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-3.5 text-slate-500">
                          {document.project}
                        </td>

                        <td className="px-5 py-3.5 text-slate-500">
                          {formatSize(document.sizeKb)}
                        </td>

                        <td className="px-5 py-3.5 text-slate-500">
                          {formatDate(document.updatedAt)}
                        </td>

                        <td className="px-5 py-3.5">
                          <StatusBadge status={document.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {recentDocs.length === 0 && (
                <EmptyState
                  message={
                    search.trim()
                      ? 'No documents match your search.'
                      : 'No documents uploaded yet.'
                  }
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
      <Files className="h-8 w-8 text-slate-300" />

      <p className="mt-3 text-sm text-slate-500">{message}</p>
    </div>
  );
}
