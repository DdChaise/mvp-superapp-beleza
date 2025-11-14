'use client';

import { useState } from 'react';
import { fetchCEP, formatCEP, CEPData } from '@/lib/cep';
import { supabase } from '@/lib/supabase';
import { MapPin, Search, Loader2, Check } from 'lucide-react';

interface AddressFormProps {
  userId: string;
  onSuccess?: () => void;
}

export function AddressForm({ userId, onSuccess }: AddressFormProps) {
  const [cep, setCep] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [loading, setLoading] = useState(false);
  const [cepData, setCepData] = useState<CEPData | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSearchCEP = async () => {
    if (cep.replace(/\D/g, '').length !== 8) {
      setError('CEP inválido. Digite 8 dígitos.');
      return;
    }

    setLoading(true);
    setError('');

    const data = await fetchCEP(cep);

    if (data) {
      setCepData(data);
    } else {
      setError('CEP não encontrado. Verifique e tente novamente.');
    }

    setLoading(false);
  };

  const handleSaveAddress = async () => {
    if (!cepData) return;

    setLoading(true);
    setError('');

    try {
      const { error: saveError } = await supabase.from('user_addresses').insert({
        user_id: userId,
        cep: cepData.cep,
        street: cepData.logradouro,
        number,
        complement,
        neighborhood: cepData.bairro,
        city: cepData.localidade,
        state: cepData.uf,
        is_default: true,
      });

      if (saveError) throw saveError;

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar endereço');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-purple-100 p-3 rounded-xl">
          <MapPin className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Adicionar Endereço</h3>
          <p className="text-sm text-gray-600">Busque pelo CEP e complete os dados</p>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
          <Check className="w-5 h-5" />
          Endereço salvo com sucesso!
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      {/* CEP Search */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">CEP</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={cep}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '');
              setCep(formatCEP(value));
            }}
            placeholder="00000-000"
            maxLength={9}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
          />
          <button
            onClick={handleSearchCEP}
            disabled={loading || cep.replace(/\D/g, '').length !== 8}
            className="bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Address Data */}
      {cepData && (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 font-medium">Rua</p>
                <p className="text-gray-900 font-semibold">{cepData.logradouro}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Bairro</p>
                <p className="text-gray-900 font-semibold">{cepData.bairro}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Cidade</p>
                <p className="text-gray-900 font-semibold">{cepData.localidade}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Estado</p>
                <p className="text-gray-900 font-semibold">{cepData.uf}</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Número</label>
            <input
              type="text"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="123"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Complemento (opcional)
            </label>
            <input
              type="text"
              value={complement}
              onChange={(e) => setComplement(e.target.value)}
              placeholder="Apto 101, Bloco A"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <button
            onClick={handleSaveAddress}
            disabled={loading || success}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Salvando...
              </>
            ) : success ? (
              <>
                <Check className="w-5 h-5" />
                Salvo!
              </>
            ) : (
              'Salvar Endereço'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
