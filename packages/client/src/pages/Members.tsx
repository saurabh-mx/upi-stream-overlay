import { useEffect, useState } from 'react';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import api from '@/api/client';
import toast from 'react-hot-toast';
import { Copy, UserMinus, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import type { WorkspaceMember } from '@upi-stream/shared';

export default function MembersPage() {
  const { currentWorkspace } = useWorkspaceStore();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const isOwner = (currentWorkspace as any)?.myRole === 'owner';

  useEffect(() => {
    if (currentWorkspace) loadMembers();
  }, [currentWorkspace?.id]);

  async function loadMembers() {
    try {
      const { data } = await api.get(`/workspaces/${currentWorkspace!.id}/members`);
      setMembers(data.members);
    } catch {
      toast.error('Failed to load members');
    }
  }

  function copyInvite() {
    if (!(currentWorkspace as any)?.inviteCode) return;
    const url = `${window.location.origin}/register?invite=${(currentWorkspace as any).inviteCode}`;
    navigator.clipboard.writeText(url);
    toast.success('Invite link copied!');
  }

  async function removeMember(userId: string) {
    if (!confirm('Remove this moderator?')) return;
    try {
      await api.delete(`/workspaces/${currentWorkspace!.id}/members/${userId}`);
      toast.success('Member removed');
      loadMembers();
    } catch {
      toast.error('Failed to remove member');
    }
  }

  async function togglePermission(userId: string, currentPerms: any, field: keyof typeof currentPerms) {
    const newPerms = { ...currentPerms, [field]: !currentPerms[field] };
    try {
      await api.patch(`/workspaces/${currentWorkspace!.id}/members/${userId}/permissions`, {
        permissions: newPerms
      });
      loadMembers();
      toast.success('Permissions updated');
    } catch {
      toast.error('Failed to update permissions');
    }
  }

  if (!currentWorkspace) return null;

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Members & Roles</h1>
        <p className="text-text-muted mt-1">Manage moderators and their permissions for this workspace.</p>
      </div>

      {isOwner && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-gradient-to-r from-primary/20 to-transparent border border-primary/30 mb-8 flex items-center justify-between"
        >
          <div>
            <h3 className="font-bold text-primary text-lg">Invite Moderators</h3>
            <p className="text-sm text-white/70 mt-1">Share this link to let others join as moderators.</p>
          </div>
          <button
            onClick={copyInvite}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-all hover:shadow-lg hover:shadow-primary/25 active:scale-95"
          >
            <Copy className="w-4 h-4" /> Copy Invite Link
          </button>
        </motion.div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl glass-card overflow-hidden"
      >
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/5 bg-surface/50 backdrop-blur-sm">
              <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">User</th>
              <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Role</th>
              {isOwner && <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Permissions</th>}
              {isOwner && <th className="px-6 py-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {members.map((m: any) => (
              <tr key={m.userId} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                <td className="px-6 py-5">
                  <div className="font-bold text-white">{m.user.displayName}</div>
                  <div className="text-sm text-text-muted">{m.user.email}</div>
                </td>
                <td className="px-6 py-5">
                  <span className={`inline-flex px-3 py-1 text-xs rounded-lg font-bold tracking-wide ${
                    m.role === 'owner' ? 'bg-accent/10 text-accent' : 'bg-surface border border-border text-text-muted'
                  }`}>
                    {m.role.toUpperCase()}
                  </span>
                </td>
                {isOwner && (
                  <td className="px-5 py-4">
                    {m.role === 'moderator' ? (
                      <div className="flex gap-2">
                        {(['canManageGoals', 'canManageTimer', 'canAddDonations'] as const).map(p => (
                          <button
                            key={p}
                            onClick={() => togglePermission(m.userId, m.permissions, p)}
                            className={`px-2 py-1 text-xs rounded border transition-colors ${
                              m.permissions?.[p] 
                                ? 'bg-success/10 border-success/30 text-success' 
                                : 'bg-surface border-border text-text-muted'
                            }`}
                            title={`Toggle ${p}`}
                          >
                            {p.replace('can', '').replace('Manage', '')}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-text-muted flex items-center gap-1">
                        <ShieldAlert className="w-4 h-4 text-accent" /> <span className="text-white/80 font-medium">Full Access</span>
                      </span>
                    )}
                  </td>
                )}
                {isOwner && (
                  <td className="px-6 py-5 text-right">
                    {m.role === 'moderator' && (
                      <button
                        onClick={() => removeMember(m.userId)}
                        className="text-text-muted hover:text-white p-2 rounded-xl hover:bg-danger/20 hover:text-danger transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Remove member"
                      >
                        <UserMinus className="w-5 h-5" />
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
