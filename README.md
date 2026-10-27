# DevCapacity Manager — Documentation du Projet

Bienvenue dans le dépôt du projet **DevCapacity Manager**, la plateforme intelligente de gestion des tickets, des addons et de la capacité de développement conçue pour l'équipe SME Business Unit de **Safir Consulting**.

---

## 📚 Documentation de référence (Phase 1 — Cadrage & Conception)

L'ensemble des exigences, de la conception architecturale, du modèle de données et des règles métier est formalisé dans le répertoire [`docs/`](./docs) :

1. **[Cahier des charges de référence](./docs/cahier-des-charges.md)** : 
   - Document contractuel exhaustif reprenant les 8 parties et 21 sections du projet.
   - Intègre les décisions métier validées : messagerie Outlook / Microsoft 365, identités d'entreprise `@safirconsulting.net`, Aliko comme point central, gestion des clients externes avec adresses personnelles, et flux d'affectation sortant par e-mail.
2. **[Architecture technique](./docs/architecture.md)** : 
   - Monolithe modulaire NestJS + Next.js (npm workspaces).
   - Diagramme de composants, ADR (décisions d'architecture 01 à 18), sécurité, intégration Microsoft Graph et gestion des risques.
3. **[Règles métier & Algorithmes](./docs/business-rules.md)** : 
   - Machine à états finis des tickets et conditions de transition.
   - Formules de calcul de capacité nette, charge et prévision de disponibilité.
   - Algorithme de filtrage et scoring sur 100 points (45/30/15/10) du moteur de recommandation.
   - Mécanisme transactionnel d'affectation avec verrou anti-concurrence.
4. **[Modèle de données & Schéma Prisma](./docs/data-model.md)** : 
   - Diagramme entités-relations normalisé.
   - Schéma Prisma PostgreSQL 16 complet et syntaxiquement validé (`schema.prisma`).
   - Contraintes relationnelles SQL et stratégie de seed.
5. **[Spécification de l'API REST](./docs/api-specification.md)** : 
   - Endpoints `/api/v1` détaillés par domaine fonctionnel.
   - Conventions d'authentification, de pagination, de sécurité CSRF et format des erreurs.
6. **[Backlog fonctionnel & technique](./docs/backlog.md)** : 
   - Découpage en 9 épiques et user stories avec priorités pour les phases 2 à 7.

---

## 🛠️ Stack technologique cible

- **Frontend** : Next.js (App Router), React, TypeScript strict, Tailwind CSS, shadcn/ui.
- **Backend** : NestJS, TypeScript, Architecture modulaire par domaine.
- **Base de données** : PostgreSQL 16, Prisma ORM.
- **Intégrations** : Microsoft Graph API (Outlook / Microsoft 365), Microsoft Entra ID (SSO OIDC).
- **Qualité & Tests** : Jest (unitaires et intégration), Playwright (E2E), validation partagée Zod.

---

## 🚀 Prochaine étape (Phase 2 — Socle Technique)

- Initialisation du monorepo npm workspaces.
- Mise en place de PostgreSQL et application des migrations Prisma initiales.
- Configuration du socle d'authentification et des Guards RBAC.
