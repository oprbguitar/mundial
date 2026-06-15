import type { Match } from './data'

const REMOTE_DATA_URL = 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json'
const CACHE_KEY = 'partidos-2026-openfootball-v1'
const CACHE_TTL = 24 * 60 * 60 * 1000

const openFootballNames: Record<string, string> = {
  Czechia: 'Czech Republic',
  Curacao: 'Curaçao',
  DRCCongo: 'DR Congo',
  SouthKorea: 'South Korea',
  IvoryCoast: 'Ivory Coast',
}

interface OpenFootballMatch {
  group?: string
  date?: string
  team1?: string
  team2?: string
  score?: { ft?: [number, number] }
}

interface OpenFootballData {
  matches?: OpenFootballMatch[]
}

interface ScoreCache {
  savedAt: number
  scores: Record<string, string>
}

function externalName(team: string) {
  return openFootballNames[team] ?? team
}

function matchKey(group: string, date: string, team1: string, team2: string) {
  return `${group}|${date}|${team1}|${team2}`
}

export function adaptOpenFootballScores(data: OpenFootballData, fixtures: Match[]) {
  const remoteScores = new Map<string, string>()

  for (const match of data.matches ?? []) {
    const finalScore = match.score?.ft
    if (!match.group || !match.date || !match.team1 || !match.team2 || !finalScore) continue
    remoteScores.set(matchKey(match.group, match.date, match.team1, match.team2), `${finalScore[0]}-${finalScore[1]}`)
  }

  return Object.fromEntries(fixtures.flatMap((fixture) => {
    const key = matchKey(
      `Group ${fixture.group}`,
      fixture.dateTime.slice(0, 10),
      externalName(fixture.home),
      externalName(fixture.away),
    )
    const score = remoteScores.get(key)
    return score ? [[fixture.id, score]] : []
  }))
}

export function readCachedScores() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) ?? '') as ScoreCache
    return Date.now() - cached.savedAt < CACHE_TTL ? cached.scores : null
  } catch {
    return null
  }
}

async function fetchJson(url: string) {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) throw new Error(`Score data request failed: ${response.status}`)
  return response.json() as Promise<OpenFootballData>
}

export async function refreshScores(fixtures: Match[]) {
  const localUrl = `${import.meta.env.BASE_URL}data/worldcup.json`
  let data: OpenFootballData

  try {
    data = await fetchJson(localUrl)
  } catch {
    data = await fetchJson(REMOTE_DATA_URL)
  }

  const scores = adaptOpenFootballScores(data, fixtures)
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), scores } satisfies ScoreCache))
  } catch {
    // Storage can be unavailable in private browsing; fetched scores still remain usable.
  }
  return scores
}
