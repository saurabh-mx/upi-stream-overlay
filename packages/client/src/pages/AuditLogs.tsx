import { useState, useEffect } from 'react';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import api from '@/api/client';
import { Clock, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

interface AuditLog {
  id: string;
  action: string;
  targetId: string | null;
  details: any;
  createdAt: string;
  user: {
    id: string;
    displayName: string;
    email: string;
  };
}

export default function AuditLogsPage() {
  const { currentWorkspace } = useWorkspaceStore();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentWorkspace) {
      loadLogs();
    }
  }, [currentWorkspace]);

  async function loadLogs() {
    try {
      setLoading(true);
      const { data } = await api.get(`/workspaces/${currentWorkspace!.id}/audit-logs`);
      setLogs(data.logs);
    } catch {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }

  function formatAction(action: string) {
    return action.replace(/_/g, ' ');
  }

  if (!currentWorkspace) return null;

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-text-muted text-sm mt-1">Immutable chronological feed of moderator actions</p>
      </div>

      <div className="bg-surface-light border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-text-muted animate-pulse">Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-text-muted">No actions recorded yet.</div>
        ) : (
          <div className="divide-y divide-border">
            {logs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-surface-lighter/50 transition-colors flex gap-4">
                <div className="mt-1">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                    <Activity className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4 mb-1">
                    <p className="text-sm font-medium text-text">
                      <span className="font-bold text-primary">{log.user.displayName}</span>
                      <span className="opacity-60 font-mono ml-2 text-xs">({log.user.email})</span>
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-text-muted whitespace-nowrap">
                      <Clock className="w-3 h-3" />
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <p className="text-sm font-semibold mb-1 uppercase tracking-wide opacity-90 text-accent">
                    {formatAction(log.action)}
                  </p>
                  {log.targetId && (
                    <p className="text-xs text-text-muted mb-1 font-mono">
                      Target: {log.targetId}
                    </p>
                  )}
                  {log.details && (
                    <pre className="mt-2 text-xs bg-black/40 p-3 rounded-lg overflow-x-auto text-text-muted border border-border">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
