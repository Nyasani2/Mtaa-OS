export type LedgerEntry = {
  id: string;
  user_id: string;
  type: "credit" | "debit";
  amount: number;
  reference?: string;
  created_at: string;
};

export class Ledger {
  private entries: LedgerEntry[] = [];

  record(entry: LedgerEntry) {
    this.entries.push(entry);
    return entry;
  }

  balance(user_id: string) {
    return this.entries
      .filter(e => e.user_id === user_id)
      .reduce((acc, e) => {
        return e.type === "credit"
          ? acc + e.amount
          : acc - e.amount;
      }, 0);
  }
}
