import { getStreetSnapshot } from "./intelligence/streets-brain";
import { buildStreetMapLayer } from "./maps/street-map-engine";
import { getStreetFeed } from "./feed/streets-feed";

/**
 * STREETS APP CORE CONTROLLER
 */

export async function StreetsApp() {
  const snapshot = await getStreetSnapshot();
  const map = await buildStreetMapLayer();
  const feed = await getStreetFeed();

  return {
    snapshot,
    map,
    feed,
  };
}
