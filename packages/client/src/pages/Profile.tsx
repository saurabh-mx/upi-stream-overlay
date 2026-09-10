import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/api/client';
import { Shield, ShieldAlert, KeyRound, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [totpEnabled, setTotpEnabled] = useState(user?.totpEnabled || false);
  const [setupData, setSetupData] = useState<{ secret: string; qrCodeUrl: string } | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If the store is outdated, fetch fresh user data
    api.get('/auth/me').then(({ data }) => {
      setTotpEnabled(data.user.totpEnabled);
    });
  }, []);

  async function start2FASetup() {
    try {
      setLoading(true);
      const { data } = await api.post('/auth/2fa/generate');
      setSetupData(data);
    } catch {
      toast.error('Failed to generate 2FA secret');
    } finally {
      setLoading(false);
    }
  }

  async function verifyAndEnable2FA(e: React.FormEvent) {
    e.preventDefault();
    if (verifyCode.length !== 6) return toast.error('Code must be 6 digits');

    try {
      setLoading(true);
      await api.post('/auth/2fa/verify', { token: verifyCode });
      setTotpEnabled(true);
      setSetupData(null);
      setVerifyCode('');
      // Update local store user
      useAuthStore.setState({ user: { ...user!, totpEnabled: true } });
      toast.success('2FA successfully enabled!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Invalid 2FA code');
    } finally {
      setLoading(false);
    }
  }

  async function disable2FA() {
    if (!confirm('Are you sure you want to disable 2FA? This will make your account less secure.')) return;
    try {
      setLoading(true);
      await api.post('/auth/2fa/disable');
      setTotpEnabled(false);
      useAuthStore.setState({ user: { ...user!, totpEnabled: false } });
      toast.success('2FA disabled');
    } catch {
      toast.error('Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  return (
    <div className="animate-fade-in max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Account Profile</h1>
        <p className="text-text-muted text-sm mt-1">Manage your personal settings and security</p>
      </div>

      <div className="bg-surface-light border border-border rounded-xl p-6 flex items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-3xl">
          {user.displayName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-xl font-bold">{user.displayName}</h2>
          <p className="text-text-muted">{user.email}</p>
          <span className="inline-block mt-2 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-surface border border-border text-text-muted">
            Global Role: {user.role}
          </span>
        </div>
      </div>

      <div className="bg-surface-light border border-border rounded-xl overflow-hidden">
        <div className="p-6 border-b border-border flex items-center gap-3">
          <Shield className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-bold">Two-Factor Authentication (2FA)</h2>
        </div>

        <div className="p-6">
          {totpEnabled ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-6 h-6 text-success shrink-0" />
                <div>
                  <h3 className="font-bold text-success mb-1">2FA is Enabled</h3>
                  <p className="text-sm text-text-muted">
                    Your account is protected by an authenticator app. You will need to enter a 6-digit code whenever you log in.
                  </p>
                </div>
              </div>
              <button
                onClick={disable2FA}
                disabled={loading}
                className="px-4 py-2 bg-danger/20 text-danger hover:bg-danger/30 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
              >
                Disable 2FA
              </button>
            </div>
          ) : setupData ? (
            <div className="space-y-6 animate-slide-in">
              <div className="flex items-start gap-3">
                <Smartphone className="w-6 h-6 text-primary shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold mb-1">Step 1: Scan QR Code</h3>
                  <p className="text-sm text-text-muted mb-4">
                    Open your authenticator app (like Google Authenticator or Authy) and scan the QR code below.
                  </p>
                  <div className="bg-white p-4 inline-block rounded-xl shadow-lg">
                    <img src={setupData.qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
                  </div>
                  <p className="text-xs text-text-muted mt-3">
                    Manual entry code: <code className="bg-surface px-1.5 py-0.5 rounded text-text font-mono">{setupData.secret}</code>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 border-t border-border pt-6">
                <KeyRound className="w-6 h-6 text-primary shrink-0 mt-1" />
                <div className="w-full max-w-sm">
                  <h3 className="font-bold mb-1">Step 2: Verify Code</h3>
                  <p className="text-sm text-text-muted mb-4">
                    Enter the 6-digit code generated by your app to enable 2FA.
                  </p>
                  <form onSubmit={verifyAndEnable2FA} className="flex gap-3">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="000000"
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                      className="flex-1 px-4 py-2 rounded-lg bg-surface border border-border focus:border-primary outline-none text-text font-mono tracking-[0.5em] text-center"
                    />
                    <button
                      type="submit"
                      disabled={loading || verifyCode.length !== 6}
                      className="px-6 py-2 bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
                    >
                      Verify
                    </button>
                  </form>
                  <button
                    type="button"
                    onClick={() => setSetupData(null)}
                    className="mt-4 text-sm text-text-muted hover:text-text transition-colors"
                  >
                    Cancel Setup
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-bold mb-1">Protect your account</h3>
                <p className="text-sm text-text-muted">
                  Add an extra layer of security to your account. When enabled, you'll need to enter a 6-digit code from your authenticator app to log in.
                </p>
              </div>
              <button
                onClick={start2FASetup}
                disabled={loading}
                className="px-4 py-2 bg-primary hover:bg-primary-dark rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
              >
                Enable 2FA
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
