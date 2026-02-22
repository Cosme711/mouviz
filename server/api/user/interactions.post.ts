import { eq, and } from 'drizzle-orm'
import { userFilmInteractions, activity } from '../../database/schema'

const CURRENT_USER_ID = 1

export default defineEventHandler(async (event) => {
  const db = useDB()
  const body = await readBody(event)
  const filmId = Number(body.filmId)
  const field = String(body.field) as 'watched' | 'liked' | 'inWatchlist'

  if (!filmId || !['watched', 'liked', 'inWatchlist'].includes(field)) {
    throw createError({ statusCode: 400, message: 'filmId and field (watched|liked|inWatchlist) required' })
  }

  const existing = db
    .select()
    .from(userFilmInteractions)
    .where(and(
      eq(userFilmInteractions.userId, CURRENT_USER_ID),
      eq(userFilmInteractions.filmId, filmId),
    ))
    .get()

  const newValue = !existing?.[field]

  const newWatched = field === 'watched' ? newValue : (existing?.watched ?? false)
  const newLiked = field === 'liked' ? newValue : (existing?.liked ?? false)
  const newInWatchlist = field === 'inWatchlist' ? newValue : (existing?.inWatchlist ?? false)

  db.insert(userFilmInteractions)
    .values({
      userId: CURRENT_USER_ID,
      filmId,
      watched: newWatched,
      liked: newLiked,
      inWatchlist: newInWatchlist,
    })
    .onConflictDoUpdate({
      target: [userFilmInteractions.userId, userFilmInteractions.filmId],
      set: {
        watched: newWatched,
        liked: newLiked,
        inWatchlist: newInWatchlist,
      },
    })
    .run()

  // Log activity for watched/liked when toggling on
  if ((field === 'watched' || field === 'liked') && newValue) {
    db.insert(activity)
      .values({
        userId: CURRENT_USER_ID,
        filmId,
        type: field,
        createdAt: new Date().toISOString(),
      })
      .run()
  }

  return { ok: true, [field]: newValue }
})
