import { eq, desc, inArray, asc } from 'drizzle-orm'
import { lists, users, listFilms, films } from '../../database/schema'

export default defineEventHandler(async (_event) => {
  const db = useDB()

  const listRows = await db
    .select({ list: lists, user: users })
    .from(lists)
    .innerJoin(users, eq(lists.userId, users.id))
    .where(eq(lists.isPublic, true))
    .orderBy(desc(lists.likes))

  if (listRows.length === 0) return { lists: [] }

  const listIds = listRows.map(r => r.list.id)

  // Get up to 4 preview films per list
  const listFilmRows = await db
    .select({ listId: listFilms.listId, filmId: listFilms.filmId, position: listFilms.position })
    .from(listFilms)
    .where(inArray(listFilms.listId, listIds))
    .orderBy(asc(listFilms.position))

  const filmIds = [...new Set(listFilmRows.map(r => r.filmId))]
  const filmRows = filmIds.length > 0
    ? await db.select().from(films).where(inArray(films.id, filmIds))
    : []
  const filmMap = new Map(filmRows.map(f => [f.id, f]))

  return {
    lists: listRows.map(r => {
      const previewFilms = listFilmRows
        .filter(lf => lf.listId === r.list.id)
        .slice(0, 4)
        .map(lf => {
          const f = filmMap.get(lf.filmId)
          if (!f) return null
          return {
            id: f.id,
            title: f.title,
            year: f.year,
            poster: tmdbImage.poster(f.posterPath),
            rating: f.avgRating,
            watched: false,
            liked: false,
            inWatchlist: false,
          }
        })
        .filter(Boolean)

      const filmCount = listFilmRows.filter(lf => lf.listId === r.list.id).length

      return {
        id: r.list.id,
        title: r.list.title,
        description: r.list.description,
        creator: r.user.username,
        films: previewFilms,
        filmCount,
        likes: r.list.likes,
        isPublic: r.list.isPublic,
      }
    }),
  }
})
