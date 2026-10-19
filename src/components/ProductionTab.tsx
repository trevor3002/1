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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                  <div className="flex items-center gap-3 my-2 bg-black/30 p-2.5 rounded-xl">
                    <span className="text-2xl">{strain.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold" style={{ color: strain.color }}>
                          {strain.name}
                        </span>
                        <span className="text-zinc-400">{growTime.toFixed(1)}s cycle</span>
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        Yield: <span className="text-emerald-400 font-semibold">{yieldAmount}g</span> raw bud
                      </div>
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
