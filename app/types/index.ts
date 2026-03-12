export interface FilmCard {
  id: number
  title: string
  year: number
  poster: string
  rating: number
  userRating?: number
  watched: boolean
  liked: boolean
  inWatchlist: boolean
}

export interface CastMember {
  id: number
  name: string
  role: string
  photo: string
}

export interface Review {
  id: number
  user: string
  avatar: string
  rating: number
  text: string
  date: string
  likes: number
}

export interface FilmDetail extends FilmCard {
  director: string
  backdrop: string
  genres: string[]
  duration: number
  synopsis: string
  reviewCount: number
  cast: CastMember[]
  country: string
}

export interface Activity {
  id: number
  type: 'watched' | 'liked' | 'reviewed' | 'listed'
  user: string
  avatar: string
  film: FilmCard
  rating?: number
  review?: string
  date: string
}

export interface DiaryEntry {
  id: number
  film: FilmCard
  date: string
  rating: number
  liked: boolean
  rewatch: boolean
  review?: string
}

export interface FilmList {
  id: number
  title: string
  description: string
  creator: string
  films: FilmCard[]
  filmCount?: number
  likes: number
  isPublic: boolean
}

export interface UserProfile {
  username: string
  displayName: string
  avatar: string
  bio: string
  filmsWatched: number
  following: number
  followers: number
  favoriteFilms: FilmCard[]
  recentActivity: Activity[]
  lists: FilmList[]
}

export interface PersonDetail {
  id: number
  name: string
  role: string
  photo: string
  biography?: string
  birthYear?: number
  nationality?: string
  averageRating?: number
  filmsCount?: number
  knownFor?: string[]
}
