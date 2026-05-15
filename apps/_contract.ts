/**
 * MTAA OS — Plugin Contract
 * Every app must implement this shape
 */

export type MTAAApp = {
  manifest: {
    id: string
    name: string
    icon?: string
    splash?: string
    version?: string
  }

  entry: {
    init?: () => Promise<void> | void
    mount?: () => Promise<void> | void
    unmount?: () => Promise<void> | void
    getExports?: () => any
  }
}
