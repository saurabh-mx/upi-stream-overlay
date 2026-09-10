import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { QrCode, Copy, CheckCircle, ExternalLink } from 'lucide-react';
import type { WorkspaceTheme } from '@upi-stream/shared';

// For embed routes, we don't use the authenticated api client
const publicApi = axios.create({ baseURL: '/api' });

export default function PublicDonate() {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [workspace, setWorkspace] = useState<{ name: string; theme: WorkspaceTheme } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (slug) loadData(slug);
  }, [slug]);

  async function loadData(wsSlug: string) {
    try {
      // Need a new route in embed.routes.ts to fetch workspace by slug
      const { data } = await publicApi.get(`/embed/workspace-by-slug/${wsSlug}`);
      setWorkspace(data.workspace);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Workspace not found');
    } finally {
      setLoading(false);
    }
  }

  function handleCopyUpi() {
    if (!workspace?.theme.upiId) return;
    navigator.clipboard.writeText(workspace.theme.upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return <div className="min-h-screen bg-surface flex items-center justify-center text-text-muted animate-pulse">Loading...</div>;
  }

  if (error || !workspace) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-surface-light border border-danger/30 rounded-2xl p-8 text-center shadow-xl">
          <h2 className="text-xl font-bold text-danger mb-2">Error</h2>
          <p className="text-text-muted">{error || 'Page not found'}</p>
        </div>
      </div>
    );
  }

  const theme = workspace.theme;
  const upiId = theme.upiId;

  // Render a Google Pay intent URL (works on mobile devices with UPI apps)
  const upiUrl = upiId ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(workspace.name)}&cu=INR` : null;

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 sm:p-8"
      style={{
        backgroundColor: theme.backgroundColor || '#0f0f23',
        color: theme.textColor || '#e2e8f0',
        fontFamily: theme.fontFamily || 'Inter, sans-serif'
      }}
    >
      <div 
        className="max-w-md w-full rounded-2xl p-8 shadow-2xl relative overflow-hidden"
        style={{ backgroundColor: '#1a1a2e', border: `1px solid ${theme.primaryColor}40` }}
      >
        {/* Glow behind */}
        <div 
          className="absolute -top-32 -right-32 w-64 h-64 rounded-full blur-[100px] opacity-20 pointer-events-none"
          style={{ backgroundColor: theme.primaryColor }}
        />
        
        <div className="text-center mb-8 relative z-10">
          <h1 className="text-3xl font-black mb-2" style={{ color: theme.primaryColor }}>
            {workspace.name}
          </h1>
          <p className="text-sm opacity-80 whitespace-pre-wrap">
            {theme.donationMessage || 'Support the stream!'}
          </p>
        </div>

        {upiId ? (
          <div className="space-y-6 relative z-10">
            {/* UPI ID Display */}
            <div className="bg-black/40 rounded-xl p-4 border border-white/5">
              <label className="block text-xs font-bold uppercase tracking-wider opacity-60 mb-2">
                UPI ID (VPA)
              </label>
              <div className="flex items-center justify-between bg-black/60 rounded-lg p-3">
                <span className="font-mono text-lg font-bold">{upiId}</span>
                <button 
                  onClick={handleCopyUpi}
                  className="p-2 hover:bg-white/10 rounded-md transition-colors"
                  style={{ color: theme.accentColor || theme.primaryColor }}
                >
                  {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Pay Button (Mobile) */}
            <div className="block sm:hidden">
              <a 
                href={upiUrl!}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-white font-bold transition-transform active:scale-95 shadow-lg"
                style={{ backgroundColor: theme.primaryColor }}
              >
                <ExternalLink className="w-5 h-5" />
                Pay with UPI App
              </a>
              <p className="text-center text-xs opacity-50 mt-3">
                Opens Google Pay, PhonePe, Paytm, etc.
              </p>
            </div>

            {/* Instructions */}
            <div className="text-sm opacity-70 bg-black/20 rounded-lg p-4 border border-white/5 leading-relaxed">
              <p className="mb-2 font-bold opacity-100 flex items-center gap-2">
                <QrCode className="w-4 h-4" /> How to support:
              </p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Copy the UPI ID above.</li>
                <li>Open your preferred UPI app.</li>
                <li>Paste the ID and enter the amount.</li>
                <li>Send your payment. Include your name in the payment message so we know who you are!</li>
              </ol>
            </div>
            
            <p className="text-center text-xs opacity-40 font-medium">
              Donations will be manually verified by moderators.
            </p>
          </div>
        ) : (
          <div className="text-center py-8 opacity-60">
            <QrCode className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>This streamer has not configured their UPI details yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
