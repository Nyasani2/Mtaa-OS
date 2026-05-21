export type InstalledApp = {
  id: string
  installed: boolean
  enabled: boolean
  version: string
}

const installedApps: InstalledApp[] = []

export async function installApp(
  appId: string
) {
  const existing = installedApps.find(
    app => app.id === appId
  )

  if (existing) {
    return existing
  }

  const app = {
    id: appId,
    installed: true,
    enabled: false,
    version: '1.0.0',
  }

  installedApps.push(app)

  return app
}

export async function enableApp(
  appId: string
) {
  const app = installedApps.find(
    a => a.id === appId
  )

  if (!app) {
    throw new Error('App not installed')
  }

  app.enabled = true

  return app
}

export function getInstalledApps() {
  return installedApps
}
