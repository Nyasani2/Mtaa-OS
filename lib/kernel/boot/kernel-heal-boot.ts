/**
 * MTAA OS — Boot Healing Layer
 */

import { scanAndHealApps } from '../registry/kernel-app-healer'

export async function bootHealingLayer() {
  try {
    const result = scanAndHealApps()

    console.log('[HEALER] Apps fixed:', result.healed.length)
    console.log('[HEALER] Total apps scanned:', result.total)

    return result
  } catch (e) {
    console.log('[HEALER ERROR]', e)
  }
}
