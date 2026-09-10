import { useEffect, useState } from 'react';
import type { Donation, WorkspaceTheme } from '@upi-stream/shared';

interface Props {
  donation: Donation | null;
  theme: WorkspaceTheme | null;
}

export default function AlertWidget({ donation, theme }: Props) {
  const [visible, setVisible] = useState(false);
  const primaryColor = theme?.primaryColor || '#8b5cf6';
  const accentColor = theme?.accentColor || '#06b6d4';

  useEffect(() => {
    if (donation) {
      // Play sound
      const audio = new Audio('/alert-sound.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.warn('Could not play alert sound:', e));

      setVisible(true);
      
      // Hide after 5 seconds
      const timer = setTimeout(() => {
        setVisible(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [donation]);

  if (!donation) return null;

  return (
    <div className="flex items-center justify-center w-full h-full perspective-[1000px]">
      <div 
        className={`transform transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          visible 
            ? 'scale-100 opacity-100 rotate-x-0 translate-y-0' 
            : 'scale-90 opacity-0 -rotate-x-90 translate-y-20'
        }`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div 
          className="relative max-w-lg w-[600px] overflow-hidden rounded-3xl border-4 p-8 shadow-2xl flex flex-col items-center text-center backdrop-blur-xl bg-black/60"
          style={{ 
            borderColor: accentColor,
            boxShadow: `0 20px 50px -12px ${primaryColor}60, 0 0 40px ${accentColor}80`
          }}
        >
          {/* Animated Glow Rings */}
          <div className="absolute inset-0 z-0">
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full animate-[spin_10s_linear_infinite] opacity-30 blur-3xl pointer-events-none"
              style={{ background: `conic-gradient(from 0deg, transparent, ${primaryColor}, transparent, ${accentColor}, transparent)` }}
            />
          </div>

          <div className="relative z-10 w-full">
            <h2 className="text-4xl font-black text-white mb-2 drop-shadow-xl uppercase tracking-wider">
              NEW DONATION!
            </h2>
            
            <div 
              className="text-6xl font-black mb-4 drop-shadow-2xl"
              style={{ 
                color: accentColor,
                textShadow: `0 0 20px ${accentColor}`
              }}
            >
              ₹{(donation.amount / 100).toLocaleString()}
            </div>
            
            <div className="text-3xl font-bold text-white mb-4 drop-shadow-lg flex items-center justify-center flex-wrap">
              <span className="opacity-80 font-normal mr-2">from</span>
              <span style={{ color: primaryColor }}>{donation.donorName}</span>
            </div>

            {donation.message && (
              <div 
                className="mt-6 text-2xl text-white/90 italic font-medium px-6 py-4 rounded-2xl bg-black/40 border-l-4 shadow-inner"
                style={{ borderLeftColor: primaryColor }}
              >
                "{donation.message}"
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
