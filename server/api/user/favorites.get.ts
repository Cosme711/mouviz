import { eq, and, asc, inArray } from 'drizzle-orm'
import { films, favoriteFilms, userFilmInteractions } from '../../database/schema'

const CURRENT_USER_ID = 1

export default defineEventHandler(async (_event) => {
  const db = useDB()

  const favRows = db
    .select({ filmId: favoriteFilms.filmId, position: favoriteFilms.position })
    .from(favoriteFilms)
    .where(eq(favoriteFilms.userId, CURRENT_USER_ID))
    .orderBy(asc(favoriteFilms.position))
    .all()

  const filmIds = favRows.map(r => r.filmId)
  if (filmIds.length === 0) return { films: [] }

  const filmRows = db.select().from(films).where(inArray(films.id, filmIds)).all()
  const filmMap = new Map(filmRows.map(f => [f.id, f]))

  const interactions = db
    .select()
    .from(userFilmInteractions)
    .where(and(
      eq(userFilmInteractions.userId, CURRENT_USER_ID),
      inArray(userFilmInteractions.filmId, filmIds),
    ))
    .all()
  const interactionMap = new Map(interactions.map(i => [i.filmId, i]))

  return {
    films: favRows.map(row => {
      const f = filmMap.get(row.filmId)!
      const inter = interactionMap.get(row.filmId)
      return {
        id: f.id,
        title: f.title,
        year: f.year,
        poster: tmdbImage.poster(f.posterPath),
        rating: f.avgRating,
        watched: inter?.watched ?? true,
        liked: inter?.liked ?? false,
        inWatchlist: inter?.inWatchlist ?? false,
        userRating: inter?.userRating ?? undefined,
      }
    }),
  }
})
