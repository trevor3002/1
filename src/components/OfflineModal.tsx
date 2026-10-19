import React from 'react';
import { DollarSign, Clock, Sparkles } from 'lucide-react';
import { sounds } from '../utils/audio.ts';

interface OfflineModalProps {
  secondsAway: number;
  cashEarned: number;
  message: string;
  onClaim: () => void;
}

export const OfflineModal: React.FC<OfflineModalProps> = ({
  secondsAway,
  cashEarned,
  message,
  onClaim,
}) => {
  const hours = (secondsAway / 3600).toFixed(1);
  const minutes = Math.floor((secondsAway % 3600) / 60);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0f1712] border-2 border-emerald-500/50 rounded-3xl p-6 max-w-sm w-full shadow-2xl shadow-emerald-950/60 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 bg-emerald-500/20 blur-2xl pointer-events-none" />

        <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto mb-4">
          <DollarSign className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-extrabold text-center text-white mb-1 font-display">
          OFFLINE EARNINGS!
        </h3>
        <p className="text-xs text-zinc-400 text-center mb-4">{message}</p>

        <div className="bg-black/50 border border-emerald-950 rounded-2xl p-4 my-4 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              Time Away
            </span>
            <span className="font-mono-numbers text-white font-bold">
              {hours}h {minutes}m
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Automated Revenue
            </span>
            <span className="font-mono-numbers text-emerald-400 font-extrabold text-base">
              +${cashEarned.toLocaleString()}
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            sounds.playCashRegister();
            onClaim();
          }}
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 active:scale-[0.98] transition-transform cursor-pointer"
        >
          Collect ${cashEarned.toLocaleString()}
        </button>
      </div>
    </div>
  );
};
