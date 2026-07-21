import api from './auth.api.js';

export const getConversations = async () => {
  const res = await api.get('/messages');
  return res.data;
};

export const getMessagesForConversation = async (conversationId, page = 1, limit = 50) => {
  const res = await api.get(`/messages/${conversationId}?page=${page}&limit=${limit}`);
  return res.data;
};
