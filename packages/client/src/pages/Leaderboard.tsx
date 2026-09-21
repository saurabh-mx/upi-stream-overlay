import { useEffect, useState } from 'react';
import { Trophy, Medal, Link as LinkIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import api from '@/api/client';
import toast from 'react-hot-toast';
import type { LeaderboardEntry } from '@upi-stream/shared';

export default function LeaderboardPage() {
  const { currentWorkspace } = useWorkspaceStore();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [period, setPeriod] = useState<'all' | 'month' | 'week'>('all');

  useEffect(() => {
    if (currentWorkspace) loadLeaderboard();
  }, [currentWorkspace?.id, period]);

  async function loadLeaderboard() {
    try {
      const { data } = await api.get(
        `/workspaces/${currentWorkspace!.id}/donations/leaderboard?limit=20&period=${period}`
      );
      setEntries(data.entries);
    } catch {
      toast.error('Failed to load leaderboard');
    }
  }

  function copyEmbedLink() {
    if (!currentWorkspace) return;
    const url = `${window.location.origin}/embed/leaderboard/${currentWorkspace.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Embed link copied!');
  }

  const rankColors = ['text-yellow-400', 'text-gray-300', 'text-amber-600'];

  if (!currentWorkspace) return null;

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Leaderboard</h1>
          <p className="text-text-muted mt-2">Top supporters ranked by donations</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-surface-light/50 p-1 rounded-xl border border-white/5 backdrop-blur-sm">
            {(['all', 'month', 'week'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                  period === p ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-text-muted hover:text-white hover:bg-white/5'
                }`}
              >
                {p === 'all' ? 'All Time' : p === 'month' ? 'Month' : 'Week'}
              </button>
            ))}
          </div>
          <button
            onClick={copyEmbedLink}
            className="flex items-center gap-2 px-5 py-2.5 bg-surface hover:bg-surface-light border border-white/10 hover:border-white/20 rounded-xl text-sm font-bold text-white transition-all h-full shadow-lg"
          >
            <LinkIcon className="w-4 h-4" /> Embed
          </button>
        </div>
      </div>

      {entries.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-24 text-center glass-card rounded-2xl"
        >
          <div className="w-20 h-20 bg-surface/50 rounded-full flex items-center justify-center mb-6 border border-white/5">
            <Trophy className="w-10 h-10 text-primary opacity-50" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No donations found</h3>
          <p className="text-text-muted max-w-md">There are no donations for this period yet. Share your public donate link to get started!</p>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl glass-card overflow-hidden"
        >
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 bg-surface/50 backdrop-blur-sm">
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-6 py-4 w-20">Rank</th>
                <th className="text-left text-xs font-semibold text-text-muted uppercase tracking-wider px-6 py-4">Supporter</th>
                <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider px-6 py-4">Total</th>
                <th className="text-right text-xs font-semibold text-text-muted uppercase tracking-wider px-6 py-4 hidden sm:table-cell">Donations</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => (
                <tr key={entry.donorName} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    {i < 3 ? (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-surface border border-white/5 shadow-inner ${rankColors[i]} bg-opacity-10`}>
                        <Medal className={`w-4 h-4`} />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm text-text-muted font-bold">
                        #{i + 1}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-white text-lg">{entry.donorName}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-bold text-primary text-xl">
                      ₹{(entry.totalAmount / 100).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right hidden sm:table-cell">
                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-surface text-sm font-semibold text-text-muted border border-white/5">
                      {entry.donationCount}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  );
}
