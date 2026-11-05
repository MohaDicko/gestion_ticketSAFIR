import { 
  collection, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  addDoc 
} from "firebase/firestore";
import { db } from "./firebase";

export interface FirestoreMessage {
  id?: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderRole: "ADMIN" | "DEVELOPER" | "CONSULTANT";
  recipientRole?: "ADMIN" | "DEVELOPER" | "CONSULTANT";
  content: string;
  createdAt: any;
  isBlockerAlert?: boolean;
}

export interface FirestoreBlockerAlert {
  id?: string;
  ticketId: string;
  ticketRef: string;
  developerName: string;
  reason: string;
  status: "ACTIVE" | "RESOLVED";
  createdAt: any;
  resolvedAt?: any;
}

/**
 * Écoute en temps réel les messages d'un ticket spécifique
 */
export function subscribeTicketMessages(ticketId: string, callback: (messages: FirestoreMessage[]) => void) {
  if (!db) return () => {};
  const messagesRef = collection(db, "tickets", ticketId, "messages");
  const q = query(messagesRef, orderBy("createdAt", "asc"));

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as FirestoreMessage[];
    callback(messages);
  });
}

/**
 * Envoie un message temps réel sur un ticket
 */
export async function sendFirestoreMessage(ticketId: string, message: Omit<FirestoreMessage, "id" | "createdAt">) {
  if (!db) return;
  const messagesRef = collection(db, "tickets", ticketId, "messages");
  return addDoc(messagesRef, {
    ...message,
    createdAt: serverTimestamp(),
  });
}

/**
 * Écoute en direct les signalements de blocages pour l'Administrateur
 */
export function subscribeAdminBlockerAlerts(callback: (alerts: FirestoreBlockerAlert[]) => void) {
  if (!db) return () => {};
  const alertsRef = collection(db, "blockerAlerts");
  const q = query(alertsRef, orderBy("createdAt", "desc"));

  return onSnapshot(q, (snapshot) => {
    const alerts = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as FirestoreBlockerAlert[];
    callback(alerts);
  });
}

/**
 * Publie ou met à jour une alerte de blocage
 */
export async function setFirestoreBlockerAlert(alert: FirestoreBlockerAlert) {
  if (!db || !alert.ticketId) return;
  const alertDoc = doc(db, "blockerAlerts", alert.ticketId);
  return setDoc(alertDoc, {
    ...alert,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

