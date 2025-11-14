'use client';

import { useState, useEffect } from 'react';
import { Search, Star, Heart, Eye, Zap, Coins, Gift, LogOut, MapPin, User as UserIcon } from 'lucide-react';
import { MiniApp } from '@/lib/types';
import { MiniAppCard } from '@/components/custom/mini-app-card';
import { CoinsPanel } from '@/components/custom/coins-panel';
import { AuthForm } from '@/components/custom/auth-form';
import { AddressForm } from '@/components/custom/address-form';
import { supabase } from '@/lib/supabase';
import { coinService } from '@/lib/coin-service';

const miniApps: MiniApp[] = [
  // Transformações Populares
  {
    id: 'tattoo',
    name: 'Tatuagem Virtual',
    description: 'Teste tatuagens antes de fazer',
    icon: '🎨',
    category: 'popular',
    color: 'bg-gradient-to-br from-purple-500 to-pink-600',
    image: 'https://images.unsplash.com/photo-1565058379802-bbe93b2f703a?w=400&h=300&fit=crop'
  },
  {
    id: 'haircut',
    name: 'Cortes de Cabelo',
    description: 'Experimente novos estilos',
    icon: '✂️',
    category: 'popular',
    color: 'bg-gradient-to-br from-blue-500 to-cyan-600',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300&fit=crop'
  },
  {
    id: 'makeup',
    name: 'Maquiagem Virtual',
    description: 'Teste looks de maquiagem',
    icon: '💄',
    category: 'popular',
    color: 'bg-gradient-to-br from-pink-500 to-rose-600',
    image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400&h=300&fit=crop'
  },
  {
    id: 'hair-color',
    name: 'Coloração de Cabelo',
    description: 'Veja como fica cada cor',
    icon: '🎨',
    category: 'popular',
    color: 'bg-gradient-to-br from-orange-500 to-red-600',
    image: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=400&h=300&fit=crop'
  },
  {
    id: 'beard',
    name: 'Estilos de Barba',
    description: 'Experimente diferentes barbas',
    icon: '🧔',
    category: 'popular',
    color: 'bg-gradient-to-br from-amber-600 to-orange-700',
    image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&h=300&fit=crop'
  },
  {
    id: 'piercing',
    name: 'Piercings',
    description: 'Teste piercings virtuais',
    icon: '💎',
    category: 'popular',
    color: 'bg-gradient-to-br from-indigo-500 to-purple-600',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=300&fit=crop'
  },

  // Laboratório de Imagem
  {
    id: 'ai-enhance',
    name: 'Melhorar Imagem',
    description: 'IA para melhorar qualidade',
    icon: '✨',
    category: 'lab',
    color: 'bg-gradient-to-br from-emerald-500 to-teal-600',
  },
  {
    id: 'background-remove',
    name: 'Remover Fundo',
    description: 'Remova fundos automaticamente',
    icon: '🖼️',
    category: 'lab',
    color: 'bg-gradient-to-br from-sky-500 to-blue-600',
  },
  {
    id: 'filters',
    name: 'Filtros Artísticos',
    description: 'Aplique filtros incríveis',
    icon: '🎭',
    category: 'lab',
    color: 'bg-gradient-to-br from-violet-500 to-purple-600',
  },
  {
    id: 'retouch',
    name: 'Retoque de Pele',
    description: 'Retoque profissional',
    icon: '✨',
    category: 'lab',
    color: 'bg-gradient-to-br from-rose-500 to-pink-600',
  },
];

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [filteredApps, setFilteredApps] = useState(miniApps);
  const [showCoinsPanel, setShowCoinsPanel] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [coinBalance, setCoinBalance] = useState(0);
  const [canClaimDaily, setCanClaimDaily] = useState(false);

  useEffect(() => {
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        loadUserData(session.user.id);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
    if (session?.user) {
      await loadUserData(session.user.id);
    }
    setLoading(false);
  };

  const loadUserData = async (userId: string) => {
    try {
      const coins = await coinService.getUserCoins(userId);
      setCoinBalance(coins.balance);
      
      const today = new Date().toDateString();
      setCanClaimDaily(coins.lastDailyReward !== today);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredApps(miniApps);
    } else {
      const filtered = miniApps.filter(app =>
        app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredApps(filtered);
    }
  }, [searchTerm]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCoinBalance(0);
  };

  const handleOpenApp = async (appId: string) => {
    if (!user) {
      alert('Faça login para usar os mini-apps!');
      return;
    }

    try {
      const result = await coinService.checkAndUseApp(user.id, appId);
      
      if (result.canUse) {
        await loadUserData(user.id);
        
        if (result.needsCoins) {
          alert(`✅ App aberto! 10 moedas foram descontadas.\n\nSaldo atual: ${coinBalance - 10} moedas`);
        } else {
          const remaining = 2 - result.usageCount;
          alert(`✅ App aberto gratuitamente!\n\nVocê ainda tem ${remaining} uso${remaining !== 1 ? 's' : ''} grátis neste app.`);
        }
      } else {
        alert('❌ Moedas insuficientes!\n\nCompre mais moedas para continuar usando este app.');
        setShowCoinsPanel(true);
      }
    } catch (error) {
      console.error('Erro ao abrir app:', error);
      alert('Erro ao processar. Tente novamente.');
    }
  };

  const handleDailyReward = async () => {
    if (!user) return;

    try {
      const result = await coinService.claimDailyReward(user.id);
      
      if (result.success) {
        await loadUserData(user.id);
        alert(`🎉 ${result.message}`);
      } else {
        alert(`⏰ ${result.message}`);
      }
    } catch (error) {
      console.error('Erro ao resgatar recompensa:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <AuthForm onSuccess={() => checkUser()} />
      </div>
    );
  }

  const popularApps = filteredApps.filter(app => app.category === 'popular');
  const labApps = filteredApps.filter(app => app.category === 'lab');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-8 px-4 shadow-xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
                LOOKBOX
              </h1>
              <p className="text-purple-100 text-lg">
                Olá, {user.user_metadata?.full_name || user.email}!
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddressForm(true)}
                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-200 rounded-xl p-3"
                title="Adicionar Endereço"
              >
                <MapPin className="w-6 h-6" />
              </button>
              <button
                onClick={() => setShowCoinsPanel(true)}
                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-200 rounded-2xl px-6 py-3 flex items-center gap-3 group"
              >
                <Coins className="w-6 h-6 text-amber-300 group-hover:rotate-12 transition-transform" />
                <div className="text-left">
                  <p className="text-xs text-white/80 font-medium">Suas Moedas</p>
                  <p className="text-2xl font-bold text-white">{coinBalance}</p>
                </div>
              </button>
              <button
                onClick={handleLogout}
                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-200 rounded-xl p-3"
                title="Sair"
              >
                <LogOut className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Daily Reward Banner */}
      {canClaimDaily && (
        <div className="max-w-7xl mx-auto px-4 -mt-4 mb-8 relative z-10">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 shadow-2xl">
            <button
              onClick={handleDailyReward}
              className="w-full flex items-center justify-between hover:bg-white/10 rounded-xl p-2 transition-all duration-200 group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-4 rounded-xl group-hover:scale-110 transition-transform">
                  <Gift className="w-8 h-8 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-white text-xl">Cashback Diário Disponível!</p>
                  <p className="text-white/90">Clique para ganhar 2 moedas grátis</p>
                </div>
              </div>
              <div className="text-4xl">🎁</div>
            </button>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="max-w-7xl mx-auto px-4 mb-12">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar transformações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-full bg-white shadow-xl border-2 border-transparent focus:border-purple-500 focus:outline-none transition-all duration-200 text-gray-900 placeholder-gray-400"
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 pb-16">
        {/* Info Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6 mb-12">
          <div className="flex items-start gap-4">
            <div className="bg-blue-500 p-3 rounded-xl">
              <Coins className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-lg mb-2">Como funciona o sistema de moedas?</h3>
              <div className="space-y-1 text-gray-700">
                <p>✨ <strong>2 usos grátis</strong> em cada mini-app</p>
                <p>💰 Depois, cada uso custa <strong>10 moedas</strong></p>
                <p>🎁 Ganhe <strong>2 moedas grátis</strong> por dia fazendo login</p>
                <p>🛒 Compre pacotes de moedas com preços especiais</p>
              </div>
              <button
                onClick={() => setShowCoinsPanel(true)}
                className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Ver Planos de Moedas
              </button>
            </div>
          </div>
        </div>

        {/* Transformações Populares */}
        {popularApps.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <Star className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                Transformações Populares
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularApps.map(app => (
                <MiniAppCard
                  key={app.id}
                  app={app}
                  isFavorite={favorites.includes(app.id)}
                  onToggleFavorite={(id) => {
                    if (favorites.includes(id)) {
                      setFavorites(favorites.filter(fav => fav !== id));
                    } else {
                      setFavorites([...favorites, id]);
                    }
                  }}
                  onOpen={handleOpenApp}
                />
              ))}
            </div>
          </section>
        )}

        {/* Laboratório de Imagem */}
        {labApps.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <Zap className="w-6 h-6 text-emerald-600" />
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                Laboratório de Imagem
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {labApps.map(app => (
                <MiniAppCard
                  key={app.id}
                  app={app}
                  isFavorite={favorites.includes(app.id)}
                  onToggleFavorite={(id) => {
                    if (favorites.includes(id)) {
                      setFavorites(favorites.filter(fav => fav !== id));
                    } else {
                      setFavorites([...favorites, id]);
                    }
                  }}
                  onOpen={handleOpenApp}
                />
              ))}
            </div>
          </section>
        )}

        {/* No Results */}
        {filteredApps.length === 0 && (
          <div className="text-center py-16">
            <Eye className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              Nenhum resultado encontrado
            </h3>
            <p className="text-gray-500">
              Tente buscar por outro termo
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-400">
            © 2024 LOOKBOX - Transforme seu visual com tecnologia
          </p>
        </div>
      </footer>

      {/* Coins Panel Modal */}
      {showCoinsPanel && (
        <CoinsPanel 
          onClose={() => {
            setShowCoinsPanel(false);
            if (user) loadUserData(user.id);
          }} 
        />
      )}

      {/* Address Form Modal */}
      {showAddressForm && user && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <div className="bg-white rounded-3xl p-2">
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => setShowAddressForm(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <AddressForm 
                userId={user.id} 
                onSuccess={() => {
                  setShowAddressForm(false);
                  alert('✅ Endereço salvo com sucesso!');
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
