/**
 * MTAA OS — Runtime Registry (SAFE MODE)
 * NO imports, NO file resolution at runtime
 * ONLY metadata map (bundle-safe)
 */

export const APP_REGISTRY = [
  {
    id: "wallet",
    path: "apps/wallet/mtaa.app.ts"
  },
  {
    id: "appstore",
    path: "apps/appstore/asis/entry.ts"
  },
  {
    id: "civic",
    path: "apps/civic/mtaa.app.ts"
  }
]

export function getAppPath(id: string) {
  return APP_REGISTRY.find(a => a.id === id)?.path
}
