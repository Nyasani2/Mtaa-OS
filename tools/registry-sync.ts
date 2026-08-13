/**
 * MTAA OS — Registry Sync Engine
 * Rebuilds apps.registry.json + loader map automatically
 */

import fs from 'fs'
import path from 'path'

const APPS_DIR = path.resolve(__dirname, '../../apps')
const REGISTRY_FILE = path.resolve(__dirname, '../../apps.registry.json')
const LOADER_FILE = path.resolve(__dirname, '../../apps/_loader.ts')

function getApps() {
  const dirs = fs.readdirSync(APPS_DIR, { withFileTypes: true })
    .filter((d: any) => d.isDirectory())
    .map((d: any) => d.name)

  return dirs.map((id: any) => ({
    id,
    manifestPath: `./apps/${id}/mtaa.app`
  }))
}

function writeRegistry(apps: any[]) {
  fs.writeFileSync(REGISTRY_FILE, JSON.stringify(apps, null, 2))
}

function writeLoader(apps: any[]) {
  const imports = apps.map((a: any) =>
    `import ${a.id} from './${a.id}/mtaa.app'`
  ).join('\n')

  const mapEntries = apps.map((a: any) =>
    `  "${a.id}": ${a.id}`
  ).join(',\n')

  const content = `
/**
 * AUTO-GENERATED FILE — DO NOT EDIT
 * MTAA OS App Loader Map
 */

${imports}

export const APP_MODULES = {
${mapEntries}
}

export function resolveApp(id: string) {
  return APP_MODULES[id]
}
`.trim()

  fs.writeFileSync(LOADER_FILE, content)
}

function sync() {
  const apps = getApps()

  console.log('🔄 Syncing apps:', apps.map((a: any) => a.id))

  writeRegistry(apps)
  writeLoader(apps)

  console.log('✅ Registry + Loader updated')
}

sync()
