import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateMaxStorage,
  calculateCurrentStorageWeight,
  calculateGrowDuration,
  calculateYield,
  calculateSellPrice,
  calculatePrestigeTokens,
  calculateOfflineEarnings,
  tickSimulation,
  applyPrestige,
} from './engine.ts';
import { INITIAL_GAME_STATE } from './constants.ts';

test('calculateMaxStorage increases with storage upgrades', () => {
  assert.equal(calculateMaxStorage({}), 500);
  assert.equal(calculateMaxStorage({ upg_curing_jars: 2 }), 1000);
  assert.equal(calculateMaxStorage({ upg_curing_jars: 4 }), 1500);
});

test('calculateCurrentStorageWeight sums raw, processed, and packaged goods', () => {
  const inventory = {
    raw: {
      green_buds: 50,
      premium_kush: 0,
      purple_haze: 0,
      golden_leaf: 0,
      royal_og: 0,
      legendary_emerald: 0,
    },
    processed: {
      green_buds: 20,
      premium_kush: 10,
      purple_haze: 0,
      golden_leaf: 0,
      royal_og: 0,
      legendary_emerald: 0,
    },
    packaged: {
      green_buds: 4, // 4 * 5g = 20g
      premium_kush: 0,
      purple_haze: 0,
      golden_leaf: 0,
      royal_og: 0,
      legendary_emerald: 0,
    },
    maxCapacity: 500,
  };
  // 50 + 20 + 10 + 20 = 100
  assert.equal(calculateCurrentStorageWeight(inventory), 100);
});

test('calculateGrowDuration reduces with LED upgrades, Gary, and Frenzy', () => {
  const base = calculateGrowDuration('green_buds', {}, {}, false, 0);
  const withLed = calculateGrowDuration('green_buds', { upg_led_lights: 2 }, {}, false, 0);
  assert.ok(withLed < base, 'LED upgrade should speed up growth');

  const withGary = calculateGrowDuration('green_buds', {}, { mgr_botanist_gary: true }, false, 0);
  assert.ok(withGary < base, 'Gary should speed up growth');

  const withFrenzy = calculateGrowDuration('green_buds', {}, {}, true, 0);
  assert.ok(withFrenzy < base, 'Frenzy should significantly reduce duration');
});

test('calculateYield scales with hydroponics and Tina', () => {
  const base = calculateYield('green_buds', {}, {});
  const boosted = calculateYield('green_buds', { upg_hydroponics: 2 }, { mgr_trimmer_tina: true });
  assert.ok(boosted > base, 'Yield should increase with upgrades and staff');
});

test('calculateSellPrice scales with CO2, marketing, and green prestige tokens', () => {
  const basePrice = calculateSellPrice('green_buds', {}, null, 0, {});
  const upgradedPrice = calculateSellPrice('green_buds', { upg_co2_enrichment: 3, upg_marketing: 2 }, null, 5, { mgr_budtender_ben: true });
  assert.ok(upgradedPrice > basePrice, 'Sell price must increase with upgrades, tokens, and budtender');
});

test('tickSimulation advances plant progress and generates sales when packaged units exist', () => {
  const state = { ...INITIAL_GAME_STATE };
  state.inventory.packaged.green_buds = 10;
  
  const { newState } = tickSimulation(state, 1.0);
  assert.ok(newState.growStations[0].progress > state.growStations[0].progress, 'Grow station progress should advance');
});

test('calculatePrestigeTokens awards tokens only past $50k milestone', () => {
  assert.equal(calculatePrestigeTokens(1000), 0);
  assert.equal(calculatePrestigeTokens(45000), 0);
  assert.ok(calculatePrestigeTokens(100000) >= 3);
  assert.ok(calculatePrestigeTokens(1000000) > calculatePrestigeTokens(100000));
});

test('applyPrestige resets state while granting permanent green tokens', () => {
  const state = {
    ...INITIAL_GAME_STATE,
    cash: 500000,
    lifetimeEarnings: 200000,
    greenTokens: 2,
  };
  const prestigeState = applyPrestige(state);
  assert.equal(prestigeState.cash, 1000);
  assert.ok(prestigeState.greenTokens > 2, 'Green tokens must increase on prestige');
  assert.equal(prestigeState.totalPrestiges, 1);
});

test('calculateOfflineEarnings gives reasonable capped rewards', () => {
  const now = Date.now();
  const pastTime = now - 3600 * 1000; // 1 hour ago
  const state = {
    ...INITIAL_GAME_STATE,
    lastSavedAt: pastTime,
    hiredManagers: { mgr_budtender_ben: true },
  };

  const offline = calculateOfflineEarnings(state, now);
  assert.equal(offline.offlineSeconds, 3600);
  assert.ok(offline.offlineCashEarned > 0, 'Offline earnings should be greater than zero');
  assert.ok(offline.offlineCashEarned < 10000000, 'Offline earnings should not explode uncontrollably');
});
