let recentApps: string[] = []

export function pushRecent(appId: string) {
  recentApps = [appId, ...recentApps.filter(a => a !== appId)].slice(0, 6)
}

export function getRecentApps() {
  return recentApps
}
