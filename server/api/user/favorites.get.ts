import { eq, and, asc, inArray } from 'drizzle-orm'
import { films, favoriteFilms, userFilmInteractions } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) throw createError({ statusCode: 401, message: 'Non authentifié' })
  const userId = session.user.id
  const db = useDB()

  const favRows = await db
    .select({ filmId: favoriteFilms.filmId, position: favoriteFilms.position })
    .from(favoriteFilms)
    .where(eq(favoriteFilms.userId, userId))
    .orderBy(asc(favoriteFilms.position))
    .all()

  const filmIds = favRows.map(r => r.filmId)
  if (filmIds.length === 0) return { films: [] }

  const filmRows = await db.select().from(films).where(inArray(films.id, filmIds)).all()
  const filmMap = new Map(filmRows.map(f => [f.id, f]))

  const interactions = await db
    .select()
    .from(userFilmInteractions)
    .where(and(
      eq(userFilmInteractions.userId, userId),
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
