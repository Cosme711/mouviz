import { eq, and, inArray } from 'drizzle-orm'
import { films, userFilmInteractions } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) throw createError({ statusCode: 401, message: 'Non authentifié' })
  const userId = session.user.id
  const db = useDB()

  const watchlistRows = await db
    .select({ filmId: userFilmInteractions.filmId })
    .from(userFilmInteractions)
    .where(and(
      eq(userFilmInteractions.userId, userId),
      eq(userFilmInteractions.inWatchlist, true),
    ))
    .all()

  const filmIds = watchlistRows.map(r => r.filmId)
  if (filmIds.length === 0) return { films: [] }

  const filmRows = await db.select().from(films).where(inArray(films.id, filmIds)).all()

  return {
    films: filmRows.map(f => ({
      id: f.id,
      title: f.title,
      year: f.year,
      poster: tmdbImage.poster(f.posterPath),
      rating: f.avgRating,
      watched: false,
      liked: false,
      inWatchlist: true,
    })),
  }
})
