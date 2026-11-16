export type DocStatus = 'processed' | 'processing' | 'queued' | 'failed' | 'ai-ready';
export type DocType = 'pdf' | 'docx' | 'xlsx';

export interface DocItem {
  id: string;
  name: string;
  type: DocType;
  project: string;
  projectId: string;
  sizeKb: number;
  updatedAt: string; // ISO
  status: DocStatus;
  aiReady: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  icon: string; // lucide icon key
  accent: string; // tailwind gradient classes
  documents: number;
  aiReady: number;
  processing: number;
  updatedAt: string;
  owner: string;
  tags: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  sources?: { doc: string; page: number }[];
  ts: string;
}

export interface Automation {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  lastRun: string;
  runs: number;
  category: 'summary' | 'report' | 'alert';
}

export interface DiffRow {
  label: string;
  docA: string;
  docB: string;
  status: 'added' | 'removed' | 'changed' | 'same';
}
