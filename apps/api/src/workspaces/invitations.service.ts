import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../shared/services/prisma.service';
import { MailService } from '../email/mail.service';
import { workspaceInviteTemplate } from '../email/templates/workspace-invite.template';
import { CreateInvitationDto } from './dto/workspace.dto';

@Injectable()
export class InvitationsService {
  constructor(
    private prisma: PrismaService,
    private mail: MailService,
  ) {}

  async create(workspaceId: string, userId: string, dto: CreateInvitationDto) {
    // Verify inviter has admin role
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });

    if (!member || (member.role !== 'ADMIN' && member.role !== 'OWNER')) {
      throw new ForbiddenException('Only admins can send invitations');
    }

    // Check if user with this email already exists as member
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      const existingMember = await this.prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: { workspaceId, userId: existingUser.id },
        },
      });
      if (existingMember) {
        throw new ConflictException('User is already a member');
      }
    }

    // Check for existing pending invitation
    const existingInvite = await this.prisma.workspaceInvitation.findFirst({
      where: {
        workspaceId,
        email: dto.email,
        acceptedAt: null,
        rejectedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvite) {
      throw new ConflictException('An active invitation already exists for this email');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invitation = await this.prisma.workspaceInvitation.create({
      data: {
        workspaceId,
        email: dto.email,
        role: (dto.role as any) || 'MEMBER',
        token,
        expiresAt,
      },
      include: {
        workspace: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    const inviteUrl = `/invitations/${token}`;

    const inviter = await this.prisma.user.findUnique({ where: { id: userId } });
    const inviterName = inviter?.name || inviter?.email || 'Someone';

    await this.mail.sendMail({
      to: dto.email,
      subject: `You've been invited to ${invitation.workspace.name}`,
      html: workspaceInviteTemplate(inviteUrl, invitation.workspace.name, inviterName),
    });

    return {
      ...invitation,
      inviteUrl,
    };
  }

  async findByWorkspace(workspaceId: string, userId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });

    if (!member || (member.role !== 'ADMIN' && member.role !== 'OWNER')) {
      throw new ForbiddenException('Only admins can view invitations');
    }

    return this.prisma.workspaceInvitation.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revoke(workspaceId: string, userId: string, invitationId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });

    if (!member || (member.role !== 'ADMIN' && member.role !== 'OWNER')) {
      throw new ForbiddenException('Only admins can revoke invitations');
    }

    const invitation = await this.prisma.workspaceInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    await this.prisma.workspaceInvitation.delete({
      where: { id: invitationId },
    });
  }

  async getInvitation(token: string) {
    const invitation = await this.prisma.workspaceInvitation.findUnique({
      where: { token },
      include: {
        workspace: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.expiresAt < new Date()) {
      throw new NotFoundException('Invitation has expired');
    }

    if (invitation.acceptedAt || invitation.rejectedAt) {
      throw new NotFoundException('Invitation has already been processed');
    }

    return {
      id: invitation.id,
      workspaceId: invitation.workspaceId,
      workspaceName: invitation.workspace.name,
      workspaceSlug: invitation.workspace.slug,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
    };
  }

  async accept(token: string, userId: string) {
    const invitation = await this.prisma.workspaceInvitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.expiresAt < new Date()) {
      throw new NotFoundException('Invitation has expired');
    }

    if (invitation.acceptedAt || invitation.rejectedAt) {
      throw new ConflictException('Invitation has already been processed');
    }

    // Verify the accepting user's email matches
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.email !== invitation.email) {
      throw new ForbiddenException('This invitation was sent to a different email address');
    }

    const [member] = await this.prisma.$transaction([
      this.prisma.workspaceMember.create({
        data: {
          workspaceId: invitation.workspaceId,
          userId,
          role: invitation.role,
        },
      }),
      this.prisma.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      }),
    ]);

    return member;
  }

  async reject(token: string) {
    const invitation = await this.prisma.workspaceInvitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.acceptedAt || invitation.rejectedAt) {
      throw new ConflictException('Invitation has already been processed');
    }

    await this.prisma.workspaceInvitation.update({
      where: { id: invitation.id },
      data: { rejectedAt: new Date() },
    });
  }
}
