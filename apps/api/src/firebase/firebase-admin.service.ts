import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { initializeApp, getApps, App, cert, ServiceAccount } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";
import * as path from "path";
import * as fs from "fs";

@Injectable()
export class FirebaseAdminService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseAdminService.name);
  private app!: App;

  onModuleInit() {
    const existingApps = getApps();
    if (existingApps.length > 0) {
      this.app = existingApps[0]!;
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
        if (candidate.trim().startsWith("{")) {
          credentialObj = JSON.parse(candidate);
          break;
        } else if (fs.existsSync(candidate)) {
          credentialObj = JSON.parse(fs.readFileSync(candidate, "utf8"));
          break;
        }
      }

      if (credentialObj) {
        this.app = initializeApp({
          credential: cert(credentialObj),
          projectId: process.env.FIREBASE_PROJECT_ID || (credentialObj as any).project_id || "tandem-2-75612",
        });
        this.logger.log("✅ Firebase Admin SDK initialisé avec succès pour le projet tandem-2-75612");
      } else {
        this.app = initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID || "tandem-2-75612",
        });
        this.logger.warn("Firebase Admin SDK initialisé sans clé de compte de service");
      }
    } catch (error: any) {
      this.logger.error(`Erreur d'initialisation Firebase Admin : ${error?.message || error}`);
    }
  }

  get firestore(): Firestore {
    return getFirestore(this.app);
  }

  get auth(): Auth {
    return getAuth(this.app);
  }
}
