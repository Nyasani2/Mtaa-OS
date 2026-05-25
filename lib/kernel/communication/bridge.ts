import { channel, ChannelMessage } from './Channel';

export interface BridgeConfig {
  fromDomain: string;
  toDomain: string;
  allowedTopics: string[];
  transform?: (message: ChannelMessage) => ChannelMessage | null;
}

export class DomainBridge {
  private bridges: Map<string, BridgeConfig> = new Map();

  register(config: BridgeConfig): void {
    const key = `${config.fromDomain}->${config.toDomain}`;
    this.bridges.set(key, config);
  }

  canCross(from: string, to: string, topic: string): boolean {
    const key = `${from}->${to}`;
    const config = this.bridges.get(key);
    if (!config) return false;
    return config.allowedTopics.includes(topic) || config.allowedTopics.includes('*');
  }

  transform(message: ChannelMessage, from: string, to: string): ChannelMessage | null {
    const key = `${from}->${to}`;
    const config = this.bridges.get(key);
    if (!config || !config.transform) return message;
    return config.transform(message);
  }
}

export const domainBridge = new DomainBridge();

domainBridge.register({
  fromDomain: 'business', toDomain: 'wallet',
  allowedTopics: ['payment_received', 'settlement_request', 'refund_request'],
});

domainBridge.register({
  fromDomain: 'wallet', toDomain: 'business',
  allowedTopics: ['settlement_complete', 'balance_update'],
});

domainBridge.register({
  fromDomain: 'business', toDomain: 'notification',
  allowedTopics: ['payment_received', 'settlement_complete', 'fraud_alert'],
});

domainBridge.register({
  fromDomain: 'kernel', toDomain: 'business',
  allowedTopics: ['user_authenticated', 'session_validated'],
});
