import type { Goal, WorkspaceTheme } from '@upi-stream/shared';

interface Props {
  goal: Goal;
  theme: WorkspaceTheme | null;
}

export default function GoalWidget({ goal, theme }: Props) {
  const pct = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  const primaryColor = theme?.primaryColor || '#8b5cf6';
  const secondaryColor = theme?.secondaryColor || '#1e1b4b';

  if (goal.displayType === 'circle') {
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (pct / 100) * circumference;

    return (
      <div className="relative inline-flex items-center justify-center p-4">
        <svg className="w-40 h-40 transform -rotate-90">
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke={secondaryColor}
            strokeWidth="12"
            fill="none"
            className="opacity-50"
          />
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke={primaryColor}
            strokeWidth="12"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
            style={{
              filter: goal.styleConfig.animation === 'glow' ? `drop-shadow(0 0 8px ${primaryColor})` : 'none'
            }}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold text-white shadow-black drop-shadow-md">
            {Math.floor(pct)}%
          </span>
        </div>
      </div>
    );
  }

  // Default Bar
  return (
    <div className="w-[400px] p-4 bg-black/40 backdrop-blur-md rounded-xl border-2 border-white/10 shadow-xl overflow-hidden">
      <div className="flex justify-between items-end mb-2">
        <h3 className="text-white font-bold text-lg shadow-black drop-shadow-md truncate">
          {goal.title}
        </h3>
        <span className="text-white/90 font-mono text-sm shadow-black drop-shadow-md">
          ₹{(goal.currentAmount / 100).toLocaleString()} / ₹{(goal.targetAmount / 100).toLocaleString()}
        </span>
      </div>
      
      <div className="relative h-6 rounded-full bg-black/50 overflow-hidden border border-white/5">
        <div
          className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-2"
          style={{ 
            width: `${Math.max(pct, 5)}%`,
            backgroundColor: primaryColor,
            boxShadow: goal.styleConfig.animation === 'glow' ? `0 0 15px ${primaryColor}` : 'none'
          }}
        >
          {pct >= 15 && (
            <span className="text-[10px] font-bold text-white/90 drop-shadow-sm">
              {pct.toFixed(1)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
