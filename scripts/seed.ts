import { config } from 'dotenv'
config()

import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { eq, inArray } from 'drizzle-orm'
import { fileURLToPath } from 'url'
import * as schema from '../server/database/schema'

// ─── DB Setup ───────────────────────────────────────────────────────────────

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
})
const db = drizzle(client, { schema })

// ─── TMDB Helpers ────────────────────────────────────────────────────────────

const TMDB_TOKEN = process.env.TMDB_API_TOKEN
if (!TMDB_TOKEN) {
  console.error('✗ TMDB_API_TOKEN is not set in .env')
  process.exit(1)
}

let _lastRequest = 0

async function tmdbFetch<T>(path: string): Promise<T> {
  const gap = 30
  const elapsed = Date.now() - _lastRequest
  if (elapsed < gap) await new Promise(r => setTimeout(r, gap - elapsed))
  _lastRequest = Date.now()

  const res = await fetch(`https://api.themoviedb.org/3${path}`, {
    headers: { Authorization: `Bearer ${TMDB_TOKEN}`, Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`TMDB ${res.status}: ${path}`)
  return res.json() as Promise<T>
}

async function batchRequests<T, R>(
  items: T[],
  handler: (item: T) => Promise<R>,
  batchSize = 40,
  pauseMs = 1100,
): Promise<R[]> {
  const results: R[] = []
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch.map(handler))
    results.push(...batchResults)
    if (i + batchSize < items.length) {
      process.stdout.write(`  batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(items.length / batchSize)} done, pausing...\r`)
      await new Promise(r => setTimeout(r, pauseMs))
    }
  }
  return results
}

// ─── TMDB Types ───────────────────────────────────────────────────────────────

interface TmdbGenre { id: number; name: string }
interface TmdbFilm {
  id: number; title: string; release_date: string
  poster_path: string | null; backdrop_path: string | null
  vote_average: number; popularity: number
}
interface TmdbFilmDetail extends TmdbFilm {
  runtime: number | null; overview: string
  genres: TmdbGenre[]
}
interface TmdbCreditsResult {
  cast: Array<{ id: number; name: string; character: string; order: number; profile_path: string | null }>
  crew: Array<{ id: number; name: string; job: string; department: string; profile_path: string | null }>
}
interface TmdbPerson {
  id: number; name: string; biography: string; birthday: string | null
  place_of_birth: string | null; profile_path: string | null
}

// ─── Step 1: Genres ──────────────────────────────────────────────────────────

console.log('\n── Step 1: Genres')
const { genres: tmdbGenres } = await tmdbFetch<{ genres: TmdbGenre[] }>('/genre/movie/list?language=fr-FR')
for (const g of tmdbGenres) {
  await db.insert(schema.genres).values({ id: g.id, name: g.name }).onConflictDoNothing().run()
}
console.log(`✓ ${tmdbGenres.length} genres inserted`)

// ─── Step 2: Popular Films (5 pages = 100 films) ─────────────────────────────

console.log('\n── Step 2: Popular films')
const popularPages = await batchRequests(
  [1, 2, 3, 4, 5],
  (page) => tmdbFetch<{ results: TmdbFilm[] }>(`/movie/popular?page=${page}&language=fr-FR`),
  5,
  0,
)
const popularFilms = popularPages.flatMap(p => p.results)
console.log(`✓ ${popularFilms.length} films fetched`)

// Insert basic film data first (without runtime/overview)
for (const f of popularFilms) {
  const year = f.release_date ? parseInt(f.release_date.split('-')[0]!) : 0
  await db.insert(schema.films)
    .values({
      id: f.id,
      title: f.title,
      year,
      duration: 0,
      synopsis: '',
      posterPath: f.poster_path ?? '',
      backdropPath: f.backdrop_path ?? '',
      avgRating: Math.round((f.vote_average / 2) * 10) / 10,
      popularity: f.popularity,
    })
    .onConflictDoNothing()
    .run()
}

// ─── Step 3: Film Details (runtime, overview, genres) ─────────────────────────

console.log('\n── Step 3: Film details (runtime + genres)')
const filmIds = popularFilms.map(f => f.id)

const filmDetails = await batchRequests(
  filmIds,
  (id) => tmdbFetch<TmdbFilmDetail>(`/movie/${id}?language=fr-FR`),
)

for (const detail of filmDetails) {
  if (!detail) continue
  const year = detail.release_date ? parseInt(detail.release_date.split('-')[0]!) : 0
  await db.update(schema.films)
    .set({
      year,
      duration: detail.runtime ?? 0,
      synopsis: detail.overview ?? '',
      posterPath: detail.poster_path ?? '',
      backdropPath: detail.backdrop_path ?? '',
      avgRating: Math.round((detail.vote_average / 2) * 10) / 10,
      popularity: detail.popularity,
    })
    .where(eq(schema.films.id, detail.id))
    .run()

  // Insert genres
  for (const g of detail.genres) {
    await db.insert(schema.genres).values({ id: g.id, name: g.name }).onConflictDoNothing().run()
    await db.insert(schema.filmGenres)
      .values({ filmId: detail.id, genreId: g.id })
      .onConflictDoNothing()
      .run()
  }
}
console.log(`✓ ${filmDetails.length} film details applied`)

// ─── Step 4: Credits (director + top 10 actors) ───────────────────────────────

console.log('\n── Step 4: Film credits')
const creditResults = await batchRequests(
  filmIds,
  (id) => tmdbFetch<TmdbCreditsResult>(`/movie/${id}/credits?language=fr-FR`),
)

const personIdsToFetch = new Set<number>()

for (let i = 0; i < filmIds.length; i++) {
  const filmId = filmIds[i]!
  const credits = creditResults[i]!
  if (!credits) continue

  // Director (first one in crew)
  const director = credits.crew.find(c => c.job === 'Director')
  if (director) {
    // Insert person placeholder
    await db.insert(schema.persons)
      .values({
        id: director.id,
        name: director.name,
        biography: '',
        photoPath: director.profile_path ?? '',
      })
      .onConflictDoNothing()
      .run()

    await db.insert(schema.filmCredits)
      .values({
        filmId,
        personId: director.id,
        role: 'director',
        order: 0,
      })
      .onConflictDoNothing()
      .run()

    personIdsToFetch.add(director.id)
  }

  // Top 10 actors
  const topActors = credits.cast.slice(0, 10)
  for (const actor of topActors) {
    await db.insert(schema.persons)
      .values({
        id: actor.id,
        name: actor.name,
        biography: '',
        photoPath: actor.profile_path ?? '',
      })
      .onConflictDoNothing()
      .run()

    await db.insert(schema.filmCredits)
      .values({
        filmId,
        personId: actor.id,
        role: 'actor',
        character: actor.character,
        order: actor.order,
      })
      .onConflictDoNothing()
      .run()

    personIdsToFetch.add(actor.id)
  }
}
console.log(`✓ Credits inserted for ${filmIds.length} films, ${personIdsToFetch.size} unique persons`)

// ─── Step 5: Person Details ──────────────────────────────────────────────────

console.log('\n── Step 5: Person details')
const personIds = Array.from(personIdsToFetch)

const personDetails = await batchRequests(
  personIds,
  async (id) => {
    try {
      return await tmdbFetch<TmdbPerson>(`/person/${id}?language=fr-FR`)
    } catch {
      return null
    }
  },
)

let personUpdateCount = 0
for (const person of personDetails) {
  if (!person) continue
  const birthYear = person.birthday ? parseInt(person.birthday.split('-')[0]!) : null
  await db.update(schema.persons)
    .set({
      biography: person.biography || '',
      birthYear: isNaN(birthYear!) ? null : birthYear,
      nationality: person.place_of_birth ?? null,
      photoPath: person.profile_path ?? '',
    })
    .where(eq(schema.persons.id, person.id))
    .run()
  personUpdateCount++
}
console.log(`✓ ${personUpdateCount} person details updated`)

// ─── Step 6: Similar Films ───────────────────────────────────────────────────

console.log('\n── Step 6: Similar films')
const dbFilmIds = new Set(filmIds)
let similarCount = 0

const similarResults = await batchRequests(
  filmIds,
  async (id) => {
    try {
      const result = await tmdbFetch<{ results: TmdbFilm[] }>(`/movie/${id}/similar?language=fr-FR&page=1`)
      return { filmId: id, similar: result.results }
    } catch {
      return { filmId: id, similar: [] }
    }
  },
)

for (const { filmId, similar } of similarResults) {
  for (const s of similar.slice(0, 6)) {
    if (dbFilmIds.has(s.id)) {
      await db.insert(schema.similarFilms)
        .values({ filmId, similarFilmId: s.id })
        .onConflictDoNothing()
        .run()
      similarCount++
    }
  }
}
console.log(`✓ ${similarCount} similar film links inserted`)

// ─── Step 7: Seed User + Data ─────────────────────────────────────────────────

console.log('\n── Step 7: Seed user data')

// Create currentuser
const [currentUser] = await db
  .insert(schema.users)
  .values({
    username: 'currentuser',
    displayName: 'Alex Dupont',
    avatar: '',
    bio: 'Cinéphile passionné. Amateur de films d\'auteur et de science-fiction.',
  })
  .onConflictDoNothing()
  .returning()
  .all()

// Also create some community users for activity feed
const communityUsers = [
  { username: 'cinephile_42', displayName: 'Cinéphile 42' },
  { username: 'film_lover', displayName: 'Film Lover' },
  { username: 'moviebuff_99', displayName: 'Moviebuff 99' },
  { username: 'arthouse_fan', displayName: 'Arthouse Fan' },
]
for (const u of communityUsers) {
  await db.insert(schema.users).values({ ...u, avatar: '', bio: '' }).onConflictDoNothing().run()
}

// Get userId (handle case where user already existed)
let userId = currentUser?.id
if (!userId) {
  const existingUser = await db.select().from(schema.users).where(eq(schema.users.username, 'currentuser')).get()
  userId = existingUser!.id
}

const allFilmsInDb = await db.select({ id: schema.films.id, avgRating: schema.films.avgRating }).from(schema.films).all()
const sortedByRating = [...allFilmsInDb].sort((a, b) => b.avgRating - a.avgRating)

// Favorite films (top 4 by rating)
const favFilms = sortedByRating.slice(0, 4)
for (let i = 0; i < favFilms.length; i++) {
  await db.insert(schema.favoriteFilms)
    .values({ userId, filmId: favFilms[i]!.id, position: i })
    .onConflictDoNothing()
    .run()
}

// Mark films as watched/liked (top 20 by rating)
const watchedFilms = sortedByRating.slice(0, 20)
for (const film of watchedFilms) {
  const liked = film.avgRating >= 4.0
  await db.insert(schema.userFilmInteractions)
    .values({
      userId,
      filmId: film.id,
      watched: true,
      liked,
      inWatchlist: false,
      userRating: Math.round(film.avgRating * 2) / 2, // round to nearest 0.5
    })
    .onConflictDoNothing()
    .run()
}

// Watchlist (films 20-26 by rating)
const watchlistFilms = sortedByRating.slice(20, 26)
for (const film of watchlistFilms) {
  await db.insert(schema.userFilmInteractions)
    .values({
      userId,
      filmId: film.id,
      watched: false,
      liked: false,
      inWatchlist: true,
    })
    .onConflictDoNothing()
    .run()
}

// Diary entries (6 entries, most recent watched films)
const diaryFilms = sortedByRating.slice(0, 6)
const diaryDates = [
  '2026-02-15', '2026-02-10', '2026-02-03',
  '2026-01-28', '2026-01-20', '2026-01-05',
]
for (let i = 0; i < diaryFilms.length; i++) {
  const film = diaryFilms[i]!
  await db.insert(schema.diaryEntries)
    .values({
      userId,
      filmId: film.id,
      watchedAt: diaryDates[i]!,
      rating: Math.round(film.avgRating * 2) / 2,
      liked: film.avgRating >= 4.0,
      rewatch: i === 4, // 5th entry is a rewatch
    })
    .onConflictDoNothing()
    .run()
}

// Activity for currentuser
for (let i = 0; i < Math.min(6, watchedFilms.length); i++) {
  const film = watchedFilms[i]!
  await db.insert(schema.activity)
    .values({
      userId,
      filmId: film.id,
      type: 'watched',
      rating: Math.round(film.avgRating * 2) / 2,
      createdAt: diaryDates[i] ?? new Date().toISOString(),
    })
    .onConflictDoNothing()
    .run()
}

// Activity for community users (for home feed)
const communityUserRows = await db
  .select()
  .from(schema.users)
  .where(inArray(schema.users.username, communityUsers.map(u => u.username)))
  .all()

const activityTypes: Array<'watched' | 'liked' | 'reviewed' | 'listed'> = ['watched', 'liked', 'reviewed', 'listed']
const feedDates = ['2026-02-20', '2026-02-19', '2026-02-18', '2026-02-17', '2026-02-16']
const feedFilms = sortedByRating.slice(5, 10)

for (let i = 0; i < communityUserRows.length; i++) {
  const user = communityUserRows[i]!
  const film = feedFilms[i % feedFilms.length]!
  await db.insert(schema.activity)
    .values({
      userId: user.id,
      filmId: film.id,
      type: activityTypes[i % activityTypes.length]!,
      rating: 4 + (i % 2) * 0.5,
      createdAt: feedDates[i] ?? new Date().toISOString(),
    })
    .onConflictDoNothing()
    .run()
}

// 3 public lists
const listData = [
  {
    title: 'Meilleurs films de l\'année',
    description: 'Ma sélection des films les plus marquants.',
    films: sortedByRating.slice(0, 4).map(f => f.id),
    likes: 142,
  },
  {
    title: 'Films à voir absolument',
    description: 'Une liste de films incontournables pour tout cinéphile.',
    films: sortedByRating.slice(4, 8).map(f => f.id),
    likes: 89,
  },
  {
    title: 'Palme d\'Or Collection',
    description: 'Films récompensés ou nommés à Cannes ces dernières années.',
    films: sortedByRating.slice(8, 12).map(f => f.id),
    likes: 67,
  },
]

for (const listDef of listData) {
  const [list] = await db
    .insert(schema.lists)
    .values({
      userId,
      title: listDef.title,
      description: listDef.description,
      isPublic: true,
      likes: listDef.likes,
    })
    .returning()
    .all()

  if (!list) continue
  for (let pos = 0; pos < listDef.films.length; pos++) {
    await db.insert(schema.listFilms)
      .values({ listId: list.id, filmId: listDef.films[pos]!, position: pos })
      .onConflictDoNothing()
      .run()
  }
}

// Community user lists
for (let ci = 0; ci < communityUserRows.length; ci++) {
  const user = communityUserRows[ci]!
  const [list] = await db
    .insert(schema.lists)
    .values({
      userId: user.id,
      title: `Liste de ${user.displayName}`,
      description: 'Une sélection de films recommandés.',
      isPublic: true,
      likes: 30 + ci * 10,
    })
    .returning()
    .all()

  if (!list) continue
  const listFilmSlice = sortedByRating.slice(10 + ci * 4, 10 + ci * 4 + 4).map(f => f.id)
  for (let pos = 0; pos < listFilmSlice.length; pos++) {
    await db.insert(schema.listFilms)
      .values({ listId: list.id, filmId: listFilmSlice[pos]!, position: pos })
      .onConflictDoNothing()
      .run()
  }
}

console.log('✓ User data seeded')
console.log('\n🎬 Seed complete! Run `pnpm run dev` to start the app.')
