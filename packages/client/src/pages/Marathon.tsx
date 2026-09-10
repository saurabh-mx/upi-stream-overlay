import { useEffect, useState, useRef } from 'react';
import { Play, Pause, Plus, Timer } from 'lucide-react';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import api from '@/api/client';
import toast from 'react-hot-toast';
import type { Marathon } from '@upi-stream/shared';

export default function MarathonPage() {
  const { currentWorkspace } = useWorkspaceStore();
  const [marathon, setMarathon] = useState<Marathon | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [bonusInput, setBonusInput] = useState('');
  const [form, setForm] = useState({ title: '', hours: '24' });
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const isOwner = (currentWorkspace as any)?.myRole === 'owner';

  useEffect(() => {
    if (currentWorkspace) loadMarathon();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [currentWorkspace?.id]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (marathon?.status === 'running') {
      intervalRef.current = setInterval(() => {
        setRemaining(computeRemaining());
      }, 100);
    } else if (marathon) {
      setRemaining(computeRemaining());
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [marathon]);

  function computeRemaining(): number {
    if (!marathon) return 0;
    const total = marathon.durationSeconds + marathon.bonusSeconds;
    if (marathon.status === 'running' && marathon.startedAt) {
      const elapsed = (Date.now() - new Date(marathon.startedAt).getTime()) / 1000;
      return Math.max(0, total - marathon.elapsedSeconds - elapsed);
    }
    return Math.max(0, total - marathon.elapsedSeconds);
  }

  async function loadMarathon() {
    try {
      const { data } = await api.get(`/workspaces/${currentWorkspace!.id}/marathons`);
      if (data.marathons.length > 0) {
        setMarathon(data.marathons[0]);
      }
    } catch {
      toast.error('Failed to load marathon');
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post(`/workspaces/${currentWorkspace!.id}/marathons`, {
        title: form.title,
        durationSeconds: parseInt(form.hours) * 3600,
      });
      setMarathon(data.marathon);
      setShowCreate(false);
      toast.success('Marathon created!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(action: 'start' | 'pause' | 'resume') {
    try {
      const { data } = await api.post(`/workspaces/${currentWorkspace!.id}/marathons/${marathon!.id}/${action}`);
      setMarathon(data.marathon);
      toast.success(`Marathon ${action}ed`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || `Failed to ${action}`);
    }
  }

  async function handleBonus() {
    const seconds = parseInt(bonusInput) * 60;
    if (!seconds || seconds <= 0) return;
    try {
      const { data } = await api.post(`/workspaces/${currentWorkspace!.id}/marathons/${marathon!.id}/bonus`, { seconds });
      setMarathon(data.marathon);
      setBonusInput('');
      toast.success(`+${bonusInput} minutes added!`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  }

  function copyEmbedLink() {
    if (!marathon) return;
    const url = `${window.location.origin}/embed/marathon/${marathon.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Embed link copied!');
  }

  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = Math.floor(remaining % 60);

  if (!currentWorkspace) return null;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Marathon</h1>
          <p className="text-text-muted text-sm mt-1">Stream marathon timer with donation bonuses</p>
        </div>
        <div className="flex items-center gap-3">
          {marathon && (
            <button
              onClick={copyEmbedLink}
              className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-lighter border border-border rounded-lg text-sm font-medium transition-colors"
            >
              Copy Embed Link
            </button>
          )}
          {isOwner && !marathon && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" /> New Marathon
            </button>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <form onSubmit={handleCreate} className="w-full max-w-md p-6 rounded-2xl bg-surface-light border border-border animate-fade-in space-y-4">
            <h2 className="text-lg font-bold">Create Marathon</h2>
            <div>
              <label className="block text-sm text-text-muted mb-1">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                className="w-full px-4 py-2 rounded-lg bg-surface border border-border focus:border-primary outline-none text-text"
                placeholder="24 Hour Gaming Marathon"
              />
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-1">Duration (hours)</label>
              <input
                type="number"
                value={form.hours}
                onChange={(e) => setForm({ ...form, hours: e.target.value })}
                required
                min="1"
                className="w-full px-4 py-2 rounded-lg bg-surface border border-border focus:border-primary outline-none text-text"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2 border border-border rounded-lg text-text-muted hover:text-text transition-colors">Cancel</button>
              <button type="submit" disabled={loading} className="flex-1 py-2 bg-primary hover:bg-primary-dark rounded-lg font-medium transition-colors disabled:opacity-50">
                {loading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Timer Display */}
      {marathon ? (
        <div className="max-w-2xl mx-auto">
          <div className="p-8 rounded-2xl bg-surface-light border border-border text-center">
            <h2 className="text-lg font-semibold mb-6">{marathon.title}</h2>

            {/* Big Timer */}
            <div className="font-mono text-7xl md:text-8xl font-bold tracking-wider mb-2 select-none">
              <span className="text-primary">{String(hours).padStart(2, '0')}</span>
              <span className="text-text-muted animate-pulse mx-1">:</span>
              <span className="text-accent">{String(minutes).padStart(2, '0')}</span>
              <span className="text-text-muted animate-pulse mx-1">:</span>
              <span className="text-text">{String(seconds).padStart(2, '0')}</span>
            </div>

            {/* Status Badge */}
            <div className="mb-8">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-sm rounded-full ${
                marathon.status === 'running' ? 'bg-success/10 text-success' :
                marathon.status === 'paused' ? 'bg-warning/10 text-warning' :
                marathon.status === 'finished' ? 'bg-danger/10 text-danger' :
                'bg-surface text-text-muted'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  marathon.status === 'running' ? 'bg-success animate-pulse' :
                  marathon.status === 'paused' ? 'bg-warning' :
                  marathon.status === 'finished' ? 'bg-danger' : 'bg-text-muted'
                }`} />
                {marathon.status.charAt(0).toUpperCase() + marathon.status.slice(1)}
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3 mb-6">
              {marathon.status === 'idle' && (
                <button onClick={() => handleAction('start')} className="flex items-center gap-2 px-6 py-2.5 bg-success hover:bg-success/80 rounded-xl font-medium transition-colors">
                  <Play className="w-5 h-5" /> Start
                </button>
              )}
              {marathon.status === 'running' && (
                <button onClick={() => handleAction('pause')} className="flex items-center gap-2 px-6 py-2.5 bg-warning hover:bg-warning/80 rounded-xl font-medium text-black transition-colors">
                  <Pause className="w-5 h-5" /> Pause
                </button>
              )}
              {marathon.status === 'paused' && (
                <button onClick={() => handleAction('resume')} className="flex items-center gap-2 px-6 py-2.5 bg-success hover:bg-success/80 rounded-xl font-medium transition-colors">
                  <Play className="w-5 h-5" /> Resume
                </button>
              )}
            </div>

            {/* Bonus Time */}
            {marathon.status !== 'finished' && (
              <div className="flex items-center justify-center gap-2">
                <input
                  type="number"
                  value={bonusInput}
                  onChange={(e) => setBonusInput(e.target.value)}
                  placeholder="Minutes"
                  min="1"
                  className="w-28 px-3 py-2 rounded-lg bg-surface border border-border focus:border-primary outline-none text-text text-center text-sm"
                />
                <button
                  onClick={handleBonus}
                  disabled={!bonusInput}
                  className="flex items-center gap-1.5 px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" /> Add Time
                </button>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-border">
              <div>
                <p className="text-xs text-text-muted mb-1">Base Duration</p>
                <p className="font-mono font-semibold">{Math.floor(marathon.durationSeconds / 3600)}h</p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Bonus Time</p>
                <p className="font-mono font-semibold text-accent">+{Math.floor(marathon.bonusSeconds / 60)}m</p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Elapsed</p>
                <p className="font-mono font-semibold">{Math.floor(marathon.elapsedSeconds / 3600)}h {Math.floor((marathon.elapsedSeconds % 3600) / 60)}m</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Timer className="w-12 h-12 text-text-muted mb-3" />
          <p className="text-text-muted">No marathon yet. Create one to get started!</p>
        </div>
      )}
    </div>
  );
}
