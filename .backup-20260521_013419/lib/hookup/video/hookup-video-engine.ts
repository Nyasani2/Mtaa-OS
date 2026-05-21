export class HookupVideoEngine {
  userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async init() {
    return true;
  }

  async startLocalStream() {
    return {
      status: "STREAM_STARTED",
      user_id: this.userId,
    };
  }

  async stopStream() {
    return true;
  }

  toggleCamera(enabled: boolean) {
    return {
      camera: enabled ? "ON" : "OFF",
    };
  }
}
