'use client';

import { create } from 'zustand';
import { generateId } from '@/lib/utils';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatState {
  messages: ChatMessage[];
  streaming: boolean;
  addUserMessage: (content: string) => ChatMessage;
  addAssistantMessage: (content: string) => void;
  appendToLast: (delta: string) => void;
  setStreaming: (v: boolean) => void;
  clear: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  streaming: false,

  addUserMessage(content) {
    const msg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    set((s) => ({ messages: [...s.messages, msg] }));
    return msg;
  },

  addAssistantMessage(content) {
    const msg: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content,
      timestamp: new Date().toISOString(),
    };
    set((s) => ({ messages: [...s.messages, msg] }));
  },

  appendToLast(delta) {
    set((s) => {
      const msgs = [...s.messages];
      if (msgs.length && msgs[msgs.length - 1].role === 'assistant') {
        msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: msgs[msgs.length - 1].content + delta };
      } else {
        msgs.push({ id: generateId(), role: 'assistant', content: delta, timestamp: new Date().toISOString() });
      }
      return { messages: msgs };
    });
  },

  setStreaming(streaming) { set({ streaming }); },

  clear() { set({ messages: [] }); },
}));
