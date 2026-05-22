export interface NotificationEngine {
  send: (payload: any) => void;
  subscribe: (callback: (notification: any) => void) => () => void;
}

export function createNotificationEngine(): NotificationEngine {
  return {
    send: () => {},
    subscribe: () => () => {},
  };
}
