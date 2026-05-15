/**
 * ASIS AI CORE — MTAA OS
 * Self-generating app intelligence system
 */

export type AppSpec = {
  id: string
  name: string
  domain: string
  purpose: string
  permissions: string[]
}

export class ASISCore {

  /**
   * Convert user intent → structured app spec
   */
  generateSpec(prompt: string): AppSpec {
    // lightweight deterministic transformation (no hallucination dependency)
    const id = prompt.toLowerCase().replace(/\s+/g, '-').slice(0, 20)

    return {
      id,
      name: this.capitalize(id),
      domain: this.detectDomain(prompt),
      purpose: prompt,
      permissions: this.inferPermissions(prompt)
    }
  }

  /**
   * Generate actual app module code
   */
  generateAppCode(spec: AppSpec): string {
    return `
export const manifest = {
  id: "${spec.id}",
  name: "${spec.name}",
  domain: "${spec.domain}",
  permissions: ${JSON.stringify(spec.permissions)},
  systemApp: false,
  installable: true
}

export const entry = {
  init: async () => {
    console.log("ASIS app initialized: ${spec.name}")
  },

  getExports: () => ({
    run: () => "${spec.purpose}"
  })
}
`
  }

  /**
   * Save app to filesystem (handled by CLI layer)
   */
  async createApp(prompt: string) {
    const spec = this.generateSpec(prompt)
    const code = this.generateAppCode(spec)

    return {
      spec,
      code,
      path: `/apps/${spec.id}/mtaa.app.ts`
    }
  }

  private detectDomain(prompt: string) {
    if (prompt.includes('wallet') || prompt.includes('pay')) return 'finance'
    if (prompt.includes('map') || prompt.includes('route')) return 'mobility'
    if (prompt.includes('chat') || prompt.includes('message')) return 'social'
    return 'utility'
  }

  private inferPermissions(prompt: string): string[] {
    const perms = ['read']

    if (prompt.includes('pay') || prompt.includes('wallet')) {
      perms.push('wallet:write')
    }

    if (prompt.includes('location')) {
      perms.push('location:read')
    }

    return perms
  }

  private capitalize(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1)
  }
}

export const asis = new ASISCore()
