import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { GameState, StrainId, WholesaleOrder } from './types/game.ts';
import { INITIAL_GAME_STATE, STRAINS, UPGRADE_CATALOG } from './game/constants.ts';
import {
  tickSimulation,
  calculateOfflineEarnings,
  calculateMaxStorage,
  calculateCurrentStorageWeight,
  calculateSellPrice,
  getUpgradeCost,
  applyPrestige,
} from './game/engine.ts';
import { sounds } from './utils/audio.ts';
import { FactoryCanvas } from './components/FactoryCanvas.tsx';
import { ProductionTab } from './components/ProductionTab.tsx';
import { SalesTab } from './components/SalesTab.tsx';
import { UpgradesTab } from './components/UpgradesTab.tsx';
import { EmpireTab } from './components/EmpireTab.tsx';
import { TitleScreen } from './components/TitleScreen.tsx';
import { OfflineModal } from './components/OfflineModal.tsx';
import {
  Factory,
  Sprout,
  ShoppingBag,
  Wrench,
  Crown,
  Zap,
  Volume2,
  VolumeX,
  Smartphone,
  Maximize2,
  Sparkles,
} from 'lucide-react';

const STORAGE_KEY = 'weed_factory_tycoon_save_v1';

export default function App() {
  const [inGame, setInGame] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<'factory' | 'production' | 'sales' | 'upgrades' | 'empire'>('factory');
  const [state, setState] = useState<GameState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_GAME_STATE,
          ...parsed,
          inventory: {
            ...INITIAL_GAME_STATE.inventory,
            ...(parsed.inventory || {}),
          },
        };
      }
    } catch {}
    return INITIAL_GAME_STATE;
  });

  const [offlineData, setOfflineData] = useState<{
    seconds: number;
    cash: number;
    message: string;
  } | null>(null);

  const [profitPerSec, setProfitPerSec] = useState<number>(0);
  const recentEarningsRef = useRef<number[]>([]);

  // Check URL params for ?autostart=1
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') {
        setInGame(true);
      }
    }
  }, []);

  // Offline earnings calculation on boot
  useEffect(() => {
    const offline = calculateOfflineEarnings(state, Date.now());
    if (offline.offlineSeconds >= 30 && offline.offlineCashEarned > 0) {
      setOfflineData({
        seconds: offline.offlineSeconds,
        cash: offline.offlineCashEarned,
        message: offline.summaryMessage,
      });
    }
  }, []);

  // Sync sounds state with GameState
  useEffect(() => {
    sounds.soundEnabled = state.soundEnabled;
    sounds.musicEnabled = state.musicEnabled;
  }, [state.soundEnabled, state.musicEnabled]);

  // Set document.body dataset state for ultra mode testing
  useEffect(() => {
    document.body.dataset.state = inGame ? 'playing' : 'title';
  }, [inGame]);

  // Game Loop Ticking (10 ticks per second = 100ms)
  useEffect(() => {
    if (!inGame) return;

    let lastTick = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const dt = Math.min((now - lastTick) / 1000, 0.5);
      lastTick = now;

      setState((prev) => {
        const { newState, salesRevenueThisTick } = tickSimulation(prev, dt, now);

        if (salesRevenueThisTick > 0) {
          recentEarningsRef.current.push(salesRevenueThisTick);
          if (recentEarningsRef.current.length > 20) {
            recentEarningsRef.current.shift();
          }
          const sum = recentEarningsRef.current.reduce((a, b) => a + b, 0);
          setProfitPerSec(Math.round(sum / 2));
        }

        return newState;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [inGame]);

  // Auto-save every 10 seconds
  useEffect(() => {
    const saveInterval = setInterval(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {}
    }, 10000);

    return () => clearInterval(saveInterval);
  }, [state]);

  const handleManualSave = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      sounds.playCoin();
    } catch {}
  }, [state]);

  const handleResetGame = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState(INITIAL_GAME_STATE);
  }, []);

  // Station Actions
  const handleHarvestStation = useCallback((stationId: string) => {
    setState((prev) => {
      const st = prev.growStations.find((s) => s.id === stationId);
      if (!st || st.progress < 1.0) return prev;

      const strain = STRAINS[st.strainId];
      const yieldGrams = strain.baseYieldGrams;
      const currentStorage = calculateCurrentStorageWeight(prev.inventory);
      const maxStorage = calculateMaxStorage(prev.upgrades);

      if (currentStorage + yieldGrams > maxStorage) {
        return prev;
      }

      const nextStations = prev.growStations.map((s) =>
        s.id === stationId ? { ...s, progress: 0, isGrowing: false } : s
      );

      return {
        ...prev,
        growStations: nextStations,
        totalHarvestsGrams: prev.totalHarvestsGrams + yieldGrams,
        inventory: {
          ...prev.inventory,
          raw: {
            ...prev.inventory.raw,
            [st.strainId]: (prev.inventory.raw[st.strainId] || 0) + yieldGrams,
          },
        },
      };
    });
  }, []);

  const handlePlantStation = useCallback((stationId: string) => {
    setState((prev) => {
      const st = prev.growStations.find((s) => s.id === stationId);
      if (!st || st.isGrowing) return prev;

      const strain = STRAINS[st.strainId];
      if (prev.cash < strain.seedCost) return prev;

      const nextStations = prev.growStations.map((s) =>
        s.id === stationId ? { ...s, progress: 0.05, isGrowing: true } : s
      );

      return {
        ...prev,
        cash: prev.cash - strain.seedCost,
        growStations: nextStations,
      };
    });
  }, []);

  const handleUnlockStation = useCallback((stationId: string) => {
    setState((prev) => {
      const st = prev.growStations.find((s) => s.id === stationId);
      if (!st || st.unlocked || prev.cash < st.unlockCost) return prev;

      const nextStations = prev.growStations.map((s) =>
        s.id === stationId ? { ...s, unlocked: true, isGrowing: false, progress: 0 } : s
      );

      return {
        ...prev,
        cash: prev.cash - st.unlockCost,
        growStations: nextStations,
      };
    });
  }, []);

  const handleChangeStationStrain = useCallback((stationId: string, strainId: StrainId) => {
    setState((prev) => {
      const nextStations = prev.growStations.map((s) =>
        s.id === stationId ? { ...s, strainId, progress: 0, isGrowing: false } : s
      );
      return { ...prev, growStations: nextStations };
    });
  }, []);

  // Processing & Packaging actions
  const handleManualProcess = useCallback((machineId: string) => {
    setState((prev) => {
      const totalRaw = Object.values(prev.inventory.raw).reduce((a, b) => a + b, 0);
      if (totalRaw < 10) return prev;

      const nextMachines = prev.processingMachines.map((m) =>
        m.id === machineId ? { ...m, isProcessing: true } : m
      );
      return { ...prev, processingMachines: nextMachines };
    });
  }, []);

  const handleManualPackage = useCallback((lineId: string) => {
    setState((prev) => {
      const line = prev.packagingLines.find((l) => l.id === lineId);
      if (!line) return prev;

      const totalProc = Object.values(prev.inventory.processed).reduce((a, b) => a + b, 0);
      if (totalProc < line.packSize) return prev;

      const nextLines = prev.packagingLines.map((l) =>
        l.id === lineId ? { ...l, isPackaging: true } : l
      );
      return { ...prev, packagingLines: nextLines };
    });
  }, []);

  const handleUnlockMachine = useCallback((machineId: string) => {
    setState((prev) => {
      const m = prev.processingMachines.find((x) => x.id === machineId);
      if (!m || m.unlocked || prev.cash < m.unlockCost) return prev;

      return {
        ...prev,
        cash: prev.cash - m.unlockCost,
        processingMachines: prev.processingMachines.map((x) =>
          x.id === machineId ? { ...x, unlocked: true } : x
        ),
      };
    });
  }, []);

  const handleUnlockPackaging = useCallback((lineId: string) => {
    setState((prev) => {
      const l = prev.packagingLines.find((x) => x.id === lineId);
      if (!l || l.unlocked || prev.cash < l.unlockCost) return prev;

      return {
        ...prev,
        cash: prev.cash - l.unlockCost,
        packagingLines: prev.packagingLines.map((x) =>
          x.id === lineId ? { ...x, unlocked: true } : x
        ),
      };
    });
  }, []);

  // Sales Actions
  const handleUnlockStrain = useCallback((strainId: StrainId) => {
    setState((prev) => {
      const strain = STRAINS[strainId];
      if (prev.unlockedStrains.includes(strainId) || prev.cash < strain.unlockCost) {
        return prev;
      }
      return {
        ...prev,
        cash: prev.cash - strain.unlockCost,
        unlockedStrains: [...prev.unlockedStrains, strainId],
      };
    });
  }, []);

  const handleManualRetailSale = useCallback((strainId: StrainId) => {
    setState((prev) => {
      if ((prev.inventory.packaged[strainId] || 0) <= 0) return prev;

      const price = calculateSellPrice(
        strainId,
        prev.upgrades,
        prev.marketTrend,
        prev.greenTokens,
        prev.hiredManagers
      );

      return {
        ...prev,
        cash: prev.cash + price,
        lifetimeEarnings: prev.lifetimeEarnings + price,
        totalSalesCount: prev.totalSalesCount + 1,
        customersServed: prev.customersServed + 1,
        inventory: {
          ...prev.inventory,
          packaged: {
            ...prev.inventory.packaged,
            [strainId]: prev.inventory.packaged[strainId] - 1,
          },
        },
      };
    });
  }, []);

  const handleFulfillWholesale = useCallback((order: WholesaleOrder) => {
    setState((prev) => {
      const available = prev.inventory.raw[order.strainId] || 0;
      if (available < order.requiredGrams) return prev;

      return {
        ...prev,
        cash: prev.cash + order.cashReward,
        lifetimeEarnings: prev.lifetimeEarnings + order.cashReward,
        inventory: {
          ...prev.inventory,
          raw: {
            ...prev.inventory.raw,
            [order.strainId]: available - order.requiredGrams,
          },
        },
        wholesaleOrders: prev.wholesaleOrders.filter((o) => o.id !== order.id),
      };
    });
  }, []);

  // Upgrades & Staff
  const handleBuyUpgrade = useCallback((upgradeId: string) => {
    setState((prev) => {
      const curLvl = prev.upgrades[upgradeId] || 0;
      const cost = getUpgradeCost(upgradeId, curLvl);
      if (prev.cash < cost) return prev;

      return {
        ...prev,
        cash: prev.cash - cost,
        upgrades: {
          ...prev.upgrades,
          [upgradeId]: curLvl + 1,
        },
      };
    });
  }, []);

  const handleHireManager = useCallback((managerId: string) => {
    setState((prev) => {
      const mgr = prev.hiredManagers[managerId];
      if (mgr) return prev;
      const def = INITIAL_GAME_STATE; // Checked from managers list
      const mgrDef = [
        { id: 'mgr_botanist_gary', cost: 450 },
        { id: 'mgr_trimmer_tina', cost: 1200 },
        { id: 'mgr_chemist_chloe', cost: 3500 },
        { id: 'mgr_packer_pete', cost: 8000 },
        { id: 'mgr_budtender_ben', cost: 18000 },
        { id: 'mgr_exec_victoria', cost: 75000 },
      ].find((m) => m.id === managerId);

      if (!mgrDef || prev.cash < mgrDef.cost) return prev;

      return {
        ...prev,
        cash: prev.cash - mgrDef.cost,
        hiredManagers: {
          ...prev.hiredManagers,
          [managerId]: true,
        },
      };
    });
  }, []);

  // Empire & Prestige
  const handlePrestige = useCallback(() => {
    setState((prev) => applyPrestige(prev));
  }, []);

  const handleClaimDailyReward = useCallback(() => {
    setState((prev) => {
      const bonus = Math.max(1000, Math.round(prev.factoryLevel * 1500));
      return {
        ...prev,
        cash: prev.cash + bonus,
        lifetimeEarnings: prev.lifetimeEarnings + bonus,
        dailyRewardLastClaimed: Date.now(),
      };
    });
  }, []);

  // Tap Frenzy Boost
  const handleTapFrenzy = useCallback(() => {
    setState((prev) => {
      const tapBonus = Math.max(5, Math.round(prev.factoryLevel * 5 * (1 + prev.greenTokens * 0.1)));
      return {
        ...prev,
        cash: prev.cash + tapBonus,
        lifetimeEarnings: prev.lifetimeEarnings + tapBonus,
        // Extend frenzy by 3 seconds up to 20s
        frenzyUntil: Math.min(Date.now() + 20000, Math.max(Date.now(), prev.frenzyUntil) + 3000),
      };
    });
  }, []);

  const toggleSound = useCallback(() => {
    setState((prev) => {
      const next = !prev.soundEnabled;
      sounds.soundEnabled = next;
      return { ...prev, soundEnabled: next };
    });
  }, []);

  const toggleMusic = useCallback(() => {
    setState((prev) => {
      const next = !prev.musicEnabled;
      sounds.toggleMusic(next);
      return { ...prev, musicEnabled: next };
    });
  }, []);

  const toggleViewMode = useCallback(() => {
    setState((prev) => ({
      ...prev,
      viewMode: prev.viewMode === 'iphone' ? 'fullscreen' : 'iphone',
    }));
  }, []);

  // Render Title Screen if not entered
  if (!inGame) {
    return (
      <TitleScreen
        onStartGame={() => setInGame(true)}
        hasExistingSave={state.lifetimeEarnings > 1000}
        soundEnabled={state.soundEnabled}
        onToggleSound={toggleSound}
        onResetGame={handleResetGame}
      />
    );
  }

  const isFrenzyActive = Date.now() < state.frenzyUntil;
  const frenzySecondsLeft = Math.max(0, Math.ceil((state.frenzyUntil - Date.now()) / 1000));

  return (
    <div className="game-viewport w-full bg-[#050806] flex items-center justify-center overflow-hidden">
      {/* Container wrapper: Native edge-to-edge on mobile, simulated iPhone 13 frame on desktop if viewMode is iphone */}
      <div
        className={`relative flex flex-col h-full w-full bg-[#0a0f0d] text-zinc-100 overflow-hidden shadow-2xl transition-all duration-300 ${
          state.viewMode === 'iphone'
            ? 'sm:max-w-[420px] sm:max-h-[860px] sm:rounded-[48px] sm:border-[10px] sm:border-[#18241d] sm:ring-1 sm:ring-emerald-500/20'
            : 'max-w-4xl'
        }`}
      >
        {/* Dynamic Island / Notch Simulation (Strictly visible only in desktop simulated mode) */}
        {state.viewMode === 'iphone' && (
          <div className="hidden sm:flex absolute top-3 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-40 items-center justify-center pointer-events-none">
            <div className="w-2.5 h-2.5 rounded-full bg-[#111] border border-[#222] mr-3" />
            <div className="w-2 h-2 rounded-full bg-[#092211] border border-emerald-950" />
          </div>
        )}

        {/* 1. TOP CASH & METRIC HUD (Compact & High Contrast) */}
        <header className="pt-safe px-4 py-2.5 bg-[#0e1612]/95 border-b border-[#1b2b20] z-30 flex items-center justify-between shrink-0">
          {/* Cash Balance Display */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-sm">
              $
            </div>
            <div>
              <div className="font-mono-numbers font-black text-white text-base tracking-tight leading-none">
                ${state.cash.toLocaleString()}
              </div>
              <div className="text-[10px] font-mono-numbers text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                <span>+${profitPerSec}/s</span>
                {isFrenzyActive && (
                  <span className="text-amber-400 font-bold">
                    ⚡ 2x FRENZY ({frenzySecondsLeft}s)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Header Status Pips */}
          <div className="flex items-center gap-2">
            <div className="px-2 py-1 rounded-lg bg-black/50 border border-emerald-900/40 text-[11px] font-mono-numbers font-semibold text-emerald-300 flex items-center gap-1">
              <span>💎</span>
              <span>{state.greenTokens}</span>
            </div>

            <div className="px-2 py-1 rounded-lg bg-[#142319] border border-emerald-800/40 text-[10px] font-bold text-emerald-400 uppercase">
              Lvl {state.factoryLevel}
            </div>

            <button
              onClick={toggleSound}
              className="p-1.5 rounded-lg bg-black/40 text-zinc-400 hover:text-white"
              aria-label="Toggle Sound"
            >
              {state.soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* 2. MAIN ACTIVE VIEWPORT CONTENT */}
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain no-scrollbar relative flex flex-col">
          {currentTab === 'factory' && (
            <div className="flex-none flex flex-col w-full h-auto min-h-0 relative">
              {/* Quick Frenzy Tap Bar */}
              <div className="px-4 py-2 bg-[#0c130f] border-b border-[#1b2b20] flex items-center justify-between z-10 shrink-0">
                <span className="text-[11px] text-zinc-400 truncate mr-2">
                  Tap stations to grow/harvest, or tap for cash!
                </span>
                <button
                  onClick={handleTapFrenzy}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-transform cursor-pointer shrink-0"
                >
                  <Zap className="w-3.5 h-3.5 fill-black" />
                  Tap Boost!
                </button>
              </div>

              {/* Live Canvas Viewport */}
              <div className="w-full h-auto min-h-0 flex-none overflow-visible">
                <FactoryCanvas
                  state={state}
                  onHarvestStation={handleHarvestStation}
                  onPlantStation={handlePlantStation}
                  onTapFrenzy={handleTapFrenzy}
                />
              </div>
            </div>
          )}

          {currentTab === 'production' && (
            <ProductionTab
              state={state}
              onPlant={handlePlantStation}
              onHarvest={handleHarvestStation}
              onUnlockStation={handleUnlockStation}
              onChangeStationStrain={handleChangeStationStrain}
              onManualProcess={handleManualProcess}
              onManualPackage={handleManualPackage}
              onUnlockMachine={handleUnlockMachine}
              onUnlockPackaging={handleUnlockPackaging}
            />
          )}

          {currentTab === 'sales' && (
            <SalesTab
              state={state}
              onUnlockStrain={handleUnlockStrain}
              onManualRetailSale={handleManualRetailSale}
              onFulfillWholesale={handleFulfillWholesale}
            />
          )}

          {currentTab === 'upgrades' && (
            <UpgradesTab
              state={state}
              onBuyUpgrade={handleBuyUpgrade}
              onHireManager={handleHireManager}
            />
          )}

          {currentTab === 'empire' && (
            <EmpireTab
              state={state}
              onPrestige={handlePrestige}
              onClaimDailyReward={handleClaimDailyReward}
              onToggleSound={toggleSound}
              onToggleMusic={toggleMusic}
              onToggleViewMode={toggleViewMode}
              onManualSave={handleManualSave}
              onResetGame={handleResetGame}
            />
          )}
        </main>

        {/* 3. BOTTOM THUMB-ZONE NAVIGATION BAR */}
        <nav className="bottom-navigation relative bg-[#0b120e]/95 backdrop-blur-md border-t border-[#1b2b20] grid grid-cols-5 shrink-0 z-30">
          <button
            onClick={() => {
              sounds.playTap();
              setCurrentTab('factory');
            }}
            className={`min-h-16 touch-manipulation flex flex-col items-center justify-center transition-colors ${
              currentTab === 'factory' ? 'text-emerald-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Factory className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Factory</span>
          </button>

          <button
            onClick={() => {
              sounds.playTap();
              setCurrentTab('production');
            }}
            className={`min-h-16 touch-manipulation flex flex-col items-center justify-center transition-colors ${
              currentTab === 'production' ? 'text-emerald-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Sprout className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Production</span>
          </button>

          <button
            onClick={() => {
              sounds.playTap();
              setCurrentTab('sales');
            }}
            className={`min-h-16 touch-manipulation flex flex-col items-center justify-center transition-colors ${
              currentTab === 'sales' ? 'text-emerald-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <ShoppingBag className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Sales</span>
          </button>

          <button
            onClick={() => {
              sounds.playTap();
              setCurrentTab('upgrades');
            }}
            className={`min-h-16 touch-manipulation flex flex-col items-center justify-center transition-colors ${
              currentTab === 'upgrades' ? 'text-emerald-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Wrench className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Upgrades</span>
          </button>

          <button
            onClick={() => {
              sounds.playTap();
              setCurrentTab('empire');
            }}
            className={`min-h-16 touch-manipulation flex flex-col items-center justify-center transition-colors ${
              currentTab === 'empire' ? 'text-emerald-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Crown className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Empire</span>
          </button>
        </nav>

        {/* Offline Earnings Popup Modal */}
        {offlineData && (
          <OfflineModal
            secondsAway={offlineData.seconds}
            cashEarned={offlineData.cash}
            message={offlineData.message}
            onClaim={() => {
              setState((prev) => ({
                ...prev,
                cash: prev.cash + offlineData.cash,
                lifetimeEarnings: prev.lifetimeEarnings + offlineData.cash,
              }));
              setOfflineData(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
