import { useEffect, useState } from 'react';
import { Target, Timer, Trophy, TrendingUp, Plus, Link as LinkIcon, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import api from '@/api/client';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface DashboardStats {
  activeGoals: number;
  marathonStatus: string;
  totalDonations: number;
  topDonor: string;
}

export default function DashboardOverview() {
  const { currentWorkspace, workspaces, setCurrentWorkspace, setWorkspaces } = useWorkspaceStore();
  const [stats, setStats] = useState<DashboardStats>({
    activeGoals: 0,
    marathonStatus: 'No marathon',
    totalDonations: 0,
    topDonor: '-',
  });
  const navigate = useNavigate();

  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!currentWorkspace) return;
    loadStats();
  }, [currentWorkspace?.id]);

  async function loadStats() {
    if (!currentWorkspace) return;
    try {
      const [goalsRes, marathonsRes, leaderboardRes] = await Promise.all([
        api.get(`/workspaces/${currentWorkspace.id}/goals`),
        api.get(`/workspaces/${currentWorkspace.id}/marathons`),
        api.get(`/workspaces/${currentWorkspace.id}/donations/leaderboard?limit=1`),
      ]);

      const activeGoals = goalsRes.data.goals?.filter((g: any) => g.isActive).length || 0;
      const latestMarathon = marathonsRes.data.marathons?.[0];
      const topEntry = leaderboardRes.data.entries?.[0];

      setStats({
        activeGoals,
        marathonStatus: latestMarathon?.status || 'No marathon',
        totalDonations: topEntry ? leaderboardRes.data.entries.reduce((sum: number, e: any) => sum + e.totalAmount, 0) : 0,
        topDonor: topEntry?.donorName || '-',
      });
    } catch {
      // Stats are best-effort
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setJoining(true);
    try {
      const { data } = await api.post('/workspaces/join', { inviteCode: inviteCode.trim() });
      const newWorkspaces = [...workspaces, { ...data.workspace, myRole: data.member?.role || 'moderator' }];
      setWorkspaces(newWorkspaces);
      setCurrentWorkspace(newWorkspaces[newWorkspaces.length - 1]);
      toast.success('Successfully joined workspace!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to join workspace');
    } finally {
      setJoining(false);
      setInviteCode('');
    }
  }

  if (!currentWorkspace) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center max-w-4xl mx-auto px-4 animate-fade-in">
        <div className="w-20 h-20 bg-surface-light rounded-full flex items-center justify-center mb-6 border border-border">
          <Target className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-3xl font-bold mb-3">Welcome to StreamOverlay</h2>
        <p className="text-text-muted mb-8 text-lg max-w-xl">
          Get started by selecting an existing workspace, creating a new one, or joining one with an invite code.
        </p>

        {workspaces.length > 0 && (
          <div className="w-full mb-8">
            <h3 className="text-lg font-semibold mb-4 text-left border-b border-border pb-2">Your Workspaces</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {workspaces.map(ws => (
                <button
                  key={ws.id}
                  onClick={() => setCurrentWorkspace(ws)}
                  className="flex flex-col items-start p-4 bg-surface-light border border-border rounded-xl hover:border-primary/50 hover:bg-surface transition-all text-left"
                >
                  <Building2 className="w-6 h-6 text-primary mb-2" />
                  <span className="font-semibold truncate w-full">{ws.name}</span>
                  <span className="text-xs text-text-muted uppercase mt-1">{ws.myRole}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <button 
            onClick={() => navigate('/dashboard/create-workspace')}
            className="flex flex-col items-center justify-center p-8 bg-surface-light border border-border rounded-xl hover:border-primary/50 hover:bg-surface transition-all group"
          >
            <Plus className="w-10 h-10 text-primary mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-lg">Create Workspace</h3>
            <p className="text-sm text-text-muted mt-1 text-center">Start a new stream overlay from scratch</p>
          </button>

          <form onSubmit={handleJoin} className="flex flex-col items-center justify-center p-8 bg-surface-light border border-border rounded-xl hover:border-accent/50 hover:bg-surface transition-all">
            <LinkIcon className="w-10 h-10 text-accent mb-4" />
            <h3 className="font-semibold text-lg mb-2">Join Workspace</h3>
            <div className="flex w-full gap-2 mt-auto">
              <input 
                type="text" 
                placeholder="Enter invite code..." 
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="flex-1 min-w-0 px-4 py-2 bg-surface border border-border rounded-lg outline-none focus:border-accent transition-colors text-text"
              />
              <button 
                type="submit" 
                disabled={joining || !inviteCode.trim()}
                className="px-5 py-2 bg-accent hover:bg-accent-dark text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
              >
                {joining ? 'Joining...' : 'Join'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Active Goals', value: stats.activeGoals, icon: Target, color: 'text-primary' },
    { label: 'Marathon', value: stats.marathonStatus, icon: Timer, color: 'text-accent' },
    { label: 'Total Donations', value: `₹${(stats.totalDonations / 100).toLocaleString()}`, icon: TrendingUp, color: 'text-success' },
    { label: 'Top Donor', value: stats.topDonor, icon: Trophy, color: 'text-warning' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{currentWorkspace.name}</h1>
        <p className="text-text-muted mt-1">Workspace overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={card.label} 
            className="p-6 rounded-2xl glass-card hover:-translate-y-1 hover:shadow-primary/20 transition-all cursor-default group"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-text-muted group-hover:text-text transition-colors">{card.label}</span>
              <div className={`p-2 rounded-lg bg-surface/50 border border-white/5 ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-bold truncate text-white">{card.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="p-8 rounded-2xl glass-card relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <Target className="w-32 h-32 text-primary" />
          </div>
          <h2 className="text-xl font-bold mb-3 text-white">Quick Start</h2>
          <p className="text-text-muted text-base leading-relaxed relative z-10 max-w-sm">
            Navigate to <strong className="text-white">Goals</strong> to create your first donation goal,
            or <strong className="text-white">Marathon</strong> to set up a stream timer.
            Share the <strong className="text-white">invite code</strong> from Settings to add moderators.
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="p-8 rounded-2xl glass-card"
        >
          <h2 className="text-xl font-bold mb-5 text-white">Quick Links</h2>
          <div className="flex flex-col gap-4">
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/donate/${currentWorkspace.slug}`);
                import('react-hot-toast').then(m => m.default.success('Public donate link copied!'));
              }}
              className="w-full flex items-center justify-between p-4 bg-surface/50 hover:bg-surface border border-white/5 hover:border-white/10 rounded-xl text-sm font-medium transition-all group"
            >
              <span className="text-white">Public Donate Page</span>
              <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">Copy Link</span>
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/embed/alert/${currentWorkspace.id}`);
                import('react-hot-toast').then(m => m.default.success('Alert widget link copied!'));
              }}
              className="w-full flex items-center justify-between p-4 bg-surface/50 hover:bg-surface border border-white/5 hover:border-white/10 rounded-xl text-sm font-medium transition-all group"
            >
              <span className="text-white">Alert Widget (OBS)</span>
              <span className="text-xs px-3 py-1 rounded-full bg-accent/10 text-accent group-hover:bg-accent group-hover:text-white transition-colors">Copy Link</span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
