import React, { useState } from 'react';
import type { GameState } from '../types/game.ts';
import { MILESTONES, ACHIEVEMENTS } from '../game/constants.ts';
import { calculatePrestigeTokens } from '../game/engine.ts';
import { sounds } from '../utils/audio.ts';
import {
  Trophy,
  Crown,
  Sparkles,
  RotateCcw,
  Volume2,
  VolumeX,
  Music,
  Save,
  Smartphone,
  Maximize2,
  Gift,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface EmpireTabProps {
  state: GameState;
  onPrestige: () => void;
  onClaimDailyReward: () => void;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onToggleViewMode: () => void;
  onManualSave: () => void;
  onResetGame: () => void;
}

export const EmpireTab: React.FC<EmpireTabProps> = ({
  state,
  onPrestige,
  onClaimDailyReward,
  onToggleSound,
  onToggleMusic,
  onToggleViewMode,
  onManualSave,
  onResetGame,
}) => {
  const [showPrestigeModal, setShowPrestigeModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  const potentialTokens = calculatePrestigeTokens(state.lifetimeEarnings);
  const canPrestige = potentialTokens > 0;

  // Daily reward check (24 hours = 86400000 ms)
  const canClaimDaily = Date.now() - state.dailyRewardLastClaimed > 86400000;
  const dailyCashBonus = Math.max(1000, Math.round(state.factoryLevel * 1500));

  const handleManualSave = () => {
    onManualSave();
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 p-4 pb-24 text-zinc-100">
      {/* 1. EMPIRE REBIRTH (PRESTIGE) HERO CARD */}
      <div className="bg-gradient-to-br from-[#121f16] via-[#0d1610] to-[#080d0a] border border-emerald-500/40 rounded-3xl p-5 shadow-xl shadow-emerald-950/30 relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Empire Rebirth</h2>
              <p className="text-xs text-zinc-400">Prestige for permanent global bonuses</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-zinc-400 block uppercase tracking-wider">Your Tokens</span>
            <span className="text-lg font-mono-numbers font-black text-emerald-400 flex items-center justify-end gap-1">
              <span>{state.greenTokens}</span>
              <span className="text-sm">💎</span>
            </span>
          </div>
        </div>

        <div className="bg-black/40 rounded-2xl p-3.5 border border-emerald-900/30 my-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-zinc-300">Revenue Multiplier:</span>
            <span className="font-mono-numbers text-emerald-400 font-bold">
              +{(state.greenTokens * 5)}% Permanent Boost
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-300">Cultivation Speed:</span>
            <span className="font-mono-numbers text-cyan-400 font-bold">
              +{(state.greenTokens * 2)}% Permanent Speed
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowPrestigeModal(true)}
          disabled={!canPrestige}
          className={`w-full py-3 px-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-transform shadow-lg ${
            canPrestige
              ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-black shadow-emerald-500/25 active:scale-[0.98]'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed shadow-none'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          {canPrestige
            ? `Rebirth Empire (+${potentialTokens} Green Tokens)`
            : 'Earn $50k Lifetime Cash to Unlock Rebirth'}
        </button>
      </div>

      {/* 2. DAILY REWARD CARD */}
      <div className="bg-[#101713] border border-[#1d2d22] rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Daily Supply Drop</div>
            <div className="text-[11px] text-zinc-400">
              Claim daily bonus cash: <span className="text-amber-400 font-semibold">+${dailyCashBonus.toLocaleString()}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            if (canClaimDaily) {
              sounds.playCoin();
              onClaimDailyReward();
            }
          }}
          disabled={!canClaimDaily}
          className={`py-2 px-3.5 rounded-xl text-xs font-bold ${
            canClaimDaily
              ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-md shadow-amber-500/20 active:scale-[0.98]'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
          }`}
        >
          {canClaimDaily ? 'Claim Drop' : 'Claimed Today'}
        </button>
      </div>

      {/* 3. WEALTH MILESTONES */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              Wealth Milestones
            </h2>
            <p className="text-xs text-zinc-400">Progression from garage startup to global botanical syndicate</p>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          {MILESTONES.map((ms) => {
            const isCompleted = state.lifetimeEarnings >= ms.requiredLifetime;
            const progress = Math.min(1.0, state.lifetimeEarnings / ms.requiredLifetime);

            return (
              <div
                key={ms.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isCompleted
                    ? 'bg-[#0e1a12] border-emerald-500/40'
                    : 'bg-[#101713] border-[#1d2d22]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-zinc-700 shrink-0" />
                    )}
                    <div>
                      <div className="text-xs font-bold text-white">{ms.title}</div>
                      <div className="text-[10px] text-zinc-400">{ms.tierName}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono-numbers text-emerald-400 font-bold">
                      +{ms.tokenReward} Token{ms.tokenReward > 1 ? 's' : ''}
                    </span>
                    <span className="text-[10px] text-zinc-500 block font-mono-numbers">
                      Target: ${ms.requiredLifetime.toLocaleString()}
                    </span>
                  </div>
                </div>

                {!isCompleted && (
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${Math.round(progress * 100)}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. BUSINESS STATS */}
      <div>
        <h2 className="text-base font-bold text-white tracking-tight mb-3">Empire Statistics</h2>
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div className="bg-[#101713] border border-[#1d2d22] p-3 rounded-2xl">
            <span className="text-zinc-500 block text-[10px]">Lifetime Earnings</span>
            <span className="font-mono-numbers font-bold text-emerald-400 text-sm">
              ${state.lifetimeEarnings.toLocaleString()}
            </span>
          </div>
          <div className="bg-[#101713] border border-[#1d2d22] p-3 rounded-2xl">
            <span className="text-zinc-500 block text-[10px]">Total Harvested</span>
            <span className="font-mono-numbers font-bold text-white text-sm">
              {state.totalHarvestsGrams.toLocaleString()}g
            </span>
          </div>
          <div className="bg-[#101713] border border-[#1d2d22] p-3 rounded-2xl">
            <span className="text-zinc-500 block text-[10px]">Dispensary Sales</span>
            <span className="font-mono-numbers font-bold text-white text-sm">
              {state.totalSalesCount.toLocaleString()} Jars
            </span>
          </div>
          <div className="bg-[#101713] border border-[#1d2d22] p-3 rounded-2xl">
            <span className="text-zinc-500 block text-[10px]">Factory Prestiges</span>
            <span className="font-mono-numbers font-bold text-cyan-400 text-sm">
              {state.totalPrestiges}
            </span>
          </div>
        </div>
      </div>

      {/* 5. SETTINGS & CONTROLS */}
      <div>
        <h2 className="text-base font-bold text-white tracking-tight mb-3">Settings & Data</h2>
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between p-3.5 bg-[#101713] border border-[#1d2d22] rounded-2xl text-xs">
            <div className="flex items-center gap-2.5">
              {state.soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
              <span>Sound Effects</span>
            </div>
            <button
              onClick={onToggleSound}
              className={`px-3 py-1.5 rounded-xl font-bold ${
                state.soundEnabled ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {state.soundEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-[#101713] border border-[#1d2d22] rounded-2xl text-xs">
            <div className="flex items-center gap-2.5">
              <Music className="w-4 h-4 text-purple-400" />
              <span>Ambient Synth Lo-Fi</span>
            </div>
            <button
              onClick={onToggleMusic}
              className={`px-3 py-1.5 rounded-xl font-bold ${
                state.musicEnabled ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {state.musicEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-[#101713] border border-[#1d2d22] rounded-2xl text-xs">
            <div className="flex items-center gap-2.5">
              {state.viewMode === 'iphone' ? <Smartphone className="w-4 h-4 text-sky-400" /> : <Maximize2 className="w-4 h-4 text-sky-400" />}
              <span>Display Viewport</span>
            </div>
            <button
              onClick={onToggleViewMode}
              className="px-3 py-1.5 rounded-xl font-bold bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
            >
              {state.viewMode === 'iphone' ? 'iPhone 13 Frame' : 'Full Width'}
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-[#101713] border border-[#1d2d22] rounded-2xl text-xs">
            <div className="flex items-center gap-2.5">
              <Save className="w-4 h-4 text-emerald-400" />
              <span>Save Progress</span>
            </div>
            <button
              onClick={handleManualSave}
              className="px-3 py-1.5 rounded-xl font-bold bg-emerald-700 hover:bg-emerald-600 text-white flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              Save Now
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-[#171010] border border-red-950 rounded-2xl text-xs">
            <div className="flex items-center gap-2.5 text-red-400">
              <RotateCcw className="w-4 h-4" />
              <span>Reset Game Data</span>
            </div>
            <button
              onClick={() => setShowResetModal(true)}
              className="px-3 py-1.5 rounded-xl font-bold bg-red-900/60 hover:bg-red-800 text-red-200"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {saveToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-emerald-500 text-black font-bold text-xs px-4 py-2 rounded-full shadow-lg">
          Game Saved Successfully!
        </div>
      )}

      {/* PRESTIGE CONFIRMATION MODAL */}
      {showPrestigeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#0f1712] border border-emerald-500/40 rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/40">
              <Crown className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-center text-white mb-2">Confirm Empire Rebirth</h3>
            <p className="text-xs text-zinc-400 text-center mb-4">
              Rebirthing resets your cash, stations, and inventory in exchange for{' '}
              <span className="text-emerald-400 font-bold">+{potentialTokens} Permanent Green Tokens</span>.
              Each token grants permanent +5% global revenue and +2% cultivation speed forever!
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPrestigeModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold hover:bg-zinc-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowPrestigeModal(false);
                  sounds.playUpgrade();
                  onPrestige();
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400 shadow-lg shadow-emerald-500/25"
              >
                Confirm Rebirth
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET CONFIRMATION MODAL */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#170f0f] border border-red-500/40 rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4 border border-red-500/40">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-center text-white mb-2">Reset Entire Empire?</h3>
            <p className="text-xs text-zinc-400 text-center mb-4">
              Are you sure? This will wipe all cash, stations, unlocked strains, and prestige tokens. This action is irreversible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold hover:bg-zinc-700"
              >
                Keep Playing
              </button>
              <button
                onClick={() => {
                  setShowResetModal(false);
                  onResetGame();
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-500 shadow-lg shadow-red-600/25"
              >
                Yes, Reset All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
