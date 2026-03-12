import { eq, and } from 'drizzle-orm'
import { userFilmInteractions, activity } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) throw createError({ statusCode: 401, message: 'Non authentifié' })
  const userId = session.user.id
  const db = useDB()
  const body = await readBody(event)
  const filmId = Number(body.filmId)
  const field = String(body.field) as 'watched' | 'liked' | 'inWatchlist'

  if (!filmId || !['watched', 'liked', 'inWatchlist'].includes(field)) {
    throw createError({ statusCode: 400, message: 'filmId and field (watched|liked|inWatchlist) required' })
  }

  const [existing] = await db
    .select()
    .from(userFilmInteractions)
    .where(and(
      eq(userFilmInteractions.userId, userId),
      eq(userFilmInteractions.filmId, filmId),
    ))

  const newValue = !existing?.[field]

  const newWatched = field === 'watched' ? newValue : (existing?.watched ?? false)
  const newLiked = field === 'liked' ? newValue : (existing?.liked ?? false)
  const newInWatchlist = field === 'inWatchlist' ? newValue : (existing?.inWatchlist ?? false)

  await db.insert(userFilmInteractions)
    .values({
      userId: userId,
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

  // Log activity for watched/liked when toggling on
  if ((field === 'watched' || field === 'liked') && newValue) {
    await db.insert(activity)
      .values({
        userId: userId,
        filmId,
        type: field,
        createdAt: new Date().toISOString(),
      })
  }

  return { ok: true, [field]: newValue }
})
