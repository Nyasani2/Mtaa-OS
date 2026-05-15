/**
 * MTAA OS — Safe Evolution Gate
 * Prevents ASIS from breaking system stability
 */

export type EvolutionRisk = 'low' | 'medium' | 'high' | 'blocked'

export class SafeEvolutionGate {

  assess(codeBefore: string, codeAfter: string): EvolutionRisk {

    // 1. forbidden APIs (hard block)
    const forbidden = [
      'process.exit',
      'globalThis',
      'child_process',
      'fs.unlink',
      'rm -rf',
      'kernel/',
      'eval(',
      'Function('
    ]

    for (const f of forbidden) {
      if (codeAfter.includes(f) && !codeBefore.includes(f)) {
        return 'blocked'
      }
    }

    // 2. size explosion check
    const sizeDiff = Math.abs(codeAfter.length - codeBefore.length)
    if (sizeDiff > 20000) return 'high'

    // 3. structural instability check
    const badPatterns = [
      'while(true)',
      'setInterval(',
      'setTimeout(() => setTimeout',
    ]

    if (badPatterns.some(p => codeAfter.includes(p))) {
      return 'high'
    }

    // 4. minor changes = safe
    const minorChangeRatio = sizeDiff / Math.max(codeBefore.length, 1)

    if (minorChangeRatio < 0.1) return 'low'
    if (minorChangeRatio < 0.4) return 'medium'

    return 'high'
  }
}

export const safeEvolutionGate = new SafeEvolutionGate()
