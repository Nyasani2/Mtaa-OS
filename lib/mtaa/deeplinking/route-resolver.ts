// lib/mtaa/deeplinking/route-resolver.ts
export interface RouteMapping { pattern: string; route: string; params: string[]; }

const ROUTE_MAPPINGS: RouteMapping[] = [
  { pattern: '/tribes/:id', route: '/(apps)/tribes/[id]', params: ['id'] },
  { pattern: '/wallet/send', route: '/(os)/wallet/send', params: [] },
  { pattern: '/wallet/receive', route: '/(os)/wallet/receive', params: [] },
  { pattern: '/shop/product/:id', route: '/(apps)/shop/product/[id]', params: ['id'] },
  { pattern: '/marketplace/item/:id', route: '/(apps)/marketplace/item/[id]', params: ['id'] },
  { pattern: '/jobs/:id', route: '/(apps)/jobs/[id]', params: ['id'] },
  { pattern: '/mtaxi/ride/:id', route: '/(apps)/mtaxi/ride/[id]', params: ['id'] },
  { pattern: '/mtruck/shipment/:id', route: '/(apps)/mtruck/shipment/[id]', params: ['id'] },
  { pattern: '/health/appointment/:id', route: '/(apps)/health/appointment/[id]', params: ['id'] },
  { pattern: '/education/course/:id', route: '/(apps)/education/course/[id]', params: ['id'] },
  { pattern: '/civic/report/:id', route: '/(apps)/civic/report/[id]', params: ['id'] },
  { pattern: '/settings/:section', route: '/(os)/settings/[section]', params: ['section'] },
];

class RouteResolver {
  resolve(path: string): { route: string; params: Record<string, string> }|null {
    for (const mapping of ROUTE_MAPPINGS) {
      const match = this.matchPattern(path, mapping.pattern);
      if (match) return { route: mapping.route, params: match };
    }
    return null;
  }

  private matchPattern(path: string, pattern: string): Record<string, string>|null {
    const pathParts = path.split('/').filter(Boolean);
    const patternParts = pattern.split('/').filter(Boolean);
    if (pathParts.length !== patternParts.length) return null;
    const params: Record<string, string> = {};
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) params[patternParts[i].slice(1)] = pathParts[i];
      else if (patternParts[i] !== pathParts[i]) return null;
    }
    return params;
  }
}
export const routeResolver = new RouteResolver();
