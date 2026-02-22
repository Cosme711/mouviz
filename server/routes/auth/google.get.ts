import { eq } from 'drizzle-orm'
import { users } from '../../database/schema'

export default defineOAuthGoogleEventHandler({
  async onSuccess(event, { user: googleUser }) {
    const db = useDB()

    const googleId = String(googleUser.sub)
    const email = googleUser.email ? String(googleUser.email) : null
    const displayName = googleUser.name ? String(googleUser.name) : (email?.split('@')[0] ?? 'user')
    const avatar = googleUser.picture ? String(googleUser.picture) : ''

    // Try to find existing user by googleId
    let existing = db
      .select()
      .from(users)
      .where(eq(users.googleId, googleId))
      .get()

    // Fall back to email match (for existing seeded users)
    if (!existing && email) {
      existing = db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .get()
    }

    if (existing) {
      // Update googleId/avatar if missing
      if (!existing.googleId || !existing.avatar) {
        db.update(users)
          .set({
            googleId: existing.googleId ?? googleId,
            avatar: existing.avatar || avatar,
            email: existing.email ?? email ?? undefined,
          })
          .where(eq(users.id, existing.id))
          .run()
      }
      await setUserSession(event, {
        user: {
          id: existing.id,
          username: existing.username,
          displayName: existing.displayName,
          avatar: existing.avatar || avatar,
        },
      })
    } else {
      // Create new user — derive a unique username from email or name
      const baseUsername = (email?.split('@')[0] ?? displayName)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 20) || 'user'

      // Ensure uniqueness by appending a counter if needed
      let username = baseUsername
      let counter = 1
      while (db.select().from(users).where(eq(users.username, username)).get()) {
        username = `${baseUsername}${counter++}`
      }

      const [newUser] = db
        .insert(users)
        .values({
          username,
          displayName,
          avatar,
          bio: '',
          email: email ?? undefined,
          googleId,
          createdAt: new Date().toISOString(),
        })
        .returning()
        .all()

      if (!newUser) {
        throw createError({ statusCode: 500, message: 'Erreur lors de la création du compte' })
      }

      await setUserSession(event, {
        user: {
          id: newUser.id,
          username: newUser.username,
          displayName: newUser.displayName,
          avatar: newUser.avatar,
        },
      })
    }

    return sendRedirect(event, '/')
  },

  onError(event, error) {
    console.error('Google OAuth error:', error)
    return sendRedirect(event, '/?error=oauth')
  },
})
