import { eq, and, asc, desc, inArray } from 'drizzle-orm'
import {
  users,
  userFilmInteractions,
  favoriteFilms,
  films,
  activity,
  lists,
  listFilms,
  userFollows,
} from '../../database/schema'

const CURRENT_USER_ID = 1

export default defineEventHandler(async (event) => {
  const db = useDB()
  const username = getRouterParam(event, 'username')

  const user = db.select().from(users).where(eq(users.username, username!)).get()
  if (!user) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  // Stats
  const watchedCount = db
    .select({ filmId: userFilmInteractions.filmId })
    .from(userFilmInteractions)
    .where(and(
      eq(userFilmInteractions.userId, user.id),
      eq(userFilmInteractions.watched, true),
    ))
    .all()
    .length

  const followingCount = db
    .select({ id: userFollows.followingId })
    .from(userFollows)
    .where(eq(userFollows.followerId, user.id))
    .all()
    .length

  const followersCount = db
    .select({ id: userFollows.followerId })
    .from(userFollows)
    .where(eq(userFollows.followingId, user.id))
    .all()
    .length

  // Favorite films
  const favRows = db
    .select({ filmId: favoriteFilms.filmId })
    .from(favoriteFilms)
    .where(eq(favoriteFilms.userId, user.id))
    .orderBy(asc(favoriteFilms.position))
    .all()

  const favFilmIds = favRows.map(r => r.filmId)
  const favFilms = favFilmIds.length > 0
    ? db.select().from(films).where(inArray(films.id, favFilmIds)).all()
    : []
  const favFilmMap = new Map(favFilms.map(f => [f.id, f]))

  const favoriteFilmCards = favRows.map(row => {
    const f = favFilmMap.get(row.filmId)!
    return {
      id: f.id,
      title: f.title,
      year: f.year,
      poster: tmdbImage.poster(f.posterPath),
      rating: f.avgRating,
      watched: true,
      liked: false,
      inWatchlist: false,
    }
  })

  // Recent activity (last 10)
  const activityRows = db
    .select({ act: activity })
    .from(activity)
    .where(eq(activity.userId, user.id))
    .orderBy(desc(activity.createdAt))
    .limit(10)
    .all()

  const actFilmIds = [...new Set(activityRows.map(r => r.act.filmId))]
  const actFilms = actFilmIds.length > 0
    ? db.select().from(films).where(inArray(films.id, actFilmIds)).all()
    : []
  const actFilmMap = new Map(actFilms.map(f => [f.id, f]))

  const recentActivity = activityRows
    .filter(r => actFilmMap.has(r.act.filmId))
    .map(r => {
      const f = actFilmMap.get(r.act.filmId)!
      return {
        id: r.act.id,
        type: r.act.type,
        user: user.username,
        avatar: user.avatar || `https://placehold.co/50x50/2c3440/00e054?text=${user.username.charAt(0).toUpperCase()}`,
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
    })

  // Public lists
  const listRows = db
    .select()
    .from(lists)
    .where(and(eq(lists.userId, user.id), eq(lists.isPublic, true)))
    .orderBy(desc(lists.likes))
    .all()

  const listIds = listRows.map(l => l.id)
  const listFilmRows = listIds.length > 0
    ? db.select({ listId: listFilms.listId, filmId: listFilms.filmId, position: listFilms.position })
        .from(listFilms)
        .where(inArray(listFilms.listId, listIds))
        .orderBy(asc(listFilms.position))
        .all()
    : []

  const listFilmIdSet = [...new Set(listFilmRows.map(r => r.filmId))]
  const listFilmRows2 = listFilmIdSet.length > 0
    ? db.select().from(films).where(inArray(films.id, listFilmIdSet)).all()
    : []
  const listFilmMap = new Map(listFilmRows2.map(f => [f.id, f]))

  const userLists = listRows.map(list => {
    const previewFilms = listFilmRows
      .filter(lf => lf.listId === list.id)
      .slice(0, 3)
      .map(lf => {
        const f = listFilmMap.get(lf.filmId)
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

    const filmCount = listFilmRows.filter(lf => lf.listId === list.id).length

    return {
      id: list.id,
      title: list.title,
      description: list.description,
      creator: user.username,
      films: previewFilms,
      filmCount,
      likes: list.likes,
      isPublic: list.isPublic,
    }
  })

  return {
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar || '',
    bio: user.bio,
    filmsWatched: watchedCount,
    following: followingCount,
    followers: followersCount,
    favoriteFilms: favoriteFilmCards,
    recentActivity,
    lists: userLists,
  }
})
