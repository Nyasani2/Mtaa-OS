import {
  HookupSignalingEngine
} from "./signaling/hookup-signaling-engine";

import {
  HookupLiveRoomEngine
} from "./realtime/hookup-live-room-engine";

import {
  HookupVideoEngine
} from "./video/hookup-video-engine";

export class HookupKernel {
  private roomId: string;
  private userId: string;

  private signaling: HookupSignalingEngine;
  private liveRoom: HookupLiveRoomEngine;
  private video: HookupVideoEngine;

  private state:
    | "IDLE"
    | "CONNECTING"
    | "LIVE"
    | "ERROR"
    | "RECONNECTING" = "IDLE";

  constructor(roomId: string, userId: string) {
    this.roomId = roomId;
    this.userId = userId;

    this.signaling =
      new HookupSignalingEngine(roomId, userId);

    this.liveRoom =
      new HookupLiveRoomEngine(roomId, userId);

    this.video =
      new HookupVideoEngine(userId);
  }

  async startRoom() {
    try {
      this.state = "CONNECTING";

      await this.signaling.connect?.();
      await this.liveRoom.join?.();
      await this.video.init?.();

      this.state = "LIVE";
    } catch (err) {
      console.error("[HOOKUP_KERNEL_ERROR]", err);

      this.state = "ERROR";

      throw err;
    }
  }

  async startLocalStream() {
    return this.video.startLocalStream?.();
  }

  async createOffer() {
    return this.signaling.createOffer?.();
  }

  async reconnect() {
    try {
      this.state = "RECONNECTING";

      await this.signaling.reconnect?.();
      await this.liveRoom.rejoin?.();

      this.state = "LIVE";
    } catch (err) {
      this.state = "ERROR";

      throw err;
    }
  }

  async teardown() {
    await this.video.stopStream?.();
    await this.liveRoom.leave?.();
    await this.signaling.disconnect?.();

    this.state = "IDLE";
  }

  getState() {
    return this.state;
  }
}
