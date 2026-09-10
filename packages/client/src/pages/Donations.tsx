import { useState, useEffect } from 'react';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import api from '@/api/client';
import { Plus, Search, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Donation, Goal, Marathon } from '@upi-stream/shared';

export default function DonationsPage() {
  const { currentWorkspace } = useWorkspaceStore();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [marathons, setMarathons] = useState<Marathon[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    donorName: '',
    amount: '',
    message: '',
    goalId: '',
    marathonId: ''
  });

  const canManage = ['owner', 'moderator'].includes((currentWorkspace as any)?.myRole); // In a real app, check specific permissions

  useEffect(() => {
    if (currentWorkspace) {
      loadData();
    }
  }, [currentWorkspace]);

  async function loadData() {
    if (!currentWorkspace) return;
    setLoading(true);
    try {
      const [dRes, gRes, mRes] = await Promise.all([
        api.get(`/workspaces/${currentWorkspace.id}/donations`),
        api.get(`/workspaces/${currentWorkspace.id}/goals`),
        api.get(`/workspaces/${currentWorkspace.id}/marathons`),
      ]);
      setDonations(dRes.data.donations || []);
      setGoals(gRes.data.goals || []);
      setMarathons(mRes.data.marathons || []);
    } catch {
      toast.error('Failed to load donations data');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateDonation(e: React.FormEvent) {
    e.preventDefault();
    if (!currentWorkspace) return;
    
    const amountNum = parseFloat(formData.amount) * 100; // convert to smallest unit
    if (isNaN(amountNum) || amountNum <= 0) return toast.error('Invalid amount');

    try {
      const { data } = await api.post(`/workspaces/${currentWorkspace.id}/donations`, {
        donorName: formData.donorName,
        amount: amountNum,
        currency: 'INR',
        message: formData.message || undefined,
        goalId: formData.goalId || undefined,
        marathonId: formData.marathonId || undefined,
      });
      
      setDonations([data.donation, ...donations]);
      setShowCreate(false);
      setFormData({ donorName: '', amount: '', message: '', goalId: '', marathonId: '' });
      toast.success('Donation added');
    } catch {
      toast.error('Failed to add donation');
    }
  }

  if (!currentWorkspace) return null;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Donations</h1>
          <p className="text-text-muted text-sm mt-1">Manage and manually log incoming donations</p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Log Donation
          </button>
        )}
      </div>

      <div className="bg-surface-light border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface/50 text-text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Donor</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Message</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-text-muted">Loading...</td></tr>
              ) : donations.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-text-muted">No donations recorded yet.</td></tr>
              ) : (
                donations.map((d) => (
                  <tr key={d.id} className="hover:bg-surface-lighter/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-text">{d.donorName}</td>
                    <td className="px-4 py-3 font-mono text-primary">₹{(d.amount / 100).toLocaleString()}</td>
                    <td className="px-4 py-3 text-text-muted max-w-xs truncate" title={d.message || ''}>
                      {d.message || '-'}
                    </td>
                    <td className="px-4 py-3 text-text-muted flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      {new Date(d.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-surface-light border border-border rounded-xl p-6 w-full max-w-md shadow-2xl animate-slide-in">
            <h2 className="text-xl font-bold mb-4">Log Manual Donation</h2>
            <form onSubmit={handleCreateDonation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Donor Name</label>
                <input
                  type="text"
                  required
                  value={formData.donorName}
                  onChange={(e) => setFormData({ ...formData, donorName: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-surface border border-border focus:border-primary outline-none text-text"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-surface border border-border focus:border-primary outline-none text-text font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Message (Optional)</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-surface border border-border focus:border-primary outline-none text-text min-h-[80px]"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Link to Goal</label>
                  <select
                    value={formData.goalId}
                    onChange={(e) => setFormData({ ...formData, goalId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-surface border border-border focus:border-primary outline-none text-text text-sm"
                  >
                    <option value="">None</option>
                    {goals.filter(g => g.isActive).map(g => (
                      <option key={g.id} value={g.id}>{g.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Link to Marathon</label>
                  <select
                    value={formData.marathonId}
                    onChange={(e) => setFormData({ ...formData, marathonId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-surface border border-border focus:border-primary outline-none text-text text-sm"
                  >
                    <option value="">None</option>
                    {marathons.filter(m => m.status === 'running').map(m => (
                      <option key={m.id} value={m.id}>{m.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 px-4 py-2 bg-surface hover:bg-surface-lighter rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark rounded-lg text-sm font-medium transition-colors"
                >
                  Log Donation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
