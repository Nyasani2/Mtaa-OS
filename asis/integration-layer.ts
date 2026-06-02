// asis/deployment/integration-layer.ts
// MTAA Connector — bridges ASIS to MTAA apps without direct coupling

export interface MTAAAppBridge {
  app: 'wallet' | 'chat' | 'health' | 'cash' | 'civic' | 'appstore';
  send: (event: string, payload: any) => Promise<void>;
  receive: (event: string, handler: (payload: any) => void) => () => void;
}

class IntegrationLayer {
  private bridges = new Map<string, MTAAAppBridge>();
  private runtimeMediator = (globalThis as any).__ASIS_RUNTIME_KERNEL__;

  registerBridge(bridge: MTAAAppBridge): () => void {
    this.bridges.set(bridge.app, bridge);
    return () => this.bridges.delete(bridge.app);
  }

  async sendToApp(app: string, event: string, payload: any): Promise<boolean> {
    const bridge = this.bridges.get(app);
    if (!bridge) return false;
    // Route through runtime mediator — never direct
    if (this.runtimeMediator?.dispatch) {
      await this.runtimeMediator.dispatch({ target: app, event, payload });
    }
    await bridge.send(event, payload);
    return true;
  }

  onAppEvent(app: string, event: string, handler: (payload: any) => void): () => void {
    const bridge = this.bridges.get(app);
    if (!bridge) return () => {};
    return bridge.receive(event, handler);
  }

  // Wallet integration
  async notifyWallet(transaction: { type: string; amount: number; status: string }) {
    return this.sendToApp('wallet', 'asis_transaction', transaction);
  }

  // Chat integration
  async sendChatMessage(message: { text: string; metadata?: any }) {
    return this.sendToApp('chat', 'asis_message', message);
  }

  // Health integration
  async syncHealthData(data: { metric: string; value: number; timestamp: number }) {
    return this.sendToApp('health', 'asis_health_sync', data);
  }

  // Cash network integration
  async cashNetworkEvent(event: { type: string; nodeId: string; payload: any }) {
    return this.sendToApp('cash', 'asis_cash_event', event);
  }

  // Civic systems integration
  async civicUpdate(update: { system: string; action: string; data: any }) {
    return this.sendToApp('civic', 'asis_civic_update', update);
  }

  getConnectedApps(): string[] {
    return Array.from(this.bridges.keys());
  }
}

export const integrationLayer = new IntegrationLayer();
