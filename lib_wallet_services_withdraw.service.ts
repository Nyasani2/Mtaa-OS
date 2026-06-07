export class WithdrawService {
  static async withdraw(amount: number, method: string): Promise<{ success: boolean; error?: string }> {
    return { success: true };
  }

  static async checkKycLevel(userId: string): Promise<{ level: number; verified: boolean }> {
    return { level: 1, verified: true };
  }
}

export const withdrawService = {
  async withdraw(amount: number, method: string) {
    return WithdrawService.withdraw(amount, method);
  },
  async checkKycLevel(userId: string) {
    return WithdrawService.checkKycLevel(userId);
  }
};

export default WithdrawService;
