import { useEffect, useState, useRef } from 'react';
import { Timer } from 'lucide-react';
import type { Marathon, WorkspaceTheme } from '@upi-stream/shared';

interface Props {
  marathon: Marathon;
  theme: WorkspaceTheme | null;
}

export default function MarathonWidget({ marathon, theme }: Props) {
  const [remaining, setRemaining] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const primaryColor = theme?.primaryColor || '#8b5cf6';

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (marathon.status === 'running') {
      intervalRef.current = setInterval(() => {
        setRemaining(computeRemaining());
      }, 100);
    } else {
      setRemaining(computeRemaining());
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [marathon]);

  function computeRemaining(): number {
    const total = marathon.durationSeconds + marathon.bonusSeconds;
    if (marathon.status === 'running' && marathon.startedAt) {
      const elapsed = (Date.now() - new Date(marathon.startedAt).getTime()) / 1000;
      return Math.max(0, total - marathon.elapsedSeconds - elapsed);
    }
    return Math.max(0, total - marathon.elapsedSeconds);
  }

  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = Math.floor(remaining % 60);

  return (
    <div className="inline-flex items-center gap-4 px-6 py-4 bg-black/60 backdrop-blur-md rounded-2xl border-2 border-white/10 shadow-2xl overflow-hidden relative">
      {/* Background glow */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{ 
          background: `radial-gradient(circle at center, ${primaryColor} 0%, transparent 70%)` 
        }} 
      />
      
      <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-xl bg-white/10">
        <Timer 
          className="w-7 h-7 text-white drop-shadow-md" 
          style={{ color: marathon.status === 'running' ? primaryColor : 'white' }}
        />
      </div>
      
      <div className="relative z-10 flex flex-col">
        <span className="text-xs font-bold uppercase tracking-wider text-white/70 shadow-black drop-shadow-sm mb-1">
          {marathon.title}
        </span>
        <div className="font-mono text-5xl font-black tracking-widest text-white shadow-black drop-shadow-lg">
          {String(hours).padStart(2, '0')}:
          <span style={{ color: primaryColor }}>{String(minutes).padStart(2, '0')}</span>:
          {String(seconds).padStart(2, '0')}
        </div>
      </div>
    </div>
  );
}
