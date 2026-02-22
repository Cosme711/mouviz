import { eq, and } from 'drizzle-orm'
import { reviews, activity, userFilmInteractions } from '../../../database/schema'

const CURRENT_USER_ID = 1

export default defineEventHandler(async (event) => {
  const db = useDB()
  const filmId = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)

  if (!body.rating || !body.text) {
    throw createError({ statusCode: 400, message: 'rating and text are required' })
  }

  const now = new Date().toISOString()

  const [review] = db
    .insert(reviews)
    .values({
      filmId,
      userId: CURRENT_USER_ID,
      rating: Number(body.rating),
      text: String(body.text),
      likes: 0,
      createdAt: now,
    })
    .returning()
    .all()

  db.insert(activity)
    .values({
      userId: CURRENT_USER_ID,
      filmId,
      type: 'reviewed',
      rating: Number(body.rating),
      reviewId: review!.id,
      createdAt: now,
    })
    .run()

  // Mark as watched when reviewing
  db.insert(userFilmInteractions)
    .values({
      userId: CURRENT_USER_ID,
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
    .run()

  return { ok: true, reviewId: review!.id }
})
