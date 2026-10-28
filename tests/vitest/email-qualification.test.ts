import { describe, it, expect } from "vitest";

export function resolveSenderClassification(
  senderEmail: string,
  knownClients: { domain: string; clientId: string }[],
  knownContacts: { email: string; isPersonal: boolean }[],
) {
  const emailLower = senderEmail.toLowerCase().trim();
  const domain = emailLower.split("@")[1] || "";

  const personalDomains = [
    "gmail.com",
    "yahoo.com",
    "yahoo.fr",
    "hotmail.com",
    "hotmail.fr",
    "outlook.com",
    "live.com",
    "icloud.com",
    "orange.fr",
  ];
  const isPersonalDomain = personalDomains.includes(domain);

  // 1. Collaborateur Safir Consulting
  if (domain === "safirconsulting.net" || domain === "safir.test") {
    return {
      senderKind: "CONSULTANT_OR_INTERNAL",
      badge: "🏢 Consultante / Équipe Safir",
      isPersonalDomain: false,
      isWarning: false,
    };
  }

  // 2. Contact Client Officiel Enregistré
  const contact = knownContacts.find((c) => c.email.toLowerCase() === emailLower);
  if (contact) {
    return {
      senderKind: "CLIENT_CONTACT",
      badge: "🤝 Contact Client Officiel",
      isPersonalDomain: contact.isPersonal,
      isWarning: false,
    };
  }

  // 3. Domaine d'un client référencé (hors webmail perso)
  if (!isPersonalDomain && domain) {
    const client = knownClients.find((c) => c.domain.toLowerCase() === domain);
    if (client) {
      return {
        senderKind: "CLIENT_CONTACT",
        badge: "🤝 Contact Client Officiel",
        isPersonalDomain: false,
        isWarning: false,
      };
    }
  }

  // 4. Adresse Personnelle non référencée -> Alerte Rouge Anti-usurpation
  if (isPersonalDomain) {
    return {
      senderKind: "UNKNOWN",
      badge: "⚠️ Vigilance : Domaine personnel non validé",
      isPersonalDomain: true,
      isWarning: true,
    };
  }

  // 5. Autre tiers extérieur inconnu
  return {
    senderKind: "UNKNOWN",
    badge: "🌐 Personne Extérieure",
    isPersonalDomain: false,
    isWarning: false,
  };
}

describe("Classification Intelligente des E-mails Entrants (Section 4 du Cahier des Charges)", () => {
  const mockClients = [{ domain: "client-omega.com", clientId: "cli-omega" }];
  const mockContacts = [{ email: "contact.valide@gmail.com", isPersonal: true }];

  it("reconnaît automatiquement un consultant ou collaborateur Safir (@safirconsulting.net)", () => {
    const res = resolveSenderClassification("melissa.diakite@safirconsulting.net", mockClients, mockContacts);
    expect(res.senderKind).toBe("CONSULTANT_OR_INTERNAL");
    expect(res.badge).toContain("Safir");
    expect(res.isWarning).toBe(false);
  });

  it("reconnaît un contact client officiel via son domaine d'entreprise", () => {
    const res = resolveSenderClassification("c.durand@client-omega.com", mockClients, mockContacts);
    expect(res.senderKind).toBe("CLIENT_CONTACT");
    expect(res.badge).toContain("Client Officiel");
    expect(res.isWarning).toBe(false);
  });

  it("lève une alerte de vigilance rouge sur une adresse Gmail / Yahoo non enregistrée", () => {
    const res = resolveSenderClassification("consultant.freelance92@gmail.com", mockClients, mockContacts);
    expect(res.senderKind).toBe("UNKNOWN");
    expect(res.isPersonalDomain).toBe(true);
    expect(res.isWarning).toBe(true);
    expect(res.badge).toContain("Vigilance : Domaine personnel non validé");
  });

  it("accepte sans alerte une adresse Gmail préalablement validée par Aliko", () => {
    const res = resolveSenderClassification("contact.valide@gmail.com", mockClients, mockContacts);
    expect(res.senderKind).toBe("CLIENT_CONTACT");
    expect(res.isWarning).toBe(false);
  });

  it("classe en personne extérieure un nouveau prospect d'une société tierce", () => {
    const res = resolveSenderClassification("directeur@nouvelle-societe-partenaire.fr", mockClients, mockContacts);
    expect(res.senderKind).toBe("UNKNOWN");
    expect(res.isPersonalDomain).toBe(false);
    expect(res.isWarning).toBe(false);
    expect(res.badge).toContain("Personne Extérieure");
  });
});
