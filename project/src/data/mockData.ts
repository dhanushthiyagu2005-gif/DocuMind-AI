
import type { Project, DocItem, Automation, ChatMessage } from '@/types';

// Empty projects – new projects can be added through the application.
export const projects: Project[] = [];

// Empty documents – real documents will come from the backend.
export const documents: DocItem[] = [];

// Automation sample data – unchanged for now.
export const automations: Automation[] = [
  { id: 'a1', name: 'Automatic Document Summaries', description: 'Generate a concise AI summary for every new document once processing completes.', icon: 'Sparkles', enabled: true, lastRun: '2 min ago', runs: 1284, category: 'summary' },
  { id: 'a2', name: 'Weekly Report Generation', description: 'Compile a cross-project report every Monday at 08:00 and deliver it to stakeholders.', icon: 'FileBarChart', enabled: true, lastRun: '3h ago', runs: 52, category: 'report' },
  { id: 'a3', name: 'Document Change Alerts', description: 'Notify the project owner when a watched document is modified or re-uploaded.', icon: 'BellRing', enabled: false, lastRun: '1d ago', runs: 318, category: 'alert' },
  { id: 'a4', name: 'Compliance Flag Detection', description: 'Scan new documents for compliance keywords and raise a review flag if matched.', icon: 'ShieldCheck', enabled: true, lastRun: '12 min ago', runs: 742, category: 'alert' },
  { id: 'a5', name: 'Monthly Executive Digest', description: 'Summarize project activity and key metrics into a leadership-ready digest.', icon: 'LayoutDashboard', enabled: false, lastRun: '6d ago', runs: 9, category: 'report' },
];

export const suggestedQuestions = [
  'Summarize the Smart Meter X9 spec',
  'What changed in Firmware Release Notes?',
  'List compliance risks in IoT Architecture',
  'Compare QA Test Plan vs Field Test Results',
];

export const sampleChat: ChatMessage[] = [
  {
    id: 'm1',
    role: 'assistant',
    text: "Hi! I'm DocuMind AI. I can answer questions across all your indexed project documents. Ask me anything, or pick a suggested question to get started.",
    ts: '2026-10-20T09:00:00Z',
  },
];

export const initialAssistantReply = (q: string): ChatMessage => {
  const lower = q.toLowerCase();

  let text = "Based on the indexed documents, here's a concise summary of the key points you asked about. The relevant sources are cited below each section so you can verify the answer against the original files.";

  if (lower.includes('summar')) {
    text = "Here's a summary drawn from the most relevant project documents: the X9 meter targets 12-year battery life, supports NB-IoT and LoRaWAN, and meets IP68 ingress protection. Firmware v3.2 introduced adaptive sampling to reduce power draw by 18%. Field test results across 1,240 units show a 99.2% telemetry delivery rate.";
  } else if (lower.includes('chang')) {
    text = "The latest firmware release notes describe three material changes: (1) adaptive sampling interval logic, (2) a patched reconnect backoff that resolves the 0.3% dropout seen in Q2, and (3) a new OTA integrity check. Two deprecated AT commands were removed.";
  } else if (lower.includes('compliance')) {
    text = "I flagged two potential compliance considerations in the IoT Architecture overview: data residency for EU deployments (GDPR Article 44) and encryption-at-rest requirements aligned with NIST SP 800-171. No blocking issues were found, but both should be reviewed before the production rollout.";
  } else if (lower.includes('compare')) {
    text = "The QA Test Plan and Field Test Results differ in scope: the test plan defines 38 acceptance criteria, while field results cover 31 of those. Five criteria remain unverified in the field data and are marked as pending. Pass rates are otherwise consistent at 96–98%.";
  }

  return {
    id: 'r-' + Date.now(),
    role: 'assistant',
    text,
    sources: [
      { doc: 'SmartMeter_X9_Spec_v3.pdf', page: 4 },
      { doc: 'Firmware_Release_Notes.docx', page: 2 },
    ],
    ts: new Date().toISOString(),
  };
};

export const diffData = [
  { label: 'Document Title', docA: 'SmartMeter_X9_Spec_v3', docB: 'SmartMeter_X9_Spec_v4', status: 'changed' as const },
  { label: 'Battery Life (years)', docA: '10', docB: '12', status: 'changed' as const },
  { label: 'Radio Protocols', docA: 'NB-IoT', docB: 'NB-IoT, LoRaWAN', status: 'added' as const },
  { label: 'Ingress Rating', docA: 'IP67', docB: 'IP68', status: 'changed' as const },
  { label: 'Sampling Interval', docA: 'Fixed 15 min', docB: 'Adaptive 5–60 min', status: 'changed' as const },
  { label: 'Operating Temp', docA: '-10°C to 60°C', docB: '-10°C to 60°C', status: 'same' as const },
  { label: 'OTA Updates', docA: 'Not supported', docB: 'Supported (signed)', status: 'added' as const },
  { label: 'Compliance Standard', docA: 'EN 1434', docB: 'EN 1434, ISO 4064', status: 'added' as const },
  { label: 'Unit Cost (USD)', docA: '$42', docB: '—', status: 'removed' as const },
];

export function formatSize(kb: number): string {
  if (kb < 1024) return `${kb} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatRelative(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const hrs = Math.floor(diff / 3600000);

  if (hrs < 1) return 'just now';
  if (hrs < 24) return `${hrs}h ago`;

  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
