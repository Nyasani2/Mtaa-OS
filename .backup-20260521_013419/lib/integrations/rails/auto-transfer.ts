import { chooseBestRail } from './smart-router';
import { calculateFX } from '../fx/fx-engine';

export async function autoTransfer(payload: {
  from: string;
  to: string;
  amount: number;
  currencyFrom: string;
  currencyTo: string;
}) {
  const rail = chooseBestRail(payload.amount, payload.currencyFrom, payload.currencyTo);

  if (!rail) throw new Error('NO_AVAILABLE_RAIL');

  const fx = calculateFX(payload.amount, payload.currencyFrom, payload.currencyTo);

  const result = await rail.send({
    from: payload.from,
    to: payload.to,
    amount: fx.convertedAmount,
  });

  return {
    ...result,
    fx,
    mtaa_revenue: fx.fee,
    rail: rail.name,
  };
}
