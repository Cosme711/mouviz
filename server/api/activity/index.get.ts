import { eq, desc, inArray } from 'drizzle-orm'
import { activity, users, films } from '../../database/schema'

export default defineEventHandler(async (_event) => {
  const db = useDB()

  const activityRows = await db
    .select({
      act: activity,
      user: users,
    })
    .from(activity)
    .innerJoin(users, eq(activity.userId, users.id))
    .orderBy(desc(activity.createdAt))
    .limit(20)

  if (activityRows.length === 0) return { activities: [] }

  const filmIds = [...new Set(activityRows.map(r => r.act.filmId))]
  const filmRows = await db.select().from(films).where(inArray(films.id, filmIds))
  const filmMap = new Map(filmRows.map(f => [f.id, f]))

  return {
    activities: activityRows
      .filter(r => filmMap.has(r.act.filmId))
      .map(r => {
        const f = filmMap.get(r.act.filmId)!
        return {
          id: r.act.id,
          type: r.act.type,
          user: r.user.username,
          avatar: r.user.avatar || `https://placehold.co/50x50/2c3440/00e054?text=${r.user.username.charAt(0).toUpperCase()}`,
          film: {
            id: f.id,
            title: f.title,
            year: f.year,
            poster: tmdbImage.poster(f.posterPath),
            rating: f.avgRating,
            watched: false,
            liked: false,
            inWatchlist: false,
          },
          rating: r.act.rating ?? undefined,
          date: r.act.createdAt,
        }
      }),
  }
})
