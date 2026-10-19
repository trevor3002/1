import React from 'react';
import type { GameState, Manager, UpgradeDef } from '../types/game.ts';
import { UPGRADE_CATALOG, MANAGERS } from '../game/constants.ts';
import { getUpgradeCost } from '../game/engine.ts';
import { sounds } from '../utils/audio.ts';
import { Wrench, Users, ArrowUpCircle, Check } from 'lucide-react';

interface UpgradesTabProps {
  state: GameState;
  onBuyUpgrade: (upgradeId: string) => void;
  onHireManager: (managerId: string) => void;
}

export const UpgradesTab: React.FC<UpgradesTabProps> = ({
  state,
  onBuyUpgrade,
  onHireManager,
}) => {
  return (
    <div className="flex flex-col gap-6 p-4 pb-24 text-zinc-100">
      {/* 1. MANAGERS & STAFF */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              Facility Staff & Automation Leads
            </h2>
            <p className="text-xs text-zinc-400">Hire managers to automate planting, harvesting, curing, and sales</p>
          </div>
          <span className="text-xs font-mono-numbers text-purple-400 font-medium">
            {Object.values(state.hiredManagers).filter(Boolean).length} / {MANAGERS.length} Hired
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MANAGERS.map((mgr) => {
            const isHired = !!state.hiredManagers[mgr.id];
            const canAfford = state.cash >= mgr.hireCost;

            return (
              <div
                key={mgr.id}
                className={`rounded-2xl p-4 flex flex-col justify-between border transition-all ${
                  isHired
                    ? 'bg-[#121019] border-purple-900/40 shadow-sm shadow-purple-950/20'
                    : 'bg-[#101713] border-[#1d2d22]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl p-2 rounded-xl bg-black/40">{mgr.avatar}</span>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          {mgr.name}
                          {isHired && (
                            <span className="text-[10px] text-purple-400 font-semibold bg-purple-950/80 px-2 py-0.5 rounded-full border border-purple-800/40">
                              Active Lead
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-400">{mgr.role}</div>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-400 mb-2">{mgr.description}</p>
                  <div className="text-[11px] font-semibold text-emerald-400 bg-black/30 px-2.5 py-1.5 rounded-xl mb-3">
                    Perk: {mgr.perk}
                  </div>
                </div>

                {isHired ? (
                  <div className="w-full py-2 px-3 rounded-xl bg-purple-950/40 border border-purple-800/40 text-purple-300 text-xs font-semibold flex items-center justify-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    Automating Department
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      if (canAfford) {
                        sounds.playUpgrade();
                        onHireManager(mgr.id);
                      }
                    }}
                    disabled={!canAfford}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-transform ${
                      canAfford
                        ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-950/40 active:scale-[0.98]'
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    }`}
                  >
                    Hire (${mgr.hireCost.toLocaleString()})
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. EQUIPMENT & FACILITY UPGRADES */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Wrench className="w-4 h-4 text-emerald-400" />
              Equipment & Engineering Upgrades
            </h2>
            <p className="text-xs text-zinc-400">Boost growth speed, resin yield, retail traffic, and warehouse size</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {UPGRADE_CATALOG.map((upg) => {
            const currentLevel = state.upgrades[upg.id] || 0;
            const isMax = currentLevel >= upg.maxLevel;
            const cost = getUpgradeCost(upg.id, currentLevel);
            const canAfford = state.cash >= cost;

            return (
              <div
                key={upg.id}
                className="bg-[#101713] border border-[#1d2d22] rounded-2xl p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl p-2 rounded-xl bg-black/40">{upg.icon}</span>
                      <div>
                        <div className="text-xs font-bold text-white">{upg.name}</div>
                        <div className="text-[10px] text-emerald-400 font-mono-numbers">
                          Level {currentLevel} / {upg.maxLevel}
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-400 mb-3">{upg.description}</p>
                </div>

                {isMax ? (
                  <div className="w-full py-2 px-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    Max Level Reached
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      if (canAfford) {
                        sounds.playUpgrade();
                        onBuyUpgrade(upg.id);
                      }
                    }}
                    disabled={!canAfford}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-transform ${
                      canAfford
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40 active:scale-[0.98]'
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    }`}
                  >
                    <ArrowUpCircle className="w-3.5 h-3.5" />
                    Upgrade Lvl {currentLevel + 1} (${cost.toLocaleString()})
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
