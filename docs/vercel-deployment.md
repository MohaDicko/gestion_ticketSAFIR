# 🚀 Guide de Déploiement sur Vercel — Ticket Manager

Ce guide détaille les étapes pour déployer la plateforme **Ticket Manager** sur [Vercel](https://vercel.com).

---

## 📋 Prérequis

- Un compte sur **[Vercel](https://vercel.com)**
- Le dépôt GitHub : **[https://github.com/MohaDicko/gestion_ticketSAFIR](https://github.com/MohaDicko/gestion_ticketSAFIR)**

---

## 🛠️ Configuration Automatique Intégrée

Le projet est déjà préconfiguré pour un déploiement Vercel sans friction :

| Fichier | Rôle |
| :--- | :--- |
| `vercel.json` | Configure le framework Next.js, le script de build monorepo et le dossier de sortie (`apps/web/.next`). |
| `package.json` | Script `vercel-build` : compile d'abord la bibliothèque partagée `@devcapacity/shared`, puis l'application `@devcapacity/web`. |
| `apps/web/package.json` | Hook `prebuild` : garantit la compilation de `@devcapacity/shared` en cas de sélection du sous-dossier `apps/web`. |
| `apps/web/next.config.mjs` | Proxy dynamique des routes `/api/v1/*` vers l'API externe définie par `API_URL` (ou mode local par défaut). |
| `apps/web/vercel.json` | Configuration de secours si Vercel est pointé directement sur `apps/web`. |

---

## 🚀 Étapes de Déploiement sur Vercel

### Option 1 : Déploiement depuis la racine (Recommandé)

1. Rendez-vous sur votre dashboard **Vercel** et cliquez sur **"Add New..."** > **"Project"**.
2. Sélectionnez le dépôt GitHub **`MohaDicko/gestion_ticketSAFIR`**.
3. Laissez les paramètres par défaut :
   - **Framework Preset** : `Next.js`
   - **Root Directory** : `./` (la racine)
   - **Build Command** : Détecté automatiquement via `vercel.json` (`npm run vercel-build`)
   - **Output Directory** : Détecté automatiquement (`apps/web/.next`)
4. Cliquez sur **"Deploy"**.

---

### Option 2 : Déploiement en ciblant le sous-dossier `apps/web`

1. Lors de l'import sur Vercel, cliquez sur **"Edit"** à côté de **Root Directory**.
2. Choisissez le dossier **`apps/web`**.
3. Cliquez sur **"Deploy"**. Le script `prebuild` compilera automatiquement les dépendances du monorepo.

---

## 🔐 Variables d'Environnement (Optionnelles)

Dans **Vercel Project Settings > Environment Variables** :

| Variable | Description | Exemple |
| :--- | :--- | :--- |
| `API_URL` | URL de votre backend NestJS en production (ex. Render, Railway, Supabase) | `https://api-safir-tickets.up.railway.app` |
| `NEXT_PUBLIC_API_URL` | Identique à `API_URL` si nécessaire côté client | `https://api-safir-tickets.up.railway.app` |

> **Note :** Si aucune variable n'est renseignée, le frontend se déploie et fonctionne immédiatement en mode démonstration autonome avec l'équipe Safir Consulting et les tickets pré-chargés.
