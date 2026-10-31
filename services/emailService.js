const nodemailer = require("nodemailer");

/**
 * Transporteur Nodemailer réutilisable basé sur les variables d'environnement.
 */
function createTransporter() {
  const host = process.env.SMTP_HOST || "";
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === "true";
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";

  if (!host) {
    return nodemailer.createTransport({
      jsonTransport: true,
    });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user
      ? {
          user,
          pass,
        }
      : undefined,
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === "production",
    },
  });
}

const transporter = createTransporter();

/**
 * Échappe le contenu HTML.
 */
function escapeHtml(str) {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Génère le template HTML pour l'e-mail de notification de création de ticket.
 */
function generateTicketEmailHtml(ticketData) {
  const { creatorName, creatorEmail, ticketId, ticketTitle, ticketDescription, ticketUrl } = ticketData;

  const safeTitle = escapeHtml(ticketTitle);
  const safeDesc = escapeHtml(ticketDescription).replace(/\n/g, "<br/>");
  const safeCreator = escapeHtml(creatorName);
  const safeCreatorEmail = escapeHtml(creatorEmail);
  const safeId = escapeHtml(ticketId);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nouveau Ticket SAP</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #051638 0%, #0062E6 100%); color: #ffffff; padding: 28px 32px; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; }
    .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; }
    .content { padding: 32px; }
    .badge { display: inline-block; background-color: #e0f2fe; color: #0369a1; font-weight: 700; font-size: 12px; padding: 4px 10px; border-radius: 6px; margin-bottom: 12px; }
    .ticket-title { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px; }
    .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px; font-size: 13px; line-height: 1.6; }
    .info-row { display: flex; margin-bottom: 8px; }
    .info-label { font-weight: 600; color: #64748b; width: 140px; shrink: 0; }
    .info-value { color: #1e293b; font-weight: 500; }
    .desc-box { background: #ffffff; border-left: 3px solid #0062E6; padding: 12px 16px; margin-top: 8px; font-size: 13px; color: #334155; line-height: 1.6; }
    .cta-container { text-align: center; margin: 32px 0 16px; }
    .btn { display: inline-block; background-color: #0062E6; color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 98, 230, 0.25); }
    .footer { padding: 20px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Safir Consulting — Plateforme SAP Tandem</h1>
      <p>Notification automatique d'assignation et de création de ticket</p>
    </div>
    <div class="content">
      <span class="badge">Nouveau Ticket SAP • ${safeId}</span>
      <h2 class="ticket-title">${safeTitle}</h2>
      
      <div class="info-card">
        <div class="info-row">
          <span class="info-label">Référence :</span>
          <span class="info-value"><strong>${safeId}</strong></span>
        </div>
        <div class="info-row">
          <span class="info-label">Créé par :</span>
          <span class="info-value">${safeCreator} (${safeCreatorEmail})</span>
        </div>
        <div class="info-row" style="margin-top: 12px; flex-direction: column;">
          <span class="info-label" style="width: 100%; margin-bottom: 4px;">Spécifications / Description :</span>
          <div class="desc-box">${safeDesc}</div>
        </div>
      </div>

      <div class="cta-container">
        <a href="${ticketUrl}" class="btn" target="_blank" rel="noopener noreferrer">Consulter le ticket sur la plateforme &rarr;</a>
      </div>

      <p style="font-size: 12px; color: #64748b; margin-top: 24px; text-align: center;">
        Vous pouvez répondre directement à cet e-mail pour échanger avec le demandeur (${safeCreator}).
      </p>
    </div>
    <div class="footer">
      <p style="margin: 0;">Safir Consulting BU SME &bull; Système interne de suivi des capacités SAP</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Envoie une notification par e-mail lors de la création d'un ticket.
 *
 * @param {Object} ticketData
 * @param {string} ticketData.creatorName - Nom complet du créateur
 * @param {string} ticketData.creatorEmail - Email du créateur
 * @param {string[]} ticketData.recipientEmails - Liste des e-mails destinataires
 * @param {string} ticketData.ticketId - Identifiant ou référence du ticket
 * @param {string} ticketData.ticketTitle - Titre du ticket
 * @param {string} ticketData.ticketDescription - Description du ticket
 * @param {string} ticketData.ticketUrl - Lien direct vers le ticket
 */
async function sendTicketCreatedNotification(ticketData) {
  const {
    creatorName,
    creatorEmail,
    recipientEmails,
    ticketId,
    ticketTitle,
    ticketDescription,
    ticketUrl,
  } = ticketData;

  if (!recipientEmails || recipientEmails.length === 0) {
    console.warn(`[emailService] Aucun destinataire spécifié pour le ticket ${ticketId}.`);
    return { skipped: true, reason: "No recipients" };
  }

  const senderUser = process.env.SMTP_USER || "notifications@safirconsulting.net";
  const from = `"${creatorName}" <${senderUser}>`;
  const replyTo = creatorEmail;
  const to = Array.isArray(recipientEmails) ? recipientEmails.join(", ") : recipientEmails;
  const subject = `[SAP Tandem] Nouveau ticket créé : ${ticketTitle} (${ticketId})`;
  const html = generateTicketEmailHtml(ticketData);
  const text = `Nouveau Ticket SAP : ${ticketTitle} (${ticketId})\n\nCréé par : ${creatorName} (${creatorEmail})\n\nDescription :\n${ticketDescription}\n\nAccéder au ticket : ${ticketUrl}`;

  const mailOptions = {
    from,
    replyTo,
    to,
    subject,
    text,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[emailService] E-mail de création de ticket envoyé avec succès pour ${ticketId}. Destinataires: ${to}.`);
    return info;
  } catch (err) {
    console.error(`[emailService] Erreur lors de l'envoi de l'e-mail pour le ticket ${ticketId} :`, err?.message || err);
    throw err;
  }
}

module.exports = {
  transporter,
  sendTicketCreatedNotification,
};
