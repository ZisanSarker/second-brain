import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';

export interface CitationInput {
  chunkId: string;
  relevanceScore: number;
  documentId: string;
  chunkIndex: number;
  pageNumber?: number | null;
  section?: string | null;
  documentTitle?: string;
}

export interface CitationResult {
  id: string;
  messageId: string;
  chunkId: string;
  relevanceScore: number;
  documentId: string;
  chunkIndex: number;
  pageNumber?: number | null;
  section?: string | null;
  documentTitle?: string;
}

@Injectable()
export class CitationService {
  constructor(private prisma: PrismaService) {}

  async saveCitations(messageId: string, citations: CitationInput[]): Promise<CitationResult[]> {
    if (citations.length === 0) return [];

    await this.prisma.citation.createMany({
      data: citations.map((c) => ({
        messageId,
        chunkId: c.chunkId,
        relevanceScore: c.relevanceScore,
      })),
    });

    const created = await this.prisma.citation.findMany({
      where: { messageId },
      include: { chunk: { include: { version: { select: { documentId: true } } } } },
    });

    return created.map((c) => ({
      id: c.id,
      messageId: c.messageId,
      chunkId: c.chunkId,
      relevanceScore: c.relevanceScore,
      documentId: c.chunk.version.documentId,
      chunkIndex: c.chunk.chunkIndex,
      pageNumber: c.chunk.pageNumber,
      section:
        ((c.chunk.metadata as Record<string, unknown>)?.section as string | undefined) ?? null,
      documentTitle: undefined,
    }));
  }

  async getCitationsForMessage(messageId: string) {
    return this.prisma.citation.findMany({
      where: { messageId },
      include: { chunk: true },
    });
  }
}
