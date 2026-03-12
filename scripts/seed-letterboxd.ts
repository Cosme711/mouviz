import { config } from 'dotenv'
config()

import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { eq, inArray } from 'drizzle-orm'
import * as schema from '../server/database/schema'

// ─── DB Setup ───────────────────────────────────────────────────────────────

const client = postgres(process.env.DATABASE_URL!, { max: 1 })
const db = drizzle(client, { schema })

// ─── TMDB Helpers ────────────────────────────────────────────────────────────

const TMDB_TOKEN = process.env.TMDB_API_TOKEN
if (!TMDB_TOKEN) {
  console.error('✗ TMDB_API_TOKEN is not set in .env')
  process.exit(1)
}

let _lastTmdbRequest = 0
let _lastLetterboxdRequest = 0

const tmdbFetch = async <T>(path: string): Promise<T> => {
  const gap = 30
  const elapsed = Date.now() - _lastTmdbRequest
  if (elapsed < gap) await new Promise(r => setTimeout(r, gap - elapsed))
  _lastTmdbRequest = Date.now()

  const res = await fetch(`https://api.themoviedb.org/3${path}`, {
    headers: { Authorization: `Bearer ${TMDB_TOKEN}`, Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`TMDB ${res.status}: ${path}`)
  return res.json() as Promise<T>
}

const letterboxdFetch = async (url: string): Promise<string> => {
  const gap = 1500
  const elapsed = Date.now() - _lastLetterboxdRequest
  if (elapsed < gap) await new Promise(r => setTimeout(r, gap - elapsed))
  _lastLetterboxdRequest = Date.now()

  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Mouviz-Seeder/1.0)' },
  })
  if (!res.ok) throw new Error(`Letterboxd ${res.status}: ${url}`)
  return res.text()
}

const batchRequests = async <T, R>(
  items: T[],
  handler: (item: T) => Promise<R>,
  batchSize = 40,
  pauseMs = 1100,
): Promise<R[]> => {
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

const unescapeHtml = (str: string): string =>
  str
    .replace(/&#0*39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&apos;/g, "'")

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
  production_countries: Array<{ iso_3166_1: string; name: string }>
}
interface TmdbCreditsResult {
  cast: Array<{ id: number; name: string; character: string; order: number; profile_path: string | null }>
  crew: Array<{ id: number; name: string; job: string; department: string; profile_path: string | null }>
}
interface TmdbPerson {
  id: number; name: string; biography: string; birthday: string | null
  place_of_birth: string | null; profile_path: string | null
}
interface TmdbSearchResult { results: TmdbFilm[] }

// ─── Letterboxd Types ─────────────────────────────────────────────────────────

interface LetterboxdFilm { slug: string; title: string; year: number | null }

// ─── Step 0: Scrape Letterboxd Top 500 ───────────────────────────────────────

console.log('\n── Step 0: Scraping Letterboxd Top 500')

const BASE_URL = 'https://letterboxd.com/official/list/letterboxds-top-500-films/'
const scraped: LetterboxdFilm[] = []

for (let page = 1; page <= 10; page++) {
  const url = page === 1 ? BASE_URL : `${BASE_URL}page/${page}/`
  process.stdout.write(`  Scraping page ${page}...\r`)

  try {
    const html = await letterboxdFetch(url)
    // SSR HTML uses data-item-slug / data-item-name="Title (Year)" on LazyPoster components
    const parts = html.split(/data-item-slug="/)

    if (parts.length <= 1) {
      console.log(`\n  No more films at page ${page}, stopping early`)
      break
    }

    for (let j = 1; j < parts.length; j++) {
      const chunk = parts[j]!
      const slugMatch = chunk.match(/^([^"]+)"/)
      if (!slugMatch) continue
      const slug = slugMatch[1]!

      // data-item-name contains "Title (Year)" — year may be absent for older films
      const nameMatch = chunk.match(/data-item-name="([^"]+)"/)
      if (!nameMatch || !nameMatch[1]) continue
      const rawName = unescapeHtml(nameMatch[1])

      const titleYearMatch = rawName.match(/^(.+?)\s*\((\d{4})\)\s*$/)
      const title = titleYearMatch ? titleYearMatch[1]! : rawName
      const year = titleYearMatch ? parseInt(titleYearMatch[2]!) : null

      scraped.push({ slug, title, year })
    }
  } catch (err) {
    console.warn(`\n  ✗ Failed to scrape page ${page}: ${err}`)
  }
}

// Deduplicate by slug (same poster can appear in multiple page sections)
const seenSlugs = new Set<string>()
const letterboxdFilms = scraped.filter(f => {
  if (seenSlugs.has(f.slug)) return false
  seenSlugs.add(f.slug)
  return true
})

console.log(`✓ ${letterboxdFilms.length} unique films scraped from Letterboxd`)

// ─── Step 1: Genres ──────────────────────────────────────────────────────────

console.log('\n── Step 1: Genres')
const { genres: tmdbGenres } = await tmdbFetch<{ genres: TmdbGenre[] }>('/genre/movie/list?language=fr-FR')
for (const g of tmdbGenres) {
  await db.insert(schema.genres).values({ id: g.id, name: g.name }).onConflictDoNothing()
}
console.log(`✓ ${tmdbGenres.length} genres inserted`)

// ─── Step 2: Match Letterboxd films → TMDB IDs ───────────────────────────────

console.log('\n── Step 2: Match Letterboxd films → TMDB IDs')
const skipped: LetterboxdFilm[] = []

const searchFilm = async (film: LetterboxdFilm): Promise<TmdbFilm | null> => {
  try {
    const query = encodeURIComponent(film.title)
    const yearParam = film.year ? `&year=${film.year}` : ''
    let result = await tmdbFetch<TmdbSearchResult>(
      `/search/movie?query=${query}&language=fr-FR${yearParam}`
    )

    // Retry without year if no results
    if (result.results.length === 0 && film.year) {
      result = await tmdbFetch<TmdbSearchResult>(
        `/search/movie?query=${query}&language=fr-FR`
      )
    }

    if (result.results.length === 0) {
      skipped.push(film)
      return null
    }

    return result.results[0]!
  } catch (err) {
    console.warn(`\n  ✗ Search failed for "${film.title}": ${err}`)
    skipped.push(film)
    return null
  }
}

const searchResults = await batchRequests(letterboxdFilms, searchFilm)

// Filter nulls and deduplicate by TMDB ID
const seenTmdbIds = new Set<number>()
const tmdbFilms: TmdbFilm[] = []
for (const film of searchResults) {
  if (!film) continue
  if (seenTmdbIds.has(film.id)) continue
  seenTmdbIds.add(film.id)
  tmdbFilms.push(film)
}

console.log(`✓ ${tmdbFilms.length} unique TMDB films matched (${skipped.length} skipped)`)
if (skipped.length > 0) {
  console.log('  Skipped films:')
  for (const f of skipped) {
    console.log(`    - "${f.title}" (${f.year ?? 'no year'}) [${f.slug}]`)
  }
}

// ─── Step 3: Insert basic film data ──────────────────────────────────────────

console.log('\n── Step 3: Insert basic film data')
for (const f of tmdbFilms) {
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
}
console.log(`✓ ${tmdbFilms.length} films inserted`)

// ─── Step 4: Film details (runtime, overview, genres, country) ───────────────

console.log('\n── Step 4: Film details (runtime + genres + country)')
const filmIds = tmdbFilms.map(f => f.id)

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
      country: detail.production_countries[0]?.iso_3166_1 ?? '',
    })
    .where(eq(schema.films.id, detail.id))

  for (const g of detail.genres) {
    await db.insert(schema.genres).values({ id: g.id, name: g.name }).onConflictDoNothing()
    await db.insert(schema.filmGenres)
      .values({ filmId: detail.id, genreId: g.id })
      .onConflictDoNothing()
  }
}
console.log(`✓ ${filmDetails.length} film details applied`)

// ─── Step 5: Credits (director + top 10 actors) ───────────────────────────────

console.log('\n── Step 5: Film credits')
const creditResults = await batchRequests(
  filmIds,
  (id) => tmdbFetch<TmdbCreditsResult>(`/movie/${id}/credits?language=fr-FR`),
)

const personIdsToFetch = new Set<number>()

for (let i = 0; i < filmIds.length; i++) {
  const filmId = filmIds[i]!
  const credits = creditResults[i]!
  if (!credits) continue

  const director = credits.crew.find(c => c.job === 'Director')
  if (director) {
    await db.insert(schema.persons)
      .values({
        id: director.id,
        name: director.name,
        biography: '',
        photoPath: director.profile_path ?? '',
      })
      .onConflictDoNothing()

    await db.insert(schema.filmCredits)
      .values({ filmId, personId: director.id, role: 'director', order: 0 })
      .onConflictDoNothing()

    personIdsToFetch.add(director.id)
  }

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

    await db.insert(schema.filmCredits)
      .values({
        filmId,
        personId: actor.id,
        role: 'actor',
        character: actor.character,
        order: actor.order,
      })
      .onConflictDoNothing()

    personIdsToFetch.add(actor.id)
  }
}
console.log(`✓ Credits inserted for ${filmIds.length} films, ${personIdsToFetch.size} unique persons`)

// ─── Step 6: Person details ──────────────────────────────────────────────────

console.log('\n── Step 6: Person details')
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
      birthYear: birthYear !== null && !isNaN(birthYear) ? birthYear : null,
      nationality: person.place_of_birth ?? null,
      photoPath: person.profile_path ?? '',
    })
    .where(eq(schema.persons.id, person.id))
  personUpdateCount++
}
console.log(`✓ ${personUpdateCount} person details updated`)

// ─── Step 7: Similar films ───────────────────────────────────────────────────

console.log('\n── Step 7: Similar films')
const dbFilmIds = new Set(filmIds)
let similarCount = 0

const similarResults = await batchRequests(
  filmIds,
  async (id) => {
    try {
      const result = await tmdbFetch<{ results: TmdbFilm[] }>(`/movie/${id}/similar?language=fr-FR&page=1`)
      return { filmId: id, similar: result.results }
    } catch {
      return { filmId: id, similar: [] as TmdbFilm[] }
    }
  },
)

for (const { filmId, similar } of similarResults) {
  for (const s of similar.slice(0, 6)) {
    if (dbFilmIds.has(s.id)) {
      await db.insert(schema.similarFilms)
        .values({ filmId, similarFilmId: s.id })
        .onConflictDoNothing()
      similarCount++
    }
  }
}
console.log(`✓ ${similarCount} similar film links inserted`)

// ─── Step 8: Seed user + data ─────────────────────────────────────────────────

console.log('\n── Step 8: Seed user data')

const [currentUser] = await db
  .insert(schema.users)
  .values({
    username: 'currentuser',
    displayName: 'Alex Dupont',
    avatar: '',
    bio: "Cinéphile passionné. Amateur de films d'auteur et de science-fiction.",
  })
  .onConflictDoNothing()
  .returning()

const communityUsers = [
  { username: 'cinephile_42', displayName: 'Cinéphile 42' },
  { username: 'film_lover', displayName: 'Film Lover' },
  { username: 'moviebuff_99', displayName: 'Moviebuff 99' },
  { username: 'arthouse_fan', displayName: 'Arthouse Fan' },
]
for (const u of communityUsers) {
  await db.insert(schema.users).values({ ...u, avatar: '', bio: '' }).onConflictDoNothing()
}

let userId = currentUser?.id
if (!userId) {
  const [existingUser] = await db.select().from(schema.users).where(eq(schema.users.username, 'currentuser'))
  userId = existingUser!.id
}

const allFilmsInDb = await db.select({ id: schema.films.id, avgRating: schema.films.avgRating }).from(schema.films)
const sortedByRating = [...allFilmsInDb].sort((a, b) => b.avgRating - a.avgRating)

// Favorite films (top 4 by rating)
const favFilms = sortedByRating.slice(0, 4)
for (let i = 0; i < favFilms.length; i++) {
  await db.insert(schema.favoriteFilms)
    .values({ userId, filmId: favFilms[i]!.id, position: i })
    .onConflictDoNothing()
}

// Mark films as watched/liked (top 20 by rating)
const watchedFilms = sortedByRating.slice(0, 20)
for (const film of watchedFilms) {
  await db.insert(schema.userFilmInteractions)
    .values({
      userId,
      filmId: film.id,
      watched: true,
      liked: film.avgRating >= 4.0,
      inWatchlist: false,
      userRating: Math.round(film.avgRating * 2) / 2,
    })
    .onConflictDoNothing()
}

// Watchlist (films 20–26 by rating)
const watchlistFilms = sortedByRating.slice(20, 26)
for (const film of watchlistFilms) {
  await db.insert(schema.userFilmInteractions)
    .values({ userId, filmId: film.id, watched: false, liked: false, inWatchlist: true })
    .onConflictDoNothing()
}

// Diary entries (6 entries)
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
      rewatch: i === 4,
    })
    .onConflictDoNothing()
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
}

// Activity for community users
const communityUserRows = await db
  .select()
  .from(schema.users)
  .where(inArray(schema.users.username, communityUsers.map(u => u.username)))

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
}

// 3 public lists
const listData = [
  {
    title: "Meilleurs films de l'année",
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
    title: "Palme d'Or Collection",
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

  if (!list) continue
  for (let pos = 0; pos < listDef.films.length; pos++) {
    await db.insert(schema.listFilms)
      .values({ listId: list.id, filmId: listDef.films[pos]!, position: pos })
      .onConflictDoNothing()
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

  if (!list) continue
  const listFilmSlice = sortedByRating.slice(10 + ci * 4, 10 + ci * 4 + 4).map(f => f.id)
  for (let pos = 0; pos < listFilmSlice.length; pos++) {
    await db.insert(schema.listFilms)
      .values({ listId: list.id, filmId: listFilmSlice[pos]!, position: pos })
      .onConflictDoNothing()
  }
}

console.log('✓ User data seeded')
console.log('\n🎬 Seed complete! Run `pnpm run dev` to start the app.')

await client.end()
