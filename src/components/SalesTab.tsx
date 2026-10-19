import React from 'react';
import type { GameState, StrainId, WholesaleOrder } from '../types/game.ts';
import { STRAINS } from '../game/constants.ts';
import { calculateSellPrice } from '../game/engine.ts';
import { sounds } from '../utils/audio.ts';
import {
  ShoppingBag,
  TrendingUp,
  Briefcase,
  Unlock,
  Coins,
  Check,
  Zap,
} from 'lucide-react';

interface SalesTabProps {
  state: GameState;
  onUnlockStrain: (strainId: StrainId) => void;
  onManualRetailSale: (strainId: StrainId) => void;
  onFulfillWholesale: (order: WholesaleOrder) => void;
}

export const SalesTab: React.FC<SalesTabProps> = ({
  state,
  onUnlockStrain,
  onManualRetailSale,
  onFulfillWholesale,
}) => {
  const strainKeys = Object.keys(STRAINS) as StrainId[];

  return (
    <div className="flex flex-col gap-5 p-4 pb-24 text-zinc-100">
      {/* Market Trend Alert Banner */}
      {state.marketTrend && (
        <div className="bg-gradient-to-r from-amber-950/60 via-[#1c160a] to-[#120f09] border border-amber-600/40 rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-amber-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                {state.marketTrend.title}
              </div>
              <div className="text-[11px] text-zinc-400 mt-0.5">
                {state.marketTrend.description} ({Math.round(state.marketTrend.priceMultiplier * 100 - 100)}% Price Surge!)
              </div>
            </div>
          </div>
          <span className="text-xs font-mono-numbers text-amber-400 font-bold bg-amber-950/80 px-2 py-1 rounded-lg border border-amber-800/40">
            {Math.max(0, Math.ceil((state.marketTrend.endsAt - Date.now()) / 1000))}s
          </span>
        </div>
      )}

      {/* 1. RETAIL PRODUCT SHOWCASE */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
              Dispensary Product Showcase
            </h2>
            <p className="text-xs text-zinc-400">Manage retail jars, customer pricing, and strain unlocks</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {strainKeys.map((sId) => {
            const strain = STRAINS[sId];
            const isUnlocked = state.unlockedStrains.includes(sId);
            const stockJars = state.inventory.packaged[sId] || 0;
            const pricePerJar = calculateSellPrice(
              sId,
              state.upgrades,
              state.marketTrend,
              state.greenTokens,
              state.hiredManagers
            );

            if (!isUnlocked) {
              const canAfford = state.cash >= strain.unlockCost;
              return (
                <div
                  key={sId}
                  className="bg-[#0b100d] border border-zinc-800/70 rounded-2xl p-4 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl opacity-40">{strain.icon}</span>
                      <div>
                        <div className="text-xs font-bold text-zinc-400">{strain.name}</div>
                        <div className="text-[10px] text-zinc-500">Tier {strain.tier} Exotic Strain</div>
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-500 mb-3 line-clamp-2">{strain.description}</p>
                  <button
                    onClick={() => {
                      if (canAfford) {
                        sounds.playUpgrade();
                        onUnlockStrain(sId);
                      }
                    }}
                    disabled={!canAfford}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      canAfford
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 active:scale-[0.98]'
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    }`}
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    Unlock Strain (${strain.unlockCost.toLocaleString()})
                  </button>
                </div>
              );
            }

            return (
              <div
                key={sId}
                className="bg-[#101713] border border-[#1d2d22] rounded-2xl p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{strain.icon}</span>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span style={{ color: strain.color }}>{strain.name}</span>
                          <span className="text-[10px] text-zinc-400 font-mono-numbers">T{strain.tier}</span>
                        </div>
                        <div className="text-[11px] text-emerald-400 font-mono-numbers font-semibold">
                          ${pricePerJar.toLocaleString()} / 5g Jar
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-zinc-400 block">Stock in Shop</span>
                      <span className="text-xs font-mono-numbers font-bold text-white">
                        {stockJars} Jars
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-400 mb-3">{strain.description}</p>
                </div>

                <button
                  onClick={() => {
                    if (stockJars > 0) {
                      sounds.playCashRegister();
                      onManualRetailSale(sId);
                    }
                  }}
                  disabled={stockJars <= 0}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-transform ${
                    stockJars > 0
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-md shadow-emerald-500/20 active:scale-[0.98]'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  <Coins className="w-3.5 h-3.5" />
                  {stockJars > 0
                    ? `Sell to Counter Customer (+$${pricePerJar})`
                    : 'Out of Packaged Jars'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. WHOLESALE CONTRACTS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-cyan-400" />
              Wholesale Corporate Deals
            </h2>
            <p className="text-xs text-zinc-400">Fulfill bulk raw inventory orders for massive cash sums</p>
          </div>
          <span className="text-xs text-cyan-400 font-medium font-mono-numbers">
            {state.wholesaleOrders.length} Active Orders
          </span>
        </div>

        {state.wholesaleOrders.length === 0 ? (
          <div className="bg-[#0b100d] border border-zinc-800/80 rounded-2xl p-6 text-center text-zinc-500 text-xs">
            Scanning commercial distributors for high-value contracts...
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {state.wholesaleOrders.map((order) => {
              const strain = STRAINS[order.strainId];
              const availableRaw = state.inventory.raw[order.strainId] || 0;
              const hasEnough = availableRaw >= order.requiredGrams;
              const timeLeftSec = Math.max(0, Math.ceil((order.expiresAt - Date.now()) / 1000));

              return (
                <div
                  key={order.id}
                  className="bg-[#101713] border border-[#1b2b2b] rounded-2xl p-4 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl p-2 rounded-xl bg-cyan-950/60 border border-cyan-800/40">
                        {order.companyLogo}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-zinc-200">{order.clientName}</div>
                        <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                          <span>Requesting:</span>
                          <span className="font-semibold text-white">
                            {order.requiredGrams}g of {strain.name}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-zinc-500 block">Offer Expires In</span>
                      <span className="text-xs font-mono-numbers text-cyan-400 font-bold">
                        {timeLeftSec}s
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-black/40 p-2.5 rounded-xl text-xs">
                    <div>
                      <span className="text-zinc-400 block text-[10px]">Your Available Stock</span>
                      <span
                        className={`font-mono-numbers font-bold ${
                          hasEnough ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {availableRaw}g / {order.requiredGrams}g
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-zinc-400 block text-[10px]">Contract Payout</span>
                      <span className="font-mono-numbers font-bold text-emerald-400 text-sm">
                        +${order.cashReward.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (hasEnough) {
                        sounds.playCashRegister();
                        onFulfillWholesale(order);
                      }
                    }}
                    disabled={!hasEnough}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-transform ${
                      hasEnough
                        ? 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-md shadow-cyan-500/20 active:scale-[0.98]'
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    {hasEnough
                      ? `Fulfill Contract (+$${order.cashReward.toLocaleString()})`
                      : `Needs ${order.requiredGrams - availableRaw}g More Raw Flower`}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
