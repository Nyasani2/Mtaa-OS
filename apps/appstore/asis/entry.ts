import { asisEngine } from '../@/lib/kernel/ai/asis-engine'
import { kernelLiveRegistry } from '../@/lib/kernel/registry/kernel-live-registry'
import { liveEventBus } from '../@/lib/kernel/registry/kernel-live-events'

export const manifest = {
  id: "asis",
  name: "ASIS AI",
  systemApp: true
}

export const entry = {
  init: async () => {
    console.log("ASIS LIVE SYSTEM ONLINE")
  },

  generateApp: async (prompt: string) => {
    const id = prompt.toLowerCase().replace(/\s/g, '-').slice(0, 20)

    const result = asisEngine.generateApp({
      id,
      name: prompt
    })

    // LIVE ACTIVATION
    kernelLiveRegistry.register(id)
    liveEventBus.refresh()

    return result
  },

  getExports: () => ({
    generateApp: (prompt: string) => {
      const id = prompt.toLowerCase().replace(/\s/g, '-').slice(0, 20)

      const result = asisEngine.generateApp({
        id,
        name: prompt
      })

      kernelLiveRegistry.register(id)
      liveEventBus.refresh()

      return result
    }
  })
}
