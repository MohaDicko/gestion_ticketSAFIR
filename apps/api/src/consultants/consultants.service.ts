import { Injectable, BadRequestException, NotFoundException, Optional } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { FirebaseAdminService } from "../firebase/firebase-admin.service";
import { Role } from "@prisma/client";
import * as argon2 from "argon2";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class ConsultantsService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly firebaseAdmin?: FirebaseAdminService,
  ) {}

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
    const isConsultantUuid = UUID_REGEX.test(consultantId);
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
      select: { id: true, userId: true, email: true },
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

    if (this.firebaseAdmin?.firestore && consultant.email) {
      this.firebaseAdmin.firestore
        .collection("users")
        .doc(consultant.email.toLowerCase())
        .set({ isActive: false, updatedAt: new Date() }, { merge: true })
        .catch(() => {});
    }

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
      include: { consultant: true },
    });
    if (existing?.consultant && existing.isActive && existing.consultant.status === "ACTIVE") {
      throw new BadRequestException(`Un consultant avec l'adresse e-mail '${normalizedEmail}' existe déjà sur la plateforme`);
    }

    const passwordToHash = data.passwordPlain || "Safir2026!Consultant";
    const passwordHash = await argon2.hash(passwordToHash, { type: argon2.argon2id });

    return this.prisma.$transaction(async (tx) => {
      let user = existing;
      if (!user) {
        user = await tx.user.create({
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
          include: { consultant: true },
        });
      } else {
        const updatedRoles = Array.from(new Set([...user.roles, Role.CONSULTANT]));
        user = await tx.user.update({
          where: { id: user.id },
          data: {
            firstName: data.firstName.trim(),
            lastName: data.lastName.trim(),
            roles: updatedRoles,
            isActive: true,
            passwordHash,
            mustChangePassword: true,
          },
          include: { consultant: true },
        });
      }

      const consultant = existing?.consultant
        ? await tx.consultant.update({
            where: { id: existing.consultant.id },
            data: {
              userId: user.id,
              name: `${user.firstName} ${user.lastName}`,
              organization: data.organization?.trim() || "Safir Consulting",
              isInternal: data.isInternal ?? true,
              status: "ACTIVE",
            },
          })
        : await tx.consultant.create({
            data: {
              userId: user.id,
              email: normalizedEmail,
              name: `${user.firstName} ${user.lastName}`,
              organization: data.organization?.trim() || "Safir Consulting",
              isInternal: data.isInternal ?? true,
              status: "ACTIVE",
            },
          });

      const validActorUuid = data.actorId && UUID_REGEX.test(data.actorId) ? data.actorId : undefined;
      await tx.auditLog.create({
        data: {
          actorId: validActorUuid,
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

      if (this.firebaseAdmin?.firestore) {
        this.firebaseAdmin.firestore
          .collection("users")
          .doc(normalizedEmail)
          .set(
            {
              id: user.id,
              email: normalizedEmail,
              firstName: user.firstName,
              lastName: user.lastName,
              roles: ["CONSULTANT"],
              isActive: true,
              passwordHash,
              mustChangePassword: true,
              updatedAt: new Date(),
            },
            { merge: true },
          )
          .catch(() => {});
      }

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
