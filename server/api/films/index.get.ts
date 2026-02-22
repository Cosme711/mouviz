import { eq, and, like, gte, desc, asc, inArray } from 'drizzle-orm'
import {
  films,
  genres,
  filmGenres,
  userFilmInteractions,
} from '../../database/schema'

const CURRENT_USER_ID = 1

export default defineEventHandler(async (event) => {
  const db = useDB()
  const query = getQuery(event)

  const limit = Number(query.limit) || 20
  const offset = Number(query.offset) || 0
  const sortBy = String(query.sortBy ?? 'popularity')
  const genreName = query.genre ? String(query.genre) : null
  const search = query.q ? String(query.q) : null
  const minRating = query.minRating ? Number(query.minRating) : 0
  const filterWatched = query.watched === '1'
  const filterNotWatched = query.notWatched === '1'
  const filterLiked = query.liked === '1'
  const filterWatchlist = query.watchlist === '1'

  // Get all genres for the response
  const allGenres = await db.select({ name: genres.name }).from(genres).orderBy(asc(genres.name)).all()
  const genreNames = allGenres.map(g => g.name)

  // Determine sort order
  const orderBy =
    sortBy === 'rating' ? desc(films.avgRating)
    : sortBy === 'year' ? desc(films.year)
    : sortBy === 'title' ? asc(films.title)
    : desc(films.popularity)

  // Build conditions
  const conditions = []

  if (search) {
    conditions.push(like(films.title, `%${search}%`))
  }
  if (minRating > 0) {
    conditions.push(gte(films.avgRating, minRating))
  }

  // Genre filter via subquery
  if (genreName) {
    const genreRow = await db.select({ id: genres.id }).from(genres).where(eq(genres.name, genreName)).get()
    if (!genreRow) {
      return { films: [], total: 0, genres: genreNames }
    }
    const filmIdsWithGenre = (await db
      .select({ filmId: filmGenres.filmId })
      .from(filmGenres)
      .where(eq(filmGenres.genreId, genreRow.id))
      .all()).map(r => r.filmId)
    if (filmIdsWithGenre.length === 0) {
      return { films: [], total: 0, genres: genreNames }
    }
    conditions.push(inArray(films.id, filmIdsWithGenre))
  }

  // Status filters (need interactions) — done in JS after initial fetch
  // Fetch all matching films (we'll filter by status in JS, then paginate)
  let allMatchingFilms = conditions.length > 0
    ? await db.select().from(films).where(and(...conditions)).orderBy(orderBy).all()
    : await db.select().from(films).orderBy(orderBy).all()

  // Get interactions for status filters
  const needsStatusFilter = filterWatched || filterNotWatched || filterLiked || filterWatchlist
  if (needsStatusFilter) {
    const filmIds = allMatchingFilms.map(f => f.id)
    const interactions = filmIds.length > 0
      ? await db.select().from(userFilmInteractions)
          .where(and(
            eq(userFilmInteractions.userId, CURRENT_USER_ID),
            inArray(userFilmInteractions.filmId, filmIds),
          ))
          .all()
      : []
    const interactionMap = new Map(interactions.map(i => [i.filmId, i]))

    allMatchingFilms = allMatchingFilms.filter(film => {
      const inter = interactionMap.get(film.id)
      if (filterWatched && !inter?.watched) return false
      if (filterNotWatched && inter?.watched) return false
      if (filterLiked && !inter?.liked) return false
      if (filterWatchlist && !inter?.inWatchlist) return false
      return true
    })
  }

  const total = allMatchingFilms.length
  const pageFilms = allMatchingFilms.slice(offset, offset + limit)
  const pageFilmIds = pageFilms.map(f => f.id)

  // Get genres for page films
  const filmGenreRows = pageFilmIds.length > 0
    ? await db.select({ filmId: filmGenres.filmId, genreName: genres.name })
        .from(filmGenres)
        .innerJoin(genres, eq(filmGenres.genreId, genres.id))
        .where(inArray(filmGenres.filmId, pageFilmIds))
        .all()
    : []

  // Get interactions for page films
  const interactions = pageFilmIds.length > 0
    ? await db.select().from(userFilmInteractions)
        .where(and(
          eq(userFilmInteractions.userId, CURRENT_USER_ID),
          inArray(userFilmInteractions.filmId, pageFilmIds),
        ))
        .all()
    : []
  const interactionMap = new Map(interactions.map(i => [i.filmId, i]))

  // Build response
  const filmCards = pageFilms.map(film => {
    const inter = interactionMap.get(film.id)
    const filmGenreList = filmGenreRows
      .filter(g => g.filmId === film.id)
      .map(g => g.genreName)

    return {
      id: film.id,
      title: film.title,
      year: film.year,
      poster: tmdbImage.poster(film.posterPath),
      rating: film.avgRating,
      watched: inter?.watched ?? false,
      liked: inter?.liked ?? false,
      inWatchlist: inter?.inWatchlist ?? false,
      userRating: inter?.userRating ?? undefined,
      genres: filmGenreList,
    }
  })

  return { films: filmCards, total, genres: genreNames }
})
