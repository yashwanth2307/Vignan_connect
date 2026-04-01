import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private redis: RedisService,
  ) {}

  async login(dto: LoginDto): Promise<{ user: any; tokens: TokenPair }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        student: { include: { section: true, department: true } },
        faculty: { include: { department: true } },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    // Store refresh token in Redis
    await this.redis.set(
      `refresh:${user.id}`,
      tokens.refreshToken,
      7 * 24 * 60 * 60, // 7 days
    );

    const { passwordHash, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, tokens };
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    try {
      const payload = this.jwt.verify(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });

      const storedToken = await this.redis.get(`refresh:${payload.sub}`);
      if (!storedToken || storedToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or deactivated');
      }

      const tokens = await this.generateTokens({
        sub: user.id,
        email: user.email,
        role: user.role,
      });

      // Update refresh token in Redis
      await this.redis.set(
        `refresh:${user.id}`,
        tokens.refreshToken,
        7 * 24 * 60 * 60,
      );

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string): Promise<void> {
    await this.redis.del(`refresh:${userId}`);
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        student: {
          include: {
            section: true,
            department: true,
            regulation: true,
          },
        },
        faculty: {
          include: { department: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  private async generateTokens(payload: JwtPayload): Promise<TokenPair> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.get('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get('JWT_ACCESS_EXPIRY', '15m'),
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRY', '7d'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid)
      throw new UnauthorizedException('Current password is incorrect');

    const newHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    // Invalidate all refresh tokens so user must re-login
    await this.redis.del(`refresh:${userId}`);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return; // Silent return for security

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60000); // 15 mins

    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetPasswordToken: otp, resetPasswordExpires: expires },
    });

    const { sendEmail } = await import('../utils/mailer');
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>V-Connect Password Reset</h2>
        <p>You requested a password reset. Here is your 6-digit OTP:</p>
        <h1 style="color: #2563eb; letter-spacing: 5px;">${otp}</h1>
        <p>This code will expire in 15 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `;
    await sendEmail(email, 'V-Connect Password Reset Code', html);
  }

  async resetPassword(email: string, token: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new ConflictException('Invalid reset token or email');
    if (user.resetPasswordToken !== token) {
      throw new ConflictException('Invalid reset token');
    }
    if (user.resetPasswordExpires && user.resetPasswordExpires < new Date()) {
      throw new ConflictException('Reset token has expired');
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    await this.redis.del(`refresh:${user.id}`);
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }
}
