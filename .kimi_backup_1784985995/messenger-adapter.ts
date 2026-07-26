export interface MessengerAdapter {
  sendMessage: (toUserId: string, content: string) => Promise<boolean>;
  getThread: (threadId: string) => Promise<any[]>;
}

export const messengerAdapter: MessengerAdapter = {
  async sendMessage(toUserId: string, content: string) {
    console.warn('MessengerAdapter.sendMessage not implemented');
    return false;
  },
  async getThread(threadId: string) {
    console.warn('MessengerAdapter.getThread not implemented');
    return [];
  },
};
