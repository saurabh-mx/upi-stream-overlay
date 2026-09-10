import { useState, useEffect, useMemo } from 'react';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import api from '@/api/client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { TrendingUp, Users } from 'lucide-react';

export default function AnalyticsPage() {
  const { currentWorkspace } = useWorkspaceStore();
  const [data, setData] = useState<{ donationsOverTime: any[]; topDonors: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentWorkspace) {
      loadData();
    }
  }, [currentWorkspace]);

  async function loadData() {
    try {
      const res = await api.get(`/workspaces/${currentWorkspace!.id}/analytics`);
      setData(res.data.analytics);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const theme = currentWorkspace?.theme;
  const primaryColor = theme?.primaryColor || '#8b5cf6';
  const secondaryColor = theme?.secondaryColor || '#06b6d4';

  const totalDonations30Days = useMemo(() => {
    if (!data) return 0;
    return data.donationsOverTime.reduce((sum, item) => sum + item.amount, 0);
  }, [data]);

  if (!currentWorkspace) return null;

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-text-muted text-sm mt-1">Donation performance over the last 30 days</p>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-text-muted animate-pulse">Loading analytics...</div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl bg-surface-light border border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-text-muted">Total (30 Days)</h3>
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <p className="text-3xl font-bold">₹{(totalDonations30Days / 100).toLocaleString()}</p>
            </div>
            <div className="p-6 rounded-xl bg-surface-light border border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-text-muted">Unique Top Donors</h3>
                <Users className="w-5 h-5 text-primary" />
              </div>
              <p className="text-3xl font-bold">{data.topDonors.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-6 rounded-xl bg-surface-light border border-border h-[400px] flex flex-col">
              <h3 className="text-lg font-bold mb-6">Donations Over Time</h3>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.donationsOverTime}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={primaryColor} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={primaryColor} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d2d5e" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#8b8baf" 
                      tick={{ fill: '#8b8baf', fontSize: 12 }} 
                      tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    />
                    <YAxis 
                      stroke="#8b8baf" 
                      tick={{ fill: '#8b8baf', fontSize: 12 }}
                      tickFormatter={(val) => `₹${val / 100}`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f0f23', border: '1px solid #2d2d5e', borderRadius: '8px' }}
                      itemStyle={{ color: '#e2e8f0' }}
                      formatter={(val: any) => [`₹${(val as number) / 100}`, 'Amount']}
                    />
                    <Area type="monotone" dataKey="amount" stroke={primaryColor} strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-surface-light border border-border h-[400px] flex flex-col">
              <h3 className="text-lg font-bold mb-6">Top Donors</h3>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.topDonors} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d2d5e" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={80} stroke="#8b8baf" tick={{ fill: '#8b8baf', fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f0f23', border: '1px solid #2d2d5e', borderRadius: '8px' }}
                      formatter={(val: any) => [`₹${(val as number) / 100}`, 'Donated']}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {data.topDonors.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? primaryColor : secondaryColor} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center text-text-muted">Failed to load analytics</div>
      )}
    </div>
  );
}
