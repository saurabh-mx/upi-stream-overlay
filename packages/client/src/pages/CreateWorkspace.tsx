import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto mt-10"
    >
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-white tracking-tight">New Workspace</h1>
        <p className="text-text-muted mt-2">Create a new workspace for your stream.</p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 rounded-2xl glass-card">
        <div className="mb-8">
          <label className="block text-sm font-semibold text-white mb-2 uppercase tracking-wide">
            Workspace Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            maxLength={100}
            className="w-full px-4 py-3 rounded-xl bg-surface/50 border border-white/10 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-white transition-all placeholder:text-text-muted"
            placeholder="e.g. My Awesome Stream"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !name}
          className="w-full py-3.5 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white rounded-xl font-bold tracking-wide transition-all hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98]"
        >
          {loading ? 'Creating...' : 'Create Workspace'}
        </button>
      </form>
    </motion.div>
  );
}
