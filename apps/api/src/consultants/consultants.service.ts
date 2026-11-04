import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Role } from "@prisma/client";
import * as argon2 from "argon2";

@Injectable()
export class ConsultantsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.consultant.findMany({
      where: {
        status: "ACTIVE",
        user: { isActive: true },
      },
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

  async deactivate(consultantId: string) {
    const isConsultantUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(consultantId);
    const cleanCons = consultantId.replace(/^cons-/, "").replace(/^user-/, "").toLowerCase();
    const consultant = await this.prisma.consultant.findFirst({
      where: isConsultantUuid
        ? { id: consultantId }
        : {
            OR: [
              { id: consultantId },
              { userId: consultantId },
              { email: { contains: cleanCons, mode: "insensitive" } },
              { name: { contains: cleanCons, mode: "insensitive" } },
            ],
          },
      select: { id: true, userId: true },
    });
    if (!consultant) {
      throw new NotFoundException("Consultant introuvable");
    }

    await this.prisma.$transaction([
      this.prisma.consultant.update({
        where: { id: consultant.id },
        data: { status: "INACTIVE" },
      }),
      ...(consultant.userId
        ? [
            this.prisma.user.update({
              where: { id: consultant.userId },
              data: { isActive: false },
            }),
          ]
        : []),
    ]);

    return { id: consultant.id, deleted: true };
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
          mustChangePassword: true,
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
          metadata: {
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
