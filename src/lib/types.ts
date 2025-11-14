export interface MiniApp {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'popular' | 'lab' | 'library';
  image?: string;
  color: string;
}

export interface UserPreference {
  favoriteApps: string[];
  recentApps: string[];
  searchHistory: string[];
}

export interface CoinPlan {
  id: string;
  coins: number;
  price: number;
  popular?: boolean;
  bonus?: number;
}

export interface UserCoins {
  balance: number;
  lastDailyReward: string | null;
  appUsageCount: Record<string, number>; // Contador de usos por app
  transactionHistory: CoinTransaction[];
}

export interface CoinTransaction {
  id: string;
  type: 'purchase' | 'daily_reward' | 'usage' | 'initial';
  amount: number;
  description: string;
  timestamp: string;
  appId?: string;
}
