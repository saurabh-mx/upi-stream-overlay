import { useEffect, useState } from 'react';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import api from '@/api/client';
import toast from 'react-hot-toast';
import { Copy, UserMinus, ShieldAlert } from 'lucide-react';
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
        <div className="p-5 rounded-xl bg-primary/10 border border-primary/20 mb-8 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-primary">Invite Moderators</h3>
            <p className="text-sm text-text-muted">Share this link to let others join as moderators.</p>
          </div>
          <button
            onClick={copyInvite}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
          >
            <Copy className="w-4 h-4" /> Copy Invite Link
          </button>
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface-light overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="px-5 py-3 text-sm font-medium text-text-muted">User</th>
              <th className="px-5 py-3 text-sm font-medium text-text-muted">Role</th>
              {isOwner && <th className="px-5 py-3 text-sm font-medium text-text-muted">Permissions</th>}
              {isOwner && <th className="px-5 py-3 text-sm font-medium text-text-muted text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {members.map((m: any) => (
              <tr key={m.userId} className="border-b border-border/50">
                <td className="px-5 py-4">
                  <div className="font-medium">{m.user.displayName}</div>
                  <div className="text-xs text-text-muted">{m.user.email}</div>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex px-2.5 py-1 text-xs rounded-full font-medium ${
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
                        <ShieldAlert className="w-3 h-3" /> Full Access
                      </span>
                    )}
                  </td>
                )}
                {isOwner && (
                  <td className="px-5 py-4 text-right">
                    {m.role === 'moderator' && (
                      <button
                        onClick={() => removeMember(m.userId)}
                        className="text-text-muted hover:text-danger p-2 rounded-lg hover:bg-danger/10 transition-colors"
                        title="Remove member"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
