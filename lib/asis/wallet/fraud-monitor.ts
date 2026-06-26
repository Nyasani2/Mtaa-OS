export class FraudMonitor {
  static async check(transaction: any): Promise<{ risk: string; score: number }> {
    return { risk: 'low', score: 0 };
  }
}
