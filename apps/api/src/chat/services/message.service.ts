import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';

@Injectable()
export class MessageService {
  constructor(private prisma: PrismaService) {}

  async addMessage(
    workspaceId: string,
    userId: string,
    conversationId: string,
    role: string,
    content: string,
    tokenCount = 0,
    parentId?: string,
  ) {
    await this.requireConversationAccess(workspaceId, userId, conversationId);
    return this.prisma.message.create({
      data: {
        conversationId,
        senderId: role === 'user' ? userId : null,
        role,
        content,
        tokenCount,
        parentId: parentId || null,
      },
    });
  }

  async getMessages(
    workspaceId: string,
    userId: string,
    conversationId: string,
    limit = 100,
    offset = 0,
  ) {
    await this.requireConversationAccess(workspaceId, userId, conversationId);
    const [data, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
        skip: offset,
        take: limit,
        include: {
          citations: {
            include: { chunk: { include: { version: { select: { documentId: true } } } } },
          },
        },
      }),
      this.prisma.message.count({ where: { conversationId } }),
    ]);
    return { data, total };
  }

  async getLastMessage(conversationId: string) {
    return this.prisma.message.findFirst({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getConversationMessages(conversationId: string, limit = 50) {
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }

  async markLastAsNotFinal(workspaceId: string, userId: string, conversationId: string) {
    await this.requireConversationAccess(workspaceId, userId, conversationId);
    const lastMsg = await this.getLastMessage(conversationId);
    if (lastMsg && lastMsg.role === 'assistant') {
      await this.prisma.message.update({
        where: { id: lastMsg.id },
        data: { metadata: { ...(lastMsg.metadata as Record<string, unknown>), final: false } },
      });
      return lastMsg.id;
    }
    return null;
  }

  async updateTokens(messageId: string, tokenCount: number) {
    await this.prisma.message.update({
      where: { id: messageId },
      data: { tokenCount },
    });
  }

  private async requireConversationAccess(
    workspaceId: string,
    userId: string,
    conversationId: string,
  ) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!member) throw new ForbiddenException('Not a member of this workspace');
    const conv = await this.prisma.conversation.findFirst({
      where: { id: conversationId, workspaceId, deletedAt: null },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
  }
}
