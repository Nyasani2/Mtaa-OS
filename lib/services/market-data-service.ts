// @ts-nocheck
export class MarketDataService {
  private ws: WebSocket | null = null;
  private listeners: Set<(data: any) => void> = new Set();

  async getExchangeRates(): Promise<Record<string, number>> {
    try {
      // Free, no-key API for demo. Use CoinGecko or Binance in production.
      const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd,kes');
      const data = await res.json();
      return {
        BTC_USD: data.bitcoin.usd,
        ETH_USD: data.ethereum.usd,
        USD_KES: data.bitcoin.kes / data.bitcoin.usd,
      };
    } catch (e) {
      console.warn('Market data fetch failed, using fallback');
      return { BTC_USD: 65000, ETH_USD: 3500, USD_KES: 130 };
    }
  }

  connectToBinanceWS(symbols: string[] = ['btcusdt', 'ethusdt']) {
    const stream = symbols.map(s => `${s}@ticker`).join('/');
    this.ws = new WebSocket(`wss://stream.binance.com:9443/ws/${stream}`);
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.listeners.forEach(listener => listener({
        symbol: data.s,
        price: parseFloat(data.c),
        change: parseFloat(data.P)
      }));
    };

    this.ws.onclose = () => {
      setTimeout(() => this.connectToBinanceWS(symbols), 5000);
    };
  }

  subscribe(callback: (data: any) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  disconnect() {
    this.ws?.close();
    this.listeners.clear();
  }
}
export const marketDataService = new MarketDataService();
