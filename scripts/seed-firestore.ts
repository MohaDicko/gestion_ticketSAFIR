import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as argon2 from "argon2";
import * as path from "path";

const cred = require(path.resolve(__dirname, "../firebase-service-account.json"));
initializeApp({ credential: cert(cred) });
const db = getFirestore();

async function seed() {
  console.log("🚀 Début du provisioning des comptes dans Firestore...");

  const defaultDevHash = await argon2.hash("Safir2026!Dev", { type: argon2.argon2id });
  const defaultConsultantHash = await argon2.hash("Safir2026!Consultant", { type: argon2.argon2id });
  const adminHash = await argon2.hash("Tamden2026", { type: argon2.argon2id });

  const users = [
    {
      id: "user-superadmin",
      email: "superadmin@safirconsulting.net",
      firstName: "Aliko",
      lastName: "Getheme",
      role: "HEAD",
      roles: ["HEAD", "ADMIN"],
      passwordHash: adminHash,
      isActive: true,
      mustChangePassword: false,
    },
    {
      id: "user-admin",
      email: "aliko.getheme@safirconsulting.net",
      firstName: "Aliko",
      lastName: "Getheme",
      role: "ADMIN",
      roles: ["ADMIN"],
      passwordHash: adminHash,
      isActive: true,
      mustChangePassword: false,
    },
    {
      id: "user-consultant-test",
      email: "test.test@safirconsulting.net",
      firstName: "test",
      lastName: "test",
      role: "CONSULTANT",
      roles: ["CONSULTANT"],
      passwordHash: defaultConsultantHash,
      isActive: true,
      mustChangePassword: false,
    },
    {
      id: "user-dev-anoop",
      email: "anoop.pandimukkula@safirconsulting.net",
      firstName: "Anoop",
      lastName: "Pandimukkula",
      role: "DEVELOPER",
      roles: ["DEVELOPER"],
      passwordHash: defaultDevHash,
      isActive: true,
      mustChangePassword: false,
    },
  ];

  for (const u of users) {
    await db.collection("users").doc(u.email).set({
      ...u,
      updatedAt: new Date(),
    }, { merge: true });
    console.log(`✅ Utilisateur provisionné : ${u.email} (${u.role})`);
  }

  console.log("🎉 Provisioning Firestore terminé avec succès !");
}

seed().catch(console.error);
