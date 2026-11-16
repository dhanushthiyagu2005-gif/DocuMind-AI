import { motion } from 'framer-motion'; 
import { Search, Upload, FileText, FileSpreadsheet, FileType2, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { formatSize, formatDate } from '@/data/mockData';
import { StatusBadge, FileTypeBadge } from '@/components/ui/Badges';
import { cn } from '@/lib/utils';
import type { DocItem, DocType, DocStatus } from '@/types';



interface DocumentsProps {
  search: string;
  onUpload: () => void;
}

const typeIcon: Record<DocType, typeof FileText> = {
  pdf: FileType2,
  docx: FileText,
  xlsx: FileSpreadsheet,
};

const typeColor: Record<DocType, string> = {
  pdf: 'bg-rose-50 text-rose-600',
  docx: 'bg-blue-50 text-blue-600',
  xlsx: 'bg-emerald-50 text-emerald-600',
};

export function Documents({ search, onUpload }: DocumentsProps) {

const [documents, setDocuments] = useState<DocItem[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');

  const [localSearch, setLocalSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | DocType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | DocStatus>('all');


  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('http://127.0.0.1:8002/api/documents');

      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const data = await response.json();
      console.log("Documents API response:", data);

      const mappedDocuments: DocItem[] = data.map((doc: any) => {
        const filename = doc.filename || 'Untitled document';
        const extension = filename.split('.').pop()?.toLowerCase();

        const type: DocType =
          extension === 'docx' ? 'docx' :
          extension === 'xlsx' ? 'xlsx' :
          'pdf';

        const status: DocStatus =
          doc.status === 'failed' ? 'failed' :
          doc.status === 'processing' ? 'processing' :
          doc.status === 'queued' ? 'queued' :
          doc.status === 'ai-ready' ? 'ai-ready' :
          'processed';

        return {
          id: doc.id,
          name: filename,
          type,
          project: 'My Documents',
          projectId: '',
          sizeKb: Math.round((doc.file_size || 0) / 1024),
          updatedAt: doc.created_at,
          status,
          aiReady: status === 'ai-ready',
        };
      });

      setDocuments(mappedDocuments);
    } catch (err) {
      setError('Unable to load documents. Please check the backend.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);


const deleteDocument = async (id: string, filename: string) => {
  const confirmed = window.confirm(
    `Are you sure you want to delete "${filename}"? This action cannot be undone.`
  );

  if (!confirmed) return;

  try {
    const response = await fetch(
      `http://127.0.0.1:8002/api/documents/${id}`,
      { method: 'DELETE' }
    );

    if (!response.ok) {
      throw new Error('Failed to delete document');
    }

    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    alert('Document deleted successfully!');
  } catch (err) {
    console.error(err);
    alert('Unable to delete document. Please check the backend.');
  }
};

  const q = (search + ' ' + localSearch).trim().toLowerCase();
  const filtered = useMemo(() => {
    return documents.filter((d) => {
      const matchesSearch = !q || d.name.toLowerCase().includes(q) || d.project.toLowerCase().includes(q);
      const matchesType = typeFilter === 'all' || d.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [q, typeFilter, statusFilter]);

  const counts = {
    all: documents.length,
    pdf: documents.filter((d) => d.type === 'pdf').length,
    docx: documents.filter((d) => d.type === 'docx').length,
    xlsx: documents.filter((d) => d.type === 'xlsx').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">All Documents</h1>
          <p className="text-sm text-slate-500">{documents.length} files across {new Set(documents.map((d) => d.project)).size} projects</p>
        </div>
        <button
          onClick={onUpload}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition-transform hover:-translate-y-0.5"
        >
          <Upload className="h-4 w-4" /> Upload
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div
          onClick={() => onUpload()}
          className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white px-4 py-6 text-center transition-colors hover:border-brand-300 hover:bg-brand-50/40"
        >
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600 transition-transform group-hover:scale-110">
            <Upload className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-medium text-slate-700">Drag files here to upload</p>
          <p className="text-xs text-slate-400">PDF, DOCX, XLSX up to 25 MB</p>
        </div>
        {(Object.keys(counts) as (keyof typeof counts)[]).map((k) => {
          const Icon = k === 'all' ? FileText : typeIcon[k as DocType];
          const color = k === 'all' ? 'bg-slate-100 text-slate-600' : typeColor[k as DocType];
          return (
            <button
              key={k}
              onClick={() => setTypeFilter(k === 'all' ? 'all' : (k as DocType))}
              className={cn(
                'flex items-center gap-3 rounded-2xl border bg-white p-4 text-left transition-all',
                (typeFilter === k || (k === 'all' && typeFilter === 'all')) ? 'border-brand-300 ring-2 ring-brand-100' : 'border-slate-200 hover:border-slate-300',
              )}
            >
              <div className={cn('grid h-11 w-11 place-items-center rounded-xl', color)}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xl font-bold text-slate-900">{counts[k]}</div>
                <div className="text-xs uppercase tracking-wide text-slate-400">{k === 'all' ? 'All files' : k}</div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search files…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm focus:border-brand-300 focus:outline-none focus:ring-4 focus:ring-brand-100"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(['all', 'ai-ready', 'processed', 'processing', 'queued', 'failed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors',
                statusFilter === s ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
              )}
            >
              {s.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

{loading && (
  <p className="py-6 text-center text-sm text-muted-foreground">
    Loading documents...
  </p>
)}

{error && (
  <p className="py-6 text-center text-sm text-red-500">
    {error}
  </p>
)}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/60 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-3 font-semibold">File</th>
                <th className="px-5 py-3 font-semibold">Project</th>
                <th className="px-5 py-3 font-semibold">Size</th>
                <th className="px-5 py-3 font-semibold">Updated</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((d, i) => {
                const Icon = typeIcon[d.type];
                return (
                  <motion.tr
                    key={d.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.02, 0.3) }}
                    className="transition-colors hover:bg-slate-50/60"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={cn('grid h-9 w-9 place-items-center rounded-lg', typeColor[d.type])}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-700">{d.name}</div>
                          <div className="text-[11px] text-slate-400 sm:hidden">{d.project}</div>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-5 py-3.5 text-slate-500 sm:table-cell">{d.project}</td>
                    <td className="px-5 py-3.5 text-slate-500">{formatSize(d.sizeKb)}</td>
                    <td className="px-5 py-3.5 text-slate-500">{formatDate(d.updatedAt)}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={d.status} /></td>


<td className="px-5 py-3.5">
  <button
    onClick={() => deleteDocument(d.id, d.name)}
    className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
    title="Delete document"
  >
    <Trash2 className="h-4 w-4" />
  </button>
</td>

                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="grid place-items-center px-6 py-16 text-center">
            <FileText className="h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm text-slate-500">No documents match your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
