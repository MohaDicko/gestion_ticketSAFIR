import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { initializeApp, getApps, App, cert, ServiceAccount } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";
import * as path from "path";
import * as fs from "fs";

@Injectable()
export class FirebaseAdminService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseAdminService.name);
  private app: App | null = null;
  private isReady = false;

  onModuleInit() {
    this.ensureInitialized();
  }

  private ensureInitialized() {
    if (this.isReady && this.app) return;

    const existingApps = getApps();
    if (existingApps.length > 0) {
      this.app = existingApps[0]!;
      this.isReady = true;
      return;
    }

    try {
      const candidates = [
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
        path.resolve(process.cwd(), "firebase-service-account.json"),
        path.resolve(process.cwd(), "../../firebase-service-account.json"),
        path.resolve(__dirname, "../../../../firebase-service-account.json"),
      ].filter(Boolean);

      let credentialObj: ServiceAccount | null = null;

      for (const candidate of candidates) {
        if (!candidate) continue;
        const trimmed = candidate.trim().replace(/^['"]|['"]$/g, "");
        if (trimmed.startsWith("{")) {
          try {
            credentialObj = JSON.parse(trimmed);
          } catch {
            // Gère le cas où Vercel a converti les \n en retours à la ligne réels
            const sanitized = trimmed.replace(/\r?\n/g, "\\n");
            credentialObj = JSON.parse(sanitized);
          }
          break;
        } else if (fs.existsSync(trimmed)) {
          credentialObj = JSON.parse(fs.readFileSync(trimmed, "utf8"));
          break;
        }
      }

      if (credentialObj) {
        if ((credentialObj as any).private_key) {
          (credentialObj as any).private_key = String((credentialObj as any).private_key).replace(/\\n/g, "\n");
        }
        this.app = initializeApp({
          credential: cert(credentialObj),
          projectId: process.env.FIREBASE_PROJECT_ID || (credentialObj as any).project_id || "tandem-2-75612",
        });
        this.isReady = true;
        this.logger.log("✅ Firebase Admin SDK initialisé avec succès pour le projet tandem-2-75612");
      } else {
        this.logger.warn("Firebase Admin SDK : aucune clé de compte de service valide détectée, repli PostgreSQL actif");
      }
    } catch (error: any) {
      this.logger.error(`Erreur d'initialisation Firebase Admin : ${error?.message || error}`);
    }
  }

  get firestore(): Firestore | null {
    try {
      this.ensureInitialized();
      if (!this.isReady || !this.app) return null;
      return getFirestore(this.app);
    } catch {
      return null;
    }
  }

  get auth(): Auth | null {
    try {
      this.ensureInitialized();
      if (!this.isReady || !this.app) return null;
      return getAuth(this.app);
    } catch {
      return null;
    }
  }
}
