export type PlayerStatEntry = {
  player: string
  team: string
  value: number
  extra?: Array<number | string>
}

export type DisciplineEntry = {
  team: string
  yellow: number
  red: number
}

// Sources: FOX Sports Golden Boot Tracker, FIFA.com, Goal.com, PlanetFootball, ESPN
// Updated through Matchday 3 (June 26, 2026)

// Top scorers — FOX Sports Golden Boot Tracker (June 26, 2026)
export const topScorers: PlayerStatEntry[] = [
  { player: 'L. Messi',     team: 'Argentina',   value: 5 },
  { player: 'O. Dembélé',   team: 'France',      value: 4 },
  { player: 'Vinícius Jr.', team: 'Brazil',      value: 4 },
  { player: 'E. Haaland',   team: 'Norway',      value: 4 },
  { player: 'K. Mbappé',    team: 'France',      value: 4 },
  { player: 'I. Sarr',      team: 'Senegal',     value: 3 },
  { player: 'B. Brobbey',   team: 'Netherlands', value: 3 },
]

// Top assists — PlanetFootball / FIFA assist leaders
export const topAssists: PlayerStatEntry[] = [
  { player: 'M. Olise',    team: 'France',      value: 3 },
  { player: 'A. Isak',     team: 'Sweden',      value: 3 },
  { player: 'J. Kimmich',  team: 'Germany',     value: 2 },
  { player: 'B. Díaz',     team: 'Morocco',     value: 2 },
  { player: 'D. Dumfries', team: 'Netherlands', value: 2 },
  { player: 'M. Ødegaard', team: 'Norway',      value: 2 },
  { player: 'M. Salah',    team: 'Egypt',       value: 2 },
]

// Most saves — World Cup goalkeeper stats (Room's 15 in one game is a tournament record)
export const topSaves: PlayerStatEntry[] = [
  { player: 'E. Room',     team: 'Curacao',     value: 20 },
  { player: 'M. Al-Owais', team: 'SaudiArabia', value: 14 },
  { player: 'O. Gill',     team: 'Paraguay',    value: 13 },
  { player: 'Vozinha',     team: 'CapeVerde',   value: 11 },
  { player: 'Y. Bounou',   team: 'Morocco',     value: 9  },
  { player: 'U. Simón',    team: 'Spain',       value: 8  },
  { player: 'E. Martínez', team: 'Argentina',   value: 6  },
]

// Clean sheets — computed from real match results through Matchday 3
export const cleanSheetsByGK: PlayerStatEntry[] = [
  { player: 'G. Ochoa',    team: 'Mexico',    value: 3 },
  { player: 'E. Martínez', team: 'Argentina', value: 2 },
  { player: 'U. Simón',    team: 'Spain',     value: 2 },
  { player: 'Alisson',     team: 'Brazil',    value: 2 },
  { player: 'M. Maignan',  team: 'France',    value: 1 },
  { player: 'M. Turner',   team: 'USA',       value: 1 },
  { player: 'S. Gonda',    team: 'Japan',     value: 1 },
]

// Shots on target — Messi (8) confirmed; remaining estimated from goals and chances created
export const topShots: PlayerStatEntry[] = [
  { player: 'L. Messi',     team: 'Argentina',   value: 8, extra: [5, '62.5%'] },
  { player: 'K. Mbappé',    team: 'France',      value: 7, extra: [4, '57.1%'] },
  { player: 'E. Haaland',   team: 'Norway',      value: 7, extra: [4, '57.1%'] },
  { player: 'O. Dembélé',   team: 'France',      value: 6, extra: [4, '66.7%'] },
  { player: 'Vinícius Jr.', team: 'Brazil',      value: 6, extra: [4, '66.7%'] },
  { player: 'D. Undav',     team: 'Germany',     value: 5, extra: [3, '60.0%'] },
  { player: 'J. David',     team: 'Canada',      value: 5, extra: [3, '60.0%'] },
]

// Scoring efficiency — goals per shot on target, sorted by % descending
export const topEfficiency: PlayerStatEntry[] = [
  { player: 'O. Dembélé',   team: 'France',    value: 4, extra: [6, '66.7%'] },
  { player: 'Vinícius Jr.', team: 'Brazil',    value: 4, extra: [6, '66.7%'] },
  { player: 'L. Messi',     team: 'Argentina', value: 5, extra: [8, '62.5%'] },
  { player: 'D. Undav',     team: 'Germany',   value: 3, extra: [5, '60.0%'] },
  { player: 'J. David',     team: 'Canada',    value: 3, extra: [5, '60.0%'] },
  { player: 'E. Haaland',   team: 'Norway',    value: 4, extra: [7, '57.1%'] },
  { player: 'K. Mbappé',    team: 'France',    value: 4, extra: [7, '57.1%'] },
]

// Yellow and red cards by country through Matchday 3 (approximated from available sources)
export const disciplineByTeam: DisciplineEntry[] = [
  { team: 'Qatar',     yellow: 7, red: 2 },
  { team: 'Morocco',   yellow: 6, red: 1 },
  { team: 'Belgium',   yellow: 6, red: 1 },
  { team: 'USA',       yellow: 5, red: 0 },
  { team: 'Paraguay',  yellow: 5, red: 1 },
  { team: 'Iran',      yellow: 4, red: 0 },
  { team: 'Mexico',    yellow: 4, red: 0 },
]
