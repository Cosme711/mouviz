import { eq, and, inArray } from 'drizzle-orm'
import { films, userFilmInteractions } from '../../database/schema'

const CURRENT_USER_ID = 1

export default defineEventHandler(async (_event) => {
  const db = useDB()

  const watchlistRows = db
    .select({ filmId: userFilmInteractions.filmId })
    .from(userFilmInteractions)
    .where(and(
      eq(userFilmInteractions.userId, CURRENT_USER_ID),
      eq(userFilmInteractions.inWatchlist, true),
    ))
    .all()

  const filmIds = watchlistRows.map(r => r.filmId)
  if (filmIds.length === 0) return { films: [] }

  const filmRows = db.select().from(films).where(inArray(films.id, filmIds)).all()

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
