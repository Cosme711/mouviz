import { config } from 'dotenv'
config()

import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { eq, inArray, and } from 'drizzle-orm'
import * as schema from '../server/database/schema'

// ─── Constants ────────────────────────────────────────────────────────────────

const LIST_TITLE = "Letterboxd's Top 500 Films"
const LIST_OWNER = 'cosmegressier37'
const BASE_URL = 'https://letterboxd.com/official/list/letterboxds-top-500-films/'

// ─── DB Setup ────────────────────────────────────────────────────────────────

const client = postgres(process.env.DATABASE_URL!, { max: 1 })
const db = drizzle(client, { schema })

// ─── TMDB Setup ──────────────────────────────────────────────────────────────

const TMDB_TOKEN = process.env.TMDB_API_TOKEN
if (!TMDB_TOKEN) {
  console.error('✗ TMDB_API_TOKEN is not set in .env')
  process.exit(1)
}

// ─── Rate-limited fetch helpers ──────────────────────────────────────────────

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
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Mouviz-Updater/1.0)' },
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
interface LetterboxdFilm { slug: string; title: string; year: number | null }

// ─── Step 0: Scrape Letterboxd Top 500 ───────────────────────────────────────

console.log('\n── Step 0: Scraping Letterboxd Top 500')

const scraped: LetterboxdFilm[] = []

for (let page = 1; page <= 10; page++) {
  const url = page === 1 ? BASE_URL : `${BASE_URL}page/${page}/`
  process.stdout.write(`  Scraping page ${page}/10...\r`)

  try {
    const html = await letterboxdFetch(url)
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

const seenSlugs = new Set<string>()
const letterboxdFilms = scraped.filter(f => {
  if (seenSlugs.has(f.slug)) return false
  seenSlugs.add(f.slug)
  return true
})

console.log(`✓ ${letterboxdFilms.length} unique films scraped from Letterboxd`)

// ─── Step 0b: Fetch Letterboxd ratings ───────────────────────────────────────

console.log('\n── Step 0b: Fetching Letterboxd ratings (this may take ~12 min)')
const slugToRating = new Map<string, number>()
let ratingsFetched = 0

for (let i = 0; i < letterboxdFilms.length; i++) {
  const film = letterboxdFilms[i]!
  process.stdout.write(`  ${i + 1}/${letterboxdFilms.length} - ${film.slug}\r`)
  try {
    const html = await letterboxdFetch(`https://letterboxd.com/film/${film.slug}/`)
    const ldMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)
    if (ldMatch?.[1]) {
      const raw = ldMatch[1].replace(/\/\*[\s\S]*?\*\//g, '').trim()
      const ld = JSON.parse(raw) as { aggregateRating?: { ratingValue?: number } }
      const rating = ld.aggregateRating?.ratingValue
      if (typeof rating === 'number' && rating > 0) {
        slugToRating.set(film.slug, rating)
        ratingsFetched++
      }
    }
  } catch (err) {
    console.warn(`\n  ✗ Failed rating for "${film.slug}": ${err}`)
  }
}
console.log(`✓ ${ratingsFetched}/${letterboxdFilms.length} Letterboxd ratings fetched`)

// ─── Step 1: Match Letterboxd films → TMDB IDs ───────────────────────────────

console.log('\n── Step 1: Match Letterboxd films → TMDB IDs')
const skipped: LetterboxdFilm[] = []

const searchFilm = async (film: LetterboxdFilm): Promise<TmdbFilm | null> => {
  try {
    const query = encodeURIComponent(film.title)
    const yearParam = film.year ? `&year=${film.year}` : ''
    let result = await tmdbFetch<TmdbSearchResult>(
      `/search/movie?query=${query}&language=fr-FR${yearParam}`
    )

    if (result.results.length === 0 && film.year) {
      result = await tmdbFetch<TmdbSearchResult>(
        `/search/movie?query=${query}&language=fr-FR`
      )
    }

    if (result.results.length === 0) {
      skipped.push(film)
      return null
    }

    if (film.year) {
      let best = result.results[0]!
      let bestDiff = Infinity
      for (const r of result.results) {
        if (!r.release_date) continue
        const diff = Math.abs(parseInt(r.release_date.split('-')[0]!) - film.year)
        if (diff < bestDiff) { bestDiff = diff; best = r }
      }
      if (bestDiff <= 2) return best
    }

    return result.results[0]!
  } catch (err) {
    console.warn(`\n  ✗ Search failed for "${film.title}": ${err}`)
    skipped.push(film)
    return null
  }
}

const searchResults = await batchRequests(letterboxdFilms, searchFilm)

// Deduplicate by TMDB ID, preserving Letterboxd rank order
const seenTmdbIds = new Set<number>()
const matchedFilms: Array<{ lbIndex: number; tmdb: TmdbFilm }> = []
for (let i = 0; i < searchResults.length; i++) {
  const tmdb = searchResults[i]
  if (!tmdb) continue
  if (seenTmdbIds.has(tmdb.id)) continue
  seenTmdbIds.add(tmdb.id)
  matchedFilms.push({ lbIndex: i, tmdb })
}

// Build TMDB ID → Letterboxd rating map
const tmdbIdToLbRating = new Map<number, number>()
for (let i = 0; i < letterboxdFilms.length; i++) {
  const lbFilm = letterboxdFilms[i]!
  const tmdbFilm = searchResults[i]
  if (!tmdbFilm) continue
  const rating = slugToRating.get(lbFilm.slug)
  if (rating !== undefined) tmdbIdToLbRating.set(tmdbFilm.id, rating)
}

console.log(`✓ ${matchedFilms.length} unique TMDB films matched (${skipped.length} skipped)`)
if (skipped.length > 0) {
  console.log('  Skipped films:')
  for (const f of skipped) console.log(`    - "${f.title}" (${f.year ?? 'no year'}) [${f.slug}]`)
}

// ─── Step 2: Upsert genres ────────────────────────────────────────────────────

console.log('\n── Step 2: Genres')
const { genres: tmdbGenres } = await tmdbFetch<{ genres: TmdbGenre[] }>('/genre/movie/list?language=fr-FR')
for (const g of tmdbGenres) {
  await db.insert(schema.genres).values({ id: g.id, name: g.name }).onConflictDoNothing()
}
console.log(`✓ ${tmdbGenres.length} genres upserted`)

// ─── Step 3: Partition new vs. existing films ─────────────────────────────────

console.log('\n── Step 3: Checking existing films in DB')
const allTmdbIds = matchedFilms.map(({ tmdb }) => tmdb.id)

const existingRows = await db
  .select({ id: schema.films.id })
  .from(schema.films)
  .where(inArray(schema.films.id, allTmdbIds))

const existingFilmIds = new Set(existingRows.map(r => r.id))
const newFilms = matchedFilms.filter(({ tmdb }) => !existingFilmIds.has(tmdb.id))
const updatedFilms = matchedFilms.filter(({ tmdb }) => existingFilmIds.has(tmdb.id))

console.log(`✓ ${newFilms.length} new films | ${updatedFilms.length} existing films to refresh`)

// ─── Step 4: Upsert all matched films ────────────────────────────────────────

console.log('\n── Step 4: Upserting films (rating + poster refresh)')
for (const { tmdb } of matchedFilms) {
  const year = tmdb.release_date ? parseInt(tmdb.release_date.split('-')[0]!) : 0
  const lbRating = tmdbIdToLbRating.get(tmdb.id)
  const avgRating = lbRating ?? Math.round((tmdb.vote_average / 2) * 10) / 10

  await db.insert(schema.films)
    .values({
      id: tmdb.id,
      title: tmdb.title,
      year,
      duration: 0,
      synopsis: '',
      posterPath: tmdb.poster_path ?? '',
      backdropPath: tmdb.backdrop_path ?? '',
      avgRating,
      popularity: tmdb.popularity,
      country: '',
    })
    .onConflictDoUpdate({
      target: schema.films.id,
      set: {
        avgRating,
        popularity: tmdb.popularity,
        posterPath: tmdb.poster_path ?? '',
        backdropPath: tmdb.backdrop_path ?? '',
      },
    })
}
console.log(`✓ ${matchedFilms.length} films upserted`)

// ─── Step 5: Full details for new films only ──────────────────────────────────

if (newFilms.length > 0) {
  const newFilmIds = newFilms.map(({ tmdb }) => tmdb.id)

  // Step 5a: Film details (runtime, synopsis, genres, country)
  console.log(`\n── Step 5a: Film details for ${newFilms.length} new films`)

  const filmDetails = await batchRequests(
    newFilmIds,
    async (id) => {
      try {
        return await tmdbFetch<TmdbFilmDetail>(`/movie/${id}?language=fr-FR`)
      } catch (err) {
        console.warn(`\n  ✗ Failed details for film ${id}: ${err}`)
        return null
      }
    },
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
        avgRating: tmdbIdToLbRating.get(detail.id) ?? Math.round((detail.vote_average / 2) * 10) / 10,
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
  console.log(`✓ Details applied for ${filmDetails.filter(Boolean).length} new films`)

  // Step 5b: Credits for new films
  console.log(`\n── Step 5b: Credits for ${newFilms.length} new films`)

  const creditResults = await batchRequests(
    newFilmIds,
    async (id) => {
      try {
        return await tmdbFetch<TmdbCreditsResult>(`/movie/${id}/credits?language=fr-FR`)
      } catch (err) {
        console.warn(`\n  ✗ Failed credits for film ${id}: ${err}`)
        return null
      }
    },
  )

  const personIdsToFetch = new Set<number>()

  for (let i = 0; i < newFilmIds.length; i++) {
    const filmId = newFilmIds[i]!
    const credits = creditResults[i]
    if (!credits) continue

    const director = credits.crew.find(c => c.job === 'Director')
    if (director) {
      await db.insert(schema.persons)
        .values({ id: director.id, name: director.name, biography: '', photoPath: director.profile_path ?? '' })
        .onConflictDoNothing()
      await db.insert(schema.filmCredits)
        .values({ filmId, personId: director.id, role: 'director', order: 0 })
        .onConflictDoNothing()
      personIdsToFetch.add(director.id)
    }

    for (const actor of credits.cast.slice(0, 10)) {
      await db.insert(schema.persons)
        .values({ id: actor.id, name: actor.name, biography: '', photoPath: actor.profile_path ?? '' })
        .onConflictDoNothing()
      await db.insert(schema.filmCredits)
        .values({ filmId, personId: actor.id, role: 'actor', character: actor.character, order: actor.order })
        .onConflictDoNothing()
      personIdsToFetch.add(actor.id)
    }
  }
  console.log(`✓ Credits inserted for ${newFilmIds.length} films, ${personIdsToFetch.size} unique persons`)

  // Step 5c: Person details for newly encountered persons
  console.log(`\n── Step 5c: Person details for ${personIdsToFetch.size} persons`)

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
} else {
  console.log('\n── Steps 5a–5c: No new films — skipping detail fetching')
}

// ─── Step 6: Find user ────────────────────────────────────────────────────────

console.log(`\n── Step 6: Looking up user "${LIST_OWNER}"`)
const [user] = await db
  .select()
  .from(schema.users)
  .where(eq(schema.users.username, LIST_OWNER))

if (!user) {
  console.error(`✗ User "${LIST_OWNER}" not found. Log in with this account first.`)
  process.exit(1)
}
console.log(`✓ User found: "${user.displayName}" (id: ${user.id})`)

// ─── Step 7: Find or create the Top 500 list ─────────────────────────────────

console.log(`\n── Step 7: Finding or creating list "${LIST_TITLE}"`)
const [existingList] = await db
  .select()
  .from(schema.lists)
  .where(and(
    eq(schema.lists.userId, user.id),
    eq(schema.lists.title, LIST_TITLE),
  ))

let listId: number
if (existingList) {
  listId = existingList.id
  console.log(`✓ Found existing list (id: ${listId})`)
} else {
  const [newList] = await db
    .insert(schema.lists)
    .values({
      userId: user.id,
      title: LIST_TITLE,
      description: "The 500 best films of all time according to Letterboxd's community.",
      isPublic: true,
      likes: 0,
    })
    .returning()
  if (!newList) {
    console.error('✗ Failed to create list')
    process.exit(1)
  }
  listId = newList.id
  console.log(`✓ Created new list (id: ${listId})`)
}

// ─── Step 8: Refresh list films ───────────────────────────────────────────────

console.log('\n── Step 8: Refreshing list films')
await db.delete(schema.listFilms).where(eq(schema.listFilms.listId, listId))

for (let pos = 0; pos < matchedFilms.length; pos++) {
  await db.insert(schema.listFilms)
    .values({ listId, filmId: matchedFilms[pos]!.tmdb.id, position: pos })
    .onConflictDoNothing()
}
console.log(`✓ ${matchedFilms.length} films added to list in Letterboxd rank order`)

// ─── Done ─────────────────────────────────────────────────────────────────────

console.log('\n✓ Update complete!')
console.log(`  ${newFilms.length} new films added | ${updatedFilms.length} existing films refreshed`)
console.log(`  List "${LIST_TITLE}" updated with ${matchedFilms.length} films`)

await client.end()
