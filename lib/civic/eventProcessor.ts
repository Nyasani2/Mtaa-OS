import { counties } from './counties'
import { CivicEvent, civicEvents } from './events'

/**
 * 🧠 MTAA CIVIC EVENT PROCESSOR
 * Turns raw events into system state changes
 */

export type CountyState = {
  revenue: Record<string, number>
  issues: number
}

export const processEvents = (events: CivicEvent[]) => {
  const state: Record<string, CountyState> = {}

  // initialize state
  for (const c of counties) {
    state[c.id] = {
      revenue: {
        parking: 0,
        markets: 0,
        transport: 0,
        permits: 0
      },
      issues: 0
    }
  }

  // process each event
  for (const e of events) {
    const county = state[e.countyId]
    if (!county) continue

    switch (e.type) {
      case 'PARKING_PAYMENT':
        county.revenue.parking += e.amount || 0
        break

      case 'REVENUE_COLLECTED':
        county.revenue.markets += e.amount || 0
        break

      case 'POTHOLE_REPORTED':
      case 'LIGHTING_FAILURE':
      case 'WASTE_ALERT':
        county.issues += 1
        break

      default:
        break
    }
  }

  return state
}

/**
 * 📊 Get national totals
 */
export const getNationalSummary = (events: CivicEvent[]) => {
  let totalRevenue = 0
  let totalIssues = 0

  for (const e of events) {
    if (e.amount) totalRevenue += e.amount

    if (
      e.type === 'POTHOLE_REPORTED' ||
      e.type === 'LIGHTING_FAILURE' ||
      e.type === 'WASTE_ALERT'
    ) {
      totalIssues += 1
    }
  }

  return {
    totalRevenue,
    totalIssues,
    eventCount: events.length
  }
}
