import { railRegistry } from './rail-registry';
import { calculateFX } from '../fx/fx-engine';

export async function routeTransfer({
  from,
  to,
  amount,
  currencyFrom,
  currencyTo,
  rail,
}: any) {
  const selectedRail = railRegistry.get(rail);

  if (!selectedRail) throw new Error('RAIL_NOT_FOUND');

  const fx = calculateFX(amount, currencyFrom, currencyTo);

  const result = await selectedRail.send({
    from,
    to,
    amount: fx.convertedAmount,
  });

  return {
    ...result,
    fx,
    railUsed: rail,
    mtaaRevenue: fx.fee,
  };
}
