import type {
  GameState,
  StrainId,
  WholesaleOrder,
  MarketTrend,
  Inventory,
} from '../types/game.ts';
import {
  STRAINS,
  MANAGERS,
  UPGRADE_CATALOG,
  INITIAL_GAME_STATE,
} from './constants.ts';

/**
 * Calculates current maximum storage capacity in grams based on upgrades.
 */
export function calculateMaxStorage(upgrades: Record<string, number>): number {
  const baseCapacity = 500;
  const vaultLevel = upgrades['upg_curing_jars'] || 0;
  return baseCapacity + vaultLevel * 400;
}

/**
 * Total grams currently occupying storage (raw + processed + packaged * 5g).
 */
export function calculateCurrentStorageWeight(inventory: Inventory): number {
  let total = 0;
  for (const s of Object.keys(inventory.raw) as StrainId[]) {
    total += (inventory.raw[s] || 0);
    total += (inventory.processed[s] || 0);
    total += (inventory.packaged[s] || 0) * 5; // Each retail package is 5g
  }
  return total;
}

/**
 * Calculates the grow duration for a given strain considering upgrades and frenzy.
 */
export function calculateGrowDuration(
  strainId: StrainId,
  upgrades: Record<string, number>,
  hiredManagers: Record<string, boolean>,
  isFrenzy: boolean,
  greenTokens: number
): number {
  const baseDuration = STRAINS[strainId].growDurationSec;
  const ledLevel = upgrades['upg_led_lights'] || 0;
  let speedMultiplier = 1 + ledLevel * 0.12;

  if (hiredManagers['mgr_botanist_gary']) {
    speedMultiplier += 0.20;
  }
  // Prestige bonus: 2% speed per token
  speedMultiplier += greenTokens * 0.02;

  if (isFrenzy) {
    speedMultiplier *= 2.0;
  }

  return Math.max(0.8, baseDuration / speedMultiplier);
}

/**
 * Calculates harvest yield in grams for a given strain.
 */
export function calculateYield(
  strainId: StrainId,
  upgrades: Record<string, number>,
  hiredManagers: Record<string, boolean>
): number {
  const baseYield = STRAINS[strainId].baseYieldGrams;
  const hydroLevel = upgrades['upg_hydroponics'] || 0;
  let yieldMultiplier = 1 + hydroLevel * 0.15;

  if (hiredManagers['mgr_trimmer_tina']) {
    yieldMultiplier += 0.25;
  }

  return Math.round(baseYield * yieldMultiplier);
}

/**
 * Calculates sell price per unit (jar / 5g package) for a given strain.
 */
export function calculateSellPrice(
  strainId: StrainId,
  upgrades: Record<string, number>,
  marketTrend: MarketTrend | null,
  greenTokens: number,
  hiredManagers: Record<string, boolean>
): number {
  const strain = STRAINS[strainId];
  const gramsPerPack = 5;
  const basePackValue = strain.basePricePerGram * gramsPerPack;

  const co2Level = upgrades['upg_co2_enrichment'] || 0;
  const marketingLevel = upgrades['upg_marketing'] || 0;

  let multiplier = 1 + (co2Level * 0.10) + (marketingLevel * 0.18);

  // Prestige token bonus: +5% revenue per green token
  multiplier += greenTokens * 0.05;

  if (hiredManagers['mgr_budtender_ben']) {
    multiplier += 0.25;
  }

  if (marketTrend && marketTrend.strainId === strainId) {
    multiplier *= marketTrend.priceMultiplier;
  }

  return Math.round(basePackValue * multiplier);
}

/**
 * Calculates upgrade cost for next level.
 */
export function getUpgradeCost(upgradeId: string, currentLevel: number): number {
  const def = UPGRADE_CATALOG.find((u) => u.id === upgradeId);
  if (!def) return Infinity;
  return Math.round(def.baseCost * Math.pow(def.costMultiplier, currentLevel));
}

/**
 * Generate random wholesale orders.
 */
export function generateWholesaleOrder(
  unlockedStrains: StrainId[],
  upgrades: Record<string, number>,
  hasVictoria: boolean
): WholesaleOrder {
  const strainId = unlockedStrains[Math.floor(Math.random() * unlockedStrains.length)];
  const strain = STRAINS[strainId];
  const requiredGrams = Math.round((strain.baseYieldGrams * (1.5 + Math.random() * 2)) / 5) * 5;
  const baseCash = requiredGrams * strain.basePricePerGram;
  const bonus = 1.35 + (hasVictoria ? 0.5 : 0) + (upgrades['upg_marketing'] || 0) * 0.05;
  const cashReward = Math.round(baseCash * bonus);

  const clientCompanies = [
    { name: 'AeroCure Therapeutics', logo: '🌿' },
    { name: 'Highlands Dispensary Co.', logo: '🏔️' },
    { name: 'Emerald Valley BioPharm', logo: '⚗️' },
    { name: 'Golden Gate Wellness Club', logo: '🌉' },
    { name: 'Apex Botanical Syndicate', logo: '💎' },
  ];
  const client = clientCompanies[Math.floor(Math.random() * clientCompanies.length)];

  return {
    id: `ws_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    clientName: client.name,
    companyLogo: client.logo,
    strainId,
    requiredGrams,
    cashReward,
    bonusMultiplier: Math.round(bonus * 100) / 100,
    expirySeconds: 120,
    expiresAt: Date.now() + 120000,
  };
}

/**
 * Generate random market trends.
 */
export function generateMarketTrend(unlockedStrains: StrainId[]): MarketTrend {
  const strainId = unlockedStrains[Math.floor(Math.random() * unlockedStrains.length)];
  const strain = STRAINS[strainId];
  const trends = [
    { title: 'Connoisseur Expo Buzz', mult: 1.5, desc: 'High demand from culinary influencers!' },
    { title: 'Cannabis Cup Champion', mult: 1.8, desc: 'Award-winning praise drives premium prices!' },
    { title: 'Statewide Festival Weekend', mult: 1.4, desc: 'Tourist rushes spike consumption!' },
    { title: 'Celebrity Endorsement', mult: 1.65, desc: 'Viral social media praise causes a run on stock!' },
  ];
  const pick = trends[Math.floor(Math.random() * trends.length)];
  const duration = 60; // 60 seconds

  return {
    id: `trend_${Date.now()}`,
    title: `${strain.name}: ${pick.title}`,
    strainId,
    priceMultiplier: pick.mult,
    description: pick.desc,
    durationSeconds: duration,
    endsAt: Date.now() + duration * 1000,
  };
}

/**
 * Main simulation tick step.
 * dt is in seconds.
 */
export function tickSimulation(
  state: GameState,
  dt: number,
  now: number = Date.now()
): {
  newState: GameState;
  salesRevenueThisTick: number;
  customersServedThisTick: number;
} {
  // Clone state cleanly
  const next: GameState = {
    ...state,
    inventory: {
      raw: { ...state.inventory.raw },
      processed: { ...state.inventory.processed },
      packaged: { ...state.inventory.packaged },
      maxCapacity: calculateMaxStorage(state.upgrades),
    },
    growStations: state.growStations.map((s) => ({ ...s })),
    processingMachines: state.processingMachines.map((m) => ({ ...m })),
    packagingLines: state.packagingLines.map((p) => ({ ...p })),
    wholesaleOrders: [...state.wholesaleOrders],
  };

  const isFrenzy = now < next.frenzyUntil;
  const hasGary = !!next.hiredManagers['mgr_botanist_gary'];
  const hasTina = !!next.hiredManagers['mgr_trimmer_tina'];
  const hasChloe = !!next.hiredManagers['mgr_chemist_chloe'];
  const hasPete = !!next.hiredManagers['mgr_packer_pete'];
  const hasBen = !!next.hiredManagers['mgr_budtender_ben'];
  const hasVictoria = !!next.hiredManagers['mgr_exec_victoria'];

  let salesRevenueThisTick = 0;
  let customersServedThisTick = 0;

  // 1. GROW STATIONS
  for (const station of next.growStations) {
    if (!station.unlocked) continue;

    if (station.isGrowing) {
      const duration = calculateGrowDuration(
        station.strainId,
        next.upgrades,
        next.hiredManagers,
        isFrenzy,
        next.greenTokens
      );
      station.progress += dt / duration;

      if (station.progress >= 1.0) {
        station.progress = 1.0;
        // If manager Tina is hired, auto-harvest. Or if Gary is hired, auto replant!
        if (hasTina || hasGary) {
          const yieldGrams = calculateYield(station.strainId, next.upgrades, next.hiredManagers);
          const currentWeight = calculateCurrentStorageWeight(next.inventory);
          if (currentWeight + yieldGrams <= next.inventory.maxCapacity) {
            next.inventory.raw[station.strainId] = (next.inventory.raw[station.strainId] || 0) + yieldGrams;
            next.totalHarvestsGrams += yieldGrams;
            station.progress = 0;
            station.isGrowing = true; // Auto replant
          } else {
            // Storage full: pause at 1.0
            station.isGrowing = false;
          }
        } else {
          // Awaiting manual harvest tap
          station.isGrowing = false;
        }
      }
    } else if (hasGary && station.progress === 0) {
      // Auto plant if idle
      const seedCost = STRAINS[station.strainId].seedCost;
      if (next.cash >= seedCost) {
        next.cash -= seedCost;
        station.isGrowing = true;
      }
    }
  }

  // 2. PROCESSING MACHINES (Raw -> Processed)
  // Trims & cures raw flower into premium smokable/extractable flower
  for (const machine of next.processingMachines) {
    if (!machine.unlocked) continue;

    // Check if machine is idle and has raw stock of any unlocked strain
    if (!machine.isProcessing && hasChloe) {
      for (const strainId of next.unlockedStrains) {
        if ((next.inventory.raw[strainId] || 0) >= 10) {
          machine.isProcessing = true;
          break;
        }
      }
    }

    if (machine.isProcessing) {
      const trimmersLevel = next.upgrades['upg_trimmers'] || 0;
      const speedMult = 1 + trimmersLevel * 0.20 + (hasChloe ? 0.35 : 0);
      const cycleDuration = Math.max(1.0, 4.0 / speedMult);

      machine.progress += dt / cycleDuration;
      if (machine.progress >= 1.0) {
        machine.progress = 0;
        // Process 10g batch of highest tier available raw strain
        const reversedStrains = [...next.unlockedStrains].reverse();
        for (const strainId of reversedStrains) {
          if ((next.inventory.raw[strainId] || 0) >= 10) {
            next.inventory.raw[strainId] -= 10;
            next.inventory.processed[strainId] = (next.inventory.processed[strainId] || 0) + 10;
            break;
          }
        }
        if (!hasChloe) {
          machine.isProcessing = false;
        }
      }
    }
  }

  // 3. PACKAGING LINES (Processed -> Retail Jars)
  for (const line of next.packagingLines) {
    if (!line.unlocked) continue;

    if (!line.isPackaging && hasPete) {
      for (const strainId of next.unlockedStrains) {
        if ((next.inventory.processed[strainId] || 0) >= line.packSize) {
          line.isPackaging = true;
          break;
        }
      }
    }

    if (line.isPackaging) {
      const speedMult = 1 + (hasPete ? 0.40 : 0) + (isFrenzy ? 0.5 : 0);
      const cycleDuration = Math.max(1.0, 3.5 / speedMult);

      line.progress += dt / cycleDuration;
      if (line.progress >= 1.0) {
        line.progress = 0;
        const reversedStrains = [...next.unlockedStrains].reverse();
        for (const strainId of reversedStrains) {
          if ((next.inventory.processed[strainId] || 0) >= line.packSize) {
            next.inventory.processed[strainId] -= line.packSize;
            next.inventory.packaged[strainId] = (next.inventory.packaged[strainId] || 0) + 1;
            break;
          }
        }
        if (!hasPete) {
          line.isPackaging = false;
        }
      }
    }
  }

  // 4. SALES / CASH REGISTER
  // Retail sales: customers purchase packaged stock
  const storeDisplayLevel = next.upgrades['upg_store_display'] || 0;
  const customerRatePerSec = (0.35 + storeDisplayLevel * 0.08 + (hasBen ? 0.4 : 0)) * (isFrenzy ? 1.5 : 1.0);
  const potentialCustomers = dt * customerRatePerSec;

  // Discrete roll or fractional customer handling
  if (Math.random() < potentialCustomers || potentialCustomers >= 1) {
    const customersCount = Math.max(1, Math.floor(potentialCustomers + Math.random()));
    for (let c = 0; c < customersCount; c++) {
      // Find a packaged product to sell
      const availableStrains = next.unlockedStrains.filter(
        (s) => (next.inventory.packaged[s] || 0) > 0
      );

      if (availableStrains.length > 0) {
        // Weighted towards higher tier or active strain
        const chosenStrain = availableStrains[Math.floor(Math.random() * availableStrains.length)];
        next.inventory.packaged[chosenStrain] -= 1;

        const saleValue = calculateSellPrice(
          chosenStrain,
          next.upgrades,
          next.marketTrend,
          next.greenTokens,
          next.hiredManagers
        );

        next.cash += saleValue;
        next.lifetimeEarnings += saleValue;
        next.totalSalesCount += 1;
        next.customersServed += 1;
        salesRevenueThisTick += saleValue;
        customersServedThisTick += 1;
      }
    }
  }

  // 5. MARKET TREND EXPIRY & ROTATION
  if (next.marketTrend) {
    if (now >= next.marketTrend.endsAt) {
      next.marketTrend = null;
    }
  } else if (Math.random() < 0.05 * dt) {
    // 5% chance per second when no active trend
    next.marketTrend = generateMarketTrend(next.unlockedStrains);
  }

  // 6. WHOLESALE CONTRACTS TIMER & MAINTENANCE
  next.wholesaleOrders = next.wholesaleOrders.filter((o) => now < o.expiresAt);
  if (next.wholesaleOrders.length < 3 && Math.random() < 0.1 * dt) {
    next.wholesaleOrders.push(
      generateWholesaleOrder(next.unlockedStrains, next.upgrades, hasVictoria)
    );
  }

  // 7. FACTORY LEVEL
  // Level up based on lifetime earnings
  const calculatedLevel = Math.max(
    1,
    Math.floor(1 + Math.log10(Math.max(1000, next.lifetimeEarnings) / 1000) * 2)
  );
  next.factoryLevel = calculatedLevel;

  next.lastSavedAt = now;

  return {
    newState: next,
    salesRevenueThisTick,
    customersServedThisTick,
  };
}

/**
 * Calculates offline earnings when returning to the game.
 * Respects storage limits, automation bottlenecks, and offline multipliers.
 */
export function calculateOfflineEarnings(
  state: GameState,
  now: number = Date.now()
): {
  offlineSeconds: number;
  offlineCashEarned: number;
  summaryMessage: string;
} {
  const lastSaved = state.lastSavedAt || now;
  const elapsedSeconds = Math.max(0, (now - lastSaved) / 1000);

  // Less than 10 seconds away is not considered an offline session
  if (elapsedSeconds < 10) {
    return {
      offlineSeconds: 0,
      offlineCashEarned: 0,
      summaryMessage: '',
    };
  }

  // Cap offline time at 8 hours (28,800s)
  const cappedSeconds = Math.min(28800, elapsedSeconds);

  // Check if player has automation (Gary/Tina or Ben)
  const hasGrowAuto = !!state.hiredManagers['mgr_botanist_gary'];
  const hasSalesAuto = !!state.hiredManagers['mgr_budtender_ben'];

  // Base offline efficiency is 50%, increased by Cryo storage upgrade up to 100%
  const cryoLevel = state.upgrades['upg_cold_storage'] || 0;
  const offlineEfficiency = Math.min(1.0, 0.40 + cryoLevel * 0.20);

  let offlineCashEarned = 0;

  if (hasSalesAuto) {
    // Estimate sales rate per second based on active strains and price
    let avgSalePerSec = 0;
    for (const strainId of state.unlockedStrains) {
      const price = calculateSellPrice(
        strainId,
        state.upgrades,
        null,
        state.greenTokens,
        state.hiredManagers
      );
      // Rough baseline rate
      avgSalePerSec += (price / STRAINS[strainId].growDurationSec) * 0.4;
    }
    avgSalePerSec = Math.max(2, avgSalePerSec);

    offlineCashEarned = Math.round(avgSalePerSec * cappedSeconds * offlineEfficiency);
  } else if (hasGrowAuto) {
    // Some cash from auto-farming sold at bulk discount
    const starterPrice = STRAINS['green_buds'].basePricePerGram * 5;
    offlineCashEarned = Math.round((starterPrice / 5) * cappedSeconds * 0.2 * offlineEfficiency);
  } else {
    // Minimal idle interest/tip jar
    offlineCashEarned = Math.round(cappedSeconds * 0.5 * offlineEfficiency);
  }

  const hours = (cappedSeconds / 3600).toFixed(1);
  const summaryMessage = `Welcome back, Boss! Your team operated while you were away for ${hours} hrs (${Math.floor(
    cappedSeconds / 60
  )} min).`;

  return {
    offlineSeconds: Math.floor(cappedSeconds),
    offlineCashEarned,
    summaryMessage,
  };
}

/**
 * Calculates prestige tokens that would be granted upon Empire Rebirth.
 */
export function calculatePrestigeTokens(lifetimeEarnings: number): number {
  if (lifetimeEarnings < 50000) return 0;
  // Cube-root scale based on lifetime earnings
  return Math.max(1, Math.floor(Math.cbrt(lifetimeEarnings / 50000) * 3));
}

/**
 * Executes an Empire Rebirth (Prestige), granting permanent Green Tokens.
 */
export function applyPrestige(state: GameState): GameState {
  const earnedTokens = calculatePrestigeTokens(state.lifetimeEarnings);
  if (earnedTokens <= 0) return state;

  return {
    ...INITIAL_GAME_STATE,
    greenTokens: state.greenTokens + earnedTokens,
    totalPrestiges: state.totalPrestiges + 1,
    soundEnabled: state.soundEnabled,
    musicEnabled: state.musicEnabled,
    viewMode: state.viewMode,
    lastSavedAt: Date.now(),
  };
}
