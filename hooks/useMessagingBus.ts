import { useEffect, useRef } from "react";

type Message = {
  type: string;
  payload?: any;
};

class MessagingBus {
  private listeners: Record<string, ((msg: Message) => void)[]> = {};

  emit(channel: string, message: Message) {
    (this.listeners[channel] || []).forEach((fn) => fn(message));
  }

  subscribe(channel: string, fn: (msg: Message) => void) {
    if (!this.listeners[channel]) this.listeners[channel] = [];
    this.listeners[channel].push(fn);

    return () => {
      this.listeners[channel] = this.listeners[channel].filter((f) => f !== fn);
    };
  }
}

const globalBus = new MessagingBus();

export function useMessagingBus(channel: string) {
  const channelRef = useRef(channel);

  useEffect(() => {
    channelRef.current = channel;
  }, [channel]);

  return {
    emit: (message: Message) => globalBus.emit(channelRef.current, message),
    subscribe: (fn: (msg: Message) => void) =>
      globalBus.subscribe(channelRef.current, fn),
  };
}
