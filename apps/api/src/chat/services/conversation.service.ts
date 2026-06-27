import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';

@Injectable()
export class ConversationService {
  constructor(private prisma: PrismaService) {}

  async create(workspaceId: string, creatorId: string, title?: string, systemPromptId?: string) {
    await this.requireMember(workspaceId, creatorId);
    return this.prisma.conversation.create({
      data: {
        workspaceId,
        creatorId,
        title: title || 'New Chat',
        systemPromptId: systemPromptId || null,
      },
      include: { systemPrompt: true },
    });
  }

  async findById(workspaceId: string, userId: string, id: string) {
    await this.requireMember(workspaceId, userId);
    const conv = await this.prisma.conversation.findFirst({
      where: { id, workspaceId, deletedAt: null },
      include: {
        systemPrompt: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 100,
          include: {
            citations: {
              include: { chunk: { include: { version: { select: { documentId: true } } } } },
            },
          },
        },
      },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    return conv;
  }

  async list(workspaceId: string, userId: string) {
    await this.requireMember(workspaceId, userId);
    return this.prisma.conversation.findMany({
      where: { workspaceId, deletedAt: null },
      orderBy: [{ pinnedAt: { sort: 'desc', nulls: 'last' } }, { updatedAt: 'desc' }],
      take: 50,
      include: { _count: { select: { messages: true } } },
    });
  }

  async update(
    workspaceId: string,
    userId: string,
    id: string,
    data: {
      title?: string;
      pinnedAt?: Date | null;
      archivedAt?: Date | null;
      systemPromptId?: string | null;
    },
  ) {
    await this.requireMember(workspaceId, userId);
    const conv = await this.prisma.conversation.findFirst({ where: { id, workspaceId } });
    if (!conv) throw new NotFoundException('Conversation not found');
    return this.prisma.conversation.update({
      where: { id },
      data,
    });
  }

  async softDelete(workspaceId: string, userId: string, id: string) {
    await this.requireMember(workspaceId, userId);
    const conv = await this.prisma.conversation.findFirst({ where: { id, workspaceId } });
    if (!conv) throw new NotFoundException('Conversation not found');
    return this.prisma.conversation.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async duplicate(workspaceId: string, userId: string, id: string) {
    await this.requireMember(workspaceId, userId);
    const original = await this.findById(workspaceId, userId, id);
    const newConv = await this.prisma.conversation.create({
      data: {
        workspaceId,
        creatorId: userId,
        title: `${original.title} (copy)`,
        model: original.model,
        systemPromptId: original.systemPromptId,
      },
    });
    if (original.messages.length > 0) {
      await this.prisma.message.createMany({
        data: original.messages.map((m) => ({
          conversationId: newConv.id,
          role: m.role,
          content: m.content,
          tokenCount: m.tokenCount,
          metadata: m.metadata as any,
          createdAt: m.createdAt,
        })) as any,
      });
    }
    return newConv;
  }

  async search(workspaceId: string, userId: string, query: string) {
    await this.requireMember(workspaceId, userId);
    return this.prisma.conversation.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        title: { contains: query, mode: 'insensitive' },
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });
  }

  async exportJson(workspaceId: string, userId: string, id: string) {
    const conv = await this.findById(workspaceId, userId, id);
    return {
      title: conv.title,
      model: conv.model,
      createdAt: conv.createdAt,
      messages: conv.messages.map((m) => ({
        role: m.role,
        content: m.content,
        citations: m.citations?.map((c) => ({
          documentId: c.chunk.version.documentId,
          chunkIndex: c.chunk.chunkIndex,
          pageNumber: c.chunk.pageNumber,
          section: ((c.chunk.metadata as Record<string, unknown>)?.section as string) ?? null,
        })),
      })),
    };
  }

  async exportMarkdown(workspaceId: string, userId: string, id: string): Promise<string> {
    const conv = await this.findById(workspaceId, userId, id);
    const lines: string[] = [`# ${conv.title}\n`];
    for (const m of conv.messages) {
      const prefix = m.role === 'user' ? '**You:**' : '**Assistant:**';
      lines.push(`${prefix}\n${m.content}\n`);
      if (m.citations && m.citations.length > 0) {
        lines.push(
          `*Sources: ${m.citations.map((c) => `Doc ${c.chunk.version.documentId}`).join(', ')}*\n`,
        );
      }
    }
    return lines.join('\n');
  }

  private async requireMember(workspaceId: string, userId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!member) throw new ForbiddenException('Not a member of this workspace');
  }
}
