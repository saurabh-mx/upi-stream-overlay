import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useAuthStore } from '@/stores/authStore';

import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import DashboardLayout from '@/pages/DashboardLayout';
import DashboardOverview from '@/pages/DashboardOverview';
import GoalsPage from '@/pages/Goals';
import MarathonPage from '@/pages/Marathon';
import LeaderboardPage from '@/pages/Leaderboard';
import CreateWorkspace from '@/pages/CreateWorkspace';
import MembersPage from '@/pages/Members';
import SettingsPage from '@/pages/Settings';
import Embed from '@/pages/Embed';

import DonationsPage from '@/pages/Donations';
import PublicDonate from '@/pages/PublicDonate';

import AnalyticsPage from '@/pages/Analytics';
import AuditLogsPage from '@/pages/AuditLogs';
import ProfilePage from '@/pages/Profile';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'placeholder';

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<GuestRoute><Landing /></GuestRoute>} />
            <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
            
            {/* Public OBS Embed */}
            <Route path="/embed/:token" element={<Embed />} />

            {/* Public Donate Page */}
            <Route path="/donate/:slug" element={<PublicDonate />} />

            {/* Protected Dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardOverview />} />
              <Route path="create-workspace" element={<CreateWorkspace />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="goals" element={<GoalsPage />} />
              <Route path="marathon" element={<MarathonPage />} />
              <Route path="donations" element={<DonationsPage />} />
              <Route path="leaderboard" element={<LeaderboardPage />} />
              <Route path="members" element={<MembersPage />} />
              <Route path="audit-logs" element={<AuditLogsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1a1a3e',
              color: '#e2e8f0',
              border: '1px solid #2d2d5e',
            },
          }}
        />
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}
