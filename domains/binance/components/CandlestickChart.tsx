// @ts-nocheck
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CandlestickSeries, TimeFrame } from 'lightweight-charts';

interface CandlestickChartProps {
  symbol?: string;
  initialPrice?: number;
  timeframe?: '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
}

export default function CandlestickChart({ 
  symbol = 'BTC/USDT',
  initialPrice = 81820,
  timeframe = '1m'
}: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);
  const [candleData, setCandleData] = useState<any[]>([]);

  // Get timeframe multiplier
  const getTimeframeMinutes = (tf: string) => {
    const map: Record<string, number> = {
      '1m': 1, '5m': 5, '15m': 15, '1h': 60, '4h': 240, '1d': 1440
    };
    return map[tf] || 1;
  };

  useEffect(() => {
    if (!chartContainerRef.current) return;

    try {
      // Initialize chart
      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: 450,
        layout: {
          background: { type: ColorType.Solid, color: '#0f172a' },
          textColor: '#94a3b8',
        },
        grid: {
          vertLines: { color: '#1e293b' },
          horzLines: { color: '#1e293b' },
        },
        crosshair: {
          mode: 1,
        },
        rightPriceScale: {
          borderColor: '#334155',
        },
        timeScale: {
          borderColor: '#334155',
          timeVisible: true,
          secondsVisible: false,
        },
      });

      chartRef.current = chart;

      // Create candlestick series
      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#10b981',
        downColor: '#ef4444',
        borderVisible: false,
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
      });

      seriesRef.current = candlestickSeries;

      // Generate MORE historical data for ASIS analysis
      const tfMinutes = getTimeframeMinutes(timeframe);
      const numCandles = timeframe === '1d' ? 365 : timeframe === '1h' ? 168 : timeframe === '4h' ? 90 : 500;
      
      const initialData: any[] = [];
      let time = new Date();
      time.setMinutes(time.getMinutes() - (numCandles * tfMinutes));
      
      let price = initialPrice;
      for (let i = 0; i < numCandles; i++) {
        const volatility = price * (timeframe === '1d' ? 0.03 : timeframe === '1h' ? 0.01 : 0.002);
        const open = price;
        const close = price + (Math.random() - 0.5) * volatility * 2;
        const high = Math.max(open, close) + Math.random() * volatility;
        const low = Math.min(open, close) - Math.random() * volatility;
        
        initialData.push({
          time: Math.floor(time.getTime() / 1000) as any,
          open,
          high,
          low,
          close,
        });
        
        price = close;
        time.setMinutes(time.getMinutes() + tfMinutes);
      }

      candlestickSeries.setData(initialData);
      setCandleData(initialData);

      // Simulate real-time updates
      const intervalId = setInterval(() => {
        if (!seriesRef.current || initialData.length === 0) return;

        const lastCandle = initialData[initialData.length - 1];
        const volatility = lastCandle.close * (timeframe === '1d' ? 0.03 : timeframe === '1h' ? 0.01 : 0.001);
        const newPrice = lastCandle.close + (Math.random() - 0.5) * volatility * 2;
        
        const updatedCandle = {
          time: lastCandle.time,
          open: lastCandle.open,
          high: Math.max(lastCandle.high, newPrice),
          low: Math.min(lastCandle.low, newPrice),
          close: newPrice,
        };

        seriesRef.current.update(updatedCandle);

        // Add new candle based on timeframe
        const now = new Date();
        const candleStartTime = new Date(lastCandle.time * 1000);
        const timeDiff = now.getTime() - candleStartTime.getTime();
        const tfMs = tfMinutes * 60 * 1000;
        
        if (timeDiff >= tfMs) {
          const newCandle = {
            time: Math.floor(now.getTime() / 1000) as any,
            open: newPrice,
            high: newPrice,
            low: newPrice,
            close: newPrice,
          };
          initialData.push(newCandle);
          setCandleData([...initialData]);
        }
      }, timeframe === '1d' ? 60000 : 3000);

      // Handle resize
      const handleResize = () => {
        if (chartContainerRef.current && chartRef.current) {
          chartRef.current.applyOptions({
            width: chartContainerRef.current.clientWidth,
          });
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        clearInterval(intervalId);
        window.removeEventListener('resize', handleResize);
        if (chartRef.current) {
          chartRef.current.remove();
        }
      };
    } catch (error) {
      console.error('Error creating chart:', error);
    }
  }, [symbol, initialPrice, timeframe]);

  return (
    <div className="relative">
      <div 
        ref={chartContainerRef} 
        className="w-full h-[450px] rounded-lg overflow-hidden"
      />
      <div className="absolute top-4 left-4 bg-slate-800/80 backdrop-blur px-4 py-2 rounded-lg">
        <div className="text-2xl font-bold text-emerald-400">
          ${candleData.length > 0 
            ? candleData[candleData.length - 1].close.toLocaleString('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })
            : initialPrice.toLocaleString('en-US', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })
          }
        </div>
        <div className="text-xs text-slate-400">{symbol} • {timeframe}</div>
      </div>
    </div>
  );
}
