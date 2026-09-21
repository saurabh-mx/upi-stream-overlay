import { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Target, Timer, Trophy, Settings, LogOut,
  ChevronDown, Plus, Users, LayoutDashboard, Menu, X, Banknote,
  LineChart, Activity, User as UserIcon
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import api from '@/api/client';
import toast from 'react-hot-toast';

const navItems = [
  { path: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { path: '/dashboard/analytics', label: 'Analytics', icon: LineChart },
  { path: '/dashboard/goals', label: 'Goals', icon: Target },
  { path: '/dashboard/marathon', label: 'Marathon', icon: Timer },
  { path: '/dashboard/donations', label: 'Donations', icon: Banknote },
  { path: '/dashboard/leaderboard', label: 'Leaderboard', icon: Trophy },
  { path: '/dashboard/members', label: 'Members', icon: Users },
  { path: '/dashboard/audit-logs', label: 'Audit Logs', icon: Activity },
  { path: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const { currentWorkspace, workspaces, setWorkspaces, setCurrentWorkspace } = useWorkspaceStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [workspaceDropdown, setWorkspaceDropdown] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadWorkspaces();
  }, []);

  async function loadWorkspaces() {
    try {
      const { data } = await api.get('/workspaces');
      setWorkspaces(data.workspaces);
      if (data.workspaces.length > 0 && !currentWorkspace) {
        setCurrentWorkspace(data.workspaces[0]);
      }
    } catch {
      toast.error('Failed to load workspaces');
    }
  }

  function handleLogout() {
    logout();
    navigate('/');
    toast.success('Logged out');
  }

  return (
    <div className="min-h-screen bg-surface flex selection:bg-primary/30">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-surface-light/80 backdrop-blur-2xl border-r border-white/5 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-white/5">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white group-hover:text-primary transition-colors">StreamX</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-text-muted hover:text-text bg-surface p-2 rounded-lg border border-border">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workspace Selector */}
        <div className="px-4 py-5 border-b border-white/5">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 px-2">Workspace</p>
          <button
            onClick={() => setWorkspaceDropdown(!workspaceDropdown)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-surface/50 hover:bg-surface border border-white/5 hover:border-white/10 transition-all text-sm group"
          >
            <div className="flex flex-col items-start truncate">
              <span className="font-semibold text-text group-hover:text-white transition-colors truncate">
                {currentWorkspace?.name || 'Select Workspace'}
              </span>
              {currentWorkspace && (
                <span className="text-xs text-primary font-medium mt-0.5">{currentWorkspace.myRole}</span>
              )}
            </div>
            <ChevronDown className={`w-4 h-4 text-text-muted transition-transform duration-300 ${workspaceDropdown ? 'rotate-180' : ''}`} />
          </button>
          
          <AnimatePresence>
            {workspaceDropdown && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-2 py-2 rounded-xl bg-surface border border-white/10 shadow-2xl relative z-20 overflow-hidden"
              >
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => {
                      setCurrentWorkspace(ws);
                      setWorkspaceDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-surface-lighter transition-colors flex items-center justify-between group ${
                      currentWorkspace?.id === ws.id ? 'bg-primary/10 text-primary' : 'text-text-muted hover:text-white'
                    }`}
                  >
                    <span className="truncate">{ws.name}</span>
                    {currentWorkspace?.id === ws.id && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                  </button>
                ))}
                {workspaces.length > 0 && <div className="h-px bg-white/5 my-2" />}
                <Link
                  to="/dashboard/create-workspace"
                  onClick={() => setWorkspaceDropdown(false)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-accent hover:bg-accent/10 transition-colors font-medium"
                >
                  <Plus className="w-4 h-4" /> New Workspace
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 px-2">Menu</p>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all relative group overflow-hidden ${
                  isActive
                    ? 'text-white'
                    : 'text-text-muted hover:text-white hover:bg-white/5'
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent border-l-2 border-primary z-0"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon className={`w-5 h-5 relative z-10 transition-colors ${isActive ? 'text-primary' : 'group-hover:text-primary-light'}`} />
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface/50 border border-white/5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-surface-lighter to-surface flex items-center justify-center text-white font-bold border border-white/10">
              {(user?.displayName || user?.email || '?').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-white">{user?.displayName}</p>
              <p className="text-xs text-text-muted truncate">{user?.email}</p>
            </div>
            <div className="flex flex-col gap-1">
              <Link to="/dashboard/profile" onClick={() => setSidebarOpen(false)} className="text-text-muted hover:text-primary transition-colors p-1" title="Profile">
                <UserIcon className="w-4 h-4" />
              </Link>
              <button onClick={handleLogout} className="text-text-muted hover:text-danger transition-colors p-1" title="Logout">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Top Bar (mobile) */}
        <header className="lg:hidden h-16 px-4 flex items-center justify-between border-b border-white/5 glass-panel sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="text-white hover:text-primary bg-surface p-2 rounded-lg border border-white/5">
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-bold text-lg truncate text-white">{currentWorkspace?.name || 'Dashboard'}</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
            {(user?.displayName || user?.email || '?').charAt(0).toUpperCase()}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto overflow-x-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-7xl mx-auto w-full h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Overlay for mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
