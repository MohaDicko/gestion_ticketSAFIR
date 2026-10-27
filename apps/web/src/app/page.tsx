"use client";

import React, { useState, useEffect } from "react";
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
  PlusCircle,
  Check,
  Send,
  X,
} from "lucide-react";

const API_BASE = "http://localhost:4000/api/v1";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"capacity" | "recommendation" | "inbox" | "tickets" | "sap">("capacity");
  
  // États synchronisés avec l'API NestJS & PostgreSQL
  const [developers, setDevelopers] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [inboxEmails, setInboxEmails] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string>("");
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "info" } | null>(null);

  // Modal création ticket
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newTypeCode, setNewTypeCode] = useState("ADDON");
  const [newPriorityCode, setNewPriorityCode] = useState("HIGH");
  const [newEstimatedHours, setNewEstimatedHours] = useState(16);

  // Chargement des données live depuis le backend NestJS
  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [devsRes, tixRes, emailsRes, skillsRes] = await Promise.all([
        fetch(`${API_BASE}/developers`).then((r) => r.json()).catch(() => []),
        fetch(`${API_BASE}/tickets`).then((r) => r.json()).catch(() => []),
        fetch(`${API_BASE}/emails/inbox`).then((r) => r.json()).catch(() => []),
        fetch(`${API_BASE}/skills`).then((r) => r.json()).catch(() => []),
      ]);

      setDevelopers(Array.isArray(devsRes) ? devsRes : []);
      setTickets(Array.isArray(tixRes) ? tixRes : []);
      setInboxEmails(Array.isArray(emailsRes) ? emailsRes : []);
      setSkills(Array.isArray(skillsRes) ? skillsRes : []);

      if (Array.isArray(tixRes) && tixRes.length > 0 && !selectedTicketId) {
        setSelectedTicketId(tixRes[0].id);
      }
    } catch (e) {
      console.error("Erreur de chargement API :", e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calcul live des recommandations quand le ticket sélectionné change
  useEffect(() => {
    if (!selectedTicketId) return;
    setLoadingRecs(true);
    fetch(`${API_BASE}/tickets/${selectedTicketId}/recommendations`)
      .then((r) => r.json())
      .then((data) => {
        setRecommendations(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingRecs(false));
  }, [selectedTicketId]);

  const showToast = (message: string, type: "success" | "info" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Action : Affecter un ticket
  const handleAssign = async (ticketId: string, developerId: string, devName: string) => {
    try {
      const res = await fetch(`${API_BASE}/tickets/${ticketId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          developerId,
          allocatedHours: 24,
          assignedById: "aliko-head-id",
        }),
      });

      if (res.ok) {
        showToast(`✅ Ticket affecté avec succès à ${devName} ! Notification e-mail M365 générée.`);
        fetchData();
      }
    } catch {
      showToast("Erreur lors de l'affectation", "info");
    }
  };

  // Action : Mettre à jour le statut d'un ticket
  const handleStatusChange = async (ticketId: string, nextStatus: string) => {
    try {
      const res = await fetch(`${API_BASE}/tickets/${ticketId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, actorId: "aliko-head-id" }),
      });
      if (res.ok) {
        showToast(`Statut mis à jour vers ${nextStatus}`);
        fetchData();
      }
    } catch {
      showToast("Impossible de changer le statut", "info");
    }
  };

  // Action : Qualifier un e-mail en ticket
  const handleQualifyEmail = async (emailId: string, subject: string) => {
    try {
      const res = await fetch(`${API_BASE}/emails/${emailId}/qualify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          typeCode: "ADDON",
          priorityCode: "HIGH",
          title: subject,
          estimatedHours: 16,
          actorId: "aliko-head-id",
        }),
      });
      if (res.ok) {
        showToast(`✅ E-mail qualifié en nouveau ticket Addon SAP !`);
        fetchData();
      }
    } catch {
      showToast("Erreur de qualification", "info");
    }
  };

  // Action : Créer un ticket
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          typeCode: newTypeCode,
          priorityCode: newPriorityCode,
          estimatedHours: Number(newEstimatedHours),
          actorId: "aliko-head-id",
        }),
      });
      if (res.ok) {
        showToast("✅ Nouveau ticket SAP créé avec référence unique !");
        setShowCreateModal(false);
        setNewTitle("");
        setNewDescription("");
        fetchData();
      }
    } catch {
      showToast("Erreur lors de la création", "info");
    }
  };

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0];

  return (
    <main className="min-h-screen pb-16">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-sky-500/40 text-slate-100 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="glass-panel border-b border-slate-800/80 sticky top-0 z-40">
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
            <button
              onClick={fetchData}
              disabled={refreshing}
              className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Actualiser BDD
            </button>

            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              PostgreSQL Supabase (Connecté)
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

      {/* Hero & KPIs */}
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

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-500/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Nouveau Ticket / Addon SAP
          </button>
        </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-medium uppercase tracking-wider">Équipe Développeurs</span>
              <Users className="w-5 h-5 text-sky-400" />
            </div>
            <div className="text-2xl font-bold text-slate-100">{developers.length} actifs</div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <span className="text-emerald-400 font-medium">320h</span> capacité nette hebdo
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-medium uppercase tracking-wider">Tickets en cours</span>
              <Layers className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-slate-100">{tickets.length} tickets</div>
            <div className="text-xs text-slate-400 mt-1">
              Stockés en base PostgreSQL
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-medium uppercase tracking-wider">Inbox E-mails M365</span>
              <Mail className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400">{inboxEmails.length} messages</div>
            <div className="text-xs text-slate-400 mt-1">
              Boîte Aliko (Graph API connectée)
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-medium uppercase tracking-wider">Catalogue Compétences</span>
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-slate-100">{skills.length} expertises</div>
            <div className="text-xs text-emerald-400 mt-1">
              SAP B1, S/4HANA, Full-Stack
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
            Capacité & Charge des 8 Développeurs ({developers.length})
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
            onClick={() => setActiveTab("tickets")}
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === "tickets"
                ? "bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="w-4 h-4" />
            Gestion des Tickets & Kanban ({tickets.length})
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
            Inbox Qualification E-mails ({inboxEmails.length})
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
            Hébergement Serveur SAP
          </button>
        </div>

        {/* TAB 1 : CAPACITÉ DES DÉVELOPPEURS (Données BDD live) */}
        {activeTab === "capacity" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <div className="text-sm text-slate-300">
                Formule contractuelle appliquée : <span className="font-mono text-xs text-sky-400">Capacité nette = 40h − Absences approuvées − Jours fériés</span>
              </div>
              <div className="text-xs text-emerald-400 font-medium">8 Développeurs synchronisés avec PostgreSQL</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {developers.map((dev) => (
                <div key={dev.id} className="glass-card rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-bold text-slate-100 text-sm">{dev.name}</span>
                        <span className="text-xs text-slate-400 ml-2 font-mono">({dev.jobTitle})</span>
                      </div>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                        dev.loadPercentage > 85 ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                        dev.loadPercentage > 50 ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                        "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}>
                        {dev.loadPercentage}% de charge
                      </span>
                    </div>

                    <div className="w-full bg-slate-800 rounded-full h-2 mb-3 overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${
                          dev.loadPercentage > 85 ? "bg-red-500" : dev.loadPercentage > 50 ? "bg-amber-400" : "bg-sky-400"
                        }`}
                        style={{ width: `${Math.max(5, dev.loadPercentage)}%` }}
                      ></div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {dev.skills.map((s: any, idx: number) => (
                        <span key={idx} className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700/60 flex items-center gap-1">
                          <span>{s.name}</span>
                          <span className="text-sky-400 font-bold">★{s.level}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs text-slate-400">
                    <span>{dev.reservedHours}h réservées / {dev.netWeeklyHours}h nettes</span>
                    <span className="text-emerald-400 font-medium">{dev.freeHours}h disponibles</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2 : MOTEUR DE RECOMMANDATION DÉCISIONNEL */}
        {activeTab === "recommendation" && (
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs uppercase font-bold text-sky-400 tracking-wider">Algorithme d&apos;Affectation Optimale</span>
                <h3 className="text-lg font-bold text-slate-100 mt-0.5">
                  Sélection du Ticket à Affecter :
                </h3>
              </div>

              {/* Sélecteur de tickets en cours */}
              <select
                value={selectedTicketId}
                onChange={(e: any) => setSelectedTicketId(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-4 py-2 focus:ring-2 focus:ring-sky-500"
              >
                {tickets.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.reference} — {t.title.substring(0, 50)}... ({t.status})
                  </option>
                ))}
              </select>
            </div>

            {selectedTicket && (
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sky-400 font-mono">{selectedTicket.reference}</span>
                    <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-md font-semibold">
                      {selectedTicket.type?.label || "Addon"}
                    </span>
                    <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md">
                      {selectedTicket.priority?.label || "Haute"}
                    </span>
                    <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md">
                      Client : {selectedTicket.client?.name || "Client"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">{selectedTicket.description}</p>
                </div>

                <div className="text-right text-xs text-slate-400">
                  <div>Estimation : <strong className="text-slate-200">{Number(selectedTicket.estimatedHours || 16)}h</strong></div>
                  <div>Statut actuel : <strong className="text-sky-400">{selectedTicket.status}</strong></div>
                </div>
              </div>
            )}

            {/* Liste des candidats classés par le moteur */}
            <div className="space-y-3">
              {loadingRecs ? (
                <div className="py-12 text-center text-sm text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-400" />
                  Calcul en cours du score déterministe sur 100 points...
                </div>
              ) : (
                recommendations.map((rec, idx) => (
                  <div
                    key={rec.developerId}
                    className={`p-4 rounded-xl border transition-all ${
                      rec.isEligible
                        ? idx === 0
                          ? "bg-sky-500/10 border-sky-500/40 shadow-lg shadow-sky-500/5"
                          : "bg-slate-900/40 border-slate-800"
                        : "bg-slate-900/20 border-red-500/20 opacity-60"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                          idx === 0 && rec.isEligible ? "bg-sky-500 text-white shadow-md shadow-sky-500/30" : "bg-slate-800 text-slate-400"
                        }`}>
                          #{idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-100 text-sm">{rec.developerName}</span>
                            <span className="text-xs text-slate-400 font-mono">({rec.jobTitle})</span>
                            {idx === 0 && rec.isEligible && (
                              <span className="text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                                ⭐ Recommandation #1
                              </span>
                            )}
                            {!rec.isEligible && (
                              <span className="text-[11px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-medium">
                                Éliminé (Critère bloquant)
                              </span>
                            )}
                          </div>
                          {rec.rejectionReasons?.length > 0 && (
                            <p className="text-xs text-red-400 mt-0.5">{rec.rejectionReasons[0]}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {rec.isEligible ? (
                          <>
                            <div className="text-right">
                              <span className="text-2xl font-black text-sky-400">{rec.totalScore}</span>
                              <span className="text-xs text-slate-400">/100</span>
                            </div>
                            <button
                              onClick={() => handleAssign(selectedTicket.id, rec.developerId, rec.developerName)}
                              className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold rounded-lg shadow-md shadow-sky-500/20 transition-all flex items-center gap-1.5"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Affecter & Notifier
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-red-400 font-mono">Inadmissible</span>
                        )}
                      </div>
                    </div>

                    {rec.isEligible && (
                      <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-800/60 text-[11px] text-slate-400">
                        <div>Compétences : <span className="text-slate-200 font-medium">{rec.breakdown.skillsScore}/45</span></div>
                        <div>Capacité dispo : <span className="text-slate-200 font-medium">{rec.breakdown.capacityScore}/30</span></div>
                        <div>Respect échéance : <span className="text-slate-200 font-medium">{rec.breakdown.deadlineScore}/15</span></div>
                        <div>Continuité client : <span className="text-slate-200 font-medium">{rec.breakdown.continuityScore}/10</span></div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3 : GESTION DES TICKETS & CYCLE DE VIE KANBAN */}
        {activeTab === "tickets" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Colonne 1 : À Qualifier / Reçus */}
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-3 text-sm font-bold text-amber-400">
                  <span>À Qualifier / Reçus</span>
                  <span className="text-xs bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    {tickets.filter((t) => ["RECEIVED", "TO_QUALIFY"].includes(t.status)).length}
                  </span>
                </div>
                <div className="space-y-2">
                  {tickets
                    .filter((t) => ["RECEIVED", "TO_QUALIFY"].includes(t.status))
                    .map((t) => (
                      <div key={t.id} className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/60 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-sky-400">{t.reference}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">{t.status}</span>
                        </div>
                        <div className="text-xs font-semibold text-slate-200">{t.title}</div>
                        <button
                          onClick={() => handleStatusChange(t.id, "READY")}
                          className="w-full mt-2 py-1 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-xs font-medium rounded border border-sky-500/30 transition-all"
                        >
                          Passer à Prêt (READY) ➔
                        </button>
                      </div>
                    ))}
                </div>
              </div>

              {/* Colonne 2 : Prêts / Affectés */}
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-3 text-sm font-bold text-sky-400">
                  <span>Prêts & Affectés</span>
                  <span className="text-xs bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                    {tickets.filter((t) => ["READY", "ASSIGNED"].includes(t.status)).length}
                  </span>
                </div>
                <div className="space-y-2">
                  {tickets
                    .filter((t) => ["READY", "ASSIGNED"].includes(t.status))
                    .map((t) => (
                      <div key={t.id} className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/60 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-sky-400">{t.reference}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300">{t.status}</span>
                        </div>
                        <div className="text-xs font-semibold text-slate-200">{t.title}</div>
                        <button
                          onClick={() => handleStatusChange(t.id, "IN_PROGRESS")}
                          className="w-full mt-2 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-xs font-medium rounded border border-indigo-500/30 transition-all"
                        >
                          Démarrer Dev (IN_PROGRESS) ➔
                        </button>
                      </div>
                    ))}
                </div>
              </div>

              {/* Colonne 3 : En Cours & Livrés */}
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-3 text-sm font-bold text-emerald-400">
                  <span>En Cours, Test & Clôturés</span>
                  <span className="text-xs bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    {tickets.filter((t) => ["IN_PROGRESS", "IN_TESTING", "DELIVERED", "CLOSED"].includes(t.status)).length}
                  </span>
                </div>
                <div className="space-y-2">
                  {tickets
                    .filter((t) => ["IN_PROGRESS", "IN_TESTING", "DELIVERED", "CLOSED"].includes(t.status))
                    .map((t) => (
                      <div key={t.id} className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/60 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-sky-400">{t.reference}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">{t.status}</span>
                        </div>
                        <div className="text-xs font-semibold text-slate-200">{t.title}</div>
                        {t.status === "IN_PROGRESS" && (
                          <button
                            onClick={() => handleStatusChange(t.id, "DELIVERED")}
                            className="w-full mt-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-medium rounded border border-emerald-500/30 transition-all"
                          >
                            Livrer (DELIVERED) ➔
                          </button>
                        )}
                        {t.status === "DELIVERED" && (
                          <button
                            onClick={() => handleStatusChange(t.id, "CLOSED")}
                            className="w-full mt-2 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-medium rounded border border-purple-500/30 transition-all"
                          >
                            Valider Clôture (CLOSED) ✓
                          </button>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4 : INBOX QUALIFICATION E-MAILS */}
        {activeTab === "inbox" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Mail className="w-4 h-4 text-sky-400" />
                Connexion Microsoft 365 Outlook active : <span className="font-mono text-xs text-sky-400">aliko.getheme@safirconsulting.net</span>
              </div>
              <button
                onClick={async () => {
                  await fetch(`${API_BASE}/emails/simulate`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      senderEmail: "f.mercier@client-delta.com",
                      senderName: "Fabien Mercier",
                      subject: "Addon impression étiquettes codes-barres SAP B1",
                      bodyText: "Bonjour Aliko, nous avons besoin d'un addon pour imprimer des étiquettes GS1 depuis la commande client SAP B1.",
                    }),
                  });
                  showToast("Nouvel e-mail M365 simulé reçu dans l'Inbox !");
                  fetchData();
                }}
                className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 rounded-lg border border-sky-500/30 transition-all"
              >
                + Simuler E-mail Entrant
              </button>
            </div>

            <div className="space-y-3">
              {inboxEmails.map((msg) => (
                <div key={msg.id} className="glass-card rounded-xl p-5 border border-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100 text-sm">{msg.subject}</span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-md font-mono ${
                          msg.processingStatus === "TICKET_CREATED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}>
                          {msg.processingStatus}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                        <span>De : <strong className="text-slate-300">{msg.senderEmail}</strong></span>
                        <span>·</span>
                        <span>Reçu le {new Date(msg.receivedAt).toLocaleDateString("fr-FR")}</span>
                      </div>
                    </div>

                    {msg.processingStatus !== "TICKET_CREATED" && (
                      <button
                        onClick={() => handleQualifyEmail(msg.id, msg.subject)}
                        className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold rounded-lg shadow transition-all"
                      >
                        Qualifier en Ticket SAP ➔
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 bg-slate-900/50 p-3 rounded-lg border border-slate-800/80 mt-3 font-sans leading-relaxed">
                    « {msg.bodyPreview || msg.bodyText} »
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5 : ARCHITECTURE & HÉBERGEMENT SAP */}
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

      {/* Modal Création Ticket */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg p-6 rounded-2xl border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="font-bold text-slate-100 text-base">Nouveau Ticket / Addon SAP</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 mt-4">
              <div>
                <label className="text-xs font-semibold text-slate-300">Titre de la demande</label>
                <input
                  type="text"
                  required
                  placeholder="Ex : Addon EDI Facturation SAP B1"
                  value={newTitle}
                  onChange={(e: any) => setNewTitle(e.target.value)}
                  className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Description détaillée</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Spécifications techniques, flux Service Layer ou BAPI attendu..."
                  value={newDescription}
                  onChange={(e: any) => setNewDescription(e.target.value)}
                  className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Type</label>
                  <select
                    value={newTypeCode}
                    onChange={(e: any) => setNewTypeCode(e.target.value)}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-xs text-slate-200"
                  >
                    <option value="ADDON">ADDON (Addon SAP)</option>
                    <option value="BUG">BUG (Correction)</option>
                    <option value="EVOLUTION">EVO (Évolution)</option>
                    <option value="INTEGRATION">INT (Intégration API)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Priorité</label>
                  <select
                    value={newPriorityCode}
                    onChange={(e: any) => setNewPriorityCode(e.target.value)}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-xs text-slate-200"
                  >
                    <option value="CRITICAL">P1 - Critique</option>
                    <option value="HIGH">P2 - Haute</option>
                    <option value="MEDIUM">P3 - Moyenne</option>
                    <option value="LOW">P4 - Basse</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Est. Heures</label>
                  <input
                    type="number"
                    min={1}
                    value={newEstimatedHours}
                    onChange={(e: any) => setNewEstimatedHours(Number(e.target.value))}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-xs text-slate-200"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold rounded-lg shadow-lg shadow-sky-500/20"
                >
                  Créer le Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
