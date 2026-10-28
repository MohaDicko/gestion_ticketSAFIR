import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Role } from "@prisma/client";
import * as argon2 from "argon2";

@Injectable()
export class ConsultantsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.consultant.findMany({
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, isActive: true },
        },
        tickets: {
          select: { id: true, reference: true, title: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(data: {
    firstName: string;
    lastName: string;
    email: string;
    organization?: string;
    passwordPlain?: string;
    isInternal?: boolean;
    actorId?: string;
  }) {
    const normalizedEmail = data.email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      throw new BadRequestException(`Un utilisateur avec l'adresse e-mail '${normalizedEmail}' existe déjà`);
    }

    const passwordToHash = data.passwordPlain || "Safir2026!Consultant";
    const passwordHash = await argon2.hash(passwordToHash);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          roles: [Role.CONSULTANT],
          isActive: true,
          passwordHash,
          timezone: "Europe/Paris",
        },
      });

      const consultant = await tx.consultant.create({
        data: {
          userId: user.id,
          email: normalizedEmail,
          name: `${user.firstName} ${user.lastName}`,
          organization: data.organization?.trim() || "Safir Consulting",
          isInternal: data.isInternal ?? true,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: data.actorId,
          action: "CONSULTANT_CREATED",
          entityType: "Consultant",
          entityId: consultant.id,
          payloadAfter: {
            name: consultant.name,
            email: consultant.email,
            login: consultant.email,
            organization: consultant.organization,
          },
        },
      });

      return {
        id: consultant.id,
        userId: user.id,
        name: consultant.name,
        email: consultant.email,
        login: consultant.email,
        organization: consultant.organization,
        isInternal: consultant.isInternal,
      };
    });
  }
}
