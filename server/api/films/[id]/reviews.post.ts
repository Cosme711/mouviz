import { eq, and } from 'drizzle-orm'
import { reviews, activity, userFilmInteractions } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) throw createError({ statusCode: 401, message: 'Non authentifié' })
  const userId = session.user.id
  const db = useDB()
  const filmId = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)

  if (!body.rating || !body.text) {
    throw createError({ statusCode: 400, message: 'rating and text are required' })
  }

  const now = new Date().toISOString()

  const [review] = await db
    .insert(reviews)
    .values({
      filmId,
      userId: userId,
      rating: Number(body.rating),
      text: String(body.text),
      likes: 0,
      createdAt: now,
    })
    .returning()

  await db.insert(activity)
    .values({
      userId: userId,
      filmId,
      type: 'reviewed',
      rating: Number(body.rating),
      reviewId: review!.id,
      createdAt: now,
    })

  // Mark as watched when reviewing
  await db.insert(userFilmInteractions)
    .values({
      userId: userId,
      filmId,
      watched: true,
      liked: false,
      inWatchlist: false,
      userRating: Number(body.rating),
    })
    .onConflictDoUpdate({
      target: [userFilmInteractions.userId, userFilmInteractions.filmId],
      set: { watched: true, userRating: Number(body.rating) },
    })

  return { ok: true, reviewId: review!.id }
})
