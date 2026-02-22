import { lists } from '../../database/schema'

const CURRENT_USER_ID = 1

export default defineEventHandler(async (event) => {
  const db = useDB()
  const body = await readBody(event)

  if (!body.title) {
    throw createError({ statusCode: 400, message: 'title is required' })
  }

  const [list] = db
    .insert(lists)
    .values({
      userId: CURRENT_USER_ID,
      title: String(body.title),
      description: String(body.description ?? ''),
      isPublic: body.isPublic !== false,
      likes: 0,
    })
    .returning()
    .all()

  return { ok: true, list }
})
