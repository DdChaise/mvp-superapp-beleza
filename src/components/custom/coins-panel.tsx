'use client';

import { useState, useEffect } from 'react';
import { Coins, Gift, ShoppingCart, X, TrendingUp, Clock, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { coinService, CoinTransaction } from '@/lib/coin-service';

const COIN_PLANS = [
  {
    id: 'starter',
    coins: 50,
    price: 15,
    bonus: 0
  },
  {
    id: 'popular',
    coins: 100,
    price: 25,
    popular: true,
    bonus: 10
  },
  {
    id: 'premium',
    coins: 200,
    price: 40,
    bonus: 30
  }
];

interface CoinsPanelProps {
  onClose: () => void;
}

export function CoinsPanel({ onClose }: CoinsPanelProps) {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [activeTab, setActiveTab] = useState<'buy' | 'history'>('buy');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      setUserId(session.user.id);

      const coins = await coinService.getUserCoins(session.user.id);
      setBalance(coins.balance);

      const txs = await coinService.getTransactions(session.user.id);
      setTransactions(txs);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (plan: typeof COIN_PLANS[0]) => {
    if (!userId) return;

    const totalCoins = plan.coins + (plan.bonus || 0);
    
    if (confirm(`Confirmar compra de ${totalCoins} moedas por R$ ${plan.price.toFixed(2)}?`)) {
      try {
        await coinService.addCoins(
          userId,
          totalCoins,
          'purchase',
          `Compra de ${plan.coins} moedas${plan.bonus ? ` + ${plan.bonus} bônus` : ''}`
        );

        await loadData();
        alert(`✅ Compra realizada! Você recebeu ${totalCoins} moedas.`);
      } catch (error) {
        console.error('Erro ao comprar moedas:', error);
        alert('Erro ao processar compra. Tente novamente.');
      }
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white rounded-3xl p-8">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
              <Coins className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white mb-1">Suas Moedas</h2>
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-white/90" />
                <span className="text-2xl font-bold text-white">{balance}</span>
                <span className="text-white/80">moedas</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('buy')}
            className={`flex-1 py-4 px-6 font-semibold transition-colors ${
              activeTab === 'buy'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Comprar Moedas
            </div>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-4 px-6 font-semibold transition-colors ${
              activeTab === 'history'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-5 h-5" />
              Histórico
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-300px)]">
          {activeTab === 'buy' ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-900 mb-1">Como funciona?</p>
                    <p className="text-sm text-blue-700">
                      • Primeiros 2 usos de cada app são <strong>GRÁTIS</strong><br />
                      • Depois, cada uso custa <strong>10 moedas</strong><br />
                      • Ganhe <strong>2 moedas grátis</strong> por dia fazendo login
                    </p>
                  </div>
                </div>
              </div>

              {COIN_PLANS.map((plan) => {
                const totalCoins = plan.coins + (plan.bonus || 0);
                const pricePerCoin = plan.price / totalCoins;
                
                return (
                  <div
                    key={plan.id}
                    className={`relative rounded-2xl border-2 p-6 transition-all duration-200 hover:shadow-lg ${
                      plan.popular
                        ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50'
                        : 'border-gray-200 bg-white hover:border-purple-300'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                          MAIS POPULAR
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Coins className={`w-6 h-6 ${plan.popular ? 'text-purple-600' : 'text-amber-600'}`} />
                          <h3 className="text-2xl font-bold text-gray-900">{plan.coins} moedas</h3>
                        </div>
                        {plan.bonus && plan.bonus > 0 && (
                          <div className="flex items-center gap-1 text-emerald-600 font-semibold text-sm">
                            <Sparkles className="w-4 h-4" />
                            +{plan.bonus} moedas de bônus!
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-gray-900">R$ {plan.price}</p>
                        <p className="text-xs text-gray-500">R$ {pricePerCoin.toFixed(2)}/moeda</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handlePurchase(plan)}
                      className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 ${
                        plan.popular
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl'
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                      }`}
                    >
                      Comprar Agora
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma transação ainda</p>
                </div>
              ) : (
                transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            transaction.amount > 0
                              ? 'bg-emerald-100'
                              : 'bg-red-100'
                          }`}
                        >
                          {transaction.type === 'purchase' && (
                            <ShoppingCart className="w-5 h-5 text-emerald-600" />
                          )}
                          {transaction.type === 'reward' && (
                            <Gift className="w-5 h-5 text-emerald-600" />
                          )}
                          {transaction.type === 'bonus' && (
                            <Sparkles className="w-5 h-5 text-emerald-600" />
                          )}
                          {transaction.type === 'usage' && (
                            <Coins className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {transaction.description}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(transaction.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`text-lg font-bold ${
                          transaction.amount > 0
                            ? 'text-emerald-600'
                            : 'text-red-600'
                        }`}
                      >
                        {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
