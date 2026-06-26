export class TransactionValidator {
  static async validate(tx: any): Promise<{ valid: boolean; errors: string[] }> {
    return { valid: true, errors: [] };
  }
}
