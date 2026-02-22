import { eq, desc } from 'drizzle-orm'
import { reviews, users } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const filmId = Number(getRouterParam(event, 'id'))

  const reviewRows = db
    .select({
      review: reviews,
      user: users,
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .where(eq(reviews.filmId, filmId))
    .orderBy(desc(reviews.createdAt))
    .all()

  return {
    reviews: reviewRows.map(r => ({
      id: r.review.id,
      user: r.user.username,
      avatar: r.user.avatar || `https://placehold.co/50x50/2c3440/00e054?text=${r.user.username.charAt(0).toUpperCase()}`,
      rating: r.review.rating,
      text: r.review.text,
      date: r.review.createdAt,
      likes: r.review.likes,
    })),
  }
})
