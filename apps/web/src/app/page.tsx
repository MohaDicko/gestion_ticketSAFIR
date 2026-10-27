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
  UserCheck,
  Shield,
  Lock,
  LogOut,
  AlertTriangle,
  Play,
  Check,
  ChevronDown
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
  status: "RECEIVED" | "QUALIFIED" | "ASSIGNED" | "IN_PROGRESS" | "BLOCKED" | "DELIVERED" | "CLOSED";
  typeCode: string;
  priorityCode: string;
  estimatedHours: number;
  remainingHours?: number;
  blockerReason?: string;
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

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "HEAD" | "DEVELOPER" | "CONSULTANT" | "ADMIN";
  roleLabel: string;
  developerId?: string;
  initials: string;
}

// Référentiel des utilisateurs pour le contrôle d'accès RBAC
const SYSTEM_USERS: AuthUser[] = [
  {
    id: "user-aliko",
    name: "Aliko Getheme",
    email: "aliko.getheme@safirconsulting.net",
    role: "HEAD",
    roleLabel: "Direction BU SME & Arbitrage",
    initials: "AG"
  },
  {
    id: "user-anoop",
    name: "Anoop Pandimukkula",
    email: "anoop.pandimukkula@safirconsulting.net",
    role: "DEVELOPER",
    roleLabel: "Senior Développeur SAP B1 & Addons",
    developerId: "dev-anoop",
    initials: "AP"
  },
  {
    id: "user-moha",
    name: "Moha Dicko",
    email: "mohadicko95@gmail.com",
    role: "DEVELOPER",
    roleLabel: "Lead Développeur Full-Stack & Architecte",
    developerId: "dev-moha",
    initials: "MD"
  },
  {
    id: "user-hassane",
    name: "Hassane Bocoum",
    email: "hassane.bocoum@safirconsulting.net",
    role: "DEVELOPER",
    roleLabel: "Lead Développeur SAP S/4HANA & ABAP",
    developerId: "dev-hassane",
    initials: "HB"
  },
  {
    id: "user-melissa",
    name: "Mélissa Diakité",
    email: "melissa.diakite@safirconsulting.net",
    role: "CONSULTANT",
    roleLabel: "Consultante Fonctionnelle SAP",
    initials: "MD"
  }
];

// Données d'équipe
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
    remainingHours: 14,
    clientCompany: "Safir Consulting (Consulting Interne)",
    applicantName: "Mélissa Diakité",
    applicantEmail: "melissa.diakite@safirconsulting.net",
    assignedDeveloper: { id: "dev-anoop", name: "Anoop Pandimukkula", email: "anoop.pandimukkula@safirconsulting.net" },
    createdAt: "2026-10-25"
  },
  {
    id: "tix-2",
    reference: "INT-2026-0002",
    title: "Passerelle Import Factures Dématérialisées Service Layer",
    description: "Connecteur automatisé synchronisant les factures PDF structurées dans SAP Business One via REST Service Layer.",
    status: "ASSIGNED",
    typeCode: "GATEWAY",
    priorityCode: "CRITICAL",
    estimatedHours: 32,
    remainingHours: 32,
    clientCompany: "Omega Distribution",
    applicantName: "Christian Durand",
    applicantEmail: "c.durand@client-omega.com",
    assignedDeveloper: { id: "dev-moha", name: "Moha Dicko", email: "mohadicko95@gmail.com" },
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
    remainingHours: 16,
    clientCompany: "Société Nouvelle Industrie",
    applicantName: "Alain Moreau",
    applicantEmail: "contact@societe-nouvelle-industrie.fr",
    assignedDeveloper: null,
    createdAt: "2026-10-27"
  },
  {
    id: "tix-4",
    reference: "BUG-2026-0004",
    title: "Correction anomalie lettrage comptable sur CDS Views S/4HANA",
    description: "Erreur de lettrage constatée lors de la clôture périodique suite à la dernière mise à niveau SAP.",
    status: "BLOCKED",
    blockerReason: "En attente transmission du jeu d'écritures réelles par l'équipe comptable client",
    typeCode: "BUG",
    priorityCode: "HIGH",
    estimatedHours: 12,
    remainingHours: 8,
    clientCompany: "Client Alpha",
    applicantName: "Mélissa Diakité",
    applicantEmail: "melissa.diakite@safirconsulting.net",
    assignedDeveloper: { id: "dev-anoop", name: "Anoop Pandimukkula", email: "anoop.pandimukkula@safirconsulting.net" },
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
  // Gestion de la session et authentification RBAC
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(SYSTEM_USERS[0]); // Aliko par défaut
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Formulaire de login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  // Navigation
  const [activeTab, setActiveTab] = useState<"dashboard" | "tickets" | "developers" | "inbox" | "my-tickets" | "my-demands">("dashboard");

  // Données
  const [developers, setDevelopers] = useState<Developer[]>(INITIAL_DEVELOPERS);
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [emails, setEmails] = useState<InboxEmail[]>(INITIAL_EMAILS);
  const [loading, setLoading] = useState(false);

  // Filtres
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modales métier
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newType, setNewType] = useState("ADDON");
  const [newPriority, setNewPriority] = useState("HIGH");
  const [newHours, setNewHours] = useState(16);
  const [newClient, setNewClient] = useState("");
  const [newApplicant, setNewApplicant] = useState("");

  const [assigningTicket, setAssigningTicket] = useState<Ticket | null>(null);
  const [selectedDevId, setSelectedDevId] = useState("");

  // Modale Reste à Faire (RAF)
  const [editingRafTicket, setEditingRafTicket] = useState<Ticket | null>(null);
  const [newRemainingHours, setNewRemainingHours] = useState<number>(0);

  // Modale Déclaration de Blocage
  const [blockingTicket, setBlockingTicket] = useState<Ticket | null>(null);
  const [blockerReasonText, setBlockerReasonText] = useState("");

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Chargement synchronisé API
  const refreshData = async () => {
    setLoading(true);
    try {
      const [devsRes, tixRes, emailsRes] = await Promise.all([
        fetch(`${API_BASE}/developers`).then((r) => r.json()).catch(() => []),
        fetch(`${API_BASE}/tickets`).then((r) => r.json()).catch(() => []),
        fetch(`${API_BASE}/emails/inbox`).then((r) => r.json()).catch(() => [])
      ]);

      if (Array.isArray(devsRes) && devsRes.length > 0) setDevelopers(devsRes);
      if (Array.isArray(tixRes) && tixRes.length > 0) setTickets(tixRes);
      if (Array.isArray(emailsRes) && emailsRes.length > 0) setEmails(emailsRes);
      showToast("Données synchronisées avec succès");
    } catch {
      showToast("Mode local connecté");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Ajustement de l'onglet actif selon le rôle au changement d'utilisateur
  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === "DEVELOPER") {
      setActiveTab("my-tickets");
    } else if (currentUser.role === "CONSULTANT") {
      setActiveTab("my-demands");
    } else {
      setActiveTab("dashboard");
    }
  }, [currentUser?.id]);

  // Connexion manuelle
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const found = SYSTEM_USERS.find(
      (u) => u.email.toLowerCase() === loginEmail.trim().toLowerCase()
    );
    if (!found) {
      setLoginError("Aucun compte Safir Consulting associé à cet e-mail.");
      return;
    }
    setCurrentUser(found);
    setShowLoginModal(false);
    setLoginEmail("");
    setLoginPassword("");
    showToast(`Bienvenue, ${found.name} (${found.roleLabel})`);
  };

  const switchUser = (user: AuthUser) => {
    setCurrentUser(user);
    setShowUserMenu(false);
    showToast(`Session basculée sur : ${user.name} (${user.roleLabel})`);
  };

  // Statistiques calculées
  const stats = useMemo(() => {
    const totalWeeklyCap = developers.reduce((sum, d) => sum + (d.netWeeklyHours || 40), 0);
    const totalReserved = developers.reduce((sum, d) => sum + (d.reservedHours || 0), 0);
    const totalFree = Math.max(0, totalWeeklyCap - totalReserved);
    const avgLoad = totalWeeklyCap > 0 ? Math.round((totalReserved / totalWeeklyCap) * 100) : 0;
    const activeTickets = tickets.filter((t) => t.status !== "CLOSED");
    const blockedTickets = tickets.filter((t) => t.status === "BLOCKED");
    const pendingEmails = emails.filter((m) => m.processingStatus === "PENDING_QUALIFICATION");

    return {
      totalWeeklyCap,
      totalReserved,
      totalFree,
      avgLoad,
      activeTicketsCount: activeTickets.length,
      blockedTicketsCount: blockedTickets.length,
      pendingEmailsCount: pendingEmails.length
    };
  }, [developers, tickets, emails]);

  // Tickets filtrés pour le développeur connecté
  const myAssignedTickets = useMemo(() => {
    if (!currentUser || currentUser.role !== "DEVELOPER") return [];
    return tickets.filter(
      (t) =>
        t.assignedDeveloper?.email?.toLowerCase() === currentUser.email.toLowerCase() ||
        t.assignedDeveloper?.id === currentUser.developerId
    );
  }, [tickets, currentUser]);

  // Tickets émis par la consultante
  const myConsultantDemands = useMemo(() => {
    if (!currentUser || currentUser.role !== "CONSULTANT") return [];
    return tickets.filter(
      (t) => t.applicantEmail?.toLowerCase() === currentUser.email.toLowerCase() || t.applicantName?.includes(currentUser.name)
    );
  }, [tickets, currentUser]);

  // Filtrage global des tickets
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

  // Actions métier Développeur : Mise à jour du Reste à Faire (RAF)
  const handleUpdateRaf = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRafTicket) return;

    setTickets((prev) =>
      prev.map((t) =>
        t.id === editingRafTicket.id
          ? {
              ...t,
              remainingHours: newRemainingHours,
              status: t.status === "ASSIGNED" ? "IN_PROGRESS" : t.status
            }
          : t
      )
    );
    showToast(`Reste à faire mis à jour : ${newRemainingHours} h sur ${editingRafTicket.reference}`);
    setEditingRafTicket(null);
  };

  // Actions métier Développeur : Déclarer un blocage
  const handleDeclareBlocker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockingTicket || !blockerReasonText.trim()) return;

    setTickets((prev) =>
      prev.map((t) =>
        t.id === blockingTicket.id
          ? {
              ...t,
              status: "BLOCKED",
              blockerReason: blockerReasonText
            }
          : t
      )
    );
    showToast(`🚨 Blocage signalé à Aliko sur le ticket ${blockingTicket.reference}`);
    setBlockingTicket(null);
    setBlockerReasonText("");
  };

  // Action Développeur : Débloquer / Reprendre
  const handleResumeTicket = (ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? { ...t, status: "IN_PROGRESS", blockerReason: undefined }
          : t
      )
    );
    showToast("Ticket débloqué, statut repassé en cours");
  };

  // Action Développeur : Marquer comme Livré
  const handleDeliverTicket = (ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? { ...t, status: "DELIVERED", remainingHours: 0 }
          : t
      )
    );
    showToast("Ticket marqué comme Livré (en attente recette Aliko)");
  };

  // Action HEAD : Créer un ticket
  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTicket: Ticket = {
      id: `tix-${Date.now()}`,
      reference: `ADD-2026-${String(tickets.length + 1).padStart(4, "0")}`,
      title: newTitle,
      description: newDesc,
      status: "RECEIVED",
      typeCode: newType,
      priorityCode: newPriority,
      estimatedHours: Number(newHours) || 16,
      remainingHours: Number(newHours) || 16,
      clientCompany: newClient || "Safir Consulting",
      applicantName: newApplicant || (currentUser ? currentUser.name : "Aliko Getheme"),
      applicantEmail: currentUser?.email || "aliko.getheme@safirconsulting.net",
      assignedDeveloper: null,
      createdAt: new Date().toISOString().split("T")[0]
    };

    setTickets([newTicket, ...tickets]);
    setShowCreateModal(false);
    setNewTitle("");
    setNewDesc("");
    showToast("Nouveau ticket enregistré avec succès");
  };

  // Action HEAD : Affecter développeur
  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningTicket || !selectedDevId) return;

    const dev = developers.find((d) => d.id === selectedDevId);
    if (!dev) return;

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

    showToast(`Ticket ${assigningTicket.reference} affecté à ${dev.name}`);
    setAssigningTicket(null);
    setSelectedDevId("");
  };

  // Helpers de rendu des statuts
  const renderStatusBadge = (status: Ticket["status"]) => {
    switch (status) {
      case "RECEIVED":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 border border-slate-300">Reçu</span>;
      case "QUALIFIED":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-sky-50 text-sky-800 border border-sky-300">Qualifié</span>;
      case "ASSIGNED":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-800 border border-blue-300">Affecté</span>;
      case "IN_PROGRESS":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-800 border border-indigo-300">En cours</span>;
      case "BLOCKED":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-300 animate-pulse">🚨 Bloqué</span>;
      case "DELIVERED":
      case "CLOSED":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-300">Livré</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* ================================================================= */}
      {/* BARRE DE NAVIGATION D'ENTREPRISE AVEC RBAC & SÉLECTEUR DE RÔLE     */}
      {/* ================================================================= */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo Entreprise */}
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

              {/* Navigation conditionnelle selon les GRANTS de l'utilisateur connecté */}
              {currentUser && (
                <nav className="hidden md:flex items-center space-x-1 ml-4">
                  {/* Vue Direction (HEAD) */}
                  {currentUser.role === "HEAD" && (
                    <>
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
                        <span>Tous les Tickets SAP</span>
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
                        <span>Équipe & Capacité (15)</span>
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
                    </>
                  )}

                  {/* Vue Développeur (DEVELOPER) */}
                  {currentUser.role === "DEVELOPER" && (
                    <button
                      onClick={() => setActiveTab("my-tickets")}
                      className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                        activeTab === "my-tickets"
                          ? "bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <Briefcase className="w-4 h-4 text-emerald-600" />
                      <span>Mon Espace Développeur ({myAssignedTickets.length} tickets)</span>
                    </button>
                  )}

                  {/* Vue Consultante (CONSULTANT) */}
                  {currentUser.role === "CONSULTANT" && (
                    <button
                      onClick={() => setActiveTab("my-demands")}
                      className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                        activeTab === "my-demands"
                          ? "bg-purple-50 text-purple-800 font-semibold border border-purple-200"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <Mail className="w-4 h-4 text-purple-600" />
                      <span>Mes Demandes Émises ({myConsultantDemands.length})</span>
                    </button>
                  )}
                </nav>
              )}
            </div>

            {/* Droite : Boutons d'action et Sélecteur de Rôle RBAC */}
            <div className="flex items-center gap-3">
              {currentUser?.role === "HEAD" && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white text-xs font-medium rounded-lg shadow-sm transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nouveau ticket</span>
                </button>
              )}

              {/* SÉLECTEUR DE SESSION / PROFIL RBAC */}
              <div className="relative">
                {currentUser ? (
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs border border-slate-300">
                      {currentUser.initials}
                    </div>
                    <div className="hidden sm:block">
                      <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                        <span>{currentUser.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-medium ${
                          currentUser.role === "HEAD"
                            ? "bg-sky-100 text-sky-800"
                            : currentUser.role === "DEVELOPER"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-purple-100 text-purple-800"
                        }`}>
                          {currentUser.role}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 leading-none">{currentUser.roleLabel}</div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg shadow-sm"
                  >
                    Se connecter
                  </button>
                )}

                {/* Dropdown de Changement Rapide d'Utilisateur / Rôle */}
                {showUserMenu && currentUser && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Tester les niveaux d'accès (Grants)
                      </div>
                    </div>

                    <div className="py-1">
                      {SYSTEM_USERS.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => switchUser(user)}
                          className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                            currentUser.id === user.id ? "bg-sky-50 font-semibold" : ""
                          }`}
                        >
                          <div>
                            <div className="text-slate-900 font-medium">{user.name}</div>
                            <div className="text-[11px] text-slate-500">{user.roleLabel}</div>
                          </div>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                            user.role === "HEAD"
                              ? "bg-sky-100 text-sky-800"
                              : user.role === "DEVELOPER"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-purple-100 text-purple-800"
                          }`}>
                            {user.role}
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-100 px-3 py-1">
                      <button
                        onClick={() => {
                          setCurrentUser(null);
                          setShowUserMenu(false);
                          setShowLoginModal(true);
                        }}
                        className="w-full text-left text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1.5 py-1 font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Se déconnecter (Écran de Login)</span>
                      </button>
                    </div>
                  </div>
                )}
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
      {/* CONTENU PRINCIPAL SELON LE RÔLE                                  */}
      {/* ================================================================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {/* =============================================================== */}
        {/* VUE 1 : ESPACE DÉVELOPPEUR (Anoop, Moha, Hassane, etc.)           */}
        {/* =============================================================== */}
        {currentUser?.role === "DEVELOPER" && activeTab === "my-tickets" && (
          <div className="space-y-6">
            {/* Bannière de Bienvenue Développeur */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-slate-900">Espace Développeur — {currentUser.name}</h1>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Accès DEVELOPER
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Gérez vos tickets SAP assignés, mettez à jour votre reste à faire et signalez d'éventuels blocages.
                </p>
              </div>

              {/* Jauge Personnelle du Développeur */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs flex items-center gap-6">
                <div>
                  <div className="text-slate-500 font-medium">Capacité hebdo</div>
                  <div className="text-sm font-bold text-slate-900">40 heures</div>
                </div>
                <div>
                  <div className="text-slate-500 font-medium">Tickets en cours</div>
                  <div className="text-sm font-bold text-slate-900">{myAssignedTickets.length}</div>
                </div>
              </div>
            </div>

            {/* Liste des Tickets Personnels du Développeur */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Mes Demandes & Addons Assignés</h2>
                  <p className="text-xs text-slate-500">Tickets dont vous êtes le responsable de réalisation</p>
                </div>
              </div>

              {myAssignedTickets.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  Aucun ticket ne vous est actuellement affecté. Consultez Aliko en cas de disponibilité.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {myAssignedTickets.map((ticket) => (
                    <div key={ticket.id} className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1.5 flex-1 max-w-2xl">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-slate-900 text-sm">{ticket.reference}</span>
                          <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-100 text-slate-700">
                            {ticket.typeCode}
                          </span>
                          {renderStatusBadge(ticket.status)}
                        </div>

                        <div className="font-semibold text-slate-900 text-sm">{ticket.title}</div>
                        {ticket.description && (
                          <p className="text-xs text-slate-600">{ticket.description}</p>
                        )}

                        {/* Motif de blocage si présent */}
                        {ticket.status === "BLOCKED" && ticket.blockerReason && (
                          <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-semibold">Blocage signalé : </span>
                              {ticket.blockerReason}
                            </div>
                          </div>
                        )}

                        <div className="text-xs text-slate-500 flex items-center gap-4 pt-1">
                          <span>Demandeur : <strong className="text-slate-700">{ticket.applicantName}</strong></span>
                          <span>Client : <strong className="text-slate-700">{ticket.clientCompany}</strong></span>
                          <span>Estimation initiale : <strong className="text-slate-700">{ticket.estimatedHours} h</strong></span>
                          <span>Reste à faire : <strong className="text-sky-700">{ticket.remainingHours ?? ticket.estimatedHours} h</strong></span>
                        </div>
                      </div>

                      {/* Actions Développeur */}
                      <div className="flex items-center gap-2 flex-wrap md:flex-nowrap shrink-0">
                        <button
                          onClick={() => {
                            setEditingRafTicket(ticket);
                            setNewRemainingHours(ticket.remainingHours ?? ticket.estimatedHours);
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
                        >
                          Saisir Reste à Faire (RAF)
                        </button>

                        {ticket.status === "BLOCKED" ? (
                          <button
                            onClick={() => handleResumeTicket(ticket.id)}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors"
                          >
                            Reprendre le ticket
                          </button>
                        ) : (
                          <button
                            onClick={() => setBlockingTicket(ticket)}
                            className="px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
                          >
                            Signaler un blocage
                          </button>
                        )}

                        {ticket.status !== "DELIVERED" && ticket.status !== "CLOSED" && (
                          <button
                            onClick={() => handleDeliverTicket(ticket.id)}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors"
                          >
                            Marquer comme Livré
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* VUE 2 : ESPACE CONSULTANTE (Mélissa Diakité)                      */}
        {/* =============================================================== */}
        {currentUser?.role === "CONSULTANT" && activeTab === "my-demands" && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-slate-900">Espace Consulting SAP — {currentUser.name}</h1>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                    Accès CONSULTANT
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Suivez en direct l'avancement des spécifications transmises à Aliko et à l'équipe de développement.
                </p>
              </div>

              <button
                onClick={() => {
                  setNewApplicant(currentUser.name);
                  setNewClient("Safir Consulting (Consulting Interne)");
                  setShowCreateModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-medium rounded-lg shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Soumettre un nouveau besoin SAP</span>
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                <h2 className="text-sm font-semibold text-slate-900">Mes Demandes Émises ({myConsultantDemands.length})</h2>
                <p className="text-xs text-slate-500">Transparence en temps réel sur la réalisation technique</p>
              </div>

              <div className="divide-y divide-slate-100">
                {myConsultantDemands.map((ticket) => (
                  <div key={ticket.id} className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-sm">{ticket.reference}</span>
                        {renderStatusBadge(ticket.status)}
                      </div>
                      <div className="font-semibold text-slate-900 text-sm">{ticket.title}</div>
                      <p className="text-xs text-slate-600">{ticket.description}</p>
                      <div className="text-xs text-slate-500 flex items-center gap-3 pt-1">
                        <span>Développeur en charge : <strong className="text-slate-800">{ticket.assignedDeveloper ? ticket.assignedDeveloper.name : "En cours d'affectation par Aliko"}</strong></span>
                        <span>Charge estimée : <strong className="text-slate-800">{ticket.estimatedHours} h</strong></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* VUE 3 : ESPACE DIRECTION (Aliko Getheme — Rôle HEAD)              */}
        {/* =============================================================== */}
        {currentUser?.role === "HEAD" && activeTab === "dashboard" && (
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
                  <span className="text-xs font-medium uppercase tracking-wider">Alertes Blocage</span>
                  <AlertTriangle className={`w-4 h-4 ${stats.blockedTicketsCount > 0 ? "text-rose-500" : "text-slate-400"}`} />
                </div>
                <div className="text-2xl font-bold text-rose-600">{stats.blockedTicketsCount}</div>
                <p className="text-xs text-slate-500 mt-1">Développeurs arrêtés en attente d'arbitrage</p>
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
              {/* Colonne Gauche : Derniers tickets */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">Tickets récents</h2>
                    <p className="text-xs text-slate-500">Demandes nécessitant affectation ou arbitrage</p>
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
                            {!ticket.assignedDeveloper ? (
                              <button
                                onClick={() => setAssigningTicket(ticket)}
                                className="text-xs text-sky-700 hover:text-sky-900 font-medium underline"
                              >
                                Affecter
                              </button>
                            ) : (
                              <button
                                onClick={() => setAssigningTicket(ticket)}
                                className="text-xs text-slate-500 hover:text-slate-800 font-medium underline"
                              >
                                Réaffecter
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Colonne Droite : Disponibilité équipe */}
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
        {/* VUE 4 : TOUS LES TICKETS SAP (Rôle HEAD)                         */}
        {/* =============================================================== */}
        {currentUser?.role === "HEAD" && activeTab === "tickets" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
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
                  <option value="BLOCKED">Bloqués</option>
                  <option value="DELIVERED">Livrés</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Référence</th>
                    <th className="py-3 px-4">Titre & Description</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Demandeur</th>
                    <th className="py-3 px-4">Statut</th>
                    <th className="py-3 px-4">Développeur assigné</th>
                    <th className="py-3 px-4 text-center">RAF</th>
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
                        {ticket.blockerReason && (
                          <div className="text-[11px] text-rose-600 font-medium mt-0.5">
                            🚨 Motif : {ticket.blockerReason}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-mono">
                          {ticket.typeCode}
                        </span>
                      </td>
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
                        {ticket.remainingHours ?? ticket.estimatedHours} h
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => setAssigningTicket(ticket)}
                          className="px-2.5 py-1 text-xs font-medium text-white bg-sky-700 hover:bg-sky-800 rounded transition-colors"
                        >
                          {ticket.assignedDeveloper ? "Réaffecter" : "Affecter"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* VUE 5 : ÉQUIPE & CAPACITÉ (Rôle HEAD)                            */}
        {/* =============================================================== */}
        {currentUser?.role === "HEAD" && activeTab === "developers" && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Référentiel des Développeurs & Compétences SAP</h2>
                <p className="text-xs text-slate-500">Plan de charge individuel calculé sur 40h/semaine</p>
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

                    <div className="space-y-1 mb-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Disponibilité :</span>
                        <span className="font-bold text-slate-900 font-mono">
                          {dev.freeHours} h libres ({dev.reservedHours} h réservées)
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
                              {skill.name} ({skill.level}/5)
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">En qualification</span>
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
        {/* VUE 6 : BOÎTE OUTLOOK M365 (Rôle HEAD)                           */}
        {/* =============================================================== */}
        {currentUser?.role === "HEAD" && activeTab === "inbox" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Boîte de réception Outlook Microsoft 365</h2>
                <p className="text-xs text-slate-500">
                  E-mails reçus sur la boîte d'Aliko Getheme (aliko.getheme@safirconsulting.net)
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Connecteur Graph M365 actif
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {emails.map((email) => (
                <div key={email.id} className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900 text-sm">{email.senderName}</span>
                      <span className="text-xs text-slate-500 font-mono">&lt;{email.senderEmail}&gt;</span>

                      {email.senderKind === "CONSULTANT" && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                          Consultante interne Safir
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
                        onClick={() => {
                          setNewTitle(email.subject);
                          setNewDesc(email.bodyPreview);
                          setNewApplicant(email.senderName);
                          setNewClient(email.isPersonalDomain ? "Externe" : "Safir Consulting");
                          setShowCreateModal(true);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white text-xs font-medium rounded-lg shadow-sm"
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
      {/* MODALE D'AUTHENTIFICATION / LOGIN FORMULAIRE                      */}
      {/* ================================================================= */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 text-center bg-slate-50/50">
              <div className="w-10 h-10 rounded-xl bg-sky-700 text-white font-bold flex items-center justify-center mx-auto mb-2 text-lg shadow-sm">
                S
              </div>
              <h3 className="font-bold text-slate-900 text-base">Connexion — Ticket Manager</h3>
              <p className="text-xs text-slate-500">Safir Consulting — SME Business Unit</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="p-5 space-y-3.5">
              {loginError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                  {loginError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Adresse e-mail professionnelle</label>
                <input
                  type="email"
                  required
                  placeholder="prenom.nom@safirconsulting.net"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mot de passe</label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
              >
                Se connecter
              </button>

              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-400 bg-white px-2">
                  Ou connexion rapide de démonstration
                </div>
              </div>

              <div className="grid grid-cols-1 gap-1.5">
                {SYSTEM_USERS.slice(0, 3).map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      setCurrentUser(user);
                      setShowLoginModal(false);
                      showToast(`Connecté en tant que ${user.name}`);
                    }}
                    className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-left text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{user.name}</div>
                      <div className="text-[10px] text-slate-500">{user.email}</div>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-100 text-slate-700">
                      {user.role}
                    </span>
                  </button>
                ))}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODALE 1 : SAISIE DU RESTE À FAIRE (RAF DÉVELOPPEUR)              */}
      {/* ================================================================= */}
      {editingRafTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-semibold text-slate-900 text-sm">Mettre à jour le Reste à Faire</h3>
              <button onClick={() => setEditingRafTicket(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateRaf} className="p-4 space-y-3">
              <div className="text-xs text-slate-500">
                Ticket : <strong className="text-slate-900">{editingRafTicket.reference}</strong>
                <div className="text-slate-700 font-medium truncate mt-0.5">{editingRafTicket.title}</div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre d'heures restantes estimées :
                </label>
                <input
                  type="number"
                  min="0"
                  max="200"
                  required
                  value={newRemainingHours}
                  onChange={(e) => setNewRemainingHours(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-600 font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Cette valeur met à jour instantanément la jauge de disponibilité visible par Aliko.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRafTicket(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 bg-slate-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-medium text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-sm"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODALE 2 : SIGNALEMENT DE BLOCAGE (DÉVELOPPEUR)                   */}
      {/* ================================================================= */}
      {blockingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-rose-100 flex items-center justify-between bg-rose-50/50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <h3 className="font-semibold text-slate-900 text-sm">Signaler un Blocage Technique</h3>
              </div>
              <button onClick={() => setBlockingTicket(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDeclareBlocker} className="p-4 space-y-3">
              <div className="text-xs text-slate-600">
                Ticket : <strong className="text-slate-900">{blockingTicket.reference} — {blockingTicket.title}</strong>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Motif du blocage (visible immédiatement par Aliko) :
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="ex : En attente des accès VPN client / Données de tests SAP B1 manquantes..."
                  value={blockerReasonText}
                  onChange={(e) => setBlockerReasonText(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-600"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBlockingTicket(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 bg-slate-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-medium text-white bg-rose-700 hover:bg-rose-800 rounded-lg shadow-sm"
                >
                  Déclarer le blocage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODALE 3 : CRÉATION DE TICKET SAP (HEAD / CONSULTANT)             */}
      {/* ================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-semibold text-slate-900 text-sm">Nouveau Ticket de Développement SAP</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
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
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-600"
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
                  value={newClient}
                  onChange={(e) => setNewClient(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description détaillée</label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800 bg-slate-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-medium text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-sm"
                >
                  Enregistrer le ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODALE 4 : AFFECTATION DU TICKET PAR ALIKO (HEAD)                 */}
      {/* ================================================================= */}
      {assigningTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">Affecter le ticket</h3>
                <p className="text-xs text-slate-500 font-mono">{assigningTicket.reference}</p>
              </div>
              <button onClick={() => setAssigningTicket(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="p-4 space-y-4">
              <div>
                <div className="text-xs text-slate-500 mb-1">Besoin :</div>
                <div className="text-sm font-semibold text-slate-900">{assigningTicket.title}</div>
                <div className="text-xs text-slate-600 mt-1">
                  Charge estimée : <strong className="text-slate-800">{assigningTicket.estimatedHours} heures</strong>
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
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800 bg-slate-100 rounded-lg"
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
