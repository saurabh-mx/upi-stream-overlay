import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuthStore } from '@/stores/authStore';
import api from '@/api/client';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleGoogleLogin = async (credentialResponse: any) => {
    if (!credentialResponse.credential) return;
    setLoading(true);
    try {
      const { data } = await api.post('/auth/google', {
        credential: credentialResponse.credential,
      });
      setAuth(data.user, data.accessToken, data.refreshToken);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: any = { email, password };
      if (requires2FA) payload.totpCode = totpCode;
      
      const { data } = await api.post('/auth/login', payload);
      setAuth(data.user, data.accessToken, data.refreshToken);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err: any) {
      if (err.response?.data?.requires2FA) {
        setRequires2FA(true);
        toast.error('2FA code required');
      } else {
        toast.error(err.response?.data?.error || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <Zap className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold gradient-text">StreamOverlay</span>
          </Link>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-text-muted mt-1">Sign in to your dashboard</p>
        </div>

        <div className="p-8 rounded-2xl bg-surface-light border border-border">
          {!requires2FA && (
            <div className="mb-6 flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={() => toast.error('Google login failed')}
                theme="filled_black"
                shape="rectangular"
                width="100%"
              />
            </div>
          )}

          {!requires2FA && (
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-surface-light text-text-muted">Or continue with</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!requires2FA ? (
              <>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-text-muted mb-1.5">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-lg bg-surface border border-border focus:border-primary outline-none text-text transition-colors"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-text-muted mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 rounded-lg bg-surface border border-border focus:border-primary outline-none text-text transition-colors pr-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="animate-slide-in space-y-4">
                <div className="flex items-center justify-center mb-4">
                  <ShieldAlert className="w-12 h-12 text-primary" />
                </div>
                <div className="text-center mb-4">
                  <h3 className="font-bold text-lg">Two-Factor Authentication</h3>
                  <p className="text-sm text-text-muted">Enter the 6-digit code from your authenticator app.</p>
                </div>
                <div>
                  <input
                    id="totpCode"
                    type="text"
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    required
                    className="w-full px-4 py-3 rounded-lg bg-surface border border-border focus:border-primary outline-none text-text transition-colors text-center font-mono tracking-[0.5em] text-lg"
                    placeholder="000000"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setRequires2FA(false);
                    setTotpCode('');
                  }}
                  className="w-full text-sm text-text-muted hover:text-text mt-2"
                >
                  Back to login
                </button>
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading || (requires2FA && totpCode.length !== 6)}
              className="w-full py-2.5 bg-primary hover:bg-primary-dark disabled:opacity-50 rounded-lg font-medium transition-colors mt-2"
            >
              {loading ? 'Signing in...' : requires2FA ? 'Verify Code' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-text-muted mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary hover:text-primary-light transition-colors">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
