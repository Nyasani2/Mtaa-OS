/**
 * MTAA OS — Execution Sandbox (FINAL SAFE MODE)
 * Never throws to kernel
 */

export type SandboxResult<T = any> = {
  ok: boolean
  result?: T
  error?: string
}

export class KernelSandbox {
  async run<T>(fn: () => Promise<T> | T): Promise<SandboxResult<T>> {
    try {
      const result = await Promise.resolve(fn())
      return { ok: true, result }
    } catch (e: any) {
      return {
        ok: false,
        error: e?.message || String(e)
      }
    }
  }
}

export const kernelSandbox = new KernelSandbox()
