class KernelNavigation {
  resolve(domain: string) {
    if (!domain.startsWith('/')) {
      return `/${domain}`;
    }
    return domain;
  }
}

export const kernelNavigation = new KernelNavigation();
