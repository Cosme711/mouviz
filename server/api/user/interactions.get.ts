import { eq } from 'drizzle-orm'
import { userFilmInteractions } from '../../database/schema'

const CURRENT_USER_ID = 1

export default defineEventHandler(async (_event) => {
  const db = useDB()

  const interactions = db
    .select()
    .from(userFilmInteractions)
    .where(eq(userFilmInteractions.userId, CURRENT_USER_ID))
    .all()

  return { interactions }
})
