
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Search,
  X,
  FolderKanban,
  FileText,
  FileSpreadsheet,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8002";

// Project interface
interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

// Document interface
interface DocumentItem {
  id: string;
  filename: string;
  file_size: number;
  project_id: string | null;
  status: string;
}

interface ProjectsProps {
  search: string;
  openProjectId: string | null;
  onOpenProject: (id: string | null) => void;
  onUpload: () => void;
}

// Main Projects component
export function Projects({
  search,
  openProjectId,
  onOpenProject,
  onUpload,
}: ProjectsProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [localSearch, setLocalSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load projects
  async function loadProjects() {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API_URL}/api/projects`);

      if (!response.ok) {
        throw new Error('Could not load projects.');
      }

      const data = await response.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Something went wrong.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  const openProject = projects.find(
    (project) => project.id === openProjectId
  );

  const query = `${search} ${localSearch}`.trim().toLowerCase();

  const filteredProjects = useMemo(() => {
    if (!query) return projects;

    return projects.filter(
      (project) =>
        project.name.toLowerCase().includes(query) ||
        (project.description || '').toLowerCase().includes(query)
    );
  }, [projects, query]);

  // Open project details
  if (openProject) {
    return (
      <ProjectDetail
        project={openProject}
        onBack={() => onOpenProject(null)}
        onUpload={onUpload}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Projects
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage document sets across your initiatives.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Filter projects..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-4 focus:ring-brand-100"
            />
          </div>

          <button
            onClick={() => setShowNew(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            New Project
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
          Loading projects...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">
          <p className="text-sm text-red-600">{error}</p>

          <button
            onClick={loadProjects}
            className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm text-white"
          >
            Try Again
          </button>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
          <FolderKanban className="mb-3 h-10 w-10 text-slate-300" />

          <h3 className="font-semibold text-slate-800">
            {projects.length === 0
              ? 'No projects yet'
              : 'No projects match your search'}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            {projects.length === 0
              ? 'Create your first project to get started.'
              : 'Try another project name.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project, index) => (
            <motion.button
              key={project.id}
              onClick={() => onOpenProject(project.id)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              whileHover={{ y: -4 }}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-indigo-600 text-white">
                  <FolderKanban className="h-6 w-6" />
                </div>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
                  Project
                </span>
              </div>

              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                {project.name}
              </h3>

              <p className="mt-2 line-clamp-3 text-sm text-slate-500">
                {project.description || 'No description provided.'}
              </p>

              <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400">
                Created{' '}
                {project.created_at
                  ? new Date(project.created_at).toLocaleDateString()
                  : 'Recently'}
              </div>
            </motion.button>
          ))}
        </div>
      )}

      <NewProjectModal
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreated={(project) => {
          setProjects((previous) => [project, ...previous]);
          setShowNew(false);
        }}
      />
    </div>
  );
}

// Project detail component
function ProjectDetail({
  project,
  onBack,
  onUpload,
}: {
  project: Project;
  onBack: () => void;
  onUpload: () => void;
}) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Load uploaded documents
  async function loadDocuments() {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API_URL}/api/documents`);

      if (!response.ok) {
        throw new Error('Could not load documents.');
      }

      const data = await response.json();
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Something went wrong.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDocuments();
  }, [project.id]);

  // Documents already linked to this project
  const linkedDocuments = documents.filter(
    (doc) => doc.project_id === project.id
  );

  // Documents available to select
  const availableDocuments = documents.filter(
    (doc) => !doc.project_id || doc.project_id === project.id
  );

  // Select or unselect document
  function toggleDocument(id: string) {
    setSelectedIds((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  }

  // Add selected documents to project
  async function addSelectedDocuments() {
    if (selectedIds.length === 0) return;

    try {
      setSaving(true);
      setError('');

      for (const documentId of selectedIds) {
        const response = await fetch(
          `${API_URL}/api/projects/${project.id}/documents/${documentId}`,
          { method: 'POST' }
        );

        if (!response.ok) {
          const result = await response.json();
          throw new Error(
            result.detail || 'Could not add document.'
          );
        }
      }

      setSelectedIds([]);
      setShowPicker(false);
      await loadDocuments();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Something went wrong.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to projects
      </button>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-indigo-600 text-white">
              <FolderKanban className="h-7 w-7" />
            </div>

            <h1 className="text-2xl font-bold text-slate-900">
              {project.name}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {project.description || 'No description provided.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setSelectedIds([]);
                setError('');
                setShowPicker(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Add existing document
            </button>

            <button
              onClick={onUpload}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              Upload new
            </button>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Project documents ({linkedDocuments.length})
          </h2>

          {loading ? (
            <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
              Loading documents...
            </p>
          ) : linkedDocuments.length === 0 ? (
            <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
              No documents added to this project yet.
            </p>
          ) : (
            <div className="space-y-2">
              {linkedDocuments.map((doc) => {
                const extension = doc.filename.split('.').pop()?.toLowerCase();
                const Icon =
                  extension === 'xlsx'
                    ? FileSpreadsheet
                    : FileText;

                return (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 p-4"
                  >
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {doc.filename}
                      </p>
                      <p className="text-xs text-slate-400">
                        {doc.status || 'Uploaded'}
                      </p>
                    </div>

                    <span className="text-xs text-emerald-600">
                      Linked
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {error && !showPicker && (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        )}
      </div>

      {/* Existing document selection popup */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!saving) setShowPicker(false);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Add existing documents
                  </h2>

                  <p className="text-sm text-slate-500">
                    Select documents for {project.name}
                  </p>
                </div>

                <button
                  onClick={() => setShowPicker(false)}
                  disabled={saving}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {loading ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  Loading documents...
                </p>
              ) : availableDocuments.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  No available documents. Upload a document first.
                </p>
              ) : (
                <div className="max-h-80 space-y-2 overflow-y-auto">
                  {availableDocuments.map((doc) => {
                    const extension = doc.filename.split('.').pop()?.toLowerCase();
                    const Icon =
                      extension === 'xlsx'
                        ? FileSpreadsheet
                        : FileText;

                    return (
                      <label
                        key={doc.id}
                        className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(doc.id)}
                          onChange={() => toggleDocument(doc.id)}
                          className="h-4 w-4 accent-indigo-600"
                        />

                        <Icon className="h-5 w-5 text-indigo-600" />

                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">
                          {doc.filename}
                        </span>

                        <span className="text-xs text-slate-400">
                          {doc.project_id === project.id
                            ? 'Already added'
                            : 'Available'}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {error && (
                <p className="mt-3 text-sm text-red-600">{error}</p>
              )}

              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={() => setShowPicker(false)}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  onClick={addSelectedDocuments}
                  disabled={saving || selectedIds.length === 0}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? 'Adding...'
                    : `Add to project (${selectedIds.length})`}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// New project creation popup
function NewProjectModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (project: Project) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function createProject() {
    if (!name.trim()) {
      setError('Please enter a project name.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const response = await fetch(`${API_URL}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to create project.');
      }

      onCreated(data);
      setName('');
      setDescription('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Something went wrong.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="font-semibold text-slate-900">
                Create New Project
              </h3>

              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-400">
                  Project name
                </label>

                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter project name"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-brand-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-slate-400">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="What is this project about?"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-brand-100"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={onClose}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
                >
                  Cancel
                </button>

                <button
                  onClick={createProject}
                  disabled={saving}
                  className={cn(
                    'rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700',
                    saving && 'cursor-not-allowed opacity-60'
                  )}
                >
                  {saving ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
