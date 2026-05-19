/**
 * MTAA OS — System Starter
 * Single command entrypoint
 */

import { kernelBootSequence } from './kernel-boot-sequence'

export async function startOS() {
  await kernelBootSequence?.boot()
}
