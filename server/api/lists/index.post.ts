import { lists } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) throw createError({ statusCode: 401, message: 'Non authentifié' })
  const userId = session.user.id
  const db = useDB()
  const body = await readBody(event)

  if (!body.title) {
    throw createError({ statusCode: 400, message: 'title is required' })
  }

  const [list] = await db
    .insert(lists)
    .values({
      userId: userId,
      title: String(body.title),
      description: String(body.description ?? ''),
      isPublic: body.isPublic !== false,
      likes: 0,
    })
    .returning()

  return { ok: true, list }
})
