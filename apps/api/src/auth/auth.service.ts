import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../shared/services/prisma.service';
import {
  RegisterDto,
  LoginDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is inactive');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string; email: string; jti: string; family: string };

    try {
      payload = this.jwt.verify(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET', 'refresh-secret-key'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const stored = await this.prisma.refreshToken.findFirst({
      where: { tokenHash: this.hashToken(refreshToken) },
      include: { user: true },
    });

    if (!stored || stored.revokedAt) {
      // Token reuse detected — revoke entire family
      if (payload?.family) {
        await this.prisma.refreshToken.updateMany({
          where: { family: payload.family, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    // Revoke old token (rotation)
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const user = stored.user;
    if (user.deletedAt || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is unavailable');
    }

    return this.generateTokens(user.id, user.email, payload.family);
  }

  async logout(userId: string, refreshToken: string) {
    await this.prisma.refreshToken.updateMany({
      where: {
        tokenHash: this.hashToken(refreshToken),
        userId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  async logoutAll(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const newHash = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    // Revoke all refresh tokens
    await this.logoutAll(userId);
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const response: Record<string, string> = {
      message: 'If the email exists, a reset link has been sent.',
    };

    if (process.env.NODE_ENV === 'production') {
      return response;
    }

    // Development-only password reset flow
    // Production requires a dedicated ResetToken model with expiry
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      return response;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(token, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: tokenHash,
      },
    });

    response.resetToken = token;
    return response;
  }

  async resetPassword(dto: ResetPasswordDto) {
    // For production, implement a dedicated ResetToken model
    // For now, this is a structure placeholder
    const newHash = await bcrypt.hash(dto.password, 12);

    // In production: find user by reset token, validate expiry, update password
    const user = await this.prisma.user.findFirst({
      where: { email: dto.token },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid reset token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    await this.logoutAll(user.id);

    return { message: 'Password has been reset successfully.' };
  }

  // Token will be sent via email; right now just mark verified
  async verifyEmail(token: string) {
    const email = Buffer.from(token, 'base64').toString('utf-8');

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });

    return { message: 'Email verified successfully.' };
  }

  async generateVerificationToken(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) throw new NotFoundException('User not found');

    return Buffer.from(user.email).toString('base64');
  }

  private async generateTokens(userId: string, email: string, family?: string) {
    const tokenFamily = family || crypto.randomUUID();
    const jti = crypto.randomUUID();

    const accessToken = await this.jwt.signAsync(
      { sub: userId, email },
      {
        secret: this.config.get('JWT_SECRET', 'super-secret-jwt-key'),
        expiresIn: this.config.get('JWT_EXPIRES_IN', '15m'),
      },
    );

    const refreshToken = await this.jwt.signAsync(
      { sub: userId, email, jti, family: tokenFamily },
      {
        secret: this.config.get('JWT_REFRESH_SECRET', 'refresh-secret-key'),
        expiresIn: '7d',
      },
    );

    // Store refresh token hash in DB
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(refreshToken),
        family: tokenFamily,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private sanitizeUser(user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    bio: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
