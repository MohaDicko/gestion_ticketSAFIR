import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as argon2 from "argon2";
import * as crypto from "crypto";

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async validateUser(email: string, passwordPlain: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await prismaUser(this.prisma, normalizedEmail);

    if (!user || !user.isActive || !user.passwordHash) {
      throw new UnauthorizedException("Identifiants invalides");
    }

    const isMatch = await argon2.verify(user.passwordHash, passwordPlain);
    if (!isMatch) {
      throw new UnauthorizedException("Identifiants invalides");
    }

    // Mise à jour de la date de dernière connexion
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const sessionToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(sessionToken).digest("hex");
    const csrfSecret = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000); // 7 jours

    await this.prisma.session.create({
      data: {
        userId: user.id,
        tokenHash,
        csrfSecret,
        expiresAt,
      },
    });

    return {
      sessionToken,
      csrfSecret,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles,
        timezone: user.timezone,
      },
    };
  }

  async getSessionUser(token: string) {
    if (!token) return null;
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const session = await this.prisma.session.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            roles: true,
            timezone: true,
            developerProfile: true,
          },
        },
      },
    });

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    return session.user;
  }
}

async function prismaUser(prisma: PrismaService, email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}
