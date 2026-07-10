export interface RankedBid {
  truck_id: string;
  bid_amount: number;
  eta_hours: number;
  driver_rating: number;
  completed_trips: number;
}

function calculateBidScore(bid: RankedBid) {
  const priceWeight = bid.bid_amount * 0.35;

  const etaWeight = bid.eta_hours * 0.25;

  const ratingWeight =
    (5 - bid.driver_rating) * 0.20;

  const experienceWeight =
    (1000 - bid.completed_trips) * 0.20;

  return (
    priceWeight +
    etaWeight +
    ratingWeight +
    experienceWeight
  );
}

export function rankMarketplaceBids(
  bids: RankedBid[]
) {
  return bids
    .map((bid) => ({
      ...bid,
      score: calculateBidScore(bid),
    }))
    .sort((a, b) => a.score - b.score);
}
