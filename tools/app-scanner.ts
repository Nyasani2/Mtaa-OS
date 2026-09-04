/**
 * MTAA OS — Autonomous App Scanner
 * Build-time plugin discovery system
 */

import fs from 'fs';
import path from 'path';

const APPS_DIR = path.resolve(__dirname, '../../apps')
const OUTPUT = path.resolve(__dirname, '../../apps.registry.json')

function scanApps() {
  const apps: any[] = []

  const dirs = fs.readdirSync(APPS_DIR)

  for (const dir of dirs) {
    const appPath = path.join(APPS_DIR, dir)
    const manifestPath = path.join(appPath, 'mtaa.app.ts')

    if (fs.existsSync(manifestPath)) {
      apps.push({
        id: dir,
        manifestPath: `./${dir}/mtaa.app`
      })
    }
  }

  fs.writeFileSync(OUTPUT, JSON.stringify(apps, null, 2))
  console.log('✅ Apps discovered:', apps.length)
}

scanApps()
