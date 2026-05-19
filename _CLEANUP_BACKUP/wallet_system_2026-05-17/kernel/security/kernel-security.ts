class KernelSecurity {

  validateAccess(
    app: string,
    resource: string
  ) {

    console.log(
      "[KERNEL SECURITY]",
      app,
      resource
    );

    return true;
  }
}

export const kernelSecurity =
  new KernelSecurity();
