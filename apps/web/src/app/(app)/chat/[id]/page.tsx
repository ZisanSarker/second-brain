'use client';

import { use } from 'react';
import { ChatLayout } from '@/components/chat/ChatLayout';

export default function ChatConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div className="h-[calc(100vh-4rem)]">
      <ChatLayout conversationId={id} />
    </div>
  );
}
