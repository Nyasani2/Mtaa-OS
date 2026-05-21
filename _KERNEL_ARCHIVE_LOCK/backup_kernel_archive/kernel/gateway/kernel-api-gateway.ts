class KernelAPIGateway {

  route(
    service: string,
    payload: any
  ) {

    console.log(
      "[API ROUTE]",
      service
    );

    return {
      service,
      payload,
      routed: true
    };
  }
}

export const kernelAPIGateway =
  new KernelAPIGateway();
