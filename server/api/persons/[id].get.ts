import { eq, inArray } from 'drizzle-orm'
import { persons, filmCredits, films } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const personId = Number(getRouterParam(event, 'id'))

  if (!personId || isNaN(personId)) {
    throw createError({ statusCode: 400, message: 'Invalid person ID' })
  }

  const person = await db.select().from(persons).where(eq(persons.id, personId)).get()
  if (!person) {
    throw createError({ statusCode: 404, message: 'Person not found' })
  }

  // Determine if director or actor
  const creditRows = await db
    .select({ role: filmCredits.role, filmId: filmCredits.filmId })
    .from(filmCredits)
    .where(eq(filmCredits.personId, personId))
    .all()

  const filmIds = [...new Set(creditRows.map(c => c.filmId))]
  const isDirector = creditRows.some(c => c.role === 'director')

  // Stats
  const personFilms = filmIds.length > 0
    ? await db.select({ rating: films.avgRating }).from(films).where(inArray(films.id, filmIds)).all()
    : []

  const averageRating = personFilms.length > 0
    ? personFilms.reduce((sum, f) => sum + f.rating, 0) / personFilms.length
    : 0

  // Top known films (by rating)
  const knownForFilms = filmIds.length > 0
    ? (await db.select({ title: films.title })
        .from(films)
        .where(inArray(films.id, filmIds))
        .orderBy(films.avgRating)
        .limit(4)
        .all()).map(f => f.title)
    : []

  return {
    id: person.id,
    name: person.name,
    role: isDirector ? 'Réalisateur' : 'Acteur',
    photo: tmdbImage.photo(person.photoPath),
    biography: person.biography || undefined,
    birthYear: person.birthYear ?? undefined,
    nationality: person.nationality ?? undefined,
    averageRating: Number(averageRating.toFixed(2)),
    filmsCount: filmIds.length,
    knownFor: knownForFilms,
  }
})
