
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { AnimatePresence, motion } from 'framer-motion';

import { Sidebar, type NavKey } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';
import { UploadModal } from '@/components/UploadModal';

import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Dashboard } from '@/pages/Dashboard';
import { Projects } from '@/pages/Projects';
import { Documents } from '@/pages/Documents';
import { AIAssistant } from '@/pages/AIAssistant';
import { Automations } from '@/pages/Automations';
import { Settings } from '@/pages/Settings';
import { Auth } from '@/pages/Auth';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'user';
  status: 'pending' | 'approved' | 'rejected';
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [active, setActive] = useState<NavKey>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [openProjectId, setOpenProjectId] = useState<string | null>(null);

  // Load user profile
  async function loadUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, role, status')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Profile loading error:', error.message);
      setProfile(null);
      return;
    }

    setProfile(data as UserProfile);
  }

  // Check authentication
  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        console.error('Session error:', error.message);
        setAuthLoading(false);
        return;
      }

      const currentUser = data.session?.user ?? null;

      setUser(currentUser);

      if (currentUser) {
        await loadUserProfile(currentUser.id);
      }

      if (mounted) {
        setAuthLoading(false);
      }
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;

      setUser(currentUser);

      if (!currentUser) {
        setProfile(null);
        setAuthLoading(false);
        return;
      }

      setAuthLoading(true);

      setTimeout(async () => {
        if (!mounted) return;

        await loadUserProfile(currentUser.id);

        if (mounted) {
          setAuthLoading(false);
        }
      }, 0);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Logout
  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  // Navigation
  const navigate = (k: NavKey) => {
    setActive(k);

    if (k !== 'projects') {
      setOpenProjectId(null);
    }
  };

  const openProject = (id: string | null) => {
    setOpenProjectId(id);
    setActive('projects');
  };

  // Loading screen
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">
          Loading DocuMind AI...
        </p>
      </div>
    );
  }

  // Login and registration
  if (!user) {
    return <Auth onLogin={() => window.location.reload()} />;
  }

  // Missing profile
  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <h1 className="text-xl font-bold">
          User profile not found
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Please contact your administrator.
        </p>

        <button
          onClick={logout}
          className="mt-5 rounded-xl bg-slate-900 px-5 py-2 text-white"
        >
          Sign out
        </button>
      </div>
    );
  }

  // Pending approval
  if (profile.status === 'pending') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900">
          Waiting for Admin Approval
        </h1>

        <p className="mt-3 text-slate-500">
          Your registration was successful. An administrator must approve your account before you can access DocuMind AI.
        </p>

        <button
          onClick={logout}
          className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-white"
        >
          Sign out
        </button>
      </div>
    );
  }

  // Rejected or unapproved account
  if (profile.status !== 'approved') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900">
          Account Not Approved
        </h1>

        <p className="mt-3 text-slate-500">
          Your account has not been approved. Please contact your administrator.
        </p>

        <button
          onClick={logout}
          className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-white"
        >
          Sign out
        </button>
      </div>
    );
  }

  // Main dashboard
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Sidebar
        active={active}
        onNavigate={navigate}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
      />

      <div
        className={cn(
          'flex min-h-screen flex-col transition-[padding] duration-300',
          collapsed ? 'lg:pl-20' : 'lg:pl-64',
        )}
      >
        <Topbar
          onUploadClick={() => setUploadOpen(true)}
          onOpenMobile={() => setMobileOpen(true)}
          search={search}
          onSearch={setSearch}
        />

        
<main className="flex-1 px-4 py-6 md:px-6 lg:px-8">
  <div className="mx-auto w-full max-w-7xl">

    {/* Keep AI Assistant mounted to preserve chat history */}
    <div className={active === 'assistant' ? 'block' : 'hidden'}>
      <AIAssistant />
    </div>

    {/* Other pages */}
    <AnimatePresence mode="wait">
      {active !== 'assistant' && (
        <motion.div
          key={active + (openProjectId ?? '')}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {active === 'dashboard' && (
            <Dashboard
              search={search}
              onNavigate={navigate}
              onOpenProject={openProject}
            />
          )}

          {active === 'projects' && (
            <Projects
              search={search}
              openProjectId={openProjectId}
              onOpenProject={openProject}
              onUpload={() => setUploadOpen(true)}
            />
          )}

          {active === 'documents' && (
            <Documents
              search={search}
              onUpload={() => setUploadOpen(true)}
            />
          )}

          {active === 'automations' && <Automations />}

          {active === 'settings' && <Settings onLogout={logout} />}
        </motion.div>
      )}
    </AnimatePresence>

  </div>
</main>
      </div>

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploadComplete={() => {
          // Upload completed
        }}
      />
    </div>
  );
}
