/**
 * MTAA OS — SAFE APP DISCOVERY LAYER
 */

import fs from 'fs'
import path from 'path'

export function discoverApps() {
  const appsDir = path.resolve(process.cwd(), 'apps')

  const dirs = fs.readdirSync(appsDir)

  return dirs
    .filter(d => fs.existsSync(path.join(appsDir, d, 'entry.ts')))
    .map(d => ({
      id: d,
      path: `../../apps/${d}/entry`
    }))
}
