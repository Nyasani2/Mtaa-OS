export type CivicEventType =
  | 'PARKING_PAYMENT'
  | 'POTHOLE_REPORTED'
  | 'POTHOLE_ASSIGNED'
  | 'POTHOLE_RESOLVED'
  | 'WASTE_ALERT'
  | 'LIGHTING_FAILURE'
  | 'REVENUE_COLLECTED'

export type CivicEvent = {
  id: string
  type: CivicEventType
  countyId: string
  amount?: number
  description: string
  timestamp: number
}

export const civicEvents: CivicEvent[] = [
  {
    id: 'evt_1',
    type: 'PARKING_PAYMENT',
    countyId: 'nairobi',
    amount: 200,
    description: 'Parking payment - CBD zone',
    timestamp: Date.now() - 1000 * 60 * 10
  },
  {
    id: 'evt_2',
    type: 'POTHOLE_REPORTED',
    countyId: 'nairobi',
    description: 'Pothole reported on Waiyaki Way',
    timestamp: Date.now() - 1000 * 60 * 50
  },
  {
    id: 'evt_3',
    type: 'REVENUE_COLLECTED',
    countyId: 'mombasa',
    amount: 50000,
    description: 'Market fee collection',
    timestamp: Date.now() - 1000 * 60 * 120
  }
]
