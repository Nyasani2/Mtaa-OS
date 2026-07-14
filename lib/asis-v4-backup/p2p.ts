/**
 * ASIS v4 P2P Network
 * WebRTC DataChannels for decentralized knowledge sharing
 */

export interface PeerConnection {
  id: string;
  connection: RTCPeerConnection;
  dataChannel: RTCDataChannel | null;
  connected: boolean;
}

export interface KnowledgeShard {
  id: string;
  type: 'concept' | 'fact' | 'trade' | 'conversation';
  data: any;
  timestamp: number;
  signature: string; // Simple hash for integrity
}

export class P2PNetwork {
  private peers: Map<string, PeerConnection> = new Map();
  private localId: string;
  private config: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };
  private onShardReceived: ((shard: KnowledgeShard) => void) | null = null;

  constructor() {
    this.localId = `asis-${Math.random().toString(36).slice(2, 10)}`;
  }

  getLocalId(): string {
    return this.localId;
  }

  async createPeer(peerId: string): Promise<PeerConnection> {
    const pc = new RTCPeerConnection(this.config);
    const peer: PeerConnection = {
      id: peerId,
      connection: pc,
      dataChannel: null,
      connected: false,
    };

    // Create data channel
    const channel = pc.createDataChannel('asis-knowledge', {
      ordered: true,
    });
    this.setupDataChannel(peer, channel);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        // In real impl, send candidate to peer via signaling server
        console.log(`[P2P] ICE candidate for ${peerId}`);
      }
    };

    pc.ondatachannel = (event) => {
      this.setupDataChannel(peer, event.channel);
    };

    this.peers.set(peerId, peer);
    return peer;
  }

  private setupDataChannel(peer: PeerConnection, channel: RTCDataChannel) {
    peer.dataChannel = channel;
    channel.onopen = () => {
      peer.connected = true;
      console.log(`[P2P] Connected to ${peer.id}`);
      // Send local identity
      this.sendToPeer(peer.id, { type: 'hello', id: this.localId });
    };
    channel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(peer.id, data);
      } catch {
        console.log('[P2P] Received non-JSON message');
      }
    };
    channel.onclose = () => {
      peer.connected = false;
      console.log(`[P2P] Disconnected from ${peer.id}`);
    };
  }

  private handleMessage(peerId: string, data: any) {
    if (data.type === 'shard' && this.onShardReceived) {
      this.onShardReceived(data.shard as KnowledgeShard);
    } else if (data.type === 'hello') {
      console.log(`[P2P] Peer ${data.id} says hello`);
    }
  }

  sendToPeer(peerId: string, data: any): boolean {
    const peer = this.peers.get(peerId);
    if (peer?.connected && peer.dataChannel?.readyState === 'open') {
      peer.dataChannel.send(JSON.stringify(data));
      return true;
    }
    return false;
  }

  broadcastShard(shard: KnowledgeShard): number {
    let sent = 0;
    const peerIds = Array.from(this.peers.keys());
    for (let i = 0; i < peerIds.length; i++) {
      if (this.sendToPeer(peerIds[i], { type: 'shard', shard })) {
        sent++;
      }
    }
    return sent;
  }

  onShard(callback: (shard: KnowledgeShard) => void) {
    this.onShardReceived = callback;
  }

  getConnectedPeers(): string[] {
    const connected: string[] = [];
    const entries = Array.from(this.peers.entries());
    for (let i = 0; i < entries.length; i++) {
      if (entries[i][1].connected) connected.push(entries[i][0]);
    }
    return connected;
  }

  disconnect(peerId?: string) {
    if (peerId) {
      const peer = this.peers.get(peerId);
      if (peer) {
        peer.connection.close();
        this.peers.delete(peerId);
      }
    } else {
      const ids = Array.from(this.peers.keys());
      for (let i = 0; i < ids.length; i++) {
        const peer = this.peers.get(ids[i]);
        if (peer) peer.connection.close();
      }
      this.peers.clear();
    }
  }

  // Create offer (for signaling server integration)
  async createOffer(peerId: string): Promise<RTCSessionDescriptionInit | null> {
    const peer = this.peers.get(peerId);
    if (!peer) return null;
    const offer = await peer.connection.createOffer();
    await peer.connection.setLocalDescription(offer);
    return offer;
  }

  // Accept answer
  async acceptAnswer(peerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const peer = this.peers.get(peerId);
    if (peer) {
      await peer.connection.setRemoteDescription(answer);
    }
  }
}

export const p2pNetwork = new P2PNetwork();
