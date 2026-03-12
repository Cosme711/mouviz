import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from '../database/schema'

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null

export function useDB() {
  if (!_db) {
    const client = postgres(process.env.DATABASE_URL!, {
      max: 1,
      prepare: false, // required for Supabase Transaction Pooler (PgBouncer)
    })
    _db = drizzle(client, { schema })
  }
  return _db
}
