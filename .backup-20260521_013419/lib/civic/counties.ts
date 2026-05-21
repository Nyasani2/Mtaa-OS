export type County = {
  id: string
  name: string
  parkingRevenue: number
  marketFees: number
  transportLevies: number
  businessPermits: number
  potholes: number
  lightingIssues: number
  wasteAlerts: number
}

export const counties: County[] = [
  {
    id: 'nairobi',
    name: 'Nairobi',
    parkingRevenue: 2400000,
    marketFees: 780000,
    transportLevies: 1100000,
    businessPermits: 540000,
    potholes: 128,
    lightingIssues: 44,
    wasteAlerts: 19
  },
  {
    id: 'mombasa',
    name: 'Mombasa',
    parkingRevenue: 1500000,
    marketFees: 620000,
    transportLevies: 480000,
    businessPermits: 310000,
    potholes: 76,
    lightingIssues: 22,
    wasteAlerts: 11
  },
  {
    id: 'kisumu',
    name: 'Kisumu',
    parkingRevenue: 900000,
    marketFees: 300000,
    transportLevies: 200000,
    businessPermits: 150000,
    potholes: 52,
    lightingIssues: 18,
    wasteAlerts: 7
  }
]
