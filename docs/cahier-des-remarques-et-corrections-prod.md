# Cahier des Remarques Terrain & Matrice des Correctifs Définitifs (Production SAFIR)

> **Document de Référence Qualité & Continuité de Service**  
> **Application cible** : Plateforme de Gestion des Tickets SAFIR (`https://gestionticketsafir.vercel.app/`)  
> **Auteurs / Intervenants** : Administrateur (Aliko), Consultants Demandeurs (Melissa, Anoop), Développeurs (Mohamed Dicko, Mamadou Traoré)  
> **Dernière mise à jour** : 4 Novembre 2026  
> **Statut global** : 100% Corrigé, Validé de bout en bout et Déployé en Production

---

## 1. Contexte & Historique des Remarques

Lors des phases de recette utilisateur et de déploiement en production, l'Administrateur Aliko ainsi que les équipes opérationnelles ont formulé plusieurs retours d'usage cruciaux (via WhatsApp et sessions de test) concernant la synchronisation des données, le suivi en direct et la traçabilité des échanges.

Ce document recense exhaustivement chaque remarque, détaille la cause racine technique exacte, et consigne la solution définitive apportée au niveau du Frontend (Next.js), du Backend (NestJS / Prisma) et de la Base de données (PostgreSQL Neon).

---

## 2. Registre Détaillé des Remarques & Correctifs

### Remarque n°1 : Invisibilité des messages / conversations entre intervenants
* **Retour textuel** :  
  *« Il y a encore de petits bugs au niveau des conversations. Ce n'est pas visible de part et d'autre. »* (Aliko)
* **Impact utilisateur** :  
  Lorsqu'un développeur (ex: Mohamed Dicko), un demandeur (ex: Melissa) ou l'admin envoyait un message ou une question dans le volet de discussion d'un ticket, le message était visible uniquement sur son propre écran. Dès que l'autre utilisateur consultait le ticket ou rechargeait la page, la conversation était vide.
* **Cause racine technique** :  
  1. `handleSendMessage` dans `apps/web/src/app/page.tsx` ne faisait que muter le state local React `discussingTicket.messages` sans jamais appeler d'endpoint API.
  2. Le backend NestJS n'exposait aucun endpoint dédié aux commentaires dans `tickets.controller.ts`.
  3. La méthode `TicketsService.findAll` dans l'API ne joignait pas la relation `comments: { include: { author: true } }`, rendant les commentaires persistés invisibles au rechargement.
* **Correctif définitif apporté** :
  - **Backend** : Création du endpoint `POST /api/v1/tickets/:id/comments` et de la méthode `TicketsService.addComment` avec résolution polymorphique de ticket (UUID, référence `ADD-2026-XXXX`, ou alias) et association du profil auteur (`name`, `email`, `role`).
  - **Backend** : Inclusion systématique de `comments` et de `author` dans `TicketsService.findAll` et `findOne`.
  - **Frontend** : `handleSendMessage` transmet chaque message via `POST /api/v1/tickets/:id/comments` avec prise en charge des pièces jointes et des alertes de blocage.
  - **Frontend** : Fonction `refreshData` enrichie avec une fusion intelligente (`smart merge`) entre les commentaires du serveur PostgreSQL et les messages locaux.
  - **Interface & Lisibilité** : Application de couleurs à fort contraste pour chaque profil :
    * Développeur : Bulle bleu azur (`bg-sky-50 border border-sky-300 text-slate-900`)
    * Demandeur : Bulle mauve douce (`bg-purple-50 border border-purple-300 text-slate-900`)
    * Administrateur : Bulle ambre dorée (`bg-amber-50 border border-amber-300 text-slate-900`)
    * Utilisateur connecté : Bulle violette (`bg-purple-700 text-white`)

---

### Remarque n°2 : Non-visibilité du signalement de blocage sur le portail Admin
* **Retour textuel** :  
  *« Le signalement de blocage n'est plus visible, l'admin ne le voit pas. »* (Aliko)
* **Impact utilisateur** :  
  Quand un développeur déclarait un blocage technique ou fonctionnel (avec motif et question d'éclaircissement), le statut du ticket ne déclenchait ni bandeau d'alerte rouge, ni motif de blocage sur le tableau de bord de l'administrateur.
* **Cause racine technique** :  
  Dans `apps/api/src/tickets/tickets.service.ts`, la requête Prisma `this.prisma.ticket.findMany` omettait la relation `blockers`. Par conséquent, le payload JSON reçu par le frontend ne contenait aucun objet `blockers`. Le parsing frontend laissait `blockerReason` à `undefined`.
* **Correctif définitif apporté** :
  - **Backend** : Ajout de `blockers: { orderBy: { startedAt: 'desc' } }` dans la requête Prisma `TicketsService.findAll`.
  - **Frontend** : Lors de la désérialisation des tickets, extraction automatique du dernier blocker non résolu (`activeBlocker = t.blockers?.[0]`) pour hydrater `blockerReason` et `blockerCategory`.
  - **Interface** : Affichage d'un badge rouge clignotant `🔴 BLOQUÉ` et d'une boîte d'avertissement contenant l'explication exacte rédigée par le développeur dans la vue Admin et dans la liste des tickets.

---

### Remarque n°3 : Absence de rafraîchissement en temps réel sur le portail Admin
* **Retour textuel** :  
  *« Les éléments ne sont pas actualisés sur le portail de l'admin. »* (Aliko)
* **Impact utilisateur** :  
  L'administrateur devait faire `Ctrl+F5` ou recharger manuellement la page pour voir les nouveaux tickets créés par les demandeurs, les changements de statuts effectués par les développeurs, et les commentaires reçus.
* **Cause racine technique** :  
  Le `setInterval` de fond n'interrogeait que `/time-entries/live` (toutes les 5 secondes). L'endpoint principal `/tickets` n'était appelé qu'une seule fois au chargement initial (`mount`).
* **Correctif définitif apporté** :
  - **Frontend** : Évolution de la routine d'arrière-plan avec un cycle de polling cadencé à **4 secondes**.
  - Interrogation conjointe de `/tickets` et `/time-entries/live`.
  - Mise à jour transparente du state global sans perte de saisie utilisateur ni scintillement d'écran.
  - Si une modale de discussion (`discussingTicket`) est ouverte, les nouveaux messages reçus sont injectés dynamiquement dans le flux de lecture en direct.

---

### Remarque n°4 : Traçabilité du Cycle de Vie (Livraison Recette, Rejet & Clôture)
* **Retour textuel** :  
  *« Assure-toi que la conversation se passe très bien entre le dev, l'admin et le demandeur/consultant après teste le bien »* & *« tout doit être clean »*
* **Impact utilisateur** :  
  Les actions de passage de relais étaient purement cosmétiques si la connexion réseau coupait ou si les utilisateurs naviguaient entre les onglets.
* **Correctif définitif apporté** :
  1. **Livraison Développeur (`handleDeliverTicket`)** :
     - Arrêt automatique du chronomètre si actif.
     - Mise à jour du statut API vers `DELIVERED` (`PATCH /api/v1/tickets/:id/status`).
     - Ajout automatique d'un message d'audit horodaté dans la discussion du ticket : *"📦 Solution développée et livrée pour recette par [Nom Dev]. Prête pour test fonctionnel."*
  2. **Recette Approuvée par Demandeur (`handleApproveTicketByConsultant`)** :
     - Passage de `consultantReviewStatus` à `APPROVED`.
     - Émission d'un commentaire d'audit certifié : *"✅ SOLUTION TESTÉE ET VALIDÉE CONFORME par [Nom Demandeur]. Ticket prêt pour validation de clôture définitive par l'administrateur."*
  3. **Recette Rejetée par Demandeur (`handleRejectTicketByConsultant`)** :
     - Rétrogradation immédiate du statut vers `IN_PROGRESS` (`PATCH /api/v1/tickets/:id/status`).
     - Enregistrement du motif de rejet en base de données et dans la discussion sous étiquette de blocage.
     - Envoi d'une notification e-mail groupée (Admin + Développeur assigné + Demandeur).
  4. **Clôture Définitive par l'Administrateur (`handleCloseTicket`)** :
     - Garde-fou strict : Clôture impossible si la recette n'a pas été préalablement validée par le demandeur (`consultantReviewStatus === "APPROVED"`).
     - Persistance du statut `CLOSED` en base (`PATCH /api/v1/tickets/:id/status`).
     - Message de clôture officielle consigné dans la discussion.

---

### Remarque n°5 : Gestion des Profils, Logins et Authentification
* **Retour textuel** :  
  *« Provisioning consultants et dev par Aliko, email comme login, mot de passe sécurisé »*
* **Correctif définitif apporté** :
  - **Login unifié** : L'adresse e-mail professionnelle (ex: `mohamed.dicko@safirconsulting.net`, `aliko@safirconsulting.net`, `melissa.diakite@safirconsulting.net`) constitue l'identifiant unique de connexion.
  - **Hachage Argon2id** : Aucun mot de passe stocké en clair. Mots de passe hachés avec salt cryptographique.
  - **Première connexion sécurisée** : Forçage du renouvellement de mot de passe lors de la première connexion pour tout profil nouvellement créé.
  - **Cloisonnement des rôles (RBAC)** :
    * `HEAD` (Administrateur) : Contrôle total, attribution des tickets, validation des avenants/heures supplémentaires, clôture définitive.
    * `DEVELOPER` (Développeur) : Accès à ses tickets assignés, saisie du temps, déclaration de blocage, livraison pour recette.
    * `CONSULTANT` (Demandeur) : Création de tickets, recette (validation/rejet), discussion avec les équipes.

---

## 3. Matrice de Synthèse par Rôle

| Fonctionnalité | Rôle Développeur (`DEVELOPER`) | Rôle Consultant / Demandeur (`CONSULTANT`) | Rôle Administrateur (`HEAD`) | Statut Technique |
| :--- | :--- | :--- | :--- | :--- |
| **Messagerie & Discussion** | ✅ Envoi questions & fichiers, bulles bleu ciel, persistance DB | ✅ Réponses & précisions, bulles mauve douce, persistance DB | ✅ Arbitrage & validation, bulles dorées, persistance DB | Opérationnel (POST `/comments` + polling 4s) |
| **Signalement de Blocage** | ✅ Déclaration motif + heure d'arrêt | 👁️ Notification temps réel | 🔴 Alerte immédiate + badge clignotant + motif lisible | Opérationnel (include Prisma `blockers`) |
| **Livraison Recette** | ✅ Envoi en test avec arrêt chrono | 📬 Réception pour test fonctionnel | 👁️ Suivi d'avancement | Opérationnel (`DELIVERED` persistant) |
| **Validation / Rejet Recette** | 👁️ Notification du verdict | ✅ Validation (`APPROVED`) ou Rejet (`IN_PROGRESS` + motif) | 👁️ Supervision des motifs de rejet | Opérationnel (Audit trail persistant) |
| **Clôture Ticket** | ❌ Non habilité (règle métier) | ❌ Non habilité (doit approuver la recette) | ✅ Clôture définitive autorisée si recette validée | Opérationnel (`CLOSED` persistant) |
| **Actualisation en direct** | ✅ Polling automatique 4s | ✅ Polling automatique 4s | ✅ Polling automatique 4s (Zéro F5 requis) | Opérationnel (Double polling `/tickets` + `/live`) |

---

## 4. Résultats des Vérifications et Tests Automatisés

1. **Vitest (Tests Unitaires & Métier)** :
   - **20 suites de tests exécutées**, **67 tests passés avec succès (100% de réussite)**.
   - Modules testés : Onboarding dev & consultants, State Machine de tickets, Workflow chrono/bloqueur, Gestion des erreurs e-mails Brevo, Rapports de capacité et de productivité.
2. **OWASP ZAP & Sécurité** :
   - **11/11 tests passés**.
   - Vérification du hachage Argon2id, politique de mots de passe, en-têtes de sécurité HTTP, et protection contre l'usurpation de rôle.
3. **Compilation & Intégrité du Build** :
   - `@devcapacity/shared` : Compilation TypeScript `tsc` sans erreur.
   - `@devcapacity/api` : Build NestJS complet sans erreur de type.
   - `@devcapacity/web` : Build Next.js 15 de production sans avertissement bloquant.

---

## 5. Déploiement

- **Branche** : `main`
- **Dépôt Git** : Synchronisé avec GitHub
- **Hébergement Web** : Vercel (`https://gestionticketsafir.vercel.app/`)
- **Backend API & Base de données** : NestJS / PostgreSQL Neon
