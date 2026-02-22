import { sqliteTable, integer, text, real, primaryKey } from 'drizzle-orm/sqlite-core'

export const films = sqliteTable('films', {
  id: integer('id').primaryKey(), // TMDB id
  title: text('title').notNull(),
  year: integer('year').notNull(),
  duration: integer('duration').notNull().default(0),
  synopsis: text('synopsis').notNull().default(''),
  posterPath: text('poster_path').notNull().default(''),
  backdropPath: text('backdrop_path').notNull().default(''),
  avgRating: real('avg_rating').notNull().default(0),
  popularity: real('popularity').notNull().default(0),
})

export const persons = sqliteTable('persons', {
  id: integer('id').primaryKey(), // TMDB id
  name: text('name').notNull(),
  biography: text('biography').notNull().default(''),
  birthYear: integer('birth_year'),
  nationality: text('nationality'),
  photoPath: text('photo_path').notNull().default(''),
})

export const genres = sqliteTable('genres', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
})

export const filmGenres = sqliteTable('film_genres', {
  filmId: integer('film_id').notNull().references(() => films.id),
  genreId: integer('genre_id').notNull().references(() => genres.id),
}, (t) => [
  primaryKey({ columns: [t.filmId, t.genreId] }),
])

export const filmCredits = sqliteTable('film_credits', {
  filmId: integer('film_id').notNull().references(() => films.id),
  personId: integer('person_id').notNull().references(() => persons.id),
  role: text('role', { enum: ['director', 'actor'] }).notNull(),
  character: text('character'),
  order: integer('order').notNull().default(0),
}, (t) => [
  primaryKey({ columns: [t.filmId, t.personId, t.role] }),
])

export const similarFilms = sqliteTable('similar_films', {
  filmId: integer('film_id').notNull().references(() => films.id),
  similarFilmId: integer('similar_film_id').notNull().references(() => films.id),
}, (t) => [
  primaryKey({ columns: [t.filmId, t.similarFilmId] }),
])

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  displayName: text('display_name').notNull(),
  avatar: text('avatar').notNull().default(''),
  bio: text('bio').notNull().default(''),
  email: text('email').unique(),
  googleId: text('google_id').unique(),
  createdAt: text('created_at').notNull().default(new Date().toISOString()),
})

export const userFollows = sqliteTable('user_follows', {
  followerId: integer('follower_id').notNull().references(() => users.id),
  followingId: integer('following_id').notNull().references(() => users.id),
}, (t) => [
  primaryKey({ columns: [t.followerId, t.followingId] }),
])

export const userFilmInteractions = sqliteTable('user_film_interactions', {
  userId: integer('user_id').notNull().references(() => users.id),
  filmId: integer('film_id').notNull().references(() => films.id),
  watched: integer('watched', { mode: 'boolean' }).notNull().default(false),
  liked: integer('liked', { mode: 'boolean' }).notNull().default(false),
  inWatchlist: integer('in_watchlist', { mode: 'boolean' }).notNull().default(false),
  userRating: real('user_rating'),
}, (t) => [
  primaryKey({ columns: [t.userId, t.filmId] }),
])

export const reviews = sqliteTable('reviews', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  filmId: integer('film_id').notNull().references(() => films.id),
  userId: integer('user_id').notNull().references(() => users.id),
  rating: real('rating').notNull(),
  text: text('text').notNull(),
  likes: integer('likes').notNull().default(0),
  createdAt: text('created_at').notNull(),
})

export const diaryEntries = sqliteTable('diary_entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  filmId: integer('film_id').notNull().references(() => films.id),
  watchedAt: text('watched_at').notNull(),
  rating: real('rating'),
  liked: integer('liked', { mode: 'boolean' }).notNull().default(false),
  rewatch: integer('rewatch', { mode: 'boolean' }).notNull().default(false),
  review: text('review'),
})

export const activity = sqliteTable('activity', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  filmId: integer('film_id').notNull().references(() => films.id),
  type: text('type', { enum: ['watched', 'liked', 'reviewed', 'listed'] }).notNull(),
  rating: real('rating'),
  reviewId: integer('review_id').references(() => reviews.id),
  createdAt: text('created_at').notNull(),
})

export const lists = sqliteTable('lists', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  isPublic: integer('is_public', { mode: 'boolean' }).notNull().default(true),
  likes: integer('likes').notNull().default(0),
})

export const listFilms = sqliteTable('list_films', {
  listId: integer('list_id').notNull().references(() => lists.id),
  filmId: integer('film_id').notNull().references(() => films.id),
  position: integer('position').notNull().default(0),
}, (t) => [
  primaryKey({ columns: [t.listId, t.filmId] }),
])

export const favoriteFilms = sqliteTable('favorite_films', {
  userId: integer('user_id').notNull().references(() => users.id),
  filmId: integer('film_id').notNull().references(() => films.id),
  position: integer('position').notNull(),
}, (t) => [
  primaryKey({ columns: [t.userId, t.filmId] }),
])
