import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

/**
 * Charge les variables d'environnement depuis .env racine ou local si non chargées.
 */
function loadEnvFallback() {
  const possiblePaths = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "../../.env"),
    path.resolve(process.cwd(), "../.env"),
  ];

  for (const envPath of possiblePaths) {
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, "utf-8");
        const lines = content.split(/\r?\n/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
            const [k, ...v] = trimmed.split("=");
            const key = k.trim();
            const val = v.join("=").trim().replace(/^["']|["']$/g, "");
            if (!process.env[key] && val) {
              process.env[key] = val;
            }
          }
        }
      } catch (_) {}
    }
  }
}

loadEnvFallback();

/**
 * Envoi d'e-mail via l'API REST HTTPS Brevo (Garantit le passage à travers tous les pare-feux et FAI sur port 443)
 */
async function sendViaBrevoHttpApi(apiKey: string, emailData: {
  senderName: string;
  senderEmail: string;
  recipients: string[];
  replyTo: string;
  subject: string;
  htmlContent: string;
  textContent: string;
}) {
  const payload = {
    sender: {
      name: emailData.senderName,
      email: emailData.senderEmail || "notifications@safirconsulting.net",
    },
    to: emailData.recipients.map((email) => ({ email })),
    replyTo: {
      email: emailData.replyTo,
      name: emailData.senderName,
    },
    subject: emailData.subject,
    htmlContent: emailData.htmlContent,
    textContent: emailData.textContent,
  };

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
      "accept": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Erreur API Brevo (${response.status}): ${errorBody}`);
  }

  const result = await response.json();
  return {
    messageId: result.messageId || `brevo-${Date.now()}`,
    service: "BREVO_HTTPS_API",
  };
}

/**
 * Obtient un transporteur Nodemailer fonctionnel.
 */
async function getTransporter() {
  loadEnvFallback();

  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  // 1. Si un hôte SMTP réel est configuré par l'utilisateur
  if (host) {
    console.log(`[send-email] Connexion au transporteur SMTP configuré : ${host}:${port} (user: ${user || "anonyme"})`);
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: user ? { user, pass } : undefined,
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Configuration e-mail manquante : SMTP_HOST ou BREVO_API_KEY est requis en production");
  }

  // En développement uniquement, permettre les tests sans serveur SMTP local.
  try {
    const testAccount = await nodemailer.createTestAccount();
    console.log(`[send-email] Compte SMTP test Ethereal généré : ${testAccount.user}`);
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  } catch (err: any) {
    console.warn(`[send-email] Fallback jsonTransport suite à l'indisponibilité du test SMTP :`, err?.message);
    return nodemailer.createTransport({ jsonTransport: true });
  }
}

/**
 * Endpoint API pour l'envoi d'e-mails réels (Nodemailer & Brevo HTTPS)
 */
export async function POST(req: Request) {
  try {
    loadEnvFallback();
    const body = await req.json();

    // Normalisation des destinataires
    let recipientList: string[] = [];
    if (Array.isArray(body.recipientEmails)) {
      recipientList = body.recipientEmails;
    } else if (Array.isArray(body.recipients)) {
      recipientList = body.recipients
        .map((r: any) => (typeof r === "string" ? r : r?.email))
        .filter(Boolean);
    } else if (typeof body.recipientEmails === "string") {
      recipientList = body.recipientEmails.split(",").map((s: string) => s.trim());
    } else if (typeof body.to === "string") {
      recipientList = body.to.split(",").map((s: string) => s.trim());
    }

    // Filtrer et dédoublonner
    recipientList = Array.from(new Set(recipientList.filter((e) => e && e.includes("@"))));

    if (recipientList.length === 0) {
      console.warn("[send-email] Aucun destinataire valide trouvé dans la requête :", body);
      return NextResponse.json(
        { success: false, skipped: true, message: "Aucun destinataire e-mail valide fourni" },
        { status: 200 }
      );
    }

    const creatorName = body.creatorName || body.applicantName || "Collaborateur Safir";
    const creatorEmail = body.creatorEmail || body.applicantEmail || process.env.ALIKO_EMAIL || "notifications@safirconsulting.net";
    const ticketId = body.ticketId || body.ticketReference || "ADD-2026-TANDEM";
    const ticketTitle = body.ticketTitle || body.subject || "Nouveau besoin SAP";
    const ticketDescription = body.ticketDescription || body.description || body.bodyText || body.body || "Demande enregistrée sur la plateforme SAP Tandem.";
    const ticketUrl = body.ticketUrl || "http://localhost:3000";

    const escapeHtml = (str: string) =>
      (str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const safeTitle = escapeHtml(ticketTitle);
    const safeDesc = escapeHtml(ticketDescription).replace(/\n/g, "<br/>");
    const safeCreator = escapeHtml(creatorName);
    const safeCreatorEmail = escapeHtml(creatorEmail);
    const safeId = escapeHtml(ticketId);
    const safeUrl = escapeHtml(ticketUrl);

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nouveau Ticket SAP — ${safeId}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #051638 0%, #0062E6 100%); color: #ffffff; padding: 28px 32px; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
    .content { padding: 32px; }
    .badge { display: inline-block; background-color: #e0f2fe; color: #0369a1; font-weight: 700; font-size: 12px; padding: 4px 10px; border-radius: 6px; margin-bottom: 12px; }
    .ticket-title { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px; line-height: 1.4; }
    .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px; font-size: 13px; line-height: 1.6; }
    .info-row { display: flex; margin-bottom: 8px; }
    .info-row:last-child { margin-bottom: 0; }
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
      <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9;">Notification automatique d'assignation et de création de ticket</p>
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
        <a href="${safeUrl}" class="btn" target="_blank" rel="noopener noreferrer">Consulter le ticket sur la plateforme &rarr;</a>
      </div>
      <p style="font-size: 12px; color: #64748b; margin-top: 24px; text-align: center;">
        Vous pouvez répondre directement à cet e-mail pour échanger avec le créateur (${safeCreator}).
      </p>
    </div>
    <div class="footer">
      <p style="margin: 0;">Safir Consulting BU SME &bull; Suivi des Capacités SAP Tandem</p>
      <p style="margin: 4px 0 0;">Notification générée automatiquement lors de la création du ticket.</p>
    </div>
  </div>
</body>
</html>`;

    const subject = `[SAP Tandem] Nouveau ticket créé : ${ticketTitle} (${safeId})`;
    const textContent = `Nouveau Ticket SAP : ${ticketTitle} (${safeId})\nCréé par : ${creatorName} (${creatorEmail})\n\nDescription :\n${ticketDescription}\n\nLien : ${ticketUrl}`;

    // 1. Détection prioritaire Clé API Brevo (Port 443 HTTPS sans blocage réseau)
    const brevoApiKey = process.env.BREVO_API_KEY?.trim() || (process.env.SMTP_PASS?.trim().startsWith("xkeysib-") ? process.env.SMTP_PASS.trim() : null);
    if (brevoApiKey) {
      console.log(`[send-email] 🚀 Envoi direct via l'API REST HTTPS Brevo vers ${recipientList.join(", ")}...`);
      const brevoSenderEmail = process.env.MAIL_FROM_EMAIL?.trim() || "aliko.getheme@safirconsulting.net";
      const apiResult = await sendViaBrevoHttpApi(brevoApiKey, {
        senderName: creatorName,
        senderEmail: brevoSenderEmail,
        recipients: recipientList,
        replyTo: creatorEmail,
        subject,
        htmlContent: html,
        textContent,
      });

      console.log(`[send-email] ✅ E-mail réel délivré via API Brevo ! MessageId:`, apiResult.messageId);
      return NextResponse.json({
        success: true,
        messageId: apiResult.messageId,
        to: recipientList,
        service: "BREVO_API",
      });
    }

    // 2. Envoi via Transporteur SMTP Nodemailer standard
    const transporter = await getTransporter();
    const authSmtpUser = process.env.MAIL_FROM_EMAIL || process.env.SMTP_USER || "aliko.getheme@safirconsulting.net";
    const from = `"${creatorName}" <${authSmtpUser}>`;
    const replyTo = creatorEmail;
    const to = recipientList.join(", ");

    const mailOptions = {
      from,
      replyTo,
      to,
      subject,
      text: textContent,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info) || null;

    console.log(`[send-email] ✅ E-mail délivré avec succès via SMTP ! MessageId: ${info.messageId}, Destinataires: ${to}${previewUrl ? `, Preview: ${previewUrl}` : ""}`);

    return NextResponse.json({
      success: true,
      messageId: info?.messageId || `sent-${Date.now()}`,
      to: recipientList,
      previewUrl,
      service: "SMTP",
    });
  } catch (error: any) {
    console.error("[send-email] ❌ Erreur lors de l'envoi :", error?.message || error);
    return NextResponse.json(
      { success: false, error: error?.message || "Erreur interne d'envoi" },
      { status: 500 }
    );
  }
}
