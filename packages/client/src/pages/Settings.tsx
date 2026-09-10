import { useState } from 'react';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import api from '@/api/client';
import toast from 'react-hot-toast';
import { Trash2, AlertTriangle, Palette } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { WorkspaceTheme } from '@upi-stream/shared';

export default function SettingsPage() {
  const { currentWorkspace, workspaces, setWorkspaces, setCurrentWorkspace } = useWorkspaceStore();
  const [name, setName] = useState(currentWorkspace?.name || '');
  const [theme, setTheme] = useState<WorkspaceTheme>({
    primaryColor: currentWorkspace?.theme?.primaryColor || '#8b5cf6',
    secondaryColor: currentWorkspace?.theme?.secondaryColor || '#1e1b4b',
    accentColor: currentWorkspace?.theme?.accentColor || '#06b6d4',
    backgroundColor: currentWorkspace?.theme?.backgroundColor || '#0f0f23',
    textColor: currentWorkspace?.theme?.textColor || '#e2e8f0',
    fontFamily: currentWorkspace?.theme?.fontFamily || 'Inter',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const isOwner = (currentWorkspace as any)?.myRole === 'owner';

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!currentWorkspace) return;
    setLoading(true);
    try {
      const { data } = await api.patch(`/workspaces/${currentWorkspace.id}`, { name, theme });
      const updated = workspaces.map(w => w.id === currentWorkspace.id ? { ...w, name: data.workspace.name, theme: data.workspace.theme } : w);
      setWorkspaces(updated);
      setCurrentWorkspace({ ...currentWorkspace, name: data.workspace.name, theme: data.workspace.theme });
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!currentWorkspace) return;
    if (prompt(`Type '${currentWorkspace.name}' to confirm deletion. This cannot be undone.`) !== currentWorkspace.name) {
      return toast.error('Workspace name did not match.');
    }
    try {
      await api.delete(`/workspaces/${currentWorkspace.id}`);
      const updated = workspaces.filter(w => w.id !== currentWorkspace.id);
      setWorkspaces(updated);
      setCurrentWorkspace(updated[0] || null);
      toast.success('Workspace deleted');
      navigate('/dashboard');
    } catch {
      toast.error('Failed to delete workspace');
    }
  }

  if (!currentWorkspace) return null;

  return (
    <div className="max-w-2xl animate-fade-in pb-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-text-muted mt-1">Manage workspace preferences and appearance.</p>
      </div>

      <div className="space-y-6">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="p-6 rounded-xl border border-border bg-surface-light">
            <h2 className="text-lg font-semibold mb-4">General</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-muted mb-1.5">Workspace Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isOwner}
                className="w-full px-4 py-2 rounded-lg bg-surface border border-border focus:border-primary outline-none text-text disabled:opacity-50"
              />
            </div>
          </div>

          <div className="p-6 rounded-xl border border-border bg-surface-light">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" /> Theme Customization
            </h2>
            <p className="text-sm text-text-muted mb-6">
              Customize the colors and fonts used across all your embeddable widgets.
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { key: 'primaryColor', label: 'Primary Color' },
                { key: 'secondaryColor', label: 'Secondary Color' },
                { key: 'accentColor', label: 'Accent Color' },
              ].map(color => (
                <div key={color.key}>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">{color.label}</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={(theme as any)[color.key]}
                      onChange={(e) => setTheme({ ...theme, [color.key]: e.target.value })}
                      disabled={!isOwner}
                      className="w-10 h-10 rounded border border-border cursor-pointer disabled:opacity-50"
                    />
                    <input
                      type="text"
                      value={(theme as any)[color.key]}
                      onChange={(e) => setTheme({ ...theme, [color.key]: e.target.value })}
                      disabled={!isOwner}
                      className="flex-1 px-3 py-2 rounded-lg bg-surface border border-border focus:border-primary outline-none text-text text-sm font-mono uppercase disabled:opacity-50"
                    />
                  </div>
                </div>
              ))}
              
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">Font Family</label>
                <select
                  value={theme.fontFamily}
                  onChange={(e) => setTheme({ ...theme, fontFamily: e.target.value })}
                  disabled={!isOwner}
                  className="w-full px-3 py-2 rounded-lg bg-surface border border-border focus:border-primary outline-none text-text disabled:opacity-50"
                >
                  <option value="Inter">Inter (Sans)</option>
                  <option value="JetBrains Mono">JetBrains (Mono)</option>
                  <option value="system-ui">System Default</option>
                </select>
              </div>
            </div>
            
            <div className="border-t border-border pt-6 mt-6">
              <h3 className="text-md font-semibold mb-4">Public Donation Page</h3>
              <div className="grid grid-cols-1 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">UPI ID (VPA)</label>
                  <input
                    type="text"
                    placeholder="e.g. yourname@upi"
                    value={theme.upiId || ''}
                    onChange={(e) => setTheme({ ...theme, upiId: e.target.value })}
                    disabled={!isOwner}
                    className="w-full px-4 py-2 rounded-lg bg-surface border border-border focus:border-primary outline-none text-text disabled:opacity-50"
                  />
                  <p className="text-xs text-text-muted mt-1">This will be shown on your public donation page.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1.5">Thank You Message</label>
                  <textarea
                    placeholder="Thanks for supporting the stream!"
                    value={theme.donationMessage || ''}
                    onChange={(e) => setTheme({ ...theme, donationMessage: e.target.value })}
                    disabled={!isOwner}
                    className="w-full px-4 py-2 rounded-lg bg-surface border border-border focus:border-primary outline-none text-text disabled:opacity-50 min-h-[80px]"
                  />
                </div>
              </div>
            </div>

            {isOwner && (
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-primary hover:bg-primary-dark rounded-lg text-sm font-medium transition-colors w-full sm:w-auto"
              >
                {loading ? 'Saving...' : 'Save All Settings'}
              </button>
            )}
          </div>
        </form>

        {isOwner && (
          <div className="p-6 rounded-xl border border-danger/30 bg-danger/5 mt-12">
            <h2 className="text-lg font-semibold text-danger flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5" /> Danger Zone
            </h2>
            <p className="text-sm text-text-muted mb-4">
              Deleting this workspace will permanently remove all goals, marathons, and donation records associated with it.
            </p>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-danger/20 text-danger hover:bg-danger hover:text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Delete Workspace
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
