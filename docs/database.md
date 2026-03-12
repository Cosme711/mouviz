# Base de données

## Moteur et configuration

**PostgreSQL** via **Supabase** avec le driver `postgres` (postgres-js — requêtes asynchrones).

Connexion via la variable d'environnement `DATABASE_URL` (chaîne de connexion Supabase).

La connexion est un singleton initialisé dans `server/utils/db.ts` :

```typescript
export function useDB() {
  if (!_db) {
    const client = postgres(process.env.DATABASE_URL!, {
      max: 1,
      prepare: false, // requis pour Supabase Transaction Pooler (PgBouncer)
    })
    _db = drizzle(client, { schema })
  }
  return _db
}
```

ORM : **Drizzle ORM** `0.45.x`. Source de vérité : `server/database/schema.ts`.

## Commandes

```bash
pnpm run db:generate  # génère les fichiers SQL dans server/database/migrations/
pnpm run db:migrate   # applique les migrations sur la base Supabase
pnpm run db:seed      # peuple depuis TMDB API (~600 req, ~2min)
pnpm run db:studio    # ouvre Drizzle Studio sur http://local.drizzle.studio
```

---

## Schéma

### `films`

Films importés depuis TMDB.

| Colonne | Type | Contrainte | Description |
|---------|------|------------|-------------|
| `id` | INTEGER | PK | ID TMDB |
| `title` | TEXT | NOT NULL | Titre |
| `year` | INTEGER | NOT NULL | Année de sortie |
| `duration` | INTEGER | NOT NULL, défaut 0 | Durée (minutes) |
| `synopsis` | TEXT | NOT NULL, défaut '' | Synopsis |
| `poster_path` | TEXT | NOT NULL, défaut '' | Chemin TMDB (ex: `/abc.jpg`) |
| `backdrop_path` | TEXT | NOT NULL, défaut '' | Chemin TMDB backdrop |
| `avg_rating` | REAL | NOT NULL, défaut 0 | Note moyenne (0–10) |
| `popularity` | REAL | NOT NULL, défaut 0 | Score TMDB |

---

### `persons`

Acteurs et réalisateurs.

| Colonne | Type | Contrainte | Description |
|---------|------|------------|-------------|
| `id` | INTEGER | PK | ID TMDB |
| `name` | TEXT | NOT NULL | Nom complet |
| `biography` | TEXT | NOT NULL, défaut '' | Biographie |
| `birth_year` | INTEGER | nullable | Année de naissance |
| `nationality` | TEXT | nullable | Nationalité |
| `photo_path` | TEXT | NOT NULL, défaut '' | Chemin TMDB photo |

---

### `genres`

| Colonne | Type | Contrainte |
|---------|------|------------|
| `id` | INTEGER | PK |
| `name` | TEXT | NOT NULL |

---

### `film_genres` *(jointure many-to-many)*

| Colonne | Type | Contrainte |
|---------|------|------------|
| `film_id` | INTEGER | FK → films.id |
| `genre_id` | INTEGER | FK → genres.id |

PK composite : `(film_id, genre_id)`

---

### `film_credits`

Association film ↔ personne avec le rôle.

| Colonne | Type | Contrainte | Description |
|---------|------|------------|-------------|
| `film_id` | INTEGER | FK → films.id | |
| `person_id` | INTEGER | FK → persons.id | |
| `role` | TEXT | NOT NULL | `'director'` ou `'actor'` |
| `character` | TEXT | nullable | Nom du personnage (acteurs) |
| `order` | INTEGER | NOT NULL, défaut 0 | Ordre au générique |

PK composite : `(film_id, person_id, role)`

---

### `similar_films` *(auto-référence)*

| Colonne | Type | Contrainte |
|---------|------|------------|
| `film_id` | INTEGER | FK → films.id |
| `similar_film_id` | INTEGER | FK → films.id |

PK composite : `(film_id, similar_film_id)`

---

### `users`

| Colonne | Type | Contrainte |
|---------|------|------------|
| `id` | INTEGER | PK autoincrement |
| `username` | TEXT | NOT NULL, UNIQUE |
| `display_name` | TEXT | NOT NULL |
| `avatar` | TEXT | NOT NULL, défaut '' |
| `bio` | TEXT | NOT NULL, défaut '' |

L'utilisateur seed a `id=1`, `username='currentuser'`.

---

### `user_follows` *(jointure many-to-many)*

| Colonne | Type | Contrainte |
|---------|------|------------|
| `follower_id` | INTEGER | FK → users.id |
| `following_id` | INTEGER | FK → users.id |

PK composite : `(follower_id, following_id)`

---

### `user_film_interactions`

Une ligne par paire `(user, film)` — upsert à chaque action.

| Colonne | Type | Contrainte | Description |
|---------|------|------------|-------------|
| `user_id` | INTEGER | FK → users.id | |
| `film_id` | INTEGER | FK → films.id | |
| `watched` | BOOLEAN | NOT NULL, défaut false | |
| `liked` | BOOLEAN | NOT NULL, défaut false | |
| `in_watchlist` | BOOLEAN | NOT NULL, défaut false | |
| `user_rating` | REAL | nullable | Note perso (0–5) |

PK composite : `(user_id, film_id)`

---

### `reviews`

| Colonne | Type | Contrainte | Description |
|---------|------|------------|-------------|
| `id` | INTEGER | PK autoincrement | |
| `film_id` | INTEGER | FK → films.id | |
| `user_id` | INTEGER | FK → users.id | |
| `rating` | REAL | NOT NULL | Note (0–5) |
| `text` | TEXT | NOT NULL | Texte |
| `likes` | INTEGER | NOT NULL, défaut 0 | |
| `created_at` | TEXT | NOT NULL | ISO 8601 |

---

### `diary_entries`

| Colonne | Type | Contrainte | Description |
|---------|------|------------|-------------|
| `id` | INTEGER | PK autoincrement | |
| `user_id` | INTEGER | FK → users.id | |
| `film_id` | INTEGER | FK → films.id | |
| `watched_at` | TEXT | NOT NULL | Date du visionnage (ISO 8601) |
| `rating` | REAL | nullable | Note optionnelle |
| `liked` | BOOLEAN | NOT NULL, défaut false | |
| `rewatch` | BOOLEAN | NOT NULL, défaut false | |
| `review` | TEXT | nullable | Critique courte |

---

### `activity`

Log de toutes les actions utilisateurs.

| Colonne | Type | Contrainte | Description |
|---------|------|------------|-------------|
| `id` | INTEGER | PK autoincrement | |
| `user_id` | INTEGER | FK → users.id | |
| `film_id` | INTEGER | FK → films.id | |
| `type` | TEXT | NOT NULL | `'watched'` \| `'liked'` \| `'reviewed'` \| `'listed'` |
| `rating` | REAL | nullable | Note si `type='reviewed'` |
| `review_id` | INTEGER | FK → reviews.id, nullable | Si `type='reviewed'` |
| `created_at` | TEXT | NOT NULL | ISO 8601 |

Les entrées sont créées automatiquement :
- `watched` / `liked` → via `POST /api/user/interactions` au toggle ON
- `reviewed` → via `POST /api/films/:id/reviews`

---

### `lists`

| Colonne | Type | Contrainte | Description |
|---------|------|------------|-------------|
| `id` | INTEGER | PK autoincrement | |
| `user_id` | INTEGER | FK → users.id | |
| `title` | TEXT | NOT NULL | |
| `description` | TEXT | NOT NULL, défaut '' | |
| `is_public` | BOOLEAN | NOT NULL, défaut true | |
| `likes` | INTEGER | NOT NULL, défaut 0 | |

---

### `list_films` *(jointure many-to-many ordonnée)*

| Colonne | Type | Contrainte | Description |
|---------|------|------------|-------------|
| `list_id` | INTEGER | FK → lists.id | |
| `film_id` | INTEGER | FK → films.id | |
| `position` | INTEGER | NOT NULL, défaut 0 | Ordre dans la liste |

PK composite : `(list_id, film_id)`

---

### `favorite_films`

Films favoris d'un utilisateur (4 max par convention UI).

| Colonne | Type | Contrainte | Description |
|---------|------|------------|-------------|
| `user_id` | INTEGER | FK → users.id | |
| `film_id` | INTEGER | FK → films.id | |
| `position` | INTEGER | NOT NULL | Ordre d'affichage (1–4) |

PK composite : `(user_id, film_id)`

---

## Diagramme des relations

```
                    ┌──────────┐
            ┌───────│  genres  │
            │       └──────────┘
            │ film_genres (M:M)
            │
┌───────────┤     ┌──────────────┐
│   films   │─────│ film_credits │─────┐
└───────────┤     └──────────────┘     │
            │                          │   ┌─────────┐
            │     ┌───────────────┐    └───│ persons │
            ├─────│ similar_films │        └─────────┘
            │     └───────────────┘
            │
            │     ┌────────────────────────┐
            ├─────│ user_film_interactions │─────┐
            │     └────────────────────────┘     │
            │                                    │
            │     ┌──────────┐                   │
            ├─────│ reviews  │──────────────────┤
            │     └──────────┘                   │
            │                                    │
            │     ┌───────────────┐              │
            ├─────│ diary_entries │──────────────┤
            │     └───────────────┘              │
            │                                    │
            │     ┌──────────┐                   │   ┌─────────────┐
            ├─────│ activity │──────────────────┤───│    users    │
            │     └──────────┘                   │   └─────────────┘
            │                                    │         │
            │     ┌────────────┐                 │   ┌─────┴──────┐
            ├─────│ list_films │─── lists ───────┤   │user_follows│
            │     └────────────┘                 │   └────────────┘
            │                                    │
            │     ┌────────────────┐             │
            └─────│ favorite_films │─────────────┘
                  └────────────────┘
```

## Script de seed

`scripts/seed.ts` — exécuté via `pnpm run db:seed`.

1. Récupère les films populaires TMDB (pages 1–5, ~100 films)
2. Pour chaque film : détails, crédits, films similaires
3. Insère genres, personnes, films, crédits, similarités
4. Crée un utilisateur `currentuser` (id=1)
5. Génère des interactions aléatoires et du contenu de test (reviews, diary, listes, favoris)

Le fetch TMDB est throttlé à ~33 req/s pour rester sous la limite de 40/s.
