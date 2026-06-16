import type { Match } from './data'

const REMOTE_DATA_URL = 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json'
const CACHE_KEY = 'partidos-2026-scores'
const CACHE_VERSION = 'scores-v4'
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

interface SourceMatch {
  group?: string
  date?: string
  team1?: string
  team2?: string
  status?: string
  score?: { ft?: [number,number] }
}
interface OpenFootballData { matches?:SourceMatch[] }
interface ScoreOverride { homeTeamId:string; awayTeamId:string; group:string; date?:string; score?:string|null; status?:string; source?:string }
interface ScoreUpdate { score?:string; status?:'finished' }
interface ScoreCache { version:string; savedAt:number; scores:Record<string,string> }

const scores:Record<string,string> = readCachedScores() ?? {}
const listeners = new Map<string,Set<()=>void>>()

function fixtureKey(homeTeamId:string,awayTeamId:string,group:string,date:string) { return `${homeTeamId}|${awayTeamId}|${normalizeGroup(group)}|${date}` }

function indexSource(data:OpenFootballData) {
  const index=new Map<string,ScoreUpdate>()
  for (const match of data.matches ?? []) {
    if (!match.group || !match.date || !match.team1 || !match.team2) continue
    const homeTeamId=resolveTeamId(match.team1),awayTeamId=resolveTeamId(match.team2)
    if (!homeTeamId || !awayTeamId) continue
    const ft=match.score?.ft
    const score=ft && ft.length===2 && ft.every(Number.isFinite) ? `${ft[0]}-${ft[1]}` : undefined
    const finished=score || /finished|final|full.?time|ft/i.test(match.status ?? '') ? 'finished' as const : undefined
    if (score || finished) index.set(fixtureKey(homeTeamId,awayTeamId,match.group,match.date),{score,status:finished})
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
    if (date) index.set(fixtureKey(item.homeTeamId,item.awayTeamId,item.group,date),{score:item.score,status:/finished|final/i.test(item.status ?? '')?'finished':undefined})
  }
  return index
}

export function adaptOpenFootballScores(data:OpenFootballData,fixtures:Match[]) {
  const index=indexSource(data)
  return Object.fromEntries(fixtures.flatMap(fixture=>{const update=findUpdate(index,fixture);return update?.score?[[fixture.id,update.score]]:[]}))
}

export function readCachedScores() {
  try {
    const cached=JSON.parse(localStorage.getItem(CACHE_KEY) ?? '') as ScoreCache
    return cached.version===CACHE_VERSION && Date.now()-cached.savedAt<=CACHE_TTL ? cached.scores : null
  } catch { return null }
}

export function getScoreSnapshot(matchId:string) { return scores[matchId] }
export function subscribeToScore(matchId:string,listener:()=>void) {
  const set=listeners.get(matchId) ?? new Set<()=>void>();set.add(listener);listeners.set(matchId,set)
  return ()=>{set.delete(listener);if(!set.size)listeners.delete(matchId)}
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

  const sourceIndexes=[localIndex,remoteData ? indexSource(remoteData) : null].filter(Boolean) as Map<string,ScoreUpdate>[]
  const overrideIndex=adaptOverrides(overrides,fixtures),changed:string[]=[]
  for (const fixture of fixtures) {
    const update=findUpdate(overrideIndex,fixture) ?? sourceIndexes.map(index=>findUpdate(index,fixture)).find(item=>item?.score)
    if (update?.score && scores[fixture.id]!==update.score) { scores[fixture.id]=update.score;changed.push(fixture.id) }
  }
  try { localStorage.setItem(CACHE_KEY,JSON.stringify({version:CACHE_VERSION,savedAt:Date.now(),scores} satisfies ScoreCache)) } catch {}
  changed.forEach(matchId=>listeners.get(matchId)?.forEach(listener=>listener()))
  return changed
}

export function startScoreRefresh(fixtures:Match[]) {
  let timer:number|undefined,disposed=false
  const refresh=()=>{if(!disposed && document.visibilityState==='visible')void refreshScores(fixtures).catch(()=>{})}
  const start=()=>{if(timer===undefined){refresh();timer=window.setInterval(refresh,REFRESH_INTERVAL)}}
  const stop=()=>{if(timer!==undefined){window.clearInterval(timer);timer=undefined}}
  const visibility=()=>document.visibilityState==='visible'?start():stop()
  document.addEventListener('visibilitychange',visibility);visibility()
  return ()=>{disposed=true;stop();document.removeEventListener('visibilitychange',visibility)}
}
