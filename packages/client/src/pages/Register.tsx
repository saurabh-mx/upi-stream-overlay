import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Eye, EyeOff } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuthStore } from '@/stores/authStore';
import api from '@/api/client';
import toast from 'react-hot-toast';

export default function Register() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      toast.success('Account created!');
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
      const { data } = await api.post('/auth/register', { email, password, displayName });
      setAuth(data.user, data.accessToken, data.refreshToken);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed');
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
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-text-muted mt-1">Start building your stream overlays</p>
        </div>

        <div className="p-8 rounded-2xl glass-card">
          <div className="mb-6 flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleLogin}
              onError={() => toast.error('Google login failed')}
              theme="filled_black"
              shape="rectangular"
              width="100%"
              text="signup_with"
            />
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 py-1 rounded-full bg-surface/50 border border-white/5 text-text-muted backdrop-blur-sm">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="displayName" className="block text-sm font-semibold text-white mb-2 uppercase tracking-wide">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                minLength={2}
                maxLength={50}
                className="w-full px-4 py-3 rounded-xl bg-surface/50 border border-white/10 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-white transition-all placeholder:text-text-muted"
                placeholder="ProGamerX"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-white mb-2 uppercase tracking-wide">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-surface/50 border border-white/10 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-white transition-all placeholder:text-text-muted"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-white mb-2 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 rounded-xl bg-surface/50 border border-white/10 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-white transition-all placeholder:text-text-muted pr-10"
                  placeholder="Min. 8 characters"
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
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white rounded-xl font-bold tracking-wide transition-all hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] mt-4"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-text-muted mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:text-primary-light transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
