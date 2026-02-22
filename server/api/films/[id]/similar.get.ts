import { eq, and, inArray } from 'drizzle-orm'
import { films, similarFilms, userFilmInteractions } from '../../../database/schema'

const CURRENT_USER_ID = 1

export default defineEventHandler(async (event) => {
  const db = useDB()
  const filmId = Number(getRouterParam(event, 'id'))

  const similarRows = await db
    .select({ similarFilmId: similarFilms.similarFilmId })
    .from(similarFilms)
    .where(eq(similarFilms.filmId, filmId))
    .all()

  if (similarRows.length === 0) {
    return { films: [] }
  }

  const similarFilmIds = similarRows.map(r => r.similarFilmId)
  const similarFilmRows = await db
    .select()
    .from(films)
    .where(inArray(films.id, similarFilmIds))
    .all()

  const interactions = await db
    .select()
    .from(userFilmInteractions)
    .where(and(
      eq(userFilmInteractions.userId, CURRENT_USER_ID),
      inArray(userFilmInteractions.filmId, similarFilmIds),
    ))
    .all()
  const interactionMap = new Map(interactions.map(i => [i.filmId, i]))

  return {
    films: similarFilmRows.map(f => {
      const inter = interactionMap.get(f.id)
      return {
        id: f.id,
        title: f.title,
        year: f.year,
        poster: tmdbImage.poster(f.posterPath),
        rating: f.avgRating,
        watched: inter?.watched ?? false,
        liked: inter?.liked ?? false,
        inWatchlist: inter?.inWatchlist ?? false,
        userRating: inter?.userRating ?? undefined,
      }
    }),
  }
})
