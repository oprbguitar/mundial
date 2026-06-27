import type { Match, Status } from './data'

const REMOTE_DATA_URL = 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json'
const CACHE_KEY = 'partidos-2026-scores'
const CACHE_VERSION = 'scores-v5'
const CACHE_TTL = 60 * 60 * 1000
const REFRESH_INTERVAL = 5 * 60 * 1000
const FETCH_TIMEOUT = 5 * 1000

const teamAliases: Record<string,string[]> = {
  mexico:['Mexico','México','MEX'],southafrica:['South Africa','Sudáfrica','RSA'],southkorea:['South Korea','Corea del Sur','Korea Republic','KOR'],czechia:['Czechia','Chequia','Czech Republic','CZE'],
  canada:['Canada','Canadá','CAN'],bosnia:['Bosnia','Bosnia & Herzegovina','Bosnia and Herzegovina','Bosnia y Herzegovina','BIH'],qatar:['Qatar','QAT'],switzerland:['Switzerland','Suiza','SUI'],
  brazil:['Brazil','Brasil','BRA'],morocco:['Morocco','Marruecos','MAR'],haiti:['Haiti','Haití','HAI'],scotland:['Scotland','Escocia','SCO'],
  usa:['USA','United States','United States of America','Estados Unidos','EE.UU.','USA'],paraguay:['Paraguay','PAR'],australia:['Australia','AUS'],turkey:['Turkey','Türkiye','Turquía','TUR'],
  germany:['Germany','Alemania','GER'],curacao:['Curacao','Curaçao','Curazao','CUW'],ivorycoast:['Ivory Coast','Côte d’Ivoire','Cote d Ivoire','Costa de Marfil','CIV'],ecuador:['Ecuador','ECU'],
  netherlands:['Netherlands','Países Bajos','Holland','NED'],japan:['Japan','Japón','JPN'],sweden:['Sweden','Suecia','SWE'],tunisia:['Tunisia','Túnez','Tunisie','TUN'],
  belgium:['Belgium','Bélgica','BEL'],egypt:['Egypt','Egipto','EGY'],iran:['Iran','Irán','IRN'],newzealand:['New Zealand','Nueva Zelanda','NZL'],
  spain:['Spain','España','ESP'],cape_verde:['Cape Verde','Cabo Verde','CPV'],saudiarabia:['Saudi Arabia','Arabia Saudita','KSA'],uruguay:['Uruguay','URU'],
  france:['France','Francia','FRA'],senegal:['Senegal','Sénégal','SEN'],iraq:['Iraq','Irak','IRQ'],norway:['Norway','Noruega','NOR'],
  argentina:['Argentina','ARG'],algeria:['Algeria','Argelia','ALG'],austria:['Austria','AUT'],jordan:['Jordan','Jordania','JOR'],
  portugal:['Portugal','POR'],drccongo:['DR Congo','DRC Congo','RD Congo','Congo DR','COD'],uzbekistan:['Uzbekistan','Uzbekistán','UZB'],colombia:['Colombia','COL'],
  england:['England','Inglaterra','ENG'],croatia:['Croatia','Croacia','CRO'],ghana:['Ghana','GHA'],panama:['Panama','Panamá','PAN'],
}

const appTeamIds: Record<string,string> = {
  Mexico:'mexico',SouthAfrica:'southafrica',SouthKorea:'southkorea',Czechia:'czechia',Canada:'canada',Bosnia:'bosnia',Qatar:'qatar',Switzerland:'switzerland',Brazil:'brazil',Morocco:'morocco',Haiti:'haiti',Scotland:'scotland',USA:'usa',Paraguay:'paraguay',Australia:'australia',Turkey:'turkey',Germany:'germany',Curacao:'curacao',IvoryCoast:'ivorycoast',Ecuador:'ecuador',Netherlands:'netherlands',Japan:'japan',Sweden:'sweden',Tunisia:'tunisia',Belgium:'belgium',Egypt:'egypt',Iran:'iran',NewZealand:'newzealand',Spain:'spain',CapeVerde:'cape_verde',SaudiArabia:'saudiarabia',Uruguay:'uruguay',France:'france',Senegal:'senegal',Iraq:'iraq',Norway:'norway',Argentina:'argentina',Algeria:'algeria',Austria:'austria',Jordan:'jordan',Portugal:'portugal',DRCCongo:'drccongo',Uzbekistan:'uzbekistan',Colombia:'colombia',England:'england',Croatia:'croatia',Ghana:'ghana',Panama:'panama',
}

function normalize(value:string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/[^a-z0-9]/g,'') }
const aliasToTeamId = new Map(Object.entries(teamAliases).flatMap(([teamId,aliases])=>[teamId,...aliases].map(alias=>[normalize(alias),teamId] as const)))
function resolveTeamId(value:string) { return appTeamIds[value] ?? aliasToTeamId.get(normalize(value)) }
function normalizeGroup(value:string) { return normalize(value).replace(/^group/,'') }

interface GoalEntry { name?: string; minute?: string|number; penalty?: boolean; owngoal?: boolean }
interface SourceMatch {
  group?: string
  date?: string
  team1?: string
  team2?: string
  status?: string
  score?: { ft?: [number,number]; current?: [number,number]; live?: [number,number] }
  goals1?: GoalEntry[]
  goals2?: GoalEntry[]
}
interface OpenFootballData { matches?:SourceMatch[] }
interface ScoreOverride { homeTeamId:string; awayTeamId:string; group:string; date?:string; score?:string|null; status?:string; source?:string }
interface ScoreUpdate { score?:string; status?:Status }
interface ScoreCache { version:string; savedAt:number; scores:Record<string,string>; statuses?:Record<string,Status> }

const cachedState = readCachedState()
const scores:Record<string,string> = cachedState?.scores ?? {}
const statuses:Record<string,Status> = cachedState?.statuses ?? {}
const listeners = new Map<string,Set<()=>void>>()

function fixtureKey(homeTeamId:string,awayTeamId:string,group:string,date:string) { return `${homeTeamId}|${awayTeamId}|${normalizeGroup(group)}|${date}` }

function normalizeStatus(status:string|undefined):Status|undefined {
  const value=normalize(status ?? '')
  if (/^(final|ft|fulltime|complete|completed|finished)$/.test(value)) return 'finished'
  if (/^(live|inplay|playing|halftime|ht|1sthalf|2ndhalf)$/.test(value)) return 'live'
  return undefined
}

function scoreTuple(value:[number,number]|undefined) {
  return value && value.length===2 && value.every(Number.isFinite) ? `${value[0]}-${value[1]}` : undefined
}

function indexSource(data:OpenFootballData) {
  const index=new Map<string,ScoreUpdate>()
  for (const match of data.matches ?? []) {
    if (!match.group || !match.date || !match.team1 || !match.team2) continue
    const homeTeamId=resolveTeamId(match.team1),awayTeamId=resolveTeamId(match.team2)
    if (!homeTeamId || !awayTeamId) continue
    const status=normalizeStatus(match.status)
    const finalScore=scoreTuple(match.score?.ft)
    const liveScore=scoreTuple(match.score?.current ?? match.score?.live)
    const score=status==='finished' ? finalScore : liveScore ?? finalScore
    const finalStatus=finalScore ? 'finished' : status
    if (score || finalStatus) index.set(fixtureKey(homeTeamId,awayTeamId,match.group,match.date),{score,status:finalStatus})
  }
  return index
}

function findUpdate(index:Map<string,ScoreUpdate>,fixture:Match) {
  const homeTeamId=resolveTeamId(fixture.home),awayTeamId=resolveTeamId(fixture.away),date=fixture.dateTime.slice(0,10)
  if (!homeTeamId || !awayTeamId) return undefined
  const direct=index.get(fixtureKey(homeTeamId,awayTeamId,fixture.group,date))
  if (direct) return direct
  const reversed=index.get(fixtureKey(awayTeamId,homeTeamId,fixture.group,date))
  if (!reversed?.score) return reversed
  const [away,home]=reversed.score.split('-')
  return {...reversed,score:`${home}-${away}`}
}

function isDueForScore(fixture:Match) {
  return Date.now() >= new Date(fixture.dateTime).getTime()
}

function adaptOverrides(overrides:ScoreOverride[],fixtures:Match[]) {
  const index=new Map<string,ScoreUpdate>()
  for (const item of overrides) {
    if (!item.homeTeamId || !item.awayTeamId || !item.group || !item.score) continue
    const date=item.date ?? fixtures.find(fixture=>resolveTeamId(fixture.home)===item.homeTeamId&&resolveTeamId(fixture.away)===item.awayTeamId&&normalizeGroup(fixture.group)===normalizeGroup(item.group))?.dateTime.slice(0,10)
    if (date) index.set(fixtureKey(item.homeTeamId,item.awayTeamId,item.group,date),{score:item.score,status:normalizeStatus(item.status)})
  }
  return index
}

export function adaptOpenFootballScores(data:OpenFootballData,fixtures:Match[]) {
  const index=indexSource(data)
  return Object.fromEntries(fixtures.flatMap(fixture=>{const update=findUpdate(index,fixture);return update?.score&&update.status==='finished'?[[fixture.id,update.score]]:[]}))
}

export function readCachedState() {
  try {
    const cached=JSON.parse(localStorage.getItem(CACHE_KEY) ?? '') as ScoreCache
    return cached.version===CACHE_VERSION && Date.now()-cached.savedAt<=CACHE_TTL ? {scores:cached.scores ?? {},statuses:cached.statuses ?? {}} : null
  } catch { return null }
}

export function readCachedScores() { return readCachedState()?.scores ?? null }
export function getScoreSnapshot(matchId:string) { return scores[matchId] }
export function getStatusSnapshot(matchId:string) { return statuses[matchId] }
export function getFinalScoreSnapshot(match:Match) {
  if ((statuses[match.id] ?? match.status)==='finished') return scores[match.id] ?? match.score
  return match.status==='finished' ? match.score : undefined
}
export function subscribeToScore(matchId:string,listener:()=>void) {
  const set=listeners.get(matchId) ?? new Set<()=>void>();set.add(listener);listeners.set(matchId,set)
  return ()=>{set.delete(listener);if(!set.size)listeners.delete(matchId)}
}

// ---- Live top scorers (computed from openfootball goals1/goals2 data) ----
export interface ScorerEntry { player:string; team:string; value:number }

const teamIdToAppKey = new Map(Object.entries(appTeamIds).map(([appKey,teamId])=>[teamId,appKey] as const))
let scorerTally:ScorerEntry[] = []
const scorerListeners = new Set<()=>void>()

function abbreviateName(name:string) {
  const clean=name.replace(/\s*\([^)]*\)\s*/g,' ').trim()
  const parts=clean.split(/\s+/)
  return parts.length<2 ? clean : `${parts[0][0]}. ${parts.slice(1).join(' ')}`
}

function indexGoals(data:OpenFootballData) {
  const index=new Map<string,{home:GoalEntry[];away:GoalEntry[]}>()
  for (const match of data.matches ?? []) {
    if (!match.group || !match.date || !match.team1 || !match.team2) continue
    const homeTeamId=resolveTeamId(match.team1),awayTeamId=resolveTeamId(match.team2)
    if (!homeTeamId || !awayTeamId) continue
    index.set(fixtureKey(homeTeamId,awayTeamId,match.group,match.date),{home:match.goals1 ?? [],away:match.goals2 ?? []})
  }
  return index
}

function findGoals(index:Map<string,{home:GoalEntry[];away:GoalEntry[]}>,fixture:Match) {
  const homeTeamId=resolveTeamId(fixture.home),awayTeamId=resolveTeamId(fixture.away),date=fixture.dateTime.slice(0,10)
  if (!homeTeamId || !awayTeamId) return undefined
  const direct=index.get(fixtureKey(homeTeamId,awayTeamId,fixture.group,date))
  if (direct) return direct
  const reversed=index.get(fixtureKey(awayTeamId,homeTeamId,fixture.group,date))
  return reversed ? {home:reversed.away,away:reversed.home} : undefined
}

function hasGoals(goals:{home:GoalEntry[];away:GoalEntry[]}|undefined) {
  return !!goals && (goals.home.length>0 || goals.away.length>0)
}

function rebuildScorers(fixtures:Match[],goalsIndexes:Map<string,{home:GoalEntry[];away:GoalEntry[]}>[]) {
  const tally=new Map<string,ScorerEntry>()
  for (const fixture of fixtures) {
    const goals=goalsIndexes.map(index=>findGoals(index,fixture)).find(hasGoals)
    if (!goals) continue
    const homeKey=teamIdToAppKey.get(resolveTeamId(fixture.home) ?? '') ?? fixture.home
    const awayKey=teamIdToAppKey.get(resolveTeamId(fixture.away) ?? '') ?? fixture.away
    for (const [list,teamKey] of [[goals.home,homeKey],[goals.away,awayKey]] as const) {
      for (const goal of list) {
        if (!goal?.name || goal.owngoal) continue
        const key=`${teamKey}|${goal.name}`
        const entry=tally.get(key) ?? {player:abbreviateName(goal.name),team:teamKey,value:0}
        entry.value++
        tally.set(key,entry)
      }
    }
  }
  const next=[...tally.values()].sort((a,b)=>b.value-a.value || a.player.localeCompare(b.player))
  const prevSig=scorerTally.map(s=>`${s.team}:${s.player}:${s.value}`).join('|')
  const nextSig=next.map(s=>`${s.team}:${s.player}:${s.value}`).join('|')
  scorerTally=next
  if (prevSig!==nextSig) scorerListeners.forEach(listener=>listener())
}

export function getLiveScorers(limit=7):ScorerEntry[]|null {
  return scorerTally.length ? scorerTally.slice(0,limit) : null
}

export function subscribeToScorers(listener:()=>void) {
  scorerListeners.add(listener)
  return ()=>{scorerListeners.delete(listener)}
}

async function fetchJson<T>(url:string) {
  const controller=new AbortController()
  const timeout=window.setTimeout(()=>controller.abort(),FETCH_TIMEOUT)
  try {
    const response=await fetch(url,{cache:'no-store',signal:controller.signal})
    if(!response.ok)throw new Error(`Score data request failed: ${response.status}`)
    return response.json() as Promise<T>
  } finally {
    window.clearTimeout(timeout)
  }
}

export async function refreshScores(fixtures:Match[]) {
  const base=import.meta.env.BASE_URL
  const overrides=await fetchJson<ScoreOverride[]>(`${base}data/score-overrides.json`).catch(()=>[])
  const localData=await fetchJson<OpenFootballData>(`${base}data/worldcup.json`).catch(()=>null)
  const localIndex=localData ? indexSource(localData) : new Map<string,ScoreUpdate>()
  const needsRemote=fixtures.some(fixture=>isDueForScore(fixture) && !findUpdate(localIndex,fixture)?.score)
  const remoteData=!localData || needsRemote ? await fetchJson<OpenFootballData>(REMOTE_DATA_URL).catch(()=>null) : null
  const sourceUnavailable=!localData&&!remoteData

  const sourceIndexes=[localIndex,remoteData ? indexSource(remoteData) : null].filter(Boolean) as Map<string,ScoreUpdate>[]
  const overrideIndex=adaptOverrides(overrides,fixtures),changed:string[]=[]
  for (const fixture of fixtures) {
    const update=findUpdate(overrideIndex,fixture) ?? sourceIndexes.map(index=>findUpdate(index,fixture)).find(item=>item?.score||item?.status)
    if (!update) continue
    let changedThis=false
    if (update.score && scores[fixture.id]!==update.score) { scores[fixture.id]=update.score;changedThis=true }
    if (update.status && statuses[fixture.id]!==update.status) { statuses[fixture.id]=update.status;changedThis=true }
    if (changedThis) changed.push(fixture.id)
  }
  try { localStorage.setItem(CACHE_KEY,JSON.stringify({version:CACHE_VERSION,savedAt:Date.now(),scores,statuses} satisfies ScoreCache)) } catch {}
  changed.forEach(matchId=>listeners.get(matchId)?.forEach(listener=>listener()))

  const goalsIndexes=[localData ? indexGoals(localData) : null,remoteData ? indexGoals(remoteData) : null].filter(Boolean) as Map<string,{home:GoalEntry[];away:GoalEntry[]}>[]
  if (goalsIndexes.length) rebuildScorers(fixtures,goalsIndexes)

  if (sourceUnavailable) throw new Error('Score source unavailable')
  return changed
}

export function startScoreRefresh(fixtures:Match[]) {
  let timer:number|undefined,disposed=false
  const refresh=()=>{if(!disposed && document.visibilityState==='visible')void refreshScores(fixtures).catch(()=>{})}
  const start=()=>{if(timer===undefined){refresh();timer=window.setInterval(refresh,REFRESH_INTERVAL)}}
  const stop=()=>{if(timer!==undefined){window.clearInterval(timer);timer=undefined}}
  const visibility=()=>document.visibilityState==='visible'?start():stop()
  document.addEventListener('visibilitychange',visibility)
  window.addEventListener('focus',refresh)
  window.addEventListener('pageshow',refresh)
  window.addEventListener('online',refresh)
  visibility()
  return ()=>{
    disposed=true;stop()
    document.removeEventListener('visibilitychange',visibility)
    window.removeEventListener('focus',refresh)
    window.removeEventListener('pageshow',refresh)
    window.removeEventListener('online',refresh)
  }
}
