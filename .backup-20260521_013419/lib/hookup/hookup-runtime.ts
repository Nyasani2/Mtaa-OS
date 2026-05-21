import { HookupSignalingEngine } from "./signaling/hookup-signaling-engine";
import { HookupLiveRoomEngine } from "./realtime/hookup-live-room-engine";
import { HookupVideoEngine } from "./video/hookup-video-engine";

/**
 * Compatibility layer for legacy Hookup screens
 */
export class HookupRuntime {
  roomId: string;
  userId: string;

  signaling: HookupSignalingEngine;
  room: HookupLiveRoomEngine;
  video: HookupVideoEngine;

  constructor(roomId: string, userId: string) {
    this.roomId = roomId;
    this.userId = userId;

    this.signaling = new HookupSignalingEngine(roomId, userId);
    this.room = new HookupLiveRoomEngine(roomId, userId);
    this.video = new HookupVideoEngine(userId);
  }

  async start() {
    await this.video.startLocalStream();
await this.room.join();
    await this.signaling.createOffer();
  }

  async reconnect() {
    await this.signaling.reconnect?.();
    await this.room.rejoin?.();
  }

  async teardown() {
    await this.video.stopStream?.();
    await this.room.leave?.();
    await this.signaling.disconnect?.();
  }
}
