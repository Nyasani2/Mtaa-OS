export class TransactionIntelligence {
  static async analyze(tx: any): Promise<{ pattern: string; confidence: number }> {
    return { pattern: 'normal', confidence: 1.0 };
  }
}
