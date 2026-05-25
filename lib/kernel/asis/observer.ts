import { channel, ChannelMessage, ChannelType } from '../communication/Channel';
import { asisGate } from './SafetyGate';

export class AsisObserver {
  private subscriptions: Array<() => void> = [];
  private observedEvents: ChannelMessage[] = [];

  startObserving(): void {
    this.subscriptions.push(channel.subscribe('business', '*', (msg) => this.handleEvent(msg), { source: 'asis-observer' }));
    this.subscriptions.push(channel.subscribe('wallet', '*', (msg) => this.handleEvent(msg), { source: 'asis-observer' }));
    this.subscriptions.push(channel.subscribe('notification', '*', (msg) => this.handleEvent(msg), { source: 'asis-observer' }));
  }

  stopObserving(): void {
    this.subscriptions.forEach(unsub => unsub());
    this.subscriptions = [];
  }

  private handleEvent(message: ChannelMessage): void {
    asisGate.guard('observe_events', `observe_${message.channel}_${message.topic}`, () => {
      this.observedEvents.push(message);
      if (this.observedEvents.length > 5000) this.observedEvents = this.observedEvents.slice(-2500);
      this.analyzeForAnomalies(message);
    });
  }

  private analyzeForAnomalies(message: ChannelMessage): void {
    if (message.channel === 'business' && message.topic === 'payment_received') {
      const payload = message.payload as any;
      if (payload.amount > 100000) this.flagAnomaly('unusual_amount', message);
      const recent = this.getRecentEvents('business', 'payment_received', 60000);
      const sameSender = recent.filter(e => (e.payload as any)?.senderPhone === payload.senderPhone);
      if (sameSender.length > 5) this.flagAnomaly('rapid_transactions', message);
    }
  }

  private flagAnomaly(type: string, message: ChannelMessage): void {
    asisGate.guard('flag_anomalies', `flag_${type}`, () => {
      channel.publish('notification', 'fraud_alert', {
        type, severity: 'high', messageId: message.id, details: message.payload,
        recommendation: this.getRecommendation(type),
      }, { source: 'asis-anomaly-detector', priority: 'high', traceId: message.traceId });
    });
  }

  private getRecommendation(type: string): string {
    const r: Record<string, string> = {
      unusual_amount: 'Review transaction manually. Contact sender if unknown.',
      rapid_transactions: 'Possible card testing or fraud. Temporarily hold settlement.',
      suspicious_sender: 'Sender name mismatch. Verify with customer directly.',
    };
    return r[type] || 'Review transaction for compliance.';
  }

  getRecentEvents(channel: ChannelType, topic: string, ms: number): ChannelMessage[] {
    const cutoff = Date.now() - ms;
    return this.observedEvents.filter(e => e.channel === channel && e.topic === topic && e.timestamp > cutoff);
  }

  getObservedEvents(limit = 100): ChannelMessage[] {
    return this.observedEvents.slice(-limit);
  }
}

export const asisObserver = new AsisObserver();
