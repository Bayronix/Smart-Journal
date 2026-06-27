'use client';

import ChatView from '@/components/chat/ChatView';

export default function ChatPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-56px)] lg:h-screen">
      <ChatView />
    </div>
  );
}
