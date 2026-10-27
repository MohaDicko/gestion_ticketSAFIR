# Backlog Fonctionnel & Technique — DevCapacity Manager

> Livrable **Phase 1 — Cadrage & Conception** · Version 1.0
> Plan de réalisation structuré par épiques et user stories avec critères d'acceptation.
> Conforme au plan en 7 phases du [cahier-des-charges.md](./cahier-des-charges.md).

---

## Vue d'ensemble des Épiques

| Épique | Intitulé | Priorité | Phase cible |
|---|---|:---:|:---:|
| **EP-01** | Socle Technique, Monorepo & Base de données | Haute | Phase 2 |
| **EP-02** | Authentification SSO Microsoft Entra ID & RBAC | Haute | Phase 2 |
| **EP-03** | Référentiel Équipe, Compétences & Clients | Haute | Phase 3 |
| **EP-04** | Gestion des Tickets, Addons & Machine à États | Haute | Phase 3 |
| **EP-05** | Moteur de Calcul de Capacité & Planning | Très Haute | Phase 4 |
| **EP-06** | Moteur d'Aide à l'Affectation (Recommandation /100) | Très Haute | Phase 4 |
| **EP-07** | Intégration E-mail Outlook (Entrant & Sortant) | Haute | Phase 5 |
| **EP-08** | Dashboards, Reporting & Pilotage Head of BU | Moyenne | Phase 6 |
| **EP-09** | Recette, Durcissement & Déploiement | Haute | Phase 7 |

---

## Détail des User Stories

### EP-01 · Socle Technique & Base de Données
- **US-01.1** : Initialisation du monorepo npm workspaces (`apps/web`, `apps/api`, `packages/shared`).
- **US-01.2** : Configuration de PostgreSQL 16 et initialisation du schéma Prisma avec contraintes relationnelles et migrations.
- **US-01.3** : Implémentation du script de seed (référentiels des types, priorités, compétences initiales).

### EP-02 · Authentification & Sécurité
- **US-02.1** : Intégration SSO OIDC Microsoft Entra ID pour les adresses `@safirconsulting.net` avec gestion des sessions serveur en base.
- **US-02.2** : Authentification locale de repli chiffrée (argon2id) pour l'environnement de développement.
- **US-02.3** : Mise en place des Guards NestJS et du `PolicyService` pour le contrôle d'accès fin (HEAD, DEVELOPER, CONSULTANT, ADMIN).

### EP-03 · Référentiels Métier & Équipe
- **US-03.1** : Gestion des profils des 8 développeurs (horaires hebdomadaires, fuseau, statut actif/congé).
- **US-03.2** : Matrice des compétences développeurs avec niveaux d'expertise de 1 à 5 et traçabilité de validation.
- **US-03.3** : Gestion des clients, de leurs projets et de leurs contacts (`ClientContact`), incluant la validation par Aliko des adresses e-mail personnelles (Gmail/Yahoo).

### EP-04 · Gestion des Tickets & Workflow
- **US-04.1** : Générateur de références lisibles et uniques (`ADD-2026-0001`, `BUG-2026-0001`, etc.) via `TicketSequence`.
- **US-04.2** : Machine à états finis (`RECEIVED` -> `TO_QUALIFY` -> `READY` -> `ASSIGNED` -> `IN_PROGRESS` -> ... -> `CLOSED`) avec validation stricte des transitions et rôles habilités.
- **US-04.3** : Gestion des critères d'acceptation obligatoires pour le passage à `READY` et validation avant clôture `CLOSED`.
- **US-04.4** : Gestion des blocages (`BLOCKED`) avec déclaration obligatoire du motif et calcul de la durée de blocage.

### EP-05 · Calcul de Capacité & Planning
- **US-05.1** : Moteur de calcul de capacité nette journalière et hebdomadaire (déduction des jours fériés et des absences approuvées sans double décompte).
- **US-05.2** : Répartition de la charge restante des affectations actives sur le calendrier de chaque développeur.
- **US-05.3** : Vue calendrier globale (journalière, hebdomadaire, mensuelle) avec mise en évidence des périodes de surcharge et détection des conflits.
- **US-05.4** : Calcul prévisionnel de la prochaine date de disponibilité et affichage de l'indicateur de fiabilité des données.

### EP-06 · Moteur d'Aide à l'Affectation
- **US-06.1** : Étape de filtrage éliminatoire (vérification des compétences requises, capacité disponible, respect de l'échéance et absences).
- **US-06.2** : Calcul déterministe et explicable du score sur 100 points (Compétences: 45 pts, Capacité: 30 pts, Échéance: 15 pts, Continuité projet: 10 pts).
- **US-06.3** : Transaction d'affectation avec verrou concurrentiel `SELECT ... FOR UPDATE` évitant le dépassement silencieux de capacité (E2E-12).
- **US-06.4** : Gestion des dérogations (override) par le responsable avec motif obligatoire tracé dans l'audit.

### EP-07 · Intégration E-mail Outlook (Microsoft Graph)
- **US-07.1** : Connexion API Microsoft Graph avec adaptateur `GraphMailProvider` et interface découplée `MailProvider`.
- **US-07.2** : Réception et ingestion des e-mails entrants vers la boîte d'Aliko (webhooks + cron de rattrapage delta query).
- **US-07.3** : Déduplication stricte des e-mails, filtrage des réponses automatiques et rattachement aux fils de discussion existants.
- **US-07.4** : Rapprochement automatique de l'expéditeur (équipe interne, consultant, contact client validé ou alerte de vigilance si adresse personnelle non reconnue).
- **US-07.5** : Écran Inbox permettant à Aliko de qualifier un e-mail en ticket ou de le relier à un ticket existant.
- **US-07.6** : Envoi automatique de l'e-mail d'affectation au développeur via Microsoft Graph dès confirmation de l'affectation.
- **US-07.7** : Détection des e-mails envoyés depuis les "Éléments envoyés" d'Outlook pour suggérer des affectations à confirmer.

### EP-08 · Interfaces Utilisateur & Reporting
- **US-08.1** : Dashboard principal du Head of BU avec KPIs clés (tickets à qualifier, retards, capacité restante, charge par dev).
- **US-08.2** : Vues de gestion des tickets (table filtrable, Kanban par statut, vue par échéance).
- **US-08.3** : Espace Développeur dédié ("Mes tickets", mise à jour de l'avancement, saisie du temps passé, signalement de blocages).
- **US-08.4** : Écran des paramètres métier (réglage des pondérations du moteur, des seuils d'alerte et des catalogues).

### EP-09 · Tests, Qualité & Déploiement
- **US-09.1** : Suite de tests unitaires sur les règles métier pures (machine à états, scoring, calcul de capacité nette).
- **US-09.2** : Tests d'intégration API NestJS / PostgreSQL (transactions d'affectation, idempotence).
- **US-09.3** : Tests E2E Playwright validant les 12 scénarios obligatoires (E2E-01 à E2E-12).
- **US-09.4** : Configuration Docker Compose pour exécution locale et documentation de déploiement.
