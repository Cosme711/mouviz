export interface Film {
  id: string
  title: string
  year: number
  director: string
  rating: number
  userRating?: number
  poster: string
  backdrop: string
  genres: string[]
  duration: number
  synopsis: string
  cast: Person[]
  watched: boolean
  liked: boolean
  inWatchlist: boolean
  reviews: Review[]
  similarFilms?: string[]
}

export interface Person {
  id: string
  name: string
  role: string
  photo: string
  knownFor?: string[]
  biography?: string
  birthYear?: number
  nationality?: string
  averageRating?: number
  filmsCount?: number
}

export interface Review {
  id: string
  user: string
  avatar: string
  rating: number
  text: string
  date: string
  likes: number
}

export interface Activity {
  id: string
  type: 'watched' | 'liked' | 'reviewed' | 'listed'
  user: string
  avatar: string
  film: Film
  rating?: number
  review?: string
  date: string
}

export interface UserProfile {
  username: string
  displayName: string
  avatar: string
  bio: string
  filmsWatched: number
  following: number
  followers: number
  favoriteFilms: Film[]
  recentActivity: Activity[]
  lists: FilmList[]
}

export interface FilmList {
  id: string
  title: string
  description: string
  creator: string
  films: Film[]
  likes: number
  isPublic: boolean
}

export interface DiaryEntry {
  id: string
  film: Film
  date: string
  rating: number
  liked: boolean
  rewatch: boolean
  review?: string
}

export const mockFilms: Film[] = [
  {
    id: '1',
    title: 'Oppenheimer',
    year: 2023,
    director: 'Christopher Nolan',
    rating: 4.5,
    userRating: 5,
    poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&h=450&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1920&h=600&fit=crop',
    genres: ['Drame', 'Histoire', 'Thriller'],
    duration: 180,
    synopsis: 'L\'histoire de J. Robert Oppenheimer et du développement de la bombe atomique pendant la Seconde Guerre mondiale.',
    cast: [],
    watched: true,
    liked: true,
    inWatchlist: false,
    reviews: [],
    similarFilms: ['2', '3'],
  },
  {
    id: '2',
    title: 'Dune: Part Two',
    year: 2024,
    director: 'Denis Villeneuve',
    rating: 4.3,
    userRating: 4,
    poster: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=450&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=1920&h=600&fit=crop',
    genres: ['Science-fiction', 'Aventure'],
    duration: 166,
    synopsis: 'Paul Atreides s\'unit à Chani et aux Fremen pour mener la guerre contre ceux qui ont détruit sa famille.',
    cast: [],
    watched: true,
    liked: false,
    inWatchlist: false,
    reviews: [],
    similarFilms: ['1', '5'],
  },
  {
    id: '3',
    title: 'Poor Things',
    year: 2023,
    director: 'Yorgos Lanthimos',
    rating: 4.2,
    poster: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=450&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&h=600&fit=crop',
    genres: ['Fantastique', 'Romance', 'Comédie'],
    duration: 141,
    synopsis: 'Bella Baxter, ramenée à la vie par un chirurgien brillant mais peu orthodoxe, s\'échappe sous l\'égide d\'un avocat peu scrupuleux.',
    cast: [],
    watched: false,
    liked: false,
    inWatchlist: true,
    reviews: [],
    similarFilms: ['4'],
  },
  {
    id: '4',
    title: 'The Zone of Interest',
    year: 2023,
    director: 'Jonathan Glazer',
    rating: 4.4,
    poster: 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?w=300&h=450&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&h=600&fit=crop',
    genres: ['Drame', 'Histoire', 'Guerre'],
    duration: 105,
    synopsis: 'Le commandant d\'Auschwitz et sa femme s\'efforcent de construire une vie de rêve pour leur famille dans leur maison adjacente au camp.',
    cast: [],
    watched: true,
    liked: true,
    inWatchlist: false,
    reviews: [],
  },
  {
    id: '5',
    title: 'Past Lives',
    year: 2023,
    director: 'Celine Song',
    rating: 4.6,
    userRating: 5,
    poster: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=300&h=450&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920&h=600&fit=crop',
    genres: ['Romance', 'Drame'],
    duration: 106,
    synopsis: 'Nora et Hae Sung, deux amis d\'enfance profondément liés, se retrouvent à New York des années plus tard.',
    cast: [],
    watched: true,
    liked: true,
    inWatchlist: false,
    reviews: [],
  },
  {
    id: '6',
    title: 'Killers of the Flower Moon',
    year: 2023,
    director: 'Martin Scorsese',
    rating: 4.1,
    poster: 'https://images.unsplash.com/photo-1473186578172-c141e6798cf4?w=300&h=450&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1485470733090-0aae1788d5af?w=1920&h=600&fit=crop',
    genres: ['Crime', 'Drame', 'Histoire'],
    duration: 206,
    synopsis: 'Membres d\'une tribu amérindienne, les Osage, sont assassinés dans les années 1920 après la découverte de pétrole.',
    cast: [],
    watched: false,
    liked: false,
    inWatchlist: true,
    reviews: [],
  },
  {
    id: '7',
    title: 'Monster',
    year: 2023,
    director: 'Hirokazu Kore-eda',
    rating: 4.3,
    poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&h=450&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&h=600&fit=crop',
    genres: ['Drame', 'Mystère'],
    duration: 126,
    synopsis: 'Une mère soupçonne un enseignant de maltraiter son fils dans une école japonaise.',
    cast: [],
    watched: false,
    liked: false,
    inWatchlist: false,
    reviews: [],
  },
  {
    id: '8',
    title: 'Saltburn',
    year: 2023,
    director: 'Emerald Fennell',
    rating: 3.9,
    poster: 'https://images.unsplash.com/photo-1445975122826-f28ef0d3bc00?w=300&h=450&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=1920&h=600&fit=crop',
    genres: ['Thriller', 'Drame'],
    duration: 131,
    synopsis: 'Un étudiant fasciné par son camarade charismatique est invité à passer l\'été dans le manoir familial extravagant.',
    cast: [],
    watched: true,
    liked: false,
    inWatchlist: false,
    reviews: [],
  },
  {
    id: '9',
    title: 'The Holdovers',
    year: 2023,
    director: 'Alexander Payne',
    rating: 4.2,
    poster: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=300&h=450&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1418985991508-e47386d96a71?w=1920&h=600&fit=crop',
    genres: ['Comédie', 'Drame'],
    duration: 133,
    synopsis: 'Un professeur bourru reste avec des élèves à l\'internat pendant les vacances de Noël.',
    cast: [],
    watched: false,
    liked: false,
    inWatchlist: true,
    reviews: [],
  },
  {
    id: '10',
    title: 'Anatomy of a Fall',
    year: 2023,
    director: 'Justine Triet',
    rating: 4.4,
    poster: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=300&h=450&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=1920&h=600&fit=crop',
    genres: ['Thriller', 'Drame', 'Crime'],
    duration: 150,
    synopsis: 'Une femme est jugée pour le meurtre présumé de son mari retrouvé mort dans la neige.',
    cast: [],
    watched: true,
    liked: true,
    inWatchlist: false,
    reviews: [],
  },
  {
    id: '11',
    title: 'May December',
    year: 2023,
    director: 'Todd Haynes',
    rating: 3.8,
    poster: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=300&h=450&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1502786129293-79981df4e689?w=1920&h=600&fit=crop',
    genres: ['Drame', 'Comédie'],
    duration: 113,
    synopsis: 'Une actrice arrive dans le foyer d\'une femme controversée pour se préparer à jouer son rôle dans un film.',
    cast: [],
    watched: false,
    liked: false,
    inWatchlist: false,
    reviews: [],
  },
  {
    id: '12',
    title: 'Ferrari',
    year: 2023,
    director: 'Michael Mann',
    rating: 3.7,
    poster: 'https://images.unsplash.com/photo-1526726538690-5cbf956ae2fd?w=300&h=450&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&h=600&fit=crop',
    genres: ['Biopic', 'Drame', 'Sport'],
    duration: 130,
    synopsis: 'En 1957, Enzo Ferrari, au bord de la faillite, fait tout pour que son entreprise survive à travers la course automobile.',
    cast: [],
    watched: false,
    liked: false,
    inWatchlist: true,
    reviews: [],
  },
  {
    id: '13',
    title: 'Priscilla',
    year: 2023,
    director: 'Sofia Coppola',
    rating: 3.8,
    poster: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=300&h=450&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=1920&h=600&fit=crop',
    genres: ['Biopic', 'Drame', 'Romance'],
    duration: 113,
    synopsis: 'L\'histoire vraie de Priscilla Beaulieu et sa relation avec Elvis Presley.',
    cast: [],
    watched: true,
    liked: false,
    inWatchlist: false,
    reviews: [],
  },
  {
    id: '14',
    title: 'El Conde',
    year: 2023,
    director: 'Pablo Larraín',
    rating: 3.9,
    poster: 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?w=300&h=450&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1517760444937-f6397edcbbcd?w=1920&h=600&fit=crop',
    genres: ['Comédie noire', 'Fantastique', 'Histoire'],
    duration: 110,
    synopsis: 'Pinochet est un vampire de 250 ans qui décide de mourir mais reconsidère sa décision.',
    cast: [],
    watched: false,
    liked: false,
    inWatchlist: false,
    reviews: [],
  },
  {
    id: '15',
    title: 'Cabrini',
    year: 2024,
    director: 'Alejandro Monteverde',
    rating: 4.0,
    poster: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=300&h=450&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1920&h=600&fit=crop',
    genres: ['Biopic', 'Drame'],
    duration: 143,
    synopsis: 'L\'histoire de Francesca Cabrini, première citoyenne américaine canonisée.',
    cast: [],
    watched: false,
    liked: false,
    inWatchlist: false,
    reviews: [],
  },
  {
    id: '16',
    title: 'Civil War',
    year: 2024,
    director: 'Alex Garland',
    rating: 4.1,
    poster: 'https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=300&h=450&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1920&h=600&fit=crop',
    genres: ['Action', 'Drame', 'Guerre'],
    duration: 109,
    synopsis: 'Des journalistes traversent une Amérique en proie à une seconde guerre civile.',
    cast: [],
    watched: true,
    liked: false,
    inWatchlist: false,
    reviews: [],
  },
]

export const mockPersons: Person[] = [
  {
    id: 'p1',
    name: 'Christopher Nolan',
    role: 'Réalisateur',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=450&fit=crop',
    biography: 'Christopher Edward Nolan est un réalisateur, scénariste et producteur de cinéma britannique. Il est connu pour ses films à grande envergure qui abordent des thèmes philosophiques et ont souvent recours à des structures temporelles complexes.',
    birthYear: 1970,
    nationality: 'Britannique',
    averageRating: 4.3,
    filmsCount: 12,
    knownFor: ['The Dark Knight', 'Inception', 'Interstellar', 'Oppenheimer'],
  },
  {
    id: 'p2',
    name: 'Denis Villeneuve',
    role: 'Réalisateur',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=450&fit=crop',
    biography: 'Denis Villeneuve est un réalisateur canadien connu pour ses films d\'atmosphère dense et visuellement époustouflants.',
    birthYear: 1967,
    nationality: 'Canadien',
    averageRating: 4.4,
    filmsCount: 10,
    knownFor: ['Arrival', 'Blade Runner 2049', 'Dune', 'Prisoners'],
  },
  {
    id: 'p3',
    name: 'Emma Stone',
    role: 'Actrice',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=450&fit=crop',
    biography: 'Emily Jean Stone est une actrice américaine. Elle a remporté l\'Oscar de la meilleure actrice pour La La Land.',
    birthYear: 1988,
    nationality: 'Américaine',
    averageRating: 4.2,
    filmsCount: 30,
    knownFor: ['La La Land', 'Poor Things', 'The Favourite', 'Easy A'],
  },
  {
    id: 'p4',
    name: 'Cillian Murphy',
    role: 'Acteur',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=450&fit=crop',
    biography: 'Cillian Murphy est un acteur irlandais connu pour ses rôles dans Peaky Blinders et les films de Christopher Nolan.',
    birthYear: 1976,
    nationality: 'Irlandais',
    averageRating: 4.3,
    filmsCount: 45,
    knownFor: ['Oppenheimer', 'Peaky Blinders', 'Batman Begins', '28 Days Later'],
  },
  {
    id: 'p5',
    name: 'Timothée Chalamet',
    role: 'Acteur',
    photo: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=300&h=450&fit=crop',
    biography: 'Timothée Hal Chalamet est un acteur américano-français. Il est connu pour ses rôles dans Dune, Call Me by Your Name et Little Women.',
    birthYear: 1995,
    nationality: 'Américain',
    averageRating: 4.1,
    filmsCount: 20,
    knownFor: ['Dune', 'Call Me by Your Name', 'Little Women', 'Wonka'],
  },
  {
    id: 'p6',
    name: 'Zendaya',
    role: 'Actrice',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=450&fit=crop',
    biography: 'Zendaya Maree Stoermer Coleman est une actrice américaine connue pour Euphoria et la saga Dune.',
    birthYear: 1996,
    nationality: 'Américaine',
    averageRating: 4.2,
    filmsCount: 15,
    knownFor: ['Dune', 'Euphoria', 'Spider-Man', 'Challengers'],
  },
]

export const mockReviews: Review[] = [
  {
    id: 'r1',
    user: 'cinephile_42',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50&h=50&fit=crop',
    rating: 5,
    text: 'Un chef-d\'œuvre absolu. Nolan réussit à rendre accessible l\'histoire complexe d\'Oppenheimer tout en maintenant une tension dramatique constante.',
    date: '2024-01-15',
    likes: 245,
  },
  {
    id: 'r2',
    user: 'film_lover',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop',
    rating: 4,
    text: 'Brillant dans sa construction narrative. La séquence du test Trinity est à couper le souffle. Murphy est exceptionnel.',
    date: '2024-01-20',
    likes: 189,
  },
  {
    id: 'r3',
    user: 'moviebuff_99',
    avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=50&h=50&fit=crop',
    rating: 4.5,
    text: 'La deuxième partie est plus dense mais la réflexion sur la responsabilité scientifique est passionnante.',
    date: '2024-02-01',
    likes: 134,
  },
]

// Add reviews and cast to mockFilms
mockFilms[0]!.reviews = mockReviews
mockFilms[0]!.cast = mockPersons.slice(3, 6)
mockFilms[1]!.cast = [mockPersons[4]!, mockPersons[5]!]
mockFilms[2]!.cast = [mockPersons[2]!]

export const mockUsers: UserProfile[] = [
  {
    username: 'currentuser',
    displayName: 'Alex Dupont',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
    bio: 'Cinéphile passionné. Amateur de films d\'auteur et de science-fiction.',
    filmsWatched: 847,
    following: 156,
    followers: 234,
    favoriteFilms: [mockFilms[4]!, mockFilms[0]!, mockFilms[3]!, mockFilms[9]!],
    recentActivity: [],
    lists: [],
  },
]

export const mockLists: FilmList[] = [
  {
    id: 'l1',
    title: 'Meilleurs films de 2023',
    description: 'Ma sélection personnelle des films les plus marquants de l\'année 2023.',
    creator: 'currentuser',
    films: [mockFilms[0]!, mockFilms[1]!, mockFilms[4]!, mockFilms[9]!],
    likes: 142,
    isPublic: true,
  },
  {
    id: 'l2',
    title: 'Films à voir absolument',
    description: 'Une liste de films incontournables pour tout cinéphile qui se respecte.',
    creator: 'cinephile_42',
    films: [mockFilms[3]!, mockFilms[4]!, mockFilms[2]!, mockFilms[6]!],
    likes: 89,
    isPublic: true,
  },
  {
    id: 'l3',
    title: 'Palme d\'Or Collection',
    description: 'Films récompensés ou nommés à Cannes ces dernières années.',
    creator: 'currentuser',
    films: [mockFilms[9]!, mockFilms[6]!, mockFilms[3]!, mockFilms[2]!],
    likes: 67,
    isPublic: true,
  },
]

export const mockDiaryEntries: DiaryEntry[] = [
  {
    id: 'd1',
    film: mockFilms[0]!,
    date: '2024-02-15',
    rating: 5,
    liked: true,
    rewatch: false,
    review: 'Revu pour la troisième fois, toujours aussi puissant.',
  },
  {
    id: 'd2',
    film: mockFilms[9]!,
    date: '2024-02-10',
    rating: 4.5,
    liked: true,
    rewatch: false,
    review: 'Sandra Hüller est absolument remarquable.',
  },
  {
    id: 'd3',
    film: mockFilms[4]!,
    date: '2024-02-03',
    rating: 5,
    liked: true,
    rewatch: false,
    review: 'Un film qui reste longtemps après la projection.',
  },
  {
    id: 'd4',
    film: mockFilms[7]!,
    date: '2024-01-28',
    rating: 4,
    liked: false,
    rewatch: false,
  },
  {
    id: 'd5',
    film: mockFilms[1]!,
    date: '2024-01-20',
    rating: 4,
    liked: false,
    rewatch: true,
    review: 'Mieux à la seconde vision, les détails du worldbuilding.',
  },
  {
    id: 'd6',
    film: mockFilms[12]!,
    date: '2024-01-05',
    rating: 3.5,
    liked: false,
    rewatch: false,
  },
]

export const mockActivities: Activity[] = [
  {
    id: 'a1',
    type: 'watched',
    user: 'cinephile_42',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50&h=50&fit=crop',
    film: mockFilms[1]!,
    rating: 4.5,
    date: '2024-02-20',
  },
  {
    id: 'a2',
    type: 'liked',
    user: 'film_lover',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop',
    film: mockFilms[4]!,
    date: '2024-02-19',
  },
  {
    id: 'a3',
    type: 'reviewed',
    user: 'moviebuff_99',
    avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=50&h=50&fit=crop',
    film: mockFilms[9]!,
    rating: 4,
    review: 'Un film qui dérange et interroge. Hautement recommandé.',
    date: '2024-02-18',
  },
  {
    id: 'a4',
    type: 'watched',
    user: 'arthouse_fan',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&h=50&fit=crop',
    film: mockFilms[2]!,
    rating: 5,
    date: '2024-02-17',
  },
  {
    id: 'a5',
    type: 'listed',
    user: 'cinephile_42',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50&h=50&fit=crop',
    film: mockFilms[5]!,
    date: '2024-02-16',
  },
]

// Add activity to profile
mockUsers[0]!.recentActivity = mockActivities.slice(0, 3)
mockUsers[0]!.lists = mockLists.filter(l => l.creator === 'currentuser')
