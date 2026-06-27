import apiClient from './client';

export const aiApi = {
  // Summary
  generateSummary: (data: {
    documentId?: string;
    collectionId?: string;
    customPrompt?: string;
    language?: string;
    model?: string;
  }) => apiClient.post('/ai/summary/generate', data).then((r) => r.data),
  listSummaries: (documentId?: string, collectionId?: string) =>
    apiClient.get('/ai/summary', { params: { documentId, collectionId } }).then((r) => r.data),

  // Flashcards
  generateFlashcards: (data: {
    documentId?: string;
    collectionId?: string;
    customPrompt?: string;
    language?: string;
    model?: string;
  }) => apiClient.post('/ai/flashcards/generate', data).then((r) => r.data),
  listFlashcards: (documentId?: string, collectionId?: string) =>
    apiClient.get('/ai/flashcards', { params: { documentId, collectionId } }).then((r) => r.data),

  // Quiz
  generateQuiz: (data: {
    documentId?: string;
    collectionId?: string;
    customPrompt?: string;
    language?: string;
    model?: string;
  }) => apiClient.post('/ai/quiz/generate', data).then((r) => r.data),
  listQuizzes: (documentId?: string, collectionId?: string) =>
    apiClient.get('/ai/quiz', { params: { documentId, collectionId } }).then((r) => r.data),

  // Notes
  generateNotes: (data: {
    documentId?: string;
    collectionId?: string;
    customPrompt?: string;
    language?: string;
    model?: string;
  }) => apiClient.post('/ai/notes/generate', data).then((r) => r.data),
  listNotes: (documentId?: string, collectionId?: string) =>
    apiClient.get('/ai/notes', { params: { documentId, collectionId } }).then((r) => r.data),

  // Mind Map
  generateMindMap: (data: {
    documentId?: string;
    collectionId?: string;
    customPrompt?: string;
    language?: string;
    model?: string;
  }) => apiClient.post('/ai/mindmap/generate', data).then((r) => r.data),
  listMindMaps: (documentId?: string, collectionId?: string) =>
    apiClient.get('/ai/mindmap', { params: { documentId, collectionId } }).then((r) => r.data),

  // Comparison
  generateComparison: (data: {
    documentId?: string;
    collectionId?: string;
    customPrompt?: string;
    language?: string;
    model?: string;
  }) => apiClient.post('/ai/comparison/generate', data).then((r) => r.data),
  listComparisons: (documentId?: string, collectionId?: string) =>
    apiClient.get('/ai/comparison', { params: { documentId, collectionId } }).then((r) => r.data),

  // Translation
  generateTranslation: (data: {
    documentId?: string;
    collectionId?: string;
    language?: string;
    model?: string;
  }) => apiClient.post('/ai/translation/generate', data).then((r) => r.data),
  listTranslations: (documentId?: string, collectionId?: string) =>
    apiClient.get('/ai/translation', { params: { documentId, collectionId } }).then((r) => r.data),

  // Learning tools
  generateTakeaways: (data: { documentId?: string; collectionId?: string }) =>
    apiClient.post('/ai/learning/takeaways', data).then((r) => r.data),
  generateGlossary: (data: { documentId?: string; collectionId?: string }) =>
    apiClient.post('/ai/learning/glossary', data).then((r) => r.data),
  generateFAQ: (data: { documentId?: string; collectionId?: string }) =>
    apiClient.post('/ai/learning/faq', data).then((r) => r.data),
  generateStudyPlan: (data: { documentId?: string; collectionId?: string }) =>
    apiClient.post('/ai/learning/study-plan', data).then((r) => r.data),
  generateInterviewQuestions: (data: { documentId?: string; collectionId?: string }) =>
    apiClient.post('/ai/learning/interview-questions', data).then((r) => r.data),
  generateTimeline: (data: { documentId?: string; collectionId?: string }) =>
    apiClient.post('/ai/learning/timeline', data).then((r) => r.data),

  // Insights
  generateCrossDocumentInsights: (documentIds: string[]) =>
    apiClient.post('/ai/insights/cross-document', { documentIds }).then((r) => r.data),
  generateWorkspaceTrends: () =>
    apiClient.post('/ai/insights/workspace-trends').then((r) => r.data),

  // Batch
  batchGenerate: (documentId: string, types: string[]) =>
    apiClient.post('/ai/batch/generate', { documentId, types }).then((r) => r.data),
  batchGenerateCollection: (collectionId: string, types: string[]) =>
    apiClient.post('/ai/batch/generate-collection', { collectionId, types }).then((r) => r.data),

  // Tasks
  listTasks: (status?: string) =>
    apiClient.get('/ai/tasks', { params: { status } }).then((r) => r.data),
  getTask: (id: string) => apiClient.get(`/ai/tasks/${id}`).then((r) => r.data),
  retryTask: (id: string) => apiClient.post(`/ai/tasks/${id}/retry`).then((r) => r.data),
  cancelTask: (id: string) => apiClient.post(`/ai/tasks/${id}/cancel`).then((r) => r.data),

  // Generated content
  getContent: (id: string) => apiClient.get(`/ai/content/${id}`).then((r) => r.data),
  deleteContent: (id: string) => apiClient.delete(`/ai/content/${id}`).then((r) => r.data),

  // Templates
  createTemplate: (data: {
    name: string;
    type: string;
    systemPrompt: string;
    userPrompt?: string;
  }) => apiClient.post('/ai/templates', data).then((r) => r.data),
  listTemplates: (type?: string) =>
    apiClient.get('/ai/templates', { params: { type } }).then((r) => r.data),
  getTemplate: (id: string) => apiClient.get(`/ai/templates/${id}`).then((r) => r.data),
  updateTemplate: (id: string, data: any) =>
    apiClient.patch(`/ai/templates/${id}`, data).then((r) => r.data),
  deleteTemplate: (id: string) => apiClient.delete(`/ai/templates/${id}`).then((r) => r.data),
};
