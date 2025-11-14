'use client';

import { Heart, ExternalLink, Sparkles } from 'lucide-react';
import { MiniApp } from '@/lib/types';
import { storage } from '@/lib/storage';

interface MiniAppCardProps {
  app: MiniApp;
  isFavorite: boolean;
  onToggleFavorite: (appId: string) => void;
  onOpen: (appId: string) => void;
}

export function MiniAppCard({ app, isFavorite, onToggleFavorite, onOpen }: MiniAppCardProps) {
  const handleOpen = () => {
    const { canUse, usesLeft, needsCoins } = storage.canUseApp(app.id);
    
    if (!canUse && needsCoins) {
      const coins = storage.getCoins();
      alert(`❌ Moedas insuficientes!\n\nVocê precisa de 10 moedas para usar este app.\nSaldo atual: ${coins.balance} moedas\n\nCompre mais moedas ou ganhe 2 moedas grátis por dia!`);
      return;
    }
    
    const result = storage.useApp(app.id, app.name);
    
    if (result.success) {
      onOpen(app.id);
      
      // Mostrar mensagem de uso
      if (usesLeft > 0) {
        setTimeout(() => {
          alert(`✅ ${result.message}`);
        }, 100);
      }
    } else {
      alert(`❌ ${result.message}`);
    }
  };

  const { usesLeft, needsCoins } = storage.canUseApp(app.id);

  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
      {/* Image */}
      {app.image && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={app.image}
            alt={app.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Badge de Usos Grátis */}
          {usesLeft > 0 && (
            <div className="absolute top-3 left-3 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {usesLeft} uso{usesLeft > 1 ? 's' : ''} grátis
            </div>
          )}
          
          {/* Badge de Custo */}
          {needsCoins && usesLeft === 0 && (
            <div className="absolute top-3 left-3 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
              10 moedas
            </div>
          )}
          
          {/* Favorite Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(app.id);
            }}
            className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-all duration-200 hover:scale-110"
          >
            <Heart
              className={`w-5 h-5 transition-colors ${
                isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'
              }`}
            />
          </button>
        </div>
      )}

      {/* Content */}
      <div className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className={`${app.color} p-3 rounded-xl text-2xl shadow-md`}>
            {app.icon}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-lg leading-tight">
              {app.name}
            </h3>
            <p className="text-sm text-gray-600 mt-0.5">
              {app.description}
            </p>
          </div>
        </div>

        {/* Open Button */}
        <button
          onClick={handleOpen}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg group"
        >
          <span>Abrir</span>
          <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
