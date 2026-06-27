import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';

const MENTION_REGEX = /@(\w+)/g;

@Injectable()
export class MentionService {
  constructor(private prisma: PrismaService) {}

  async parseAndCreate(
    workspaceId: string,
    entityType: string,
    entityId: string,
    content: string,
    mentionerId: string,
  ) {
    const usernames = [...content.matchAll(MENTION_REGEX)].map((m) => m[1]);
    if (usernames.length === 0) return [];

    const users = await this.prisma.user.findMany({
      where: {
        OR: usernames.map((name) => ({ name: { equals: name, mode: 'insensitive' } })),
        memberships: { some: { workspaceId } },
      },
      select: { id: true, name: true },
    });

    const mentions = [];
    for (const user of users) {
      const idx = content.indexOf(`@${user.name}`);
      const mention = await this.prisma.mention.create({
        data: {
          workspaceId,
          entityType,
          entityId,
          mentionerId,
          mentionedUserId: user.id,
          startIndex: idx >= 0 ? idx : null,
          endIndex: idx >= 0 ? idx + (user.name?.length ?? 0) + 1 : null,
        },
      });
      mentions.push(mention);
    }
    return mentions;
  }
}
