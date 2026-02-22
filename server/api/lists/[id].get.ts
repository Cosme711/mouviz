import { eq, and, asc, inArray } from 'drizzle-orm'
import { lists, users, listFilms, films, userFilmInteractions } from '../../database/schema'

const CURRENT_USER_ID = 1

export default defineEventHandler(async (event) => {
  const db = useDB()
  const listId = Number(getRouterParam(event, 'id'))

  const listRow = db
    .select({ list: lists, user: users })
    .from(lists)
    .innerJoin(users, eq(lists.userId, users.id))
    .where(eq(lists.id, listId))
    .get()

  if (!listRow) {
    throw createError({ statusCode: 404, message: 'Liste introuvable' })
  }

  const listFilmRows = db
    .select({ filmId: listFilms.filmId, position: listFilms.position })
    .from(listFilms)
    .where(eq(listFilms.listId, listId))
    .orderBy(asc(listFilms.position))
    .all()

  const filmIds = listFilmRows.map(r => r.filmId)
  const filmRows = filmIds.length > 0
    ? db.select().from(films).where(inArray(films.id, filmIds)).all()
    : []
  const filmMap = new Map(filmRows.map(f => [f.id, f]))

  const interactions = filmIds.length > 0
    ? db.select().from(userFilmInteractions)
        .where(and(
          eq(userFilmInteractions.userId, CURRENT_USER_ID),
          inArray(userFilmInteractions.filmId, filmIds),
        ))
        .all()
    : []
  const interactionMap = new Map(interactions.map(i => [i.filmId, i]))

  const listFilmCards = listFilmRows.map(row => {
    const f = filmMap.get(row.filmId)!
    const inter = interactionMap.get(row.filmId)
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
  })

  return {
    id: listRow.list.id,
    title: listRow.list.title,
    description: listRow.list.description,
    creator: listRow.user.username,
    films: listFilmCards,
    likes: listRow.list.likes,
    isPublic: listRow.list.isPublic,
  }
})
