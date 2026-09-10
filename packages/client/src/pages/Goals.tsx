import { useEffect, useState } from 'react';
import { Plus, Target, Trash2, Link as LinkIcon, Copy } from 'lucide-react';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import api from '@/api/client';
import toast from 'react-hot-toast';
import type { Goal } from '@upi-stream/shared';

export default function GoalsPage() {
  const { currentWorkspace } = useWorkspaceStore();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', targetAmount: '', displayType: 'bar' as const });
  const [loading, setLoading] = useState(false);
  const isOwner = (currentWorkspace as any)?.myRole === 'owner';

  useEffect(() => {
    if (currentWorkspace) loadGoals();
  }, [currentWorkspace?.id]);

  async function loadGoals() {
    try {
      const { data } = await api.get(`/workspaces/${currentWorkspace!.id}/goals`);
      setGoals(data.goals);
    } catch {
      toast.error('Failed to load goals');
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/workspaces/${currentWorkspace!.id}/goals`, {
        title: form.title,
        targetAmount: Math.round(parseFloat(form.targetAmount) * 100),
        displayType: form.displayType,
      });
      toast.success('Goal created!');
      setShowCreate(false);
      setForm({ title: '', targetAmount: '', displayType: 'bar' });
      loadGoals();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create goal');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(goalId: string) {
    if (!confirm('Delete this goal?')) return;
    try {
      await api.delete(`/workspaces/${currentWorkspace!.id}/goals/${goalId}`);
      toast.success('Goal deleted');
      loadGoals();
    } catch {
      toast.error('Failed to delete goal');
    }
  }

  function copyEmbedLink(goalId: string) {
    const url = `${window.location.origin}/embed/goal/${goalId}`;
    navigator.clipboard.writeText(url);
    toast.success('Embed link copied!');
  }

  if (!currentWorkspace) return null;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Goals</h1>
          <p className="text-text-muted text-sm mt-1">Donation goals with embeddable progress widgets</p>
        </div>
        {isOwner && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> New Goal
          </button>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-md p-6 rounded-2xl bg-surface-light border border-border animate-fade-in space-y-4"
          >
            <h2 className="text-lg font-bold">Create Goal</h2>
            <div>
              <label className="block text-sm text-text-muted mb-1">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                className="w-full px-4 py-2 rounded-lg bg-surface border border-border focus:border-primary outline-none text-text"
                placeholder="New Webcam Fund"
              />
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-1">Target Amount (₹)</label>
              <input
                type="number"
                value={form.targetAmount}
                onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
                required
                min="1"
                step="0.01"
                className="w-full px-4 py-2 rounded-lg bg-surface border border-border focus:border-primary outline-none text-text"
                placeholder="15000"
              />
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-1">Display Type</label>
              <select
                value={form.displayType}
                onChange={(e) => setForm({ ...form, displayType: e.target.value as any })}
                className="w-full px-4 py-2 rounded-lg bg-surface border border-border focus:border-primary outline-none text-text"
              >
                <option value="bar">Progress Bar</option>
                <option value="circle">Circle Gauge</option>
                <option value="animated">Animated</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="flex-1 py-2 border border-border rounded-lg text-text-muted hover:text-text transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 bg-primary hover:bg-primary-dark rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Target className="w-12 h-12 text-text-muted mb-3" />
          <p className="text-text-muted">No goals yet. Create your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => {
            const pct = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
            return (
              <div
                key={goal.id}
                className="p-5 rounded-xl bg-surface-light border border-border hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold truncate">{goal.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${goal.isActive ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                    {goal.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {goal.description && (
                  <p className="text-sm text-text-muted mb-3 line-clamp-2">{goal.description}</p>
                )}

                {/* Progress Bar */}
                <div className="mb-2">
                  <div className="h-3 rounded-full bg-surface overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-text-muted mt-1">
                    <span>₹{(goal.currentAmount / 100).toLocaleString()}</span>
                    <span>{pct.toFixed(1)}%</span>
                    <span>₹{(goal.targetAmount / 100).toLocaleString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
                  <button
                    onClick={() => copyEmbedLink(goal.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-surface hover:bg-surface-lighter border border-border transition-colors"
                    title="Copy embed link"
                  >
                    <Copy className="w-3 h-3" /> Embed
                  </button>
                  {isOwner && (
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="ml-auto p-1.5 text-text-muted hover:text-danger rounded-lg hover:bg-danger/10 transition-colors"
                      title="Delete goal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
