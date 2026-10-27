# Spécification d'API REST — DevCapacity Manager

> Livrable **Phase 1 — Cadrage & Conception** · Version 1.0
> Références : [cahier-des-charges.md](./cahier-des-charges.md) · [architecture.md](./architecture.md) · [business-rules.md](./business-rules.md) · [data-model.md](./data-model.md)

---

## 1. Principes généraux

- **Base URL** : `/api/v1`
- **Format d'échange** : `application/json` (encodage UTF-8)
- **Authentification** : Cookie de session `httpOnly; Secure; SameSite=Lax` émis lors du SSO Microsoft Entra ID (ou login local de repli)
- **Protection CSRF** : Header `X-CSRF-Token` exigé sur toutes les requêtes mutantes (`POST`, `PUT`, `PATCH`, `DELETE`)
- **Pagination standard** : `?page=1&limit=20` (renvoie `{ data: [...], meta: { page, limit, total, totalPages } }`)
- **Gestion des erreurs** : Schéma normalisé RFC 7807 (Problem Details) :
  ```json
  {
    "statusCode": 409,
    "error": "Conflict",
    "message": "CAPACITY_EXCEEDED",
    "details": "Le développeur sélectionné n'a pas la capacité requise sur cette période."
  }
  ```

---

## 2. Synthèse des endpoints

### 2.1. Authentification & Sessions (`/auth`)
- `GET /auth/entra/login` : Initie le flux OIDC avec Microsoft Entra ID (PKCE).
- `GET /auth/entra/callback` : Réception du code d'autorisation, validation et création de session.
- `POST /auth/local/login` : Login local sécurisé (argon2id) pour repli/développement.
- `POST /auth/logout` : Révocation de la session active et suppression du cookie.
- `GET /auth/me` : Profil de l'utilisateur connecté, ses rôles et permissions.

### 2.2. Utilisateurs & Développeurs (`/users`, `/developers`)
- `GET /users` : Liste des comptes (réservé `ADMIN` ou `HEAD`).
- `GET /developers` : Référentiel des profils développeurs, capacité contractuelle, statut.
- `GET /developers/:id` : Détail d'un développeur (compétences validées, affectations en cours, indicateur de fiabilité).
- `PATCH /developers/:id` : Mise à jour du profil, des horaires hebdomadaires (`HEAD`).
- `GET /developers/:id/availability` : Calendrier des indisponibilités approuvées et prévisions.
- `POST /developers/:id/availabilities` : Déclaration d'une absence/congé/activité réservée (`DEVELOPER` ou `HEAD`).

### 2.3. Compétences (`/skills`)
- `GET /skills` : Catalogue des compétences techniques.
- `POST /skills` : Ajout d'une compétence au catalogue (`HEAD`).
- `PUT /developers/:id/skills` : Mise à jour/évaluation des compétences d'un développeur (`HEAD`).

### 2.4. Clients, Contacts & Projets (`/clients`, `/projects`)
- `GET /clients` : Liste des clients et leurs projets associés.
- `POST /clients` : Création d'une fiche client (`HEAD`).
- `POST /clients/:id/contacts` : Ajout d'un contact validé (adresse d'entreprise ou personnelle type Gmail validée par Aliko).
- `GET /projects` : Projets actifs et référencés.

### 2.5. Inbox & Traitement des e-mails (`/email-integration`)
- `GET /email-integration/inbox` : Liste des e-mails captés, filtres par statut (`PENDING_QUALIFICATION`, `LINKED`, `DUPLICATE`, etc.).
- `GET /email-integration/inbox/:id` : Aperçu du message, en-têtes, extraction proposée, pièces jointes.
- `POST /email-integration/inbox/:id/convert-to-ticket` : Création d'un ticket brouillon (`TO_QUALIFY`) à partir du mail.
- `POST /email-integration/inbox/:id/link-to-ticket` : Rattachement du mail comme commentaire à un ticket existant.
- `POST /email-integration/inbox/:id/ignore` : Ignorer le message (anti-spam, accusé).
- `POST /email-integration/webhook` : Point d'entrée pour les notifications Graph (sécurisé par `clientState`).

### 2.6. Tickets & Addons (`/tickets`)
- `GET /tickets` : Liste filtrable (recherche, statut, priorité, client, développeur, échéance).
- `POST /tickets` : Création manuelle d'un ticket (`HEAD`).
- `GET /tickets/:id` : Fiche complète (critères, compétences requises, historique, blocages, temps, pièces jointes).
- `PATCH /tickets/:id` : Modification des informations, de l'estimation initiale, des critères.
- `POST /tickets/:id/transition` : Changement d'état selon la machine à états (`TO_QUALIFY -> READY`, etc.).
- `POST /tickets/:id/block` : Déclaration d'un blocage avec motif obligatoire (`BLOCKED`).
- `POST /tickets/:id/unblock` : Résolution du blocage et reprise de l'état précédent.
- `GET /tickets/:id/recommendations` : Appel au moteur de recommandation (admissibilité + scoring /100).

### 2.7. Affectations & Capacité (`/assignments`, `/capacity`)
- `POST /assignments` : Confirmation d'une affectation (transactionnelle avec réservation de capacité + mise en file d'attente de l'e-mail d'affectation Outlook vers le dev).
- `PATCH /assignments/:id/progress` : Mise à jour par le développeur de l'avancement (% indicatif, temps restant estimé).
- `POST /assignments/:id/time-entries` : Enregistrement d'une ligne de temps passé (déclenche la mise à jour de `spentHours`).
- `POST /assignments/:id/release` : Libération ou réaffectation d'un ticket (avec motif tracé).
- `GET /capacity/overview` : Vue planning de l'équipe (jours/semaines/mois, capacité nette, charge réservée, surcharges).
- `GET /capacity/forecast` : Calcul des dates de disponibilité prévisionnelle des développeurs.

### 2.8. Reporting, Audit & Paramètres (`/reports`, `/audit-logs`, `/settings`)
- `GET /reports/dashboard` : KPI complets du Head of BU (demandes en attente, tickets en retard, blocages, capacité globale).
- `GET /reports/export` : Export CSV/Excel des données d'activité par client/projet/développeur.
- `GET /audit-logs` : Journal d'audit traçant toutes les affectations, dérogations et transitions d'état.
- `GET /settings` : Consultation des pondérations (45/30/15/10), seuils et préfixes de tickets.
- `PATCH /settings` : Modification des paramètres métier (`HEAD`).
