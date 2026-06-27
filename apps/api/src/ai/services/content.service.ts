import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';

@Injectable()
export class ContentService {
  constructor(private prisma: PrismaService) {}

  async getDocumentContent(documentId: string): Promise<string> {
    const latestVersion = await this.prisma.documentVersion.findFirst({
      where: { documentId },
      orderBy: { versionNumber: 'desc' },
      include: { chunks: { orderBy: { chunkIndex: 'asc' } } },
    });
    if (!latestVersion) {
      const doc = await this.prisma.document.findUnique({ where: { id: documentId } });
      if (!doc) throw new Error('Document not found');
      return doc.description || '';
    }
    return latestVersion.chunks.map((c) => c.content).join('\n');
  }

  async getCollectionContent(collectionId: string): Promise<string> {
    const docs = await this.prisma.document.findMany({
      where: { collectionId },
      select: { id: true, title: true },
    });
    const parts: string[] = [];
    for (const doc of docs) {
      const content = await this.getDocumentContent(doc.id);
      parts.push(`# ${doc.title}\n\n${content}`);
    }
    return parts.join('\n\n---\n\n');
  }

  async getDocumentMetadata(documentId: string) {
    return this.prisma.document.findUnique({
      where: { id: documentId },
      select: { id: true, title: true, fileType: true },
    });
  }
}
