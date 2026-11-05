import { Injectable, Logger } from "@nestjs/common";
import { FirebaseAdminService } from "../firebase/firebase-admin.service";
import { FieldValue } from "firebase-admin/firestore";

@Injectable()
export class FirebaseSyncService {
  private readonly logger = new Logger(FirebaseSyncService.name);

  constructor(private readonly firebaseAdmin: FirebaseAdminService) {}

  /**
   * Synchronise un ticket dans Cloud Firestore pour accès direct et temps réel
   */
  async syncTicket(ticket: any) {
    try {
      const db = this.firebaseAdmin.firestore;
      if (!db || !ticket?.id) return;

      const ticketRef = db.collection("tickets").doc(ticket.id);
      await ticketRef.set({
        reference: ticket.reference,
        title: ticket.title,
        description: ticket.description,
        status: ticket.status,
        typeCode: ticket.type?.code || ticket.typeCode || "ADDON",
        priorityCode: ticket.priority?.code || ticket.priorityCode || "HIGH",
        clientCompany: ticket.client?.name || ticket.clientCompany || "Safir Consulting",
        applicantName: ticket.applicantName || ticket.consultant?.name || "Consultant Safir",
        applicantEmail: ticket.applicantEmail || ticket.consultant?.email,
        assignedDeveloperId: ticket.assignedDeveloper?.id || ticket.assignedDeveloperId || null,
        assignedDeveloperName: ticket.assignedDeveloper?.name || null,
        estimatedHours: Number(ticket.estimatedHours) || 0,
        spentHours: Number(ticket.spentHours) || 0,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      this.logger.log(`[FirebaseSync] Ticket ${ticket.reference || ticket.id} synchronisé dans Firestore`);
    } catch (err: any) {
      this.logger.warn(`[FirebaseSync] Erreur sync ticket ${ticket?.id} : ${err?.message || err}`);
    }
  }

  /**
   * Enregistre un message dans la sous-collection du ticket
   */
  async addTicketMessage(ticketId: string, message: {
    senderId: string;
    senderName: string;
    senderRole: string;
    content: string;
  }) {
    try {
      const db = this.firebaseAdmin.firestore;
      if (!db || !ticketId) return;

      const messageRef = db.collection("tickets").doc(ticketId).collection("messages").doc();
      await messageRef.set({
        ...message,
        createdAt: FieldValue.serverTimestamp(),
      });
    } catch (err: any) {
      this.logger.warn(`[FirebaseSync] Erreur sync message : ${err?.message || err}`);
    }
  }

  /**
   * Publie une alerte de blocage pour les admins
   */
  async notifyBlocker(ticketId: string, alert: {
    ticketRef: string;
    developerName: string;
    reason: string;
    status: "ACTIVE" | "RESOLVED";
  }) {
    try {
      const db = this.firebaseAdmin.firestore;
      if (!db || !ticketId) return;

      const alertRef = db.collection("blockerAlerts").doc(ticketId);
      await alertRef.set({
        ticketId,
        ...alert,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    } catch (err: any) {
      this.logger.warn(`[FirebaseSync] Erreur sync blocage : ${err?.message || err}`);
    }
  }
}

