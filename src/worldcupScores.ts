import type { Match } from './data'

const REMOTE_DATA_URL = 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json'
const CACHE_KEY = 'partidos-2026-openfootball-v2'
const CACHE_TTL = 60 * 60 * 1000
const REFRESH_INTERVAL = 5 * 60 * 1000

const openFootballNames: Record<string, string> = {
  Bosnia:'Bosnia & Herzegovina', CapeVerde:'Cape Verde', Czechia:'Czech Republic', Curacao:'Curaçao',
  DRCCongo:'DR Congo', IvoryCoast:'Ivory Coast', NewZealand:'New Zealand', SaudiArabia:'Saudi Arabia',
  SouthKorea:'South Korea', USA:'USA',
}

interface OpenFootballMatch {
  group?: string
  date?: string
  team1?: string
  team2?: string
  score?: { ft?: [number, number] }
}

interface OpenFootballData { matches?: OpenFootballMatch[] }
interface ScoreCache { savedAt:number; scores:Record<string,string> }

const scores: Record<string,string> = readCachedScores() ?? {}
const listeners = new Map<string,Set<()=>void>>()

function externalName(team:string) { return openFootballNames[team] ?? team }
function normalize(value:string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'') }
function matchKey(group:string,date:string,team1:string,team2:string) { return `${normalize(group)}|${date}|${normalize(team1)}|${normalize(team2)}` }

export function adaptOpenFootballScores(data:OpenFootballData,fixtures:Match[]) {
  const remoteScores = new Map<string,string>()
  for (const match of data.matches ?? []) {
    const finalScore = match.score?.ft
    if (!match.group || !match.date || !match.team1 || !match.team2 || !finalScore || finalScore.some(value=>!Number.isFinite(value))) continue
    remoteScores.set(matchKey(match.group,match.date,match.team1,match.team2),`${finalScore[0]}-${finalScore[1]}`)
  }
  return Object.fromEntries(fixtures.flatMap(fixture=>{
    const score = remoteScores.get(matchKey(`Group ${fixture.group}`,fixture.dateTime.slice(0,10),externalName(fixture.home),externalName(fixture.away)))
    return score ? [[fixture.id,score]] : []
  }))
}

export function readCachedScores() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) ?? '') as ScoreCache
    return Date.now()-cached.savedAt <= CACHE_TTL ? cached.scores : null
  } catch { return null }
}

export function getScoreSnapshot(matchId:string) { return scores[matchId] }

export function subscribeToScore(matchId:string,listener:()=>void) {
  const matchListeners = listeners.get(matchId) ?? new Set<()=>void>()
  matchListeners.add(listener)
  listeners.set(matchId,matchListeners)
  return ()=>{
    matchListeners.delete(listener)
    if (!matchListeners.size) listeners.delete(matchId)
  }
}

async function fetchJson(url:string) {
  const response = await fetch(url,{cache:'no-store'})
  if (!response.ok) throw new Error(`Score data request failed: ${response.status}`)
  return response.json() as Promise<OpenFootballData>
}

export async function refreshScores(fixtures:Match[]) {
  const localUrl = `${import.meta.env.BASE_URL}data/worldcup.json`
  let data: OpenFootballData
  try { data = await fetchJson(localUrl) }
  catch { data = await fetchJson(REMOTE_DATA_URL) }

  const freshScores = adaptOpenFootballScores(data,fixtures)
  const changed:string[] = []
  for (const [matchId,score] of Object.entries(freshScores)) {
    if (score && scores[matchId] !== score) { scores[matchId]=score; changed.push(matchId) }
  }
  try { localStorage.setItem(CACHE_KEY,JSON.stringify({savedAt:Date.now(),scores} satisfies ScoreCache)) } catch {}
  changed.forEach(matchId=>listeners.get(matchId)?.forEach(listener=>listener()))
  return changed
}

export function startScoreRefresh(fixtures:Match[]) {
  let active=true
  const refresh=()=>refreshScores(fixtures).catch(()=>{})
  void refresh()
  const timer=window.setInterval(()=>{if(active)void refresh()},REFRESH_INTERVAL)
  return ()=>{active=false;window.clearInterval(timer)}
}
