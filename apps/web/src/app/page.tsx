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
  ChevronDown,
  UserPlus,
  Key,
  Eye,
  TrendingUp,
  MessageSquare,
  Send,
  HelpCircle,
  MessageCircle,
  Paperclip,
  FileText,
  Download,
  Bell,
  FileSpreadsheet,
  Printer,
  ShieldCheck,
  Trash2,
  GraduationCap
} from "lucide-react";

const API_BASE = "/api/v1";

export interface TicketAttachment {
  id: string;
  fileName: string;
  fileSize: string;
  fileType: "PDF" | "XLSX" | "SQL" | "PNG" | "LOG" | "ZIP";
  uploadedBy: string;
  uploadedRole: "HEAD" | "DEVELOPER" | "CONSULTANT" | "ADMIN";
  uploadedAt: string;
  scanStatus: "VERIFIED_CLEAN";
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  category: "BLOCKER" | "DEMAND" | "ASSIGNMENT" | "MESSAGE" | "DELIVERY" | "CLOSURE";
  targetRoles: ("HEAD" | "DEVELOPER" | "CONSULTANT" | "ADMIN")[];
  ticketId?: string;
  ticketReference?: string;
  actorName: string;
  createdAt: string;
  read: boolean;
}

interface TicketMessage {
  id: string;
  authorName: string;
  authorRole: "HEAD" | "DEVELOPER" | "CONSULTANT" | "ADMIN";
  authorEmail: string;
  message: string;
  timestamp: string;
  isBlockerQuestion?: boolean;
  isConsultantReply?: boolean;
  attachment?: TicketAttachment;
}

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

interface TicketLotContributor {
  id: string;
  developerId: string;
  developerName: string;
  developerEmail: string;
  lotRole: string;
  lotLabel: string;
  estimatedHours: number;
  remainingHours: number;
  status?: "ASSIGNED" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED";
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
  messages?: TicketMessage[];
  contributors?: TicketLotContributor[];
  currency?: "XOF" | "EUR" | "USD";
  attachments?: TicketAttachment[];
  isSkillOverride?: boolean;
  overrideReason?: string;
}

// Modèles de documents SAP prédéfinis pour l'attachement rapide sécurisé en 1-clic
const SAP_ATTACHMENT_TEMPLATES: { label: string; fileName: string; fileSize: string; fileType: TicketAttachment["fileType"] }[] = [
  { label: "📄 Cahier de Spécifications SAP (.pdf)", fileName: "Cahier_Specifications_Fonctionnelles_SAP.pdf", fileSize: "640 Ko", fileType: "PDF" },
  { label: "📊 Extrait Écritures & Paramétrage (.xlsx)", fileName: "Extrait_Ecritures_Comptables_Client_SAP.xlsx", fileSize: "315 Ko", fileType: "XLSX" },
  { label: "🗄️ Script / Trace SQL HANA (.sql)", fileName: "Vue_Calcul_SQLScript_HANA_Trace.sql", fileSize: "48 Ko", fileType: "SQL" },
  { label: "🖼️ Capture d'Écran Anomalie SAP (.png)", fileName: "Capture_Erreur_ServiceLayer_SAP_B1.png", fileSize: "1.2 Mo", fileType: "PNG" }
];

export interface TicketTypeOption {
  value: string;
  label: string;
}

const INITIAL_TICKET_TYPES: TicketTypeOption[] = [
  { value: "ADDON", label: "Addon SAP Business One" },
  { value: "GATEWAY", label: "Passerelle Service Layer" },
  { value: "S4HANA", label: "Évolution S/4HANA (ABAP/CDS)" },
  { value: "REPORT", label: "Reporting SAP HANA" },
  { value: "SUPPORT", label: "Support / Correctif" },
  { value: "INTEGRATION", label: "Intégration API & Connecteur" },
  { value: "MAINTENANCE", label: "Maintenance Technique & Patch" }
];

const INITIAL_CLIENTS: string[] = [
  "Safir Consulting",
  "Omega Distribution",
  "Société Nouvelle Industrie",
  "AgroTech Côte d'Ivoire",
  "Client Alpha",
  "Sénégal Logistique SA",
  "Banque Régionale Ouest-Africaine"
];

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

// Rôles et Briques Techniques pour la multi-affectation par lot
const TECHNICAL_LOT_ROLES = [
  { value: "ADDON_B1", label: "Addon SAP Business One (UI/DI API)", defaultHours: 14 },
  { value: "HANA_DB", label: "Intégration HANA & Vues SQLScript", defaultHours: 10 },
  { value: "SERVICE_LAYER", label: "Passerelle REST Service Layer & API", defaultHours: 12 },
  { value: "ABAP_CORE", label: "Développement ABAP Core & CDS Views", defaultHours: 12 },
  { value: "FULLSTACK_ARCH", label: "Architecture Solution & Frontend React/Next", defaultHours: 10 },
  { value: "TESTING_QA", label: "Recette Technique & Tests d'Intégration", defaultHours: 6 }
];

// Référentiel des utilisateurs pour le contrôle d'accès RBAC
interface ConsultantProfile {
  id: string;
  name: string;
  email: string;
  organization: string;
  speciality: string;
  demandsCount: number;
}

const INITIAL_CONSULTANTS: ConsultantProfile[] = [
  {
    id: "consultant-melissa",
    name: "Mélissa Diakité",
    email: "melissa.diakite@safirconsulting.net",
    organization: "Safir Consulting",
    speciality: "Consultante Fonctionnelle SAP B1 & S/4HANA",
    demandsCount: 2
  }
];

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
    description: "Implémentation d'un workflow de validation à double niveau pour les commandes d'achats excédant 10 000 000 FCFA (compatible multi-devises EUR / USD).",
    currency: "XOF",
    status: "IN_PROGRESS",
    typeCode: "ADDON",
    priorityCode: "HIGH",
    estimatedHours: 24,
    remainingHours: 14,
    clientCompany: "Safir Consulting (Consulting Interne)",
    applicantName: "Mélissa Diakité",
    applicantEmail: "melissa.diakite@safirconsulting.net",
    assignedDeveloper: { id: "dev-anoop", name: "Anoop Pandimukkula", email: "anoop.pandimukkula@safirconsulting.net" },
    createdAt: "2026-10-25",
    attachments: [
      {
        id: "att-1-1",
        fileName: "Cahier_Spec_Workflow_Achats_SAP_B1.pdf",
        fileSize: "640 Ko",
        fileType: "PDF",
        uploadedBy: "Mélissa Diakité",
        uploadedRole: "CONSULTANT",
        uploadedAt: "2026-10-25 à 14:30",
        scanStatus: "VERIFIED_CLEAN"
      },
      {
        id: "att-1-2",
        fileName: "Schema_Tables_Validation_HANA.sql",
        fileSize: "48 Ko",
        fileType: "SQL",
        uploadedBy: "Anoop Pandimukkula",
        uploadedRole: "DEVELOPER",
        uploadedAt: "2026-10-26 à 10:15",
        scanStatus: "VERIFIED_CLEAN"
      }
    ],
    messages: [
      {
        id: "msg-1-1",
        authorName: "Mélissa Diakité",
        authorRole: "CONSULTANT",
        authorEmail: "melissa.diakite@safirconsulting.net",
        message: "Spécification validée : le workflow d'approbation d'achats doit s'enclencher au-delà de 10 000 000 FCFA HT sur la base de la devise société (compatible multi-devises EUR / USD).",
        timestamp: "2026-10-25 à 14:30",
        attachment: {
          id: "att-1-1",
          fileName: "Cahier_Spec_Workflow_Achats_SAP_B1.pdf",
          fileSize: "640 Ko",
          fileType: "PDF",
          uploadedBy: "Mélissa Diakité",
          uploadedRole: "CONSULTANT",
          uploadedAt: "2026-10-25 à 14:30",
          scanStatus: "VERIFIED_CLEAN"
        }
      },
      {
        id: "msg-1-2",
        authorName: "Anoop Pandimukkula",
        authorRole: "DEVELOPER",
        authorEmail: "anoop.pandimukkula@safirconsulting.net",
        message: "Bien noté Mélissa ! La maquette UI API est en place, nous branchons la validation Service Layer.",
        timestamp: "2026-10-26 à 10:15",
        attachment: {
          id: "att-1-2",
          fileName: "Schema_Tables_Validation_HANA.sql",
          fileSize: "48 Ko",
          fileType: "SQL",
          uploadedBy: "Anoop Pandimukkula",
          uploadedRole: "DEVELOPER",
          uploadedAt: "2026-10-26 à 10:15",
          scanStatus: "VERIFIED_CLEAN"
        }
      }
    ],
    contributors: [
      {
        id: "contrib-1-1",
        developerId: "dev-anoop",
        developerName: "Anoop Pandimukkula",
        developerEmail: "anoop.pandimukkula@safirconsulting.net",
        lotRole: "ADDON_B1",
        lotLabel: "Addon SAP B1 (UI/DI API)",
        estimatedHours: 14,
        remainingHours: 6,
        status: "IN_PROGRESS"
      },
      {
        id: "contrib-1-2",
        developerId: "dev-hassane",
        developerName: "Hassane Bocoum",
        developerEmail: "hassane.bocoum@safirconsulting.net",
        lotRole: "HANA_DB",
        lotLabel: "Intégration HANA & Vues SQLScript",
        estimatedHours: 10,
        remainingHours: 8,
        status: "IN_PROGRESS"
      }
    ]
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
    currency: "XOF",
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
    currency: "EUR",
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
    currency: "XOF",
    clientCompany: "Client Alpha",
    applicantName: "Mélissa Diakité",
    applicantEmail: "melissa.diakite@safirconsulting.net",
    assignedDeveloper: { id: "dev-anoop", name: "Anoop Pandimukkula", email: "anoop.pandimukkula@safirconsulting.net" },
    createdAt: "2026-10-27",
    attachments: [
      {
        id: "att-4-1",
        fileName: "Trace_Erreur_CDS_Views_S4HANA.sql",
        fileSize: "112 Ko",
        fileType: "SQL",
        uploadedBy: "Anoop Pandimukkula",
        uploadedRole: "DEVELOPER",
        uploadedAt: "2026-10-27 à 16:45",
        scanStatus: "VERIFIED_CLEAN"
      }
    ],
    messages: [
      {
        id: "msg-4-1",
        authorName: "Anoop Pandimukkula",
        authorRole: "DEVELOPER",
        authorEmail: "anoop.pandimukkula@safirconsulting.net",
        message: "Bonjour Mélissa, l'anomalie de lettrage sur les CDS Views se produit uniquement en multi-devises. Peux-tu me transmettre un extrait de pièces comptables réelles du client Alpha pour reproduire le bug ?",
        timestamp: "2026-10-27 à 16:45",
        isBlockerQuestion: true,
        attachment: {
          id: "att-4-1",
          fileName: "Trace_Erreur_CDS_Views_S4HANA.sql",
          fileSize: "112 Ko",
          fileType: "SQL",
          uploadedBy: "Anoop Pandimukkula",
          uploadedRole: "DEVELOPER",
          uploadedAt: "2026-10-27 à 16:45",
          scanStatus: "VERIFIED_CLEAN"
        }
      }
    ]
  }
];

// File centrale de qualification d'Aliko (Flux 100% interne à l'application — Zéro e-mail externe automatique)
const INITIAL_EMAILS: InboxEmail[] = [
  {
    id: "mail-1",
    senderName: "Mélissa Diakité",
    senderEmail: "melissa.diakite@safirconsulting.net",
    senderKind: "CONSULTANT",
    isPersonalDomain: false,
    subject: "Spécifications fonctionnelles : Addon approbation d'achats SAP B1",
    bodyPreview: "Demande soumise dans l'application avec le cahier de cadrage validé pour la mise en place du workflow d'approbation...",
    receivedAt: "Aujourd'hui à 11:32",
    processingStatus: "PENDING_QUALIFICATION"
  },
  {
    id: "mail-2",
    senderName: "Christian Durand (via Consulting)",
    senderEmail: "c.durand@client-omega.com",
    senderKind: "CLIENT_CONTACT",
    isPersonalDomain: false,
    subject: "Demande de chiffrage : Ajout des numéros de série dans la passerelle",
    bodyPreview: "Besoin client enregistré sur la plateforme : étendre la passerelle WMS pour tracer les numéros de série sur les réceptions d'articles...",
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
    bodyPreview: "Demande externe consignée pour arbitrage Direction : sollicitation d'accès au serveur SAP B1 pour finaliser les tests...",
    receivedAt: "Hier à 17:45",
    processingStatus: "PENDING_QUALIFICATION"
  }
];

// Notifications Temps Réel In-App initiales (Filtrées selon le rôle connecté)
const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif-1",
    title: "🚨 Stop-the-line : Blocage & Question sur BUG-2026-0004",
    message: "Anoop Pandimukkula a signalé un blocage sur les CDS Views S/4HANA et attend un extrait d'écritures comptables de Mélissa Diakité.",
    category: "BLOCKER",
    targetRoles: ["HEAD", "CONSULTANT"],
    ticketId: "tix-4",
    ticketReference: "BUG-2026-0004",
    actorName: "Anoop Pandimukkula",
    createdAt: "Il y a 15 min",
    read: false
  },
  {
    id: "notif-2",
    title: "📥 Nouvelle demande au Guichet Central d'Aliko",
    message: "Mélissa Diakité a soumis un besoin SAP avec pièce jointe : « Spécifications fonctionnelles : Addon approbation d'achats SAP B1 ».",
    category: "DEMAND",
    targetRoles: ["HEAD"],
    ticketReference: "ADD-2026-0001",
    actorName: "Mélissa Diakité",
    createdAt: "Il y a 42 min",
    read: false
  },
  {
    id: "notif-3",
    title: "👥 Affectation Multi-Développeurs par Lot SAP (ADD-2026-0001)",
    message: "Aliko Getheme a réparti le ticket ADD-2026-0001 en 2 briques : Anoop (Addon B1 - 14h) et Hassane (Intégration HANA - 10h).",
    category: "ASSIGNMENT",
    targetRoles: ["HEAD", "DEVELOPER", "CONSULTANT"],
    ticketId: "tix-1",
    ticketReference: "ADD-2026-0001",
    actorName: "Aliko Getheme",
    createdAt: "Hier à 15:20",
    read: false
  }
];

export default function TicketManagerPage() {
  // Gestion de la session et authentification RBAC (par défaut tout le monde arrive sur la page de login)
  const [systemUsers, setSystemUsers] = useState<AuthUser[]>(SYSTEM_USERS);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Centre de Notifications Temps Réel In-App & Reporting Direction
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Gestion des Pièces Jointes (Fil de discussion & Création de ticket)
  const [selectedAttachmentTemplate, setSelectedAttachmentTemplate] = useState<string>("");
  const [customAttachmentName, setCustomAttachmentName] = useState<string>("");
  const [newTicketAttachmentName, setNewTicketAttachmentName] = useState<string>("");

  // Formulaire de login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  // Navigation
  const [activeTab, setActiveTab] = useState<"dashboard" | "tickets" | "developers" | "inbox" | "my-tickets" | "my-demands">("dashboard");
  const [teamSubTab, setTeamSubTab] = useState<"devs" | "consultants">("devs");

  // Données
  const [developers, setDevelopers] = useState<Developer[]>(INITIAL_DEVELOPERS);
  const [consultants, setConsultants] = useState<ConsultantProfile[]>(INITIAL_CONSULTANTS);
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

  // Gestion dynamique des types de besoins SAP (Aliko HEAD)
  const [ticketTypes, setTicketTypes] = useState<TicketTypeOption[]>(INITIAL_TICKET_TYPES);
  const [showAddTypeInline, setShowAddTypeInline] = useState(false);
  const [customTypeLabel, setCustomTypeLabel] = useState("");

  // Gestion dynamique des entreprises et clients (Aliko HEAD)
  const [clientsList, setClientsList] = useState<string[]>(INITIAL_CLIENTS);
  const [showAddClientInline, setShowAddClientInline] = useState(false);
  const [customClientName, setCustomClientName] = useState("");

  const [newType, setNewType] = useState("ADDON");
  const [newPriority, setNewPriority] = useState("HIGH");
  const [newHours, setNewHours] = useState(16);
  const [newClient, setNewClient] = useState("Safir Consulting");
  const [newApplicant, setNewApplicant] = useState("");
  const [newCurrency, setNewCurrency] = useState<"XOF" | "EUR" | "USD">("XOF");
  const [activeCurrency, setActiveCurrency] = useState<"XOF" | "EUR" | "USD">("XOF");

  const [assigningTicket, setAssigningTicket] = useState<Ticket | null>(null);
  const [assigningHours, setAssigningHours] = useState<number>(16);
  const [assigningCurrency, setAssigningCurrency] = useState<"XOF" | "EUR" | "USD">("XOF");
  const [selectedDevId, setSelectedDevId] = useState("");
  const [isSkillOverrideChecked, setIsSkillOverrideChecked] = useState(true);
  // Affectation Multi-Développeurs par lot technique
  const [isMultiDevAssignment, setIsMultiDevAssignment] = useState(false);
  const [leadLotRole, setLeadLotRole] = useState("ADDON_B1");
  const [leadHours, setLeadHours] = useState(14);
  const [coDevId, setCoDevId] = useState("");
  const [coDevLotRole, setCoDevLotRole] = useState("HANA_DB");
  const [coDevHours, setCoDevHours] = useState(10);

  // Modale Reste à Faire (RAF)
  const [editingRafTicket, setEditingRafTicket] = useState<Ticket | null>(null);
  const [newRemainingHours, setNewRemainingHours] = useState<number>(0);

  // Modale Déclaration de Blocage
  const [blockingTicket, setBlockingTicket] = useState<Ticket | null>(null);
  const [blockerReasonText, setBlockerReasonText] = useState("");

  // Modale de Supervision / Oeil Direction d'Aliko sur la progression
  const [supervisingTicket, setSupervisingTicket] = useState<Ticket | null>(null);

  // Modale Fil de Discussion & Échange Direct Développeur <-> Consultant
  const [discussingTicket, setDiscussingTicket] = useState<Ticket | null>(null);
  const [ticketMessageText, setTicketMessageText] = useState("");
  const [isQuestionBlocker, setIsQuestionBlocker] = useState(false);
  const [unblockOnReply, setUnblockOnReply] = useState(true);

  // Modale Ajout de Développeur (Direction HEAD)
  const [showAddDevModal, setShowAddDevModal] = useState(false);
  const [newDevFirstName, setNewDevFirstName] = useState("");
  const [newDevLastName, setNewDevLastName] = useState("");
  const [newDevEmail, setNewDevEmail] = useState("");
  const [newDevJobTitle, setNewDevJobTitle] = useState("Développeur Solutions SAP Business One");
  const [newDevHours, setNewDevHours] = useState(40);
  const [newDevSkillCategory, setNewDevSkillCategory] = useState("SAP");
  const [newDevSkillName, setNewDevSkillName] = useState("SAP Business One — Service Layer");
  const [newDevSkillLevel, setNewDevSkillLevel] = useState(4);

  // Modale Ajout de Consultant (Direction HEAD)
  const [showAddConsultantModal, setShowAddConsultantModal] = useState(false);
  const [newConsultantFirstName, setNewConsultantFirstName] = useState("");
  const [newConsultantLastName, setNewConsultantLastName] = useState("");
  const [newConsultantEmail, setNewConsultantEmail] = useState("");
  const [newConsultantOrg, setNewConsultantOrg] = useState("Safir Consulting");
  const [newConsultantSpeciality, setNewConsultantSpeciality] = useState("Consultante Fonctionnelle SAP Supply Chain & FI/CO");
  const [newConsultantPassword, setNewConsultantPassword] = useState("Safir2026!Consultant");

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper pour émettre une notification temps réel in-app
  const pushInAppNotification = (notif: Omit<AppNotification, "id" | "createdAt" | "read">) => {
    const item: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: "À l'instant",
      read: false
    };
    setNotifications((prev) => [item, ...prev]);
  };

  // Diagnostic d'adéquation technique des compétences d'un développeur avec le type de besoin SAP
  const checkDeveloperSkillMatch = (dev: Developer, typeCode: string): boolean => {
    if (!dev || !dev.skills) return true;
    const code = (typeCode || "").toUpperCase();
    return dev.skills.some((skill) => {
      const sName = skill.name.toUpperCase();
      const sCat = skill.category.toUpperCase();
      if (code.includes("ADDON") && (sName.includes("ADDON") || sName.includes("DI API") || sName.includes("UI / DI") || sName.includes("B1"))) return true;
      if (code.includes("GATEWAY") && (sName.includes("SERVICE LAYER") || sName.includes("GATEWAY"))) return true;
      if (code.includes("S4HANA") && (sName.includes("ABAP") || sName.includes("CDS") || sName.includes("S/4HANA") || sName.includes("FIORI"))) return true;
      if (code.includes("REPORT") && (sName.includes("HANA") || sName.includes("SQL") || sName.includes("REPORT"))) return true;
      if (code.includes("INTEGRATION") && (sName.includes("API") || sName.includes("INTÉGRATION") || sName.includes("INTEGRATION") || sName.includes("GRAPH"))) return true;
      if (code.includes("MAINTENANCE") && (sName.includes("SAP") || sName.includes("SERVICE LAYER") || sName.includes("API") || sName.includes("DOCKER"))) return true;
      if (code.includes("SUPPORT") && (sName.includes("SAP") || sCat.includes("SAP"))) return true;
      return sName.includes(code) || sCat.includes(code);
    });
  };

  // Helper pour ouvrir la modale d'affectation avec la charge estimée et devise pré-renseignées
  const openAssignModal = (ticket: Ticket) => {
    setAssigningTicket(ticket);
    setAssigningHours(ticket.estimatedHours > 0 ? ticket.estimatedHours : 16);
    setAssigningCurrency(ticket.currency || "XOF");
    setSelectedDevId(ticket.assignedDeveloper?.id || "");
    setIsSkillOverrideChecked(true);
  };

  // Création dynamique d'un nouveau type de besoin SAP (Aliko HEAD)
  const handleAddTicketType = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const label = customTypeLabel.trim();
    if (!label) return;
    const value = label.toUpperCase().replace(/[^A-Z0-9]/g, "_").slice(0, 15) || `TYPE_${Date.now()}`;
    if (ticketTypes.some((t) => t.value === value || t.label.toLowerCase() === label.toLowerCase())) {
      showToast(`Le type « ${label} » existe déjà`);
      return;
    }
    const newTypeObj: TicketTypeOption = { value, label };
    setTicketTypes((prev) => [...prev, newTypeObj]);
    setNewType(value);
    setCustomTypeLabel("");
    setShowAddTypeInline(false);
    showToast(`Nouveau type de besoin créé : « ${label} »`);
  };

  // Suppression d'un type de besoin SAP (Aliko HEAD)
  const handleDeleteTicketType = (typeValueToDelete: string) => {
    if (ticketTypes.length <= 1) {
      showToast("Impossible de supprimer : au moins un type de besoin doit subsister.");
      return;
    }
    const target = ticketTypes.find((t) => t.value === typeValueToDelete);
    setTicketTypes((prev) => prev.filter((t) => t.value !== typeValueToDelete));
    const remaining = ticketTypes.filter((t) => t.value !== typeValueToDelete);
    if (newType === typeValueToDelete && remaining.length > 0) {
      setNewType(remaining[0].value);
    }
    showToast(`Type de besoin « ${target?.label || typeValueToDelete} » supprimé`);
  };

  // Création dynamique d'une nouvelle entreprise / client (Aliko HEAD)
  const handleAddClient = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const name = customClientName.trim();
    if (!name) return;
    if (clientsList.some((c) => c.toLowerCase() === name.toLowerCase())) {
      showToast(`L'entreprise « ${name} » existe déjà`);
      setNewClient(name);
      setShowAddClientInline(false);
      setCustomClientName("");
      return;
    }
    setClientsList((prev) => [...prev, name]);
    setNewClient(name);
    setCustomClientName("");
    setShowAddClientInline(false);
    showToast(`Nouvelle entreprise/client ajoutée : « ${name} »`);
  };

  // Suppression d'une entreprise / client de la liste (Aliko HEAD)
  const handleDeleteClient = (clientToDelete: string) => {
    if (clientsList.length <= 1) {
      showToast("Impossible de supprimer : au moins un client doit subsister.");
      return;
    }
    setClientsList((prev) => prev.filter((c) => c !== clientToDelete));
    const remaining = clientsList.filter((c) => c !== clientToDelete);
    if (newClient === clientToDelete && remaining.length > 0) {
      setNewClient(remaining[0]);
    }
    showToast(`Client/Entreprise « ${clientToDelete} » supprimé de la liste`);
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
    const emailToFind = loginEmail.trim().toLowerCase();
    const found = systemUsers.find(
      (u) => u.email.toLowerCase() === emailToFind
    );
    if (!found) {
      setLoginError(`Aucun collaborateur trouvé avec l'identifiant '${emailToFind}'. Vérifiez votre saisie ou utilisez un compte de démonstration.`);
      return;
    }
    setCurrentUser(found);
    setShowLoginModal(false);
    setLoginEmail("");
    setLoginPassword("");
    showToast(`Connexion réussie — Bienvenue sur votre espace, ${found.name}`);
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

  // Tickets filtrés pour le développeur connecté (Affectation directe ou Lot multi-développeurs)
  const myAssignedTickets = useMemo(() => {
    if (!currentUser || currentUser.role !== "DEVELOPER") return [];
    return tickets.filter((t) => {
      const isLead =
        t.assignedDeveloper?.email?.toLowerCase() === currentUser.email.toLowerCase() ||
        t.assignedDeveloper?.id === currentUser.developerId;
      const isContributor =
        t.contributors &&
        t.contributors.some(
          (c) =>
            c.developerEmail.toLowerCase() === currentUser.email.toLowerCase() ||
            c.developerId === currentUser.developerId
        );
      return isLead || isContributor;
    });
  }, [tickets, currentUser]);

  // Tickets émis par la consultante
  const myConsultantDemands = useMemo(() => {
    if (!currentUser || currentUser.role !== "CONSULTANT") return [];
    return tickets.filter(
      (t) => t.applicantEmail?.toLowerCase() === currentUser.email.toLowerCase() || t.applicantName?.includes(currentUser.name)
    );
  }, [tickets, currentUser]);

  // Notifications filtrées pour l'utilisateur connecté (Centre de Notifications In-App)
  const myNotifications = useMemo(() => {
    if (!currentUser) return [];
    return notifications.filter((n) => n.targetRoles.includes(currentUser.role));
  }, [notifications, currentUser]);

  const unreadNotificationsCount = useMemo(() => {
    return myNotifications.filter((n) => !n.read).length;
  }, [myNotifications]);

  const markAllNotificationsRead = () => {
    if (!currentUser) return;
    setNotifications((prev) =>
      prev.map((n) => (n.targetRoles.includes(currentUser.role) ? { ...n, read: true } : n))
    );
    showToast("Toutes vos notifications ont été marquées comme lues");
  };

  // Export CSV / Excel en 1-Clic pour le Reporting Direction d'Aliko
  const handleExportCsvReport = () => {
    const ratePerHour = activeCurrency === "XOF" ? 45000 : activeCurrency === "EUR" ? 70 : 75;
    const currencyLabel = activeCurrency === "XOF" ? "FCFA (XOF)" : activeCurrency;

    const headers = [
      "Reference",
      "Titre",
      "Type SAP",
      "Priorite",
      "Statut",
      "Client",
      "Demandeur",
      "Developpeur / Equipe",
      "Heures Estimees",
      "Heures Realisees",
      "RAF (h)",
      `Budget Valorise (${currencyLabel})`
    ];

    const rows = tickets.map((t) => {
      const est = t.estimatedHours || 0;
      const rem = t.remainingHours ?? est;
      const done = Math.max(0, est - rem);
      const devLabel =
        t.contributors && t.contributors.length > 1
          ? t.contributors.map((c) => `${c.developerName} (${c.lotRole})`).join(" + ")
          : t.assignedDeveloper?.name || "Non affecte";
      const budget = est * ratePerHour;
      return [
        t.reference,
        `"${t.title.replace(/"/g, '""')}"`,
        t.typeCode,
        t.priorityCode,
        t.status,
        `"${(t.clientCompany || "Safir Consulting").replace(/"/g, '""')}"`,
        `"${(t.applicantName || "Aliko Getheme").replace(/"/g, '""')}"`,
        `"${devLabel.replace(/"/g, '""')}"`,
        est,
        done,
        rem,
        budget
      ].join(";");
    });

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\n");
    try {
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Rapport_Direction_Safir_BU_SME_${activeCurrency}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback en environnement de test sans DOM Blob complet
    }
    showToast(`📊 Export Excel/CSV généré avec succès (${tickets.length} tickets valorisés en ${currencyLabel})`);
  };

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

  // Actions métier Développeur : Mise à jour du Reste à Faire (RAF Mono ou Lot Multi-Développeurs)
  const handleUpdateRaf = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRafTicket) return;

    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== editingRafTicket.id) return t;

        let updatedContributors = t.contributors;
        let updatedRemainingHours = newRemainingHours;

        if (t.contributors && currentUser) {
          const userContrib = t.contributors.find(
            (c) =>
              c.developerId === currentUser.developerId ||
              c.developerEmail.toLowerCase() === currentUser.email.toLowerCase()
          );
          if (userContrib) {
            updatedContributors = t.contributors.map((c) =>
              c.id === userContrib.id
                ? {
                    ...c,
                    remainingHours: newRemainingHours,
                    status: newRemainingHours === 0 ? ("COMPLETED" as const) : ("IN_PROGRESS" as const)
                  }
                : c
            );
            // Recalcul du reste à faire global consolidé
            updatedRemainingHours = updatedContributors.reduce((sum, c) => sum + (c.remainingHours || 0), 0);
          }
        }

        return {
          ...t,
          remainingHours: updatedRemainingHours,
          contributors: updatedContributors,
          status: t.status === "ASSIGNED" ? "IN_PROGRESS" : t.status
        };
      })
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
    pushInAppNotification({
      title: `🚨 Stop-the-line : Blocage déclaré sur ${blockingTicket.reference}`,
      message: `${currentUser?.name || "Un développeur"} a signalé un blocage : « ${blockerReasonText} »`,
      category: "BLOCKER",
      targetRoles: ["HEAD", "CONSULTANT"],
      ticketId: blockingTicket.id,
      ticketReference: blockingTicket.reference,
      actorName: currentUser?.name || "Développeur SAP"
    });
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
    const target = tickets.find((t) => t.id === ticketId);
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? { ...t, status: "DELIVERED", remainingHours: 0 }
          : t
      )
    );
    if (target) {
      pushInAppNotification({
        title: `📦 Ticket ${target.reference} livré pour recette`,
        message: `${currentUser?.name || "Le développeur"} a terminé le développement de « ${target.title} ». En attente de validation Aliko.`,
        category: "DELIVERY",
        targetRoles: ["HEAD", "CONSULTANT"],
        ticketId: target.id,
        ticketReference: target.reference,
        actorName: currentUser?.name || "Développeur SAP"
      });
    }
    showToast("Ticket marqué comme Livré (en attente recette Aliko)");
  };

  // Action Direction (Aliko HEAD) : Clôture définitive du ticket une fois réglé
  const handleCloseTicket = (ticketId: string) => {
    const target = tickets.find((t) => t.id === ticketId);
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? { ...t, status: "CLOSED", remainingHours: 0 }
          : t
      )
    );
    if (target) {
      pushInAppNotification({
        title: `✓ Clôture Définitive validée par Aliko (${target.reference})`,
        message: `Aliko Getheme a validé et clôturé définitivement le ticket « ${target.title} ».`,
        category: "CLOSURE",
        targetRoles: ["HEAD", "DEVELOPER", "CONSULTANT"],
        ticketId: target.id,
        ticketReference: target.reference,
        actorName: "Aliko Getheme"
      });
    }
    showToast("✓ Ticket validé et clôturé définitivement par Aliko — Statut : Réglé");
    setSupervisingTicket(null);
  };

  // Action Direction (Aliko HEAD) : Arbitrer et lever un blocage
  const handleUnblockByAliko = (ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? { ...t, status: "IN_PROGRESS", blockerReason: undefined }
          : t
      )
    );
    showToast("Arbitrage Direction effectué : Point de blocage levé par Aliko");
    if (supervisingTicket?.id === ticketId) {
      setSupervisingTicket((prev) => prev ? { ...prev, status: "IN_PROGRESS", blockerReason: undefined } : null);
    }
  };

  // Action Collaborative : Envoyer un message (+ pièce jointe optionnelle) dans le fil du ticket
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!discussingTicket || (!ticketMessageText.trim() && !selectedAttachmentTemplate && !customAttachmentName.trim()) || !currentUser) return;

    const isQuestion = currentUser.role === "DEVELOPER" && isQuestionBlocker;
    const isReply = currentUser.role === "CONSULTANT" && (discussingTicket.status === "BLOCKED" || !!discussingTicket.blockerReason);

    let msgAttachment: TicketAttachment | undefined = undefined;
    if (customAttachmentName.trim()) {
      const ext = customAttachmentName.trim().split(".").pop()?.toUpperCase() || "PDF";
      const fileType: TicketAttachment["fileType"] =
        ext === "XLSX" || ext === "XLS" || ext === "CSV"
          ? "XLSX"
          : ext === "SQL"
          ? "SQL"
          : ext === "PNG" || ext === "JPG"
          ? "PNG"
          : ext === "ZIP"
          ? "ZIP"
          : "PDF";
      msgAttachment = {
        id: `att-${Date.now()}`,
        fileName: customAttachmentName.trim(),
        fileSize: "410 Ko",
        fileType,
        uploadedBy: currentUser.name,
        uploadedRole: currentUser.role,
        uploadedAt: "À l'instant",
        scanStatus: "VERIFIED_CLEAN"
      };
    } else if (selectedAttachmentTemplate) {
      const tpl = SAP_ATTACHMENT_TEMPLATES.find((t) => t.fileName === selectedAttachmentTemplate);
      if (tpl) {
        msgAttachment = {
          id: `att-${Date.now()}`,
          fileName: tpl.fileName,
          fileSize: tpl.fileSize,
          fileType: tpl.fileType,
          uploadedBy: currentUser.name,
          uploadedRole: currentUser.role,
          uploadedAt: "À l'instant",
          scanStatus: "VERIFIED_CLEAN"
        };
      }
    }

    const newMsg: TicketMessage = {
      id: `msg-${Date.now()}`,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      authorEmail: currentUser.email,
      message: ticketMessageText.trim() || `Pièce jointe transmise : ${msgAttachment?.fileName}`,
      timestamp: "À l'instant",
      isBlockerQuestion: isQuestion,
      isConsultantReply: isReply,
      attachment: msgAttachment
    };

    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== discussingTicket.id) return t;

        let updatedStatus = t.status;
        let updatedBlockerReason = t.blockerReason;

        if (isQuestion) {
          updatedStatus = "BLOCKED";
          updatedBlockerReason = `En attente de précision métier de la part de ${t.applicantName || "la consultante"}`;
        } else if (currentUser.role === "CONSULTANT" && unblockOnReply && (t.status === "BLOCKED" || !!t.blockerReason)) {
          updatedStatus = "IN_PROGRESS";
          updatedBlockerReason = undefined;
        }

        const updatedMessages = [...(t.messages || []), newMsg];
        const updatedAttachments = msgAttachment
          ? [...(t.attachments || []), msgAttachment]
          : t.attachments;

        return {
          ...t,
          status: updatedStatus,
          blockerReason: updatedBlockerReason,
          messages: updatedMessages,
          attachments: updatedAttachments
        };
      })
    );

    // Mettre à jour l'instance locale en cours de consultation
    setDiscussingTicket((prev) => {
      if (!prev) return null;
      let updatedStatus = prev.status;
      let updatedBlockerReason = prev.blockerReason;
      if (isQuestion) {
        updatedStatus = "BLOCKED";
        updatedBlockerReason = `En attente de précision métier de la part de ${prev.applicantName || "la consultante"}`;
      } else if (currentUser.role === "CONSULTANT" && unblockOnReply && (prev.status === "BLOCKED" || !!prev.blockerReason)) {
        updatedStatus = "IN_PROGRESS";
        updatedBlockerReason = undefined;
      }
      return {
        ...prev,
        status: updatedStatus,
        blockerReason: updatedBlockerReason,
        messages: [...(prev.messages || []), newMsg],
        attachments: msgAttachment ? [...(prev.attachments || []), msgAttachment] : prev.attachments
      };
    });

    if (supervisingTicket?.id === discussingTicket.id) {
      setSupervisingTicket((prev) => {
        if (!prev) return null;
        let updatedStatus = prev.status;
        let updatedBlockerReason = prev.blockerReason;
        if (isQuestion) {
          updatedStatus = "BLOCKED";
          updatedBlockerReason = `En attente de précision métier de la part de ${prev.applicantName || "la consultante"}`;
        } else if (currentUser.role === "CONSULTANT" && unblockOnReply && (prev.status === "BLOCKED" || !!prev.blockerReason)) {
          updatedStatus = "IN_PROGRESS";
          updatedBlockerReason = undefined;
        }
        return {
          ...prev,
          status: updatedStatus,
          blockerReason: updatedBlockerReason,
          messages: [...(prev.messages || []), newMsg],
          attachments: msgAttachment ? [...(prev.attachments || []), msgAttachment] : prev.attachments
        };
      });
    }

    // Générer une notification temps réel in-app
    pushInAppNotification({
      title: isQuestion
        ? `🚨 Question bloquante sur ${discussingTicket.reference}`
        : isReply && unblockOnReply
        ? `✓ Ticket ${discussingTicket.reference} débloqué par ${currentUser.name}`
        : `💬 Nouveau message${msgAttachment ? " + Pièce jointe" : ""} sur ${discussingTicket.reference}`,
      message: `${currentUser.name} : « ${newMsg.message.slice(0, 90)} »${msgAttachment ? ` [📎 ${msgAttachment.fileName}]` : ""}`,
      category: isQuestion ? "BLOCKER" : "MESSAGE",
      targetRoles: ["HEAD", "DEVELOPER", "CONSULTANT"],
      ticketId: discussingTicket.id,
      ticketReference: discussingTicket.reference,
      actorName: currentUser.name
    });

    if (isQuestion) {
      showToast(`Question transmise au consultant — Ticket marqué en attente d'information`);
    } else if (isReply && unblockOnReply) {
      showToast(`Précision transmise au développeur — Point de blocage levé & développement repris !`);
    } else if (msgAttachment) {
      showToast(`Message et pièce jointe (${msgAttachment.fileName}) transmis avec succès`);
    } else {
      showToast(`Message transmis avec succès dans le fil du ticket`);
    }

    setTicketMessageText("");
    setIsQuestionBlocker(false);
    setSelectedAttachmentTemplate("");
    setCustomAttachmentName("");
  };

  // Action HEAD / CONSULTANT : Créer un ticket (Flux 100% interne à l'application, Aliko point central)
  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast("Veuillez renseigner le titre de la demande");
      return;
    }
    if (!newDesc.trim()) {
      showToast("La description détaillée est obligatoire pour soumettre un ticket");
      return;
    }

    const refCode = `ADD-2026-${String(tickets.length + 1).padStart(4, "0")}`;
    const initialAttachment: TicketAttachment[] | undefined = newTicketAttachmentName.trim()
      ? [
          {
            id: `att-init-${Date.now()}`,
            fileName: newTicketAttachmentName.trim(),
            fileSize: "520 Ko",
            fileType: "PDF",
            uploadedBy: currentUser?.name || "Mélissa Diakité",
            uploadedRole: currentUser?.role || "CONSULTANT",
            uploadedAt: "À l'instant",
            scanStatus: "VERIFIED_CLEAN"
          }
        ]
      : undefined;

    // L'estimation de la charge est une prérogative exclusive d'Aliko (HEAD) ; pour les consultants, elle démarre à 0 (en attente d'estimation par Aliko)
    const isHead = currentUser?.role === "HEAD";
    const initialHours = isHead ? (Number(newHours) || 16) : 0;

    const newTicket: Ticket = {
      id: `tix-${Date.now()}`,
      reference: refCode,
      title: newTitle.trim(),
      description: newDesc.trim(),
      status: "RECEIVED",
      typeCode: newType,
      priorityCode: newPriority,
      estimatedHours: initialHours,
      remainingHours: initialHours,
      clientCompany: newClient.trim() || "Safir Consulting",
      applicantName: newApplicant.trim() || (currentUser ? currentUser.name : "Aliko Getheme"),
      applicantEmail: currentUser?.email || "aliko.getheme@safirconsulting.net",
      currency: newCurrency || "XOF",
      assignedDeveloper: null,
      createdAt: new Date().toISOString().split("T")[0],
      attachments: initialAttachment
    };

    setTickets([newTicket, ...tickets]);

    // Si la demande est émise par un consultant, elle alimente automatiquement le Guichet Central d'Aliko
    if (currentUser?.role === "CONSULTANT") {
      setEmails((prev) => [
        {
          id: `demand-${Date.now()}`,
          senderName: currentUser.name,
          senderEmail: currentUser.email,
          senderKind: "CONSULTANT",
          isPersonalDomain: false,
          subject: newTitle,
          bodyPreview: newDesc,
          receivedAt: "À l'instant",
          processingStatus: "QUALIFIED_IN_APP",
          ticket: { reference: refCode, title: newTitle }
        },
        ...prev
      ]);
    }

    const hoursLabel = isHead ? `${newTicket.estimatedHours}h` : "Charge à estimer par Aliko";
    pushInAppNotification({
      title: `📥 Nouveau besoin SAP enregistré (${refCode})`,
      message: `${newTicket.applicantName} a soumis « ${newTitle} » (${hoursLabel} — ${newTicket.currency}) au Guichet Central d'Aliko.`,
      category: "DEMAND",
      targetRoles: ["HEAD", "CONSULTANT"],
      ticketId: newTicket.id,
      ticketReference: refCode,
      actorName: newTicket.applicantName || "Aliko Getheme"
    });

    setShowCreateModal(false);
    setNewTitle("");
    setNewDesc("");
    setNewTicketAttachmentName("");
    showToast(
      isHead
        ? "Nouveau ticket enregistré avec estimation validée par Aliko"
        : "Demande transmise avec succès au Guichet Central d'Aliko pour estimation et qualification"
    );
  };

  // Action HEAD : Intégrer un nouveau Développeur dans l'équipe
  const handleAddDeveloper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDevFirstName.trim() || !newDevLastName.trim() || !newDevEmail.trim()) {
      showToast("Veuillez renseigner le prénom, nom et e-mail");
      return;
    }

    const capacity = Number(newDevHours) || 40;
    const newDevObj: Developer = {
      id: `dev-${Date.now()}`,
      name: `${newDevFirstName.trim()} ${newDevLastName.trim()}`,
      email: newDevEmail.trim().toLowerCase(),
      jobTitle: newDevJobTitle.trim(),
      netWeeklyHours: capacity,
      reservedHours: 0,
      freeHours: capacity,
      loadPercentage: 0,
      skills: [
        {
          id: `sk-${Date.now()}`,
          name: newDevSkillName,
          category: newDevSkillCategory,
          level: Number(newDevSkillLevel),
        },
      ],
    };

    try {
      await fetch(`${API_BASE}/developers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: newDevFirstName.trim(),
          lastName: newDevLastName.trim(),
          email: newDevEmail.trim().toLowerCase(),
          jobTitle: newDevJobTitle.trim(),
          weeklyCapacityHours: capacity,
        }),
      });
    } catch {
      // Mode local connecté
    }

    const newAuthUser: AuthUser = {
      id: `user-dev-${Date.now()}`,
      name: newDevObj.name,
      email: newDevObj.email,
      role: "DEVELOPER",
      roleLabel: newDevObj.jobTitle,
      developerId: newDevObj.id,
      initials: `${newDevFirstName[0]}${newDevLastName[0]}`.toUpperCase(),
    };

    setDevelopers((prev) => [...prev, newDevObj]);
    setSystemUsers((prev) => [...prev, newAuthUser]);
    setShowAddDevModal(false);
    setNewDevFirstName("");
    setNewDevLastName("");
    setNewDevEmail("");
    showToast(`Développeur ${newDevObj.name} intégré avec succès dans l'équipe Safir !`);
  };

  // Action HEAD : Intégrer un nouveau Consultant avec identifiants (Login/Password)
  const handleAddConsultant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConsultantFirstName.trim() || !newConsultantLastName.trim() || !newConsultantEmail.trim()) {
      showToast("Veuillez renseigner le prénom, nom et l'e-mail professionnel");
      return;
    }

    const emailLower = newConsultantEmail.trim().toLowerCase();
    const fullName = `${newConsultantFirstName.trim()} ${newConsultantLastName.trim()}`;
    const initialPass = newConsultantPassword.trim() || "Safir2026!Consultant";

    const newConsultantObj: ConsultantProfile = {
      id: `consultant-${Date.now()}`,
      name: fullName,
      email: emailLower,
      organization: newConsultantOrg.trim() || "Safir Consulting",
      speciality: newConsultantSpeciality.trim(),
      demandsCount: 0,
    };

    const newAuthUser: AuthUser = {
      id: `user-${Date.now()}`,
      name: fullName,
      email: emailLower,
      role: "CONSULTANT",
      roleLabel: newConsultantSpeciality.trim(),
      initials: `${newConsultantFirstName[0]}${newConsultantLastName[0]}`.toUpperCase(),
    };

    try {
      await fetch(`${API_BASE}/consultants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: newConsultantFirstName.trim(),
          lastName: newConsultantLastName.trim(),
          email: emailLower,
          organization: newConsultantOrg.trim(),
          passwordPlain: initialPass,
        }),
      });
    } catch {
      // Mode local connecté
    }

    setConsultants((prev) => [...prev, newConsultantObj]);
    setSystemUsers((prev) => [...prev, newAuthUser]);
    setShowAddConsultantModal(false);
    setNewConsultantFirstName("");
    setNewConsultantLastName("");
    setNewConsultantEmail("");
    setNewConsultantPassword("Safir2026!Consultant");
    showToast(`Compte Consultant créé ! Login : ${emailLower} | Mot de passe : ${initialPass}`);
  };

  // Action HEAD : Affecter développeur (Support Mono-développeur ou Équipe Multi-développeurs par lot)
  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningTicket || !selectedDevId) return;

    const dev = developers.find((d) => d.id === selectedDevId);
    if (!dev) return;

    const leadLotObj = TECHNICAL_LOT_ROLES.find((r) => r.value === leadLotRole);
    const coLotObj = TECHNICAL_LOT_ROLES.find((r) => r.value === coDevLotRole);
    const coDev = isMultiDevAssignment && coDevId ? developers.find((d) => d.id === coDevId) : null;

    const totalEstHours = isMultiDevAssignment && coDev
      ? Number(leadHours) + Number(coDevHours)
      : (Number(assigningHours) || assigningTicket.estimatedHours || 16);

    const contributorsList: TicketLotContributor[] | undefined = isMultiDevAssignment && coDev
      ? [
          {
            id: `contrib-${Date.now()}-1`,
            developerId: dev.id,
            developerName: dev.name,
            developerEmail: dev.email,
            lotRole: leadLotRole,
            lotLabel: leadLotObj?.label || "Lead Développeur SAP",
            estimatedHours: Number(leadHours) || 14,
            remainingHours: Number(leadHours) || 14,
            status: "IN_PROGRESS"
          },
          {
            id: `contrib-${Date.now()}-2`,
            developerId: coDev.id,
            developerName: coDev.name,
            developerEmail: coDev.email,
            lotRole: coDevLotRole,
            lotLabel: coLotObj?.label || "Spécialiste Brique SAP",
            estimatedHours: Number(coDevHours) || 10,
            remainingHours: Number(coDevHours) || 10,
            status: "IN_PROGRESS"
          }
        ]
      : undefined;

    const leadSkillMatched = checkDeveloperSkillMatch(dev, assigningTicket.typeCode);
    const isOverride = !leadSkillMatched;

    setTickets((prev) =>
      prev.map((t) =>
        t.id === assigningTicket.id
          ? {
              ...t,
              status: "ASSIGNED",
              estimatedHours: totalEstHours,
              remainingHours: totalEstHours,
              currency: assigningCurrency,
              assignedDeveloper: { id: dev.id, name: dev.name, email: dev.email },
              contributors: contributorsList,
              isSkillOverride: isOverride,
              overrideReason: isOverride
                ? "Montée en compétences encadrée validée par Aliko Getheme (Responsable BU)"
                : undefined
            }
          : t
      )
    );

    // Mettre à jour la capacité réservée des développeurs
    setDevelopers((prev) =>
      prev.map((d) => {
        if (d.id === dev.id) {
          const addedHours = isMultiDevAssignment && coDev ? Number(leadHours) : totalEstHours;
          const newRes = d.reservedHours + addedHours;
          return {
            ...d,
            reservedHours: newRes,
            freeHours: Math.max(0, d.freeHours - addedHours),
            loadPercentage: Math.min(100, Math.round((newRes / d.netWeeklyHours) * 100))
          };
        }
        if (coDev && d.id === coDev.id) {
          const addedHours = Number(coDevHours);
          const newRes = d.reservedHours + addedHours;
          return {
            ...d,
            reservedHours: newRes,
            freeHours: Math.max(0, d.freeHours - addedHours),
            loadPercentage: Math.min(100, Math.round((newRes / d.netWeeklyHours) * 100))
          };
        }
        return d;
      })
    );

    if (isMultiDevAssignment && coDev) {
      pushInAppNotification({
        title: `👥 Affectation Multi-Développeurs (${assigningTicket.reference})`,
        message: `Aliko Getheme a affecté le projet à ${dev.name} (${leadHours}h) et ${coDev.name} (${coDevHours}h)${isOverride ? " avec montée en compétences encadrée" : ""}.`,
        category: "ASSIGNMENT",
        targetRoles: ["HEAD", "DEVELOPER", "CONSULTANT"],
        ticketId: assigningTicket.id,
        ticketReference: assigningTicket.reference,
        actorName: "Aliko Getheme"
      });
      showToast(`Projet ${assigningTicket.reference} affecté à l'équipe : ${dev.name} + ${coDev.name}${isOverride ? " (Montée en compétences)" : ""}`);
    } else {
      pushInAppNotification({
        title: isOverride
          ? `🎓 Affectation & Montée en compétences (${assigningTicket.reference})`
          : `⚡ Nouvelle affectation sur ${assigningTicket.reference}`,
        message: isOverride
          ? `Aliko Getheme a affecté le ticket « ${assigningTicket.title} » à ${dev.name} en montée en compétences encadrée (validation dérogatoire accordée).`
          : `Aliko Getheme a affecté le ticket « ${assigningTicket.title} » à ${dev.name}.`,
        category: "ASSIGNMENT",
        targetRoles: ["HEAD", "DEVELOPER", "CONSULTANT"],
        ticketId: assigningTicket.id,
        ticketReference: assigningTicket.reference,
        actorName: "Aliko Getheme"
      });
      showToast(`Ticket ${assigningTicket.reference} affecté à ${dev.name}${isOverride ? " (Montée en compétences validée par Aliko)" : ""}`);
    }

    setAssigningTicket(null);
    setSelectedDevId("");
    setIsMultiDevAssignment(false);
    setCoDevId("");
  };

  // Calcul de la progression visuelle du ticket jusqu'à résolution complète
  const getTicketProgress = (ticket: Ticket) => {
    if (ticket.status === "CLOSED") {
      return { pct: 100, label: "✓ Réglé & Clôturé", barClass: "bg-emerald-600", badgeClass: "text-emerald-700 bg-emerald-50 border-emerald-300" };
    }
    if (ticket.status === "DELIVERED") {
      return { pct: 100, label: "📦 Livré (À valider)", barClass: "bg-teal-500", badgeClass: "text-teal-700 bg-teal-50 border-teal-300" };
    }
    if (ticket.status === "BLOCKED") {
      const est = ticket.estimatedHours || 1;
      const rem = ticket.remainingHours !== undefined ? ticket.remainingHours : est;
      const done = Math.max(0, Math.min(est, est - rem));
      const pct = Math.min(95, Math.max(10, Math.round((done / est) * 100)));
      return { pct, label: `🚨 Bloqué (${pct}%)`, barClass: "bg-rose-500", badgeClass: "text-rose-700 bg-rose-50 border-rose-300" };
    }
    if (ticket.status === "IN_PROGRESS") {
      const est = ticket.estimatedHours || 1;
      const rem = ticket.remainingHours !== undefined ? ticket.remainingHours : est;
      const done = Math.max(0, Math.min(est, est - rem));
      const pct = Math.min(95, Math.max(15, Math.round((done / est) * 100)));
      return { pct, label: `⚡ En cours (${pct}%)`, barClass: "bg-sky-600", badgeClass: "text-sky-700 bg-sky-50 border-sky-300" };
    }
    if (ticket.status === "ASSIGNED") {
      return { pct: 10, label: "Affecté (Démarrage)", barClass: "bg-blue-400", badgeClass: "text-blue-700 bg-blue-50 border-blue-200" };
    }
    if (ticket.status === "QUALIFIED") {
      return { pct: 5, label: "Qualifié", barClass: "bg-slate-300", badgeClass: "text-slate-600 bg-slate-100 border-slate-200" };
    }
    return { pct: 0, label: "Reçu", barClass: "bg-slate-200", badgeClass: "text-slate-500 bg-slate-50 border-slate-200" };
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
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-300">📦 Livré (Recette)</span>;
      case "CLOSED":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-400">✓ Réglé & Clôturé</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  // =========================================================================
  // ÉCRAN DE CONNEXION INITIAL (PAR DÉFAUT POUR TOUT UTILISATEUR NON AUTHENTIFIÉ)
  // =========================================================================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 flex flex-col justify-between text-slate-100 font-sans">
        {/* Toast Notification sur l'écran de Login */}
        {toastMessage && (
          <div className="fixed bottom-4 right-4 z-50 bg-sky-700 text-white px-4 py-2.5 rounded-xl shadow-xl text-sm flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle2 className="w-4 h-4 text-sky-200" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* En-tête simplifié */}
        <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur-md px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-sky-900/40">
                S
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-base tracking-tight">Safir Consulting</span>
                  <span className="text-sky-400">|</span>
                  <span className="font-medium text-sky-200 text-sm">Ticket Manager</span>
                </div>
                <p className="text-xs text-slate-400">Business Unit SME — Pilotage Développements SAP</p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-300 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700/80 shadow-sm">
              <Shield className="w-3.5 h-3.5 text-sky-400" />
              <span>Authentification Sécurisée (Argon2id & RBAC)</span>
            </div>
          </div>
        </header>

        {/* Corps central : Formulaire de Connexion & Accès Démo Rapide */}
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
          <div className="w-full max-w-lg space-y-5">
            <div className="bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-sky-900 p-6 text-white text-center relative overflow-hidden">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md text-sky-300 mb-3 border border-white/15">
                  <Lock className="w-6 h-6" />
                </div>
                <h1 className="text-xl font-bold tracking-tight">Connexion à votre Espace</h1>
                <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto">
                  Identifiez-vous avec votre adresse e-mail professionnelle pour accéder à votre portail dédié.
                </p>
              </div>

              <div className="p-6 sm:p-8 space-y-6">
                {loginError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5 animate-in fade-in">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Erreur d'authentification : </span>
                      {loginError}
                    </div>
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Adresse e-mail professionnelle (Login)
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="ex : aliko.getheme@safirconsulting.net"
                        className="w-full text-sm pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700">
                        Mot de passe
                      </label>
                      <span className="text-[11px] text-slate-400">Chiffré via Argon2id</span>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full text-sm pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-sky-700 hover:bg-sky-800 active:bg-sky-900 text-white font-semibold text-sm rounded-xl shadow-md shadow-sky-900/20 transition-all flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    <span>Se connecter à mon portail</span>
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </button>
                </form>

                {/* Section Accès Rapide Démo 1-Clic */}
                <div className="pt-5 border-t border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3 text-center">
                    Accès direct corporate & démo (1-clic)
                  </div>

                  <div className="space-y-2">
                    {/* Aliko - HEAD */}
                    <button
                      type="button"
                      onClick={() => {
                        const aliko = systemUsers.find((u) => u.role === "HEAD") || systemUsers[0];
                        setCurrentUser(aliko);
                        showToast(`Bienvenue, ${aliko.name} (Portail Direction)`);
                      }}
                      className="w-full p-2.5 rounded-xl border border-sky-100 bg-sky-50/70 hover:bg-sky-100 transition-colors flex items-center justify-between text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-sky-700 text-white font-bold text-xs flex items-center justify-center">
                          AG
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-900 group-hover:text-sky-900">Aliko Getheme</div>
                          <div className="text-[10px] text-slate-500">Direction BU SME — Arbitrage & Capacité</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-sky-200/80 text-sky-900">
                        Portail Direction (HEAD)
                      </span>
                    </button>

                    {/* Anoop - DEVELOPER */}
                    <button
                      type="button"
                      onClick={() => {
                        const anoop = systemUsers.find((u) => u.email.includes("anoop")) || systemUsers[1];
                        setCurrentUser(anoop);
                        showToast(`Bienvenue, ${anoop.name} (Espace Développeur)`);
                      }}
                      className="w-full p-2.5 rounded-xl border border-emerald-100 bg-emerald-50/70 hover:bg-emerald-100 transition-colors flex items-center justify-between text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white font-bold text-xs flex items-center justify-center">
                          AP
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-900 group-hover:text-emerald-900">Anoop Pandimukkula</div>
                          <div className="text-[10px] text-slate-500">Développeur SAP Business One Senior</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-200/80 text-emerald-900">
                        Portail Développeur
                      </span>
                    </button>

                    {/* Mélissa - CONSULTANT */}
                    <button
                      type="button"
                      onClick={() => {
                        const melissa = systemUsers.find((u) => u.role === "CONSULTANT") || systemUsers[4];
                        setCurrentUser(melissa);
                        showToast(`Bienvenue, ${melissa.name} (Espace Consultante)`);
                      }}
                      className="w-full p-2.5 rounded-xl border border-purple-100 bg-purple-50/70 hover:bg-purple-100 transition-colors flex items-center justify-between text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-700 text-white font-bold text-xs flex items-center justify-center">
                          MD
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-900 group-hover:text-purple-900">Mélissa Diakité</div>
                          <div className="text-[10px] text-slate-500">Consultante Fonctionnelle SAP</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-purple-200/80 text-purple-900">
                        Portail Consultante
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Note de sécurité */}
            <div className="text-center text-[11px] text-slate-400 space-y-1">
              <p>Plateforme interne Safir Consulting — Tous droits réservés 2026</p>
              <p className="text-slate-500">Cloisonnement strict RBAC • Chiffrement Argon2id • Conforme OWASP Top 10</p>
            </div>
          </div>
        </main>

        <footer className="py-4 border-t border-slate-800 text-center text-xs text-slate-500">
          Safir Consulting © 2026 | Ticket Manager SAP
        </footer>
      </div>
    );
  }

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
                        <span>Équipe & Capacité ({developers.length})</span>
                      </button>
                      <button
                        onClick={() => setActiveTab("inbox")}
                        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                          activeTab === "inbox"
                            ? "bg-slate-100 text-sky-800 font-semibold"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                        }`}
                      >
                        <span>Guichet Central Demandes</span>
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
                      <Layers className="w-4 h-4 text-purple-600" />
                      <span>Mes Demandes Émises ({myConsultantDemands.length})</span>
                    </button>
                  )}
                </nav>
              )}
            </div>

            {/* Droite : Boutons d'action, Notifications Temps Réel et Sélecteur de Rôle RBAC */}
            <div className="flex items-center gap-2.5">
              {currentUser?.role === "HEAD" && (
                <>
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                    title="Exporter le Reporting Hebdomadaire Direction (Excel/CSV & Synthèse)"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                    <span className="hidden xl:inline">Exporter Rapport</span>
                  </button>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white text-xs font-medium rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nouveau ticket</span>
                  </button>
                </>
              )}

              {/* SÉLECTEUR MULTI-DEVISES (AFRIQUE DE L'OUEST FCFA PAR DÉFAUT + EUR / USD) */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs" title="Devise de valorisation (FCFA Afrique de l'Ouest / Multi-devises)">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Devise :</span>
                <select
                  value={activeCurrency}
                  onChange={(e) => {
                    const c = e.target.value as "XOF" | "EUR" | "USD";
                    setActiveCurrency(c);
                    showToast(c === "XOF" ? "Devise activée : FCFA (XOF — Afrique de l'Ouest)" : `Devise activée : ${c}`);
                  }}
                  className="bg-transparent font-semibold text-slate-800 text-xs cursor-pointer focus:outline-none"
                >
                  <option value="XOF">FCFA (XOF - Afrique de l'Ouest)</option>
                  <option value="EUR">Euro (€ - International)</option>
                  <option value="USD">Dollar ($ - International)</option>
                </select>
              </div>

              {/* CLOCHE DE NOTIFICATIONS TEMPS RÉEL IN-APP */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowNotificationsPanel(!showNotificationsPanel);
                    setShowUserMenu(false);
                  }}
                  aria-label="Notifications In-App"
                  className="relative p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
                  title="Centre de Notifications Temps Réel In-App"
                >
                  <Bell className={`w-4 h-4 ${unreadNotificationsCount > 0 ? "text-amber-600" : "text-slate-500"}`} />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center shadow-sm animate-pulse">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </button>

                {showNotificationsPanel && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in">
                    <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold tracking-wide">Notifications Temps Réel In-App</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-white/15 text-[10px] font-mono">
                          {unreadNotificationsCount} non lues
                        </span>
                      </div>
                      {unreadNotificationsCount > 0 && (
                        <button
                          type="button"
                          onClick={markAllNotificationsRead}
                          className="text-[11px] text-sky-300 hover:text-white underline cursor-pointer"
                        >
                          Tout marquer lu
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {myNotifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400">
                          Aucune notification pour votre espace.
                        </div>
                      ) : (
                        myNotifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              setNotifications((prev) =>
                                prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
                              );
                              if (n.ticketId) {
                                const found = tickets.find((t) => t.id === n.ticketId);
                                if (found) {
                                  if (currentUser?.role === "HEAD") {
                                    setSupervisingTicket(found);
                                  } else {
                                    setDiscussingTicket(found);
                                  }
                                }
                              }
                              setShowNotificationsPanel(false);
                            }}
                            className={`p-3 text-xs hover:bg-slate-50 transition-colors cursor-pointer ${
                              !n.read ? "bg-sky-50/50 border-l-4 border-l-sky-600" : ""
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="font-bold text-slate-900 line-clamp-1">{n.title}</span>
                              <span className="text-[10px] text-slate-400 shrink-0">{n.createdAt}</span>
                            </div>
                            <p className="text-slate-600 text-[11px] leading-relaxed">{n.message}</p>
                            <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-500">
                              <span>Acteur : <strong className="text-slate-700">{n.actorName}</strong></span>
                              {n.ticketReference && (
                                <span className="font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-800 border border-slate-200">
                                  {n.ticketReference}
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

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
                      {systemUsers.map((user) => (
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

              {/* Bouton Déconnexion Directe */}
              <button
                onClick={() => {
                  setCurrentUser(null);
                  showToast("Déconnexion réussie — Retour à la page de connexion");
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                title="Déconnexion immédiate"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-600" />
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
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
                  {myAssignedTickets.map((ticket) => {
                    const myContributorLot = ticket.contributors?.find(
                      (c) =>
                        c.developerId === currentUser.developerId ||
                        c.developerEmail.toLowerCase() === currentUser.email.toLowerCase()
                    );
                    const otherContributors = ticket.contributors?.filter(
                      (c) => c.id !== myContributorLot?.id
                    );

                    return (
                      <div key={ticket.id} className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-2 flex-1 max-w-2xl">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-slate-900 text-sm">{ticket.reference}</span>
                            <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-100 text-slate-700">
                              {ticket.typeCode}
                            </span>
                            {renderStatusBadge(ticket.status)}
                            {ticket.contributors && ticket.contributors.length > 1 && (
                              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                👥 Multi-Développeurs ({ticket.contributors.length} lots)
                              </span>
                            )}
                          </div>

                          <div className="font-semibold text-slate-900 text-sm">{ticket.title}</div>
                          {ticket.description && (
                            <p className="text-xs text-slate-600">{ticket.description}</p>
                          )}

                          {/* Cartouche Brique / Lot attribué au développeur connecté */}
                          {myContributorLot && (
                            <div className="p-2.5 rounded-lg bg-indigo-50/80 border border-indigo-200 text-xs text-indigo-950 space-y-1">
                              <div className="flex items-center justify-between flex-wrap gap-1">
                                <span className="font-bold flex items-center gap-1.5">
                                  <span className="px-1.5 py-0.5 rounded bg-indigo-200 text-indigo-950 text-[10px] font-mono font-bold uppercase">
                                    Votre Brique SAP
                                  </span>
                                  <span>{myContributorLot.lotLabel}</span>
                                </span>
                                <span className="font-mono font-bold text-indigo-900 bg-white px-2 py-0.5 rounded border border-indigo-200">
                                  RAF Lot : {myContributorLot.remainingHours} h / {myContributorLot.estimatedHours} h
                                </span>
                              </div>
                              {otherContributors && otherContributors.length > 0 && (
                                <div className="text-[11px] text-indigo-700 flex items-center gap-1 pt-0.5">
                                  <span>Co-développeur(s) sur ce projet :</span>
                                  <strong className="text-indigo-950">
                                    {otherContributors.map((c) => `${c.developerName} (${c.lotLabel.split(" ")[0]})`).join(", ")}
                                  </strong>
                                </div>
                              )}
                            </div>
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

                          <div className="text-xs text-slate-500 flex items-center gap-4 pt-1 flex-wrap">
                            <span>Demandeur : <strong className="text-slate-700">{ticket.applicantName}</strong></span>
                            <span>Client : <strong className="text-slate-700">{ticket.clientCompany}</strong></span>
                            <span>Charge totale : <strong className="text-slate-700">{ticket.estimatedHours} h</strong></span>
                            <span>RAF global : <strong className="text-sky-700">{ticket.remainingHours ?? ticket.estimatedHours} h</strong></span>
                          </div>
                        </div>

                        {/* Actions Développeur */}
                        <div className="flex items-center gap-2 flex-wrap md:flex-nowrap shrink-0">
                          <button
                            onClick={() => {
                              setEditingRafTicket(ticket);
                              const myLot = ticket.contributors?.find(
                                (c) =>
                                  c.developerId === currentUser.developerId ||
                                  c.developerEmail.toLowerCase() === currentUser.email.toLowerCase()
                              );
                              setNewRemainingHours(myLot ? myLot.remainingHours : (ticket.remainingHours ?? ticket.estimatedHours));
                            }}
                            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 cursor-pointer"
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
                            className="px-3 py-1.5 text-xs font-medium text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors cursor-pointer"
                          >
                            Marquer comme Livré
                          </button>
                        )}

                        <button
                          onClick={() => setDiscussingTicket(ticket)}
                          className="px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200 flex items-center gap-1.5 cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                          <span>Échanger avec {ticket.applicantName?.split(" ")[0] || "Consultant"} ({ticket.messages?.length || 0})</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
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
            {/* Bannière de Bienvenue Consultante */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-slate-900">Espace Consulting SAP — {currentUser.name}</h1>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                    Accès CONSULTANT
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Suivez en direct l'avancement technique de vos besoins SAP, découvrez vos développeurs dédiés et échangez directement avec eux.
                </p>
              </div>

              <button
                onClick={() => {
                  setNewApplicant(currentUser.name);
                  setNewClient("Safir Consulting (Consulting Interne)");
                  setShowCreateModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-medium rounded-lg shadow-sm cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Soumettre un nouveau besoin SAP</span>
              </button>
            </div>

            {/* Bannière d'Alerte : Précision requise pour débloquer un ticket */}
            {myConsultantDemands.some((t) => t.status === "BLOCKED") && (
              <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 border border-amber-300 rounded-xl p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg text-amber-700 shrink-0">
                    <AlertTriangle className="w-5 h-5 text-amber-600 animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                        Point de Vigilance — Précision Métier Attendue par l'Équipe Technique
                      </span>
                    </div>
                    <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                      L'un de vos développeurs dédiés est actuellement en pause sur un ticket et attend des éléments fonctionnels ou un jeu d'écritures pour reprendre le travail.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {myConsultantDemands
                        .filter((t) => t.status === "BLOCKED")
                        .map((t) => (
                          <button
                            key={t.id}
                            onClick={() => setDiscussingTicket(t)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Répondre à {t.assignedDeveloper?.name || "l'équipe"} ({t.reference})</span>
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Liste des Demandes Émises avec Développeur Dédié et Progression */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Mes Demandes Émises ({myConsultantDemands.length})</h2>
                  <p className="text-xs text-slate-500">Transparence en direct : Développeur assigné, barre de progression et dialogue direct</p>
                </div>
              </div>

              {myConsultantDemands.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  Vous n'avez pas encore émis de demande de développement. Cliquez sur "Soumettre un nouveau besoin SAP".
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {myConsultantDemands.map((ticket) => (
                    <div key={ticket.id} className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                      <div className="space-y-3 flex-1 max-w-3xl">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-slate-900 text-sm">{ticket.reference}</span>
                          <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-100 text-slate-700">
                            {ticket.typeCode}
                          </span>
                          {renderStatusBadge(ticket.status)}
                        </div>

                        <div>
                          <h3 className="font-semibold text-slate-900 text-sm">{ticket.title}</h3>
                          {ticket.description && (
                            <p className="text-xs text-slate-600 mt-0.5">{ticket.description}</p>
                          )}
                        </div>

                        {/* Motif de blocage si présent */}
                        {ticket.status === "BLOCKED" && (
                          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <span className="font-bold">Développement en attente de précision : </span>
                              <span>{ticket.blockerReason || "Le développeur a besoin d'éléments complémentaires pour poursuivre."}</span>
                            </div>
                          </div>
                        )}

                        {/* Cartouche Développeur Dédié & Progression en temps réel */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          {/* 1. Développeur(s) en charge */}
                          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-800 font-bold flex items-center justify-center text-xs shrink-0 border border-sky-200">
                              {ticket.contributors && ticket.contributors.length > 1
                                ? "👥"
                                : ticket.assignedDeveloper
                                ? ticket.assignedDeveloper.name.split(" ").map((n) => n[0]).join("")
                                : "?"}
                            </div>
                            <div className="min-w-0">
                              <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                                {ticket.contributors && ticket.contributors.length > 1
                                  ? `Équipe Multi-Développeurs (${ticket.contributors.length} briques)`
                                  : "Développeur Dédié"}
                              </div>
                              <div className="text-xs font-bold text-slate-900 truncate">
                                {ticket.contributors && ticket.contributors.length > 1
                                  ? ticket.contributors.map((c) => `${c.developerName.split(" ")[0]} (${c.lotLabel.split(" ")[0]})`).join(" + ")
                                  : ticket.assignedDeveloper
                                  ? ticket.assignedDeveloper.name
                                  : "En cours d'affectation par Aliko"}
                              </div>
                              <div className="text-[11px] text-slate-500 truncate">
                                {ticket.contributors && ticket.contributors.length > 1
                                  ? ticket.contributors.map((c) => c.developerEmail).join(", ")
                                  : ticket.assignedDeveloper?.email}
                              </div>
                            </div>
                          </div>

                          {/* 2. Progression en temps réel */}
                          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex flex-col justify-center">
                            <div className="flex items-center justify-between text-[11px] mb-1">
                              <span className="text-slate-500 font-medium">Progression</span>
                              <span className="font-bold text-slate-900 font-mono">{getTicketProgress(ticket).label}</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden border border-slate-200">
                              <div
                                className={`h-full transition-all duration-500 ${getTicketProgress(ticket).barClass}`}
                                style={{ width: `${getTicketProgress(ticket).pct}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                              <span>Charge : {ticket.estimatedHours > 0 ? `${ticket.estimatedHours} h` : "En attente d'estimation par Aliko"}</span>
                              <span>RAF : {ticket.estimatedHours > 0 ? `${ticket.remainingHours ?? ticket.estimatedHours} h` : "—"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Dernier échange si messages existants */}
                        {ticket.messages && ticket.messages.length > 0 && (
                          <div className="p-2.5 bg-purple-50/60 rounded-lg border border-purple-100 text-xs flex items-start gap-2">
                            <MessageSquare className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                            <div className="text-[11px] text-purple-900 leading-relaxed truncate">
                              <span className="font-semibold">{ticket.messages[ticket.messages.length - 1].authorName} : </span>
                              <span>{ticket.messages[ticket.messages.length - 1].message}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions Consultant */}
                      <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
                        <button
                          onClick={() => setDiscussingTicket(ticket)}
                          className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer ${
                            ticket.status === "BLOCKED"
                              ? "bg-rose-700 hover:bg-rose-800 text-white ring-2 ring-rose-400"
                              : "bg-purple-700 hover:bg-purple-800 text-white"
                          }`}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>
                            {ticket.status === "BLOCKED"
                              ? "Répondre & Débloquer"
                              : `Échanger avec ${ticket.assignedDeveloper ? ticket.assignedDeveloper.name.split(" ")[0] : "l'équipe"} (${ticket.messages?.length || 0})`}
                          </span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                  <span className="text-xs font-medium uppercase tracking-wider">Guichet Central Demandes</span>
                  <Inbox className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-2xl font-bold text-slate-900">{stats.pendingEmailsCount}</div>
                <p className="text-xs text-slate-500 mt-1">Demandes In-App soumises à qualifier par Aliko</p>
              </div>
            </div>

            {/* Barre de Pilotage Exécutif & Export Reporting Direction 1-Clic */}
            <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white p-4 rounded-xl shadow-sm border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-sky-500/20 rounded-xl border border-sky-400/30 text-sky-300">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-sky-300">
                    Gouvernance Centrale In-App — Point Focal Unique : Aliko Getheme
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    100% des flux (demandes consultants, arbitrages, affectations multi-lots, pièces jointes et clôtures) s'exécutent dans l'application.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleExportCsvReport}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Télécharger CSV / Excel</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowReportModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Synthèse Comité Direction</span>
                </button>
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
                        <th className="py-2.5 px-4">Progression</th>
                        <th className="py-2.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tickets.slice(0, 6).map((ticket) => {
                        const progress = getTicketProgress(ticket);
                        return (
                          <tr key={ticket.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4 font-mono font-medium text-slate-900">{ticket.reference}</td>
                            <td className="py-3 px-4 max-w-xs truncate font-medium text-slate-800" title={ticket.title}>
                              {ticket.title}
                            </td>
                            <td className="py-3 px-4 text-slate-600">{ticket.applicantName || "Client"}</td>
                            <td className="py-3 px-4">{renderStatusBadge(ticket.status)}</td>
                            <td className="py-3 px-4 text-slate-600">
                              {ticket.assignedDeveloper ? (
                                <div className="flex flex-col items-start gap-0.5">
                                  <span className="font-medium text-slate-900">{ticket.assignedDeveloper.name}</span>
                                  {ticket.isSkillOverride && (
                                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 font-medium" title={ticket.overrideReason || "Montée en compétences"}>
                                      <GraduationCap className="w-3 h-3 text-amber-600" />
                                      <span>Montée en compétences</span>
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">Non affecté</span>
                              )}
                            </td>
                            <td className="py-3 px-4 min-w-[130px]">
                              <div className="flex items-center justify-between text-[11px] mb-1">
                                <span className="font-medium text-slate-700">{progress.pct}%</span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium border ${progress.badgeClass}`}>
                                  {progress.label}
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full ${progress.barClass}`}
                                  style={{ width: `${progress.pct}%` }}
                                />
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                onClick={() => setSupervisingTicket(ticket)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded transition-colors cursor-pointer"
                                title="Oeil Direction : superviser la progression jusqu'à résolution"
                              >
                                <Eye className="w-3.5 h-3.5 text-sky-700" />
                                <span>Suivre</span>
                              </button>

                              {!ticket.assignedDeveloper ? (
                                <button
                                  onClick={() => openAssignModal(ticket)}
                                  className="text-xs text-sky-700 hover:text-sky-900 font-medium underline"
                                >
                                  Affecter
                                </button>
                              ) : (
                                <button
                                  onClick={() => openAssignModal(ticket)}
                                  className="text-xs text-slate-500 hover:text-slate-800 font-medium underline"
                                >
                                  Réaffecter
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
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
                    <th className="py-3 px-4 min-w-[140px]">Progression</th>
                    <th className="py-3 px-4 text-center">RAF</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTickets.map((ticket) => {
                    const progress = getTicketProgress(ticket);
                    return (
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
                              {ticket.isSkillOverride && (
                                <div className="mt-1">
                                  <span className="inline-flex items-center gap-1 text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 font-medium" title={ticket.overrideReason || "Montée en compétences"}>
                                    <GraduationCap className="w-3 h-3 text-amber-600" />
                                    <span>Montée en compétences</span>
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">En attente</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="font-semibold text-slate-700">{progress.pct}%</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium border ${progress.badgeClass}`}>
                              {progress.label}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full ${progress.barClass}`}
                              style={{ width: `${progress.pct}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-medium text-slate-700">
                          {ticket.remainingHours ?? ticket.estimatedHours} h
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => setSupervisingTicket(ticket)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded transition-colors cursor-pointer"
                            title="Oeil Direction : inspecter l'avancement complet du ticket"
                          >
                            <Eye className="w-3.5 h-3.5 text-sky-700" />
                            <span>Suivre</span>
                          </button>

                          <button
                            onClick={() => openAssignModal(ticket)}
                            className="px-2.5 py-1 text-xs font-medium text-white bg-sky-700 hover:bg-sky-800 rounded transition-colors"
                          >
                            {ticket.assignedDeveloper ? "Réaffecter" : "Affecter"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* VUE 5 : ÉQUIPE, CONSULTANTS & CAPACITÉ (Rôle HEAD)               */}
        {/* =============================================================== */}
        {currentUser?.role === "HEAD" && activeTab === "developers" && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Ressources & Gouvernance BU SME</h2>
                <p className="text-xs text-slate-500">Pilotage de la capacité Développeurs et des accès Consultants</p>
                
                {/* Sélecteur de sous-vue : Développeurs vs Consultants */}
                <div className="flex items-center gap-2 mt-2.5">
                  <button
                    onClick={() => setTeamSubTab("devs")}
                    className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                      teamSubTab === "devs"
                        ? "bg-sky-100 text-sky-800 font-semibold border border-sky-200"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <span>Développeurs SAP</span>
                    <span className="px-1.5 py-0.2 bg-white/80 rounded-full font-mono text-[10px]">
                      {developers.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setTeamSubTab("consultants")}
                    className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                      teamSubTab === "consultants"
                        ? "bg-purple-100 text-purple-800 font-semibold border border-purple-200"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <span>Consultants Fonctionnels</span>
                    <span className="px-1.5 py-0.2 bg-white/80 rounded-full font-mono text-[10px]">
                      {consultants.length}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setShowAddDevModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Développeur</span>
                </button>
                <button
                  onClick={() => setShowAddConsultantModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Consultant</span>
                </button>
              </div>
            </div>

            {/* GRILLE 1 : DÉVELOPPEURS */}
            {teamSubTab === "devs" && (
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
            )}

            {/* GRILLE 2 : CONSULTANTS FONCTIONNELS */}
            {teamSubTab === "consultants" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {consultants.map((c) => (
                  <div key={c.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-800 font-bold text-xs flex items-center justify-center border border-purple-200">
                            {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900 text-sm leading-tight">{c.name}</h3>
                            <p className="text-xs text-slate-500">{c.organization}</p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                          Consultant
                        </span>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 space-y-1 my-3">
                        <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                          <Key className="w-3 h-3 text-slate-400" />
                          <span>Identifiant de connexion (Login) :</span>
                        </div>
                        <div className="text-xs font-mono font-semibold text-slate-800 select-all">
                          {c.email}
                        </div>
                        <div className="text-[10px] text-emerald-700 font-medium flex items-center gap-1 pt-0.5">
                          <Check className="w-3 h-3" />
                          <span>Compte actif & accès portail validé</span>
                        </div>
                      </div>

                      <div className="space-y-1 text-xs">
                        <div className="text-slate-600">
                          Spécialité : <strong className="text-slate-800">{c.speciality}</strong>
                        </div>
                        <div className="text-slate-500">
                          Demandes émises actives : <span className="font-bold text-slate-800">{c.demandsCount}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">Rôle : CONSULTANT</span>
                      <button
                        onClick={() => {
                          const targetUser = systemUsers.find((u) => u.email.toLowerCase() === c.email.toLowerCase());
                          if (targetUser) {
                            switchUser(targetUser);
                          } else {
                            showToast(`Utilisateur ${c.name} sélectionné`);
                          }
                        }}
                        className="px-2.5 py-1 text-xs text-purple-700 hover:text-purple-900 hover:bg-purple-50 rounded font-semibold transition-colors border border-purple-200"
                      >
                        Tester session ➔
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =============================================================== */}
        {/* VUE 6 : GUICHET CENTRAL DE QUALIFICATION IN-APP (Rôle HEAD)      */}
        {/* =============================================================== */}
        {currentUser?.role === "HEAD" && activeTab === "inbox" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Guichet Central de Qualification des Demandes (Flux 100% In-App)
                </h2>
                <p className="text-xs text-slate-500">
                  Point central d'arbitrage : Aliko Getheme — Toutes les demandes soumises dans l'application convergent ici avant affectation aux développeurs.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Flux Central In-App Actif (Zéro E-mail Externe)
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
                          Consultante interne Safir (Portail In-App)
                        </span>
                      )}
                      {email.senderKind === "CLIENT_CONTACT" && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          Besoin Client Référencé
                        </span>
                      )}
                      {email.isPersonalDomain && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          Tiers externe / Vigilance Direction
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
                          setEmails((prev) =>
                            prev.map((m) => (m.id === email.id ? { ...m, processingStatus: "QUALIFIED_IN_APP" } : m))
                          );
                          setShowCreateModal(true);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white text-xs font-medium rounded-lg shadow-sm cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Qualifier en ticket SAP</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Ticket qualifié In-App
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

              {editingRafTicket.contributors && currentUser && (
                (() => {
                  const myLot = editingRafTicket.contributors.find(
                    (c) =>
                      c.developerId === currentUser.developerId ||
                      c.developerEmail.toLowerCase() === currentUser.email.toLowerCase()
                  );
                  return myLot ? (
                    <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-950 space-y-0.5">
                      <div className="font-bold flex items-center gap-1.5">
                        <span className="px-1.5 py-0.2 rounded bg-indigo-200 text-indigo-950 text-[10px] font-mono uppercase">
                          Votre Lot
                        </span>
                        <span>{myLot.lotLabel}</span>
                      </div>
                      <div className="text-[11px] text-indigo-700">
                        Charge initiale allouée : <strong>{myLot.estimatedHours} heures</strong>
                      </div>
                    </div>
                  ) : null;
                })()
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre d'heures restantes estimées (RAF) :
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

              {/* Type de besoin SAP & Priorité (Gestion dynamique Aliko) */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">Type de besoin SAP</label>
                      {currentUser?.role === "HEAD" && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setShowAddTypeInline(!showAddTypeInline)}
                            className="text-[11px] text-sky-700 hover:text-sky-900 font-semibold flex items-center gap-0.5 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>+ Type</span>
                          </button>
                          {ticketTypes.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteTicketType(newType)}
                              title="Supprimer ce type de besoin"
                              className="text-[11px] text-rose-600 hover:text-rose-800 flex items-center gap-0.5 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Suppr.</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {showAddTypeInline && currentUser?.role === "HEAD" && (
                      <div className="mb-2 p-2 bg-sky-50 rounded-lg border border-sky-200 flex gap-1.5 animate-in fade-in">
                        <input
                          type="text"
                          placeholder="Nom du type (ex: Migration B1 v10)"
                          value={customTypeLabel}
                          onChange={(e) => setCustomTypeLabel(e.target.value)}
                          className="w-full text-xs px-2.5 py-1 border border-sky-300 rounded bg-white focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddTicketType()}
                          className="px-2.5 py-1 bg-sky-700 hover:bg-sky-800 text-white rounded text-xs font-semibold shrink-0 cursor-pointer"
                        >
                          Ajouter
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddTypeInline(false)}
                          className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-xs cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value)}
                      className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-600 bg-white"
                    >
                      {ticketTypes.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Priorité</label>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value)}
                      className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-600 bg-white"
                    >
                      <option value="LOW">Basse</option>
                      <option value="MEDIUM">Moyenne</option>
                      <option value="HIGH">Haute</option>
                      <option value="CRITICAL">Critique</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Estimation de la charge & Devise : Définies exclusivement par Aliko (HEAD) */}
              {currentUser?.role === "HEAD" ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Estimation du temps de travail (heures) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="200"
                        required
                        value={newHours}
                        onChange={(e) => setNewHours(Number(e.target.value))}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-600 font-mono"
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

                  {/* Entreprise ou Client : Liste déroulante avec création/suppression par Aliko */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-700">
                          Entreprise / Nouveau Client
                        </label>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setShowAddClientInline(!showAddClientInline)}
                            className="text-[11px] text-sky-700 hover:text-sky-900 font-semibold flex items-center gap-0.5 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>+ Client</span>
                          </button>
                          {clientsList.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteClient(newClient)}
                              title="Supprimer cette entreprise de la liste"
                              className="text-[11px] text-rose-600 hover:text-rose-800 flex items-center gap-0.5 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Suppr.</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {showAddClientInline && (
                        <div className="mb-2 p-2 bg-emerald-50 rounded-lg border border-emerald-200 flex gap-1.5 animate-in fade-in">
                          <input
                            type="text"
                            placeholder="Nom de l'entreprise (ex: AgroTech CI)"
                            value={customClientName}
                            onChange={(e) => setCustomClientName(e.target.value)}
                            className="w-full text-xs px-2.5 py-1 border border-emerald-300 rounded bg-white focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddClient()}
                            className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold shrink-0 cursor-pointer"
                          >
                            Ajouter
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAddClientInline(false)}
                            className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-xs cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      )}

                      <select
                        value={newClient}
                        onChange={(e) => setNewClient(e.target.value)}
                        className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-600 bg-white font-medium"
                      >
                        {clientsList.map((client) => (
                          <option key={client} value={client}>
                            {client}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Devise du Contrat</label>
                      <select
                        value={newCurrency}
                        onChange={(e) => setNewCurrency(e.target.value as "XOF" | "EUR" | "USD")}
                        className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-600 font-medium bg-white"
                      >
                        <option value="XOF">FCFA (XOF)</option>
                        <option value="EUR">Euro (€)</option>
                        <option value="USD">Dollar ($)</option>
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-950">
                      <Clock className="w-3.5 h-3.5 text-purple-700" />
                      <span>Chiffrage, estimation de prix et devise réservés à la Direction (Aliko Getheme)</span>
                    </div>
                    <p className="text-[11px] text-purple-900 leading-relaxed">
                      En tant que consultante, vous décrivez le besoin fonctionnel et transmettez les spécifications SAP. Le temps de travail, l'estimation financière du prix et la devise du contrat sont définis et validés exclusivement par <strong>Aliko Getheme</strong>.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Entreprise / Client</label>
                    <select
                      value={newClient}
                      onChange={(e) => setNewClient(e.target.value)}
                      className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-600 bg-white font-medium"
                    >
                      {clientsList.map((client) => (
                        <option key={client} value={client}>
                          {client}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description détaillée * <span className="text-rose-600 font-semibold">(Obligatoire)</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Décrivez précisément les exigences fonctionnelles, le flux SAP concerné et les critères d'acceptation..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-600"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <Paperclip className="w-3.5 h-3.5 text-sky-700" />
                  <span>Pièce jointe fonctionnelle ou technique SAP (Optionnel)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={newTicketAttachmentName}
                    onChange={(e) => setNewTicketAttachmentName(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="">-- Joindre un modèle type SAP --</option>
                    {SAP_ATTACHMENT_TEMPLATES.map((tpl) => (
                      <option key={tpl.fileName} value={tpl.fileName}>
                        📎 {tpl.fileName} ({tpl.fileSize})
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Ou nom du fichier (ex: Cahier_Recette_SAP.pdf)"
                    value={newTicketAttachmentName}
                    onChange={(e) => setNewTicketAttachmentName(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div className="text-[10px] text-emerald-700 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>Contrôle d'intégrité MIME & Scan Antivirus In-App actif (.pdf, .xlsx, .sql, .png)</span>
                </div>
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
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">Affecter le ticket</h3>
                <p className="text-xs text-slate-500 font-mono">{assigningTicket.reference}</p>
              </div>
              <button onClick={() => setAssigningTicket(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="p-4 space-y-4 overflow-y-auto">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <div>
                  <div className="text-[11px] text-slate-500">Besoin / Titre :</div>
                  <div className="text-sm font-semibold text-slate-900">{assigningTicket.title}</div>
                  {assigningTicket.description && (
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{assigningTicket.description}</p>
                  )}
                </div>

                {!isMultiDevAssignment && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Estimation du temps de travail par Aliko (heures) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="200"
                      required
                      value={assigningHours}
                      onChange={(e) => setAssigningHours(Number(e.target.value))}
                      className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-600 font-mono font-bold bg-white"
                    />
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Fixée et validée exclusivement par la Direction (Aliko Getheme).
                    </p>
                  </div>
                )}

                {/* Devise du contrat et Estimation de prix (Prérogative exclusive d'Aliko) */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Devise contractuelle (Décision Aliko)
                    </label>
                    <select
                      value={assigningCurrency}
                      onChange={(e) => setAssigningCurrency(e.target.value as "XOF" | "EUR" | "USD")}
                      className="w-full text-xs p-1.5 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="XOF">FCFA (XOF)</option>
                      <option value="EUR">Euro (€)</option>
                      <option value="USD">Dollar ($)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Valorisation financière estimée
                    </label>
                    <div className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-1.5 rounded-lg border border-emerald-200">
                      {((isMultiDevAssignment && coDevId ? Number(leadHours) + Number(coDevHours) : Number(assigningHours) || 16) * (assigningCurrency === "XOF" ? 45000 : assigningCurrency === "EUR" ? 70 : 75)).toLocaleString("fr-FR")} {assigningCurrency === "XOF" ? "FCFA" : assigningCurrency === "EUR" ? "€" : "$"}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {isMultiDevAssignment ? "Lead Développeur (Pilote technique) *" : "Sélectionner un développeur disponible *"}
                </label>
                <select
                  required
                  value={selectedDevId}
                  onChange={(e) => setSelectedDevId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-600 bg-white"
                >
                  <option value="">-- Choisir un développeur --</option>
                  {developers.map((dev) => {
                    const match = checkDeveloperSkillMatch(dev, assigningTicket.typeCode);
                    return (
                      <option key={dev.id} value={dev.id}>
                        {dev.name} ({dev.freeHours} h libres — {dev.jobTitle}) {!match ? "🎓 [Montée en compétences]" : "✓ [Compétence alignée]"}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Panneau de Validation Managériale : Aliko peut affecter un dev même s'il n'a pas cette compétence */}
              {selectedDevId && (() => {
                const dev = developers.find((d) => d.id === selectedDevId);
                if (!dev) return null;
                const isMatch = checkDeveloperSkillMatch(dev, assigningTicket.typeCode);

                if (!isMatch) {
                  return (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs animate-in fade-in">
                      <div className="flex items-start gap-2.5">
                        <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg shrink-0">
                          <GraduationCap className="w-4 h-4" />
                        </div>
                        <div className="space-y-1">
                          <div className="font-semibold text-amber-950 flex items-center gap-1.5">
                            <span>🎓 Dérogation & Montée en Compétences Accordée</span>
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-200 text-amber-900 font-bold">Autorisé</span>
                          </div>
                          <p className="text-[11px] text-amber-800 leading-relaxed">
                            <strong>{dev.name}</strong> ne possède pas encore la compétence technique spécifique <strong>« {assigningTicket.typeCode} »</strong> dans sa fiche profil.
                            En tant que Responsable d'Équipe (Aliko Getheme), vous avez le plein pouvoir managérial de lui confier ce projet pour lui permettre d'apprendre et de monter en compétences encadrée.
                          </p>
                        </div>
                      </div>
                      <label className="flex items-center gap-2 text-[11px] font-medium text-amber-950 bg-amber-100/70 p-2 rounded-lg cursor-pointer select-none border border-amber-200">
                        <input
                          type="checkbox"
                          checked={isSkillOverrideChecked}
                          onChange={(e) => setIsSkillOverrideChecked(e.target.checked)}
                          className="rounded text-amber-700 focus:ring-amber-600"
                        />
                        <span>Valider l'affectation dérogatoire en montée en compétences encadrée (Décision Aliko)</span>
                      </label>
                    </div>
                  );
                }

                return (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="text-[11px]">
                      <strong>Compétence alignée :</strong> {dev.name} possède une expertise confirmée correspondant au besoin <strong>{assigningTicket.typeCode}</strong>.
                    </span>
                  </div>
                );
              })()}

              {/* Option Multi-Développeurs / Répartition par Lots */}
              <div className="pt-2 border-t border-slate-200">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isMultiDevAssignment}
                    onChange={(e) => setIsMultiDevAssignment(e.target.checked)}
                    className="rounded text-sky-600 focus:ring-sky-500"
                  />
                  <span>👥 Affectation Multi-Développeurs (Répartir en plusieurs briques techniques)</span>
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5 ml-5">
                  Associez plusieurs développeurs sur des spécialités distinctes (Addon, HANA, API...).
                </p>
              </div>

              {isMultiDevAssignment && (
                <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-xl space-y-3 animate-in fade-in">
                  {/* Brique du Lead Développeur */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-sky-950 mb-1">
                        Brique Lead Développeur
                      </label>
                      <select
                        value={leadLotRole}
                        onChange={(e) => setLeadLotRole(e.target.value)}
                        className="w-full text-xs p-1.5 border border-sky-300 rounded-lg bg-white"
                      >
                        {TECHNICAL_LOT_ROLES.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-sky-950 mb-1">
                        Heures Lead
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={leadHours}
                        onChange={(e) => setLeadHours(Number(e.target.value))}
                        className="w-full text-xs p-1.5 border border-sky-300 rounded-lg bg-white font-mono"
                      />
                    </div>
                  </div>

                  {/* Co-développeur 2 */}
                  <div className="space-y-2 pt-2 border-t border-sky-200">
                    <div>
                      <label className="block text-[11px] font-semibold text-sky-950 mb-1">
                        Second Développeur Collaborateur *
                      </label>
                      <select
                        required={isMultiDevAssignment}
                        value={coDevId}
                        onChange={(e) => setCoDevId(e.target.value)}
                        className="w-full text-xs p-1.5 border border-sky-300 rounded-lg bg-white"
                      >
                        <option value="">-- Choisir le 2ᵉ développeur --</option>
                        {developers
                          .filter((d) => d.id !== selectedDevId)
                          .map((dev) => (
                            <option key={dev.id} value={dev.id}>
                              {dev.name} ({dev.freeHours} h libres — {dev.jobTitle})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-[11px] font-semibold text-sky-950 mb-1">
                          Brique Technique Dédiée
                        </label>
                        <select
                          value={coDevLotRole}
                          onChange={(e) => setCoDevLotRole(e.target.value)}
                          className="w-full text-xs p-1.5 border border-sky-300 rounded-lg bg-white"
                        >
                          {TECHNICAL_LOT_ROLES.map((r) => (
                            <option key={r.value} value={r.value}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-sky-950 mb-1">
                          Heures Allouées
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={coDevHours}
                          onChange={(e) => setCoDevHours(Number(e.target.value))}
                          className="w-full text-xs p-1.5 border border-sky-300 rounded-lg bg-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="text-[11px] font-semibold text-sky-900 flex justify-between items-center pt-1">
                      <span>Total Charge Consolidée :</span>
                      <span className="font-mono bg-sky-200/80 px-2 py-0.5 rounded text-sky-950 font-bold">
                        {Number(leadHours) + Number(coDevHours)} heures
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="font-medium text-slate-800 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-sky-700" />
                  <span>Notification Temps Réel In-App :</span>
                </div>
                <p>Une alerte instantanée sera poussée dans le Centre de Notifications de chaque développeur mobilisé et de la consultante référente.</p>
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
                  disabled={!selectedDevId || (isMultiDevAssignment && !coDevId)}
                  className="px-4 py-1.5 text-xs font-medium text-white bg-sky-700 hover:bg-sky-800 disabled:opacity-50 rounded-lg shadow-sm cursor-pointer"
                >
                  Valider l'affectation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ================================================================= */}
      {/* MODALE 5 : INTÉGRATION D'UN NOUVEAU DÉVELOPPEUR PAR ALIKO (HEAD)   */}
      {/* ================================================================= */}
      {showAddDevModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-sky-100 text-sky-800 rounded-lg">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">Intégrer un Développeur dans l'Équipe</h3>
                  <p className="text-xs text-slate-500">SME Business Unit — Safir Consulting</p>
                </div>
              </div>
              <button onClick={() => setShowAddDevModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddDeveloper} className="p-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Prénom *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex : Amadou"
                    value={newDevFirstName}
                    onChange={(e) => setNewDevFirstName(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nom *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex : Coulibaly"
                    value={newDevLastName}
                    onChange={(e) => setNewDevLastName(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Adresse e-mail professionnelle *</label>
                <input
                  type="email"
                  required
                  placeholder="amadou.coulibaly@safirconsulting.net"
                  value={newDevEmail}
                  onChange={(e) => setNewDevEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Intitulé de poste / Rôle SAP *</label>
                  <select
                    value={newDevJobTitle}
                    onChange={(e) => setNewDevJobTitle(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-600"
                  >
                    <option value="Senior Développeur SAP Business One & Addons">Senior Développeur SAP B1 & Addons</option>
                    <option value="Lead Développeur SAP S/4HANA & ABAP">Lead Développeur SAP S/4HANA & ABAP</option>
                    <option value="Ingénieur Intégration Systèmes & API">Ingénieur Intégration Systèmes & API</option>
                    <option value="Développeur Full-Stack Web & Interfaces Fiori">Développeur Full-Stack Web & Fiori</option>
                    <option value="Développeur Backend & Bases de données HANA">Développeur Backend & Bases HANA</option>
                    <option value="Consultant Développeur SAP B1 SDK">Consultant Développeur SAP B1 SDK</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Capacité (h/sem)</label>
                  <input
                    type="number"
                    min="10"
                    max="60"
                    value={newDevHours}
                    onChange={(e) => setNewDevHours(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-600 font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                  Compétence Clé Initiale & Niveau d'Expertise
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <select
                      value={newDevSkillName}
                      onChange={(e) => setNewDevSkillName(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-sky-600"
                    >
                      <option value="SAP Business One — Service Layer">SAP B1 — Service Layer</option>
                      <option value="SAP Business One — UI / DI API">SAP B1 — UI / DI API</option>
                      <option value="SAP S/4HANA — ABAP & CDS">SAP S/4HANA — ABAP & CDS</option>
                      <option value="SAP Fiori / UI5">SAP Fiori / UI5</option>
                      <option value="SAP HANA & SQL">SAP HANA & SQL</option>
                      <option value="Architecture & Intégration API">Architecture & Intégration API</option>
                      <option value="Next.js & React">Next.js & React</option>
                      <option value="NestJS & Node.js">NestJS & Node.js</option>
                      <option value="PostgreSQL & Prisma">PostgreSQL & Prisma</option>
                    </select>
                  </div>
                  <div>
                    <select
                      value={newDevSkillLevel}
                      onChange={(e) => setNewDevSkillLevel(Number(e.target.value))}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-sky-600 font-mono"
                    >
                      <option value={5}>Niveau 5 (Expert)</option>
                      <option value={4}>Niveau 4 (Avancé)</option>
                      <option value={3}>Niveau 3 (Autonome)</option>
                      <option value={2}>Niveau 2 (Intermédiaire)</option>
                      <option value={1}>Niveau 1 (Notions)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddDevModal(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800 bg-slate-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-medium text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Intégrer le Développeur</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ================================================================= */}
      {/* MODALE 6 : CRÉATION D'UN PROFIL CONSULTANT PAR ALIKO (HEAD)        */}
      {/* ================================================================= */}
      {showAddConsultantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-purple-50/50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-100 text-purple-800 rounded-lg">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">Créer un Profil Consultant SAP</h3>
                  <p className="text-xs text-slate-500">Génération des accès et identifiants de connexion</p>
                </div>
              </div>
              <button onClick={() => setShowAddConsultantModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddConsultant} className="p-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Prénom *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex : Ibrahima"
                    value={newConsultantFirstName}
                    onChange={(e) => setNewConsultantFirstName(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nom *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex : Koné"
                    value={newConsultantLastName}
                    onChange={(e) => setNewConsultantLastName(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adresse e-mail professionnelle (Login de connexion) *
                </label>
                <input
                  type="email"
                  required
                  placeholder="ibrahima.kone@safirconsulting.net"
                  value={newConsultantEmail}
                  onChange={(e) => setNewConsultantEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-600 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Organisation / Cabinet *</label>
                  <input
                    type="text"
                    required
                    value={newConsultantOrg}
                    onChange={(e) => setNewConsultantOrg(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mot de passe de connexion initial *</label>
                  <input
                    type="text"
                    required
                    value={newConsultantPassword}
                    onChange={(e) => setNewConsultantPassword(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-600 font-mono bg-purple-50/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Spécialité fonctionnelle SAP *</label>
                <select
                  value={newConsultantSpeciality}
                  onChange={(e) => setNewConsultantSpeciality(e.target.value)}
                  className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-600"
                >
                  <option value="Consultant Fonctionnel SAP Business One">Consultant Fonctionnel SAP Business One</option>
                  <option value="Consultante Fonctionnelle SAP S/4HANA & Fiori">Consultante Fonctionnelle SAP S/4HANA & Fiori</option>
                  <option value="Consultant Spécialiste SAP FI/CO & Comptabilité">Consultant Spécialiste SAP FI/CO & Comptabilité</option>
                  <option value="Consultant Supply Chain & Logistique SAP">Consultant Supply Chain & Logistique SAP</option>
                  <option value="Consultante Métier WMS & Interfaces E-Commerce">Consultante Métier WMS & Interfaces E-Commerce</option>
                </select>
              </div>

              <div className="p-3 bg-purple-50/60 rounded-lg border border-purple-200 text-xs text-purple-900 space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-purple-950">
                  <Key className="w-3.5 h-3.5 text-purple-700" />
                  <span>Règle d'accès et d'authentification :</span>
                </div>
                <p className="text-[11px] text-purple-800 leading-relaxed">
                  L'adresse e-mail professionnelle servira d'identifiant de connexion (<strong>Login</strong>). Le consultant pourra immédiatement se connecter à son espace portail pour soumettre des demandes et suivre les spécifications transmises à Aliko.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddConsultantModal(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800 bg-slate-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-medium text-white bg-purple-700 hover:bg-purple-800 rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Créer le Compte Consultant</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ================================================================= */}
      {/* MODALE 7 : SUPERVISION DU TICKET & OEIL DIRECTION D'ALIKO (HEAD)   */}
      {/* ================================================================= */}
      {supervisingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Entête de la Modale */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-sky-950 via-slate-900 to-sky-900 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-500/20 text-sky-300 rounded-xl border border-sky-400/20">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-sky-500/30 text-sky-200 border border-sky-400/30">
                      {supervisingTicket.reference}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-slate-300 font-mono">
                      {supervisingTicket.typeCode}
                    </span>
                    {renderStatusBadge(supervisingTicket.status)}
                  </div>
                  <div className="text-[11px] font-semibold text-sky-300 uppercase tracking-wider mt-1">
                    Supervision Métier Direction BU SME
                  </div>
                  <h3 className="font-bold text-sm sm:text-base text-white leading-tight">
                    {supervisingTicket.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSupervisingTicket(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenu Déroulant */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Stepper Pipeline des 6 Étapes Métier */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-sky-700" />
                    <span>Pipeline d'Avancement du Ticket (Cycle de Vie)</span>
                  </span>
                  <span className="font-mono font-bold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded border border-sky-200">
                    {getTicketProgress(supervisingTicket).label}
                  </span>
                </div>

                {/* Barre de Progression Globale */}
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden mb-4 border border-slate-200">
                  <div
                    className={`h-full transition-all duration-500 ${getTicketProgress(supervisingTicket).barClass}`}
                    style={{ width: `${getTicketProgress(supervisingTicket).pct}%` }}
                  />
                </div>

                {/* Les 6 Étapes sous forme de Cartes / Steppers */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { key: "RECEIVED", num: 1, label: "Reçu", sub: "Besoin consigné" },
                    { key: "QUALIFIED", num: 2, label: "Qualifié", sub: `${supervisingTicket.estimatedHours}h estimées` },
                    { key: "ASSIGNED", num: 3, label: "Affecté", sub: supervisingTicket.assignedDeveloper ? supervisingTicket.assignedDeveloper.name.split(" ")[0] : "En attente" },
                    { key: "IN_PROGRESS", num: 4, label: "En cours", sub: supervisingTicket.status === "BLOCKED" ? "Bloqué" : `RAF: ${supervisingTicket.remainingHours ?? supervisingTicket.estimatedHours}h` },
                    { key: "DELIVERED", num: 5, label: "Livré", sub: "Prêt pour recette" },
                    { key: "CLOSED", num: 6, label: "Réglé & Clôturé", sub: "Validation Aliko" },
                  ].map((step) => {
                    const order = ["RECEIVED", "QUALIFIED", "ASSIGNED", "IN_PROGRESS", "DELIVERED", "CLOSED"];
                    const normStatus = supervisingTicket.status === "BLOCKED" ? "IN_PROGRESS" : supervisingTicket.status;
                    const curIdx = order.indexOf(normStatus);
                    const stepIdx = order.indexOf(step.key);
                    const isDone = stepIdx < curIdx || (supervisingTicket.status === "CLOSED" && step.key === "CLOSED");
                    const isCurrent = stepIdx === curIdx && supervisingTicket.status !== "CLOSED";
                    const isBlocked = isCurrent && supervisingTicket.status === "BLOCKED";

                    return (
                      <div
                        key={step.key}
                        className={`p-2.5 rounded-xl border transition-all ${
                          isBlocked
                            ? "bg-rose-50 border-rose-300 ring-1 ring-rose-400"
                            : isDone
                            ? "bg-emerald-50/70 border-emerald-200"
                            : isCurrent
                            ? "bg-sky-50 border-sky-300 ring-1 ring-sky-400"
                            : "bg-slate-50/60 border-slate-200 opacity-60"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                            isBlocked
                              ? "bg-rose-200 text-rose-900"
                              : isDone
                              ? "bg-emerald-200 text-emerald-900"
                              : isCurrent
                              ? "bg-sky-200 text-sky-900"
                              : "bg-slate-200 text-slate-700"
                          }`}>
                            Étape {step.num}
                          </span>
                          {isDone ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : isBlocked ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 animate-bounce" />
                          ) : isCurrent ? (
                            <Clock className="w-3.5 h-3.5 text-sky-600" />
                          ) : null}
                        </div>
                        <div className="font-semibold text-slate-900 text-xs">{step.label}</div>
                        <div className="text-[10px] text-slate-500 truncate">{step.sub}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Alerte de Blocage si le ticket est bloqué */}
              {supervisingTicket.status === "BLOCKED" && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                  <div className="flex items-start gap-2.5 text-rose-800">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Point de blocage signalé par le développeur :</span>
                      <p className="text-xs text-rose-900 mt-0.5 leading-relaxed">
                        {supervisingTicket.blockerReason || "En attente de retour d'arbitrage ou de licence"}
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => handleUnblockByAliko(supervisingTicket.id)}
                      className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Arbitrer & Lever le blocage</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Détails Opérationnels : Développeur & Métriques RAF */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Ressource Technique Dédiée
                  </div>
                  {supervisingTicket.assignedDeveloper ? (
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{supervisingTicket.assignedDeveloper.name}</div>
                      <div className="text-slate-500 text-xs">{supervisingTicket.assignedDeveloper.email}</div>
                      <div className="mt-2 text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>En charge du développement</span>
                      </div>
                      {supervisingTicket.isSkillOverride && (
                        <div className="mt-2.5 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold">Affectation en montée en compétences :</span>
                            <p className="text-[11px] text-amber-800 mt-0.5">
                              {supervisingTicket.overrideReason || "Montée en compétences encadrée validée par Aliko Getheme"}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-amber-700 text-xs font-medium">⚠️ Aucun développeur n'est encore assigné.</div>
                      <button
                        onClick={() => {
                          const t = supervisingTicket;
                          setSupervisingTicket(null);
                          openAssignModal(t);
                        }}
                        className="px-3 py-1 text-xs bg-sky-700 hover:bg-sky-800 text-white rounded-lg font-medium cursor-pointer"
                      >
                        Affecter maintenant
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Suivi de Charge & Reste à Faire (RAF)
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center pt-1">
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <div className="text-[10px] text-slate-500">Estimé</div>
                      <div className="text-sm font-bold text-slate-900">{supervisingTicket.estimatedHours} h</div>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <div className="text-[10px] text-slate-500">Réalisé</div>
                      <div className="text-sm font-bold text-emerald-700">
                        {Math.max(0, supervisingTicket.estimatedHours - (supervisingTicket.remainingHours ?? supervisingTicket.estimatedHours))} h
                      </div>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <div className="text-[10px] text-slate-500">RAF</div>
                      <div className="text-sm font-bold text-sky-800">
                        {supervisingTicket.remainingHours ?? supervisingTicket.estimatedHours} h
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Demandeur et Client */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-slate-500">Demandeur : </span>
                  <strong className="text-slate-800">{supervisingTicket.applicantName || "Client"}</strong>
                  {supervisingTicket.applicantEmail && (
                    <span className="text-slate-500 ml-1">({supervisingTicket.applicantEmail})</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-500">Client / Société : </span>
                  <strong className="text-slate-800">{supervisingTicket.clientCompany || "Safir Consulting"}</strong>
                </div>
              </div>

              {/* Répartition de l'Équipe Projet par Brique Technique */}
              {supervisingTicket.contributors && supervisingTicket.contributors.length > 0 && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-sky-700" />
                      <span>Équipe Projet Mobilisée & Lots Techniques ({supervisingTicket.contributors.length} Développeurs)</span>
                    </span>
                    <span className="text-[11px] font-mono font-bold text-sky-900 bg-sky-100 px-2 py-0.5 rounded border border-sky-200">
                      Multi-Lots SAP
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {supervisingTicket.contributors.map((contrib) => {
                      const done = Math.max(0, contrib.estimatedHours - contrib.remainingHours);
                      const pct = contrib.estimatedHours > 0 ? Math.round((done / contrib.estimatedHours) * 100) : 0;
                      return (
                        <div key={contrib.id} className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-xs">{contrib.developerName}</span>
                            <span className="font-mono text-[10px] font-bold text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                              {pct}%
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-700 font-medium">{contrib.lotLabel}</div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200">
                            <div className="bg-sky-600 h-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                            <span>Estimé : {contrib.estimatedHours} h</span>
                            <span>RAF : <strong className="text-sky-700">{contrib.remainingHours} h</strong></span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Pièces Jointes & Livrables SAP Attachés au Ticket */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-sky-700" />
                    <span>Pièces Jointes & Spécifications SAP ({supervisingTicket.attachments?.length || 0})</span>
                  </div>
                  <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Vérifiées & Scannées</span>
                  </span>
                </div>

                {(!supervisingTicket.attachments || supervisingTicket.attachments.length === 0) ? (
                  <p className="text-slate-500 text-xs italic">
                    Aucun document ou livrable joint à ce ticket pour le moment.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {supervisingTicket.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between gap-2 shadow-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="p-1.5 bg-sky-50 text-sky-700 rounded border border-sky-200 shrink-0">
                            <FileText className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-900 truncate" title={att.fileName}>
                              {att.fileName}
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                              <span className="font-mono font-bold text-sky-800">{att.fileType}</span>
                              <span>•</span>
                              <span>{att.fileSize}</span>
                              <span>•</span>
                              <span>Par {att.uploadedBy}</span>
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded shrink-0">
                          CLEAN
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Fil d'Échange Développeur ↔ Consultant & Direction dans la Modale de Supervision */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                    <span>Dialogue Technique : Développeur ↔ Consultante ({supervisingTicket.messages?.length || 0})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const t = supervisingTicket;
                      setDiscussingTicket(t);
                    }}
                    className="px-2.5 py-1 text-[11px] bg-purple-100 text-purple-800 hover:bg-purple-200 rounded font-medium transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>Ouvrir le fil de discussion</span>
                  </button>
                </div>

                {(!supervisingTicket.messages || supervisingTicket.messages.length === 0) ? (
                  <p className="text-slate-500 text-xs italic">
                    Aucun échange direct enregistré pour le moment entre le développeur et le consultant.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {supervisingTicket.messages.map((m) => (
                      <div
                        key={m.id}
                        className={`p-2.5 rounded-lg border text-xs leading-relaxed ${
                          m.authorRole === "DEVELOPER"
                            ? "bg-sky-50/70 border-sky-200"
                            : m.authorRole === "CONSULTANT"
                            ? "bg-purple-50/70 border-purple-200"
                            : "bg-amber-50/70 border-amber-200"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                              m.authorRole === "DEVELOPER"
                                ? "bg-sky-200 text-sky-900"
                                : m.authorRole === "CONSULTANT"
                                ? "bg-purple-200 text-purple-900"
                                : "bg-amber-200 text-amber-900"
                            }`}>
                              {m.authorRole === "DEVELOPER" ? "Développeur" : m.authorRole === "CONSULTANT" ? "Consultante" : "Direction"}
                            </span>
                            <span>{m.authorName}</span>
                          </span>
                          <span className="text-slate-400 text-[10px]">{m.timestamp}</span>
                        </div>
                        <p className="text-slate-700">{m.message}</p>
                        {m.isBlockerQuestion && (
                          <div className="mt-1 text-[10px] font-semibold text-rose-700 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>Précision bloquante demandée au consultant</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Pied de Modale : Arbitrages et Clôture Définitive par Aliko (HEAD) */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-slate-500">
                {supervisingTicket.status === "CLOSED" ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Ce ticket a été définitivement réglé et archivé par la Direction.
                  </span>
                ) : (
                  <span>Gouvernance BU SME — Droit de validation et clôture exclusive Aliko.</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSupervisingTicket(null)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-lg cursor-pointer"
                >
                  Fermer
                </button>

                {supervisingTicket.status !== "CLOSED" && (
                  <>
                    <button
                      onClick={() => {
                        const t = supervisingTicket;
                        setSupervisingTicket(null);
                        openAssignModal(t);
                      }}
                      className="px-3.5 py-1.5 text-xs text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg font-medium cursor-pointer"
                    >
                      {supervisingTicket.assignedDeveloper ? "Réaffecter" : "Affecter"}
                    </button>

                    <button
                      onClick={() => handleCloseTicket(supervisingTicket.id)}
                      className={`px-4 py-1.5 text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 text-white transition-all cursor-pointer ${
                        supervisingTicket.status === "DELIVERED"
                          ? "bg-emerald-700 hover:bg-emerald-800 ring-2 ring-emerald-400"
                          : "bg-slate-800 hover:bg-slate-900"
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {supervisingTicket.status === "DELIVERED"
                          ? "Valider la Clôture Définitive (Ticket Réglé)"
                          : "Clôturer le Ticket (Réglé)"}
                      </span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODALE 8 : DIALOGUE DIRECT DÉVELOPPEUR <-> CONSULTANT & DIRECTION */}
      {/* ================================================================= */}
      {discussingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Entête */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 text-purple-300 rounded-xl border border-purple-400/20">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-500/30 text-purple-200 border border-purple-400/30">
                      {discussingTicket.reference}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-slate-300 font-mono">
                      {discussingTicket.typeCode}
                    </span>
                    {renderStatusBadge(discussingTicket.status)}
                  </div>
                  <div className="text-[11px] font-semibold text-purple-300 uppercase tracking-wider mt-1">
                    Fil d'Échange Tracé — Développeur ↔ Consultante ↔ Direction
                  </div>
                  <h3 className="font-bold text-sm sm:text-base text-white leading-tight">
                    {discussingTicket.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setDiscussingTicket(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Bandeau d'acteurs */}
            <div className="bg-slate-50 px-5 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Développeur :</span>
                <span className="font-semibold text-slate-900">
                  {discussingTicket.assignedDeveloper ? discussingTicket.assignedDeveloper.name : "Non affecté"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Consultante :</span>
                <span className="font-semibold text-slate-900">{discussingTicket.applicantName || "Mélissa Diakité"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Progression :</span>
                <span className="font-mono font-bold text-sky-800">{getTicketProgress(discussingTicket).label}</span>
              </div>
            </div>

            {/* Corps Déroulant : Messages */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1 text-xs bg-slate-50/30 max-h-[50vh]">
              {(!discussingTicket.messages || discussingTicket.messages.length === 0) ? (
                <div className="p-8 text-center text-slate-400">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>Aucun message n'a encore été échangé sur ce ticket.</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Le développeur ou le consultant peut poser une question ou partager des éléments ici.
                  </p>
                </div>
              ) : (
                discussingTicket.messages.map((m) => {
                  const isCurrentAuthor = currentUser?.email.toLowerCase() === m.authorEmail.toLowerCase();
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isCurrentAuthor ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-slate-500">
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                          m.authorRole === "DEVELOPER"
                            ? "bg-sky-100 text-sky-800"
                            : m.authorRole === "CONSULTANT"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {m.authorRole === "DEVELOPER" ? "Développeur" : m.authorRole === "CONSULTANT" ? "Consultante" : "Direction BU"}
                        </span>
                        <span className="font-medium text-slate-700">{m.authorName}</span>
                        <span>•</span>
                        <span>{m.timestamp}</span>
                      </div>

                      <div
                        className={`p-3.5 rounded-2xl max-w-lg shadow-sm text-xs leading-relaxed ${
                          isCurrentAuthor
                            ? "bg-purple-700 text-white rounded-br-none"
                            : m.authorRole === "DEVELOPER"
                            ? "bg-white border border-sky-200 text-slate-800 rounded-bl-none"
                            : "bg-white border border-purple-200 text-slate-800 rounded-bl-none"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{m.message}</p>
                        {m.attachment && (
                          <div
                            className={`mt-2 p-2 rounded-lg border flex items-center justify-between gap-2 text-[11px] ${
                              isCurrentAuthor
                                ? "bg-purple-800/80 border-purple-500 text-purple-100"
                                : "bg-slate-50 border-slate-200 text-slate-800"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Paperclip className="w-3.5 h-3.5 shrink-0" />
                              <div className="min-w-0">
                                <div className="font-semibold truncate">{m.attachment.fileName}</div>
                                <div className="text-[10px] opacity-80">
                                  {m.attachment.fileType} • {m.attachment.fileSize} • Scan Antivirus OK
                                </div>
                              </div>
                            </div>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shrink-0">
                              VERIFIED
                            </span>
                          </div>
                        )}
                        {m.isBlockerQuestion && (
                          <div className={`mt-2 pt-2 border-t text-[11px] font-semibold flex items-center gap-1.5 ${
                            isCurrentAuthor ? "border-purple-600 text-amber-200" : "border-rose-100 text-rose-700"
                          }`}>
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Question bloquante signalée au consultant</span>
                          </div>
                        )}
                        {m.isConsultantReply && (
                          <div className={`mt-2 pt-2 border-t text-[11px] font-semibold flex items-center gap-1.5 ${
                            isCurrentAuthor ? "border-purple-600 text-emerald-200" : "border-emerald-100 text-emerald-700"
                          }`}>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Précision apportée par la consultante</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Formulaire de Réponse / Question */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 bg-white space-y-3">
              {currentUser?.role === "DEVELOPER" && (
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-xs text-rose-700 cursor-pointer font-medium select-none">
                    <input
                      type="checkbox"
                      checked={isQuestionBlocker}
                      onChange={(e) => setIsQuestionBlocker(e.target.checked)}
                      className="rounded text-rose-600 focus:ring-rose-500"
                    />
                    <span>🚨 Signaler ce besoin comme bloquant pour mon développement (alerter la consultante et Aliko)</span>
                  </label>
                </div>
              )}

              {currentUser?.role === "CONSULTANT" && (discussingTicket.status === "BLOCKED" || !!discussingTicket.blockerReason) && (
                <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                  <label className="flex items-center gap-2 text-xs text-emerald-800 cursor-pointer font-medium select-none">
                    <input
                      type="checkbox"
                      checked={unblockOnReply}
                      onChange={(e) => setUnblockOnReply(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>✓ Mes précisions débloquent le problème : Débloquer automatiquement le ticket et relancer le développement</span>
                  </label>
                </div>
              )}

              {/* Sélecteur de Pièce Jointe dans le Fil de Discussion */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-purple-700" />
                    <span>Joindre un document SAP ou une capture au message (Optionnel)</span>
                  </span>
                  {(selectedAttachmentTemplate || customAttachmentName) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAttachmentTemplate("");
                        setCustomAttachmentName("");
                      }}
                      className="text-[10px] text-rose-600 hover:underline cursor-pointer"
                    >
                      Retirer la pièce jointe
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={selectedAttachmentTemplate}
                    onChange={(e) => {
                      setSelectedAttachmentTemplate(e.target.value);
                      if (e.target.value) setCustomAttachmentName("");
                    }}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="">-- Sélectionner un document SAP --</option>
                    {SAP_ATTACHMENT_TEMPLATES.map((tpl) => (
                      <option key={tpl.fileName} value={tpl.fileName}>
                        📎 {tpl.fileName} ({tpl.fileSize})
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Ou saisir le nom d'un fichier joint..."
                    value={customAttachmentName}
                    onChange={(e) => {
                      setCustomAttachmentName(e.target.value);
                      if (e.target.value) setSelectedAttachmentTemplate("");
                    }}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <textarea
                  rows={2}
                  required
                  placeholder={
                    currentUser?.role === "CONSULTANT"
                      ? `Répondre à ${discussingTicket.assignedDeveloper ? discussingTicket.assignedDeveloper.name : "l'équipe"} avec vos précisions fonctionnelles...`
                      : currentUser?.role === "DEVELOPER"
                      ? `Poser une question fonctionnelle à ${discussingTicket.applicantName || "la consultante"}...`
                      : "Saisir une directive ou arbitrage de Direction BU SME..."
                  }
                  value={ticketMessageText}
                  onChange={(e) => setTicketMessageText(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600 resize-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5 self-end shrink-0 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Envoyer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODALE 9 : SYNTHÈSE COMITÉ DIRECTION & EXPORT REPORTING (HEAD)    */}
      {/* ================================================================= */}
      {showReportModal && currentUser?.role === "HEAD" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-400/30">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    Reporting Comité de Direction — Safir Consulting
                  </span>
                  <h3 className="font-bold text-base sm:text-lg text-white mt-1">
                    Synthèse Hebdomadaire d'Activité & Valorisation Financière BU SME
                  </h3>
                  <p className="text-xs text-slate-300">
                    Pilotage centralisé par Aliko Getheme • Devise de reporting :{" "}
                    <strong>{activeCurrency === "XOF" ? "FCFA (XOF)" : activeCurrency === "EUR" ? "Euro (€)" : "Dollar US ($)"}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
              {/* Synthèse Macro Financière & Opérationnelle */}
              {(() => {
                const ratePerHour = activeCurrency === "XOF" ? 45000 : activeCurrency === "EUR" ? 70 : 75;
                const symbol = activeCurrency === "XOF" ? "FCFA" : activeCurrency === "EUR" ? "€" : "$";
                const totalEst = tickets.reduce((acc, t) => acc + (t.estimatedHours || 0), 0);
                const totalRem = tickets.reduce((acc, t) => acc + (t.remainingHours ?? t.estimatedHours ?? 0), 0);
                const totalDone = Math.max(0, totalEst - totalRem);
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="text-[11px] text-slate-500">Volume Total Tickets</div>
                      <div className="text-xl font-bold text-slate-900 mt-0.5">{tickets.length} tickets</div>
                      <div className="text-[10px] text-emerald-700 font-medium mt-1">
                        Dont {tickets.filter((t) => t.status === "DELIVERED" || t.status === "CLOSED").length} livrés / clôturés
                      </div>
                    </div>
                    <div className="p-3.5 bg-sky-50/70 rounded-xl border border-sky-200">
                      <div className="text-[11px] text-sky-800">Charge Totale Estimée</div>
                      <div className="text-xl font-bold text-sky-950 mt-0.5">{totalEst} h</div>
                      <div className="text-[10px] text-sky-700 font-medium mt-1">RAF global : {totalRem} h</div>
                    </div>
                    <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200">
                      <div className="text-[11px] text-emerald-800">Valeur Produite (Heures Réalisées)</div>
                      <div className="text-base sm:text-lg font-bold text-emerald-950 mt-0.5 font-mono">
                        {(totalDone * ratePerHour).toLocaleString("fr-FR")} {symbol}
                      </div>
                      <div className="text-[10px] text-emerald-700 font-medium mt-1">{totalDone} h consommées</div>
                    </div>
                    <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200">
                      <div className="text-[11px] text-amber-900">Valorisation Portefeuille Global</div>
                      <div className="text-base sm:text-lg font-bold text-amber-950 mt-0.5 font-mono">
                        {(totalEst * ratePerHour).toLocaleString("fr-FR")} {symbol}
                      </div>
                      <div className="text-[10px] text-amber-800 font-medium mt-1">
                        Taux horaire : {ratePerHour.toLocaleString("fr-FR")} {symbol}/h
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Tableau Récapitulatif des Tickets pour Comité de Direction */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    État Consolidé du Portefeuille Tickets & Valorisation ({activeCurrency === "XOF" ? "FCFA (XOF)" : activeCurrency})
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Généré pour Aliko Getheme (Head of BU SME)
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px]">
                        <th className="py-2 px-3">Réf.</th>
                        <th className="py-2 px-3">Client / Titre</th>
                        <th className="py-2 px-3">Équipe / Lots</th>
                        <th className="py-2 px-3">Statut</th>
                        <th className="py-2 px-3 text-right">Estimé / RAF</th>
                        <th className="py-2 px-3 text-right">Valorisation ({activeCurrency})</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {tickets.map((t) => {
                        const ratePerHour = activeCurrency === "XOF" ? 45000 : activeCurrency === "EUR" ? 70 : 75;
                        const symbol = activeCurrency === "XOF" ? "FCFA" : activeCurrency === "EUR" ? "€" : "$";
                        const rem = t.remainingHours ?? t.estimatedHours ?? 0;
                        return (
                          <tr key={t.id} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-mono font-bold text-sky-900">{t.reference}</td>
                            <td className="py-2 px-3">
                              <div className="font-semibold text-slate-900">{t.clientCompany || "Safir Consulting"}</div>
                              <div className="text-[11px] text-slate-500 truncate max-w-xs">{t.title}</div>
                            </td>
                            <td className="py-2 px-3">
                              {t.contributors && t.contributors.length > 1 ? (
                                <span className="text-[11px] font-medium text-sky-800">
                                  👥 {t.contributors.map((c) => c.developerName).join(" + ")}
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-700">
                                  {t.assignedDeveloper ? t.assignedDeveloper.name : "En attente Aliko"}
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3">{renderStatusBadge(t.status)}</td>
                            <td className="py-2 px-3 text-right font-mono">
                              <span className="font-semibold text-slate-900">{t.estimatedHours}h</span>{" "}
                              <span className="text-slate-400">/</span>{" "}
                              <span className="text-sky-700 font-bold">{rem}h</span>
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-emerald-800">
                              {(t.estimatedHours * ratePerHour).toLocaleString("fr-FR")} {symbol}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Données certifiées conformes au référentiel central BU SME — Safir Consulting.</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-lg cursor-pointer"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  onClick={handleExportCsvReport}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Télécharger Export Excel / CSV ({activeCurrency})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
