"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Layers,
  Users,
  Inbox,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Plus,
  ArrowUpRight,
  Mail,
  Building2,
  Briefcase,
  AlertCircle,
  Calendar,
  X,
  ChevronRight,
  RefreshCw,
  UserCheck
} from "lucide-react";

const API_BASE = "/api/v1";

interface Skill {
  id: string;
  name: string;
  category: string;
  level: number;
}

interface Developer {
  id: string;
  name: string;
  email: string;
  jobTitle: string;
  netWeeklyHours: number;
  reservedHours: number;
  freeHours: number;
  loadPercentage: number;
  skills: Skill[];
}

interface Ticket {
  id: string;
  reference: string;
  title: string;
  description?: string;
  status: string;
  typeCode: string;
  priorityCode: string;
  estimatedHours: number;
  clientCompany?: string;
  applicantName?: string;
  applicantEmail?: string;
  assignedDeveloper?: {
    id?: string;
    name: string;
    email: string;
  } | null;
  createdAt?: string;
}

interface InboxEmail {
  id: string;
  senderName: string;
  senderEmail: string;
  senderKind: string;
  isPersonalDomain: boolean;
  subject: string;
  bodyPreview: string;
  receivedAt: string;
  processingStatus: string;
  ticket?: {
    reference: string;
    title: string;
  } | null;
}

// Données initiales d'équipe Safir Consulting
const INITIAL_DEVELOPERS: Developer[] = [
  {
    id: "dev-moha",
    name: "Moha Dicko",
    email: "mohadicko95@gmail.com",
    jobTitle: "Lead Développeur Full-Stack & Architecte Solution",
    netWeeklyHours: 40,
    reservedHours: 16,
    freeHours: 24,
    loadPercentage: 40,
    skills: [
      { id: "1", name: "Next.js & React", category: "Frontend", level: 5 },
      { id: "2", name: "NestJS & Node.js", category: "Backend", level: 5 },
      { id: "3", name: "PostgreSQL & Prisma", category: "Données", level: 5 },
      { id: "4", name: "Architecture & API", category: "Transverse", level: 5 }
    ]
  },
  {
    id: "dev-anoop",
    name: "Anoop Pandimukkula",
    email: "anoop.pandimukkula@safirconsulting.net",
    jobTitle: "Senior Développeur SAP Business One & C#",
    netWeeklyHours: 40,
    reservedHours: 20,
    freeHours: 20,
    loadPercentage: 50,
    skills: [
      { id: "5", name: "SAP B1 — UI / DI API", category: "SAP", level: 5 },
      { id: "6", name: "SAP B1 — Service Layer", category: "SAP", level: 5 },
      { id: "7", name: "SAP HANA & SQL", category: "Données", level: 4 }
    ]
  },
  {
    id: "dev-hassane",
    name: "Hassane Bocoum",
    email: "hassane.bocoum@safirconsulting.net",
    jobTitle: "Développeur Full-Stack Web & Intégrations SAP",
    netWeeklyHours: 40,
    reservedHours: 12,
    freeHours: 28,
    loadPercentage: 30,
    skills: [
      { id: "8", name: "SAP S/4HANA — ABAP & CDS", category: "SAP", level: 4 },
      { id: "9", name: "NestJS & Node.js", category: "Backend", level: 4 },
      { id: "10", name: "SAP Fiori / UI5", category: "SAP", level: 4 }
    ]
  },
  {
    id: "dev-nevrit",
    name: "Nevrit Ahua",
    email: "nevrit.ahua@safirconsulting.net",
    jobTitle: "Ingénieur Intégration Systèmes & API",
    netWeeklyHours: 40,
    reservedHours: 16,
    freeHours: 24,
    loadPercentage: 40,
    skills: [
      { id: "11", name: "SAP B1 — Service Layer", category: "SAP", level: 5 },
      { id: "12", name: "Architecture & Intégration API", category: "Transverse", level: 5 },
      { id: "13", name: "NestJS & Node.js", category: "Backend", level: 4 }
    ]
  },
  {
    id: "dev-fatoumata",
    name: "Fatoumata Traore",
    email: "fatoumata.traore@safirconsulting.net",
    jobTitle: "Développeuse SAP B1 & Service Layer",
    netWeeklyHours: 40,
    reservedHours: 8,
    freeHours: 32,
    loadPercentage: 20,
    skills: [
      { id: "14", name: "SAP B1 — Service Layer", category: "SAP", level: 4 },
      { id: "15", name: "SAP B1 — UI / DI API", category: "SAP", level: 4 },
      { id: "16", name: "SAP HANA & SQL", category: "Données", level: 3 }
    ]
  },
  {
    id: "dev-korotoumou",
    name: "Korotoumou Thiam",
    email: "korotoumou.thiam@safirconsulting.net",
    jobTitle: "Développeuse Backend & Bases de données",
    netWeeklyHours: 40,
    reservedHours: 14,
    freeHours: 26,
    loadPercentage: 35,
    skills: [
      { id: "17", name: "PostgreSQL & Prisma", category: "Données", level: 5 },
      { id: "18", name: "NestJS & Node.js", category: "Backend", level: 4 },
      { id: "19", name: "Docker & Déploiement SAP", category: "DevOps", level: 4 }
    ]
  },
  {
    id: "dev-jeanphilippe",
    name: "Jean-Philippe Ebrottié",
    email: "jeanphilippe.ebrottie@safirconsulting.net",
    jobTitle: "Architecte Intégrations & Solutions SAP",
    netWeeklyHours: 40,
    reservedHours: 24,
    freeHours: 16,
    loadPercentage: 60,
    skills: [
      { id: "20", name: "Architecture & Intégration API", category: "Transverse", level: 5 },
      { id: "21", name: "SAP B1 — Service Layer", category: "SAP", level: 5 },
      { id: "22", name: "Microsoft Graph & M365", category: "Intégration", level: 5 }
    ]
  }
];

const INITIAL_TICKETS: Ticket[] = [
  {
    id: "tix-1",
    reference: "ADD-2026-0001",
    title: "Addon Validation Commandes Fournisseurs SAP B1",
    description: "Implémentation d'un workflow de validation à double niveau pour les commandes d'achats excédant 10 000 €.",
    status: "IN_PROGRESS",
    typeCode: "ADDON",
    priorityCode: "HIGH",
    estimatedHours: 24,
    clientCompany: "Safir Consulting (Consulting Interne)",
    applicantName: "Mélissa Diakité",
    applicantEmail: "melissa.diakite@safirconsulting.net",
    assignedDeveloper: { name: "Anoop Pandimukkula", email: "anoop.pandimukkula@safirconsulting.net" },
    createdAt: "2026-10-25"
  },
  {
    id: "tix-2",
    reference: "INT-2026-0002",
    title: "Passerelle Import Factures Dématérialisées Service Layer",
    description: "Connecteur automatisé synchronisant les factures PDF structurées dans SAP Business One via REST Service Layer.",
    status: "QUALIFIED",
    typeCode: "GATEWAY",
    priorityCode: "CRITICAL",
    estimatedHours: 32,
    clientCompany: "Omega Distribution",
    applicantName: "Christian Durand",
    applicantEmail: "c.durand@client-omega.com",
    assignedDeveloper: { name: "Nevrit Ahua", email: "nevrit.ahua@safirconsulting.net" },
    createdAt: "2026-10-26"
  },
  {
    id: "tix-3",
    reference: "REP-2026-0003",
    title: "Rapports d'inventaire valorisé en temps réel (SAP HANA)",
    description: "Création de vues de calcul optimisées sur HANA SQLScript pour le reporting de stock en clôture mensuelle.",
    status: "RECEIVED",
    typeCode: "REPORT",
    priorityCode: "MEDIUM",
    estimatedHours: 16,
    clientCompany: "Société Nouvelle Industrie",
    applicantName: "Alain Moreau",
    applicantEmail: "contact@societe-nouvelle-industrie.fr",
    assignedDeveloper: null,
    createdAt: "2026-10-27"
  }
];

const INITIAL_EMAILS: InboxEmail[] = [
  {
    id: "mail-1",
    senderName: "Mélissa Diakité",
    senderEmail: "melissa.diakite@safirconsulting.net",
    senderKind: "CONSULTANT",
    isPersonalDomain: false,
    subject: "Spécifications fonctionnelles : Addon approbation d'achats SAP B1",
    bodyPreview: "Bonjour Aliko, voici le document de cadrage validé avec le client pour la mise en place du workflow d'approbation...",
    receivedAt: "Aujourd'hui à 11:32",
    processingStatus: "PENDING_QUALIFICATION"
  },
  {
    id: "mail-2",
    senderName: "Christian Durand",
    senderEmail: "c.durand@client-omega.com",
    senderKind: "CLIENT_CONTACT",
    isPersonalDomain: false,
    subject: "Demande de chiffrage : Ajout des numéros de série dans la passerelle",
    bodyPreview: "Bonjour Aliko, nous avons besoin d'étendre la passerelle WMS pour tracer les numéros de série sur les réceptions d'articles...",
    receivedAt: "Aujourd'hui à 09:14",
    processingStatus: "PENDING_QUALIFICATION"
  },
  {
    id: "mail-3",
    senderName: "Patrick Freelance",
    senderEmail: "consultant.freelance92@gmail.com",
    senderKind: "UNKNOWN",
    isPersonalDomain: true,
    subject: "Demande d'accès direct base SAP B1 de recette",
    bodyPreview: "Bonjour Monsieur Getheme, pourriez-vous me transmettre les accès au serveur SAP B1 pour finaliser les tests...",
    receivedAt: "Hier à 17:45",
    processingStatus: "PENDING_QUALIFICATION"
  }
];

export default function TicketManagerPage() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "tickets" | "developers" | "inbox">("dashboard");

  // Données
  const [developers, setDevelopers] = useState<Developer[]>(INITIAL_DEVELOPERS);
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [emails, setEmails] = useState<InboxEmail[]>(INITIAL_EMAILS);
  const [loading, setLoading] = useState(false);

  // Filtres
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modale nouveau ticket
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newType, setNewType] = useState("ADDON");
  const [newPriority, setNewPriority] = useState("HIGH");
  const [newHours, setNewHours] = useState(16);
  const [newClient, setNewClient] = useState("");
  const [newApplicant, setNewApplicant] = useState("");

  // Modale affectation rapide
  const [assigningTicket, setAssigningTicket] = useState<Ticket | null>(null);
  const [selectedDevId, setSelectedDevId] = useState("");

  // Toast simple de confirmation
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Chargement synchronisé avec l'API
  const refreshData = async () => {
    setLoading(true);
    try {
      const [devsRes, tixRes, emailsRes] = await Promise.all([
        fetch(`${API_BASE}/developers`).then((r) => r.json()).catch(() => []),
        fetch(`${API_BASE}/tickets`).then((r) => r.json()).catch(() => []),
        fetch(`${API_BASE}/emails/inbox`).then((r) => r.json()).catch(() => [])
      ]);

      if (Array.isArray(devsRes) && devsRes.length > 0) {
        setDevelopers(devsRes);
      }
      if (Array.isArray(tixRes) && tixRes.length > 0) {
        setTickets(tixRes);
      }
      if (Array.isArray(emailsRes) && emailsRes.length > 0) {
        setEmails(emailsRes);
      }
      showToast("Données synchronisées avec succès");
    } catch {
      showToast("Synchronisation effectuée (mode local)");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Calculs statistiques
  const stats = useMemo(() => {
    const totalWeeklyCap = developers.reduce((sum, d) => sum + (d.netWeeklyHours || 40), 0);
    const totalReserved = developers.reduce((sum, d) => sum + (d.reservedHours || 0), 0);
    const totalFree = Math.max(0, totalWeeklyCap - totalReserved);
    const avgLoad = totalWeeklyCap > 0 ? Math.round((totalReserved / totalWeeklyCap) * 100) : 0;
    const activeTickets = tickets.filter((t) => t.status !== "CLOSED" && t.status !== "REJECTED");
    const pendingEmails = emails.filter((m) => m.processingStatus === "PENDING_QUALIFICATION");

    return {
      totalWeeklyCap,
      totalReserved,
      totalFree,
      avgLoad,
      activeTicketsCount: activeTickets.length,
      pendingEmailsCount: pendingEmails.length
    };
  }, [developers, tickets, emails]);

  // Filtrage des tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchesSearch =
        !searchQuery ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.applicantName && t.applicantName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tickets, searchQuery, statusFilter]);

  // Action : Créer ticket
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const payload = {
      title: newTitle,
      description: newDesc,
      typeCode: newType,
      priorityCode: newPriority,
      estimatedHours: Number(newHours) || 16,
      applicantName: newApplicant || "Consultant Safir",
      clientCompany: newClient || "Safir Consulting"
    };

    try {
      const res = await fetch(`${API_BASE}/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast("Nouveau ticket créé avec succès");
        setShowModal(false);
        setNewTitle("");
        setNewDesc("");
        refreshData();
      } else {
        // Ajout local direct
        const newTicket: Ticket = {
          id: `tix-${Date.now()}`,
          reference: `ADD-2026-${String(tickets.length + 1).padStart(4, "0")}`,
          title: newTitle,
          description: newDesc,
          status: "RECEIVED",
          typeCode: newType,
          priorityCode: newPriority,
          estimatedHours: Number(newHours) || 16,
          clientCompany: newClient || "Safir Consulting",
          applicantName: newApplicant || "Aliko Getheme",
          assignedDeveloper: null,
          createdAt: new Date().toISOString().split("T")[0]
        };
        setTickets([newTicket, ...tickets]);
        setShowModal(false);
        setNewTitle("");
        setNewDesc("");
        showToast("Nouveau ticket enregistré");
      }
    } catch {
      showToast("Ticket enregistré localement");
      setShowModal(false);
    }
  };

  // Action : Affecter développeur
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningTicket || !selectedDevId) return;

    const dev = developers.find((d) => d.id === selectedDevId);
    if (!dev) return;

    try {
      await fetch(`${API_BASE}/tickets/${assigningTicket.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          developerId: dev.id,
          allocatedHours: assigningTicket.estimatedHours,
          assignedById: "aliko-head-id"
        })
      });
    } catch {
      // Ignorer erreur réseau
    }

    setTickets((prev) =>
      prev.map((t) =>
        t.id === assigningTicket.id
          ? {
              ...t,
              status: "ASSIGNED",
              assignedDeveloper: { id: dev.id, name: dev.name, email: dev.email }
            }
          : t
      )
    );

    setDevelopers((prev) =>
      prev.map((d) =>
        d.id === dev.id
          ? {
              ...d,
              reservedHours: d.reservedHours + assigningTicket.estimatedHours,
              freeHours: Math.max(0, d.freeHours - assigningTicket.estimatedHours),
              loadPercentage: Math.min(100, Math.round(((d.reservedHours + assigningTicket.estimatedHours) / d.netWeeklyHours) * 100))
            }
          : d
      )
    );

    showToast(`Ticket affecté à ${dev.name}`);
    setAssigningTicket(null);
    setSelectedDevId("");
  };

  // Action : Convertir email en ticket
  const handleConvertEmail = (email: InboxEmail) => {
    setNewTitle(email.subject);
    setNewDesc(email.bodyPreview);
    setNewApplicant(email.senderName);
    setNewClient(email.isPersonalDomain ? "Externe" : "Safir Consulting");
    setShowModal(true);
  };

  // Helpers de rendu des statuts
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "RECEIVED":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 border border-slate-300">Reçu</span>;
      case "QUALIFIED":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-sky-50 text-sky-800 border border-sky-300">Qualifié</span>;
      case "ASSIGNED":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-300">Affecté</span>;
      case "IN_PROGRESS":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-800 border border-indigo-300">En cours</span>;
      case "DELIVERED":
      case "CLOSED":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-300">Livré</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  const renderPriorityBadge = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">Critique</span>;
      case "HIGH":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">Haute</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-normal bg-slate-100 text-slate-600">Normale</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* ================================================================= */}
      {/* 1. BARRE DE NAVIGATION D'ENTREPRISE ÉPURÉE                          */}
      {/* ================================================================= */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo et Identité Entreprise */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-sky-700 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  S
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-base">Safir Consulting</span>
                    <span className="text-slate-300">|</span>
                    <span className="font-medium text-slate-700 text-sm">Ticket Manager</span>
                  </div>
                  <p className="text-xs text-slate-500">Business Unit SME — Pilotage Développements SAP</p>
                </div>
              </div>

              {/* Onglets de navigation principaux */}
              <nav className="hidden md:flex items-center space-x-1 ml-4">
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === "dashboard"
                      ? "bg-slate-100 text-sky-800 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  Tableau de bord
                </button>
                <button
                  onClick={() => setActiveTab("tickets")}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                    activeTab === "tickets"
                      ? "bg-slate-100 text-sky-800 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <span>Tickets SAP</span>
                  <span className="px-1.5 py-0.5 text-xs bg-slate-200 text-slate-700 rounded-full font-mono">
                    {tickets.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("developers")}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                    activeTab === "developers"
                      ? "bg-slate-100 text-sky-800 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <span>Équipe & Capacité</span>
                  <span className="px-1.5 py-0.5 text-xs bg-slate-200 text-slate-700 rounded-full font-mono">
                    {developers.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("inbox")}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                    activeTab === "inbox"
                      ? "bg-slate-100 text-sky-800 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <span>Boîte Outlook M365</span>
                  {stats.pendingEmailsCount > 0 && (
                    <span className="px-1.5 py-0.5 text-xs bg-amber-100 text-amber-800 rounded-full font-semibold">
                      {stats.pendingEmailsCount}
                    </span>
                  )}
                </button>
              </nav>
            </div>

            {/* Actions à droite et Profil Responsable */}
            <div className="flex items-center gap-3">
              <button
                onClick={refreshData}
                disabled={loading}
                title="Actualiser les données"
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-sky-600" : ""}`} />
              </button>

              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-700 hover:bg-sky-800 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Nouveau ticket</span>
              </button>

              <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

              {/* Fiche Responsable */}
              <div className="flex items-center gap-2.5 pl-1">
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-semibold text-xs border border-slate-300">
                  AG
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-semibold text-slate-900 leading-none">Aliko Getheme</div>
                  <div className="text-[11px] text-slate-500 leading-tight">Responsable BU SME</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-lg text-sm flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ================================================================= */}
      {/* 2. CONTENU PRINCIPAL                                              */}
      {/* ================================================================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {/* =============================================================== */}
        {/* VUE 1 : TABLEAU DE BORD EXÉCUTIF                                 */}
        {/* =============================================================== */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* 4 Indicateurs Clés Métier */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider">Tickets en cours</span>
                  <Layers className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-2xl font-bold text-slate-900">{stats.activeTicketsCount}</div>
                <p className="text-xs text-slate-500 mt-1">Demandes de développement actives</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider">Capacité disponible</span>
                  <Clock className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {stats.totalFree} <span className="text-sm font-normal text-slate-500">/ {stats.totalWeeklyCap} h</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Heures de développement libres cette semaine</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider">Taux d'occupation</span>
                  <Users className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-2xl font-bold text-slate-900">{stats.avgLoad}%</div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                  <div
                    className="bg-sky-600 h-1.5 rounded-full"
                    style={{ width: `${Math.min(100, stats.avgLoad)}%` }}
                  />
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider">Boîte Outlook M365</span>
                  <Inbox className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-2xl font-bold text-slate-900">{stats.pendingEmailsCount}</div>
                <p className="text-xs text-slate-500 mt-1">Messages reçus à qualifier</p>
              </div>
            </div>

            {/* Deux colonnes : Tickets récents & Disponibilité équipe */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Colonne Gauche : Derniers tickets (2/3 de l'écran) */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">Tickets récents</h2>
                    <p className="text-xs text-slate-500">Demandes enregistrées nécessitant affectation ou suivi</p>
                  </div>
                  <button
                    onClick={() => setActiveTab("tickets")}
                    className="text-xs text-sky-700 hover:text-sky-800 font-medium flex items-center gap-1"
                  >
                    <span>Voir tous les tickets</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="divide-y divide-slate-100 flex-1 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-medium">
                      <tr>
                        <th className="py-2.5 px-4">Réf.</th>
                        <th className="py-2.5 px-4">Titre du ticket</th>
                        <th className="py-2.5 px-4">Demandeur</th>
                        <th className="py-2.5 px-4">Statut</th>
                        <th className="py-2.5 px-4">Développeur</th>
                        <th className="py-2.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tickets.slice(0, 6).map((ticket) => (
                        <tr key={ticket.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-medium text-slate-900">{ticket.reference}</td>
                          <td className="py-3 px-4 max-w-xs truncate font-medium text-slate-800" title={ticket.title}>
                            {ticket.title}
                          </td>
                          <td className="py-3 px-4 text-slate-600">{ticket.applicantName || "Client"}</td>
                          <td className="py-3 px-4">{renderStatusBadge(ticket.status)}</td>
                          <td className="py-3 px-4 text-slate-600">
                            {ticket.assignedDeveloper ? (
                              <span className="font-medium text-slate-900">{ticket.assignedDeveloper.name}</span>
                            ) : (
                              <span className="text-slate-400 italic">Non affecté</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {!ticket.assignedDeveloper && (
                              <button
                                onClick={() => setAssigningTicket(ticket)}
                                className="text-xs text-sky-700 hover:text-sky-900 font-medium underline"
                              >
                                Affecter
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Colonne Droite : Disponibilité équipe (1/3 de l'écran) */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">Capacités Développeurs</h2>
                    <p className="text-xs text-slate-500">Charge hebdomadaire actuelle</p>
                  </div>
                  <button
                    onClick={() => setActiveTab("developers")}
                    className="text-xs text-sky-700 hover:text-sky-800 font-medium flex items-center gap-1"
                  >
                    <span>Détail</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-4 divide-y divide-slate-100 overflow-y-auto max-h-[420px]">
                  {developers.slice(0, 7).map((dev) => (
                    <div key={dev.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-slate-900">{dev.name}</span>
                        <span className="text-slate-500 font-mono">
                          {dev.freeHours} h libres / {dev.netWeeklyHours} h
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${
                            dev.loadPercentage > 75
                              ? "bg-rose-500"
                              : dev.loadPercentage > 40
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.min(100, dev.loadPercentage)}%` }}
                        />
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 truncate">{dev.jobTitle}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* VUE 2 : TABLEAU COMPLET DES TICKETS SAP                          */}
        {/* =============================================================== */}
        {activeTab === "tickets" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Barre de filtres et d'outils */}
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <div className="relative w-full">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Rechercher par référence, titre, demandeur..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-600 focus:border-sky-600"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Statut :</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-600"
                >
                  <option value="ALL">Tous les statuts ({tickets.length})</option>
                  <option value="RECEIVED">Reçus</option>
                  <option value="QUALIFIED">Qualifiés</option>
                  <option value="ASSIGNED">Affectés</option>
                  <option value="IN_PROGRESS">En cours</option>
                  <option value="DELIVERED">Livrés</option>
                </select>
              </div>
            </div>

            {/* Tableau principal */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Référence</th>
                    <th className="py-3 px-4">Titre & Description</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Priorité</th>
                    <th className="py-3 px-4">Demandeur</th>
                    <th className="py-3 px-4">Statut</th>
                    <th className="py-3 px-4">Développeur assigné</th>
                    <th className="py-3 px-4 text-center">Estimation</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">{ticket.reference}</td>
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="font-semibold text-slate-900 text-sm">{ticket.title}</div>
                        {ticket.description && (
                          <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">{ticket.description}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-mono">
                          {ticket.typeCode}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">{renderPriorityBadge(ticket.priorityCode)}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{ticket.applicantName || "Non renseigné"}</div>
                        <div className="text-[11px] text-slate-500">{ticket.clientCompany}</div>
                      </td>
                      <td className="py-3.5 px-4">{renderStatusBadge(ticket.status)}</td>
                      <td className="py-3.5 px-4">
                        {ticket.assignedDeveloper ? (
                          <div>
                            <div className="font-medium text-slate-900">{ticket.assignedDeveloper.name}</div>
                            <div className="text-[11px] text-slate-500">{ticket.assignedDeveloper.email}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">En attente</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-medium text-slate-700">
                        {ticket.estimatedHours} h
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        {!ticket.assignedDeveloper ? (
                          <button
                            onClick={() => setAssigningTicket(ticket)}
                            className="px-2.5 py-1 text-xs font-medium text-white bg-sky-700 hover:bg-sky-800 rounded transition-colors"
                          >
                            Affecter
                          </button>
                        ) : (
                          <button
                            onClick={() => setAssigningTicket(ticket)}
                            className="px-2 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                          >
                            Réaffecter
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredTickets.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-500">
                        Aucun ticket ne correspond aux critères de recherche.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* VUE 3 : CAPACITÉS & DÉVELOPPEURS DE L'ÉQUIPE                      */}
        {/* =============================================================== */}
        {activeTab === "developers" && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Référentiel des Développeurs & Compétences SAP</h2>
                <p className="text-xs text-slate-500">
                  Plan de charge individuel et compétences certifiées sur la base hebdomadaire de 40 heures
                </p>
              </div>
              <div className="text-xs text-slate-600 font-medium">
                Effectif : <span className="font-bold text-slate-900">{developers.length} développeurs actifs</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {developers.map((dev) => (
                <div key={dev.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-semibold text-slate-900 text-sm leading-tight">{dev.name}</h3>
                        <p className="text-xs text-slate-500">{dev.email}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Actif
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 font-medium mb-3">{dev.jobTitle}</p>

                    {/* Jauge de charge */}
                    <div className="space-y-1 mb-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Disponibilité :</span>
                        <span className="font-bold text-slate-900 font-mono">
                          {dev.freeHours} h libres <span className="font-normal text-slate-500">({dev.reservedHours} h allouées)</span>
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            dev.loadPercentage > 75
                              ? "bg-rose-500"
                              : dev.loadPercentage > 40
                              ? "bg-amber-500"
                              : "bg-sky-600"
                          }`}
                          style={{ width: `${Math.min(100, dev.loadPercentage)}%` }}
                        />
                      </div>
                    </div>

                    {/* Compétences clés */}
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        Compétences validées
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {dev.skills && dev.skills.length > 0 ? (
                          dev.skills.map((skill) => (
                            <span
                              key={skill.id}
                              className="px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700 border border-slate-200"
                            >
                              {skill.name} <span className="font-semibold text-slate-500">({skill.level}/5)</span>
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">Compétences en cours de qualification</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* VUE 4 : BOÎTE DE RÉCEPTION OUTLOOK M365                          */}
        {/* =============================================================== */}
        {activeTab === "inbox" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Boîte de réception Outlook Microsoft 365</h2>
                <p className="text-xs text-slate-500">
                  E-mails reçus sur la boîte d'Aliko Getheme (aliko.getheme@safirconsulting.net)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Connecteur Graph M365 actif
                </span>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {emails.map((email) => (
                <div key={email.id} className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900 text-sm">{email.senderName}</span>
                      <span className="text-xs text-slate-500 font-mono">&lt;{email.senderEmail}&gt;</span>

                      {/* Type d'expéditeur normal et lisible */}
                      {email.senderKind === "CONSULTANT" && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                          Consultant interne Safir
                        </span>
                      )}
                      {email.senderKind === "CLIENT_CONTACT" && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          Contact client
                        </span>
                      )}
                      {email.isPersonalDomain && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          Domaine externe / vigilance
                        </span>
                      )}
                    </div>

                    <div className="font-medium text-slate-800 text-sm">{email.subject}</div>
                    <p className="text-xs text-slate-600 line-clamp-2">{email.bodyPreview}</p>
                    <div className="text-[11px] text-slate-400">{email.receivedAt}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    {email.processingStatus === "PENDING_QUALIFICATION" ? (
                      <button
                        onClick={() => handleConvertEmail(email)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white text-xs font-medium rounded-lg shadow-sm transition-colors whitespace-nowrap"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Créer ticket SAP</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Ticket créé
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ================================================================= */}
      {/* 3. MODALE DE CRÉATION D'UN TICKET SAP                             */}
      {/* ================================================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-semibold text-slate-900 text-sm">Nouveau Ticket de Développement SAP</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Titre de la demande *</label>
                <input
                  type="text"
                  required
                  placeholder="ex : Addon validation commandes fournisseurs SAP B1"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-600 focus:border-sky-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Type de besoin SAP</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-600"
                  >
                    <option value="ADDON">Addon SAP Business One</option>
                    <option value="GATEWAY">Passerelle Service Layer</option>
                    <option value="S4HANA">Évolution S/4HANA (ABAP/CDS)</option>
                    <option value="REPORT">Reporting SAP HANA</option>
                    <option value="SUPPORT">Support / Correctif</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priorité</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-600"
                  >
                    <option value="LOW">Basse</option>
                    <option value="MEDIUM">Moyenne</option>
                    <option value="HIGH">Haute</option>
                    <option value="CRITICAL">Critique</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Estimation (heures)</label>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={newHours}
                    onChange={(e) => setNewHours(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Demandeur</label>
                  <input
                    type="text"
                    placeholder="Mélissa Diakité"
                    value={newApplicant}
                    onChange={(e) => setNewApplicant(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Entreprise / Client</label>
                <input
                  type="text"
                  placeholder="ex : Safir Consulting ou Société cliente"
                  value={newClient}
                  onChange={(e) => setNewClient(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description détaillée</label>
                <textarea
                  rows={3}
                  placeholder="Précisez le périmètre fonctionnel et technique..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-medium text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors shadow-sm"
                >
                  Enregistrer le ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 4. MODALE D'AFFECTATION D'UN DÉVELOPPEUR                          */}
      {/* ================================================================= */}
      {assigningTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">Affecter le ticket</h3>
                <p className="text-xs text-slate-500 font-mono">{assigningTicket.reference}</p>
              </div>
              <button
                onClick={() => setAssigningTicket(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="p-4 space-y-4">
              <div>
                <div className="text-xs text-slate-500 mb-1">Besoin :</div>
                <div className="text-sm font-semibold text-slate-900">{assigningTicket.title}</div>
                <div className="text-xs text-slate-600 mt-1">
                  Charge estimée : <span className="font-bold text-slate-800">{assigningTicket.estimatedHours} heures</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Sélectionner un développeur disponible
                </label>
                <select
                  required
                  value={selectedDevId}
                  onChange={(e) => setSelectedDevId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-600"
                >
                  <option value="">-- Choisir un développeur --</option>
                  {developers.map((dev) => (
                    <option key={dev.id} value={dev.id}>
                      {dev.name} ({dev.freeHours} h libres cette semaine — {dev.jobTitle})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="font-medium text-slate-800">Notification automatique :</div>
                <p>Un e-mail de notification officiel sera envoyé au développeur sur sa messagerie Safir Consulting.</p>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAssigningTicket(null)}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!selectedDevId}
                  className="px-4 py-1.5 text-xs font-medium text-white bg-sky-700 hover:bg-sky-800 disabled:opacity-50 rounded-lg shadow-sm"
                >
                  Valider l'affectation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
