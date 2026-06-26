export class TransferPolicy {
  static async check(sender: string, amount: number): Promise<{ allowed: boolean; reason?: string }> {
    return { allowed: true };
  }
}
