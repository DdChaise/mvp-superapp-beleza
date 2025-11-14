import { UserPreference, UserCoins, CoinTransaction } from './types';

const STORAGE_KEY = 'lookbox_preferences';
const COINS_KEY = 'lookbox_coins';

export const storage = {
  getPreferences: (): UserPreference => {
    if (typeof window === 'undefined') {
      return { favoriteApps: [], recentApps: [], searchHistory: [] };
    }
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { favoriteApps: [], recentApps: [], searchHistory: [] };
    }
    
    try {
      return JSON.parse(stored);
    } catch {
      return { favoriteApps: [], recentApps: [], searchHistory: [] };
    }
  },

  savePreferences: (preferences: UserPreference): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  },

  addFavorite: (appId: string): void => {
    const prefs = storage.getPreferences();
    if (!prefs.favoriteApps.includes(appId)) {
      prefs.favoriteApps.push(appId);
      storage.savePreferences(prefs);
    }
  },

  removeFavorite: (appId: string): void => {
    const prefs = storage.getPreferences();
    prefs.favoriteApps = prefs.favoriteApps.filter(id => id !== appId);
    storage.savePreferences(prefs);
  },

  addRecentApp: (appId: string): void => {
    const prefs = storage.getPreferences();
    prefs.recentApps = [appId, ...prefs.recentApps.filter(id => id !== appId)].slice(0, 10);
    storage.savePreferences(prefs);
  },

  addSearchTerm: (term: string): void => {
    const prefs = storage.getPreferences();
    prefs.searchHistory = [term, ...prefs.searchHistory.filter(t => t !== term)].slice(0, 10);
    storage.savePreferences(prefs);
  },

  // Sistema de Moedas
  getCoins: (): UserCoins => {
    if (typeof window === 'undefined') {
      return {
        balance: 0,
        lastDailyReward: null,
        appUsageCount: {},
        transactionHistory: []
      };
    }

    const stored = localStorage.getItem(COINS_KEY);
    if (!stored) {
      // Primeira vez - inicializar com bônus de boas-vindas
      const initial: UserCoins = {
        balance: 0,
        lastDailyReward: null,
        appUsageCount: {},
        transactionHistory: []
      };
      storage.saveCoins(initial);
      return initial;
    }

    try {
      return JSON.parse(stored);
    } catch {
      return {
        balance: 0,
        lastDailyReward: null,
        appUsageCount: {},
        transactionHistory: []
      };
    }
  },

  saveCoins: (coins: UserCoins): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(COINS_KEY, JSON.stringify(coins));
  },

  addCoins: (amount: number, type: CoinTransaction['type'], description: string, appId?: string): void => {
    const coins = storage.getCoins();
    coins.balance += amount;
    
    const transaction: CoinTransaction = {
      id: Date.now().toString(),
      type,
      amount,
      description,
      timestamp: new Date().toISOString(),
      appId
    };
    
    coins.transactionHistory.unshift(transaction);
    storage.saveCoins(coins);
  },

  deductCoins: (amount: number, appId: string, appName: string): boolean => {
    const coins = storage.getCoins();
    
    if (coins.balance < amount) {
      return false;
    }
    
    coins.balance -= amount;
    
    const transaction: CoinTransaction = {
      id: Date.now().toString(),
      type: 'usage',
      amount: -amount,
      description: `Uso do ${appName}`,
      timestamp: new Date().toISOString(),
      appId
    };
    
    coins.transactionHistory.unshift(transaction);
    storage.saveCoins(coins);
    return true;
  },

  canUseApp: (appId: string): { canUse: boolean; usesLeft: number; needsCoins: boolean } => {
    const coins = storage.getCoins();
    const usageCount = coins.appUsageCount[appId] || 0;
    const FREE_USES = 2;

    if (usageCount < FREE_USES) {
      return { canUse: true, usesLeft: FREE_USES - usageCount, needsCoins: false };
    }

    // Após usos grátis, precisa de moedas
    const COINS_PER_USE = 10;
    const hasEnoughCoins = coins.balance >= COINS_PER_USE;
    
    return { canUse: hasEnoughCoins, usesLeft: 0, needsCoins: true };
  },

  useApp: (appId: string, appName: string): { success: boolean; message: string } => {
    const coins = storage.getCoins();
    const usageCount = coins.appUsageCount[appId] || 0;
    const FREE_USES = 2;
    const COINS_PER_USE = 10;

    // Usos grátis
    if (usageCount < FREE_USES) {
      coins.appUsageCount[appId] = usageCount + 1;
      storage.saveCoins(coins);
      
      const remaining = FREE_USES - (usageCount + 1);
      return {
        success: true,
        message: remaining > 0 
          ? `Uso grátis! Você ainda tem ${remaining} uso${remaining > 1 ? 's' : ''} grátis.`
          : `Último uso grátis! Próximos usos custam ${COINS_PER_USE} moedas.`
      };
    }

    // Precisa de moedas
    if (coins.balance < COINS_PER_USE) {
      return {
        success: false,
        message: `Você precisa de ${COINS_PER_USE} moedas. Saldo atual: ${coins.balance} moedas.`
      };
    }

    // Deduzir moedas
    const deducted = storage.deductCoins(COINS_PER_USE, appId, appName);
    if (deducted) {
      coins.appUsageCount[appId] = usageCount + 1;
      storage.saveCoins(coins);
      
      return {
        success: true,
        message: `${COINS_PER_USE} moedas usadas. Saldo: ${coins.balance} moedas.`
      };
    }

    return {
      success: false,
      message: 'Erro ao processar pagamento.'
    };
  },

  claimDailyReward: (): { success: boolean; message: string; coins?: number } => {
    const coins = storage.getCoins();
    const today = new Date().toDateString();
    
    if (coins.lastDailyReward === today) {
      return {
        success: false,
        message: 'Você já resgatou seu cashback diário hoje!'
      };
    }

    const DAILY_REWARD = 2;
    storage.addCoins(DAILY_REWARD, 'daily_reward', 'Cashback diário');
    
    coins.lastDailyReward = today;
    storage.saveCoins(coins);

    return {
      success: true,
      message: `Você ganhou ${DAILY_REWARD} moedas!`,
      coins: DAILY_REWARD
    };
  },

  purchaseCoins: (planId: string, coins: number, price: number): void => {
    storage.addCoins(
      coins,
      'purchase',
      `Compra de ${coins} moedas por R$ ${price.toFixed(2)}`
    );
  }
};
