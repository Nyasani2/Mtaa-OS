export interface IdentityAdapter {
  resolveUser: (identifier: string) => Promise<{ id: string; name: string } | null>;
  validateToken: (token: string) => Promise<boolean>;
}

export const identityAdapter: IdentityAdapter = {
  async resolveUser(identifier: string) {
    console.warn('IdentityAdapter.resolveUser not implemented');
    return null;
  },
  async validateToken(token: string) {
    console.warn('IdentityAdapter.validateToken not implemented');
    return false;
  },
};
