import { supabase } from './supabase';

export interface UserCoins {
  balance: number;
  lastDailyReward: string | null;
}

export interface CoinTransaction {
  id: string;
  amount: number;
  type: 'purchase' | 'usage' | 'reward' | 'bonus';
  description: string;
  created_at: string;
}

export const coinService = {
  // Buscar saldo de moedas do usuário
  async getUserCoins(userId: string): Promise<UserCoins> {
    const { data, error } = await supabase
      .from('user_coins')
      .select('balance, last_daily_reward')
      .eq('user_id', userId)
      .single();

    if (error) {
      // Se não existe, criar registro inicial
      const { data: newData, error: createError } = await supabase
        .from('user_coins')
        .insert({ user_id: userId, balance: 0 })
        .select('balance, last_daily_reward')
        .single();

      if (createError) throw createError;
      return {
        balance: newData.balance,
        lastDailyReward: newData.last_daily_reward,
      };
    }

    return {
      balance: data.balance,
      lastDailyReward: data.last_daily_reward,
    };
  },

  // Adicionar moedas
  async addCoins(
    userId: string,
    amount: number,
    type: 'purchase' | 'reward' | 'bonus',
    description: string
  ): Promise<void> {
    // Atualizar saldo
    const { data: currentData } = await supabase
      .from('user_coins')
      .select('balance')
      .eq('user_id', userId)
      .single();

    const newBalance = (currentData?.balance || 0) + amount;

    await supabase
      .from('user_coins')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    // Registrar transação
    await supabase.from('coin_transactions').insert({
      user_id: userId,
      amount,
      type,
      description,
    });
  },

  // Usar moedas
  async useCoins(userId: string, amount: number, description: string): Promise<boolean> {
    const { data: currentData } = await supabase
      .from('user_coins')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (!currentData || currentData.balance < amount) {
      return false;
    }

    const newBalance = currentData.balance - amount;

    await supabase
      .from('user_coins')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    // Registrar transação
    await supabase.from('coin_transactions').insert({
      user_id: userId,
      amount: -amount,
      type: 'usage',
      description,
    });

    return true;
  },

  // Resgatar recompensa diária
  async claimDailyReward(userId: string): Promise<{ success: boolean; message: string }> {
    const { data } = await supabase
      .from('user_coins')
      .select('last_daily_reward')
      .eq('user_id', userId)
      .single();

    const today = new Date().toDateString();
    const lastReward = data?.last_daily_reward;

    if (lastReward === today) {
      return {
        success: false,
        message: 'Você já resgatou sua recompensa diária hoje!',
      };
    }

    await this.addCoins(userId, 2, 'reward', 'Cashback diário');

    await supabase
      .from('user_coins')
      .update({ last_daily_reward: today })
      .eq('user_id', userId);

    return {
      success: true,
      message: 'Você ganhou 2 moedas! Volte amanhã para mais.',
    };
  },

  // Buscar histórico de transações
  async getTransactions(userId: string, limit = 20): Promise<CoinTransaction[]> {
    const { data, error } = await supabase
      .from('coin_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  // Verificar e registrar uso de app
  async checkAndUseApp(userId: string, appId: string): Promise<{ canUse: boolean; needsCoins: boolean; usageCount: number }> {
    // Buscar uso atual
    const { data: usageData } = await supabase
      .from('app_usage')
      .select('usage_count')
      .eq('user_id', userId)
      .eq('app_id', appId)
      .single();

    const currentUsage = usageData?.usage_count || 0;

    // Primeiros 2 usos são grátis
    if (currentUsage < 2) {
      // Incrementar uso
      if (usageData) {
        await supabase
          .from('app_usage')
          .update({ usage_count: currentUsage + 1, updated_at: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('app_id', appId);
      } else {
        await supabase.from('app_usage').insert({
          user_id: userId,
          app_id: appId,
          usage_count: 1,
        });
      }

      return { canUse: true, needsCoins: false, usageCount: currentUsage + 1 };
    }

    // A partir do 3º uso, precisa de moedas
    const canUse = await this.useCoins(userId, 10, `Uso do app: ${appId}`);

    if (canUse) {
      await supabase
        .from('app_usage')
        .update({ usage_count: currentUsage + 1, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('app_id', appId);
    }

    return { canUse, needsCoins: true, usageCount: currentUsage };
  },

  // Buscar uso de app
  async getAppUsage(userId: string, appId: string): Promise<number> {
    const { data } = await supabase
      .from('app_usage')
      .select('usage_count')
      .eq('user_id', userId)
      .eq('app_id', appId)
      .single();

    return data?.usage_count || 0;
  },
};
