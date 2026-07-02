export type KnockoutStage = 'r32' | 'r16' | 'qf' | 'sf' | 'third' | 'final'
export type KnockoutStatus = 'scheduled' | 'live' | 'final' | 'pending'
export type SlotName = 'home' | 'away'

export interface KnockoutTeam {
  id: string
  name: string
}

export interface KnockoutMatch {
  id: string
  stage: KnockoutStage
  label: string
  homeTeam: KnockoutTeam | null
  awayTeam: KnockoutTeam | null
  homeScore: number | null
  awayScore: number | null
  penalties: [number, number] | null
  status: KnockoutStatus
  winnerTeam: KnockoutTeam | null
  loserTeam: KnockoutTeam | null
  kickoff: string | null
  nextMatchId?: string
  nextSlot?: SlotName
  loserNextMatchId?: string
  loserNextSlot?: SlotName
  city?: string
  homeFromMatchId?: string
  awayFromMatchId?: string
  homeFromLoserMatchId?: string
  awayFromLoserMatchId?: string
  updatedAt?: number
}

interface SourceScore {
  ft?: [number, number]
  current?: [number, number]
  live?: [number, number]
  p?: [number, number]
  penalties?: [number, number]
}

interface SourceMatch {
  round?: string
  num?: number
  date?: string
  time?: string
  team1?: string
  team2?: string
  score?: SourceScore
  status?: string
  ground?: string
}

interface SourceData {
  matches?: SourceMatch[]
}

const REMOTE_DATA_URL = 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json'
const LOCAL_STORAGE_KEY = 'partidos-2026-knockout'
const LOCAL_STORAGE_VERSION = 'knockout-v2'

const teamAliases: Record<string, string[]> = {
  Mexico: ['Mexico', 'México'],
  SouthAfrica: ['South Africa', 'Sudáfrica'],
  SouthKorea: ['South Korea', 'Korea Republic', 'Corea del Sur'],
  Czechia: ['Czechia', 'Czech Republic', 'Chequia'],
  Canada: ['Canada', 'Canadá'],
  Bosnia: ['Bosnia', 'Bosnia & Herzegovina', 'Bosnia and Herzegovina', 'Bosnia y Herzegovina'],
  Qatar: ['Qatar'],
  Switzerland: ['Switzerland', 'Suiza'],
  Brazil: ['Brazil', 'Brasil'],
  Morocco: ['Morocco', 'Marruecos'],
  Haiti: ['Haiti', 'Haití'],
  Scotland: ['Scotland', 'Escocia'],
  USA: ['USA', 'United States', 'United States of America', 'Estados Unidos'],
  Paraguay: ['Paraguay'],
  Australia: ['Australia'],
  Turkey: ['Turkey', 'Türkiye', 'Turquía'],
  Germany: ['Germany', 'Alemania'],
  Curacao: ['Curacao', 'Curaçao', 'Curazao'],
  IvoryCoast: ['Ivory Coast', 'Côte d’Ivoire', 'Cote d Ivoire', 'Costa de Marfil'],
  Ecuador: ['Ecuador'],
  Netherlands: ['Netherlands', 'Holland', 'Países Bajos'],
  Japan: ['Japan', 'Japón'],
  Sweden: ['Sweden', 'Suecia'],
  Tunisia: ['Tunisia', 'Túnez'],
  Belgium: ['Belgium', 'Bélgica'],
  Egypt: ['Egypt', 'Egipto'],
  Iran: ['Iran', 'Irán'],
  NewZealand: ['New Zealand', 'Nueva Zelanda'],
  Spain: ['Spain', 'España'],
  CapeVerde: ['Cape Verde', 'Cabo Verde'],
  SaudiArabia: ['Saudi Arabia', 'Arabia Saudita'],
  Uruguay: ['Uruguay'],
  France: ['France', 'Francia'],
  Senegal: ['Senegal', 'Sénégal'],
  Iraq: ['Iraq', 'Irak'],
  Norway: ['Norway', 'Noruega'],
  Argentina: ['Argentina'],
  Algeria: ['Algeria', 'Argelia'],
  Austria: ['Austria'],
  Jordan: ['Jordan', 'Jordania'],
  Portugal: ['Portugal'],
  DRCCongo: ['DR Congo', 'DRC Congo', 'RD Congo', 'Congo DR'],
  Uzbekistan: ['Uzbekistan', 'Uzbekistán'],
  Colombia: ['Colombia'],
  England: ['England', 'Inglaterra'],
  Croatia: ['Croatia', 'Croacia'],
  Ghana: ['Ghana'],
  Panama: ['Panama', 'Panamá'],
}

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')
const aliasToTeam = new Map(Object.entries(teamAliases).flatMap(([id, aliases]) => [id, ...aliases].map(alias => [normalize(alias), id] as const)))

export const knockoutMatches: KnockoutMatch[] = [
  { id: 'match-73', stage: 'r32', label: 'Partido 73', homeTeam: null, awayTeam: null, homeScore: null, awayScore: null, penalties: null, status: 'scheduled', winnerTeam: null, loserTeam: null, kickoff: '2026-06-28T12:00:00-07:00', nextMatchId: 'match-90', nextSlot: 'home' },
  { id: 'match-74', stage: 'r32', label: 'Partido 74', homeTeam: null, awayTeam: null, homeScore: null, awayScore: null, penalties: null, status: 'scheduled', winnerTeam: null, loserTeam: null, kickoff: '2026-06-29T16:30:00-04:00', nextMatchId: 'match-89', nextSlot: 'home' },
  { id: 'match-75', stage: 'r32', label: 'Partido 75', homeTeam: null, awayTeam: null, homeScore: null, awayScore: null, penalties: null, status: 'scheduled', winnerTeam: null, loserTeam: null, kickoff: '2026-06-29T19:00:00-06:00', nextMatchId: 'match-90', nextSlot: 'away' },
  { id: 'match-76', stage: 'r32', label: 'Partido 76', homeTeam: null, awayTeam: null, homeScore: null, awayScore: null, penalties: null, status: 'scheduled', winnerTeam: null, loserTeam: null, kickoff: '2026-06-29T12:00:00-05:00', nextMatchId: 'match-91', nextSlot: 'home' },
  { id: 'match-77', stage: 'r32', label: 'Partido 77', homeTeam: null, awayTeam: null, homeScore: null, awayScore: null, penalties: null, status: 'scheduled', winnerTeam: null, loserTeam: null, kickoff: '2026-06-30T17:00:00-04:00', nextMatchId: 'match-89', nextSlot: 'away' },
  { id: 'match-78', stage: 'r32', label: 'Partido 78', homeTeam: null, awayTeam: null, homeScore: null, awayScore: null, penalties: null, status: 'scheduled', winnerTeam: null, loserTeam: null, kickoff: '2026-06-30T12:00:00-05:00', nextMatchId: 'match-91', nextSlot: 'away' },
  { id: 'match-79', stage: 'r32', label: 'Partido 79', homeTeam: null, awayTeam: null, homeScore: null, awayScore: null, penalties: null, status: 'scheduled', winnerTeam: null, loserTeam: null, kickoff: '2026-06-30T19:00:00-06:00', nextMatchId: 'match-92', nextSlot: 'home' },
  { id: 'match-80', stage: 'r32', label: 'Partido 80', homeTeam: null, awayTeam: null, homeScore: null, awayScore: null, penalties: null, status: 'scheduled', winnerTeam: null, loserTeam: null, kickoff: '2026-07-01T12:00:00-04:00', nextMatchId: 'match-92', nextSlot: 'away' },
  { id: 'match-81', stage: 'r32', label: 'Partido 81', homeTeam: null, awayTeam: null, homeScore: null, awayScore: null, penalties: null, status: 'scheduled', winnerTeam: null, loserTeam: null, kickoff: '2026-07-01T17:00:00-07:00', nextMatchId: 'match-94', nextSlot: 'home' },
  { id: 'match-82', stage: 'r32', label: 'Partido 82', homeTeam: null, awayTeam: null, homeScore: null, awayScore: null, penalties: null, status: 'scheduled', winnerTeam: null, loserTeam: null, kickoff: '2026-07-01T13:00:00-07:00', nextMatchId: 'match-94', nextSlot: 'away' },
  { id: 'match-83', stage: 'r32', label: 'Partido 83', homeTeam: null, awayTeam: null, homeScore: null, awayScore: null, penalties: null, status: 'scheduled', winnerTeam: null, loserTeam: null, kickoff: '2026-07-02T19:00:00-04:00', nextMatchId: 'match-93', nextSlot: 'home' },
  { id: 'match-84', stage: 'r32', label: 'Partido 84', homeTeam: null, awayTeam: null, homeScore: null, awayScore: null, penalties: null, status: 'scheduled', winnerTeam: null, loserTeam: null, kickoff: '2026-07-02T12:00:00-07:00', nextMatchId: 'match-93', nextSlot: 'away' },
  { id: 'match-85', stage: 'r32', label: 'Partido 85', homeTeam: null, awayTeam: null, homeScore: null, awayScore: null, penalties: null, status: 'scheduled', winnerTeam: null, loserTeam: null, kickoff: '2026-07-02T20:00:00-07:00', nextMatchId: 'match-96', nextSlot: 'home' },
  { id: 'match-86', stage: 'r32', label: 'Partido 86', homeTeam: null, awayTeam: null, homeScore: null, awayScore: null, penalties: null, status: 'scheduled', winnerTeam: null, loserTeam: null, kickoff: '2026-07-03T18:00:00-04:00', nextMatchId: 'match-95', nextSlot: 'home' },
  { id: 'match-87', stage: 'r32', label: 'Partido 87', homeTeam: null, awayTeam: null, homeScore: null, awayScore: null, penalties: null, status: 'scheduled', winnerTeam: null, loserTeam: null, kickoff: '2026-07-03T20:30:00-05:00', nextMatchId: 'match-96', nextSlot: 'away' },
  { id: 'match-88', stage: 'r32', label: 'Partido 88', homeTeam: null, awayTeam: null, homeScore: null, awayScore: null, penalties: null, status: 'scheduled', winnerTeam: null, loserTeam: null, kickoff: '2026-07-03T13:00:00-05:00', nextMatchId: 'match-95', nextSlot: 'away' },
  { id: 'match-89', stage: 'r16', label: 'Partido 89', homeTeam: null, awayTeam: null, homeScore: null, awayScore: null, penalties: null, status: 'pending', winnerTeam: null, loserTeam: null, kickoff: '2026-07-04T17:00:00-04:00', nextMatchId: 'match-97', nextSlot: 'home', homeFromMatchId: 'match-74', awayFromMatchId: 'match-77' },
  { id: 'match-90', stage: 'r16', label: 'Partido 90', homeTeam: null, awayTeam: null, homeScore: null, awayScore: null, penalties: null, status: 'pending', winnerTeam: null, loserTeam: null, kickoff: '2026-07-04T12:00:00-05:00', nextMatchId: 'match-97', nextSlot: 'away', homeFromMatchId: 'match-73', awayFromMatchId: 'match-75' },
  { id: 'match-91', stage: 'r16', label: 'Partido 91', homeTeam: null, awayTeam: null, homeScore: null, awayScore: null, penalties: null, status: 'pending', winnerTeam: null, loserTeam: null, kickoff: '2026-07-05T16:00:00-04:00', nextMatchId: 'match-99', nextSlot: 'home', homeFromMatchId: 'match-76', awayFromMatchId: 'match-78' },
  { id: 'match-92', stage: 'r16', label: 'Partido 92', homeTeam: null, awayTeam: null, homeScore: null, awayScore: null, penalties: null, status: 'pending', winnerTeam: null, loserTeam: null, kickoff: '2026-07-05T18:00:00-06:00', nextMatchId: 'match-99', nextSlot: 'away', homeFromMatchId: 'match-79', awayFromMatchId: 'match-80' },
  { id: 'match-93', stage: 'r16', label: 'Partido 93', homeTeam: null, awayTeam: null, homeScore: null, awayScore: null, penalties: null, status: 'pending', winnerTeam: null, loserTeam: null, kickoff: '2026-07-06T14:00:00-05:00', nextMatchId: 'match-98', nextSlot: 'home', homeFromMatchId: 'match-83', awayFromMatchId: 'match-84' },
  { id: 'match-94', stage: 'r16', label: 'Partido 94', homeTeam: null, awayTeam: null, homeScore: null, awayScore: null, penalties: null, status: 'pending', winnerTeam: null, loserTeam: null, kickoff: '2026-07-06T17:00:00-07:00', nextMatchId: 'match-98', nextSlot: 'away', homeFromMatchId: 'match-81', awayFromMatchId: 'match-82' },
  { id: 'match-95', stage: 'r16', label: 'Partido 95', homeTeam: null, awayTeam: null, homeScore: null, awayScore: null, penalties: null, status: 'pending', winnerTeam: null, loserTeam: null, kickoff: '2026-07-07T12:00:00-04:00', nextMatchId: 'match-100', nextSlot: 'home', homeFromMatchId: 'match-86', awayFromMatchId: 'match-88' },
  { id: 'match-96', stage: 'r16', label: 'Partido 96', homeTeam: null, awayTeam: null, homeScore: null, awayScore: null, penalties: null, status: 'pending', winnerTeam: null, loserTeam: null, kickoff: '2026-07-07T13:00:00-07:00', nextMatchId: 'match-100', nextSlot: 'away', homeFromMatchId: 'match-85', awayFromMatchId: 'match-87' },
  { id: 'match-97', stage: 'qf', label: 'Partido 97', homeTeam: null, awayTeam: null, homeScore: null, awayScore: null, penalties: null, status: 'pending', winnerTeam: null, loserTeam: null, kickoff: '2026-07-09T16:00:00-04:00', nextMatchId: 'match-101', nextSlot: 'home', homeFromMatchId: 'match-89', awayFromMatchId: 'match-90' },
  { id: 'match-98', stage: 'qf', label: 'Partido 98', homeTeam: null, awayTeam: null, homeScore: null, awayScore: null, penalties: null, status: 'pending', winnerTeam: null, loserTeam: null, kickoff: '2026-07-10T12:00:00-07:00', nextMatchId: 'match-101', nextSlot: 'away', homeFromMatchId: 'match-93', awayFromMatchId: 'match-94' },
  { id: 'match-99', stage: 'qf', label: 'Partido 99', homeTeam: null, awayTeam: null, homeScore: null, awayScore: null, penalties: null, status: 'pending', winnerTeam: null, loserTeam: null, kickoff: '2026-07-11T17:00:00-04:00', nextMatchId: 'match-102', nextSlot: 'home', homeFromMatchId: 'match-91', awayFromMatchId: 'match-92' },
  { id: 'match-100', stage: 'qf', label: 'Partido 100', homeTeam: null, awayTeam: null, homeScore: null, awayScore: null, penalties: null, status: 'pending', winnerTeam: null, loserTeam: null, kickoff: '2026-07-11T20:00:00-05:00', nextMatchId: 'match-102', nextSlot: 'away', homeFromMatchId: 'match-95', awayFromMatchId: 'match-96' },
  { id: 'match-101', stage: 'sf', label: 'Partido 101', homeTeam: null, awayTeam: null, homeScore: null, awayScore: null, penalties: null, status: 'pending', winnerTeam: null, loserTeam: null, kickoff: '2026-07-14T14:00:00-05:00', nextMatchId: 'match-104', nextSlot: 'home', loserNextMatchId: 'match-103', loserNextSlot: 'home', homeFromMatchId: 'match-97', awayFromMatchId: 'match-98' },
  { id: 'match-102', stage: 'sf', label: 'Partido 102', homeTeam: null, awayTeam: null, homeScore: null, awayScore: null, penalties: null, status: 'pending', winnerTeam: null, loserTeam: null, kickoff: '2026-07-15T15:00:00-04:00', nextMatchId: 'match-104', nextSlot: 'away', loserNextMatchId: 'match-103', loserNextSlot: 'away', homeFromMatchId: 'match-99', awayFromMatchId: 'match-100' },
  { id: 'match-103', stage: 'third', label: 'Partido 103', homeTeam: null, awayTeam: null, homeScore: null, awayScore: null, penalties: null, status: 'pending', winnerTeam: null, loserTeam: null, kickoff: '2026-07-18T17:00:00-04:00', homeFromLoserMatchId: 'match-101', awayFromLoserMatchId: 'match-102' },
  { id: 'match-104', stage: 'final', label: 'Partido 104', homeTeam: null, awayTeam: null, homeScore: null, awayScore: null, penalties: null, status: 'pending', winnerTeam: null, loserTeam: null, kickoff: '2026-07-19T15:00:00-04:00', homeFromMatchId: 'match-101', awayFromMatchId: 'match-102' },
]

function sourceId(num: number | undefined) {
  return Number.isFinite(num) ? `match-${num}` : ''
}

function stageFromRound(round = ''): KnockoutStage | null {
  const value = normalize(round)
  if (value.includes('roundof32')) return 'r32'
  if (value.includes('roundof16')) return 'r16'
  if (value.includes('quarter')) return 'qf'
  if (value.includes('semi')) return 'sf'
  if (value.includes('third') || value.includes('matchforthirdplace')) return 'third'
  if (value.includes('final')) return 'final'
  return null
}

function normalizeStatus(match: SourceMatch): KnockoutStatus {
  const value = normalize(match.status ?? '')
  if (/^(final|ft|fulltime|complete|completed|finished)$/.test(value) || match.score?.ft) return 'final'
  if (/^(live|inplay|playing|halftime|ht|1sthalf|2ndhalf)$/.test(value) || match.score?.current || match.score?.live) return 'live'
  return 'scheduled'
}

function scoreTuple(value: [number, number] | undefined): [number, number] | null {
  return value && value.length === 2 && value.every(Number.isFinite) ? value : null
}

function teamFromSource(value: string | undefined): KnockoutTeam | null {
  if (!value) return null
  const id = aliasToTeam.get(normalize(value))
  return id ? { id, name: value } : null
}

function dependencyFromSource(value: string | undefined) {
  const match = value?.match(/^([WL])(\d+)$/i)
  return match ? { kind: match[1].toUpperCase() === 'W' ? 'winner' : 'loser', matchId: `match-${match[2]}` } : null
}

function parseKickoff(match: SourceMatch) {
  if (!match.date) return null
  const offset = match.time?.match(/UTC([+-]\d{1,2})/)?.[1]
  const time = match.time?.match(/^(\d{1,2}:\d{2})/)?.[1] ?? '00:00'
  const normalizedOffset = offset ? `${offset[0]}${offset.slice(1).padStart(2, '0')}:00` : 'Z'
  return `${match.date}T${time}:00${normalizedOffset}`
}

export async function fetchWorldCupData(): Promise<SourceData> {
  const base = import.meta.env.BASE_URL
  const stamp = Date.now()
  const fetchJson = async (url: string) => {
    const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}v=${stamp}`, { cache: 'no-store' })
    if (!response.ok) throw new Error(`World Cup data request failed: ${response.status}`)
    return response.json() as Promise<SourceData>
  }
  const local = await fetchJson(`${base}data/worldcup.json`).catch(() => null)
  const remote = await fetchJson(REMOTE_DATA_URL).catch(() => null)
  return remote?.matches?.length ? remote : local ?? { matches: [] }
}

export function getWinner(match: KnockoutMatch) {
  if (match.status !== 'final' || !match.homeTeam || !match.awayTeam || match.homeScore === null || match.awayScore === null) return null
  if (match.homeScore > match.awayScore) return match.homeTeam
  if (match.awayScore > match.homeScore) return match.awayTeam
  if (!match.penalties) return null
  if (match.penalties[0] > match.penalties[1]) return match.homeTeam
  if (match.penalties[1] > match.penalties[0]) return match.awayTeam
  return null
}

function getLoser(match: KnockoutMatch) {
  const winner = getWinner(match)
  if (!winner || !match.homeTeam || !match.awayTeam) return null
  return winner.id === match.homeTeam.id ? match.awayTeam : match.homeTeam
}

function placeTeam(target: KnockoutMatch | undefined, slot: SlotName | undefined, team: KnockoutTeam | null) {
  if (!target || !slot || !team) return
  if (slot === 'home' && !target.homeTeam) target.homeTeam = team
  if (slot === 'away' && !target.awayTeam) target.awayTeam = team
}

export function advanceWinner(match: KnockoutMatch, allMatches: KnockoutMatch[]) {
  if (match.status !== 'final') return
  const winner = getWinner(match)
  if (!winner) return
  match.winnerTeam = winner
  match.loserTeam = getLoser(match)
  placeTeam(allMatches.find(item => item.id === match.nextMatchId), match.nextSlot, winner)
  if (match.loserTeam) placeTeam(allMatches.find(item => item.id === match.loserNextMatchId), match.loserNextSlot, match.loserTeam)
}

export function normalizeKnockoutData(rawData: SourceData): KnockoutMatch[] {
  const map = new Map(knockoutMatches.map(match => [match.id, { ...match }]))
  for (const item of rawData.matches ?? []) {
    const stage = stageFromRound(item.round)
    const id = sourceId(item.num)
    const target = id ? map.get(id) : undefined
    if (!stage || !target) continue
    const score = scoreTuple(item.score?.ft ?? item.score?.current ?? item.score?.live)
    const penalties = scoreTuple(item.score?.penalties ?? item.score?.p)
    const homeDependency = dependencyFromSource(item.team1)
    const awayDependency = dependencyFromSource(item.team2)
    Object.assign(target, {
      stage,
      homeTeam: teamFromSource(item.team1) ?? target.homeTeam,
      awayTeam: teamFromSource(item.team2) ?? target.awayTeam,
      homeScore: score?.[0] ?? target.homeScore,
      awayScore: score?.[1] ?? target.awayScore,
      penalties: penalties ?? target.penalties,
      status: normalizeStatus(item),
      kickoff: parseKickoff(item) ?? target.kickoff,
      city: item.ground ?? target.city,
      homeFromMatchId: homeDependency?.kind === 'winner' ? homeDependency.matchId : target.homeFromMatchId,
      awayFromMatchId: awayDependency?.kind === 'winner' ? awayDependency.matchId : target.awayFromMatchId,
      homeFromLoserMatchId: homeDependency?.kind === 'loser' ? homeDependency.matchId : target.homeFromLoserMatchId,
      awayFromLoserMatchId: awayDependency?.kind === 'loser' ? awayDependency.matchId : target.awayFromLoserMatchId,
      updatedAt: Date.now(),
    })
  }
  return buildProgressiveBracket([...map.values()])
}

export function buildProgressiveBracket(matches: KnockoutMatch[]) {
  const ordered = [...matches].sort((a, b) => Number(a.id.replace('match-', '')) - Number(b.id.replace('match-', '')))
  for (const match of ordered) advanceWinner(match, ordered)
  return ordered.map(match => ({
    ...match,
    status: (match.homeTeam && match.awayTeam ? match.status === 'pending' ? 'scheduled' : match.status : 'pending') as KnockoutStatus,
  })) satisfies KnockoutMatch[]
}

export function updateAfterFinalWhistle(previous: KnockoutMatch[], next: KnockoutMatch[]) {
  const finals = next.filter(match => match.status === 'final' && previous.find(prev => prev.id === match.id)?.status !== 'final')
  return finals.length ? buildProgressiveBracket(next) : next
}

export function autoRefreshKnockout(matches: KnockoutMatch[]) {
  return matches.some(match => match.status === 'live') ? 45_000 : 300_000
}

export function readCachedKnockout() {
  try {
    const cached = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) ?? '') as { version: string; matches: KnockoutMatch[] }
    return cached.version === LOCAL_STORAGE_VERSION ? cached.matches : null
  } catch {
    return null
  }
}

export function writeCachedKnockout(matches: KnockoutMatch[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ version: LOCAL_STORAGE_VERSION, matches }))
  } catch {}
}
