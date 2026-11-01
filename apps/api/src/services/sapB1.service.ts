import { Injectable, Logger } from "@nestjs/common";
import * as net from "net";
import * as https from "https";
import { URL } from "url";

export interface SapB1Config {
  serverHost: string;
  rdpPort: number;
  serviceLayerUrl: string;
  companyDb: string;
  username: string;
  hasPassword: boolean;
  verifySsl: boolean;
}

export interface SapConnectionStatus {
  isConfigured: boolean;
  serverHost: string;
  rdpPort: number;
  serviceLayerUrl: string;
  companyDb: string;
  username: string;
  networkReachable?: boolean;
  serviceLayerReachable?: boolean;
  authenticated?: boolean;
  message: string;
  timestamp: string;
}

export interface SapBusinessPartner {
  cardCode: string;
  cardName: string;
  cardType: "cCustomer" | "cSupplier" | "cLid";
  email?: string;
  phone?: string;
}

export interface SapProject {
  code: string;
  name: string;
  active: boolean;
}

@Injectable()
export class SapB1Service {
  private readonly logger = new Logger(SapB1Service.name);
  private sessionCookie: string | null = null;
  private routeIdCookie: string | null = null;
  private sessionExpiry: number = 0;

  /**
   * Retourne la configuration actuelle de SAP B1 chargée depuis l'environnement.
   */
  getConfig(): SapB1Config {
    return {
      serverHost: process.env.SAP_SERVER_HOST || "sapdev.safirconsulting.net",
      rdpPort: Number(process.env.SAP_RDP_PORT) || 1525,
      serviceLayerUrl: process.env.SAP_B1_SERVICE_LAYER_URL || "https://sapdev.safirconsulting.net:50000/b1s/v1",
      companyDb: process.env.SAP_B1_COMPANY_DB || "",
      username: process.env.SAP_B1_USERNAME || "",
      hasPassword: Boolean(process.env.SAP_B1_PASSWORD),
      verifySsl: process.env.SAP_B1_VERIFY_SSL === "true",
    };
  }

  /**
   * Vérifie si les identifiants minimaux pour l'authentification SAP B1 sont présents.
   */
  isConfigured(): boolean {
    const config = this.getConfig();
    return Boolean(config.companyDb && config.username && config.hasPassword);
  }

  /**
   * Teste la connectivité réseau TCP vers le serveur distant (port RDP 1525 ou port Service Layer 50000).
   */
  async testTcpPort(host: string, port: number, timeoutMs: number = 4000): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      let isResolved = false;

      socket.setTimeout(timeoutMs);

      socket.on("connect", () => {
        if (!isResolved) {
          isResolved = true;
          socket.destroy();
          resolve(true);
        }
      });

      socket.on("timeout", () => {
        if (!isResolved) {
          isResolved = true;
          socket.destroy();
          resolve(false);
        }
      });

      socket.on("error", () => {
        if (!isResolved) {
          isResolved = true;
          socket.destroy();
          resolve(false);
        }
      });

      try {
        socket.connect(port, host);
      } catch {
        resolve(false);
      }
    });
  }

  private requestJson(
    urlString: string,
    options: { method?: string; headers?: Record<string, string>; body?: string },
    verifySsl: boolean,
  ): Promise<{ statusCode: number; headers: Record<string, string | string[] | undefined>; body: string }> {
    return new Promise((resolve, reject) => {
      const url = new URL(urlString);
      const request = https.request(
        {
          hostname: url.hostname,
          port: url.port || 443,
          path: `${url.pathname}${url.search}`,
          method: options.method || "GET",
          headers: options.headers,
          rejectUnauthorized: verifySsl,
        },
        (response) => {
          const chunks: Buffer[] = [];
          response.on("data", (chunk: Buffer) => chunks.push(chunk));
          response.on("end", () => {
            resolve({
              statusCode: response.statusCode || 500,
              headers: response.headers,
              body: Buffer.concat(chunks).toString("utf8"),
            });
          });
        },
      );

      request.setTimeout(30000, () => request.destroy(new Error("Délai de connexion SAP dépassé")));
      request.on("error", reject);
      if (options.body) {
        request.write(options.body);
      }
      request.end();
    });
  }

  /**
   * Réalise un diagnostic complet de connexion vers SAP Business One.
   */
  async getDiagnostics(): Promise<SapConnectionStatus> {
    const config = this.getConfig();
    const timestamp = new Date().toISOString();

    if (!this.isConfigured()) {
      return {
        isConfigured: false,
        serverHost: config.serverHost,
        rdpPort: config.rdpPort,
        serviceLayerUrl: config.serviceLayerUrl,
        companyDb: config.companyDb || "(non renseigné)",
        username: config.username || "(non renseigné)",
        message: "En attente des identifiants (CompanyDB, Login, Mot de passe) dans le fichier .env.",
        timestamp,
      };
    }

    // Si configuré, tester la connexion réelle
    try {
      const loginSuccess = await this.authenticate();
      return {
        isConfigured: true,
        serverHost: config.serverHost,
        rdpPort: config.rdpPort,
        serviceLayerUrl: config.serviceLayerUrl,
        companyDb: config.companyDb,
        username: config.username,
        authenticated: loginSuccess,
        networkReachable: true,
        message: loginSuccess
          ? "Connexion établie avec succès sur SAP Business One Service Layer."
          : "Échec de l'authentification : vérifiez les identifiants SAP.",
        timestamp,
      };
    } catch (err: any) {
      this.logger.warn(`[SapB1Service] Erreur lors du diagnostic SAP B1: ${err?.message || err}`);
      return {
        isConfigured: true,
        serverHost: config.serverHost,
        rdpPort: config.rdpPort,
        serviceLayerUrl: config.serviceLayerUrl,
        companyDb: config.companyDb,
        username: config.username,
        authenticated: false,
        message: `Erreur de connexion : ${err?.message || "Serveur injoignable"}`,
        timestamp,
      };
    }
  }

  /**
   * Authentifie la session auprès de SAP B1 Service Layer et stocke les cookies de session.
   */
  async authenticate(): Promise<boolean> {
    const config = this.getConfig();
    if (!this.isConfigured()) {
      return false;
    }

    const loginUrl = `${config.serviceLayerUrl.replace(/\/$/, "")}/Login`;
    const payload = {
      CompanyDB: config.companyDb,
      UserName: config.username,
      Password: process.env.SAP_B1_PASSWORD || "",
    };
    const body = JSON.stringify(payload);

    try {
      const response = await this.requestJson(loginUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": String(Buffer.byteLength(body)),
          Accept: "application/json",
        },
        body,
      }, config.verifySsl);

      if (response.statusCode < 200 || response.statusCode >= 300) {
        this.logger.error(`[SapB1Service] Échec Login SAP B1 HTTP ${response.statusCode}: ${response.body}`);
        return false;
      }

      // Récupérer le cookie de session
      const setCookie = response.headers["set-cookie"];
      if (setCookie) {
        this.sessionCookie = Array.isArray(setCookie) ? setCookie.join("; ") : setCookie;
      }

      const data = JSON.parse(response.body) as { SessionTimeout?: number };
      const timeoutMinutes = data.SessionTimeout || 30;
      this.sessionExpiry = Date.now() + (timeoutMinutes - 2) * 60 * 1000;

      this.logger.log(`[SapB1Service] Session SAP B1 établie avec succès (Société: ${config.companyDb}).`);
      return true;
    } catch (err: any) {
      this.logger.error(`[SapB1Service] Impossible de contacter le Service Layer: ${err?.message || err}`);
      throw err;
    }
  }

  /**
   * Récupère la liste des Partenaires / Clients (BusinessPartners - OCRD) depuis SAP B1.
   */
  async getBusinessPartners(search?: string): Promise<SapBusinessPartner[]> {
    if (!this.isConfigured()) {
      this.logger.debug("[SapB1Service] Non configuré : renvoi de la liste locale.");
      return [];
    }

    try {
      if (Date.now() > this.sessionExpiry) {
        await this.authenticate();
      }

      const config = this.getConfig();
      let url = `${config.serviceLayerUrl.replace(/\/$/, "")}/BusinessPartners?$select=CardCode,CardName,CardType,EmailAddress,Phone1&$filter=CardType eq 'cCustomer'`;
      if (search) {
        url += ` and contains(CardName, '${search.replace(/'/g, "''")}')`;
      }

      const response = await this.requestJson(url, {
        headers: {
          Accept: "application/json",
          Cookie: this.sessionCookie || "",
        },
      }, this.getConfig().verifySsl);

      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw new Error(`HTTP ${response.statusCode}: ${response.body}`);
      }

      const data = JSON.parse(response.body) as { value?: Array<Record<string, string>> };
      return (data.value || []).map((bp: any) => ({
        cardCode: bp.CardCode,
        cardName: bp.CardName,
        cardType: bp.CardType,
        email: bp.EmailAddress,
        phone: bp.Phone1,
      }));
    } catch (err: any) {
      this.logger.warn(`[SapB1Service] Échec récupération BusinessPartners: ${err?.message || err}`);
      return [];
    }
  }

  /**
   * Récupère la liste des Projets (Projects - OPRJ) depuis SAP B1.
   */
  async getProjects(): Promise<SapProject[]> {
    if (!this.isConfigured()) {
      return [];
    }

    try {
      if (Date.now() > this.sessionExpiry) {
        await this.authenticate();
      }

      const config = this.getConfig();
      const url = `${config.serviceLayerUrl.replace(/\/$/, "")}/Projects?$select=Code,Name,Active&$filter=Active eq 'tYES'`;

      const response = await this.requestJson(url, {
        headers: {
          Accept: "application/json",
          Cookie: this.sessionCookie || "",
        },
      }, this.getConfig().verifySsl);

      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw new Error(`HTTP ${response.statusCode}: ${response.body}`);
      }

      const data = JSON.parse(response.body) as { value?: Array<Record<string, string>> };
      return (data.value || []).map((p: any) => ({
        code: p.Code,
        name: p.Name,
        active: p.Active === "tYES",
      }));
    } catch (err: any) {
      this.logger.warn(`[SapB1Service] Échec récupération Projects: ${err?.message || err}`);
      return [];
    }
  }
}
