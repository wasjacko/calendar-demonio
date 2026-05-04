# Editorial Calendar — SKOOL Funnel

PWA installable (mobile + desktop) pour piloter ton calendrier éditorial Instagram avec une stratégie d'acquisition funnel TOFU → MOFU → BOFU vers ta communauté SKOOL.

- **Calendrier interactif** : mois, semaine, jour, liste, vue 2 mois — drag & drop, multi-filtres, recherche
- **Vue stratégique sur 8 semaines** : grille semaine par semaine avec ratio funnel et coach intégré
- **Dashboard** : KPIs, distribution funnel sur 30j, prochains posts, actions rapides
- **Éditeur post complet** : hook / caption / hashtags / CTA / brief visuel / audio + tagging funnel + format
- **9 templates système** prêts à l'emploi (Reels, Carrousels, Stories, Posts, Lives) répartis sur les 3 étapes du funnel
- **Notifications push natives** : rappel avant publication, snooze, fonctionnent app fermée (iOS 16.4+, Android, Desktop)
- **Multi-appareils** : sync temps réel via Supabase Realtime
- **PWA installable** : iPhone, Android, macOS, Windows, Linux

---

## 🚀 Setup en 10 minutes

### 1. Cloner et installer

```bash
cd editorial-calendar
npm install
```

### 2. Créer un projet Supabase

1. Va sur [app.supabase.com](https://app.supabase.com) → **New project** (gratuit, 500 Mo)
2. Choisis un mot de passe pour la DB, garde-le précieusement
3. Attends 2 min que le projet provisionne

### 3. Installer le schéma de DB

1. Dans Supabase → **SQL Editor** → **New query**
2. Copie tout le contenu de [`supabase/schema.sql`](./supabase/schema.sql)
3. **Run** — tu dois voir `Schéma installé avec succès. Templates système : 9`

Le schéma crée :
- 6 tables (`posts`, `reminders`, `push_subscriptions`, `templates`, `funnel_goals`, `settings`)
- Row Level Security activé partout (chaque user voit uniquement ses données)
- Trigger pour auto-créer les `settings` à chaque nouvel utilisateur
- 9 templates système préchargés (3 par étape funnel)

### 4. Configurer l'authentification

Dans Supabase → **Authentication** → **Providers** :
- **Email** : activer "Enable email signup" + "Magic link" (laisser le SMTP par défaut pour démarrer)
- **Google** (optionnel, recommandé) : suivre le [guide officiel](https://supabase.com/docs/guides/auth/social-login/auth-google)

Dans **Authentication** → **URL Configuration** :
- Site URL : `http://localhost:3000` (en dev) puis ton URL Vercel en prod
- Redirect URLs : ajouter `http://localhost:3000/auth/callback` et `https://TON-DOMAINE.vercel.app/auth/callback`

### 5. Variables d'environnement

```bash
cp .env.local.example .env.local
```

Remplis `.env.local` avec :

```bash
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"        # Settings → API → Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY="ey..."                        # Settings → API → anon/public
SUPABASE_SERVICE_ROLE_KEY="ey..."                            # Settings → API → service_role (secret !)
```

### 6. Générer les clés VAPID (notifications push)

```bash
npm run vapid
```

Copie les valeurs affichées dans `.env.local` :
```bash
NEXT_PUBLIC_VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
VAPID_SUBJECT="mailto:ton@email.com"
```

Génère aussi un secret pour sécuriser le cron :
```bash
openssl rand -base64 32
```
Mets-le dans `CRON_SECRET=...`.

### 7. Lancer l'app

```bash
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000), connecte-toi avec ton email → magic link.

---

## 📦 Déploiement Vercel

### 1. Push vers GitHub
```bash
git add . && git commit -m "Initial editorial calendar"
gh repo create editorial-calendar --private --source=. --push
```

### 2. Importer sur Vercel
- [vercel.com/new](https://vercel.com/new) → import du repo
- Framework auto-détecté : Next.js
- Avant de déployer, ajoute toutes les **Environment Variables** depuis ton `.env.local` (toutes sauf les commentaires)
- Deploy

### 3. Activer le cron
`vercel.json` est déjà configuré : `*/5 * * * *` → l'endpoint `/api/cron/reminders` est exécuté toutes les 5 minutes pour envoyer les notifs push aux bonnes heures.

Vercel utilise automatiquement le header `Authorization: Bearer ${CRON_SECRET}`.

### 4. Mettre à jour Supabase
Dans Supabase → Authentication → URL Configuration, ajoute ton URL Vercel à la "Site URL" et aux "Redirect URLs".

### 5. Installer la PWA sur ton tel
- **iPhone** : ouvre le site Safari → bouton Partager → "Sur l'écran d'accueil"
- **Android** : Chrome propose automatiquement "Ajouter à l'écran d'accueil"
- **Desktop** : Chrome/Edge → icône d'installation dans la barre d'URL

Tu auras une vraie app native avec icône, splash screen, et notifications push même quand l'app est fermée.

---

## 🧠 Architecture du funnel

| Étape   | Couleur | % cible | Objectif                                                          |
|---------|---------|---------|--------------------------------------------------------------------|
| **TOFU** | Cyan    | 60%     | Awareness — attirer de nouveaux profils (hooks viraux, tendances) |
| **MOFU** | Violet  | 30%     | Engagement — éduquer, construire l'autorité (carrousels, BTS)     |
| **BOFU** | Orange  | 10%     | Conversion SKOOL — témoignages, FAQ, invitations                  |

L'app vérifie ce ratio en continu et te coache dans `/strategy` si tu dérives.

## 🗂️ Structure du projet

```
editorial-calendar/
├── src/
│   ├── app/
│   │   ├── (app)/              # Routes protégées (auth requise)
│   │   │   ├── dashboard/      # KPIs + funnel + actions rapides
│   │   │   ├── calendar/       # Calendrier interactif
│   │   │   ├── strategy/       # Vue 8 semaines + coach
│   │   │   ├── templates/      # Bibliothèque templates Instagram
│   │   │   └── settings/       # Notifs, brand voice, SKOOL URL
│   │   ├── api/
│   │   │   ├── cron/reminders/ # Vercel Cron — envoi notifs (toutes 5 min)
│   │   │   ├── push/test/      # Test notification
│   │   │   └── reminders/snooze/
│   │   ├── auth/callback/      # OAuth + magic link callback
│   │   └── login/              # Page connexion
│   ├── components/
│   │   ├── calendar/           # FullCalendar + toolbar
│   │   ├── strategy/           # 8-week grid + coach
│   │   ├── ui/                 # shadcn/ui de base
│   │   ├── app-shell.tsx       # Sidebar + topbar + bottom nav mobile
│   │   ├── post-editor.tsx     # Modal édition (4 onglets)
│   │   └── pwa-register.tsx    # Service worker + install prompt
│   ├── lib/
│   │   ├── supabase/           # Clients (browser, server, middleware)
│   │   ├── types.ts            # Types + constants funnel/format/pillar
│   │   ├── posts.ts            # CRUD posts
│   │   ├── notifications.ts    # Web Push API client
│   │   ├── web-push.ts         # Web Push API server
│   │   ├── store.ts            # Zustand (UI + data cache)
│   │   └── utils.ts            # cn, formatDate, dates, base64
│   └── proxy.ts                # Auth middleware (Next 16 "proxy")
├── supabase/schema.sql         # Schéma DB complet + 9 templates
├── public/
│   ├── icons/                  # PWA icons (8 tailles + badge)
│   ├── icon.svg                # Source icon
│   ├── manifest.webmanifest    # PWA manifest
│   ├── sw.js                   # Service worker (push + cache)
│   ├── apple-touch-icon.png
│   └── og-image.png
├── scripts/
│   ├── generate-icons.mjs      # Régénère icônes depuis SVG
│   └── generate-vapid.mjs      # Génère clés VAPID push
├── vercel.json                 # Cron + headers PWA
└── .env.local.example
```

## 🛠️ Commands utiles

```bash
npm run dev           # Lance Next + Turbopack
npm run build         # Production build
npm run start         # Serveur prod
npm run icons         # Régénère les icônes PWA
npm run vapid         # Génère de nouvelles clés VAPID
npm run type-check    # Vérifie TypeScript sans build
```

## ⚙️ Customisation

- **Templates supplémentaires** : Settings → ajouter dans `templates` via Supabase Studio (champ `is_system: false` pour tes propres templates)
- **Couleurs funnel** : `src/app/globals.css` → variables `--tofu`, `--mofu`, `--bofu`
- **Nb posts/semaine** cible : Réglages dans l'app, ou constante `TARGET_PER_WEEK` dans `src/components/strategy/eight-week-grid.tsx`
- **Notifs** : `src/app/api/cron/reminders/route.ts` — règle la logique d'envoi

## 🔐 Sécurité

- Row Level Security Supabase : chaque user ne voit QUE ses données
- Service role key uniquement côté serveur (jamais exposée au client)
- VAPID private key uniquement côté serveur
- CRON_SECRET protège l'endpoint cron contre tout accès externe
- Magic links expirent automatiquement
- Pas de mot de passe stocké : zéro risque de leak

## 📱 Fonctionnement notifications push

1. User active dans `/settings` → permission browser + souscription enregistrée dans `push_subscriptions`
2. Vercel Cron tape `/api/cron/reminders` toutes les 5 min
3. La route trouve les posts `SCHEDULED` dans la prochaine heure (selon `default_reminder_minutes` du user)
4. Envoie via Web Push API (FCM Android, APNs iOS via Apple Push)
5. Service worker reçoit, affiche notif système (avec actions Voir / Snooze)
6. Click → ouvre `/calendar?post=...` directement dans l'app installée

## 🐛 Troubleshooting

**Les notifs n'arrivent pas sur iOS** : il faut iOS 16.4+ ET avoir installé l'app via "Sur l'écran d'accueil" (pas juste Safari).

**Le cron Vercel ne se déclenche pas** : vérifie que ton plan Vercel supporte les crons (Hobby = OK pour 1 cron). Logs dans Vercel → Logs → filter "cron".

**Magic link redirige sur localhost** : Settings Supabase → Authentication → URL Configuration → assure-toi que ton URL Vercel est listée.

**Drag & drop ne marche pas sur mobile** : c'est normal sur tactile pour FullCalendar — utilise le clic + édition de la date dans l'éditeur.

---

Bonne acquisition 🚀
