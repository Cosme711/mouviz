import { eq } from 'drizzle-orm'
import { userFilmInteractions } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) throw createError({ statusCode: 401, message: 'Non authentifié' })
  const userId = session.user.id
  const db = useDB()

  const interactions = await db
    .select()
    .from(userFilmInteractions)
    .where(eq(userFilmInteractions.userId, userId))
    .all()

  return { interactions }
})
