import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import GoalWidget from '@/components/widgets/GoalWidget';
import MarathonWidget from '@/components/widgets/MarathonWidget';
import LeaderboardWidget from '@/components/widgets/LeaderboardWidget';
import AlertWidget from '@/components/widgets/AlertWidget';
import type { Goal, Marathon, LeaderboardEntry, WorkspaceTheme, Donation } from '@upi-stream/shared';

// For embed routes, we don't use the authenticated api client
const publicApi = axios.create({ baseURL: '/api' });

export default function Embed() {
  // e.g. "goal/123", we'll parse location.pathname
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data state
  const [goal, setGoal] = useState<Goal | null>(null);
  const [marathon, setMarathon] = useState<Marathon | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [latestDonation, setLatestDonation] = useState<Donation | null>(null);
  const [theme, setTheme] = useState<WorkspaceTheme | null>(null);
  
  // Widget Type
  const [type, setType] = useState<'goal' | 'marathon' | 'leaderboard' | 'alert' | null>(null);

  useEffect(() => {
    // Parse the path to determine type and ID
    // format: /embed/goal/123-456
    const parts = location.pathname.split('/').filter(Boolean);
    if (parts.length < 3) {
      setError('Invalid embed URL');
      setLoading(false);
      return;
    }
    
    const widgetType = parts[1] as 'goal' | 'marathon' | 'leaderboard' | 'alert';
    const id = parts[2];
    setType(widgetType);

    if (widgetType === 'alert') {
      // For alerts, ID is just the workspaceId. We fetch the theme.
      publicApi.get(`/embed/leaderboard/${id}`).then(({ data }) => {
        setTheme(data.theme);
        setupSocket(id, widgetType, id);
        setLoading(false);
      }).catch((err) => {
        setError(err.response?.data?.error || 'Failed to load widget');
        setLoading(false);
      });
    } else {
      loadData(widgetType, id);
    }
  }, [location.pathname]);

  async function loadData(widgetType: string, id: string) {
    try {
      const { data } = await publicApi.get(`/embed/${widgetType}/${id}`);
      setTheme(data.theme);
      
      if (widgetType === 'goal') setGoal(data.goal);
      else if (widgetType === 'marathon') setMarathon(data.marathon);
      else if (widgetType === 'leaderboard') setLeaderboard(data.entries);

      // Once we have data, we know the workspaceId. Connect to Socket.IO.
      const workspaceId = data.goal?.workspaceId || data.marathon?.workspaceId || id; // for leaderboard, id is workspaceId
      setupSocket(workspaceId, widgetType, id);
      
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load widget');
      setLoading(false);
    }
  }

  function setupSocket(workspaceId: string, widgetType: string, targetId: string) {
    const socket: Socket = io({ path: '/socket.io' });
    
    socket.on('connect', () => {
      socket.emit('workspace:join', workspaceId);
    });

    socket.on('goal:updated', (updatedGoal: Goal) => {
      if (widgetType === 'goal' && updatedGoal.id === targetId) {
        setGoal(updatedGoal);
      }
    });

    socket.on('marathon:updated', (updatedMarathon: Marathon) => {
      if (widgetType === 'marathon' && updatedMarathon.id === targetId) {
        setMarathon(updatedMarathon);
      }
    });

    socket.on('leaderboard:updated', () => {
      if (widgetType === 'leaderboard') {
        // Re-fetch leaderboard data
        publicApi.get(`/embed/leaderboard/${targetId}`).then(({ data }) => {
          setLeaderboard(data.entries);
        });
      }
    });
    
    socket.on('donation:new', (newDonation: Donation) => {
      if (widgetType === 'alert') {
        setLatestDonation(newDonation);
      }
    });

    return () => {
      socket.disconnect();
    };
  }

  // Force transparent background for OBS
  useEffect(() => {
    document.body.style.backgroundColor = 'transparent';
    return () => {
      document.body.style.backgroundColor = '';
    };
  }, []);

  if (loading) return null;
  if (error) return <div className="text-danger font-bold bg-surface p-2 rounded inline-block border border-danger">{error}</div>;

  return (
    <div 
      className="w-full h-full flex items-center justify-center overflow-hidden"
      style={theme ? {
        '--color-primary': theme.primaryColor,
        '--color-secondary': theme.secondaryColor,
        '--color-accent': theme.accentColor,
        'fontFamily': theme.fontFamily,
      } as React.CSSProperties : {}}
    >
      {type === 'goal' && goal && <GoalWidget goal={goal} theme={theme} />}
      {type === 'marathon' && marathon && <MarathonWidget marathon={marathon} theme={theme} />}
      {type === 'leaderboard' && <LeaderboardWidget entries={leaderboard} theme={theme} />}
      {type === 'alert' && <AlertWidget donation={latestDonation} theme={theme} />}
    </div>
  );
}
