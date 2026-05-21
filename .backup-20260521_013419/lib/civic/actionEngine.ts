import { CivicEvent, civicEvents } from './events'

/**
 * ⚡ MTAA CIVIC ACTION ENGINE
 * Safe event injection layer for live civic actions
 *
 * NOTE:
 * We mutate a shared in-memory array for simulation only.
 * Later this will be replaced by database writes (Supabase).
 */

/**
 * ➕ Add event safely to system
 */
export const addCivicEvent = (event: CivicEvent) => {
  civicEvents.unshift(event)
}

/**
 * 🛣️ Citizen reports a pothole
 */
export const reportPothole = (
  countyId: string,
  description: string,
  image?: string
) => {
  addCivicEvent({
    id: 'evt_' + Date.now(),
    type: 'POTHOLE_REPORTED',
    countyId,
    description,
    timestamp: Date.now()
  })
}

/**
 * 🚗 Parking payment event
 */
export const parkingPayment = (
  countyId: string,
  amount: number
) => {
  addCivicEvent({
    id: 'evt_' + Date.now(),
    type: 'PARKING_PAYMENT',
    countyId,
    amount,
    description: 'Live parking payment received',
    timestamp: Date.now()
  })
}

/**
 * 💡 Lighting failure report
 */
export const reportLightingFailure = (
  countyId: string,
  description: string
) => {
  addCivicEvent({
    id: 'evt_' + Date.now(),
    type: 'LIGHTING_FAILURE',
    countyId,
    description,
    timestamp: Date.now()
  })
}

/**
 * 🗑️ Waste alert report
 */
export const reportWasteIssue = (
  countyId: string,
  description: string
) => {
  addCivicEvent({
    id: 'evt_' + Date.now(),
    type: 'WASTE_ALERT',
    countyId,
    description,
    timestamp: Date.now()
  })
}

/**
 * 🏪 Revenue collection event (markets, permits, etc.)
 */
export const revenueCollected = (
  countyId: string,
  amount: number,
  source: string
) => {
  addCivicEvent({
    id: 'evt_' + Date.now(),
    type: 'REVENUE_COLLECTED',
    countyId,
    amount,
    description: `${source} revenue collected`,
    timestamp: Date.now()
  })
}
