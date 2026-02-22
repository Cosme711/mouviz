import { eq, and, inArray, desc } from 'drizzle-orm'
import { films, filmCredits, userFilmInteractions } from '../../../database/schema'

const CURRENT_USER_ID = 1

export default defineEventHandler(async (event) => {
  const db = useDB()
  const personId = Number(getRouterParam(event, 'id'))

  const creditRows = await db
    .select({ filmId: filmCredits.filmId })
    .from(filmCredits)
    .where(eq(filmCredits.personId, personId))
    .all()

  const filmIds = [...new Set(creditRows.map(c => c.filmId))]
  if (filmIds.length === 0) {
    return { films: [] }
  }

  const filmRows = await db
    .select()
    .from(films)
    .where(inArray(films.id, filmIds))
    .orderBy(desc(films.year))
    .all()

  const interactions = await db
    .select()
    .from(userFilmInteractions)
    .where(and(
      eq(userFilmInteractions.userId, CURRENT_USER_ID),
      inArray(userFilmInteractions.filmId, filmIds),
    ))
    .all()
  const interactionMap = new Map(interactions.map(i => [i.filmId, i]))

  return {
    films: filmRows.map(f => {
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
