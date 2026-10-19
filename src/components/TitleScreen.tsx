import React from 'react';
import { Play, Sparkles, Volume2, VolumeX, Crown, RotateCcw } from 'lucide-react';
import { sounds } from '../utils/audio.ts';

interface TitleScreenProps {
  onStartGame: () => void;
  hasExistingSave: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onResetGame: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  hasExistingSave,
  soundEnabled,
  onToggleSound,
  onResetGame,
}) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        sounds.playHarvest();
        onStartGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartGame]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-6 bg-[#070b09] text-zinc-100 overflow-hidden select-none">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/3 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Utility Bar */}
      <div className="w-full flex items-center justify-between z-10">
        <span className="text-[11px] font-mono-numbers text-zinc-500 tracking-widest uppercase">
          Build v1.0 · iPhone 13 Ready
        </span>
        <button
          onClick={onToggleSound}
          className="p-2.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-white"
          aria-label="Toggle Sound"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      {/* Hero Title & Emblem */}
      <div className="flex flex-col items-center text-center my-auto z-10 max-w-sm">
        {/* Animated Neon Botanical Insignia */}
        <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
          <div className="absolute inset-0 bg-emerald-500/20 rounded-3xl blur-xl animate-pulse" />
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-[#182a1f] to-[#0c140f] border-2 border-emerald-500/50 flex items-center justify-center shadow-2xl shadow-emerald-950/60">
            <span className="text-4xl filter drop-shadow-[0_0_12px_rgba(34,197,94,0.6)]">🌿</span>
          </div>
        </div>

        {/* Title Lockup */}
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2 font-display">
          WEED FACTORY
        </h1>
        <div className="text-xs font-bold tracking-[0.25em] text-emerald-400 uppercase mb-4 flex items-center justify-center gap-2">
          <span>—</span>
          <span>GREEN EMPIRE</span>
          <span>—</span>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mb-8">
          Cultivate exotic strains, automate high-tech processing lines, manage dispensary sales, and establish a multi-million dollar green dynasty.
        </p>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-3">
          <button
            data-start="true"
            onClick={() => {
              sounds.playHarvest();
              onStartGame();
            }}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-400 hover:from-emerald-400 hover:to-green-400 text-black font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-500/25 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-black" />
            {hasExistingSave ? 'CONTINUE EMPIRE' : 'START GREEN EMPIRE'}
          </button>

          {hasExistingSave && (
            <button
              onClick={() => {
                if (window.confirm('Start a completely new game? Your current progress will be reset.')) {
                  onResetGame();
                  onStartGame();
                }
              }}
              className="w-full py-3 px-4 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 border border-zinc-800/80 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              New Game (Wipe Progress)
            </button>
          )}
        </div>
      </div>

      {/* Bottom Footer Hint */}
      <div className="z-10 text-center">
        <span className="text-[11px] text-zinc-500 font-medium">
          Fictional In-Game Tycoon Economy · Press Space or Tap to Play
        </span>
      </div>
    </div>
  );
};
