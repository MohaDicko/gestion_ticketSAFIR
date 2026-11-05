import { Injectable, UnauthorizedException, BadRequestException, Optional } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { FirebaseAdminService } from "../firebase/firebase-admin.service";
import * as argon2 from "argon2";
import * as crypto from "crypto";

// Sessions en mémoire / cache pour assurer une continuité totale même hors réseau PostgreSQL
const memorySessions = new Map<string, { user: any; expiresAt: Date }>();

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly firebaseAdmin?: FirebaseAdminService,
  ) {}

  async validateUser(email: string, passwordPlain: string) {
    const normalizedEmail = email.toLowerCase().trim();
    let user: any = null;

    // 1. Essai de récupération via Cloud Firestore (Priorité résilience Firebase)
    if (this.firebaseAdmin?.firestore) {
      try {
        const docSnap = await this.firebaseAdmin.firestore.collection("users").doc(normalizedEmail).get();
        if (docSnap.exists) {
          user = { id: docSnap.id, ...docSnap.data() };
        }
      } catch (err: any) {
        console.warn(`[AuthService] Lecture Firestore utilisateurs échouée : ${err?.message || err}`);
      }
    }

    // 2. Repli PostgreSQL Prisma si non trouvé dans Firestore ou en test unitaire
    if (!user && (this.prisma as any)?.user) {
      try {
        user = await prismaUser(this.prisma, normalizedEmail);
      } catch (err: any) {
        console.warn(`[AuthService] Repli PostgreSQL échoué : ${err?.message || err}`);
      }
    }

    if (!user || user.isActive === false || !user.passwordHash) {
      throw new UnauthorizedException("Identifiants invalides");
    }

    const isMatch = await argon2.verify(user.passwordHash, passwordPlain);
    if (!isMatch) {
      throw new UnauthorizedException("Identifiants invalides");
    }

    // Mise à jour de la date de dernière connexion
    if (this.firebaseAdmin?.firestore) {
      this.firebaseAdmin.firestore.collection("users").doc(normalizedEmail).set({
        lastLoginAt: new Date(),
      }, { merge: true }).catch(() => {});
    }

    if (this.prisma?.user?.update) {
      this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      }).catch(() => {});
    }

    const sessionToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(sessionToken).digest("hex");
    const csrfSecret = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000); // 7 jours

    const roles = user.roles || (user.role ? [user.role] : ["CONSULTANT"]);
    const sessionUserData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles,
      timezone: user.timezone || "Europe/Paris",
      mustChangePassword: !!user.mustChangePassword,
      developerProfile: user.developerProfile || (roles.includes("DEVELOPER") ? { id: `dev-${user.id}` } : undefined),
    };

    // Enregistrement en cache session
    memorySessions.set(tokenHash, {
      user: sessionUserData,
      expiresAt,
    });

    if (this.prisma?.session?.create) {
      this.prisma.session.create({
        data: {
          userId: user.id,
          tokenHash,
          csrfSecret,
          expiresAt,
        },
      }).catch(() => {});
    }

    return {
      sessionToken,
      csrfSecret,
      user: sessionUserData,
    };
  }

  async getSessionUser(token: string) {
    if (!token) return null;
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // 1. Vérification en cache mémoire immédiat
    const cached = memorySessions.get(tokenHash);
    if (cached && cached.expiresAt > new Date()) {
      return cached.user;
    }

    // 2. Vérification base Prisma si présente
    if (this.prisma?.session?.findUnique) {
      try {
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
                mustChangePassword: true,
                developerProfile: true,
              },
            },
          },
        });
        if (session && session.expiresAt >= new Date()) {
          memorySessions.set(tokenHash, {
            user: session.user,
            expiresAt: session.expiresAt,
          });
          return session.user;
        }
      } catch (err: any) {
        console.warn(`[AuthService] getSessionUser Prisma fallback error : ${err?.message || err}`);
      }
    }

    return null;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    if (!currentPassword) {
      throw new BadRequestException("Mot de passe actuel requis");
    }
    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException("Le mot de passe doit contenir au moins 8 caractères");
    }
    if (!/[A-Z]/.test(newPassword)) {
      throw new BadRequestException("Le mot de passe doit contenir au moins une lettre majuscule");
    }
    if (!/[0-9]/.test(newPassword)) {
      throw new BadRequestException("Le mot de passe doit contenir au moins un chiffre");
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword)) {
      throw new BadRequestException("Le mot de passe doit contenir au moins un caractère spécial");
    }

    let user: any = null;

    if (this.firebaseAdmin?.firestore) {
      const snap = await this.firebaseAdmin.firestore.collection("users").where("id", "==", userId).limit(1).get();
      if (!snap.empty) {
        user = snap.docs[0]!.data();
      }
    }

    if (!user && this.prisma?.user?.findUnique) {
      user = await this.prisma.user.findUnique({ where: { id: userId } });
    }

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException("Utilisateur introuvable");
    }

    const isMatch = await argon2.verify(user.passwordHash, currentPassword);
    if (!isMatch) {
      throw new UnauthorizedException("Mot de passe actuel incorrect");
    }

    const newHash = await argon2.hash(newPassword, { type: argon2.argon2id });

    if (this.firebaseAdmin?.firestore && user.email) {
      await this.firebaseAdmin.firestore.collection("users").doc(user.email).set({
        passwordHash: newHash,
        mustChangePassword: false,
        updatedAt: new Date(),
      }, { merge: true });
    }

    if (this.prisma?.user?.update) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash: newHash,
          mustChangePassword: false,
        },
      });
    }

    return { message: "Mot de passe modifié avec succès" };
  }
}

async function prismaUser(prisma: PrismaService, email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: {
      developerProfile: {
        select: { id: true },
      },
    },
  });
}
