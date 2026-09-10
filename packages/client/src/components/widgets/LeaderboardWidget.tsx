import type { LeaderboardEntry, WorkspaceTheme } from '@upi-stream/shared';
import { Trophy } from 'lucide-react';

interface Props {
  entries: LeaderboardEntry[];
  theme: WorkspaceTheme | null;
}

export default function LeaderboardWidget({ entries, theme }: Props) {
  const primaryColor = theme?.primaryColor || '#8b5cf6';
  
  if (entries.length === 0) return null;

  return (
    <div className="w-full flex items-center bg-black/60 backdrop-blur-md overflow-hidden border-t-2 border-b-2 border-white/10 h-12 shadow-xl">
      <div className="flex items-center px-4 h-full bg-white/5 border-r border-white/10 z-10 relative shadow-black drop-shadow-md shrink-0">
        <Trophy className="w-5 h-5 mr-2" style={{ color: primaryColor }} />
        <span className="font-bold text-white uppercase tracking-wider text-sm">Top Supporters</span>
      </div>
      
      {/* Marquee ticker container */}
      <div className="flex-1 overflow-hidden relative h-full">
        <div className="absolute whitespace-nowrap flex items-center h-full animate-[marquee_20s_linear_infinite]">
          {entries.map((entry, i) => (
            <div key={entry.donorName} className="inline-flex items-center mx-8">
              <span className="font-bold text-white/50 mr-2 text-sm">#{i + 1}</span>
              <span className="font-bold text-white mr-2 text-base drop-shadow-md">{entry.donorName}</span>
              <span className="font-mono font-bold text-sm drop-shadow-md" style={{ color: primaryColor }}>
                ₹{(entry.totalAmount / 100).toLocaleString()}
              </span>
            </div>
          ))}
          {/* Duplicate for seamless scrolling */}
          {entries.map((entry, i) => (
            <div key={`dup-${entry.donorName}`} className="inline-flex items-center mx-8">
              <span className="font-bold text-white/50 mr-2 text-sm">#{i + 1}</span>
              <span className="font-bold text-white mr-2 text-base drop-shadow-md">{entry.donorName}</span>
              <span className="font-mono font-bold text-sm drop-shadow-md" style={{ color: primaryColor }}>
                ₹{(entry.totalAmount / 100).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
