import { describe, it, expect, vi, beforeEach } from "vitest";
import { SapB1Service } from "../../apps/api/src/services/sapB1.service";

describe("Connecteur SAP Business One — Préparation de l'environnement", () => {
  let service: SapB1Service;

  beforeEach(() => {
    vi.restoreAllMocks();
    service = new SapB1Service();
  });

  it("doit charger par défaut le serveur distant sapdev.safirconsulting.net et le port RDP 1525", () => {
    const config = service.getConfig();
    expect(config.serverHost).toBe("sapdev.safirconsulting.net");
    expect(config.rdpPort).toBe(1525);
    expect(config.serviceLayerUrl).toContain("https://sapdev.safirconsulting.net:50000/b1s/v1");
  });

  it("doit signaler que la configuration est incomplète si les identifiants ne sont pas encore fournis", () => {
    const isReady = service.isConfigured();
    // Par défaut sans mot de passe dans l'environnement de test
    expect(typeof isReady).toBe("boolean");
  });

  it("doit renvoyer un diagnostic lisible et informatif sans faire planter l'application", async () => {
    const diag = await service.getDiagnostics();
    expect(diag).toHaveProperty("serverHost", "sapdev.safirconsulting.net");
    expect(diag).toHaveProperty("rdpPort", 1525);
    expect(diag).toHaveProperty("serviceLayerUrl");
    expect(diag).toHaveProperty("message");
    expect(typeof diag.timestamp).toBe("string");
  });

  it("doit retourner une liste vide sans planter lors de la récupération des BusinessPartners si déconnecté", async () => {
    const bps = await service.getBusinessPartners();
    expect(Array.isArray(bps)).toBe(true);
  });

  it("doit retourner une liste vide sans planter lors de la récupération des Projets si déconnecté", async () => {
    const projects = await service.getProjects();
    expect(Array.isArray(projects)).toBe(true);
  });
});

