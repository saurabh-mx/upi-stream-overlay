import { useEffect, useState } from 'react';
import { Trophy, Medal } from 'lucide-react';
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Leaderboard</h1>
          <p className="text-text-muted text-sm mt-1">Top supporters ranked by donations</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-surface rounded-lg border border-border p-0.5">
            {(['all', 'month', 'week'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  period === p ? 'bg-primary text-white' : 'text-text-muted hover:text-text'
                }`}
              >
                {p === 'all' ? 'All Time' : p === 'month' ? 'Month' : 'Week'}
              </button>
            ))}
          </div>
          <button
            onClick={copyEmbedLink}
            className="px-4 py-1.5 bg-surface hover:bg-surface-lighter border border-border rounded-lg text-sm font-medium transition-colors h-full"
          >
            Copy Embed Link
          </button>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Trophy className="w-12 h-12 text-text-muted mb-3" />
          <p className="text-text-muted">No donations yet for this period.</p>
        </div>
      ) : (
        <div className="rounded-xl bg-surface-light border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs text-text-muted font-medium px-5 py-3 w-16">Rank</th>
                <th className="text-left text-xs text-text-muted font-medium px-5 py-3">Supporter</th>
                <th className="text-right text-xs text-text-muted font-medium px-5 py-3">Total</th>
                <th className="text-right text-xs text-text-muted font-medium px-5 py-3 hidden sm:table-cell">Donations</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => (
                <tr key={entry.donorName} className="border-b border-border/50 hover:bg-surface-lighter/50 transition-colors">
                  <td className="px-5 py-3.5">
                    {i < 3 ? (
                      <Medal className={`w-5 h-5 ${rankColors[i]}`} />
                    ) : (
                      <span className="text-sm text-text-muted font-mono">{i + 1}</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-medium">{entry.donorName}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="font-semibold text-primary">
                      ₹{(entry.totalAmount / 100).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right hidden sm:table-cell">
                    <span className="text-sm text-text-muted">{entry.donationCount}x</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
