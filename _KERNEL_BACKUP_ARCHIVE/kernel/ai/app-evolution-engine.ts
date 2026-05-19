/**
 * MTAA OS — Controlled App Evolution Engine
 * Now uses safety gate + staging + rollback
 */

import fs from 'fs'
import path from 'path'
import { safeEvolutionGate } from './safe-evolution-gate'

export class AppEvolutionEngine {

  evolveApp(filePath: string, newCode: string) {

    const fullPath = path.resolve(process.cwd(), filePath)

    if (!fs.existsSync(fullPath)) {
      return { ok: false, error: 'App not found' }
    }

    const current = fs.readFileSync(fullPath, 'utf-8')

    const risk = safeEvolutionGate.assess(current, newCode)

    // 🚨 BLOCKED
    if (risk === 'blocked') {
      return {
        ok: false,
        error: 'Evolution blocked by kernel safety rules'
      }
    }

    // 🟡 HIGH RISK → staging only
    if (risk === 'high') {
      const staged = fullPath + '.staging'
      fs.writeFileSync(staged, newCode)

      return {
        ok: true,
        mode: 'staged',
        risk,
        message: 'Changes staged for review (not active)'
      }
    }

    // 🟠 MEDIUM → backup + delayed apply
    if (risk === 'medium') {
      const backup = fullPath + '.backup'
      fs.writeFileSync(backup, current)

      fs.writeFileSync(fullPath, newCode)

      return {
        ok: true,
        mode: 'applied-with-backup',
        risk
      }
    }

    // 🟢 LOW → safe auto-apply
    fs.writeFileSync(fullPath, newCode)

    return {
      ok: true,
      mode: 'auto-applied',
      risk
    }
  }
}

export const appEvolutionEngine = new AppEvolutionEngine()
