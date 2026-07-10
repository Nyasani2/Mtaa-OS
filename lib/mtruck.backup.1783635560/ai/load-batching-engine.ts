export interface Freight {
  id: string;
  weight: number;
  pickup_zone: string;
  dropoff_zone: string;
}

export function batchLoads(freights: Freight[], maxWeight = 1000) {
  const batches: Freight[][] = [];
  let currentBatch: Freight[] = [];
  let currentWeight = 0;

  for (const f of freights) {
    if (currentWeight + f.weight > maxWeight) {
      batches.push(currentBatch);
      currentBatch = [];
      currentWeight = 0;
    }

    currentBatch.push(f);
    currentWeight += f.weight;
  }

  if (currentBatch.length) batches.push(currentBatch);

  return batches;
}
