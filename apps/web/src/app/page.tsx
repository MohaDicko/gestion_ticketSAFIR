"use client";

import React, { useState } from "react";
import {
  Users,
  Inbox,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Server,
  Layers,
  Mail,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Cpu,
  RefreshCw,
  Database,
} from "lucide-react";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"capacity" | "recommendation" | "inbox" | "sap">("capacity");
  const [selectedTicket, setSelectedTicket] = useState("ADD-2026-0001");

  // Données de simulation basées sur le cahier des charges et la matrice des 8 développeurs
  const developers = [
    { id: "1", name: "Marc D.", role: "Lead SAP B1", skills: ["Service Layer", "HANA SQL", "UI API"], load: 85, hours: 34, maxHours: 40, status: "Disponible dès jeudi" },
    { id: "2", name: "Sarah L.", role: "Senior S/4HANA", skills: ["ABAP", "CDS Views", "Fiori/UI5"], load: 60, hours: 24, maxHours: 40, status: "Capacité disponible" },
    { id: "3", name: "Thomas B.", role: "Full-Stack Dev", skills: ["Next.js", "NestJS", "PostgreSQL"], load: 95, hours: 38, maxHours: 40, status: "Forte charge" },
    { id: "4", name: "Amina K.", role: "Spécialiste Intégrations", skills: ["Service Layer", "Webhooks", "Node.js"], load: 45, hours: 18, maxHours: 40, status: "Forte disponibilité" },
    { id: "5", name: "Julien M.", role: "Ingénieur Backend", skills: ["NestJS", "HANA SQL", "Docker"], load: 70, hours: 28, maxHours: 40, status: "Capacité disponible" },
    { id: "6", name: "Elena R.", role: "Dev SAP Fiori", skills: ["Fiori/UI5", "CDS Views", "React"], load: 50, hours: 20, maxHours: 40, status: "Capacité disponible" },
    { id: "7", name: "Karim V.", role: "Dev Addons B1", skills: ["UI API", "DI API", "Service Layer"], load: 80, hours: 32, maxHours: 40, status: "Disponible vendredi" },
    { id: "8", name: "Lucas P.", role: "Dev Junior SAP", skills: ["Service Layer", "SQL", "TypeScript"], load: 30, hours: 12, maxHours: 40, status: "Haute disponibilité" },
  ];

  const candidateScores = [
    { dev: "Marc D.", totalScore: 92, skillsScore: 43, capacityScore: 24, deadlineScore: 15, continuityScore: 10, isEligible: true, comment: "Expert Service Layer + historique client positif" },
    { dev: "Amina K.", totalScore: 84, skillsScore: 40, capacityScore: 30, deadlineScore: 14, continuityScore: 0, isEligible: true, comment: "Forte capacité disponible sur la période" },
    { dev: "Karim V.", totalScore: 78, skillsScore: 38, capacityScore: 20, deadlineScore: 10, continuityScore: 10, isEligible: true, comment: "Connaît le projet mais charge plus serrée" },
    { dev: "Sarah L.", totalScore: 0, skillsScore: 15, capacityScore: 28, deadlineScore: 15, continuityScore: 0, isEligible: false, rejectionReason: "Compétence obligatoire SAP B1 Service Layer insuffisante (Niveau 2 requis : 4)" },
  ];

  const inboxEmails = [
    {
      id: "EM-01",
      sender: "c.durand@client-omega.com",
      client: "Omega Logistics (SAP B1)",
      subject: "Demande addon de synchronisation des stocks entrepôt",
      preview: "Bonjour Aliko, nous souhaitons automatiser la remontée des stocks WMS vers SAP Business One via le Service Layer...",
      receivedAt: "Il y a 25 min",
      confidence: "Élevée (92%)",
      suggestedType: "ADDON (ADD)",
      isExternalPersonal: false,
    },
    {
      id: "EM-02",
      sender: "j.martin.consultant@gmail.com",
      client: "Groupe Horizon (Client validé)",
      subject: "Bug bloquant génération écritures comptables S/4HANA",
      preview: "Aliko, blocage constaté suite à la mise à jour : l'addon de lettrage retourne une erreur sur les CDS views...",
      receivedAt: "Il y a 1h",
      confidence: "Moyenne (78%)",
      suggestedType: "BUG (BUG)",
      isExternalPersonal: true,
      vigilanceBadge: "Adresse Gmail validée par Aliko",
    },
  ];

  return (
    <main className="min-h-screen pb-16">
      {/* Top Navigation Bar */}
      <header className="glass-panel border-b border-slate-800/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-sky-500/20">
              SC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100 tracking-tight text-lg">DevCapacity</span>
                <span className="text-xs bg-sky-500/10 text-sky-400 font-semibold px-2 py-0.5 rounded-full border border-sky-500/20">
                  Manager
                </span>
              </div>
              <p className="text-xs text-slate-400">Safir Consulting — SME Business Unit</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Serveur SAP B1 / S4 Ready (Docker)
            </div>

            <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-200">
                AG
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-slate-200">Aliko Getheme</div>
                <div className="text-[11px] text-slate-400">Head of SME BU</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero / Quick Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
              Tableau de Bord & Pilotage de la Capacité
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Supervision des 8 développeurs, réception des demandes Outlook M365 et affectation intelligente.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Fiabilité des données de planning :</span>
            <span className="text-xs font-bold px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">
              96% (Optimal)
            </span>
          </div>
        </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-medium uppercase tracking-wider">Équipe Développeurs</span>
              <Users className="w-5 h-5 text-sky-400" />
            </div>
            <div className="text-2xl font-bold text-slate-100">8 actifs</div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <span className="text-emerald-400 font-medium">320h</span> capacité nette hebdo
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-medium uppercase tracking-wider">Tickets & Addons</span>
              <Layers className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-slate-100">14 en cours</div>
            <div className="text-xs text-slate-400 mt-1">
              dont 6 Addons SAP B1 et 3 S/4HANA
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-medium uppercase tracking-wider">Inbox E-mails M365</span>
              <Mail className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400">2 à qualifier</div>
            <div className="text-xs text-slate-400 mt-1">
              Boîte Aliko (Graph API connectée)
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-medium uppercase tracking-wider">Charge restante globale</span>
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-slate-100">65% réservée</div>
            <div className="text-xs text-emerald-400 mt-1">
              110h libres cette semaine
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 mb-6 gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab("capacity")}
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === "capacity"
                ? "bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Users className="w-4 h-4" />
            Capacité & Charge des 8 Développeurs
          </button>

          <button
            onClick={() => setActiveTab("recommendation")}
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === "recommendation"
                ? "bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Moteur de Recommandation (/100 pts)
          </button>

          <button
            onClick={() => setActiveTab("inbox")}
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === "inbox"
                ? "bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Inbox className="w-4 h-4" />
            Inbox Qualification E-mails
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          </button>

          <button
            onClick={() => setActiveTab("sap")}
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === "sap"
                ? "bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Server className="w-4 h-4" />
            Architecture & Hébergement SAP
          </button>
        </div>

        {/* Tab 1 : Capacité des 8 Développeurs */}
        {activeTab === "capacity" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <div className="text-sm text-slate-300">
                Formule contractuelle appliquée : <span className="font-mono text-xs text-sky-400">Capacité nette = Heures contractuelles − Absences approuvées − Jours fériés</span>
              </div>
              <div className="text-xs text-slate-400">Semaine 44 · 2026</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {developers.map((dev) => (
                <div key={dev.id} className="glass-card rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-bold text-slate-100 text-sm">{dev.name}</span>
                        <span className="text-xs text-slate-400 ml-2 font-mono">({dev.role})</span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        dev.load > 90 ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                        dev.load > 70 ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                        "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}>
                        {dev.load}% de charge
                      </span>
                    </div>

                    <div className="w-full bg-slate-800 rounded-full h-2 mb-3 overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${
                          dev.load > 90 ? "bg-red-500" : dev.load > 70 ? "bg-amber-400" : "bg-sky-400"
                        }`}
                        style={{ width: `${dev.load}%` }}
                      ></div>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {dev.skills.map((skill, idx) => (
                        <span key={idx} className="text-[11px] bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700/50">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs text-slate-400">
                    <span>{dev.hours}h réservées / {dev.maxHours}h nettes</span>
                    <span className="text-sky-400 font-medium">{dev.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2 : Moteur de Recommandation */}
        {activeTab === "recommendation" && (
          <div className="glass-panel rounded-2xl p-6 border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <span className="text-xs uppercase font-bold text-sky-400 tracking-wider">Moteur d&apos;Affectation Décisionnel</span>
                <h3 className="text-lg font-bold text-slate-100 mt-0.5">
                  Recommandation pour le ticket : <span className="font-mono text-sky-300">ADD-2026-0001</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Addon SAP B1 Service Layer · Client Omega Logistics · Échéance demandée : 10 Nov 2026 · Estimation : 24h
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Pondération validée :</span>
                <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700">
                  45% Compétences · 30% Capacité · 15% Échéance · 10% Continuité
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {candidateScores.map((c, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border transition-all ${
                    c.isEligible
                      ? idx === 0
                        ? "bg-sky-500/5 border-sky-500/30 shadow-lg shadow-sky-500/5"
                        : "bg-slate-900/40 border-slate-800 hover:border-slate-700"
                      : "bg-slate-900/20 border-red-500/20 opacity-70"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        idx === 0 ? "bg-sky-500 text-white shadow-md shadow-sky-500/30" : "bg-slate-800 text-slate-400"
                      }`}>
                        #{idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-100">{c.dev}</span>
                          {idx === 0 && (
                            <span className="text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                              Recommandé par le moteur
                            </span>
                          )}
                          {!c.isEligible && (
                            <span className="text-[11px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-medium">
                              Éliminé (Critères bloquants)
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{c.comment || c.rejectionReason}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {c.isEligible ? (
                        <>
                          <div className="text-right">
                            <span className="text-2xl font-black text-sky-400">{c.totalScore}</span>
                            <span className="text-xs text-slate-400">/100</span>
                          </div>
                          <button className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold rounded-lg shadow transition-all">
                            Affecter & Notifier
                          </button>
                        </>
                      ) : (
                        <div className="text-xs text-red-400 font-mono">Score : Inéligible</div>
                      )}
                    </div>
                  </div>

                  {c.isEligible && (
                    <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-800/60 text-[11px] text-slate-400">
                      <div>Compétences : <span className="text-slate-200 font-medium">{c.skillsScore}/45</span></div>
                      <div>Capacité dispo : <span className="text-slate-200 font-medium">{c.capacityScore}/30</span></div>
                      <div>Respect échéance : <span className="text-slate-200 font-medium">{c.deadlineScore}/15</span></div>
                      <div>Continuité projet : <span className="text-slate-200 font-medium">{c.continuityScore}/10</span></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3 : Inbox E-mails d'Aliko */}
        {activeTab === "inbox" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Mail className="w-4 h-4 text-sky-400" />
                Connexion Microsoft 365 Outlook active : <span className="font-mono text-xs text-sky-400">aliko.getheme@safirconsulting.net</span>
              </div>
              <button className="text-xs flex items-center gap-1.5 text-slate-400 hover:text-slate-200 px-3 py-1 bg-slate-800 rounded-lg border border-slate-700">
                <RefreshCw className="w-3.5 h-3.5" />
                Synchroniser (Delta query)
              </button>
            </div>

            <div className="space-y-3">
              {inboxEmails.map((msg) => (
                <div key={msg.id} className="glass-card rounded-xl p-5 border border-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100 text-sm">{msg.subject}</span>
                        <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-md font-mono">
                          {msg.suggestedType}
                        </span>
                        {msg.isExternalPersonal && (
                          <span className="text-[11px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md">
                            {msg.vigilanceBadge}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                        <span>De : <strong className="text-slate-300">{msg.sender}</strong></span>
                        <span>·</span>
                        <span>Client : <strong className="text-slate-300">{msg.client}</strong></span>
                        <span>·</span>
                        <span>{msg.receivedAt}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold rounded-lg shadow transition-all">
                        Qualifier en Ticket
                      </button>
                      <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition-all">
                        Lier à existant
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 bg-slate-900/50 p-3 rounded-lg border border-slate-800/80 mt-3 font-sans leading-relaxed">
                    « {msg.preview} »
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4 : Infrastructure SAP & Déploiement */}
        {activeTab === "sap" && (
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-100">Architecture d&apos;Hébergement — Serveur SAP B1 / S/4HANA</h3>
              <p className="text-xs text-slate-400 mt-1">
                Conception étanche pour cohabiter sur l&apos;infrastructure SAP de Safir Consulting sans impact sur le système hôte.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 text-sky-400 font-bold text-sm mb-2">
                  <Server className="w-4 h-4" />
                  Isolation Docker / Podman
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  L&apos;application web (Next.js), le backend (NestJS) et la base (PostgreSQL 16) tournent dans des conteneurs étanches. Aucune bibliothèque hôte modifiée.
                </p>
              </div>

              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-2">
                  <Database className="w-4 h-4" />
                  Base PostgreSQL Dédiée
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Schéma 100% autonome avec Prisma. La base SAP HANA / SQL Server sous-jacente n&apos;est jamais polluée, préservant intégrité et licences SAP.
                </p>
              </div>

              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm mb-2">
                  <ShieldCheck className="w-4 h-4" />
                  Gestion des Ports Réseau
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ports configurables via <span className="font-mono text-sky-300">.env</span> (ex. API 4000, Web 3000), garantissant 0 collision avec les ports HANA (3xx15) ou Service Layer (50000/50001).
                </p>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
