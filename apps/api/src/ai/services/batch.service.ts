import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { TaskService } from './task.service';

@Injectable()
export class BatchService {
  constructor(
    private prisma: PrismaService,
    private taskService: TaskService,
  ) {}

  async batchGenerate(documentId: string, types: string[]) {
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
      select: { workspaceId: true },
    });
    if (!doc) throw new Error('Document not found');

    const parentTask = await this.taskService.create({
      workspaceId: doc.workspaceId,
      type: 'BATCH',
      documentId,
      metadata: { types },
    });

    for (const type of types) {
      await this.taskService.create({
        workspaceId: doc.workspaceId,
        type,
        documentId,
        parentTaskId: parentTask.id,
      });
    }

    return parentTask;
  }

  async batchGenerateCollection(collectionId: string, types: string[]) {
    const coll = await this.prisma.collection.findUnique({
      where: { id: collectionId },
      select: { workspaceId: true },
    });
    if (!coll) throw new Error('Collection not found');

    const docs = await this.prisma.document.findMany({
      where: { collectionId },
      select: { id: true },
    });

    const parentTask = await this.taskService.create({
      workspaceId: coll.workspaceId,
      type: 'BATCH',
      collectionId,
      metadata: { types, documentCount: docs.length },
    });

    for (const doc of docs) {
      for (const type of types) {
        await this.taskService.create({
          workspaceId: coll.workspaceId,
          type,
          documentId: doc.id,
          parentTaskId: parentTask.id,
        });
      }
    }

    return parentTask;
  }
}
