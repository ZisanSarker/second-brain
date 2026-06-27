import apiClient from './client';

export const chatApi = {
  sendMessage: (
    message: string,
    conversationId?: string,
    temperature?: number,
    maxTokens?: number,
    model?: string,
    signal?: AbortSignal,
  ) => {
    const url = `${apiClient.defaults.baseURL}/chat`;
    const controller = new AbortController();
    const mergedSignal = signal || controller.signal;

    const body: Record<string, unknown> = { message };
    if (conversationId) body.conversationId = conversationId;
    if (temperature) body.temperature = temperature;
    if (maxTokens) body.maxTokens = maxTokens;
    if (model) body.model = model;

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader(
      'Authorization',
      `Bearer ${JSON.parse(localStorage.getItem('auth_tokens') || '{}').accessToken || ''}`,
    );
    const ws = localStorage.getItem('current_workspace');
    if (ws) {
      xhr.setRequestHeader('x-workspace-id', JSON.parse(ws).id);
    }
    xhr.send(JSON.stringify(body));

    return { xhr, controller };
  },

  regenerate: (conversationId: string, temperature?: number) => {
    const url = `${apiClient.defaults.baseURL}/chat/${conversationId}/regenerate`;
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader(
      'Authorization',
      `Bearer ${JSON.parse(localStorage.getItem('auth_tokens') || '{}').accessToken || ''}`,
    );
    const ws = localStorage.getItem('current_workspace');
    if (ws) {
      xhr.setRequestHeader('x-workspace-id', JSON.parse(ws).id);
    }
    xhr.send(JSON.stringify({ temperature }));
    return xhr;
  },

  stopGeneration: (conversationId: string) =>
    apiClient.post(`/chat/${conversationId}/stop`).then((r) => r.data),

  listConversations: (searchQuery?: string) =>
    apiClient.get('/chat/conversations', { params: { q: searchQuery } }).then((r) => r.data),

  createConversation: (data?: { title?: string; systemPromptId?: string }) =>
    apiClient.post('/chat/conversations', data || {}).then((r) => r.data),

  getConversation: (id: string) => apiClient.get(`/chat/conversations/${id}`).then((r) => r.data),

  updateConversation: (id: string, data: { title?: string; pin?: boolean; archive?: boolean }) =>
    apiClient.patch(`/chat/conversations/${id}`, data).then((r) => r.data),

  deleteConversation: (id: string) =>
    apiClient.delete(`/chat/conversations/${id}`).then((r) => r.data),

  duplicateConversation: (id: string) =>
    apiClient.post(`/chat/conversations/${id}/duplicate`).then((r) => r.data),

  getMessages: (conversationId: string, limit?: number, offset?: number) =>
    apiClient
      .get(`/chat/conversations/${conversationId}/messages`, { params: { limit, offset } })
      .then((r) => r.data),

  getSuggestions: () => apiClient.get('/chat/suggestions').then((r) => r.data),

  getModels: () => apiClient.get('/chat/models').then((r) => r.data),
};
