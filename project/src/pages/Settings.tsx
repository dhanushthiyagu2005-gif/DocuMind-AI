
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Bell,
  Database,
  Cpu,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const sections = [
  { key: 'profile', label: 'Profile', icon: User, desc: 'Your account details and preferences' },
  { key: 'security', label: 'Security', icon: Shield, desc: 'Password, two-factor, sessions' },
  { key: 'notifications', label: 'Notifications', icon: Bell, desc: 'Email and in-app alerts' },
  { key: 'storage', label: 'Storage', icon: Database, desc: 'Connected cloud storage backends' },
  { key: 'ai', label: 'AI Engine', icon: Cpu, desc: 'Model and API configuration' },
] as const;

interface SettingsProps {
  onLogout: () => void;
}

export function Settings({ onLogout }: SettingsProps) {
  const [active, setActive] = useState<typeof sections[number]['key']>('profile');

  function handleLogout() {
    const confirmed = window.confirm('Are you sure you want to sign out?');

    if (confirmed) {
      onLogout();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow">
          <SettingsIcon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Settings</h1>
          <p className="text-sm text-slate-500">Manage your workspace configuration</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[260px_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-card">
          {sections.map((s) => {
            const Icon = s.icon;
            const isActive = active === s.key;

            return (
              <button
                key={s.key}
                onClick={() => setActive(s.key)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50',
                )}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
                <span className="flex-1 text-sm font-medium">{s.label}</span>
                <ChevronRight className={cn('h-4 w-4', isActive ? 'text-brand-500' : 'text-slate-300')} />
              </button>
            );
          })}
        </div>

        <div className="space-y-5">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card"
          >
            {active === 'profile' && <ProfileSection />}
            {active === 'security' && <SecuritySection />}
            {active === 'notifications' && <NotificationsSection />}
            {active === 'storage' && <StorageSection />}
            {active === 'ai' && <AISection />}
          </motion.div>

          {/* Logout section */}
          <div className="flex items-center justify-between rounded-2xl border border-red-100 bg-white p-5 shadow-card">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Sign out</h3>
              <p className="mt-1 text-xs text-slate-500">
                Sign out of your DocuMind AI account.
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="text-sm text-slate-500">{desc}</p>
    </div>
  );
}

function Field({ label, value, type = 'text' }: { label: string; value: string; type?: string }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</label>
      <input
        type={type}
        defaultValue={value}
        className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-brand-300 focus:outline-none focus:ring-4 focus:ring-brand-100"
      />
    </div>
  );
}

function ProfileSection() {
  return (
    <div>
      <SectionHeader title="Profile" desc="Update your personal information." />
      <div className="flex items-center gap-4">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-navy-900 text-white">
          <User className="h-7 w-7" />
        </div>
        <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
          Change avatar
        </button>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full name" value="Alex Rivera" />
        <Field label="Role" value="Workspace Admin" />
        <Field label="Email" value="alex.rivera@documind.ai" type="email" />
        <Field label="Department" value="Engineering Operations" />
      </div>
      <div className="mt-5 flex justify-end">
        <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
          Save changes
        </button>
      </div>
    </div>
  );
}

function SecuritySection() {
  return (
    <div>
      <SectionHeader title="Security" desc="Keep your workspace safe." />
      <div className="space-y-4">
        <ToggleRow title="Two-factor authentication" desc="Require a verification code at sign-in." defaultOn />
        <ToggleRow title="Session timeout" desc="Automatically sign out after 30 minutes of inactivity." defaultOn />
        <ToggleRow title="IP allowlist" desc="Restrict access to known office networks." defaultOn={false} />
      </div>
    </div>
  );
}

function NotificationsSection() {
  return (
    <div>
      <SectionHeader title="Notifications" desc="Choose what you want to be alerted about." />
      <div className="space-y-4">
        <ToggleRow title="Document processing complete" desc="Email me when an uploaded file is AI-ready." defaultOn />
        <ToggleRow title="Automation run summary" desc="Daily digest of automation activity." defaultOn />
        <ToggleRow title="Document change alerts" desc="When a watched document is modified." defaultOn={false} />
        <ToggleRow title="Weekly workspace report" desc="Monday morning summary across projects." defaultOn />
      </div>
    </div>
  );
}

function StorageSection() {
  return (
    <div>
      <SectionHeader title="Storage" desc="Connected document storage backends." />
      <div className="space-y-3">
        <BackendRow name="Private Cloud (S3-compatible)" status="Connected" detail="us-east-1 · 1.2 TB used" connected />
        <BackendRow name="Supabase Storage" status="Connected" detail="Project documents bucket" connected />
        <BackendRow name="SharePoint" status="Not connected" detail="Connect to import existing files" connected={false} />
      </div>
      <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
        Storage backends are configured at the infrastructure layer — this demo shows the management UI only.
      </p>
    </div>
  );
}

function AISection() {
  return (
    <div>
      <SectionHeader title="AI Engine" desc="Model and API configuration for document intelligence." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Model provider" value="OpenAI" />
        <Field label="Model" value="gpt-4o" />
        <Field label="Embedding model" value="text-embedding-3-large" />
        <Field label="Temperature" value="0.2" />
      </div>
      <div className="mt-4">
        <Field label="API key" value="sk-••••••••••••••••••••••" type="password" />
      </div>
      <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
        API keys are stored as server-side secrets and never exposed to the browser. This form is illustrative.
      </p>
    </div>
  );
}

function ToggleRow({ title, desc, defaultOn }: { title: string; desc: string; defaultOn: boolean }) {
  const [on, setOn] = useState(defaultOn);

  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
      <div>
        <div className="text-sm font-medium text-slate-700">{title}</div>
        <div className="text-xs text-slate-500">{desc}</div>
      </div>
      <button
        onClick={() => setOn((v) => !v)}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
          on ? 'bg-brand-600' : 'bg-slate-200',
        )}
      >
        <span className={cn('inline-block h-5 w-5 rounded-full bg-white shadow transition-transform', on ? 'translate-x-5' : 'translate-x-0.5')} />
      </button>
    </div>
  );
}

function BackendRow({ name, status, detail, connected }: { name: string; status: string; detail: string; connected: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-3">
        <div className={cn('grid h-10 w-10 place-items-center rounded-lg', connected ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400')}>
          <Database className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-medium text-slate-700">{name}</div>
          <div className="text-xs text-slate-500">{detail}</div>
        </div>
      </div>
      <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', connected ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
        {status}
      </span>
    </div>
  );
}
