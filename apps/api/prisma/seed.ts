import { PrismaClient, Role, ProfileStatus, TicketStatus, TicketSource, MailProviderKind, EmailDirection, EmailProcessingStatus, SenderKind } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Début du seed initial complet DevCapacity Manager...");

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
  const skillsData = [
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

  const skillMap = new Map<string, string>();
  for (const s of skillsData) {
    const created = await prisma.skill.upsert({
      where: { name: s.name },
      update: { category: s.category, description: s.description },
      create: s,
    });
    skillMap.set(s.name, created.id);
  }
  console.log("✓ Catalogue de compétences initialisé");

  // 4. Paramètres applicatifs
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

  // 5. Compte HEAD : Aliko Getheme
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
  console.log(`✓ Utilisateur HEAD créé : ${aliko.email}`);

  // 6. Les Développeurs réels de l'équipe Safir Consulting
  const devsConfig = [
    {
      email: "anoop.pandimukkula@safirconsulting.net",
      firstName: "Anoop",
      lastName: "Pandimukkula",
      jobTitle: "Senior Développeur SAP Business One & Addons",
      skills: [
        { name: "SAP Business One — Service Layer", level: 5 },
        { name: "SAP Business One — UI / DI API", level: 5 },
        { name: "SAP HANA & SQL", level: 4 },
      ],
    },
    {
      email: "hassane.bocoum@safirconsulting.net",
      firstName: "Hassane",
      lastName: "Bocoum",
      jobTitle: "Lead Développeur SAP S/4HANA & ABAP",
      skills: [
        { name: "SAP S/4HANA — ABAP & CDS", level: 5 },
        { name: "SAP Fiori / UI5", level: 4 },
        { name: "SAP HANA & SQL", level: 4 },
      ],
    },
    {
      email: "nevrit.ahua@safirconsulting.net",
      firstName: "Nevrit",
      lastName: "Ahua",
      jobTitle: "Ingénieur Intégration Systèmes & API",
      skills: [
        { name: "SAP Business One — Service Layer", level: 4 },
        { name: "Architecture & Intégration API", level: 5 },
        { name: "NestJS & Node.js", level: 4 },
      ],
    },
    {
      email: "fatoumata.traore@safirconsulting.net",
      firstName: "Fatoumata",
      lastName: "Traore",
      jobTitle: "Développeuse Full-Stack & Fiori UX",
      skills: [
        { name: "SAP Fiori / UI5", level: 4 },
        { name: "Next.js & React", level: 5 },
        { name: "NestJS & Node.js", level: 4 },
      ],
    },
    {
      email: "korotoumou.thiam@safirconsulting.net",
      firstName: "Korotoumou",
      lastName: "Thiam",
      jobTitle: "Développeuse Backend & Bases de données",
      skills: [
        { name: "NestJS & Node.js", level: 4 },
        { name: "PostgreSQL & Prisma", level: 5 },
        { name: "SAP HANA & SQL", level: 4 },
        { name: "Docker & Déploiement SAP", level: 4 },
      ],
    },
    {
      email: "mohadicko95@gmail.com",
      firstName: "Moha",
      lastName: "Dicko",
      jobTitle: "Lead Développeur Full-Stack & Architecte Solution",
      skills: [
        { name: "Next.js & React", level: 5 },
        { name: "NestJS & Node.js", level: 5 },
        { name: "PostgreSQL & Prisma", level: 5 },
        { name: "Architecture & Intégration API", level: 5 },
      ],
    },
    {
      email: "jeanphilippe.ebrottie@safirconsulting.net",
      firstName: "Jean-Philippe",
      lastName: "Ebrottié",
      jobTitle: "Développeur Solutions SAP B1 & Intégration",
      skills: [
        { name: "SAP Business One — UI / DI API", level: 4 },
        { name: "SAP Business One — Service Layer", level: 4 },
        { name: "SAP HANA & SQL", level: 3 },
      ],
    },
  ];

  for (const d of devsConfig) {
    const user = await prisma.user.upsert({
      where: { email: d.email },
      update: { firstName: d.firstName, lastName: d.lastName, roles: [Role.DEVELOPER], isActive: true },
      create: {
        email: d.email,
        firstName: d.firstName,
        lastName: d.lastName,
        roles: [Role.DEVELOPER],
        isActive: true,
        passwordHash: devPasswordHash,
        timezone: "Europe/Paris",
      },
    });

    const devProfile = await prisma.developerProfile.upsert({
      where: { userId: user.id },
      update: { jobTitle: d.jobTitle, weeklyCapacityHours: 40, profileStatus: ProfileStatus.ACTIVE },
      create: {
        userId: user.id,
        jobTitle: d.jobTitle,
        weeklyCapacityHours: 40,
        weeklySchedule: { mon: 8, tue: 8, wed: 8, thu: 8, fri: 8, sat: 0, sun: 0 },
        planningFactor: 1.0,
        timezone: "Europe/Paris",
        profileStatus: ProfileStatus.ACTIVE,
      },
    });

    for (const sk of d.skills) {
      const skillId = skillMap.get(sk.name);
      if (skillId) {
        await prisma.developerSkill.upsert({
          where: { developerId_skillId: { developerId: devProfile.id, skillId } },
          update: { proficiencyLevel: sk.level, validatedAt: new Date(), validationSource: "Validation initiale HEAD" },
          create: {
            developerId: devProfile.id,
            skillId,
            proficiencyLevel: sk.level,
            validatedAt: new Date(),
            validationSource: "Validation initiale HEAD",
          },
        });
      }
    }
  }
  console.log("✓ Les 7 profils développeurs réels et leurs compétences ont été créés");

  // 6.b. Consultante Interne Safir Consulting : Mélissa Diakité
  const melissaUser = await prisma.user.upsert({
    where: { email: "melissa.diakite@safirconsulting.net" },
    update: {
      firstName: "Mélissa",
      lastName: "Diakité",
      roles: [Role.CONSULTANT],
      isActive: true,
      timezone: "Europe/Paris",
    },
    create: {
      email: "melissa.diakite@safirconsulting.net",
      firstName: "Mélissa",
      lastName: "Diakité",
      roles: [Role.CONSULTANT],
      isActive: true,
      passwordHash: devPasswordHash,
      timezone: "Europe/Paris",
    },
  });

  const melissaConsultant = await prisma.consultant.upsert({
    where: { email: "melissa.diakite@safirconsulting.net" },
    update: {
      userId: melissaUser.id,
      name: "Mélissa Diakité",
      organization: "Safir Consulting",
      isInternal: true,
      status: "ACTIVE",
    },
    create: {
      userId: melissaUser.id,
      email: "melissa.diakite@safirconsulting.net",
      name: "Mélissa Diakité",
      organization: "Safir Consulting",
      isInternal: true,
      status: "ACTIVE",
    },
  });
  console.log(`✓ Consultante interne initialisée : ${melissaConsultant.name} (${melissaConsultant.email})`);

  // 7. Clients & Projets initiaux
  const clientOmega = await prisma.client.upsert({
    where: { reference: "CLI-OMEGA" },
    update: { name: "Omega Logistics" },
    create: {
      name: "Omega Logistics",
      reference: "CLI-OMEGA",
      emailDomains: ["client-omega.com"],
      contactInformation: "Contact DSI SAP : Christian Durand",
    },
  });

  const projectOmega = await prisma.project.upsert({
    where: { reference: "PRJ-OMEGA-WMS" },
    update: { name: "Addon WMS Sync SAP B1" },
    create: {
      clientId: clientOmega.id,
      name: "Addon WMS Sync SAP B1",
      reference: "PRJ-OMEGA-WMS",
      description: "Passerelle Service Layer pour synchroniser les stocks entrepôt WMS avec SAP Business One",
    },
  });

  await prisma.clientContact.upsert({
    where: { email: "c.durand@client-omega.com" },
    update: { name: "Christian Durand" },
    create: {
      clientId: clientOmega.id,
      name: "Christian Durand",
      email: "c.durand@client-omega.com",
      jobTitle: "Directeur Informatique",
      isPersonalEmail: false,
    },
  });

  const clientHorizon = await prisma.client.upsert({
    where: { reference: "CLI-HORIZON" },
    update: { name: "Groupe Horizon" },
    create: {
      name: "Groupe Horizon",
      reference: "CLI-HORIZON",
      emailDomains: ["groupe-horizon.fr"],
      contactInformation: "Consultant externe référent : Julien Martin",
    },
  });

  const projectHorizon = await prisma.project.upsert({
    where: { reference: "PRJ-HORIZON-FI" },
    update: { name: "Comptabilité S/4HANA & CDS Views" },
    create: {
      clientId: clientHorizon.id,
      name: "Comptabilité S/4HANA & CDS Views",
      reference: "PRJ-HORIZON-FI",
      description: "Module financier S/4HANA pour génération automatisée des écritures comptables",
    },
  });

  await prisma.clientContact.upsert({
    where: { email: "j.martin.consultant@gmail.com" },
    update: { name: "Julien Martin" },
    create: {
      clientId: clientHorizon.id,
      name: "Julien Martin",
      email: "j.martin.consultant@gmail.com",
      jobTitle: "Consultant Externe SAP",
      isPersonalEmail: true,
      validatedAt: new Date(),
      validatedById: aliko.id,
    },
  });
  console.log("✓ Clients (Omega Logistics, Groupe Horizon) et Projets initialisés");

  // 8. Tickets initiaux réels
  const addonType = await prisma.ticketType.findUniqueOrThrow({ where: { code: "ADDON" } });
  const bugType = await prisma.ticketType.findUniqueOrThrow({ where: { code: "BUG" } });
  const highPriority = await prisma.priority.findUniqueOrThrow({ where: { code: "HIGH" } });
  const criticalPriority = await prisma.priority.findUniqueOrThrow({ where: { code: "CRITICAL" } });

  const ticket1 = await prisma.ticket.upsert({
    where: { reference: "ADD-2026-0001" },
    update: {},
    create: {
      reference: "ADD-2026-0001",
      title: "Addon de synchronisation des stocks entrepôt WMS via Service Layer",
      description: "Automatisation de la remontée des stocks WMS vers SAP Business One via Service Layer REST API.",
      typeId: addonType.id,
      priorityId: highPriority.id,
      status: TicketStatus.READY,
      source: TicketSource.EMAIL,
      clientId: clientOmega.id,
      projectId: projectOmega.id,
      consultantId: melissaConsultant.id,
      estimatedHours: 24,
      remainingEstimatedHours: 24,
      requestedDueDate: new Date(Date.now() + 14 * 24 * 3600 * 1000),
      committedDueDate: new Date(Date.now() + 14 * 24 * 3600 * 1000),
    },
  });

  // Compétence requise pour Ticket 1 : Service Layer (Niveau min: 4)
  const serviceLayerSkillId = skillMap.get("SAP Business One — Service Layer");
  if (serviceLayerSkillId) {
    await prisma.ticketSkillRequirement.upsert({
      where: { ticketId_skillId: { ticketId: ticket1.id, skillId: serviceLayerSkillId } },
      update: { minimumLevel: 4 },
      create: {
        ticketId: ticket1.id,
        skillId: serviceLayerSkillId,
        minimumLevel: 4,
        isMandatory: true,
      },
    });
  }

  const ticket2 = await prisma.ticket.upsert({
    where: { reference: "BUG-2026-0001" },
    update: {},
    create: {
      reference: "BUG-2026-0001",
      title: "Correction anomalie écriture comptable sur CDS Views S/4HANA",
      description: "Erreur de lettrage constatée lors de la clôture périodique suite à mise à jour SAP.",
      typeId: bugType.id,
      priorityId: criticalPriority.id,
      status: TicketStatus.TO_QUALIFY,
      source: TicketSource.EMAIL,
      clientId: clientHorizon.id,
      projectId: projectHorizon.id,
      estimatedHours: 8,
      remainingEstimatedHours: 8,
      requestedDueDate: new Date(Date.now() + 3 * 24 * 3600 * 1000),
    },
  });

  console.log("✓ Tickets initiaux créés (ADD-2026-0001, BUG-2026-0001)");

  // 9. Boîte e-mail d'Aliko (Microsoft Graph) et Messages entrants en Inbox
  const mailbox = await prisma.mailboxConnection.upsert({
    where: { provider_mailboxAddress: { provider: MailProviderKind.MICROSOFT_GRAPH, mailboxAddress: "aliko.getheme@safirconsulting.net" } },
    update: { isEnabled: true, lastSyncAt: new Date(), lastSyncStatus: "SUCCESS" },
    create: {
      provider: MailProviderKind.MICROSOFT_GRAPH,
      mailboxAddress: "aliko.getheme@safirconsulting.net",
      isEnabled: true,
      lastSyncAt: new Date(),
      lastSyncStatus: "SUCCESS",
    },
  });

  await prisma.emailMessage.upsert({
    where: { provider_mailboxId_providerMessageId: { provider: MailProviderKind.MICROSOFT_GRAPH, mailboxId: mailbox.id, providerMessageId: "MSG-M365-001" } },
    update: {},
    create: {
      mailboxId: mailbox.id,
      provider: MailProviderKind.MICROSOFT_GRAPH,
      direction: EmailDirection.INBOUND,
      providerMessageId: "MSG-M365-001",
      internetMessageId: "<msg001@client-omega.com>",
      senderEmail: "c.durand@client-omega.com",
      senderName: "Christian Durand",
      senderKind: SenderKind.CLIENT_CONTACT,
      isPersonalDomain: false,
      toRecipients: ["aliko.getheme@safirconsulting.net"],
      subject: "Nouvelle demande : module passerelle facturation SAP B1",
      bodyPreview: "Bonjour Aliko, suite à notre échange, nous aimerions chiffrer l'addon d'import automatique des factures fournisseurs dans SAP B1...",
      bodyText: "Bonjour Aliko, suite à notre échange, nous aimerions chiffrer l'addon d'import automatique des factures fournisseurs dans SAP B1 via le Service Layer.",
      receivedAt: new Date(Date.now() - 3600 * 1000),
      processingStatus: EmailProcessingStatus.PENDING_QUALIFICATION,
    },
  });

  await prisma.emailMessage.upsert({
    where: { provider_mailboxId_providerMessageId: { provider: MailProviderKind.MICROSOFT_GRAPH, mailboxId: mailbox.id, providerMessageId: "MSG-M365-002" } },
    update: {},
    create: {
      mailboxId: mailbox.id,
      provider: MailProviderKind.MICROSOFT_GRAPH,
      direction: EmailDirection.INBOUND,
      providerMessageId: "MSG-M365-002",
      internetMessageId: "<msg002@safirconsulting.net>",
      senderEmail: "melissa.diakite@safirconsulting.net",
      senderName: "Mélissa Diakité",
      senderKind: SenderKind.CONSULTANT,
      isPersonalDomain: false,
      toRecipients: ["aliko.getheme@safirconsulting.net"],
      subject: "[Consulting SAP] Spécifications addon gestion des approbations d'achats",
      bodyPreview: "Bonjour Aliko, voici le cahier des charges validé avec le client pour l'addon d'approbation d'achats SAP B1...",
      bodyText: "Bonjour Aliko, voici le cahier des charges validé avec le client pour l'addon d'approbation d'achats SAP B1. Besoin d'un dev qualifié en Service Layer et UI API.",
      receivedAt: new Date(Date.now() - 1800 * 1000),
      processingStatus: EmailProcessingStatus.PENDING_QUALIFICATION,
    },
  });

  console.log("✓ Boîte Outlook M365 et e-mails entrants initialisés");
  console.log("🚀 Base de données 100% alimentée avec succès !");
}

main()
  .catch((e) => {
    console.error("Erreur lors du seed :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
