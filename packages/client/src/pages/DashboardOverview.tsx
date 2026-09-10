import { useEffect, useState } from 'react';
import { Target, Timer, Trophy, TrendingUp } from 'lucide-react';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import api from '@/api/client';

interface DashboardStats {
  activeGoals: number;
  marathonStatus: string;
  totalDonations: number;
  topDonor: string;
}

export default function DashboardOverview() {
  const { currentWorkspace } = useWorkspaceStore();
  const [stats, setStats] = useState<DashboardStats>({
    activeGoals: 0,
    marathonStatus: 'No marathon',
    totalDonations: 0,
    topDonor: '-',
  });

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

  if (!currentWorkspace) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <Target className="w-16 h-16 text-text-muted mb-4" />
        <h2 className="text-xl font-bold mb-2">No workspace selected</h2>
        <p className="text-text-muted">Create or select a workspace from the sidebar to get started.</p>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="p-5 rounded-xl bg-surface-light border border-border hover:border-primary/30 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-text-muted">{card.label}</span>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <p className="text-xl font-bold truncate">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="p-6 rounded-xl bg-surface-light border border-border">
          <h2 className="text-lg font-semibold mb-2">Quick Start</h2>
          <p className="text-text-muted text-sm">
            Navigate to <strong>Goals</strong> to create your first donation goal,
            or <strong>Marathon</strong> to set up a stream timer.
            Share the <strong>invite code</strong> from Settings to add moderators.
          </p>
        </div>
        
        <div className="p-6 rounded-xl bg-surface-light border border-border">
          <h2 className="text-lg font-semibold mb-4">Quick Links</h2>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/donate/${currentWorkspace.slug}`);
                import('react-hot-toast').then(m => m.default.success('Public donate link copied!'));
              }}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-surface hover:bg-surface-lighter border border-border rounded-lg text-sm font-medium transition-colors group"
            >
              <span>Public Donate Page</span>
              <span className="text-xs text-text-muted group-hover:text-primary transition-colors">Copy Link</span>
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/embed/alert/${currentWorkspace.id}`);
                import('react-hot-toast').then(m => m.default.success('Alert widget link copied!'));
              }}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-surface hover:bg-surface-lighter border border-border rounded-lg text-sm font-medium transition-colors group"
            >
              <span>Alert Widget (OBS)</span>
              <span className="text-xs text-text-muted group-hover:text-primary transition-colors">Copy Link</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
