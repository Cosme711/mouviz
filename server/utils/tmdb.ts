export const tmdbImage = {
  poster: (path: string | null) =>
    path
      ? `https://image.tmdb.org/t/p/w500${path}`
      : 'https://placehold.co/500x750/2c3440/99aabb?text=No+Poster',
  backdrop: (path: string | null) =>
    path ? `https://image.tmdb.org/t/p/w1280${path}` : '',
  photo: (path: string | null) =>
    path
      ? `https://image.tmdb.org/t/p/w185${path}`
      : 'https://placehold.co/185x278/2c3440/99aabb?text=No+Photo',
}

let _lastRequest = 0

export async function tmdbFetch<T>(path: string, token: string): Promise<T> {
  const gap = 30 // ~33 req/s, safely under TMDB's 40 req/s limit
  const elapsed = Date.now() - _lastRequest
  if (elapsed < gap) {
    await new Promise(r => setTimeout(r, gap - elapsed))
  }
  _lastRequest = Date.now()

  const res = await fetch(`https://api.themoviedb.org/3${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  })

  if (!res.ok) {
    throw new Error(`TMDB ${res.status}: ${path}`)
  }

  return res.json() as Promise<T>
}
