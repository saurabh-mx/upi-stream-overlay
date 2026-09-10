import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import api from '@/api/client';
import toast from 'react-hot-toast';

export default function CreateWorkspace() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { workspaces, setWorkspaces, setCurrentWorkspace } = useWorkspaceStore();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/workspaces', { name });
      const newWs = { ...data.workspace, myRole: 'owner' };
      setWorkspaces([...workspaces, newWs]);
      setCurrentWorkspace(newWs);
      toast.success('Workspace created!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create workspace');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">New Workspace</h1>
        <p className="text-text-muted mt-1">Create a new workspace for your stream.</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-surface-light border border-border">
        <div className="mb-6">
          <label className="block text-sm font-medium text-text-muted mb-1.5">
            Workspace Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            maxLength={100}
            className="w-full px-4 py-2.5 rounded-lg bg-surface border border-border focus:border-primary outline-none text-text transition-colors"
            placeholder="e.g. My Awesome Stream"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !name}
          className="w-full py-2.5 bg-primary hover:bg-primary-dark disabled:opacity-50 rounded-lg font-medium transition-colors"
        >
          {loading ? 'Creating...' : 'Create Workspace'}
        </button>
      </form>
    </div>
  );
}
