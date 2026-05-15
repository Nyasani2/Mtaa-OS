import { getMarketplaceFeed } from "./listings/listings-engine";
import { createEscrow } from "./escrow/escrow-engine";
import { createOrder, routeDelivery } from "./orders/order-engine";
import { calculateMarketplacePrice } from "./pricing/market-pricing-engine";

/**
 * MARKETPLACE OS CONTROLLER
 */

export async function MarketplaceApp() {
  const feed = await getMarketplaceFeed();

  return {
    feed,
    createOrder,
    createEscrow,
    routeDelivery,
    pricing: calculateMarketplacePrice,
  };
}
