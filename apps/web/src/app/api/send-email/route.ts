import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

/**
 * Endpoint API pour l'envoi d'e-mails réels (Nodemailer)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      creatorName,
      creatorEmail,
      recipientEmails,
      ticketId,
      ticketTitle,
      ticketDescription,
      ticketUrl,
    } = body;

    if (!recipientEmails || !Array.isArray(recipientEmails) || recipientEmails.length === 0) {
      return NextResponse.json(
        { skipped: true, message: "Aucun destinataire fourni" },
        { status: 200 }
      );
    }

    const host = process.env.SMTP_HOST || "";
    const port = Number(process.env.SMTP_PORT) || 587;
    const secure = process.env.SMTP_SECURE === "true";
    const user = process.env.SMTP_USER || "";
    const pass = process.env.SMTP_PASS || "";

    const transporter = host
      ? nodemailer.createTransport({
          host,
          port,
          secure,
          auth: user ? { user, pass } : undefined,
          tls: { rejectUnauthorized: process.env.NODE_ENV === "production" },
        })
      : nodemailer.createTransport({ jsonTransport: true });

    const escapeHtml = (str: string) =>
      (str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const safeTitle = escapeHtml(ticketTitle || "Ticket SAP");
    const safeDesc = escapeHtml(ticketDescription || "").replace(/\n/g, "<br/>");
    const safeCreator = escapeHtml(creatorName || "Collaborateur Safir");
    const safeCreatorEmail = escapeHtml(creatorEmail || "support@safirconsulting.net");
    const safeId = escapeHtml(ticketId || "ADD-2026-XXXX");
    const safeUrl = ticketUrl || "http://localhost:3000";

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Nouveau Ticket SAP</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #051638 0%, #0062E6 100%); color: #ffffff; padding: 28px 32px; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; }
    .content { padding: 32px; }
    .badge { display: inline-block; background-color: #e0f2fe; color: #0369a1; font-weight: 700; font-size: 12px; padding: 4px 10px; border-radius: 6px; margin-bottom: 12px; }
    .ticket-title { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px; }
    .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px; font-size: 13px; line-height: 1.6; }
    .desc-box { background: #ffffff; border-left: 3px solid #0062E6; padding: 12px 16px; margin-top: 8px; font-size: 13px; color: #334155; }
    .cta-container { text-align: center; margin: 32px 0 16px; }
    .btn { display: inline-block; background-color: #0062E6; color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 8px; }
    .footer { padding: 20px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Safir Consulting — Plateforme SAP Tandem</h1>
      <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Notification automatique d'assignation et de création de ticket</p>
    </div>
    <div class="content">
      <span class="badge">Nouveau Ticket SAP • ${safeId}</span>
      <h2 class="ticket-title">${safeTitle}</h2>
      <div class="info-card">
        <p><strong>Référence :</strong> ${safeId}</p>
        <p><strong>Créé par :</strong> ${safeCreator} (${safeCreatorEmail})</p>
        <div style="margin-top: 12px;">
          <strong>Spécifications / Description :</strong>
          <div class="desc-box">${safeDesc}</div>
        </div>
      </div>
      <div class="cta-container">
        <a href="${safeUrl}" class="btn" target="_blank" rel="noopener noreferrer">Consulter le ticket sur la plateforme &rarr;</a>
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

    const senderUser = process.env.SMTP_USER || "notifications@safirconsulting.net";
    const mailOptions = {
      from: `"${creatorName || "Collaborateur Safir"}" <${senderUser}>`,
      replyTo: creatorEmail || senderUser,
      to: recipientEmails.join(", "),
      subject: `[SAP Tandem] Nouveau ticket créé : ${ticketTitle} (${safeId})`,
      text: `Nouveau Ticket SAP : ${ticketTitle} (${safeId})\nCréé par : ${creatorName} (${creatorEmail})\n\nDescription :\n${ticketDescription}\n\nLien : ${safeUrl}`,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    return NextResponse.json({
      success: true,
      messageId: info?.messageId || "mock-delivered",
      to: recipientEmails,
    });
  } catch (error: any) {
    console.error("[API send-email] Erreur envoi SMTP:", error?.message || error);
    return NextResponse.json(
      { success: false, error: error?.message || "Erreur SMTP" },
      { status: 500 }
    );
  }
}

