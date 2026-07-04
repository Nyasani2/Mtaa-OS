export type Message = any;
export type Conversation = any;
export async function getConversations(userId: string) { return { data: [], error: null }; }
export async function getMessages(conversationId: string) { return { data: [], error: null }; }
export async function sendMessage(conversationId: string, content: string) { return { data: null, error: null }; }
