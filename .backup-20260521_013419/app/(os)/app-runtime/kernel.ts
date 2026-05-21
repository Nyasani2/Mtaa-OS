import { appRegistry } from './registry'

export type KernelState = {
  ready: boolean
  appsLoaded: boolean
  realtimeReady: boolean
  authReady: boolean
}

class MTAAKernel {
  private state: KernelState = {
    ready: false,
    appsLoaded: false,
    realtimeReady: false,
    authReady: false,
  }

  async boot() {
    await this.restoreSession()
    await this.loadApps()
    await this.initializeRealtime()

    this.state.ready = true
  }

  async restoreSession() {
    this.state.authReady = true
  }

  async loadApps() {
    console.log('Loading apps:', appRegistry.length)
    this.state.appsLoaded = true
  }

  async initializeRealtime() {
    this.state.realtimeReady = true
  }

  getState() {
    return this.state
  }
}

export const kernel = new MTAAKernel()
