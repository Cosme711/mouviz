import { config } from 'dotenv'
config()

import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { eq } from 'drizzle-orm'
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

interface TmdbFilm {
  id: number; title: string; release_date: string
  poster_path: string | null; backdrop_path: string | null
  vote_average: number; popularity: number
}
interface TmdbSearchResult { results: TmdbFilm[] }
interface LetterboxdFilm { slug: string; title: string; year: number | null }

// ─── Step 1: Delete all existing lists ───────────────────────────────────────

console.log('\n── Step 1: Deleting all existing lists')
await db.delete(schema.listFilms)
await db.delete(schema.lists)
console.log('✓ All lists deleted')

// ─── Step 2: Find user cosmegressier37 ───────────────────────────────────────

console.log('\n── Step 2: Looking up user cosmegressier37')
const [user] = await db
  .select()
  .from(schema.users)
  .where(eq(schema.users.username, 'cosmegressier37'))

if (!user) {
  console.error('✗ User "cosmegressier37" not found in database. Make sure you are logged in with this account first.')
  process.exit(1)
}
console.log(`✓ User found: "${user.displayName}" (id: ${user.id})`)

// ─── Step 3: Scrape Letterboxd Top 500 ───────────────────────────────────────

console.log('\n── Step 3: Scraping Letterboxd Top 500')

const BASE_URL = 'https://letterboxd.com/official/list/letterboxds-top-500-films/'
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

// ─── Step 4: Match Letterboxd films → TMDB IDs ───────────────────────────────

console.log('\n── Step 4: Matching Letterboxd films → TMDB IDs')
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

// Deduplicate by TMDB ID, preserving order (first occurrence = higher rank)
const seenTmdbIds = new Set<number>()
const matchedFilms: Array<{ lbIndex: number; tmdb: TmdbFilm }> = []
for (let i = 0; i < searchResults.length; i++) {
  const tmdb = searchResults[i]
  if (!tmdb) continue
  if (seenTmdbIds.has(tmdb.id)) continue
  seenTmdbIds.add(tmdb.id)
  matchedFilms.push({ lbIndex: i, tmdb })
}

console.log(`✓ ${matchedFilms.length} unique films matched (${skipped.length} skipped)`)
if (skipped.length > 0) {
  console.log('  Skipped:')
  for (const f of skipped) console.log(`    - "${f.title}" (${f.year ?? 'no year'})`)
}

// ─── Step 5: Ensure all matched films exist in DB ────────────────────────────

console.log('\n── Step 5: Ensuring films exist in DB')
let insertedCount = 0

for (const { tmdb } of matchedFilms) {
  const year = tmdb.release_date ? parseInt(tmdb.release_date.split('-')[0]!) : 0
  const result = await db
    .insert(schema.films)
    .values({
      id: tmdb.id,
      title: tmdb.title,
      year,
      duration: 0,
      synopsis: '',
      posterPath: tmdb.poster_path ?? '',
      backdropPath: tmdb.backdrop_path ?? '',
      avgRating: Math.round((tmdb.vote_average / 2) * 10) / 10,
      popularity: tmdb.popularity,
      country: '',
    })
    .onConflictDoNothing()
    .returning()

  if (result.length > 0) insertedCount++
}

console.log(`✓ ${insertedCount} new films inserted, ${matchedFilms.length - insertedCount} already in DB`)

// ─── Step 6: Create the list ─────────────────────────────────────────────────

console.log('\n── Step 6: Creating list')
const [list] = await db
  .insert(schema.lists)
  .values({
    userId: user.id,
    title: "Letterboxd's Top 500 Films",
    description: "The 500 best films of all time according to Letterboxd's community.",
    isPublic: true,
    likes: 0,
  })
  .returning()

if (!list) {
  console.error('✗ Failed to create list')
  process.exit(1)
}
console.log(`✓ List created (id: ${list.id})`)

// ─── Step 7: Add films to list ───────────────────────────────────────────────

console.log('\n── Step 7: Adding films to list')
for (let pos = 0; pos < matchedFilms.length; pos++) {
  await db
    .insert(schema.listFilms)
    .values({ listId: list.id, filmId: matchedFilms[pos]!.tmdb.id, position: pos })
    .onConflictDoNothing()
}

console.log(`✓ ${matchedFilms.length} films added to list`)
console.log('\n🎬 Done! List "Letterboxd\'s Top 500 Films" created for cosmegressier37.')

await client.end()
