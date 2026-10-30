"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
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
  GraduationCap,
  RotateCcw,
  FlaskConical,
  Pause,
  Timer,
  Square,
  Activity,
  Sun,
  Moon,
  Globe
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

export interface TimeLog {
  id: string;
  ticketId: string;
  ticketReference: string;
  ticketTitle: string;
  clientCompany: string;
  developerId: string;
  developerName: string;
  developerEmail: string;
  startedAt: string;
  endedAt?: string;
  durationMinutes: number;
  durationHours: number;
  date: string; // Format YYYY-MM-DD
  note?: string;
}

export interface DeveloperLiveActivity {
  developerId: string;
  status: "WORKING" | "BLOCKED" | "AVAILABLE";
  activeTicketId?: string;
  activeTicketReference?: string;
  activeTicketTitle?: string;
  clientCompany?: string;
  currentTaskDescription?: string;
  startedAtTimestamp?: number;
  elapsedSeconds: number;
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
  consultantReviewStatus?: "PENDING" | "APPROVED" | "REJECTED";
  consultantReviewDate?: string;
  consultantReviewNote?: string;
  rejectionReason?: string;
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

// Historique des feuilles de temps et relevés d'heures réelles travaillées (Time Tracking & Reporting)
const INITIAL_TIME_LOGS: TimeLog[] = [
  // 1. Session d'Aujourd'hui (2026-10-29 - Journalier)
  {
    id: "log-1",
    ticketId: "tix-1",
    ticketReference: "ADD-2026-0001",
    ticketTitle: "Addon Validation Commandes Fournisseurs SAP B1",
    clientCompany: "Safir Consulting (Consulting Interne)",
    developerId: "dev-anoop",
    developerName: "Anoop Pandimukkula",
    developerEmail: "anoop.pandimukkula@safirconsulting.net",
    startedAt: "2026-10-29 08:30",
    endedAt: "2026-10-29 12:00",
    durationMinutes: 210,
    durationHours: 3.5,
    date: "2026-10-29",
    note: "Développement du formulaire UI API SAP B1 pour validation multi-devises."
  },
  {
    id: "log-2",
    ticketId: "tix-4",
    ticketReference: "BUG-2026-0004",
    ticketTitle: "Correction anomalie lettrage comptable sur CDS Views S/4HANA",
    clientCompany: "Client Alpha",
    developerId: "dev-anoop",
    developerName: "Anoop Pandimukkula",
    developerEmail: "anoop.pandimukkula@safirconsulting.net",
    startedAt: "2026-10-29 13:30",
    endedAt: "2026-10-29 15:30",
    durationMinutes: 120,
    durationHours: 2.0,
    date: "2026-10-29",
    note: "Analyse des traces SQL HANA et identification du point de blocage sur lettrage."
  },

  // 2. Sessions de la Semaine en cours (2026-10-26 à 2026-10-28 - Hebdomadaire)
  {
    id: "log-3",
    ticketId: "tix-1",
    ticketReference: "ADD-2026-0001",
    ticketTitle: "Addon Validation Commandes Fournisseurs SAP B1",
    clientCompany: "Safir Consulting (Consulting Interne)",
    developerId: "dev-anoop",
    developerName: "Anoop Pandimukkula",
    developerEmail: "anoop.pandimukkula@safirconsulting.net",
    startedAt: "2026-10-28 09:00",
    endedAt: "2026-10-28 13:30",
    durationMinutes: 270,
    durationHours: 4.5,
    date: "2026-10-28",
    note: "Intégration du DI API et mise en place des triggers de seuil à 10 000 000 FCFA."
  },
  {
    id: "log-4",
    ticketId: "tix-1",
    ticketReference: "ADD-2026-0001",
    ticketTitle: "Addon Validation Commandes Fournisseurs SAP B1",
    clientCompany: "Safir Consulting (Consulting Interne)",
    developerId: "dev-hassane",
    developerName: "Hassane Bocoum",
    developerEmail: "hassane.bocoum@safirconsulting.net",
    startedAt: "2026-10-28 10:00",
    endedAt: "2026-10-28 12:00",
    durationMinutes: 120,
    durationHours: 2.0,
    date: "2026-10-28",
    note: "Création des tables et schémas HANA pour l'historique d'approbation."
  },
  {
    id: "log-5",
    ticketId: "tix-2",
    ticketReference: "INT-2026-0002",
    ticketTitle: "Passerelle Import Factures Dématérialisées Service Layer",
    clientCompany: "Omega Distribution",
    developerId: "dev-moha",
    developerName: "Moha Dicko",
    developerEmail: "mohadicko95@gmail.com",
    startedAt: "2026-10-27 09:00",
    endedAt: "2026-10-27 15:00",
    durationMinutes: 360,
    durationHours: 6.0,
    date: "2026-10-27",
    note: "Configuration des endpoints REST Service Layer et parsing des flux PDF entrants."
  },
  {
    id: "log-6",
    ticketId: "tix-1",
    ticketReference: "ADD-2026-0001",
    ticketTitle: "Addon Validation Commandes Fournisseurs SAP B1",
    clientCompany: "Safir Consulting (Consulting Interne)",
    developerId: "dev-anoop",
    developerName: "Anoop Pandimukkula",
    developerEmail: "anoop.pandimukkula@safirconsulting.net",
    startedAt: "2026-10-26 14:00",
    endedAt: "2026-10-26 18:00",
    durationMinutes: 240,
    durationHours: 4.0,
    date: "2026-10-26",
    note: "Revue du cahier des charges fonctionnel soumis par Mélissa et démarrage maquette."
  },

  // 3. Sessions du Mois (Octobre 2026 - Mensuel & T4)
  {
    id: "log-7",
    ticketId: "tix-1",
    ticketReference: "ADD-2026-0001",
    ticketTitle: "Addon Validation Commandes Fournisseurs SAP B1",
    clientCompany: "Safir Consulting (Consulting Interne)",
    developerId: "dev-anoop",
    developerName: "Anoop Pandimukkula",
    developerEmail: "anoop.pandimukkula@safirconsulting.net",
    startedAt: "2026-10-20 09:00",
    endedAt: "2026-10-20 16:00",
    durationMinutes: 420,
    durationHours: 7.0,
    date: "2026-10-20",
    note: "POC initial de validation des flux d'achats sous SAP B1 v10."
  },
  {
    id: "log-8",
    ticketId: "tix-2",
    ticketReference: "INT-2026-0002",
    ticketTitle: "Passerelle Import Factures Dématérialisées Service Layer",
    clientCompany: "Omega Distribution",
    developerId: "dev-moha",
    developerName: "Moha Dicko",
    developerEmail: "mohadicko95@gmail.com",
    startedAt: "2026-10-18 09:00",
    endedAt: "2026-10-18 17:00",
    durationMinutes: 480,
    durationHours: 8.0,
    date: "2026-10-18",
    note: "Architecture Service Layer et validation protocole d'échange sécurisé."
  },

  // 4. Sessions Trimestrielles & Semestrielles (T3 / S2 : Août & Septembre 2026)
  {
    id: "log-9",
    ticketId: "tix-hist-1",
    ticketReference: "REP-2026-0000",
    ticketTitle: "Vues Analytiques de Clôture Mensuelle SAP HANA",
    clientCompany: "Société Nouvelle Industrie",
    developerId: "dev-anoop",
    developerName: "Anoop Pandimukkula",
    developerEmail: "anoop.pandimukkula@safirconsulting.net",
    startedAt: "2026-09-15 09:00",
    endedAt: "2026-09-15 17:00",
    durationMinutes: 480,
    durationHours: 8.0,
    date: "2026-09-15",
    note: "Optimisation des requêtes HANA SQLScript pour le reporting de stock."
  },
  {
    id: "log-10",
    ticketId: "tix-hist-2",
    ticketReference: "INT-2026-0000",
    ticketTitle: "Connecteur WMS Logistique SAP B1",
    clientCompany: "Client Alpha",
    developerId: "dev-anoop",
    developerName: "Anoop Pandimukkula",
    developerEmail: "anoop.pandimukkula@safirconsulting.net",
    startedAt: "2026-08-10 09:00",
    endedAt: "2026-08-10 16:30",
    durationMinutes: 450,
    durationHours: 7.5,
    date: "2026-08-10",
    note: "Déploiement connecteur entrées/sorties de stock temps réel."
  },

  // 5. Sessions Annuelles (S1 2026 : Mars & Avril 2026)
  {
    id: "log-11",
    ticketId: "tix-hist-3",
    ticketReference: "ADD-2026-0000",
    ticketTitle: "Migration Base SAP B1 SQL vers SAP HANA 2.0",
    clientCompany: "Omega Distribution",
    developerId: "dev-anoop",
    developerName: "Anoop Pandimukkula",
    developerEmail: "anoop.pandimukkula@safirconsulting.net",
    startedAt: "2026-04-12 09:00",
    endedAt: "2026-04-12 17:00",
    durationMinutes: 480,
    durationHours: 8.0,
    date: "2026-04-12",
    note: "Recette technique de migration et validation des types de données HANA."
  },

  // 6. Sessions Nevrit Ahua (Intégration API & Procédures SQLScript)
  {
    id: "log-12",
    ticketId: "tix-3",
    ticketReference: "MIG-2026-0003",
    ticketTitle: "Migration Procédures Stock SQL vers HANA SQLScript",
    clientCompany: "SGI Distribution",
    developerId: "dev-nevrit",
    developerName: "Nevrit Ahua",
    developerEmail: "nevrit.ahua@safirconsulting.net",
    startedAt: "2026-10-29 08:30",
    endedAt: "2026-10-29 11:30",
    durationMinutes: 180,
    durationHours: 3.0,
    date: "2026-10-29",
    note: "Refactoring des curseurs T-SQL en syntaxe déclarative SQLScript HANA."
  },
  {
    id: "log-13",
    ticketId: "tix-3",
    ticketReference: "MIG-2026-0003",
    ticketTitle: "Migration Procédures Stock SQL vers HANA SQLScript",
    clientCompany: "SGI Distribution",
    developerId: "dev-nevrit",
    developerName: "Nevrit Ahua",
    developerEmail: "nevrit.ahua@safirconsulting.net",
    startedAt: "2026-10-27 10:00",
    endedAt: "2026-10-27 15:00",
    durationMinutes: 300,
    durationHours: 5.0,
    date: "2026-10-27",
    note: "Benchmark des temps d'exécution des procédures stockées sur HANA."
  },

  // 7. Sessions Fatoumata Traore (Développeuse SAP B1 & Service Layer)
  {
    id: "log-14",
    ticketId: "tix-2",
    ticketReference: "INT-2026-0002",
    ticketTitle: "Passerelle Import Factures Dématérialisées Service Layer",
    clientCompany: "Omega Distribution",
    developerId: "dev-fatoumata",
    developerName: "Fatoumata Traore",
    developerEmail: "fatoumata.traore@safirconsulting.net",
    startedAt: "2026-10-29 09:00",
    endedAt: "2026-10-29 12:00",
    durationMinutes: 180,
    durationHours: 3.0,
    date: "2026-10-29",
    note: "Validation des schémas JSON et gestion des retours d'erreurs HTTP."
  },
  {
    id: "log-15",
    ticketId: "tix-2",
    ticketReference: "INT-2026-0002",
    ticketTitle: "Passerelle Import Factures Dématérialisées Service Layer",
    clientCompany: "Omega Distribution",
    developerId: "dev-fatoumata",
    developerName: "Fatoumata Traore",
    developerEmail: "fatoumata.traore@safirconsulting.net",
    startedAt: "2026-10-26 13:30",
    endedAt: "2026-10-26 17:30",
    durationMinutes: 240,
    durationHours: 4.0,
    date: "2026-10-26",
    note: "Tests d'intégration Service Layer avec le système de facturation client."
  },

  // 8. Sessions Korotoumou Thiam (Backend & Modélisation Base de Données)
  {
    id: "log-16",
    ticketId: "tix-1",
    ticketReference: "ADD-2026-0001",
    ticketTitle: "Addon Validation Commandes Fournisseurs SAP B1",
    clientCompany: "Safir Consulting (Consulting Interne)",
    developerId: "dev-korotoumou",
    developerName: "Korotoumou Thiam",
    developerEmail: "korotoumou.thiam@safirconsulting.net",
    startedAt: "2026-10-29 10:00",
    endedAt: "2026-10-29 12:00",
    durationMinutes: 120,
    durationHours: 2.0,
    date: "2026-10-29",
    note: "Modélisation des tables d'historisation et indexation PostgreSQL."
  },
  {
    id: "log-17",
    ticketId: "tix-1",
    ticketReference: "ADD-2026-0001",
    ticketTitle: "Addon Validation Commandes Fournisseurs SAP B1",
    clientCompany: "Safir Consulting (Consulting Interne)",
    developerId: "dev-korotoumou",
    developerName: "Korotoumou Thiam",
    developerEmail: "korotoumou.thiam@safirconsulting.net",
    startedAt: "2026-10-28 14:00",
    endedAt: "2026-10-28 18:00",
    durationMinutes: 240,
    durationHours: 4.0,
    date: "2026-10-28",
    note: "Configuration des triggers d'audit et politiques de rétention."
  },

  // 9. Sessions Jean-Philippe Ebrottié (Architecte SAP & Revue Technique)
  {
    id: "log-18",
    ticketId: "tix-1",
    ticketReference: "ADD-2026-0001",
    ticketTitle: "Addon Validation Commandes Fournisseurs SAP B1",
    clientCompany: "Safir Consulting (Consulting Interne)",
    developerId: "dev-jeanphilippe",
    developerName: "Jean-Philippe Ebrottié",
    developerEmail: "jeanphilippe.ebrottie@safirconsulting.net",
    startedAt: "2026-10-29 08:00",
    endedAt: "2026-10-29 11:30",
    durationMinutes: 210,
    durationHours: 3.5,
    date: "2026-10-29",
    note: "Revue d'architecture globale et validation de la conformité SDK SAP B1."
  },
  {
    id: "log-19",
    ticketId: "tix-1",
    ticketReference: "ADD-2026-0001",
    ticketTitle: "Addon Validation Commandes Fournisseurs SAP B1",
    clientCompany: "Safir Consulting (Consulting Interne)",
    developerId: "dev-jeanphilippe",
    developerName: "Jean-Philippe Ebrottié",
    developerEmail: "jeanphilippe.ebrottie@safirconsulting.net",
    startedAt: "2026-10-27 09:00",
    endedAt: "2026-10-27 14:00",
    durationMinutes: 300,
    durationHours: 5.0,
    date: "2026-10-27",
    note: "Audit de sécurité des connecteurs externes et des flux de données."
  }
];

// État Temps Réel initial de l'activité de l'équipe des Développeurs (Supervision Direction Aliko)
const INITIAL_DEV_LIVE_ACTIVITIES: Record<string, DeveloperLiveActivity> = {
  "dev-anoop": {
    developerId: "dev-anoop",
    status: "WORKING",
    activeTicketId: "tix-1",
    activeTicketReference: "ADD-2026-0001",
    activeTicketTitle: "Addon Validation Commandes Fournisseurs SAP B1",
    clientCompany: "Safir Consulting (Consulting Interne)",
    currentTaskDescription: "Développement du formulaire UI API SAP B1 pour validation multi-devises",
    startedAtTimestamp: Date.now() - (1 * 3600 + 42 * 60 + 15) * 1000,
    elapsedSeconds: 1 * 3600 + 42 * 60 + 15
  },
  "dev-moha": {
    developerId: "dev-moha",
    status: "WORKING",
    activeTicketId: "tix-2",
    activeTicketReference: "INT-2026-0002",
    activeTicketTitle: "Passerelle Import Factures Dématérialisées Service Layer",
    clientCompany: "Omega Distribution",
    currentTaskDescription: "Configuration des endpoints REST Service Layer & tests de payload JSON",
    startedAtTimestamp: Date.now() - (2 * 3600 + 15 * 60 + 30) * 1000,
    elapsedSeconds: 2 * 3600 + 15 * 60 + 30
  },
  "dev-hassane": {
    developerId: "dev-hassane",
    status: "BLOCKED",
    activeTicketId: "tix-1",
    activeTicketReference: "ADD-2026-0001",
    activeTicketTitle: "Addon Validation Commandes Fournisseurs SAP B1",
    clientCompany: "Safir Consulting (Consulting Interne)",
    currentTaskDescription: "Schémas HANA tables UDF (en attente précision consultante)",
    startedAtTimestamp: Date.now() - (35 * 60) * 1000,
    elapsedSeconds: 35 * 60
  },
  "dev-nevrit": {
    developerId: "dev-nevrit",
    status: "WORKING",
    activeTicketId: "tix-3",
    activeTicketReference: "MIG-2026-0003",
    activeTicketTitle: "Migration Procédures Stock SQL vers HANA SQLScript",
    clientCompany: "SGI Distribution",
    currentTaskDescription: "Refactoring des curseurs T-SQL en syntaxe déclarative SQLScript HANA",
    startedAtTimestamp: Date.now() - (54 * 60 + 12) * 1000,
    elapsedSeconds: 54 * 60 + 12
  },
  "dev-fatoumata": {
    developerId: "dev-fatoumata",
    status: "AVAILABLE",
    currentTaskDescription: "Disponible pour affectation — Tests QA Service Layer validés avec succès",
    elapsedSeconds: 0
  },
  "dev-korotoumou": {
    developerId: "dev-korotoumou",
    status: "AVAILABLE",
    currentTaskDescription: "Disponible pour affectation — Capacité libre : 26.0 h",
    elapsedSeconds: 0
  },
  "dev-jeanphilippe": {
    developerId: "dev-jeanphilippe",
    status: "AVAILABLE",
    currentTaskDescription: "Disponible pour affectation — Capacité libre : 16.0 h (Architecte SAP)",
    elapsedSeconds: 0
  }
};

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

  // Modale Rejet de Recette & Renvoi en développement par la Consultante
  const [rejectingTicket, setRejectingTicket] = useState<Ticket | null>(null);
  const [rejectionReasonText, setRejectionReasonText] = useState("");
  const [rejectionAdditionalHours, setRejectionAdditionalHours] = useState<number>(8);

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

  // Filtres Rapides Espace Développeur (Recherche Projet & Client / Entreprise)
  const [devSearchQuery, setDevSearchQuery] = useState("");
  const [devCompanyFilter, setDevCompanyFilter] = useState("ALL");

  // Chronomètre / Compteur de Temps de Travail Actif (Règle Mono-Tâche Stricte)
  const [activeTimerTicketId, setActiveTimerTicketId] = useState<string | null>(null);
  const [timerStartedAt, setTimerStartedAt] = useState<number | null>(null);
  const [activeTimerSeconds, setActiveTimerSeconds] = useState<number>(0);
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>(INITIAL_TIME_LOGS);

  // Modale d'Impression des Rapports d'Activité & Feuilles de Temps (Développeurs & Consultants)
  const [printingReport, setPrintingReport] = useState<{
    targetType: "DEVELOPER" | "CONSULTANT";
    targetId: string;
    targetName: string;
    targetEmail: string;
    role: string;
    jobTitle?: string;
  } | null>(null);
  const [reportPeriod, setReportPeriod] = useState<"DAILY" | "WEEKLY" | "MONTHLY" | "QUARTERLY" | "SEMESTER" | "YEARLY">("WEEKLY");

  // Supervision en Temps Réel de l'Activité des Développeurs (Live Activity Monitor pour Aliko)
  const [devLiveActivities, setDevLiveActivities] = useState<Record<string, DeveloperLiveActivity>>(INITIAL_DEV_LIVE_ACTIVITIES);
  const [liveSupervisionFilter, setLiveSupervisionFilter] = useState<"ALL" | "WORKING" | "BLOCKED" | "AVAILABLE">("ALL");
  const [liveSupervisionSearch, setLiveSupervisionSearch] = useState("");

  // Langue Bilingue (FR / EN) & Mode d'Affichage (Light / Dark)
  const [appLang, setAppLang] = useState<"fr" | "en">("fr");
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");
  const tr = (fr: string, en: string) => (appLang === "en" ? en : fr);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark-theme", themeMode === "dark");
      document.documentElement.lang = appLang;
    }
  }, [themeMode, appLang]);

  // Traducteur automatique des noeuds texte profonds (Tableaux, Statuts, Modales, Rapports) FR <-> EN
  const originalTextMapRef = useRef<WeakMap<Node, string>>(new WeakMap());
  useEffect(() => {
    if (typeof document === "undefined") return;
    const FR_TO_EN_PHRASES: Array<[string, string]> = [
      ["Tickets en cours", "Active Tickets"],
      ["Demandes de développement actives", "Active development requests"],
      ["Capacité disponible", "Available Capacity"],
      ["Heures de développement libres cette semaine", "Free development hours this week"],
      ["Alertes Blocage", "Blocker Alerts"],
      ["Développeurs arrêtés en attente d'arbitrage", "Developers paused awaiting arbitration"],
      ["Guichet Central Demandes", "Central Request Hub"],
      ["Demandes In-App soumises à qualifier par Aliko", "In-App requests awaiting Aliko's qualification"],
      ["Supervision de l'Activité des Développeurs en Direct", "Live Developer Activity Supervision"],
      ["LIVE TEMPS RÉEL", "REAL-TIME LIVE"],
      ["En production :", "Working:"],
      ["Bloqué (Stop-the-line) :", "Blocked (Stop-the-line):"],
      ["Disponible :", "Available:"],
      ["Imprimer son rapport", "Print Report"],
      ["Imprimer mon rapport d'heures", "Print My Timesheet Report"],
      ["Voir projet", "View Project"],
      ["Suivre", "Track"],
      ["Affecter", "Assign"],
      ["Réaffecter", "Reassign"],
      ["Nouveau ticket", "New Ticket"],
      ["Tableau de bord", "Dashboard"],
      ["Tous les Tickets SAP", "All SAP Tickets"],
      ["Équipe & Capacité", "Team & Capacity"],
      ["Mon Espace Développeur", "My Developer Workspace"],
      ["Mes Demandes Émises", "My Submitted Requests"],
      ["Déconnexion", "Sign Out"],
      ["En cours", "In Progress"],
      ["Bloqué", "Blocked"],
      ["Livré (En Recette)", "Delivered (In UAT)"],
      ["Clôturé", "Closed"],
      ["Prêt à affecter", "Ready to Assign"],
      ["Assigné", "Assigned"],
      ["Envoyer en test chez le consultant", "Send to Consultant for Testing"],
      ["Tester & Approuver la Recette (Conforme)", "Test & Approve UAT (Compliant)"],
      ["Renvoyer à l'Équipe Dév (Problème / Anomalie)", "Return to Dev Team (Issue / Defect)"],
      ["Valider la Clôture Définitive (Recette Approuvée)", "Validate Final Closure (UAT Approved)"],
      ["Clôturer le Ticket (Réglé)", "Close Ticket (Resolved)"],
      ["Télécharger CSV / Excel", "Download CSV / Excel"],
      ["Synthèse Comité Direction", "Executive Committee Summary"],
      ["Fermer", "Close"],
      ["Annuler", "Cancel"],
    ];

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    let current = walker.nextNode();
    while (current) {
      const parentEl = (current as Text).parentElement;
      if (!parentEl?.closest("[data-no-i18n='true']")) {
        nodes.push(current as Text);
      }
      current = walker.nextNode();
    }

    for (const node of nodes) {
      const val = node.nodeValue;
      if (!val || !val.trim()) continue;
      if (!originalTextMapRef.current.has(node)) {
        const matchesAny = FR_TO_EN_PHRASES.some(([frStr]) => val.includes(frStr));
        if (!matchesAny) continue;
        originalTextMapRef.current.set(node, val);
      }
      const orig = originalTextMapRef.current.get(node);
      if (!orig) continue;
      if (appLang === "fr") {
        if (node.nodeValue !== orig) {
          node.nodeValue = orig;
        }
      } else {
        let translated = orig;
        for (const [frStr, enStr] of FR_TO_EN_PHRASES) {
          if (translated.includes(frStr)) {
            translated = translated.split(frStr).join(enStr);
          }
        }
        if (node.nodeValue !== translated) {
          node.nodeValue = translated;
        }
      }
    }
  }, [appLang, activeTab, currentUser, showCreateModal, supervisingTicket, discussingTicket, printingReport, showReportModal]);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = (msg: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 4500);
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

  // Cloisonnement strict RBAC : verrouillage automatique et étanche de l'espace selon le rôle connecté
  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === "DEVELOPER") {
      if (activeTab !== "my-tickets") {
        setActiveTab("my-tickets");
      }
    } else if (currentUser.role === "CONSULTANT") {
      if (activeTab !== "my-demands") {
        setActiveTab("my-demands");
      }
    } else if (currentUser.role === "HEAD") {
      if (activeTab === "my-tickets" || activeTab === "my-demands") {
        setActiveTab("dashboard");
      }
    }
  }, [currentUser?.role, activeTab]);

  // Navigation avec contrôle d'accès strict (aucun rôle ne peut naviguer vers l'espace d'un autre)
  const handleTabChange = (tab: "dashboard" | "tickets" | "developers" | "inbox" | "my-tickets" | "my-demands") => {
    if (!currentUser) return;
    if (currentUser.role === "HEAD") {
      if (tab === "my-tickets" || tab === "my-demands") {
        showToast("Accès refusé : Le portail Développeur et Consultant est strictement réservé à leurs titulaires (Cloisonnement RBAC).");
        return;
      }
    } else if (currentUser.role === "DEVELOPER") {
      if (tab !== "my-tickets") {
        showToast("Accès refusé : Votre compte Développeur n'a pas accès au portail Direction ou Consultant.");
        return;
      }
    } else if (currentUser.role === "CONSULTANT") {
      if (tab !== "my-demands") {
        showToast("Accès refusé : Votre compte Consultant n'a pas accès au portail Direction ou Développeur.");
        return;
      }
    }
    setActiveTab(tab);
  };

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

  // Entreprises clientes distinctes pour les tickets du développeur
  const devCompanies = useMemo(() => {
    const list = new Set<string>();
    myAssignedTickets.forEach((t) => {
      if (t.clientCompany) list.add(t.clientCompany);
    });
    return Array.from(list);
  }, [myAssignedTickets]);

  // Tickets filtrés du développeur selon recherche (projet/titre/référence) et filtre d'entreprise
  const filteredDevTickets = useMemo(() => {
    return myAssignedTickets.filter((t) => {
      const q = devSearchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.reference.toLowerCase().includes(q) ||
        (t.clientCompany && t.clientCompany.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q));

      const matchesCompany =
        devCompanyFilter === "ALL" || t.clientCompany === devCompanyFilter;

      return matchesSearch && matchesCompany;
    });
  }, [myAssignedTickets, devSearchQuery, devCompanyFilter]);

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

  // Timer en direct pour la session de travail active et la supervision temps réel de l'équipe
  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Incrément du compteur de la session individuelle si connecté en développeur et non en pause
      if (activeTimerTicketId && !isTimerPaused) {
        setActiveTimerSeconds((prev) => prev + 1);
      }

      // 2. Incrément temps réel pour tous les développeurs au statut WORKING dans la supervision d'Aliko
      setDevLiveActivities((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const devId in next) {
          if (next[devId]?.status === "WORKING") {
            next[devId] = {
              ...next[devId],
              elapsedSeconds: (next[devId].elapsedSeconds || 0) + 1
            };
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimerTicketId, isTimerPaused]);

  const formatTimer = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Démarrer le chronomètre de travail sur un ticket (Règle mono-tâche stricte)
  const handleStartTimer = (ticket: Ticket) => {
    if (ticket.status === "BLOCKED") {
      showToast("Impossible de démarrer le compteur sur un ticket bloqué. Vous devez d'abord lever le blocage.");
      return;
    }

    // Règle de non-cumul stricte : si un autre ticket est déjà en cours de chrono, l'arrêter et le consigner
    if (activeTimerTicketId && activeTimerTicketId !== ticket.id) {
      const currentActive = tickets.find((t) => t.id === activeTimerTicketId);
      handleStopTimer(activeTimerTicketId, "Basculement automatique de tâche (règle mono-tâche)");
      showToast(`Chronomètre précédent clôturé (${currentActive?.reference || "Tâche"}). Démarrage sur ${ticket.reference}.`);
    }

    setActiveTimerTicketId(ticket.id);
    setTimerStartedAt(Date.now());
    setActiveTimerSeconds(0);
    setIsTimerPaused(false);

    // Basculer le ticket en cours de développement s'il était simplement Assigné
    if (ticket.status === "ASSIGNED") {
      setTickets((prev) =>
        prev.map((t) => (t.id === ticket.id ? { ...t, status: "IN_PROGRESS" } : t))
      );
    }

    // Mettre à jour l'activité temps réel du développeur dans la supervision d'Aliko
    const currentDevId = currentUser?.developerId || currentUser?.id || "dev-anoop";
    setDevLiveActivities((prev) => ({
      ...prev,
      [currentDevId]: {
        developerId: currentDevId,
        status: "WORKING",
        activeTicketId: ticket.id,
        activeTicketReference: ticket.reference,
        activeTicketTitle: ticket.title,
        clientCompany: ticket.clientCompany || "Safir Consulting",
        currentTaskDescription: `Développement en cours sur ${ticket.title}`,
        startedAtTimestamp: Date.now(),
        elapsedSeconds: 0
      }
    }));

    showToast(`⏱️ Compteur démarré sur ${ticket.reference} — Règle mono-tâche stricte activée.`);
  };

  // Mettre en pause temporaire ou reprendre le chronomètre actif sans clôturer la session
  const handleTogglePauseTimer = () => {
    if (!activeTimerTicketId) return;
    const activeT = tickets.find((t) => t.id === activeTimerTicketId);
    const nextPaused = !isTimerPaused;
    setIsTimerPaused(nextPaused);
    showToast(
      nextPaused
        ? `⏸️ Chronomètre mis en pause sur ${activeT?.reference || "le ticket"} (${formatTimer(activeTimerSeconds)}).`
        : `▶️ Chronomètre repris sur ${activeT?.reference || "le ticket"}.`
    );
  };

  // Arrêter le compteur de travail et enregistrer la feuille de temps
  const handleStopTimer = (ticketId: string, note?: string) => {
    const target = tickets.find((t) => t.id === ticketId);
    const currentDevId = currentUser?.developerId || currentUser?.id || "dev-anoop";

    if (!target) {
      setActiveTimerTicketId(null);
      setTimerStartedAt(null);
      setActiveTimerSeconds(0);
      setIsTimerPaused(false);
      setDevLiveActivities((prev) => ({
        ...prev,
        [currentDevId]: {
          developerId: currentDevId,
          status: "AVAILABLE",
          currentTaskDescription: "Disponible pour affectation",
          elapsedSeconds: 0
        }
      }));
      return;
    }

    const sec = activeTimerSeconds;
    const minutes = Math.max(1, Math.round(sec / 60));
    const hours = Math.max(0.1, Math.round((minutes / 60) * 10) / 10);
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const timeStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

    const newLog: TimeLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ticketId: target.id,
      ticketReference: target.reference,
      ticketTitle: target.title,
      clientCompany: target.clientCompany || "Safir Consulting",
      developerId: currentDevId,
      developerName: currentUser?.name || "Anoop Pandimukkula",
      developerEmail: currentUser?.email || "anoop.pandimukkula@safirconsulting.net",
      startedAt: `${todayStr} ${timeStr}`,
      endedAt: `${todayStr} ${timeStr}`,
      durationMinutes: minutes,
      durationHours: hours,
      date: todayStr,
      note: note || `Session de travail enregistrée sur ${target.reference}`
    };

    setTimeLogs((prev) => [newLog, ...prev]);

    // Mettre à jour le RAF du ticket
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          const currentRaf = t.remainingHours ?? t.estimatedHours;
          const newRaf = Math.max(0, Math.round((currentRaf - hours) * 10) / 10);
          return {
            ...t,
            remainingHours: newRaf
          };
        }
        return t;
      })
    );

    setActiveTimerTicketId(null);
    setTimerStartedAt(null);
    setActiveTimerSeconds(0);
    setIsTimerPaused(false);

    // Mettre à jour la supervision temps réel d'Aliko en statut disponible
    setDevLiveActivities((prev) => ({
      ...prev,
      [currentDevId]: {
        developerId: currentDevId,
        status: "AVAILABLE",
        currentTaskDescription: `Dernière tâche terminée : ${target.reference} (+${hours} h)`,
        elapsedSeconds: 0
      }
    }));

    showToast(`⏱️ Session enregistrée sur ${target.reference} : +${hours} h (+${minutes} min) ajoutées à votre relevé d'heures.`);
  };

  // Actions métier Développeur : Déclarer un blocage
  const handleDeclareBlocker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockingTicket || !blockerReasonText.trim()) return;

    const currentDevId = currentUser?.developerId || currentUser?.id || "dev-anoop";

    // Règle d'or : Mise en pause automatique immédiate du compteur de temps en cas de blocage
    if (activeTimerTicketId === blockingTicket.id) {
      handleStopTimer(blockingTicket.id, "Mise en pause automatique : Blocage technique signalé");
      showToast("⏱️ Compteur de temps mis en pause automatiquement : vous ne pouvez pas décompter du temps sur un ticket bloqué.");
    }

    setDevLiveActivities((prev) => ({
      ...prev,
      [currentDevId]: {
        ...(prev[currentDevId] || { developerId: currentDevId, elapsedSeconds: 0 }),
        status: "BLOCKED",
        activeTicketId: blockingTicket.id,
        activeTicketReference: blockingTicket.reference,
        activeTicketTitle: blockingTicket.title,
        clientCompany: blockingTicket.clientCompany || "Safir Consulting",
        currentTaskDescription: `Blocage signalé : ${blockerReasonText.trim()}`
      }
    }));

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

  // Action Développeur : Envoyer en test chez le consultant (Livraison pour recette)
  const handleDeliverTicket = (ticketId: string) => {
    // Si le compteur était actif sur ce ticket, l'arrêter et consigner le temps
    if (activeTimerTicketId === ticketId) {
      handleStopTimer(ticketId, "Clôture de session lors de l'envoi en test");
    }

    const target = tickets.find((t) => t.id === ticketId);
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status: "DELIVERED",
              remainingHours: 0,
              consultantReviewStatus: "PENDING"
            }
          : t
      )
    );
    if (target) {
      pushInAppNotification({
        title: `📦 Ticket ${target.reference} envoyé en test chez le consultant`,
        message: `${currentUser?.name || "Le développeur"} a terminé les développements de « ${target.title} » et l'a envoyé en test chez le consultant (${target.applicantName || "Mélissa Diakité"}).`,
        category: "DELIVERY",
        targetRoles: ["HEAD", "CONSULTANT"],
        ticketId: target.id,
        ticketReference: target.reference,
        actorName: currentUser?.name || "Développeur SAP"
      });
    }
    showToast("Ticket envoyé en test chez le consultant — Recette fonctionnelle ouverte");
  };

  // Action Consultante : Tester & Approuver la recette (Solution conforme & validée)
  const handleApproveTicketByConsultant = (ticketId: string) => {
    const target = tickets.find((t) => t.id === ticketId);
    if (!target) return;

    const approvalDate = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

    const autoMessage: TicketMessage = {
      id: `msg-${Date.now()}`,
      authorName: currentUser?.name || "Mélissa Diakité",
      authorRole: "CONSULTANT",
      authorEmail: currentUser?.email || "melissa.diakite@safirconsulting.net",
      message: `✅ Recette fonctionnelle SAP validée avec succès par ${currentUser?.name || "la consultante"}. La solution a été testée et certifiée conforme aux spécifications métier. Le ticket est désormais transmis à Aliko Getheme pour clôture définitive.`,
      timestamp: `Aujourd'hui à ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`,
      isConsultantReply: true
    };

    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              consultantReviewStatus: "APPROVED",
              consultantReviewDate: approvalDate,
              messages: [...(t.messages || []), autoMessage]
            }
          : t
      )
    );

    pushInAppNotification({
      title: `✅ Recette Approuvée par la Consultante (${target.reference})`,
      message: `${currentUser?.name || "Mélissa Diakité"} a testé et approuvé la conformité de « ${target.title} ». Aliko Getheme est désormais habilité à prononcer la clôture définitive.`,
      category: "DELIVERY",
      targetRoles: ["HEAD", "DEVELOPER"],
      ticketId: target.id,
      ticketReference: target.reference,
      actorName: currentUser?.name || "Mélissa Diakité"
    });

    showToast("✅ Recette approuvée ! Ticket transmis à Aliko Getheme pour validation de clôture.");
  };

  // Action Consultante : Rejeter la recette & Renvoyer en développement avec motif d'anomalie
  const handleRejectTicketByConsultant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingTicket) return;

    const reason = rejectionReasonText.trim();
    if (!reason) {
      showToast("Le motif de l'anomalie constatée lors du test est obligatoire.");
      return;
    }

    const addHours = Number(rejectionAdditionalHours) || 8;
    const targetId = rejectingTicket.id;
    const targetRef = rejectingTicket.reference;
    const targetTitle = rejectingTicket.title;

    const autoMessage: TicketMessage = {
      id: `msg-${Date.now()}`,
      authorName: currentUser?.name || "Mélissa Diakité",
      authorRole: "CONSULTANT",
      authorEmail: currentUser?.email || "melissa.diakite@safirconsulting.net",
      message: `❌ Recette non conforme — Renvoyé en développement par ${currentUser?.name || "la consultante"} :\n« ${reason} »\nCharge complémentaire estimée : ${addHours} h.`,
      timestamp: `Aujourd'hui à ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`,
      isBlockerQuestion: true
    };

    setTickets((prev) =>
      prev.map((t) =>
        t.id === targetId
          ? {
              ...t,
              status: "IN_PROGRESS",
              remainingHours: addHours,
              consultantReviewStatus: "REJECTED",
              rejectionReason: reason,
              messages: [...(t.messages || []), autoMessage]
            }
          : t
      )
    );

    // Mettre à jour la capacité du développeur assigné
    if (rejectingTicket.assignedDeveloper?.id) {
      setDevelopers((prev) =>
        prev.map((d) => {
          if (d.id === rejectingTicket.assignedDeveloper?.id) {
            const newRes = d.reservedHours + addHours;
            return {
              ...d,
              reservedHours: newRes,
              freeHours: Math.max(0, d.freeHours - addHours),
              loadPercentage: Math.min(100, Math.round((newRes / d.netWeeklyHours) * 100))
            };
          }
          return d;
        })
      );
    }

    pushInAppNotification({
      title: `🚨 Recette rejetée sur ${targetRef} — Renvoyé aux Développeurs`,
      message: `${currentUser?.name || "Mélissa Diakité"} a rejeté la recette : « ${reason} ». Le ticket a été renvoyé en cours de développement avec ${addHours}h de reprise.`,
      category: "DELIVERY",
      targetRoles: ["HEAD", "DEVELOPER"],
      ticketId: targetId,
      ticketReference: targetRef,
      actorName: currentUser?.name || "Mélissa Diakité"
    });

    showToast(`Ticket ${targetRef} renvoyé en développement avec vos observations de recette`);
    setRejectingTicket(null);
    setRejectionReasonText("");
    setRejectionAdditionalHours(8);
  };

  // Action Direction (Aliko HEAD) : Clôture définitive du ticket — EXCLUSIVEMENT après approbation par la consultante
  const handleCloseTicket = (ticketId: string) => {
    const target = tickets.find((t) => t.id === ticketId);
    if (!target) return;

    if (target.consultantReviewStatus !== "APPROVED") {
      showToast("Clôture impossible : La consultante doit d'abord tester et approuver la recette de la solution.");
      return;
    }

    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? { ...t, status: "CLOSED", remainingHours: 0 }
          : t
      )
    );

    pushInAppNotification({
      title: `✓ Clôture Définitive validée par Aliko (${target.reference})`,
      message: `Aliko Getheme a validé et clôturé définitivement le ticket « ${target.title} » suite à l'approbation de la recette par la consultante.`,
      category: "CLOSURE",
      targetRoles: ["HEAD", "DEVELOPER", "CONSULTANT"],
      ticketId: target.id,
      ticketReference: target.reference,
      actorName: "Aliko Getheme"
    });

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
    setDevLiveActivities((prev) => ({
      ...prev,
      [newDevObj.id]: {
        developerId: newDevObj.id,
        status: "AVAILABLE",
        currentTaskDescription: "Nouveau collaborateur intégré — Disponible pour affectation",
        elapsedSeconds: 0
      }
    }));
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
      return { pct: 100, label: "✓ Réglé & Clôturé (Aliko)", barClass: "bg-emerald-600", badgeClass: "text-emerald-700 bg-emerald-50 border-emerald-300" };
    }
    if (ticket.status === "DELIVERED") {
      if (ticket.consultantReviewStatus === "APPROVED") {
        return { pct: 95, label: "✅ Recette Validée (Attente Clôture Aliko)", barClass: "bg-emerald-500", badgeClass: "text-emerald-800 bg-emerald-50 border-emerald-300" };
      }
      return { pct: 90, label: "🧪 Recette & Test Consultant en cours", barClass: "bg-teal-500", badgeClass: "text-teal-800 bg-teal-50 border-teal-300 animate-pulse" };
    }
    if (ticket.status === "BLOCKED") {
      const est = ticket.estimatedHours || 1;
      const rem = ticket.remainingHours !== undefined ? ticket.remainingHours : est;
      const done = Math.max(0, Math.min(est, est - rem));
      const pct = Math.min(95, Math.max(10, Math.round((done / est) * 100)));
      return { pct, label: `🚨 Bloqué (${pct}%)`, barClass: "bg-rose-500", badgeClass: "text-rose-700 bg-rose-50 border-rose-300" };
    }
    if (ticket.status === "IN_PROGRESS") {
      if (ticket.consultantReviewStatus === "REJECTED") {
        return { pct: 60, label: "🔄 En correction (Anomalie Recette)", barClass: "bg-amber-500", badgeClass: "text-amber-800 bg-amber-50 border-amber-300" };
      }
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
      return { pct: 5, label: "Qualifié par Aliko", barClass: "bg-slate-300", badgeClass: "text-slate-600 bg-slate-100 border-slate-200" };
    }
    return { pct: 0, label: "Reçu au Guichet", barClass: "bg-slate-200", badgeClass: "text-slate-500 bg-slate-50 border-slate-200" };
  };

  // Helpers de rendu des statuts
  const renderStatusBadge = (ticketOrStatus: Ticket | Ticket["status"]) => {
    const status = typeof ticketOrStatus === "string" ? ticketOrStatus : ticketOrStatus.status;
    const reviewStatus = typeof ticketOrStatus === "object" ? ticketOrStatus.consultantReviewStatus : undefined;

    switch (status) {
      case "RECEIVED":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 border border-slate-300">Reçu</span>;
      case "QUALIFIED":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-sky-50 text-sky-800 border border-sky-300">Qualifié</span>;
      case "ASSIGNED":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-800 border border-blue-300">Affecté</span>;
      case "IN_PROGRESS":
        if (reviewStatus === "REJECTED") {
          return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300">🔄 Reprise Dev (Rejet Recette)</span>;
        }
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-800 border border-indigo-300">En cours</span>;
      case "BLOCKED":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-300 animate-pulse">🚨 Bloqué</span>;
      case "DELIVERED":
        if (reviewStatus === "APPROVED") {
          return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">✅ Recette Validée</span>;
        }
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-300 animate-pulse">📦 Livré (À tester)</span>;
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
      <div className="min-h-screen bg-[#F4F7FB] flex flex-col justify-between text-[#051638] font-sans">
        {/* Bandeau chromatique supérieur Tandem (Marine -> Bleu Royal -> Turquoise) */}
        <div className="h-1 w-full bg-gradient-to-r from-[#051638] via-[#0062E6] to-[#00B89C]" />

        {/* Toast Notification sur l'écran de Login */}
        {toastMessage && (
          <div className="fixed bottom-4 right-4 z-50 bg-[#051638] text-white px-4 py-2.5 rounded-xl shadow-xl text-sm flex items-center gap-2 border border-[#00B89C]/40 animate-in fade-in slide-in-from-bottom-2">
            <CheckCircle2 className="w-4 h-4 text-[#00B89C]" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* En-tête Corporate Blanc Pur (intégration native du logo Tandem) */}
        <header className="border-b border-slate-200/90 bg-white px-6 py-3.5 shadow-[0_1px_3px_0_rgba(5,22,56,0.03)]">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/tandem-logo.jpg"
                alt="Tandem — Du besoin à la solution."
                className="h-10 w-auto object-contain"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center justify-center gap-2 text-xs text-[#051638] bg-[#F4F7FB] w-[328px] py-1.5 rounded-full border border-slate-200/90 font-medium shrink-0">
                <Shield className="w-3.5 h-3.5 text-[#0062E6] shrink-0" />
                <span className="truncate">{tr("Authentification Sécurisée (Argon2id & RBAC)", "Secure Authentication (Argon2id & RBAC)")}</span>
              </div>

              {/* Sélecteur Bilingue FR / EN (Largeur fixe anti-décalage) */}
              <button
                type="button"
                onClick={() => {
                  const next = appLang === "fr" ? "en" : "fr";
                  setAppLang(next);
                  showToast(next === "en" ? "Language switched to English (EN)" : "Langue basculée en Français (FR)");
                }}
                aria-label="Sélecteur de langue FR / EN"
                className="inline-flex items-center justify-center gap-1.5 w-[58px] py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-mono font-bold text-[#051638] transition-colors cursor-pointer shadow-2xs shrink-0"
                title={tr("Passer en Anglais (EN)", "Switch to French (FR)")}
              >
                <Globe className="w-3.5 h-3.5 text-[#0062E6] shrink-0" />
                <span>{appLang === "fr" ? "FR" : "EN"}</span>
              </button>

              {/* Bascule Mode Clair / Sombre (Largeur fixe anti-décalage) */}
              <button
                type="button"
                onClick={() => {
                  const next = themeMode === "light" ? "dark" : "light";
                  setThemeMode(next);
                  showToast(next === "dark" ? tr("Mode sombre activé", "Dark mode enabled") : tr("Mode clair activé", "Light mode enabled"));
                }}
                aria-label="Basculer le mode Clair / Sombre"
                className="inline-flex items-center justify-center gap-1.5 w-[86px] py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-[#051638] transition-colors cursor-pointer shadow-2xs shrink-0"
                title={themeMode === "light" ? tr("Activer le mode sombre", "Enable Dark Mode") : tr("Activer le mode clair", "Enable Light Mode")}
              >
                {themeMode === "light" ? (
                  <Moon className="w-3.5 h-3.5 text-[#051638] shrink-0" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                )}
                <span>{themeMode === "light" ? tr("Sombre", "Dark") : tr("Clair", "Light")}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Corps central : Formulaire de Connexion & Accès Démo Rapide */}
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-4">
          <div className="w-full max-w-lg space-y-5">
            <div className="bg-white text-[#051638] rounded-2xl shadow-[0_12px_32px_-8px_rgba(5,22,56,0.08)] border border-slate-200/90 overflow-hidden">
              <div className="h-1 w-full bg-gradient-to-r from-[#0062E6] to-[#00B89C]" />
              <div className="bg-white pt-7 pb-5 px-6 text-center border-b border-slate-100">
                <img
                  src="/tandem-logo.jpg"
                  alt="Tandem — Du besoin à la solution."
                  className="h-14 w-auto object-contain mx-auto mb-3"
                />
                <h1 className="text-lg font-bold tracking-tight text-[#051638]">
                  {tr("Connexion à votre Espace Tandem", "Sign in to your Tandem Workspace")}
                </h1>
                <p className="text-xs text-[#5A7088] mt-1 max-w-sm mx-auto">
                  {tr(
                    "Identifiez-vous avec votre adresse e-mail professionnelle pour accéder à votre portail dédié.",
                    "Sign in with your corporate email address to access your dedicated portal."
                  )}
                </p>
              </div>

              <div className="p-6 sm:p-8 space-y-6">
                {loginError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5 animate-in fade-in">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">{tr("Erreur d'authentification : ", "Authentication error: ")}</span>
                      {loginError}
                    </div>
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#051638] mb-1.5">
                      {tr("Adresse e-mail professionnelle (Login)", "Corporate Email Address (Login)")}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#5A7088] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="ex : aliko.getheme@safirconsulting.net"
                        className="w-full text-sm pl-10 pr-3 py-2.5 bg-[#F8FAFC] border border-slate-300 rounded-xl text-[#051638] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0062E6] focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-[#051638]">
                        {tr("Mot de passe", "Password")}
                      </label>
                      <span className="text-[11px] text-[#5A7088]">{tr("Chiffré via Argon2id", "Encrypted via Argon2id")}</span>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#5A7088] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full text-sm pl-10 pr-3 py-2.5 bg-[#F8FAFC] border border-slate-300 rounded-xl text-[#051638] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0062E6] focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-[#0062E6] hover:bg-[#0052CC] active:bg-[#051638] text-white font-semibold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    <span>{tr("Se connecter à mon portail", "Sign in to my portal")}</span>
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </button>
                </form>

                {/* Section Accès Rapide Démo 1-Clic */}
                <div className="pt-5 border-t border-slate-100">
                  <div className="text-[11px] font-semibold text-[#5A7088] uppercase tracking-wider mb-3 text-center">
                    {tr("Accès direct corporate & démo (1-clic)", "Direct Corporate & Demo Access (1-click)")}
                  </div>

                  <div className="space-y-2">
                    {/* Aliko - HEAD (Marine Tandem #051638) */}
                    <button
                      type="button"
                      onClick={() => {
                        const aliko = systemUsers.find((u) => u.role === "HEAD") || systemUsers[0];
                        setCurrentUser(aliko);
                        showToast(`Bienvenue, ${aliko.name} (Portail Direction)`);
                      }}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-[#F8FAFC] hover:bg-blue-50/60 hover:border-[#0062E6]/40 transition-all flex items-center justify-between text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#051638] text-white font-bold text-xs flex items-center justify-center shadow-2xs">
                          AG
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-[#051638] group-hover:text-[#0062E6]">Aliko Getheme</div>
                          <div className="text-[10px] text-[#5A7088]">Direction BU SME — Arbitrage & Capacité</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#051638]/10 text-[#051638]">
                        Portail Direction (HEAD)
                      </span>
                    </button>

                    {/* Anoop - DEVELOPER (Teal Tandem #0D9488) */}
                    <button
                      type="button"
                      onClick={() => {
                        const anoop = systemUsers.find((u) => u.email.includes("anoop")) || systemUsers[1];
                        setCurrentUser(anoop);
                        showToast(`Bienvenue, ${anoop.name} (Espace Développeur)`);
                      }}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-[#F8FAFC] hover:bg-teal-50/60 hover:border-teal-500/40 transition-all flex items-center justify-between text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#0D9488] text-white font-bold text-xs flex items-center justify-center shadow-2xs">
                          AP
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-[#051638] group-hover:text-teal-800">Anoop Pandimukkula</div>
                          <div className="text-[10px] text-[#5A7088]">Développeur SAP Business One Senior</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-teal-100/80 text-teal-900">
                        Portail Développeur
                      </span>
                    </button>

                    {/* Mélissa - CONSULTANT (Bleu Tandem #0062E6) */}
                    <button
                      type="button"
                      onClick={() => {
                        const melissa = systemUsers.find((u) => u.role === "CONSULTANT") || systemUsers[4];
                        setCurrentUser(melissa);
                        showToast(`Bienvenue, ${melissa.name} (Espace Consultante)`);
                      }}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-[#F8FAFC] hover:bg-blue-50/60 hover:border-[#0062E6]/40 transition-all flex items-center justify-between text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#0062E6] text-white font-bold text-xs flex items-center justify-center shadow-2xs">
                          MD
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-[#051638] group-hover:text-[#0062E6]">Mélissa Diakité</div>
                          <div className="text-[10px] text-[#5A7088]">Consultante Fonctionnelle SAP</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-100/80 text-[#0052CC]">
                        Portail Consultante
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Note de sécurité */}
            <div className="text-center text-[11px] text-[#5A7088] space-y-1">
              <p>Application Tandem (Safir Consulting) — Du besoin à la solution. • Tous droits réservés 2026</p>
              <p className="text-slate-400">Cloisonnement strict RBAC • Chiffrement Argon2id • Conforme OWASP Top 10</p>
            </div>
          </div>
        </main>

        <footer className="py-4 bg-white border-t border-slate-200/80 text-center text-xs text-[#5A7088]">
          Tandem — Du besoin à la solution. | Safir Consulting © 2026
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-[#051638] font-sans flex flex-col">
      {/* ================================================================= */}
      {/* BARRE DE NAVIGATION D'ENTREPRISE (TANDEM — SAFIR CONSULTING)      */}
      {/* ================================================================= */}
      <header className="bg-white border-b border-slate-200/90 sticky top-0 z-30 shadow-[0_1px_3px_0_rgba(5,22,56,0.04)]">
        {/* Liseré identitaire Tandem : Marine (#051638) -> Bleu (#0062E6) -> Turquoise (#00B89C) */}
        <div className="h-0.5 w-full bg-gradient-to-r from-[#051638] via-[#0062E6] to-[#00B89C]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2">
            {/* Logo Tandem & Identité Application */}
            <div className="flex items-center gap-3">
              <div className="flex items-center shrink-0">
                <img
                  src="/tandem-logo.jpg"
                  alt="Tandem — Du besoin à la solution."
                  className="h-9 w-auto object-contain"
                />
              </div>

              {/* Navigation conditionnelle selon les GRANTS de l'utilisateur connecté */}
              {currentUser && (
                <nav className="hidden md:flex items-center space-x-1">
                  {/* Vue Direction (HEAD) */}
                  {currentUser.role === "HEAD" && (
                    <>
                      <button
                        onClick={() => handleTabChange("dashboard")}
                        className={`w-[116px] py-1.5 text-xs rounded-lg transition-colors flex items-center justify-center whitespace-nowrap cursor-pointer shrink-0 ${
                          activeTab === "dashboard"
                            ? "bg-[#051638] text-white font-semibold shadow-xs"
                            : "text-[#5A7088] hover:text-[#051638] hover:bg-slate-100/80 font-medium"
                        }`}
                      >
                        Tableau de bord
                      </button>
                      <button
                        onClick={() => handleTabChange("tickets")}
                        className={`w-[164px] py-1.5 text-xs rounded-lg transition-colors flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer shrink-0 ${
                          activeTab === "tickets"
                            ? "bg-[#051638] text-white font-semibold shadow-xs"
                            : "text-[#5A7088] hover:text-[#051638] hover:bg-slate-100/80 font-medium"
                        }`}
                      >
                        <span>Tous les Tickets SAP</span>
                        <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono font-bold ${
                          activeTab === "tickets" ? "bg-[#00B89C]/25 text-[#22F0D2]" : "bg-slate-200/80 text-[#051638]"
                        }`}>
                          {tickets.length}
                        </span>
                      </button>
                      <button
                        onClick={() => handleTabChange("developers")}
                        className={`w-[156px] py-1.5 text-xs rounded-lg transition-colors flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer shrink-0 ${
                          activeTab === "developers"
                            ? "bg-[#051638] text-white font-semibold shadow-xs"
                            : "text-[#5A7088] hover:text-[#051638] hover:bg-slate-100/80 font-medium"
                        }`}
                      >
                        <span>Équipe & Capacité ({developers.length})</span>
                      </button>
                      <button
                        onClick={() => handleTabChange("inbox")}
                        className={`w-[194px] py-1.5 text-xs rounded-lg transition-colors flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer shrink-0 ${
                          activeTab === "inbox"
                            ? "bg-[#051638] text-white font-semibold shadow-xs"
                            : "text-[#5A7088] hover:text-[#051638] hover:bg-slate-100/80 font-medium"
                        }`}
                      >
                        <span>Guichet Central Demandes</span>
                        {stats.pendingEmailsCount > 0 && (
                          <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono font-bold ${
                            activeTab === "inbox" ? "bg-[#00B89C] text-[#051638]" : "bg-blue-100 text-[#0052CC]"
                          }`}>
                            {stats.pendingEmailsCount}
                          </span>
                        )}
                      </button>
                    </>
                  )}

                  {/* Vue Développeur (DEVELOPER) */}
                  {currentUser.role === "DEVELOPER" && (
                    <button
                      onClick={() => handleTabChange("my-tickets")}
                      className={`w-[242px] py-1.5 text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 ${
                        activeTab === "my-tickets"
                          ? "bg-[#0D9488] text-white font-semibold shadow-xs"
                          : "text-[#5A7088] hover:text-[#051638] hover:bg-slate-100/80 font-medium"
                      }`}
                    >
                      <Briefcase className="w-3.5 h-3.5 text-teal-200 shrink-0" />
                      <span>Mon Espace Développeur ({myAssignedTickets.length} tickets)</span>
                    </button>
                  )}

                  {/* Vue Consultante (CONSULTANT) */}
                  {currentUser.role === "CONSULTANT" && (
                    <button
                      onClick={() => handleTabChange("my-demands")}
                      className={`w-[200px] py-1.5 text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 ${
                        activeTab === "my-demands"
                          ? "bg-[#0062E6] text-white font-semibold shadow-xs"
                          : "text-[#5A7088] hover:text-[#051638] hover:bg-slate-100/80 font-medium"
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5 text-blue-200 shrink-0" />
                      <span>Mes Demandes Émises ({myConsultantDemands.length})</span>
                    </button>
                  )}
                </nav>
              )}
            </div>

            {/* Droite : Boutons d'action, Notifications Temps Réel et Sélecteur de Rôle RBAC */}
            <div className="flex items-center gap-1.5 shrink-0">
              {currentUser?.role === "HEAD" && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center justify-center gap-1 w-[118px] py-1.5 bg-[#0062E6] hover:bg-[#0052CC] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors whitespace-nowrap cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  <span>Nouveau ticket</span>
                </button>
              )}

              {/* SÉLECTEUR MULTI-DEVISES (AFRIQUE DE L'OUEST FCFA PAR DÉFAUT + EUR / USD) - RÉSERVÉ À ALIKO (HEAD) */}
              {currentUser?.role === "HEAD" && (
                <div className="hidden 2xl:flex items-center gap-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs shrink-0" title="Devise contractuelle (Prérogative Aliko)">
                  <select
                    value={activeCurrency}
                    onChange={(e) => {
                      const c = e.target.value as "XOF" | "EUR" | "USD";
                      setActiveCurrency(c);
                      showToast(c === "XOF" ? "Devise activée : FCFA (XOF — Afrique de l'Ouest)" : `Devise activée : ${c}`);
                    }}
                    className="bg-transparent font-semibold text-slate-800 text-xs cursor-pointer focus:outline-none"
                  >
                    <option value="XOF">FCFA (XOF)</option>
                    <option value="EUR">Euro (€)</option>
                    <option value="USD">Dollar ($)</option>
                  </select>
                </div>
              )}

              {/* SÉLECTEUR DE LANGUE BILINGUE (FR / EN) — LARGEUR FIXE ANTI-DÉCALAGE */}
              <button
                type="button"
                onClick={() => {
                  const next = appLang === "fr" ? "en" : "fr";
                  setAppLang(next);
                  showToast(next === "en" ? "Language switched to English (EN)" : "Langue basculée en Français (FR)");
                }}
                aria-label="Sélecteur de langue FR / EN"
                className="inline-flex items-center justify-center gap-1.5 w-[58px] py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-mono font-bold text-[#051638] transition-colors cursor-pointer shadow-2xs shrink-0"
                title={tr("Passer en Anglais (EN)", "Switch to French (FR)")}
              >
                <Globe className="w-3.5 h-3.5 text-[#0062E6] shrink-0" />
                <span>{appLang === "fr" ? "FR" : "EN"}</span>
              </button>

              {/* BASCULE MODE CLAIR / SOMBRE (LIGHT / DARK MODE) — LARGEUR FIXE ANTI-DÉCALAGE */}
              <button
                type="button"
                onClick={() => {
                  const next = themeMode === "light" ? "dark" : "light";
                  setThemeMode(next);
                  showToast(next === "dark" ? tr("Mode sombre activé", "Dark mode enabled") : tr("Mode clair activé", "Light mode enabled"));
                }}
                aria-label="Basculer le mode Clair / Sombre"
                className="inline-flex items-center justify-center gap-1.5 w-[86px] py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-[#051638] transition-colors cursor-pointer shadow-2xs shrink-0"
                title={themeMode === "light" ? tr("Activer le mode sombre", "Enable Dark Mode") : tr("Activer le mode clair", "Enable Light Mode")}
              >
                {themeMode === "light" ? (
                  <Moon className="w-3.5 h-3.5 text-[#051638] shrink-0" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                )}
                <span>{themeMode === "light" ? tr("Sombre", "Dark") : tr("Clair", "Light")}</span>
              </button>

              {/* CLOCHE DE NOTIFICATIONS TEMPS RÉEL IN-APP */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowNotificationsPanel(!showNotificationsPanel);
                    setShowUserMenu(false);
                  }}
                  aria-label="Notifications In-App"
                  className="relative p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer shadow-2xs"
                  title="Centre de Notifications Temps Réel In-App"
                >
                  <Bell className={`w-4 h-4 ${unreadNotificationsCount > 0 ? "text-amber-600" : "text-slate-500"}`} />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs animate-pulse">
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
                    className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50/80 hover:border-slate-300 transition-all text-left shadow-2xs cursor-pointer"
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white ${
                      currentUser.role === "HEAD"
                        ? "bg-[#051638]"
                        : currentUser.role === "DEVELOPER"
                        ? "bg-[#0D9488]"
                        : "bg-[#0062E6]"
                    }`}>
                      {currentUser.initials}
                    </div>
                    <div className="hidden xl:block">
                      <div className="text-xs font-semibold text-[#051638] flex items-center gap-1 leading-tight whitespace-nowrap">
                        <span>{currentUser.name}</span>
                        <span className={`hidden 2xl:inline text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase tracking-wider ${
                          currentUser.role === "HEAD"
                            ? "bg-[#051638]/10 text-[#051638] border border-[#051638]/20"
                            : currentUser.role === "DEVELOPER"
                            ? "bg-teal-50 text-teal-800 border border-teal-200"
                            : "bg-blue-50 text-[#0052CC] border border-blue-200"
                        }`}>
                          {currentUser.role}
                        </span>
                      </div>
                      <div className="hidden 2xl:block text-[10px] text-[#5A7088] leading-none mt-0.5 truncate max-w-[140px]">{currentUser.roleLabel}</div>
                    </div>
                    <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="px-3.5 py-1.5 bg-[#051638] hover:bg-[#0062E6] text-white text-xs font-semibold rounded-lg shadow-sm"
                  >
                    Se connecter
                  </button>
                )}

                {/* Fiche Profil & Session Sécurisée (Cloisonnement Strict RBAC - Aucun Switcher en Session) */}
                {showUserMenu && currentUser && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 py-3 z-50 animate-in fade-in">
                    <div className="px-4 py-2 border-b border-slate-100 space-y-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Shield className="w-3 h-3 text-sky-600" />
                        <span>Session Active Sécurisée</span>
                      </div>
                      <div className="font-bold text-slate-900 text-sm leading-tight">
                        {currentUser.name}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        {currentUser.email}
                      </div>
                      <div className="pt-1.5 flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border ${
                          currentUser.role === "HEAD"
                            ? "bg-sky-50 text-sky-800 border-sky-300"
                            : currentUser.role === "DEVELOPER"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                            : "bg-purple-50 text-purple-800 border-purple-300"
                        }`}>
                          {currentUser.role === "HEAD" ? "🛡️ DIRECTION BU (HEAD)" : currentUser.role === "DEVELOPER" ? "💻 DÉVELOPPEUR SAP" : "📋 CONSULTANTE SAP"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 pt-1 leading-relaxed">
                        {currentUser.role === "HEAD"
                          ? "Accès exclusif : Tableau de bord, Capacité, Affectation souveraine & Arbitrage."
                          : currentUser.role === "DEVELOPER"
                          ? "Accès exclusif : Tickets affectés, Pilotage RAF & Stop-the-line."
                          : "Accès exclusif : Demandes de développements SAP & Réponses fonctionnelles."}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 mx-3 my-2 rounded-lg border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
                      <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <span><strong>Cloisonnement étanche :</strong> Pour changer de rôle, vous devez obligatoirement vous déconnecter et vous authentifier avec le compte correspondant.</span>
                    </div>

                    <div className="pt-1 px-3">
                      <button
                        onClick={() => {
                          setCurrentUser(null);
                          setShowUserMenu(false);
                          showToast("Session clôturée avec succès");
                        }}
                        className="w-full text-left text-xs text-rose-700 hover:text-rose-900 hover:bg-rose-50 p-2 rounded-lg flex items-center gap-2 font-semibold transition-colors cursor-pointer border border-rose-200"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-600" />
                        <span>Se déconnecter (Retour au Login)</span>
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50/80 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer shadow-2xs"
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
            {/* Bannière de Bienvenue Développeur & Actions Reporting */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-slate-900">Espace Développeur — {currentUser.name}</h1>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Accès DEVELOPER
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Pilotez vos développements SAP, gérez votre compteur d'heures (mono-tâche) et éditez vos relevés périodiques.
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {/* Jauge Personnelle du Développeur */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs flex items-center gap-4">
                  <div>
                    <div className="text-slate-500 font-medium">Capacité hebdo</div>
                    <div className="text-sm font-bold text-slate-900">40 heures</div>
                  </div>
                  <div className="border-l border-slate-200 pl-4">
                    <div className="text-slate-500 font-medium">Tickets assignés</div>
                    <div className="text-sm font-bold text-slate-900">{myAssignedTickets.length}</div>
                  </div>
                </div>

                {/* Bouton Impression Rapport d'Activité & Feuilles de Temps */}
                <button
                  onClick={() =>
                    setPrintingReport({
                      targetType: "DEVELOPER",
                      targetId: currentUser.developerId || currentUser.id,
                      targetName: currentUser.name,
                      targetEmail: currentUser.email,
                      role: "DEVELOPER",
                      jobTitle: currentUser.roleLabel
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                  title="Imprimer votre relevé d'heures (journalier, hebdo, mensuel, trimestriel, semestriel, annuel)"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimer mon rapport d'heures</span>
                </button>
              </div>
            </div>

            {/* CONSOLE CHRONOMÈTRE EN TEMPS RÉEL (SESSION DE TRAVAIL MONO-TÂCHE TOUJOURS VISIBLE) */}
            {(() => {
              const activeT = activeTimerTicketId ? tickets.find((t) => t.id === activeTimerTicketId) : null;
              const nextPlayableTicket = myAssignedTickets.find(
                (t) => t.status !== "BLOCKED" && t.status !== "DELIVERED" && t.status !== "CLOSED"
              );
              const myTotalLoggedHours = Math.round(
                timeLogs
                  .filter(
                    (l) =>
                      l.developerId === currentUser.developerId ||
                      l.developerEmail.toLowerCase() === currentUser.email.toLowerCase()
                  )
                  .reduce((acc, l) => acc + l.durationHours, 0) * 10
              ) / 10;

              if (activeT) {
                return (
                  <div
                    data-testid="dev-timer-console"
                    className="bg-[#051638] text-white p-4 rounded-xl shadow-md border border-[#00B89C]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#00B89C]/20 text-[#22F0D2] border border-[#00B89C]/40 flex items-center justify-center shrink-0">
                        <Timer
                          className={`w-5 h-5 text-[#22F0D2] ${isTimerPaused ? "" : "animate-spin"}`}
                          style={{ animationDuration: "3s" }}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 uppercase tracking-wider animate-pulse">
                            Compteur d'heures actif (Règle mono-tâche)
                          </span>
                          {isTimerPaused && (
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/30 text-amber-200 border border-amber-400/30 uppercase">
                              EN PAUSE
                            </span>
                          )}
                          <span className="text-xs text-slate-300 font-mono font-bold">{activeT.reference}</span>
                        </div>
                        <div className="text-sm font-bold text-white mt-0.5 truncate max-w-lg">
                          {activeT.title}
                        </div>
                        <div className="text-xs text-slate-300">
                          Client : <strong className="text-white">{activeT.clientCompany}</strong> — Charge estimée : {activeT.estimatedHours} h (RAF : {activeT.remainingHours ?? activeT.estimatedHours} h)
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                      <div
                        data-no-i18n="true"
                        data-testid="dev-live-timer-display"
                        className="bg-black/60 px-4 py-2 rounded-xl border border-[#00B89C]/40 font-mono text-2xl font-bold text-[#22F0D2] tracking-wider"
                      >
                        {formatTimer(activeTimerSeconds)}
                      </div>
                      <button
                        type="button"
                        onClick={handleTogglePauseTimer}
                        className="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        {isTimerPaused ? (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Reprendre</span>
                          </>
                        ) : (
                          <>
                            <Pause className="w-3.5 h-3.5 fill-current" />
                            <span>Pause</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStopTimer(activeT.id)}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                      >
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span>Arrêter & Enregistrer</span>
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  data-testid="dev-timer-console"
                  className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0D9488] border border-teal-200 flex items-center justify-center shrink-0">
                      <Timer className="w-5 h-5 text-[#0D9488]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-teal-50 text-[#0D9488] border border-teal-200 uppercase tracking-wider">
                          {tr("Chronomètre Développeur (Règle Mono-Tâche)", "Developer Timer (Single-Task Rule)")}
                        </span>
                        <span className="text-xs text-[#5A7088] font-medium">
                          {tr("Cumul enregistré :", "Total logged:")} <strong className="text-[#051638] font-mono">{myTotalLoggedHours} h</strong>
                        </span>
                      </div>
                      <div className="text-xs text-[#5A7088] mt-0.5">
                        {tr(
                          "Cliquez sur « Démarrer chrono » sur un ticket ci-dessous pour lancer le décompte en direct (synchronisé avec la supervision d'Aliko).",
                          "Click 'Start timer' on any ticket below to start live time tracking (synced with Aliko's live monitor)."
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div
                      data-no-i18n="true"
                      data-testid="dev-live-timer-display"
                      className="bg-slate-100 px-3.5 py-1.5 rounded-xl border border-slate-200 font-mono text-lg font-bold text-[#051638] tracking-wider"
                    >
                      00:00:00
                    </div>
                    {nextPlayableTicket && (
                      <button
                        type="button"
                        onClick={() => handleStartTimer(nextPlayableTicket)}
                        className="px-3.5 py-2 bg-[#0D9488] hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{tr(`Lancer sur ${nextPlayableTicket.reference}`, `Start on ${nextPlayableTicket.reference}`)}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Liste des Tickets Personnels avec Recherche Rapide (Projet & Client) */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Mes Demandes & Addons Assignés ({filteredDevTickets.length} / {myAssignedTickets.length})
                  </h2>
                  <p className="text-xs text-slate-500">Filtrage instantané par nom de projet ou entreprise cliente</p>
                </div>

                {/* FILTRES RAPIDES : RECHERCHE PROJET + CLIENT / ENTREPRISE */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Filtrer par projet, référence..."
                      value={devSearchQuery}
                      onChange={(e) => setDevSearchQuery(e.target.value)}
                      className="text-xs pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-600 w-44 sm:w-52"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 border border-slate-300 rounded-lg text-xs">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <select
                      value={devCompanyFilter}
                      onChange={(e) => setDevCompanyFilter(e.target.value)}
                      className="bg-transparent font-medium text-slate-700 text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="ALL">Toutes les entreprises ({myAssignedTickets.length})</option>
                      {devCompanies.map((comp) => (
                        <option key={comp} value={comp}>
                          {comp} ({myAssignedTickets.filter((t) => t.clientCompany === comp).length})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {filteredDevTickets.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  {myAssignedTickets.length === 0
                    ? "Aucun ticket ne vous est actuellement affecté. Consultez Aliko en cas de disponibilité."
                    : "Aucun ticket ne correspond à vos filtres de recherche (projet / entreprise)."}
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredDevTickets.map((ticket) => {
                    const myContributorLot = ticket.contributors?.find(
                      (c) =>
                        c.developerId === currentUser.developerId ||
                        c.developerEmail.toLowerCase() === currentUser.email.toLowerCase()
                    );
                    const otherContributors = ticket.contributors?.filter(
                      (c) => c.id !== myContributorLot?.id
                    );
                    const isTimerRunningOnThisTicket = activeTimerTicketId === ticket.id;

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
                            {isTimerRunningOnThisTicket && (
                              <span
                                data-no-i18n="true"
                                className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse flex items-center gap-1"
                              >
                                <Timer className="w-3 h-3 text-emerald-600" />
                                <span>COMPTEUR EN COURS ({formatTimer(activeTimerSeconds)})</span>
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
                                <span className="font-semibold">Blocage signalé (Compteur de temps en pause) : </span>
                                {ticket.blockerReason}
                              </div>
                            </div>
                          )}

                          {/* Alerte si le ticket a été renvoyé en développement suite à anomalie de recette */}
                          {ticket.status === "IN_PROGRESS" && ticket.rejectionReason && (
                            <div className="p-2.5 rounded bg-amber-50 border border-amber-300 text-xs text-amber-950 flex items-start gap-2 shadow-xs">
                              <RotateCcw className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                              <div className="space-y-0.5">
                                <div className="font-bold text-amber-900 flex items-center gap-1.5">
                                  <span>Reprise demandée suite à Recette Consultante</span>
                                  <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 text-[10px] font-mono">
                                    ANOMALIE SIGNALÉE
                                  </span>
                                </div>
                                <div className="text-amber-800 leading-relaxed">
                                  <strong>Observation {ticket.applicantName?.split(" ")[0] || "Consultant"} : </strong>
                                  <span>{ticket.rejectionReason}</span>
                                </div>
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
                          {/* 1. COMPTEUR DE TEMPS DE TRAVAIL (MONO-TÂCHE STRICTE) */}
                          {ticket.status !== "DELIVERED" && ticket.status !== "CLOSED" && (
                            isTimerRunningOnThisTicket ? (
                              <button
                                data-no-i18n="true"
                                onClick={() => handleStopTimer(ticket.id)}
                                className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-all shadow-sm flex items-center gap-1.5 animate-pulse cursor-pointer"
                                title="Mettre en pause ou arrêter le compteur et enregistrer le temps travaillé"
                              >
                                <Pause className="w-3.5 h-3.5 fill-current" />
                                <span>Chrono : {formatTimer(activeTimerSeconds)}</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStartTimer(ticket)}
                                disabled={ticket.status === "BLOCKED"}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                                  ticket.status === "BLOCKED"
                                    ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                                    : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200"
                                }`}
                                title={
                                  ticket.status === "BLOCKED"
                                    ? "Compteur verrouillé tant que le blocage n'est pas levé"
                                    : "Lancer le compteur d'heures (arrête automatiquement tout autre chrono)"
                                }
                              >
                                <Play className="w-3.5 h-3.5 fill-current text-emerald-700" />
                                <span>Démarrer chrono</span>
                              </button>
                            )
                          )}

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
                              className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer"
                            >
                              Reprendre le ticket
                            </button>
                          ) : (
                            <button
                              onClick={() => setBlockingTicket(ticket)}
                              className="px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                            >
                              Signaler un blocage
                            </button>
                          )}

                          {/* BOUTON OFFICIEL DE LIVRAISON : "Envoyer en test chez le consultant" */}
                          {ticket.status !== "DELIVERED" && ticket.status !== "CLOSED" && (
                            <button
                              onClick={() => handleDeliverTicket(ticket.id)}
                              className="px-3 py-1.5 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
                            >
                              <FlaskConical className="w-3.5 h-3.5" />
                              <span>Envoyer en test chez le consultant</span>
                            </button>
                          )}

                          {/* DIALOGUE DIRECT AVEC ALIKO & LA CONSULTANTE */}
                          <button
                            onClick={() => setDiscussingTicket(ticket)}
                            className="px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200 flex items-center gap-1.5 cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                            <span>Échanger avec Aliko & Mélissa ({ticket.messages?.length || 0})</span>
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
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 shadow-sm">
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

                        {/* Étape Clé : Espace Recette & Test Utilisateur pour la Consultante */}
                        {ticket.status === "DELIVERED" && ticket.consultantReviewStatus !== "APPROVED" && (
                          <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200 space-y-2 shadow-xs">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                                <FlaskConical className="w-4 h-4 text-amber-700" />
                                <span>Solution Livrée par l'Équipe Dév — Recette Fonctionnelle SAP Requise</span>
                              </span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-200 text-amber-950 font-bold uppercase tracking-wider">
                                Phase de Test
                              </span>
                            </div>
                            <p className="text-xs text-amber-900 leading-relaxed">
                              Le développement technique est terminé. Veuillez tester la solution selon vos spécifications métier. Vous seule pouvez valider la recette ou renvoyer le ticket aux développeurs avec vos remarques.
                            </p>
                            <div className="flex flex-wrap gap-2 pt-1">
                              <button
                                onClick={() => handleApproveTicketByConsultant(ticket.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Tester & Approuver la Recette (Solution Conforme)</span>
                              </button>
                              <button
                                onClick={() => {
                                  setRejectingTicket(ticket);
                                  setRejectionReasonText("");
                                  setRejectionAdditionalHours(4);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Renvoyer en Correction chez les Dév (Problème / Anomalie)</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {ticket.status === "DELIVERED" && ticket.consultantReviewStatus === "APPROVED" && (
                          <div className="p-3 bg-emerald-50/90 rounded-xl border border-emerald-300 text-xs text-emerald-950 flex items-center justify-between flex-wrap gap-2 shadow-xs">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <div>
                                <span className="font-bold">Recette testée & validée avec succès par vos soins. </span>
                                <span className="text-emerald-800">Le ticket est transmis à Aliko Getheme pour clôture définitive.</span>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-200 text-emerald-950 shrink-0 uppercase">
                              Attente Clôture Direction
                            </span>
                          </div>
                        )}

                        {ticket.status === "IN_PROGRESS" && ticket.consultantReviewStatus === "REJECTED" && (
                          <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 text-xs text-amber-950 flex items-start gap-2 shadow-xs">
                            <RotateCcw className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold">Ticket renvoyé aux développeurs suite à votre test. </span>
                              <span className="text-amber-800">Anomalie signalée : « {ticket.rejectionReason} ». Les développeurs sont notifiés.</span>
                            </div>
                          </div>
                        )}

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
            {/* 4 Indicateurs Clés Métier (Palette Tandem) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200/90 border-t-2 border-t-[#0062E6] shadow-2xs">
                <div className="flex items-center justify-between text-[#5A7088] mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Tickets en cours</span>
                  <Layers className="w-4 h-4 text-[#0062E6]" />
                </div>
                <div className="text-2xl font-bold text-[#051638]">{stats.activeTicketsCount}</div>
                <p className="text-xs text-[#5A7088] mt-1">Demandes de développement actives</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200/90 border-t-2 border-t-[#0D9488] shadow-2xs">
                <div className="flex items-center justify-between text-[#5A7088] mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Capacité disponible</span>
                  <Clock className="w-4 h-4 text-[#0D9488]" />
                </div>
                <div className="text-2xl font-bold text-[#051638]">
                  {stats.totalFree} <span className="text-sm font-normal text-[#5A7088]">/ {stats.totalWeeklyCap} h</span>
                </div>
                <p className="text-xs text-[#5A7088] mt-1">Heures de développement libres cette semaine</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200/90 border-t-2 border-t-rose-500 shadow-2xs">
                <div className="flex items-center justify-between text-[#5A7088] mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Alertes Blocage</span>
                  <AlertTriangle className={`w-4 h-4 ${stats.blockedTicketsCount > 0 ? "text-rose-500" : "text-slate-400"}`} />
                </div>
                <div className="text-2xl font-bold text-rose-600">{stats.blockedTicketsCount}</div>
                <p className="text-xs text-[#5A7088] mt-1">Développeurs arrêtés en attente d'arbitrage</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200/90 border-t-2 border-t-[#051638] shadow-2xs">
                <div className="flex items-center justify-between text-[#5A7088] mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Guichet Central Demandes</span>
                  <Inbox className="w-4 h-4 text-[#051638]" />
                </div>
                <div className="text-2xl font-bold text-[#051638]">{stats.pendingEmailsCount}</div>
                <p className="text-xs text-[#5A7088] mt-1">Demandes In-App soumises à qualifier par Aliko</p>
              </div>
            </div>

            {/* Barre de Pilotage Exécutif & Export Reporting Direction 1-Clic */}
            <div className="bg-[#051638] text-white p-4 rounded-xl shadow-sm border border-[#051638] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#0062E6]/25 rounded-xl border border-[#0062E6]/40 text-[#38BDF8]">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[#22F0D2]">
                    Gouvernance Centrale Tandem — Point Focal Unique : Aliko Getheme
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
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
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

            {/* ========================================================================= */}
            {/* MODULE DIRECTION : SUPERVISION TEMPS RÉEL DE L'ÉQUIPE & ACTIONS RAPPORTS  */}
            {/* ========================================================================= */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* En-tête Live Monitor */}
              <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#051638] text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#00B89C]/20 border border-[#00B89C]/40 flex items-center justify-center text-[#22F0D2] shrink-0">
                    <Activity className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#00B89C]/20 text-[#22F0D2] border border-[#00B89C]/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#22F0D2] animate-ping" />
                        LIVE TEMPS RÉEL
                      </span>
                      <h2 className="text-base font-bold text-white">
                        Supervision de l'Activité des Développeurs en Direct
                      </h2>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      Suivi instantané de ce que chaque développeur produit actuellement, chronos actifs en direct et impression de leurs rapports de travail.
                    </p>
                  </div>
                </div>

                {/* Badges d'état de l'équipe */}
                {(() => {
                  const workingList = developers.filter((d) => devLiveActivities[d.id]?.status === "WORKING");
                  const blockedList = developers.filter((d) => devLiveActivities[d.id]?.status === "BLOCKED");
                  const availableList = developers.filter((d) => !devLiveActivities[d.id] || devLiveActivities[d.id]?.status === "AVAILABLE");

                  return (
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <div className="px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-200 font-medium flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>En production : <strong className="font-bold text-white">{workingList.length}</strong></span>
                      </div>
                      <div className="px-3 py-1.5 rounded-xl bg-rose-950/80 border border-rose-500/30 text-rose-200 font-medium flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-400" />
                        <span>Bloqué (Stop-the-line) : <strong className="font-bold text-white">{blockedList.length}</strong></span>
                      </div>
                      <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 font-medium flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-slate-400" />
                        <span>Disponible : <strong className="font-bold text-white">{availableList.length}</strong></span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Filtres & Recherche de la supervision */}
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={liveSupervisionSearch}
                      onChange={(e) => setLiveSupervisionSearch(e.target.value)}
                      placeholder="Rechercher un développeur, un projet ou une tâche..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-800"
                    />
                  </div>
                  {liveSupervisionSearch && (
                    <button
                      onClick={() => setLiveSupervisionSearch("")}
                      className="text-slate-400 hover:text-slate-600 px-1 font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setLiveSupervisionFilter("ALL")}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                      liveSupervisionFilter === "ALL" ? "bg-sky-100 text-sky-800 font-semibold" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Tous ({developers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setLiveSupervisionFilter("WORKING")}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                      liveSupervisionFilter === "WORKING" ? "bg-emerald-100 text-emerald-800 font-semibold" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    🟢 En cours ({developers.filter((d) => devLiveActivities[d.id]?.status === "WORKING").length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setLiveSupervisionFilter("BLOCKED")}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                      liveSupervisionFilter === "BLOCKED" ? "bg-rose-100 text-rose-800 font-semibold" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    🔴 Bloqués ({developers.filter((d) => devLiveActivities[d.id]?.status === "BLOCKED").length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setLiveSupervisionFilter("AVAILABLE")}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                      liveSupervisionFilter === "AVAILABLE" ? "bg-slate-200 text-slate-800 font-semibold" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    ⚪ Disponibles ({developers.filter((d) => !devLiveActivities[d.id] || devLiveActivities[d.id]?.status === "AVAILABLE").length})
                  </button>
                </div>
              </div>

              {/* Liste Détaillée des Développeurs en Direct */}
              <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
                {(() => {
                  const filteredDevs = developers.filter((dev) => {
                    const act = devLiveActivities[dev.id] || { status: "AVAILABLE" };
                    if (liveSupervisionFilter !== "ALL" && act.status !== liveSupervisionFilter) {
                      return false;
                    }
                    if (liveSupervisionSearch.trim()) {
                      const q = liveSupervisionSearch.toLowerCase();
                      const matchName = dev.name.toLowerCase().includes(q);
                      const matchTitle = (dev.jobTitle || "").toLowerCase().includes(q);
                      const matchTicket = (act.activeTicketReference || "").toLowerCase().includes(q) || (act.activeTicketTitle || "").toLowerCase().includes(q);
                      const matchClient = (act.clientCompany || "").toLowerCase().includes(q);
                      const matchTask = (act.currentTaskDescription || "").toLowerCase().includes(q);
                      if (!matchName && !matchTitle && !matchTicket && !matchClient && !matchTask) {
                        return false;
                      }
                    }
                    return true;
                  });

                  if (filteredDevs.length === 0) {
                    return (
                      <div className="p-8 text-center text-slate-400 text-xs italic">
                        Aucun développeur ne correspond aux filtres de supervision sélectionnés.
                      </div>
                    );
                  }

                  return filteredDevs.map((dev) => {
                    const activity = devLiveActivities[dev.id] || {
                      developerId: dev.id,
                      status: "AVAILABLE",
                      currentTaskDescription: "Disponible pour affectation",
                      elapsedSeconds: 0
                    };

                    return (
                      <div
                        key={dev.id}
                        className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                      >
                        {/* 1. Développeur & Spécialité */}
                        <div className="flex items-center gap-3.5 min-w-[250px]">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border ${
                              activity.status === "WORKING"
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300 ring-2 ring-emerald-400/40"
                                : activity.status === "BLOCKED"
                                ? "bg-rose-100 text-rose-800 border-rose-300 ring-2 ring-rose-400/40"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                          >
                            {dev.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-bold text-slate-900 text-sm leading-tight">{dev.name}</h3>
                              {activity.status === "WORKING" && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                                  <span>EN DIRECT : {formatTimer(activity.elapsedSeconds)}</span>
                                </span>
                              )}
                              {activity.status === "BLOCKED" && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                                  <span>BLOQUÉ ({formatTimer(activity.elapsedSeconds)})</span>
                                </span>
                              )}
                              {activity.status === "AVAILABLE" && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                  <span>Disponible</span>
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">{dev.jobTitle}</div>
                          </div>
                        </div>

                        {/* 2. Ce qu'il fait en temps réel (Projet & Tâche active) */}
                        <div className="flex-1 min-w-[280px]">
                          {activity.status === "WORKING" || activity.status === "BLOCKED" ? (
                            <div
                              className={`p-2.5 rounded-xl border text-xs ${
                                activity.status === "WORKING"
                                  ? "bg-emerald-50/60 border-emerald-200"
                                  : "bg-rose-50/60 border-rose-200"
                              }`}
                            >
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className="font-mono font-bold text-sky-900 bg-sky-100 px-1.5 py-0.5 rounded text-[11px]">
                                  {activity.activeTicketReference || "TICKET"}
                                </span>
                                <span className="font-semibold text-slate-900 truncate">
                                  {activity.activeTicketTitle || "Projet SAP"}
                                </span>
                                {activity.clientCompany && (
                                  <span className="text-[10px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                                    {activity.clientCompany}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-700 flex items-start gap-1.5">
                                <span className="font-semibold text-slate-900 shrink-0">Tâche en cours :</span>
                                <span className="italic">{activity.currentTaskDescription || "Développement actif"}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs text-slate-500 flex items-center justify-between">
                              <span>{activity.currentTaskDescription || "Prêt pour affectation de ticket SAP"}</span>
                              <span className="text-[11px] font-mono font-semibold text-emerald-700">{dev.freeHours} h libres cette semaine</span>
                            </div>
                          )}
                        </div>

                        {/* 3. Actions Aliko : Imprimer son rapport + Suivre le ticket */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setPrintingReport({
                                targetType: "DEVELOPER",
                                targetId: dev.id,
                                targetName: dev.name,
                                targetEmail: dev.email,
                                role: "DEVELOPER",
                                jobTitle: dev.jobTitle
                              })
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-50 text-sky-900 hover:bg-sky-100 border border-sky-300 transition-colors shadow-2xs cursor-pointer"
                            title={`Imprimer le rapport de travail détaillé de ${dev.name}`}
                          >
                            <Printer className="w-3.5 h-3.5 text-sky-700" />
                            <span>Imprimer son rapport</span>
                          </button>

                          {activity.activeTicketId && (() => {
                            const activeTicket = tickets.find((t) => t.id === activity.activeTicketId);
                            if (!activeTicket) return null;
                            return (
                              <button
                                type="button"
                                onClick={() => setSupervisingTicket(activeTicket)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                                title="Superviser la progression de ce ticket"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-600" />
                                <span>Voir projet</span>
                              </button>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  });
                })()}
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
                        {(() => {
                          const act = devLiveActivities[dev.id];
                          if (act?.status === "WORKING") {
                            return (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                                <span>{formatTimer(act.elapsedSeconds)}</span>
                              </span>
                            );
                          }
                          if (act?.status === "BLOCKED") {
                            return (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                                <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                                <span>Bloqué</span>
                              </span>
                            );
                          }
                          return (
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Actif
                            </span>
                          );
                        })()}
                      </div>

                      <p className="text-xs text-slate-600 font-medium mb-2">{dev.jobTitle}</p>

                      {/* Activité Temps Réel du Développeur */}
                      {(() => {
                        const act = devLiveActivities[dev.id];
                        if (act?.status === "WORKING") {
                          return (
                            <div className="mb-3 p-2 bg-emerald-50 rounded-lg border border-emerald-200 text-xs">
                              <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-900 mb-0.5">
                                <span className="font-mono font-bold">{act.activeTicketReference}</span>
                                <span className="font-mono text-[10px] text-emerald-700">{formatTimer(act.elapsedSeconds)}</span>
                              </div>
                              <p className="text-[11px] text-emerald-800 font-medium truncate">{act.activeTicketTitle}</p>
                              <p className="text-[10px] text-emerald-600 italic truncate mt-0.5">{act.currentTaskDescription}</p>
                            </div>
                          );
                        }
                        if (act?.status === "BLOCKED") {
                          return (
                            <div className="mb-3 p-2 bg-rose-50 rounded-lg border border-rose-200 text-xs">
                              <div className="flex items-center justify-between text-[11px] font-semibold text-rose-900 mb-0.5">
                                <span className="font-mono font-bold">{act.activeTicketReference}</span>
                                <span className="font-mono text-[10px] text-rose-700">Stop-the-line</span>
                              </div>
                              <p className="text-[10px] text-rose-700 italic truncate">{act.currentTaskDescription}</p>
                            </div>
                          );
                        }
                        return null;
                      })()}

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

                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-mono">Profil : DEVELOPER</span>
                      <button
                        onClick={() =>
                          setPrintingReport({
                            targetType: "DEVELOPER",
                            targetId: dev.id,
                            targetName: dev.name,
                            targetEmail: dev.email,
                            role: "DEVELOPER",
                            jobTitle: dev.jobTitle
                          })
                        }
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-sky-800 hover:text-sky-950 bg-sky-50 hover:bg-sky-100 border border-sky-300 px-2.5 py-1 rounded-lg transition-colors cursor-pointer shadow-2xs"
                        title="Imprimer le relevé d'heures de ce développeur"
                      >
                        <Printer className="w-3.5 h-3.5 text-sky-700" />
                        <span>Imprimer son rapport</span>
                      </button>
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
                      <span className="text-[10px] text-slate-400 font-mono">Profil : CONSULTANT</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() =>
                            setPrintingReport({
                              targetType: "CONSULTANT",
                              targetId: c.id,
                              targetName: c.name,
                              targetEmail: c.email,
                              role: "CONSULTANT",
                              jobTitle: c.speciality
                            })
                          }
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-800 hover:text-purple-950 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                          title="Imprimer le rapport d'activité de cette consultante"
                        >
                          <Printer className="w-3 h-3 text-purple-700" />
                          <span>Rapport d'activité</span>
                        </button>
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Espace cloisonné</span>
                        </span>
                      </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#051638]/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-[#0062E6] to-[#00B89C]" />
            <div className="p-5 border-b border-slate-100 text-center bg-white">
              <img
                src="/tandem-logo.jpg"
                alt="Tandem — Du besoin à la solution."
                className="h-11 w-auto object-contain mx-auto mb-2"
              />
              <h3 className="font-bold text-[#051638] text-base">Connexion — Tandem</h3>
              <p className="text-xs text-[#5A7088]">Du besoin à la solution. — Safir Consulting (BU SME)</p>
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
      {/* MODALE 1 : SAISIE DU RESTE À FAIRE (RÉSERVÉ DÉVELOPPEUR)           */}
      {/* ================================================================= */}
      {editingRafTicket && currentUser?.role === "DEVELOPER" && (
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
      {/* MODALE 2-BIS : REJET DE RECETTE PAR LA CONSULTANTE & RENVOI EN DÉV */}
      {/* ================================================================= */}
      {rejectingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl border border-rose-200 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b border-rose-100 flex items-center justify-between bg-rose-50/90">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-rose-700" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Renvoyer en Correction chez les Développeurs</h3>
                  <p className="text-[11px] text-rose-800">Recette non conforme — Notification immédiate de l'équipe</p>
                </div>
              </div>
              <button onClick={() => setRejectingTicket(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRejectTicketByConsultant} className="p-5 space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-1">
                <div>
                  <span className="font-semibold text-slate-500">Ticket testé : </span>
                  <span className="font-mono font-bold text-slate-900">{rejectingTicket.reference}</span> — {rejectingTicket.title}
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Développeur dédié : </span>
                  <strong className="text-slate-900">{rejectingTicket.assignedDeveloper?.name || "Équipe de développement"}</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Motif du problème / Anomalie constatée lors de votre test *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Décrivez précisément l'erreur, le cas de test en échec ou le comportement inattendu (ex : Le calcul de TVA sur la facture d'acompte ne prend pas en compte le taux réduit à 5.5% sous SAP B1)..."
                  value={rejectionReasonText}
                  onChange={(e) => setRejectionReasonText(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Ce message sera consigné dans le fil d'échange officiel du ticket et transmis au développeur.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Charge complémentaire estimée pour la reprise (heures) :
                </label>
                <input
                  type="number"
                  min={1}
                  max={40}
                  value={rejectionAdditionalHours}
                  onChange={(e) => setRejectionAdditionalHours(Number(e.target.value))}
                  className="w-32 text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
                <span className="text-[11px] text-slate-500 ml-2">heures rajoutées au Reste À Faire (RAF) du développeur</span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingTicket(null)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800 bg-slate-100 rounded-lg cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Confirmer le Renvoi en Correction</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODALE 3 : CRÉATION DE TICKET SAP (RÉSERVÉE HEAD & CONSULTANT)   */}
      {/* ================================================================= */}
      {showCreateModal && currentUser?.role !== "DEVELOPER" && (
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
      {/* MODALE 4 : AFFECTATION DU TICKET PAR ALIKO (HEAD EXCLUSIF)       */}
      {/* ================================================================= */}
      {assigningTicket && currentUser?.role === "HEAD" && (
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
      {/* MODALE 5 : INTÉGRATION D'UN NOUVEAU DÉVELOPPEUR PAR ALIKO (HEAD EXCLUSIF) */}
      {/* ================================================================= */}
      {showAddDevModal && currentUser?.role === "HEAD" && (
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
      {/* MODALE 6 : CRÉATION D'UN PROFIL CONSULTANT PAR ALIKO (HEAD EXCLUSIF) */}
      {/* ================================================================= */}
      {showAddConsultantModal && currentUser?.role === "HEAD" && (
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
      {/* MODALE 7 : SUPERVISION DU TICKET & OEIL DIRECTION D'ALIKO (HEAD EXCLUSIF) */}
      {/* ================================================================= */}
      {supervisingTicket && currentUser?.role === "HEAD" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Entête de la Modale */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900 text-white">
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

            {/* Statut Recette & Condition de Clôture pour Aliko */}
            {supervisingTicket.status === "DELIVERED" && (
              <div className="px-5 py-3 border-t border-slate-200 bg-white">
                {supervisingTicket.consultantReviewStatus === "APPROVED" ? (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-300 text-xs text-emerald-950 flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-bold">Recette approuvée par la consultante ({supervisingTicket.applicantName || "Mélissa Diakité"}). </span>
                        <span className="text-emerald-800">Toutes les conditions contractuelles sont remplies pour la clôture définitive.</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-950 font-bold font-mono text-[10px] uppercase shrink-0">
                      Prêt pour Clôture
                    </span>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 text-xs text-amber-950 flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-2">
                      <Lock className="w-5 h-5 text-amber-700 shrink-0" />
                      <div>
                        <span className="font-bold">Clôture souveraine verrouillée : </span>
                        <span className="text-amber-800">
                          La consultante ({supervisingTicket.applicantName || "Mélissa Diakité"}) doit d'abord tester la solution livrée et certifier la conformité de la recette.
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-950 font-bold font-mono text-[10px] uppercase shrink-0">
                      En Attente Test
                    </span>
                  </div>
                )}
              </div>
            )}

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

                    {supervisingTicket.status === "DELIVERED" ? (
                      supervisingTicket.consultantReviewStatus === "APPROVED" ? (
                        <button
                          onClick={() => handleCloseTicket(supervisingTicket.id)}
                          className="px-4 py-1.5 text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 text-white bg-emerald-700 hover:bg-emerald-800 ring-2 ring-emerald-400 transition-all cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Valider la Clôture Définitive (Recette Approuvée)</span>
                        </button>
                      ) : (
                        <button
                          disabled
                          className="px-4 py-1.5 text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 text-slate-400 bg-slate-200 border border-slate-300 cursor-not-allowed opacity-80"
                          title="La consultante doit d'abord tester et approuver la recette de la solution livrée."
                        >
                          <Lock className="w-4 h-4 text-slate-400" />
                          <span>Clôture en attente de Recette Consultante</span>
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => handleCloseTicket(supervisingTicket.id)}
                        className="px-4 py-1.5 text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 text-white bg-slate-800 hover:bg-slate-900 transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Clôturer le Ticket (Réglé)</span>
                      </button>
                    )}
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
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900 text-white">
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
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-[#051638] text-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#00B89C]/20 text-[#22F0D2] rounded-xl border border-[#00B89C]/30">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#00B89C]/20 text-[#22F0D2] border border-[#00B89C]/30">
                    Tandem — Reporting Comité de Direction — Safir Consulting
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

      {/* ================================================================= */}
      {/* MODALE 11 : IMPRESSION DES RAPPORTS DÉTAILLÉS D'HEURES ET ACTIVITÉ */}
      {/* (Accessible par le Développeur et par Aliko pour toute son équipe)*/}
      {/* ================================================================= */}
      {printingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in print:p-0 print:bg-white print:static">
          <div className="bg-white rounded-2xl border border-slate-300 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden print:border-none print:shadow-none print:max-w-full print:max-h-none print:overflow-visible">
            {/* Barre de contrôle d'impression (masquée à l'impression réelle) */}
            <div className="p-4 bg-[#051638] text-white flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
              <div className="flex items-center gap-2.5">
                <Printer className="w-5 h-5 text-[#22F0D2]" />
                <div>
                  <h3 className="font-bold text-sm">Tandem • Rapport d'Activité & Feuilles de Temps — Safir Consulting</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px]">
                    <span className="text-slate-400">Collaborateur (Changer de développeur) :</span>
                    {currentUser?.role === "HEAD" && printingReport.targetType === "DEVELOPER" ? (
                      <select
                        value={printingReport.targetId}
                        onChange={(e) => {
                          const chosenDev = developers.find((d) => d.id === e.target.value);
                          if (chosenDev) {
                            setPrintingReport({
                              targetType: "DEVELOPER",
                              targetId: chosenDev.id,
                              targetName: chosenDev.name,
                              targetEmail: chosenDev.email,
                              role: "DEVELOPER",
                              jobTitle: chosenDev.jobTitle
                            });
                          }
                        }}
                        className="bg-slate-800 text-sky-300 font-bold border border-slate-700 rounded px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                      >
                        {developers.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.jobTitle})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="font-semibold text-white">{printingReport.targetName} ({printingReport.role})</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Lancer l'impression / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintingReport(null)}
                  aria-label="Fermer le rapport"
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>

            {/* SÉLECTEUR DE PÉRIODE D'IMPRESSION (JOURNALIER, HEBDO, MENSUEL, TRIMESTRIEL, SEMESTRIEL, ANNUEL) */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
              <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span>Sélectionner la période du rapport :</span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200">
                {[
                  { key: "DAILY", label: "Journalier" },
                  { key: "WEEKLY", label: "Hebdomadaire" },
                  { key: "MONTHLY", label: "Mensuel" },
                  { key: "QUARTERLY", label: "Trimestriel" },
                  { key: "SEMESTER", label: "Semestriel" },
                  { key: "YEARLY", label: "Annuel" }
                ].map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setReportPeriod(p.key as any)}
                    className={`px-3 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
                      reportPeriod === p.key
                        ? "bg-sky-700 text-white font-bold shadow-xs"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* DOCUMENT OFFICIEL IMPRIMABLE */}
            <div className="p-8 space-y-6 text-slate-900 bg-white overflow-y-auto flex-1 print:overflow-visible print:p-0" id="printable-report">
              {/* En-tête d'Entreprise Corporate */}
              <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <img
                      src="/tandem-logo.jpg"
                      alt="Tandem — Du besoin à la solution."
                      className="h-10 w-auto object-contain"
                    />
                    <span className="text-slate-300">|</span>
                    <span className="text-base font-black tracking-tight text-slate-900">Safir Consulting</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    Tandem — Du besoin à la solution. | Business Unit SME — Pilotage des Développements & Intégrations SAP
                  </p>
                </div>

                <div className="sm:text-right">
                  <div className="inline-block px-3 py-1 rounded bg-slate-100 text-slate-800 text-xs font-mono font-bold uppercase tracking-wider border border-slate-200">
                    Rapport Périodique : {
                      reportPeriod === "DAILY" ? "Journalier (29 Octobre 2026)" :
                      reportPeriod === "WEEKLY" ? "Hebdomadaire (Semaine 44 — 2026)" :
                      reportPeriod === "MONTHLY" ? "Mensuel (Octobre 2026)" :
                      reportPeriod === "QUARTERLY" ? "Trimestriel (T4 2026)" :
                      reportPeriod === "SEMESTER" ? "Semestriel (S2 2026)" : "Annuel (Exercice 2026)"
                    }
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Édité le 29/10/2026 à {new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>

              {/* Fiche Collaborateur & Contexte */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Collaborateur SAP</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">{printingReport.targetName}</div>
                  <div className="text-slate-600 font-mono text-[11px]">{printingReport.targetEmail}</div>
                  <div className="text-slate-700 font-medium mt-1">{printingReport.jobTitle || "Développeur Solutions SAP"}</div>
                </div>

                <div className="sm:text-right space-y-1">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Supervision & Direction</div>
                  <div className="text-xs font-bold text-slate-900">Aliko Getheme (HEAD — Directeur BU SME)</div>
                  <div className="text-[11px] text-slate-600">Base SAP : SAP Business One & SAP S/4HANA</div>
                  <div className="text-[11px] text-emerald-800 font-semibold">Statut : Validé au Référentiel Central</div>
                </div>
              </div>

              {/* Filtrage et Calcul des Heures Réelles selon la Période Choisie */}
              {(() => {
                const targetEmailLower = printingReport.targetEmail.toLowerCase();
                const devLogs = timeLogs.filter(
                  (l) =>
                    l.developerEmail.toLowerCase() === targetEmailLower ||
                    l.developerId === printingReport.targetId ||
                    (printingReport.targetType === "CONSULTANT" && l.ticketTitle.toLowerCase().includes("sap"))
                );

                const filteredLogs = devLogs.filter((l) => {
                  if (reportPeriod === "DAILY") return l.date === "2026-10-29";
                  if (reportPeriod === "WEEKLY") return l.date >= "2026-10-26" && l.date <= "2026-10-31";
                  if (reportPeriod === "MONTHLY") return l.date.startsWith("2026-10");
                  if (reportPeriod === "QUARTERLY") return l.date >= "2026-10-01" && l.date <= "2026-12-31";
                  if (reportPeriod === "SEMESTER") return l.date >= "2026-07-01" && l.date <= "2026-12-31";
                  if (reportPeriod === "YEARLY") return l.date.startsWith("2026");
                  return true;
                });

                const totalH = filteredLogs.reduce((sum, l) => sum + (l.durationHours || 0), 0);
                const distinctClients = Array.from(new Set(filteredLogs.map((l) => l.clientCompany)));
                const distinctTickets = Array.from(new Set(filteredLogs.map((l) => l.ticketReference)));

                return (
                  <>
                    {/* Indicateurs Synthétiques Périodiques */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 bg-sky-50 rounded-xl border border-sky-200">
                        <div className="text-[10px] text-sky-800 font-bold uppercase tracking-wider">Total Heures Travaillées</div>
                        <div className="text-2xl font-black text-sky-950 font-mono mt-0.5">{totalH.toFixed(1)} h</div>
                        <div className="text-[10px] text-sky-700 mt-0.5">Temps décompté certifié</div>
                      </div>

                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                        <div className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">Sessions de Travail</div>
                        <div className="text-2xl font-black text-emerald-950 font-mono mt-0.5">{filteredLogs.length}</div>
                        <div className="text-[10px] text-emerald-700 mt-0.5">Pointages enregistrés</div>
                      </div>

                      <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                        <div className="text-[10px] text-purple-800 font-bold uppercase tracking-wider">Tickets Couverts</div>
                        <div className="text-2xl font-black text-purple-950 font-mono mt-0.5">{distinctTickets.length}</div>
                        <div className="text-[10px] text-purple-700 mt-0.5">Demandes SAP distinctes</div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Comptes Clients</div>
                        <div className="text-2xl font-black text-slate-900 font-mono mt-0.5">{distinctClients.length}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Entreprises bénéficiaires</div>
                      </div>
                    </div>

                    {/* Tableau Détaillé des Lignes d'Heures & Tâches Réalisées */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-800 text-[11px]">
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Réf. Ticket</th>
                            <th className="py-2.5 px-3">Client / Entreprise</th>
                            <th className="py-2.5 px-3">Description & Tâche Effectuée</th>
                            <th className="py-2.5 px-3 text-right">Durée Réelle</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredLogs.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-6 text-center text-slate-400 italic">
                                Aucun relevé d'heures consigné pour la période sélectionnée ({reportPeriod}).
                              </td>
                            </tr>
                          ) : (
                            filteredLogs.map((log) => (
                              <tr key={log.id} className="hover:bg-slate-50/60">
                                <td className="py-2.5 px-3 font-mono font-medium text-slate-700 whitespace-nowrap">
                                  {log.date}
                                </td>
                                <td className="py-2.5 px-3 font-mono font-bold text-sky-800 whitespace-nowrap">
                                  {log.ticketReference}
                                </td>
                                <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                                  {log.clientCompany}
                                </td>
                                <td className="py-2.5 px-3 text-slate-700">
                                  <div className="font-medium text-slate-900 leading-tight">{log.ticketTitle}</div>
                                  {log.note && <div className="text-[11px] text-slate-500 mt-0.5 italic">{log.note}</div>}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                                  {log.durationHours} h <span className="text-[10px] text-slate-500 font-normal">({log.durationMinutes} min)</span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-100/80 font-bold text-slate-900 border-t border-slate-200">
                            <td colSpan={4} className="py-2.5 px-3 text-right uppercase text-[11px] tracking-wider text-slate-600">
                              Total des heures enregistrées sur la période :
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-black text-sm text-sky-950">
                              {totalH.toFixed(1)} h
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </>
                );
              })()}

              {/* Zone d'Émargement & Signatures Officielles */}
              <div className="pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs">
                <div className="space-y-12">
                  <div>
                    <span className="font-bold text-slate-900">Visa & Émargement du Collaborateur</span>
                    <p className="text-[11px] text-slate-500">{printingReport.targetName} ({printingReport.role})</p>
                  </div>
                  <div className="border-t border-dashed border-slate-400 pt-1 text-[10px] text-slate-400 font-mono">
                    Signature Collaborateur
                  </div>
                </div>

                <div className="space-y-12 text-right">
                  <div>
                    <span className="font-bold text-slate-900">Approbation & Clôture de Direction</span>
                    <p className="text-[11px] text-slate-500">Aliko Getheme — Directeur BU SME</p>
                  </div>
                  <div className="border-t border-dashed border-slate-400 pt-1 text-[10px] text-slate-400 font-mono">
                    Signature & Cachet Safir Consulting
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
