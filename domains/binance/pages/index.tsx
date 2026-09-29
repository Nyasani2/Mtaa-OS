// @ts-nocheck
'use client';

import React, { useState } from 'react';
import CandlestickChart from '../components/CandlestickChart';

export default function BinanceIndex() {
  const [selectedPair, setSelectedPair] = useState('BTC/USDT');

  const watchlist = [
    { symbol: 'BTC/USDT', price: 81820.59, change: 1.29 },
    { symbol: 'ETH/USDT', price: 2648.42, change: 2.18 },
    { symbol: 'SOL/USDT', price: 111.87, change: 0.44 },
    { symbol: 'BNB/USDT', price: 766.24, change: 1.13 },
    { symbol: 'ADA/USDT', price: 0.45, change: -0.91 },
    { symbol: 'XRP/USDT', price: 0.52, change: 3.13 },
  ];

  const currentPair = watchlist.find(p => p.symbol === selectedPair) || watchlist[0];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">KAMOS</h1>
        <div className="flex items-center gap-4">
          <span className="text-slate-400">{selectedPair}</span>
          <span className="text-2xl font-bold">${currentPair.price.toLocaleString()}</span>
          <span className={`text-lg ${currentPair.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {currentPair.change >= 0 ? '+' : ''}{currentPair.change}%
          </span>
        </div>
      </div>

      {/* Watchlist */}
      <div className="bg-slate-900 rounded-xl p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Watchlist</h2>
        <div className="space-y-2">
          {watchlist.map((pair) => (
            <button
              key={pair.symbol}
              onClick={() => setSelectedPair(pair.symbol)}
              className={`w-full flex justify-between items-center p-3 rounded-lg transition ${
                selectedPair === pair.symbol ? 'bg-slate-800' : 'hover:bg-slate-800/50'
              }`}
            >
              <span className="font-semibold">{pair.symbol}</span>
              <div className="text-right">
                <div className="font-bold">${pair.price.toLocaleString()}</div>
                <div className={pair.change >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {pair.change >= 0 ? '+' : ''}{pair.change}%
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="bg-slate-900 rounded-xl p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Market Structure</h2>
        <CandlestickChart 
          symbol={selectedPair}
          initialPrice={currentPair.price}
        />
      </div>

      {/* Market Context */}
      <div className="bg-slate-900 rounded-xl p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Market Context</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="text-slate-400 text-sm">Funding Rate</div>
            <div className="text-lg font-bold">0.0108%</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="text-slate-400 text-sm">Open Interest</div>
            <div className="text-lg font-bold">61.1M</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="text-slate-400 text-sm">Long/Short</div>
            <div className="text-lg font-bold">1.08</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="text-slate-400 text-sm">Fear & Greed</div>
            <div className="text-lg font-bold text-orange-400">71 (Greed)</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="text-slate-400 text-sm">BTC Dominance</div>
            <div className="text-lg font-bold">58.4%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
