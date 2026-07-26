export interface NotificationAdapter {
  sendPush: (userId: string, title: string, body: string) => Promise<boolean>;
  markRead: (notificationId: string) => Promise<boolean>;
}

export const notificationAdapter: NotificationAdapter = {
  async sendPush(userId: string, title: string, body: string) {
    console.warn('NotificationAdapter.sendPush not implemented');
    return false;
  },
  async markRead(notificationId: string) {
    console.warn('NotificationAdapter.markRead not implemented');
    return false;
  },
};
