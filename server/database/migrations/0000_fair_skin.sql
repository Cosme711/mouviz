CREATE TABLE "activity" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"film_id" integer NOT NULL,
	"type" text NOT NULL,
	"rating" real,
	"review_id" integer,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "diary_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"film_id" integer NOT NULL,
	"watched_at" text NOT NULL,
	"rating" real,
	"liked" boolean DEFAULT false NOT NULL,
	"rewatch" boolean DEFAULT false NOT NULL,
	"review" text
);
--> statement-breakpoint
CREATE TABLE "favorite_films" (
	"user_id" integer NOT NULL,
	"film_id" integer NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "favorite_films_user_id_film_id_pk" PRIMARY KEY("user_id","film_id")
);
--> statement-breakpoint
CREATE TABLE "film_credits" (
	"film_id" integer NOT NULL,
	"person_id" integer NOT NULL,
	"role" text NOT NULL,
	"character" text,
	"order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "film_credits_film_id_person_id_role_pk" PRIMARY KEY("film_id","person_id","role")
);
--> statement-breakpoint
CREATE TABLE "film_genres" (
	"film_id" integer NOT NULL,
	"genre_id" integer NOT NULL,
	CONSTRAINT "film_genres_film_id_genre_id_pk" PRIMARY KEY("film_id","genre_id")
);
--> statement-breakpoint
CREATE TABLE "films" (
	"id" integer PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"year" integer NOT NULL,
	"duration" integer DEFAULT 0 NOT NULL,
	"synopsis" text DEFAULT '' NOT NULL,
	"poster_path" text DEFAULT '' NOT NULL,
	"backdrop_path" text DEFAULT '' NOT NULL,
	"avg_rating" real DEFAULT 0 NOT NULL,
	"popularity" real DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "genres" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "list_films" (
	"list_id" integer NOT NULL,
	"film_id" integer NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "list_films_list_id_film_id_pk" PRIMARY KEY("list_id","film_id")
);
--> statement-breakpoint
CREATE TABLE "lists" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"likes" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "persons" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"biography" text DEFAULT '' NOT NULL,
	"birth_year" integer,
	"nationality" text,
	"photo_path" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"film_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"rating" real NOT NULL,
	"text" text NOT NULL,
	"likes" integer DEFAULT 0 NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "similar_films" (
	"film_id" integer NOT NULL,
	"similar_film_id" integer NOT NULL,
	CONSTRAINT "similar_films_film_id_similar_film_id_pk" PRIMARY KEY("film_id","similar_film_id")
);
--> statement-breakpoint
CREATE TABLE "user_film_interactions" (
	"user_id" integer NOT NULL,
	"film_id" integer NOT NULL,
	"watched" boolean DEFAULT false NOT NULL,
	"liked" boolean DEFAULT false NOT NULL,
	"in_watchlist" boolean DEFAULT false NOT NULL,
	"user_rating" real,
	CONSTRAINT "user_film_interactions_user_id_film_id_pk" PRIMARY KEY("user_id","film_id")
);
--> statement-breakpoint
CREATE TABLE "user_follows" (
	"follower_id" integer NOT NULL,
	"following_id" integer NOT NULL,
	CONSTRAINT "user_follows_follower_id_following_id_pk" PRIMARY KEY("follower_id","following_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"display_name" text NOT NULL,
	"avatar" text DEFAULT '' NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"email" text,
	"google_id" text,
	"created_at" text DEFAULT '2026-03-12T19:52:01.797Z' NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id")
);
--> statement-breakpoint
ALTER TABLE "activity" ADD CONSTRAINT "activity_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity" ADD CONSTRAINT "activity_film_id_films_id_fk" FOREIGN KEY ("film_id") REFERENCES "public"."films"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity" ADD CONSTRAINT "activity_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diary_entries" ADD CONSTRAINT "diary_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diary_entries" ADD CONSTRAINT "diary_entries_film_id_films_id_fk" FOREIGN KEY ("film_id") REFERENCES "public"."films"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorite_films" ADD CONSTRAINT "favorite_films_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorite_films" ADD CONSTRAINT "favorite_films_film_id_films_id_fk" FOREIGN KEY ("film_id") REFERENCES "public"."films"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "film_credits" ADD CONSTRAINT "film_credits_film_id_films_id_fk" FOREIGN KEY ("film_id") REFERENCES "public"."films"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "film_credits" ADD CONSTRAINT "film_credits_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "film_genres" ADD CONSTRAINT "film_genres_film_id_films_id_fk" FOREIGN KEY ("film_id") REFERENCES "public"."films"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "film_genres" ADD CONSTRAINT "film_genres_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "list_films" ADD CONSTRAINT "list_films_list_id_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."lists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "list_films" ADD CONSTRAINT "list_films_film_id_films_id_fk" FOREIGN KEY ("film_id") REFERENCES "public"."films"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lists" ADD CONSTRAINT "lists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_film_id_films_id_fk" FOREIGN KEY ("film_id") REFERENCES "public"."films"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "similar_films" ADD CONSTRAINT "similar_films_film_id_films_id_fk" FOREIGN KEY ("film_id") REFERENCES "public"."films"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "similar_films" ADD CONSTRAINT "similar_films_similar_film_id_films_id_fk" FOREIGN KEY ("similar_film_id") REFERENCES "public"."films"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_film_interactions" ADD CONSTRAINT "user_film_interactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_film_interactions" ADD CONSTRAINT "user_film_interactions_film_id_films_id_fk" FOREIGN KEY ("film_id") REFERENCES "public"."films"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_follower_id_users_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_following_id_users_id_fk" FOREIGN KEY ("following_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;