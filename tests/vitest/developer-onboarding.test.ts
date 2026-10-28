import { describe, it, expect } from "vitest";
import * as argon2 from "argon2";

export interface NewDeveloperInput {
  firstName: string;
  lastName: string;
  email: string;
  dailyCapacityHours?: number;
  seniority?: string;
  skills?: string[];
  passwordPlain?: string;
}

export async function provisionDeveloperProfile(
  input: NewDeveloperInput,
  existingEmails: string[] = []
) {
  const normalizedEmail = input.email.toLowerCase().trim();

  // 1. Contrôle d'unicité sur l'email
  if (existingEmails.map((e) => e.toLowerCase()).includes(normalizedEmail)) {
    throw new Error(`Un collaborateur avec l'adresse e-mail '${normalizedEmail}' existe déjà`);
  }

  // 2. Attribution du Login par défaut : e-mail professionnel
  const login = normalizedEmail;

  // 3. Hachage du mot de passe initial avec Argon2id
  const passwordPlain = input.passwordPlain || "Safir2026!Dev";
  const passwordHash = await argon2.hash(passwordPlain);

  // 4. Objet Utilisateur créé
  const user = {
    id: `user-dev-${Date.now()}`,
    email: normalizedEmail,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    roles: ["DEVELOPER"],
    isActive: true,
    passwordHash,
  };

  // 5. Objet Développeur créé
  const developer = {
    id: `dev-${Date.now()}`,
    userId: user.id,
    name: `${user.firstName} ${user.lastName}`,
    email: normalizedEmail,
    login,
    dailyCapacityHours: input.dailyCapacityHours ?? 7.5,
    seniority: input.seniority ?? "INTERMEDIATE",
    skills: input.skills ?? ["SAP_B1"],
    status: "AVAILABLE",
  };

  return { user, developer, passwordPlain };
}

describe("Module Développeurs — Onboarding & Provisioning d'Équipe par Aliko", () => {
  it("attribue automatiquement l'email professionnel comme login et assigne le rôle DEVELOPER", async () => {
    const input: NewDeveloperInput = {
      firstName: "Mamadou",
      lastName: "Traoré",
      email: "Mamadou.Traore@safirconsulting.net ",
      dailyCapacityHours: 7.5,
      seniority: "SENIOR",
      skills: ["SAP_B1", "WMS_INTERFACE", "SQL_SERVER"],
    };

    const res = await provisionDeveloperProfile(input);

    expect(res.developer.login).toBe("mamadou.traore@safirconsulting.net");
    expect(res.user.email).toBe("mamadou.traore@safirconsulting.net");
    expect(res.user.roles).toContain("DEVELOPER");
    expect(res.developer.name).toBe("Mamadou Traoré");
    expect(res.developer.seniority).toBe("SENIOR");
    expect(res.developer.skills).toContain("WMS_INTERFACE");
  });

  it("sécurise le mot de passe initial du développeur via Argon2id", async () => {
    const plain = "DevSecPass!2026";
    const res = await provisionDeveloperProfile({
      firstName: "Fanta",
      lastName: "Fofana",
      email: "fanta.fofana@safirconsulting.net",
      passwordPlain: plain,
    });

    expect(res.user.passwordHash).not.toBe(plain);
    expect(res.user.passwordHash.startsWith("$argon2")).toBe(true);

    const isMatch = await argon2.verify(res.user.passwordHash, plain);
    expect(isMatch).toBe(true);
  });

  it("calcule la capacité journalière par défaut à 7.5h et le statut initial à AVAILABLE", async () => {
    const res = await provisionDeveloperProfile({
      firstName: "Ali",
      lastName: "Sanogo",
      email: "ali.sanogo@safirconsulting.net",
    });

    expect(res.developer.dailyCapacityHours).toBe(7.5);
    expect(res.developer.status).toBe("AVAILABLE");
    expect(res.developer.skills).toContain("SAP_B1");
  });

  it("rejette tout onboarding avec une adresse e-mail déjà enregistrée", async () => {
    const existing = ["anoop.pandimukkula@safirconsulting.net", "aliko.getheme@safirconsulting.net"];

    await expect(
      provisionDeveloperProfile(
        {
          firstName: "Anoop",
          lastName: "Pandimukkula",
          email: "anoop.pandimukkula@safirconsulting.net",
        },
        existing
      )
    ).rejects.toThrow("existe déjà");
  });
});
