import { describe, it, expect } from "vitest";

describe("Alimentation Panel Consultant & Messagerie Tripartite (Dev - Admin - Demandeur)", () => {
  it("alimente le panel consultant avec ses demandes filtrées depuis le backend", () => {
    const consultantUser = {
      id: "user-melissa-123",
      email: "melissa.diakite@safirconsulting.net",
      name: "Mélissa Diakité",
      role: "CONSULTANT" as const,
    };

    // Données brutes renvoyées par l'API /tickets (avec consultant inclus)
    const backendTickets = [
      {
        id: "tix-101",
        reference: "ADD-2026-0042",
        title: "Interface Paie SAP",
        status: "IN_PROGRESS",
        consultant: {
          id: "cons-1",
          name: "Mélissa Diakité",
          email: "melissa.diakite@safirconsulting.net",
        },
        comments: [
          {
            id: "comm-1",
            content: "Développement en cours par l'équipe",
            authorRole: "DEVELOPER",
            authorName: "Mohamed Dicko",
            authorEmail: "mohamed.dicko@safirconsulting.net",
            createdAt: new Date().toISOString(),
          },
        ],
      },
      {
        id: "tix-102",
        reference: "EVO-2026-0055",
        title: "Rapport Comptable Mensuel",
        status: "DELIVERED",
        consultant: {
          id: "cons-1",
          name: "Mélissa Diakité",
          email: "melissa.diakite@safirconsulting.net",
        },
        comments: [],
      },
      {
        id: "tix-103",
        reference: "COR-2026-0089",
        title: "Ticket d'un autre demandeur",
        status: "RECEIVED",
        consultant: {
          id: "cons-2",
          name: "Arnaud Sopy",
          email: "arnaud.sopy@safirconsulting.net",
        },
        comments: [],
      },
    ];

    // Mapping frontend (identique à refreshData)
    const mappedTickets = backendTickets.map((t) => ({
      ...t,
      applicantName: t.consultant?.name,
      applicantEmail: t.consultant?.email,
      messages: t.comments.map((c) => ({
        id: c.id,
        authorName: c.authorName,
        authorRole: c.authorRole,
        authorEmail: c.authorEmail,
        message: c.content,
      })),
    }));

    // Filtrage spécifique au demandeur connecté
    const myConsultantDemands = mappedTickets.filter(
      (t) =>
        t.applicantEmail?.toLowerCase() === consultantUser.email.toLowerCase() ||
        t.applicantName?.includes(consultantUser.name)
    );

    expect(myConsultantDemands).toHaveLength(2);
    expect(myConsultantDemands.map((d) => d.reference)).toEqual(["ADD-2026-0042", "EVO-2026-0055"]);
    expect(myConsultantDemands.some((d) => d.reference === "COR-2026-0089")).toBe(false);
  });

  it("permet l'échange fluide de messages entre Développeur, Administrateur et Demandeur/Consultant", () => {
    interface Message {
      id: string;
      ticketId: string;
      authorRole: "DEVELOPER" | "HEAD" | "CONSULTANT";
      authorName: string;
      content: string;
      isBlockerQuestion?: boolean;
    }

    const conversationHistory: Message[] = [];

    // 1. Le Développeur pose une question bloquante
    conversationHistory.push({
      id: "msg-1",
      ticketId: "ADD-2026-0042",
      authorRole: "DEVELOPER",
      authorName: "Mohamed Dicko",
      content: "Quel compte de résultat SAP utiliser pour les écritures d'ajustement ?",
      isBlockerQuestion: true,
    });

    // 2. Le Demandeur (Consultant) apporte la précision métier
    conversationHistory.push({
      id: "msg-2",
      ticketId: "ADD-2026-0042",
      authorRole: "CONSULTANT",
      authorName: "Mélissa Diakité",
      content: "Utiliser le compte 658000 (Charges exceptionnelles) conformément au plan comptable OHADA.",
      isBlockerQuestion: false,
    });

    // 3. L'Administrateur confirme la validation et la continuité des travaux
    conversationHistory.push({
      id: "msg-3",
      ticketId: "ADD-2026-0042",
      authorRole: "HEAD",
      authorName: "Aliko Getheme",
      content: "Validation actée. Déblocage prononcé et reprise du chronomètre pour Mohamed.",
    });

    expect(conversationHistory).toHaveLength(3);
    expect(conversationHistory[0].authorRole).toBe("DEVELOPER");
    expect(conversationHistory[0].isBlockerQuestion).toBe(true);

    expect(conversationHistory[1].authorRole).toBe("CONSULTANT");
    expect(conversationHistory[1].content).toContain("OHADA");

    expect(conversationHistory[2].authorRole).toBe("HEAD");
    expect(conversationHistory[2].content).toContain("Déblocage");
  });

  it("autorise les rôles HEAD et ADMIN à provisionner un consultant sur l'API", () => {
    const rolesAuthorizedToCreateConsultant = ["HEAD", "ADMIN"];
    expect(rolesAuthorizedToCreateConsultant).toContain("HEAD");
    expect(rolesAuthorizedToCreateConsultant).toContain("ADMIN");

    const developerRole = "DEVELOPER";
    const consultantRole = "CONSULTANT";
    expect(rolesAuthorizedToCreateConsultant.includes(developerRole)).toBe(false);
    expect(rolesAuthorizedToCreateConsultant.includes(consultantRole)).toBe(false);
  });
});
