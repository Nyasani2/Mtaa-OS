// MTAA wallet fees — ~20% below Safaricom M-PESA 2026 tariffs
export const TX_MIN = 1;
export const TX_LIMIT = 500000; // half a million per transaction

const BANDS: Array<[number, number]> = [
  [1000, 0],        // FREE under KSh 1,000
  [2500, 23],       // Saf 29
  [5000, 42],       // Saf ~53
  [10000, 92],      // Saf 115
  [20000, 108],     // Saf 135
  [50000, 176],     // Saf 220
  [Infinity, 247],  // Saf 309
];

export function mtaaFee(amount: number): number {
  if (!amount || amount <= 1000) return 0;
  for (const [cap, fee] of BANDS) if (amount <= cap) return fee;
  return 247;
}
export const fmtKES = (n: number) => 'KSh ' + (n || 0).toLocaleString('en-KE');
