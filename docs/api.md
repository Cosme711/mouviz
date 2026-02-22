# API Reference

Toutes les routes sont sous `/api/`. Méthode HTTP encodée dans le nom du fichier Nitro (`.get.ts`, `.post.ts`).

L'utilisateur courant est toujours `CURRENT_USER_ID = 1` (pas d'auth).

---

## Films

### `GET /api/films`

Liste paginée de films avec filtres.

**Query params :**

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `limit` | number | `20` | Nombre de résultats |
| `offset` | number | `0` | Décalage pour la pagination |
| `sortBy` | string | `popularity` | `popularity` \| `rating` \| `year` \| `title` |
| `genre` | string | — | Filtrer par nom de genre exact |
| `q` | string | — | Recherche fulltext sur le titre (`LIKE %q%`) |
| `minRating` | number | `0` | Note minimum (`avg_rating ≥ minRating`) |
| `watched` | `1` | — | Uniquement les films vus |
| `notWatched` | `1` | — | Uniquement les films non-vus |
| `liked` | `1` | — | Uniquement les films aimés |
| `watchlist` | `1` | — | Uniquement la watchlist |

**Réponse :**
```json
{
  "films": [
    {
      "id": 550,
      "title": "Fight Club",
      "year": 1999,
      "poster": "https://image.tmdb.org/t/p/w500/...",
      "rating": 8.4,
      "watched": true,
      "liked": false,
      "inWatchlist": false,
      "userRating": 4.5,
      "genres": ["Drama", "Thriller"]
    }
  ],
  "total": 120,
  "genres": ["Action", "Comedy", "Drama", ...]
}
```

---

### `GET /api/films/:id`

Détail complet d'un film.

**Réponse :**
```json
{
  "id": 550,
  "title": "Fight Club",
  "year": 1999,
  "poster": "https://image.tmdb.org/t/p/w500/...",
  "backdrop": "https://image.tmdb.org/t/p/w1280/...",
  "rating": 8.4,
  "watched": true,
  "liked": false,
  "inWatchlist": false,
  "userRating": 4.5,
  "director": "David Fincher",
  "genres": ["Drama", "Thriller"],
  "duration": 139,
  "synopsis": "Un employé de bureau insomniaque...",
  "reviewCount": 12,
  "cast": [
    { "id": 819, "name": "Edward Norton", "role": "The Narrator", "photo": "https://..." }
  ]
}
```

**Erreurs :** `400` (ID invalide), `404` (film non trouvé)

---

### `GET /api/films/:id/reviews`

Critiques d'un film.

**Réponse :**
```json
{
  "reviews": [
    {
      "id": 1,
      "user": "currentuser",
      "avatar": "https://...",
      "rating": 4.5,
      "text": "Chef-d'œuvre absolu.",
      "date": "2024-01-15T10:30:00.000Z",
      "likes": 3
    }
  ]
}
```

---

### `POST /api/films/:id/reviews`

Publier une critique. Marque automatiquement le film comme vu et enregistre la note dans `user_film_interactions`.

**Corps :**
```json
{ "rating": 4.5, "text": "Texte de la critique..." }
```

**Réponse :**
```json
{ "ok": true, "reviewId": 42 }
```

**Erreurs :** `400` (rating ou text manquant)

---

### `GET /api/films/:id/similar`

Films similaires.

**Réponse :**
```json
{
  "films": [ /* FilmCard[] */ ]
}
```

---

## Personnes

### `GET /api/persons/:id`

Détail d'une personne (acteur ou réalisateur).

**Réponse :**
```json
{
  "id": 6193,
  "name": "David Fincher",
  "role": "director",
  "photo": "https://image.tmdb.org/t/p/w185/...",
  "biography": "...",
  "birthYear": 1962,
  "nationality": "American",
  "filmsCount": 12,
  "averageRating": 7.8
}
```

---

### `GET /api/persons/:id/filmography`

Films associés à la personne (en tant qu'acteur ou réalisateur).

**Réponse :**
```json
{
  "films": [ /* FilmCard[] avec champ role: "director" | "actor" */ ]
}
```

---

## Listes

### `GET /api/lists`

Toutes les listes publiques.

**Réponse :**
```json
{
  "lists": [
    {
      "id": 1,
      "title": "Mes films préférés",
      "description": "...",
      "creator": "currentuser",
      "films": [ /* 3 premiers FilmCard */ ],
      "filmCount": 15,
      "likes": 7,
      "isPublic": true
    }
  ]
}
```

---

### `POST /api/lists`

Créer une nouvelle liste pour l'utilisateur courant.

**Corps :**
```json
{
  "title": "Titre de la liste",
  "description": "Description optionnelle",
  "isPublic": true
}
```

**Réponse :**
```json
{ "ok": true, "list": { "id": 5, "title": "...", ... } }
```

**Erreurs :** `400` (title manquant)

---

### `GET /api/lists/:id`

Détail complet d'une liste avec tous ses films.

**Réponse :**
```json
{
  "id": 1,
  "title": "Mes films préférés",
  "description": "...",
  "creator": "currentuser",
  "films": [ /* FilmCard[] ordonnés par position */ ],
  "filmCount": 15,
  "likes": 7,
  "isPublic": true
}
```

---

## Utilisateur

### `GET /api/user/interactions`

Toutes les interactions de l'utilisateur courant (watched / liked / watchlist).

**Réponse :**
```json
{
  "interactions": [
    {
      "userId": 1,
      "filmId": 550,
      "watched": true,
      "liked": false,
      "inWatchlist": false,
      "userRating": 4.5
    }
  ]
}
```

---

### `POST /api/user/interactions`

Toggler une interaction. La valeur est inversée (`false → true`, `true → false`).

Les actions `watched` et `liked` créent une entrée dans la table `activity` lorsqu'elles passent à `true`.

**Corps :**
```json
{
  "filmId": 550,
  "field": "watched"
}
```

`field` : `"watched"` | `"liked"` | `"inWatchlist"`

**Réponse :**
```json
{ "ok": true, "watched": true }
```

**Erreurs :** `400` (filmId ou field invalide)

---

### `GET /api/user/diary`

Journal de visionnage de l'utilisateur courant, trié par date décroissante.

**Réponse :**
```json
{
  "entries": [
    {
      "id": 1,
      "film": { /* FilmCard */ },
      "date": "2024-01-15",
      "rating": 4.5,
      "liked": true,
      "rewatch": false,
      "review": "Excellent film..."
    }
  ]
}
```

---

### `GET /api/user/favorites`

Films favoris de l'utilisateur courant (ordonnés par `position`).

**Réponse :**
```json
{
  "films": [ /* FilmCard[] max 4 */ ]
}
```

---

### `GET /api/user/watchlist`

Watchlist de l'utilisateur courant.

**Réponse :**
```json
{
  "films": [ /* FilmCard[] */ ]
}
```

---

## Profil

### `GET /api/profile/:username`

Profil complet d'un utilisateur par son username.

**Réponse :**
```json
{
  "username": "currentuser",
  "displayName": "Current User",
  "avatar": "https://...",
  "bio": "...",
  "filmsWatched": 42,
  "following": 5,
  "followers": 3,
  "favoriteFilms": [ /* FilmCard[] max 4 */ ],
  "recentActivity": [ /* Activity[] 10 dernières */ ],
  "lists": [ /* FilmList[] publiques */ ]
}
```

**Erreurs :** `404` (username non trouvé)

---

## Activité

### `GET /api/activity`

Fil d'activité global : 20 dernières actions de tous les utilisateurs, triées par date décroissante.

**Réponse :**
```json
{
  "activities": [
    {
      "id": 1,
      "type": "watched",
      "user": "currentuser",
      "avatar": "https://...",
      "film": { /* FilmCard */ },
      "rating": null,
      "date": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

`type` : `"watched"` | `"liked"` | `"reviewed"` | `"listed"`
