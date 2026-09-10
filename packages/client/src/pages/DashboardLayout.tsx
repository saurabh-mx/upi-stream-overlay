import { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
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
    <div className="min-h-screen bg-surface flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-surface-light border-r border-border flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-border">
          <Link to="/dashboard" className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary" />
            <span className="font-bold gradient-text">StreamOverlay</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-text-muted hover:text-text">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workspace Selector */}
        <div className="px-3 py-3 border-b border-border">
          <button
            onClick={() => setWorkspaceDropdown(!workspaceDropdown)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-surface hover:bg-surface-lighter border border-border transition-colors text-sm"
          >
            <span className="truncate font-medium">
              {currentWorkspace?.name || 'Select Workspace'}
            </span>
            <ChevronDown className={`w-4 h-4 text-text-muted transition-transform ${workspaceDropdown ? 'rotate-180' : ''}`} />
          </button>
          {workspaceDropdown && (
            <div className="mt-1 py-1 rounded-lg bg-surface border border-border shadow-lg animate-fade-in">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => {
                    setCurrentWorkspace(ws);
                    setWorkspaceDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-surface-lighter transition-colors ${
                    currentWorkspace?.id === ws.id ? 'text-primary' : 'text-text-muted'
                  }`}
                >
                  {ws.name}
                  <span className="ml-2 text-xs opacity-60">({ws.myRole})</span>
                </button>
              ))}
              <hr className="my-1 border-border" />
              <Link
                to="/dashboard/create-workspace"
                onClick={() => setWorkspaceDropdown(false)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-accent hover:bg-surface-lighter transition-colors"
              >
                <Plus className="w-4 h-4" /> New Workspace
              </Link>
            </div>
          )}
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-text-muted hover:bg-surface-lighter hover:text-text'
                }`}
              >
                <item.icon className="w-4.5 h-4.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
              {user?.displayName?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.displayName}</p>
              <p className="text-xs text-text-muted truncate">{user?.email}</p>
            </div>
            <Link to="/dashboard/profile" onClick={() => setSidebarOpen(false)} className="text-text-muted hover:text-primary transition-colors" title="Profile">
              <UserIcon className="w-4 h-4" />
            </Link>
            <button onClick={handleLogout} className="text-text-muted hover:text-danger transition-colors" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar (mobile) */}
        <header className="lg:hidden h-14 px-4 flex items-center border-b border-border bg-surface-light">
          <button onClick={() => setSidebarOpen(true)} className="text-text-muted hover:text-text">
            <Menu className="w-5 h-5" />
          </button>
          <span className="ml-3 font-medium text-sm truncate">{currentWorkspace?.name || 'Dashboard'}</span>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
