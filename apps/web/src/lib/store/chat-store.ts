'use client';

import { create } from 'zustand';

export interface CitationData {
  documentId: string;
  chunkIndex: number;
  pageNumber?: number | null;
  section?: string | null;
  documentTitle?: string;
}

interface ChatToken {
  content: string;
  index: number;
}

interface ChatState {
  activeConversationId: string | null;
  streamingTokens: ChatToken[];
  fullContent: string;
  isStreaming: boolean;
  streamError: string | null;
  citations: CitationData[];

  setActiveConversation: (id: string | null) => void;
  startStream: () => void;
  addToken: (token: string) => void;
  setCitations: (citations: CitationData[]) => void;
  setStreamError: (error: string | null) => void;
  endStream: () => void;
  resetStream: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  activeConversationId: null,
  streamingTokens: [],
  fullContent: '',
  isStreaming: false,
  streamError: null,
  citations: [],

  setActiveConversation: (id) => set({ activeConversationId: id }),

  startStream: () =>
    set({
      isStreaming: true,
      streamError: null,
      streamingTokens: [],
      fullContent: '',
      citations: [],
    }),

  addToken: (token) =>
    set((state) => ({
      streamingTokens: [
        ...state.streamingTokens,
        { content: token, index: state.streamingTokens.length },
      ],
      fullContent: state.fullContent + token,
    })),

  setCitations: (citations) => set({ citations }),

  setStreamError: (error) => set({ streamError: error, isStreaming: false }),

  endStream: () => set({ isStreaming: false }),

  resetStream: () =>
    set({
      streamingTokens: [],
      fullContent: '',
      isStreaming: false,
      streamError: null,
      citations: [],
    }),
}));
