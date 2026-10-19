export type StrainId =
  | 'green_buds'
  | 'premium_kush'
  | 'purple_haze'
  | 'golden_leaf'
  | 'royal_og'
  | 'legendary_emerald';

export interface StrainConfig {
  id: StrainId;
  name: string;
  codename: string;
  tier: number;
  description: string;
  color: string;
  secondaryColor: string;
  unlockCost: number;
  seedCost: number;
  growDurationSec: number;
  baseYieldGrams: number;
  basePricePerGram: number;
  demandFactor: number; // 0..1+
  icon: string;
}

export interface GrowStation {
  id: string;
  name: string;
  strainId: StrainId;
  level: number;
  progress: number; // 0 to 1
  isGrowing: boolean;
  unlocked: boolean;
  unlockCost: number;
}

export interface ProcessingMachine {
  id: string;
  name: string;
  level: number;
  progress: number;
  isProcessing: boolean;
  unlocked: boolean;
  unlockCost: number;
  efficiency: number;
}

export interface PackagingLine {
  id: string;
  name: string;
  level: number;
  progress: number;
  isPackaging: boolean;
  unlocked: boolean;
  unlockCost: number;
  packSize: number; // Grams per pack
}

export interface Inventory {
  raw: Record<StrainId, number>; // Grams
  processed: Record<StrainId, number>; // Grams
  packaged: Record<StrainId, number>; // Packaged units ready for retail
  maxCapacity: number;
}

export interface Manager {
  id: string;
  name: string;
  role: string;
  department: 'cultivation' | 'harvest' | 'processing' | 'packaging' | 'sales' | 'distribution';
  hireCost: number;
  description: string;
  perk: string;
  avatar: string;
  speedBonus: number;
}

export interface UpgradeDef {
  id: string;
  name: string;
  category: 'production' | 'quality' | 'storage' | 'sales' | 'automation';
  baseCost: number;
  costMultiplier: number;
  maxLevel: number;
  description: string;
  effectPerLevel: number;
  icon: string;
}

export interface WholesaleOrder {
  id: string;
  clientName: string;
  companyLogo: string;
  strainId: StrainId;
  requiredGrams: number;
  cashReward: number;
  bonusMultiplier: number;
  expirySeconds: number;
  expiresAt: number;
}

export interface MarketTrend {
  id: string;
  title: string;
  strainId: StrainId;
  priceMultiplier: number;
  description: string;
  durationSeconds: number;
  endsAt: number;
}

export interface Milestone {
  id: string;
  title: string;
  tierName: string;
  requiredLifetime: number;
  tokenReward: number;
  unlocked: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  desc: string;
  target: number;
  rewardCash: number;
  type: 'harvest' | 'sales' | 'cash' | 'upgrade' | 'prestige';
}

export interface GameState {
  cash: number;
  lifetimeEarnings: number;
  greenTokens: number;
  totalPrestiges: number;
  factoryLevel: number;
  
  growStations: GrowStation[];
  processingMachines: ProcessingMachine[];
  packagingLines: PackagingLine[];
  
  inventory: Inventory;
  unlockedStrains: StrainId[];
  activeStrainId: StrainId;
  
  hiredManagers: Record<string, boolean>;
  upgrades: Record<string, number>;
  
  wholesaleOrders: WholesaleOrder[];
  marketTrend: MarketTrend | null;
  
  // Stats
  totalHarvestsGrams: number;
  totalSalesCount: number;
  customersServed: number;
  
  // Timestamps
  lastSavedAt: number;
  dailyRewardLastClaimed: number;
  frenzyUntil: number; // Boost tap frenzy timestamp
  
  // Settings
  soundEnabled: boolean;
  musicEnabled: boolean;
  viewMode: 'iphone' | 'fullscreen';
}
