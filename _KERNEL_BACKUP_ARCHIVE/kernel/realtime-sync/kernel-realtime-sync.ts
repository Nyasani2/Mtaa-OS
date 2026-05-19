class KernelRealtimeSync {

  sync(channel: string, payload: any) {

    console.log(
      "[REALTIME SYNC]",
      channel
    );

    return {
      synced: true,
      channel,
      payload
    };
  }
}

export const kernelRealtimeSync =
  new KernelRealtimeSync();
