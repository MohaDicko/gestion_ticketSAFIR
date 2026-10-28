import { describe, it, expect } from "vitest";
import * as argon2 from "argon2";

// Simulation fidèle de la logique métier du service ConsultantsService
export interface NewConsultantInput {
  firstName: string;
  lastName: string;
  email: string;
  organization?: string;
  passwordPlain?: string;
  isInternal?: boolean;
}

export async function provisionConsultantProfile(
  input: NewConsultantInput,
  existingEmails: string[] = []
) {
  const normalizedEmail = input.email.toLowerCase().trim();

  // 1. Règle d'unicité sur l'adresse e-mail (Login)
  if (existingEmails.map((e) => e.toLowerCase()).includes(normalizedEmail)) {
    throw new Error(`Un utilisateur avec l'adresse e-mail '${normalizedEmail}' existe déjà`);
  }

  // 2. Règle d'attribution du Login par défaut : e-mail professionnel
  const login = normalizedEmail;

  // 3. Règle de mot de passe : mot de passe initial chiffré via Argon2id
  const passwordPlain = input.passwordPlain || "Safir2026!Consultant";
  const passwordHash = await argon2.hash(passwordPlain);

  // 4. Objet Utilisateur créé
  const user = {
    id: `user-${Date.now()}`,
    email: normalizedEmail,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    roles: ["CONSULTANT"],
    isActive: true,
    passwordHash,
  };

  // 5. Objet Consultant créé
  const consultant = {
    id: `consultant-${Date.now()}`,
    userId: user.id,
    email: normalizedEmail,
    login,
    name: `${user.firstName} ${user.lastName}`,
    organization: input.organization?.trim() || "Safir Consulting",
    isInternal: input.isInternal ?? true,
    status: "ACTIVE",
  };

  return { user, consultant, passwordPlain };
}

describe("Module Consultants — Provisioning des Profils & Logins par Aliko", () => {
  it("attribue automatiquement l'adresse e-mail professionnelle comme Login de connexion", async () => {
    const input: NewConsultantInput = {
      firstName: "Ibrahima",
      lastName: "Koné",
      email: "Ibrahima.Kone@SafirConsulting.net ",
      organization: "Safir Consulting",
      passwordPlain: "MonMotDePasse2026!",
    };

    const res = await provisionConsultantProfile(input);

    expect(res.consultant.login).toBe("ibrahima.kone@safirconsulting.net");
    expect(res.user.email).toBe("ibrahima.kone@safirconsulting.net");
    expect(res.user.roles).toContain("CONSULTANT");
    expect(res.consultant.name).toBe("Ibrahima Koné");
  });

  it("sécurise le mot de passe initial avec l'algorithme Argon2id (jamais stocké en clair)", async () => {
    const plain = "MotDePasseSecret123!";
    const res = await provisionConsultantProfile({
      firstName: "Awa",
      lastName: "Diallo",
      email: "awa.diallo@safirconsulting.net",
      passwordPlain: plain,
    });

    // Le hash Argon2 ne doit jamais être égal au mot de passe en clair
    expect(res.user.passwordHash).not.toBe(plain);
    expect(res.user.passwordHash.startsWith("$argon2")).toBe(true);

    // Vérification cryptographique de la concordance du mot de passe
    const isValid = await argon2.verify(res.user.passwordHash, plain);
    expect(isValid).toBe(true);

    // Un mauvais mot de passe doit être rejeté
    const isBadValid = await argon2.verify(res.user.passwordHash, "MauvaisMotDePasse");
    expect(isBadValid).toBe(false);
  });

  it("applique le mot de passe par défaut sécurisé si aucun mot de passe n'est fourni", async () => {
    const res = await provisionConsultantProfile({
      firstName: "Sékou",
      lastName: "Camara",
      email: "sekou.camara@safirconsulting.net",
    });

    expect(res.passwordPlain).toBe("Safir2026!Consultant");
    const isDefaultMatch = await argon2.verify(res.user.passwordHash, "Safir2026!Consultant");
    expect(isDefaultMatch).toBe(true);
  });

  it("rejette la création si l'adresse e-mail (Login) est déjà utilisée par un autre collaborateur", async () => {
    const existing = ["melissa.diakite@safirconsulting.net", "aliko.getheme@safirconsulting.net"];

    await expect(
      provisionConsultantProfile(
        {
          firstName: "Mélissa",
          lastName: "Diakité",
          email: "melissa.diakite@safirconsulting.net",
        },
        existing
      )
    ).rejects.toThrow("existe déjà");
  });

  it("cloisonne les privilèges : un profil Consultant ne possède pas les droits Direction ou Dev", async () => {
    const res = await provisionConsultantProfile({
      firstName: "Oumar",
      lastName: "Touré",
      email: "oumar.toure@safirconsulting.net",
    });

    expect(res.user.roles).toEqual(["CONSULTANT"]);
    expect(res.user.roles).not.toContain("HEAD");
    expect(res.user.roles).not.toContain("DEVELOPER");
    expect(res.user.roles).not.toContain("ADMIN");
  });
});
