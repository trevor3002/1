import React from 'react';
import type { GameState, StrainId } from '../types/game.ts';
import { STRAINS } from '../game/constants.ts';
import { calculateYield, calculateGrowDuration, calculateCurrentStorageWeight } from '../game/engine.ts';
import { sounds } from '../utils/audio.ts';
import { Sparkles, Scissors, Sprout, ArrowRight, Lock, Plus, CheckCircle2 } from 'lucide-react';

interface ProductionTabProps {
  state: GameState;
  onPlant: (stationId: string) => void;
  onHarvest: (stationId: string) => void;
  onUnlockStation: (stationId: string) => void;
  onChangeStationStrain: (stationId: string, strainId: StrainId) => void;
  onManualProcess: (machineId: string) => void;
  onManualPackage: (lineId: string) => void;
  onUnlockMachine: (machineId: string) => void;
  onUnlockPackaging: (lineId: string) => void;
}

/** Small, stylised tycoon-game plant illustration; visual stage follows live grow progress. */
const PlantIllustration: React.FC<{ progress: number; color: string; ready: boolean }> = ({ progress, color, ready }) => {
  const stage = progress >= 0.8 ? 3 : progress >= 0.45 ? 2 : progress > 0 ? 1 : 0;
  const leaf = color || '#45c96b';
  return (
    <div className="relative h-[112px] w-full overflow-hidden rounded-xl border border-emerald-900/70 bg-gradient-to-b from-[#132b20] via-[#10251b] to-[#0a1711]">
      <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#263c27] to-[#263c27]/0" />
      <div className="absolute left-3 top-3 h-1.5 w-1.5 rounded-full bg-emerald-200/70" />
      <div className="absolute right-5 top-5 h-1 w-1 rounded-full bg-lime-200/60" />
      <svg viewBox="0 0 160 112" className="relative h-full w-full" role="img" aria-label={ready ? "Mature plant ready to harvest" : stage === 0 ? "Empty growing pot" : "Growing plant"}>
        <ellipse cx="80" cy="96" rx="38" ry="7" fill="#050b08" opacity=".45" />
        {stage > 0 && (
          <g stroke="#277747" strokeWidth="4" strokeLinecap="round" fill="none">
            <path d={stage === 1 ? "M80 79 Q79 65 80 52" : stage === 2 ? "M80 82 Q78 57 80 31" : "M80 83 Q78 48 80 20"} />
          </g>
        )}
        {stage >= 1 && <g fill={leaf} stroke="#1c6a3b" strokeWidth="1.5" strokeLinejoin="round">
          <path d="M79 67 Q54 62 49 43 Q69 45 79 67Z" />
          <path d="M81 61 Q105 55 111 37 Q91 40 81 61Z" />
          {stage >= 2 && <>
            <path d="M79 51 Q54 45 56 26 Q73 31 79 51Z" />
            <path d="M82 45 Q103 38 103 20 Q87 25 82 45Z" />
            <path d="M79 35 Q64 25 71 12 Q81 20 79 35Z" />
          </>}
          {stage >= 3 && <>
            <path d="M72 43 Q42 39 40 19 Q62 23 72 43Z" />
            <path d="M88 39 Q119 32 121 13 Q99 20 88 39Z" />
            <path d="M80 28 Q72 16 80 7 Q88 17 80 28Z" />
          </>}
        </g>}
        {stage >= 3 && <g fill="#a7e66b" stroke="#e0ff9b" strokeWidth=".8">
          <circle cx="73" cy="32" r="4" /><circle cx="87" cy="29" r="4" /><circle cx="80" cy="20" r="4" />
        </g>}
        <path d="M52 77 L108 77 L101 101 Q80 107 59 101Z" fill="#a85f38" stroke="#e7a16a" strokeWidth="2" />
        <path d="M55 79 L105 79" stroke="#f1b17d" strokeWidth="3" strokeLinecap="round" />
        <path d="M61 86 L99 86" stroke="#7b4028" strokeWidth="2" opacity=".7" />
        {stage === 0 && <g fill="#8cbd60"><path d="M76 77 Q70 67 62 72 Q68 80 76 77Z"/><path d="M83 77 Q90 66 98 72 Q92 80 83 77Z"/></g>}
      </svg>
      <span className="absolute bottom-2 right-2 rounded-md border border-white/10 bg-black/50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-200">
        {ready ? 'Ready!' : stage === 0 ? 'Seedling' : stage === 1 ? 'Sprout' : stage === 2 ? 'Growing' : 'Flowering'}
      </span>
    </div>
  );
};

export const ProductionTab: React.FC<ProductionTabProps> = ({
  state,
  onPlant,
  onHarvest,
  onUnlockStation,
  onChangeStationStrain,
  onManualProcess,
  onManualPackage,
  onUnlockMachine,
  onUnlockPackaging,
}) => {
  const currentStorage = calculateCurrentStorageWeight(state.inventory);
  const maxStorage = state.inventory.maxCapacity;
  const storagePercentage = Math.min(100, Math.round((currentStorage / maxStorage) * 100));

  return (
    <div className="flex flex-col gap-5 p-4 pb-24 text-zinc-100">
      {/* Storage Capacity Bar */}
      <div className="bg-[#101713] border border-[#1e2f23] rounded-2xl p-4">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-semibold text-zinc-300">Warehouse Storage</span>
          <span className="font-mono-numbers text-emerald-400 font-bold">
            {currentStorage}g / {maxStorage}g ({storagePercentage}%)
          </span>
        </div>
        <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              storagePercentage > 90 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${storagePercentage}%` }}
          />
        </div>
      </div>

      {/* 1. GROW STATIONS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Sprout className="w-4 h-4 text-emerald-400" />
              Cultivation Stations
            </h2>
            <p className="text-xs text-zinc-400">Manage soil beds and selected strain crops</p>
          </div>
          <span className="text-xs text-emerald-400 font-medium">
            {state.growStations.filter((s) => s.unlocked).length} / {state.growStations.length} Active
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {state.growStations.map((station) => {
            const strain = STRAINS[station.strainId];
            const growTime = calculateGrowDuration(
              station.strainId,
              state.upgrades,
              state.hiredManagers,
              Date.now() < state.frenzyUntil,
              state.greenTokens
            );
            const yieldAmount = calculateYield(station.strainId, state.upgrades, state.hiredManagers);

            if (!station.unlocked) {
              const canAfford = state.cash >= station.unlockCost;
              return (
                <div
                  key={station.id}
                  className="bg-[#0c120f] border border-dashed border-zinc-800 rounded-2xl p-4 flex flex-col justify-between"
                >
                  <div className="flex items-center gap-2 text-zinc-500 mb-3">
                    <Lock className="w-4 h-4" />
                    <span className="text-xs font-semibold">{station.name}</span>
                  </div>
                  <button
                    onClick={() => {
                      if (canAfford) {
                        sounds.playUpgrade();
                        onUnlockStation(station.id);
                      }
                    }}
                    disabled={!canAfford}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                      canAfford
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 active:scale-[0.98]'
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Unlock Station (${station.unlockCost.toLocaleString()})
                  </button>
                </div>
              );
            }

            return (
              <div
                key={station.id}
                className="bg-[#101713] border border-[#1d2d22] rounded-2xl p-3.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-zinc-200">{station.name}</span>
                    <select
                      value={station.strainId}
                      onChange={(e) => onChangeStationStrain(station.id, e.target.value as StrainId)}
                      className="bg-black/60 border border-zinc-700 text-zinc-300 text-xs rounded-lg px-2 py-1 outline-none cursor-pointer"
                    >
                      {state.unlockedStrains.map((sId) => (
                        <option key={sId} value={sId} className="bg-zinc-900 text-zinc-200">
                          {STRAINS[sId].icon} {STRAINS[sId].name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="my-2 rounded-xl bg-black/20 p-1.5">
                    <PlantIllustration progress={station.progress} color={strain.color} ready={station.progress >= 1.0} />
                    <div className="flex items-center justify-between gap-1 px-1 pt-2 text-xs">
                      <span className="min-w-0 truncate font-semibold" style={{ color: strain.color }}>
                        {strain.icon} {strain.name}
                      </span>
                      <span className="shrink-0 text-[10px] text-zinc-400">{growTime.toFixed(1)}s</span>
                    </div>
                    <div className="px-1 pb-1 pt-1 text-[11px] text-zinc-400">
                      Yield <span className="font-bold text-emerald-400">{yieldAmount}g</span> raw bud
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="my-2">
                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-200"
                        style={{
                          width: `${Math.round(station.progress * 100)}%`,
                          backgroundColor: station.progress >= 1.0 ? '#22c55e' : strain.color,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Station Action Button */}
                <div className="mt-2">
                  {station.progress >= 1.0 ? (
                    <button
                      onClick={() => onHarvest(station.id)}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-[0.98]"
                    >
                      <Scissors className="w-3.5 h-3.5" />
                      Harvest Ready Crop! (+{yieldAmount}g)
                    </button>
                  ) : station.isGrowing ? (
                    <button
                      onClick={() => onHarvest(station.id)}
                      className="w-full py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs flex items-center justify-center gap-1.5 active:scale-[0.98]"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Tap to Speed Up ({Math.round(station.progress * 100)}%)
                    </button>
                  ) : (
                    <button
                      onClick={() => onPlant(station.id)}
                      className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 active:scale-[0.98]"
                    >
                      <Sprout className="w-3.5 h-3.5" />
                      Plant Seeds (${strain.seedCost})
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. PROCESSING LABORATORY */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Processing & Extraction Lab
            </h2>
            <p className="text-xs text-zinc-400">Refines raw harvested flower into cured smokables & oil</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {state.processingMachines.map((machine) => {
            if (!machine.unlocked) {
              const canAfford = state.cash >= machine.unlockCost;
              return (
                <div
                  key={machine.id}
                  className="bg-[#0c120f] border border-dashed border-zinc-800 rounded-2xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 text-zinc-500">
                    <Lock className="w-4 h-4" />
                    <div>
                      <div className="text-xs font-semibold">{machine.name}</div>
                      <div className="text-[11px] text-zinc-500">Efficiency: {machine.efficiency}x</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (canAfford) {
                        sounds.playUpgrade();
                        onUnlockMachine(machine.id);
                      }
                    }}
                    disabled={!canAfford}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold ${
                      canAfford ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    }`}
                  >
                    Unlock (${machine.unlockCost.toLocaleString()})
                  </button>
                </div>
              );
            }

            const totalRaw = Object.values(state.inventory.raw).reduce((a, b) => a + b, 0);
            const hasRaw = totalRaw >= 10;

            return (
              <div
                key={machine.id}
                className="bg-[#101713] border border-[#231b2d] rounded-2xl p-4 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-zinc-200">{machine.name}</h3>
                    <div className="text-[11px] text-purple-400 font-medium">
                      Converts 10g Raw Flower ➔ 10g Cured Terpene Stock
                    </div>
                  </div>
                  <span className="text-xs font-mono-numbers text-zinc-400 bg-black/40 px-2 py-0.5 rounded">
                    Lvl {machine.level}
                  </span>
                </div>

                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all duration-200"
                    style={{ width: `${Math.round(machine.progress * 100)}%` }}
                  />
                </div>

                <button
                  onClick={() => onManualProcess(machine.id)}
                  disabled={!hasRaw || machine.isProcessing}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 ${
                    machine.isProcessing
                      ? 'bg-purple-950/60 text-purple-300 border border-purple-800/40'
                      : hasRaw
                      ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-900/30 active:scale-[0.98]'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  {machine.isProcessing
                    ? `Processing Batch... (${Math.round(machine.progress * 100)}%)`
                    : hasRaw
                    ? 'Start 10g Extraction Batch 🧪'
                    : 'Requires 10g Raw Harvest'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. PACKAGING LINES */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-400" />
              Packaging Lines
            </h2>
            <p className="text-xs text-zinc-400">Packs cured flower into vacuum retail jars ready for the shop</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {state.packagingLines.map((line) => {
            if (!line.unlocked) {
              const canAfford = state.cash >= line.unlockCost;
              return (
                <div
                  key={line.id}
                  className="bg-[#0c120f] border border-dashed border-zinc-800 rounded-2xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 text-zinc-500">
                    <Lock className="w-4 h-4" />
                    <div>
                      <div className="text-xs font-semibold">{line.name}</div>
                      <div className="text-[11px] text-zinc-500">Pack size: {line.packSize}g per jar</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (canAfford) {
                        sounds.playUpgrade();
                        onUnlockPackaging(line.id);
                      }
                    }}
                    disabled={!canAfford}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold ${
                      canAfford ? 'bg-sky-600 text-white' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    }`}
                  >
                    Unlock (${line.unlockCost.toLocaleString()})
                  </button>
                </div>
              );
            }

            const totalProcessed = Object.values(state.inventory.processed).reduce((a, b) => a + b, 0);
            const hasProcessed = totalProcessed >= line.packSize;

            return (
              <div
                key={line.id}
                className="bg-[#101713] border border-[#1b2733] rounded-2xl p-4 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-zinc-200">{line.name}</h3>
                    <div className="text-[11px] text-sky-400 font-medium">
                      Packs {line.packSize}g Processed Flower ➔ 1 Retail Jar
                    </div>
                  </div>
                  <span className="text-xs font-mono-numbers text-zinc-400 bg-black/40 px-2 py-0.5 rounded">
                    Lvl {line.level}
                  </span>
                </div>

                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-500 rounded-full transition-all duration-200"
                    style={{ width: `${Math.round(line.progress * 100)}%` }}
                  />
                </div>

                <button
                  onClick={() => onManualPackage(line.id)}
                  disabled={!hasProcessed || line.isPackaging}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 ${
                    line.isPackaging
                      ? 'bg-sky-950/60 text-sky-300 border border-sky-800/40'
                      : hasProcessed
                      ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-900/30 active:scale-[0.98]'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  {line.isPackaging
                    ? `Packaging Retail Jars... (${Math.round(line.progress * 100)}%)`
                    : hasProcessed
                    ? `Package ${line.packSize}g Jar 📦`
                    : `Requires ${line.packSize}g Processed Stock`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
