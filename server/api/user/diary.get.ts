import { eq, desc, inArray } from 'drizzle-orm'
import { diaryEntries, films } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) throw createError({ statusCode: 401, message: 'Non authentifié' })
  const userId = session.user.id
  const db = useDB()

  const entries = await db
    .select()
    .from(diaryEntries)
    .where(eq(diaryEntries.userId, userId))
    .orderBy(desc(diaryEntries.watchedAt))
    .all()

  if (entries.length === 0) return { entries: [] }

  const filmIds = [...new Set(entries.map(e => e.filmId))]
  const filmRows = await db.select().from(films).where(inArray(films.id, filmIds)).all()
  const filmMap = new Map(filmRows.map(f => [f.id, f]))

  return {
    entries: entries.map(e => {
      const f = filmMap.get(e.filmId)!
      return {
        id: e.id,
        date: e.watchedAt,
        rating: e.rating ?? 0,
        liked: e.liked,
        rewatch: e.rewatch,
        review: e.review ?? undefined,
        film: {
          id: f.id,
          title: f.title,
          year: f.year,
          poster: tmdbImage.poster(f.posterPath),
          rating: f.avgRating,
          watched: true,
          liked: e.liked,
          inWatchlist: false,
        },
      }
    }),
  }
})
