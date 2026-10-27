import { PrismaClient, Role, ProfileStatus } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Début du seed initial DevCapacity Manager...");

  // 1. Types de tickets
  const ticketTypes = [
    { code: "ADDON", label: "Addon SAP spécifique", referencePrefix: "ADD", requiresAcceptanceCriteria: true, sortOrder: 1 },
    { code: "BUG", label: "Correction d'anomalie", referencePrefix: "BUG", requiresAcceptanceCriteria: false, sortOrder: 2 },
    { code: "EVOLUTION", label: "Évolution fonctionnelle", referencePrefix: "EVO", requiresAcceptanceCriteria: true, sortOrder: 3 },
    { code: "SPECIFIC_DEV", label: "Développement spécifique", referencePrefix: "DEV", requiresAcceptanceCriteria: true, sortOrder: 4 },
    { code: "INTEGRATION", label: "Intégration système / API", referencePrefix: "INT", requiresAcceptanceCriteria: true, sortOrder: 5 },
    { code: "MAINTENANCE", label: "Maintenance technique", referencePrefix: "MNT", requiresAcceptanceCriteria: false, sortOrder: 6 },
    { code: "SUPPORT", label: "Assistance & Support", referencePrefix: "SUP", requiresAcceptanceCriteria: false, sortOrder: 7 },
    { code: "ANALYSIS", label: "Analyse technique & étude", referencePrefix: "ANA", requiresAcceptanceCriteria: false, sortOrder: 8 },
  ];

  for (const t of ticketTypes) {
    await prisma.ticketType.upsert({
      where: { code: t.code },
      update: { label: t.label, referencePrefix: t.referencePrefix, requiresAcceptanceCriteria: t.requiresAcceptanceCriteria, sortOrder: t.sortOrder },
      create: t,
    });
  }
  console.log("✓ Types de tickets initialisés");

  // 2. Priorités
  const priorities = [
    { code: "CRITICAL", label: "Critique (P1)", rank: 1 },
    { code: "HIGH", label: "Haute (P2)", rank: 2 },
    { code: "MEDIUM", label: "Moyenne (P3)", rank: 3 },
    { code: "LOW", label: "Basse (P4)", rank: 4 },
  ];

  for (const p of priorities) {
    await prisma.priority.upsert({
      where: { code: p.code },
      update: { label: p.label, rank: p.rank },
      create: p,
    });
  }
  console.log("✓ Priorités initialisées");

  // 3. Catalogue des compétences (axé SAP & Dev)
  const skills = [
    { name: "SAP Business One — Service Layer", category: "SAP", description: "Développement et intégration via API REST Service Layer B1" },
    { name: "SAP Business One — UI / DI API", category: "SAP", description: "Développement d'addons natifs SAP B1 (SDK)" },
    { name: "SAP S/4HANA — ABAP & CDS", category: "SAP", description: "Programmation ABAP moderne, CDS Views, RAP/CAP" },
    { name: "SAP Fiori / UI5", category: "SAP", description: "Développement d'interfaces web Fiori et applications UI5" },
    { name: "SAP HANA & SQL", category: "Données", description: "Procédures stockées HANA SQLScript et requêtes SQL complexes" },
    { name: "NestJS & Node.js", category: "Backend", description: "Architecture modulaire TypeScript, microservices et API REST" },
    { name: "Next.js & React", category: "Frontend", description: "Interfaces web modernes, App Router et Server Components" },
    { name: "PostgreSQL & Prisma", category: "Données", description: "Modélisation relationnelle, indexation et ORM" },
    { name: "Microsoft Graph & M365", category: "Intégration", description: "Intégration messagerie Outlook, calendriers et Entra ID" },
    { name: "Docker & Déploiement SAP", category: "DevOps", description: "Conteneurisation sécurisée et déploiement sur serveurs d'infrastructure" },
    { name: "Architecture & Intégration API", category: "Transverse", description: "Conception de flux, webhooks et sécurité des échanges" },
  ];

  for (const s of skills) {
    await prisma.skill.upsert({
      where: { name: s.name },
      update: { category: s.category, description: s.description },
      create: s,
    });
  }
  console.log("✓ Catalogue de compétences initialisé");

  // 4. Paramètres applicatifs (Settings)
  const settings = [
    {
      key: "recommendation.weights",
      value: { skills: 45, capacity: 30, deadline: 15, continuity: 10 },
      scope: "business",
    },
    {
      key: "capacity.limits",
      value: { maxDailyHours: 8, warningOverloadPercent: 100, staleEstimateDays: 7 },
      scope: "business",
    },
    {
      key: "product.info",
      value: { name: "DevCapacity Manager", company: "Safir Consulting", unit: "SME Business Unit" },
      scope: "technical",
    },
  ];

  for (const st of settings) {
    await prisma.setting.upsert({
      where: { key: st.key },
      update: { value: st.value, scope: st.scope },
      create: st,
    });
  }
  console.log("✓ Paramètres applicatifs configurés");

  // 5. Utilisateur principal : Aliko (HEAD)
  const devPasswordHash = await argon2.hash("Safir2026!DevCapacity");

  const aliko = await prisma.user.upsert({
    where: { email: "aliko.getheme@safirconsulting.net" },
    update: {
      firstName: "Aliko",
      lastName: "Getheme",
      roles: [Role.HEAD, Role.ADMIN],
      isActive: true,
      timezone: "Europe/Paris",
    },
    create: {
      email: "aliko.getheme@safirconsulting.net",
      firstName: "Aliko",
      lastName: "Getheme",
      roles: [Role.HEAD, Role.ADMIN],
      isActive: true,
      passwordHash: devPasswordHash,
      timezone: "Europe/Paris",
    },
  });
  console.log(`✓ Utilisateur HEAD créé : ${aliko.email} (Mot de passe repli dev : Safir2026!DevCapacity)`);

  console.log("🚀 Seed terminé avec succès !");
}

main()
  .catch((e) => {
    console.error("Erreur lors du seed :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
