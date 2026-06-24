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

// Sources: ESPN, FIFA.com, FOX Sports, Yahoo Sports — updated through Matchday 2 (June 11–23, 2026)

export const topScorers: PlayerStatEntry[] = [
  { player: 'L. Messi',    team: 'Argentina', value: 5 },
  { player: 'D. Undav',    team: 'Germany',   value: 5 },
  { player: 'K. Mbappé',   team: 'France',    value: 4 },
  { player: 'E. Haaland',  team: 'Norway',    value: 4 },
  { player: 'J. David',    team: 'Canada',    value: 3 },
  { player: 'F. Balogun',  team: 'USA',       value: 2 },
  { player: 'A. Isak',     team: 'Sweden',    value: 2 },
]

export const topAssists: PlayerStatEntry[] = [
  { player: 'M. Olise',    team: 'France',      value: 3 },
  { player: 'A. Isak',     team: 'Sweden',      value: 3 },
  { player: 'J. Kimmich',  team: 'Germany',     value: 2 },
  { player: 'D. Dumfries', team: 'Netherlands', value: 2 },
  { player: 'B. Díaz',     team: 'Morocco',     value: 2 },
  { player: 'M. Salah',    team: 'Egypt',       value: 2 },
  { player: 'J. Enciso',   team: 'Paraguay',    value: 2 },
]

// Total saves across all matches played (Matchday 1 + 2)
// Room: 15 saves vs Germany (record) + saves vs Ecuador; Al-Owais: 9 saves vs Uruguay + saves vs Spain
export const topSaves: PlayerStatEntry[] = [
  { player: 'E. Room',      team: 'Curacao',     value: 22 },
  { player: 'M. Al-Owais', team: 'SaudiArabia', value: 18 },
  { player: 'Vozinha',      team: 'CapeVerde',   value: 13 },
  { player: 'Y. Bounou',   team: 'Morocco',     value: 10 },
  { player: 'U. Simón',    team: 'Spain',       value: 8  },
  { player: 'G. Ochoa',    team: 'Mexico',      value: 6  },
  { player: 'E. Martínez', team: 'Argentina',   value: 4  },
]

// Clean sheets by goalkeeper through Matchday 2
export const cleanSheetsByGK: PlayerStatEntry[] = [
  { player: 'G. Ochoa',    team: 'Mexico',    value: 2 },
  { player: 'E. Martínez', team: 'Argentina', value: 2 },
  { player: 'U. Simón',    team: 'Spain',     value: 2 },
  { player: 'M. Maignan',  team: 'France',    value: 1 },
  { player: 'Alisson',     team: 'Brazil',    value: 1 },
  { player: 'M. Turner',   team: 'USA',       value: 1 },
  { player: 'S. Gonda',    team: 'Japan',     value: 1 },
]

// Shots on target — Messi (8) and Haaland (7) confirmed; others estimated from goals and game data
export const topShots: PlayerStatEntry[] = [
  { player: 'L. Messi',   team: 'Argentina', value: 8, extra: [5, '62.5%'] },
  { player: 'E. Haaland', team: 'Norway',    value: 7, extra: [4, '57.1%'] },
  { player: 'D. Undav',   team: 'Germany',   value: 7, extra: [5, '71.4%'] },
  { player: 'K. Mbappé',  team: 'France',    value: 6, extra: [4, '66.7%'] },
  { player: 'J. David',   team: 'Canada',    value: 5, extra: [3, '60.0%'] },
  { player: 'A. Isak',    team: 'Sweden',    value: 4, extra: [2, '50.0%'] },
  { player: 'F. Balogun', team: 'USA',       value: 4, extra: [2, '50.0%'] },
]

// Scoring efficiency — sorted by % descending
export const topEfficiency: PlayerStatEntry[] = [
  { player: 'D. Undav',   team: 'Germany',   value: 5, extra: [7,  '71.4%'] },
  { player: 'K. Mbappé',  team: 'France',    value: 4, extra: [6,  '66.7%'] },
  { player: 'L. Messi',   team: 'Argentina', value: 5, extra: [8,  '62.5%'] },
  { player: 'J. David',   team: 'Canada',    value: 3, extra: [5,  '60.0%'] },
  { player: 'E. Haaland', team: 'Norway',    value: 4, extra: [7,  '57.1%'] },
  { player: 'A. Isak',    team: 'Sweden',    value: 2, extra: [4,  '50.0%'] },
  { player: 'F. Balogun', team: 'USA',       value: 2, extra: [4,  '50.0%'] },
]

// Yellow and red cards by country through Matchday 2 (approximated from available sources)
export const disciplineByTeam: DisciplineEntry[] = [
  { team: 'Qatar',       yellow: 7, red: 2 },
  { team: 'Morocco',     yellow: 6, red: 1 },
  { team: 'Belgium',     yellow: 6, red: 1 },
  { team: 'USA',         yellow: 5, red: 0 },
  { team: 'Paraguay',    yellow: 5, red: 1 },
  { team: 'Iran',        yellow: 4, red: 0 },
  { team: 'Mexico',      yellow: 4, red: 0 },
]
