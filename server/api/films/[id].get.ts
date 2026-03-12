import { eq, and, desc, inArray } from 'drizzle-orm'
import {
  films,
  genres,
  filmGenres,
  persons,
  filmCredits,
  userFilmInteractions,
  reviews,
  users,
} from '../../database/schema'

const CURRENT_USER_ID = 1

export default defineEventHandler(async (event) => {
  const db = useDB()
  const filmId = Number(getRouterParam(event, 'id'))

  if (!filmId || isNaN(filmId)) {
    throw createError({ statusCode: 400, message: 'Invalid film ID' })
  }

  const [film] = await db.select().from(films).where(eq(films.id, filmId))
  if (!film) {
    throw createError({ statusCode: 404, message: 'Film not found' })
  }

  // Genres
  const filmGenreRows = await db
    .select({ name: genres.name })
    .from(filmGenres)
    .innerJoin(genres, eq(filmGenres.genreId, genres.id))
    .where(eq(filmGenres.filmId, filmId))
  const genreList = filmGenreRows.map(g => g.name)

  // Director
  const [directorRow] = await db
    .select({ name: persons.name })
    .from(filmCredits)
    .innerJoin(persons, eq(filmCredits.personId, persons.id))
    .where(and(eq(filmCredits.filmId, filmId), eq(filmCredits.role, 'director')))

  // Cast
  const castRows = await db
    .select({
      id: persons.id,
      name: persons.name,
      character: filmCredits.character,
      photoPath: persons.photoPath,
      order: filmCredits.order,
    })
    .from(filmCredits)
    .innerJoin(persons, eq(filmCredits.personId, persons.id))
    .where(and(eq(filmCredits.filmId, filmId), eq(filmCredits.role, 'actor')))
    .orderBy(filmCredits.order)

  // User interaction
  const [interaction] = await db
    .select()
    .from(userFilmInteractions)
    .where(and(
      eq(userFilmInteractions.userId, CURRENT_USER_ID),
      eq(userFilmInteractions.filmId, filmId),
    ))

  // Review count
  const reviewRows = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(eq(reviews.filmId, filmId))

  return {
    id: film.id,
    title: film.title,
    year: film.year,
    poster: tmdbImage.poster(film.posterPath),
    backdrop: tmdbImage.backdrop(film.backdropPath),
    rating: film.avgRating,
    watched: interaction?.watched ?? false,
    liked: interaction?.liked ?? false,
    inWatchlist: interaction?.inWatchlist ?? false,
    userRating: interaction?.userRating ?? undefined,
    director: directorRow?.name ?? 'Inconnu',
    genres: genreList,
    duration: film.duration,
    synopsis: film.synopsis,
    country: film.country,
    reviewCount: reviewRows.length,
    cast: castRows.map(c => ({
      id: c.id,
      name: c.name,
      role: c.character ?? '',
      photo: tmdbImage.photo(c.photoPath),
    })),
  }
})
