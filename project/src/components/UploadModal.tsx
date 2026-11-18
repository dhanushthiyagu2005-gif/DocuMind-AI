
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud,
  X,
  FileText,
  FileType2,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { DocType } from '@/types';

interface UploadItem {
  id: string;
  name: string;
  size: number;
  type: DocType;
  progress: number;
  state: 'uploading' | 'processing' | 'done' | 'error';
  file: File;
}

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8002";

const accept = '.pdf,.docx,.xlsx';
const maxBytes = 25 * 1024 * 1024;

function detectType(name: string): DocType {
  const lower = name.toLowerCase();

  if (lower.endsWith('.pdf')) return 'pdf';
  if (lower.endsWith('.docx')) return 'docx';
  if (lower.endsWith('.xlsx')) return 'xlsx';

  return 'pdf';
}

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

const typeIcon: Record<DocType, typeof FileText> = {
  pdf: FileType2,
  docx: FileText,
  xlsx: FileText,
};

const typeColor: Record<DocType, string> = {
  pdf: 'bg-rose-50 text-rose-600',
  docx: 'bg-blue-50 text-blue-600',
  xlsx: 'bg-emerald-50 text-emerald-600',
};

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  onUploadComplete: () => void;
}

export function UploadModal({
  open,
  onClose,
  onUploadComplete,
}: UploadModalProps) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const requests = useRef<Record<string, XMLHttpRequest>>({});

  const uploadFile = useCallback((file: File, id: string) => {
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    requests.current[id] = xhr;

    xhr.open('POST', `${API_URL}/api/documents/upload`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = Math.round(
          (event.loaded / event.total) * 100
        );

        setItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, progress } : item
          )
        );
      }
    };

    xhr.onload = () => {
      delete requests.current[id];

      if (xhr.status >= 200 && xhr.status < 300) {
        onUploadComplete();

        setItems((prev) =>
          prev.map((item) =>
            item.id === id
              ? { ...item, progress: 100, state: 'processing' }
              : item
          )
        );

        window.setTimeout(() => {
          setItems((prev) =>
            prev.map((item) =>
              item.id === id ? { ...item, state: 'done' } : item
            )
          );
        }, 1000);
      } else {
        let message = 'Upload failed.';

        try {
          const response = JSON.parse(xhr.responseText);
          if (response.detail) message = response.detail;
        } catch {
          // Keep default error message
        }

        setError(message);

        setItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, state: 'error' } : item
          )
        );
      }
    };

    xhr.onerror = () => {
      delete requests.current[id];

      setError(
        'Could not connect to the DocuMind backend. Make sure FastAPI is running.'
      );

      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, state: 'error' } : item
        )
      );
    };

    xhr.onabort = () => {
      delete requests.current[id];
    };

    xhr.send(formData);
  }, [onUploadComplete]);

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      setError(null);

      const arr = Array.from(files);
      const newItems: UploadItem[] = [];

      arr.forEach((file) => {
        const lower = file.name.toLowerCase();

        if (
          !lower.endsWith('.pdf') &&
          !lower.endsWith('.docx') &&
          !lower.endsWith('.xlsx')
        ) {
          setError(
            `${file.name}: Only PDF, DOCX and XLSX files are supported.`
          );
          return;
        }

        if (file.size > maxBytes) {
          setError(`${file.name} exceeds the 25 MB limit.`);
          return;
        }

        const id = Math.random().toString(36).slice(2);

        const item: UploadItem = {
          id,
          name: file.name,
          size: file.size,
          type: detectType(file.name),
          progress: 0,
          state: 'uploading',
          file,
        };

        newItems.push(item);
      });

      setItems((prev) => [...prev, ...newItems]);

      newItems.forEach((item) => {
        uploadFile(item.file, item.id);
      });
    },
    [uploadFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);

      if (e.dataTransfer.files?.length) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const clearItem = (id: string) => {
    if (requests.current[id]) {
      requests.current[id].abort();
      delete requests.current[id];
    }

    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClose = () => {
    Object.values(requests.current).forEach((xhr) => {
      xhr.abort();
    });

    requests.current = {};
    setItems([]);
    setError(null);

    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/50 p-4 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{
              type: 'spring',
              stiffness: 320,
              damping: 30,
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-card-hover"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Upload Documents
                </h3>

                <p className="text-xs text-slate-500">
                  PDF, DOCX or XLSX — up to 25 MB each
                </p>
              </div>

              <button
                onClick={handleClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={cn(
                  'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors',
                  dragging
                    ? 'border-brand-400 bg-brand-50'
                    : 'border-slate-200 hover:border-brand-300 hover:bg-slate-50'
                )}
              >
                <motion.div
                  animate={dragging ? { y: -4 } : { y: 0 }}
                  className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow"
                >
                  <UploadCloud className="h-7 w-7" />
                </motion.div>

                <p className="mt-4 text-sm font-medium text-slate-700">
                  Drag &amp; drop files here, or{' '}
                  <span className="text-brand-600">browse</span>
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  PDF, Word and Excel files are supported
                </p>

                <input
                  ref={inputRef}
                  type="file"
                  accept={accept}
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      addFiles(e.target.files);
                    }
                    e.target.value = '';
                  }}
                />
              </div>

              {error && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              {items.length > 0 && (
                <div className="mt-4 max-h-64 space-y-2 overflow-y-auto scrollbar-thin pr-1">
                  {items.map((item) => {
                    const Icon = typeIcon[item.type];

                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3"
                      >
                        <div
                          className={cn(
                            'grid h-10 w-10 shrink-0 place-items-center rounded-lg',
                            typeColor[item.type]
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-sm font-medium text-slate-700">
                              {item.name}
                            </span>

                            <button
                              onClick={() => clearItem(item.id)}
                              className="shrink-0 text-slate-400 hover:text-slate-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-[11px] text-slate-400">
                              {formatBytes(item.size)}
                            </span>

                            {item.state === 'uploading' && (
                              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                                <div
                                  className="h-full rounded-full bg-brand-500 transition-all"
                                  style={{
                                    width: `${item.progress}%`,
                                  }}
                                />
                              </div>
                            )}

                            {item.state === 'processing' && (
                              <span className="flex items-center gap-1 text-[11px] text-amber-600">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Processing…
                              </span>
                            )}

                            {item.state === 'done' && (
                              <span className="flex items-center gap-1 text-[11px] text-emerald-600">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Uploaded
                              </span>
                            )}

                            {item.state === 'error' && (
                              <span className="flex items-center gap-1 text-[11px] text-rose-600">
                                <AlertCircle className="h-3.5 w-3.5" />
                                Failed
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-5 flex items-center justify-between">
                <p className="text-[11px] text-slate-400">
                  Connected to DocuMind AI backend
                </p>

                <button
                  onClick={handleClose}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Done
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
