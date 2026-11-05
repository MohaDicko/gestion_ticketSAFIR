import { Injectable, NotFoundException, BadRequestException, Optional } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { FirebaseAdminService } from "../firebase/firebase-admin.service";
import { Role, ProfileStatus } from "@prisma/client";
import * as argon2 from "argon2";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class DevelopersService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly firebaseAdmin?: FirebaseAdminService,
  ) {}

  async findAll() {
    const devs = await this.prisma.developerProfile.findMany({
      where: {
        profileStatus: ProfileStatus.ACTIVE,
        user: { isActive: true },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            isActive: true,
            timezone: true,
          },
        },
        skills: {
          include: {
            skill: true,
          },
        },
        assignments: {
          where: {
            status: "ACTIVE",
          },
          include: {
            ticket: {
              select: {
                id: true,
                reference: true,
                title: true,
                status: true,
                remainingEstimatedHours: true,
              },
            },
          },
        },
        availabilities: {
          where: {
            approvalStatus: "APPROVED",
            endDateTime: {
              gte: new Date(),
            },
          },
        },
      },
      orderBy: {
        user: {
          firstName: "asc",
        },
      },
    });

    return devs.map((d) => {
      // Calcul des heures réservées
      const reservedHours = d.assignments.reduce((sum, a) => {
        const remaining = a.remainingHours ? Number(a.remainingHours) : Number(a.allocatedHours);
        return sum + remaining;
      }, 0);

      const netWeeklyHours = Number(d.weeklyCapacityHours || 40);
      const loadPercentage = netWeeklyHours > 0 ? Math.min(100, Math.round((reservedHours / netWeeklyHours) * 100)) : 0;

      return {
        id: d.id,
        userId: d.userId,
        name: `${d.user.firstName} ${d.user.lastName}`,
        email: d.user.email,
        jobTitle: d.jobTitle,
        profileStatus: d.profileStatus,
        netWeeklyHours,
        reservedHours,
        freeHours: Math.max(0, netWeeklyHours - reservedHours),
        loadPercentage,
        skills: d.skills.map((s) => ({
          id: s.skillId,
          name: s.skill.name,
          category: s.skill.category,
          level: s.proficiencyLevel,
          validatedAt: s.validatedAt,
        })),
        activeAssignmentsCount: d.assignments.length,
        hasUpcomingAbsence: d.availabilities.length > 0,
      };
    });
  }

  async deactivateDeveloper(developerId: string) {
    const isDevUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(developerId);
    const cleanDev = developerId.replace(/^dev-/, "").replace(/^user-/, "").toLowerCase();
    const developer = await this.prisma.developerProfile.findFirst({
      where: isDevUuid
        ? { id: developerId }
        : {
            OR: [
              { id: developerId },
              { userId: developerId },
              { user: { email: { contains: cleanDev, mode: "insensitive" } } },
              { user: { lastName: { contains: cleanDev, mode: "insensitive" } } },
            ],
          },
      select: { id: true, userId: true },
    });
    if (!developer) {
      throw new NotFoundException("Développeur introuvable");
    }

    await this.prisma.$transaction([
      this.prisma.developerProfile.update({
        where: { id: developer.id },
        data: { profileStatus: ProfileStatus.INACTIVE },
      }),
      this.prisma.user.update({
        where: { id: developer.userId },
        data: { isActive: false },
      }),
    ]);

    return { id: developer.id, deleted: true };
  }

  async getSkillsCatalogue() {
    return this.prisma.skill.findMany({
      where: { isActive: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
  }

  async setDeveloperSkill(developerId: string, skillId: string, level: number, validatorId?: string) {
    if (level < 1 || level > 5) {
      throw new Error("Le niveau de compétence doit être compris entre 1 et 5");
    }

    return this.prisma.developerSkill.upsert({
      where: {
        developerId_skillId: {
          developerId,
          skillId,
        },
      },
      update: {
        proficiencyLevel: level,
        validatedAt: new Date(),
        validatedById: validatorId,
        validationSource: "Validation manuelle HEAD",
      },
      create: {
        developerId,
        skillId,
        proficiencyLevel: level,
        validatedAt: new Date(),
        validatedById: validatorId,
        validationSource: "Validation manuelle HEAD",
      },
    });
  }

  async createDeveloper(data: {
    firstName: string;
    lastName: string;
    email: string;
    jobTitle: string;
    weeklyCapacityHours?: number;
    skills?: { skillId: string; level: number }[];
    actorId?: string;
  }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    });
    if (existing) {
      throw new BadRequestException(`Un utilisateur avec l'adresse e-mail '${data.email}' existe déjà`);
    }

    const defaultPasswordHash = await argon2.hash("Safir2026!DevCapacity");
    const weeklyHours = data.weeklyCapacityHours || 40;

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email.toLowerCase().trim(),
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          roles: [Role.DEVELOPER],
          isActive: true,
          passwordHash: defaultPasswordHash,
          mustChangePassword: true,
          timezone: "Europe/Paris",
        },
      });

      const profile = await tx.developerProfile.create({
        data: {
          userId: user.id,
          jobTitle: data.jobTitle.trim(),
          weeklyCapacityHours: weeklyHours,
          weeklySchedule: { mon: 8, tue: 8, wed: 8, thu: 8, fri: 8, sat: 0, sun: 0 },
          planningFactor: 1.0,
          timezone: "Europe/Paris",
          profileStatus: ProfileStatus.ACTIVE,
        },
      });

      const assignedSkills: any[] = [];
      if (data.skills && data.skills.length > 0) {
        for (const sk of data.skills) {
          const validActorUuid = data.actorId && UUID_REGEX.test(data.actorId) ? data.actorId : undefined;
          const createdSkill = await tx.developerSkill.create({
            data: {
              developerId: profile.id,
              skillId: sk.skillId,
              proficiencyLevel: sk.level,
              validatedAt: new Date(),
              validatedById: validActorUuid,
              validationSource: "Validation initiale HEAD (Onboarding)",
            },
            include: { skill: true },
          });
          assignedSkills.push({
            id: createdSkill.skillId,
            name: createdSkill.skill.name,
            category: createdSkill.skill.category,
            level: createdSkill.proficiencyLevel,
          });
        }
      }

      if (this.firebaseAdmin?.firestore) {
        this.firebaseAdmin.firestore
          .collection("users")
          .doc(user.email)
          .set(
            {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              roles: ["DEVELOPER"],
              isActive: true,
              passwordHash: defaultPasswordHash,
              passwordPlain: "Safir2026!DevCapacity",
              mustChangePassword: false,
              developerProfile: { id: profile.id },
              updatedAt: new Date(),
            },
            { merge: true },
          )
          .catch(() => {});
      }

      return {
        id: profile.id,
        userId: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        jobTitle: profile.jobTitle,
        netWeeklyHours: weeklyHours,
        reservedHours: 0,
        freeHours: weeklyHours,
        loadPercentage: 0,
        skills: assignedSkills,
        activeAssignmentsCount: 0,
        hasUpcomingAbsence: false,
      };
    });
  }
}
