type PermissionRequest = {
  app: string;
  permission: string;
};

class KernelPermissions {

  private granted: PermissionRequest[] = [];

  grant(request: PermissionRequest) {

    this.granted.push(request);

    return true;
  }

  has(app: string, permission: string) {

    return this.granted.some(
      p =>
        p.app === app &&
        p.permission === permission
    );
  }
}

export const kernelPermissions =
  new KernelPermissions();
