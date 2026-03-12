# MOUVIZ

Plateforme de suivi et découverte de films - Letterboxd like

Stack Nuxt 4 + Supabase (PostgreSQL) + Drizzle + Google Auth + Seeding TMDB

## Installation

```bash
pnpm install
```

## Développement

```bash
pnpm run dev
```

## Production

```bash
pnpm run build
pnpm run preview
```

## Base de données

```bash
pnpm run db:generate
pnpm run db:migrate
pnpm run db:seed
pnpm run db:studio
```

## Documentation technique

Voir le dossier [`docs/`](./docs/) :

- [`docs/architecture.md`](./docs/architecture.md) — structure du projet, stack, conventions
- [`docs/api.md`](./docs/api.md) — toutes les routes API avec paramètres et réponses
- [`docs/database.md`](./docs/database.md) — schéma complet, relations, notes ORM
