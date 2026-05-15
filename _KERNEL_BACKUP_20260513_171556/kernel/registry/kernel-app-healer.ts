/**
 * MTAA OS — Auto App Healer
 * Detects missing apps and generates safe stubs
 */

import fs from 'fs'
import path from 'path'

const APPS_DIR = path.resolve(process.cwd(), 'apps')

export function scanAndHealApps() {
  const apps = fs.readdirSync(APPS_DIR)

  const healed = []

  for (const app of apps) {
    const entryPath = path.join(APPS_DIR, app, 'entry.ts')

    if (!fs.existsSync(entryPath)) {
      const stub = `
export const manifest = {
  id: "${app}",
  name: "${app}",
  systemApp: false,
  status: "auto-generated"
}

export const entry = {
  init: async () => console.log("${app} initialized (stub)"),
  getExports: () => ({})
}
`
      fs.writeFileSync(entryPath, stub)
      healed.push(app)
    }
  }

  return {
    healed,
    total: apps.length
  }
}
