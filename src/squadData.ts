import type { Language, Match } from './data'

export type PlayerPosition = 'GK' | 'DEF' | 'MID' | 'FWD'
export type LineupStatus = 'confirmed' | 'probable' | 'unavailable'

export interface SquadPlayer {
  playerId: string
  teamId: string
  name: string
  number: number | null
  position: PlayerPosition
  role: string
  club: string | null
  age?: number | null
  foot?: string | null
  debut?: string | null
  status: LineupStatus
}

export interface CareerSummary {
  extract: string
  sourceUrl: string
}

interface SquadFile {
  teams: Record<string,{ appTeamId:string; players:SquadPlayer[] }>
}

interface LineupFile {
  matches: Record<string,Record<string,{ status:'confirmed'; playerIds:string[] }>>
}

interface ProfileFile {
  players: Record<string,{
    sourceUrl:string
    dominantFoot:string | null
    nationalTeamDebut:string | null
    summary:{ es:string | null; en:string | null }
  }>
}

const dataUrl = (file:string) => `${import.meta.env.BASE_URL}data/${file}`
const loadJson = <T,>(file:string) => fetch(dataUrl(file)).then(response=>{
  if (!response.ok) throw new Error(`Unable to load ${file}`)
  return response.json() as Promise<T>
})

let squadsPromise: Promise<SquadFile> | undefined
let lineupsPromise: Promise<LineupFile> | undefined
let profilesPromise: Promise<ProfileFile> | undefined

function teamId(appTeamId:string) {
  return appTeamId.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'')
}

function unavailablePlayer(id:string, selectedTeamId:string): SquadPlayer {
  return {playerId:id,teamId:selectedTeamId,name:'Data unavailable',number:null,position:'GK',role:'—',club:null,status:'unavailable'}
}

function probableLineup(squad:SquadPlayer[]) {
  const selected: SquadPlayer[] = []
  const take = (position:PlayerPosition,count:number) => selected.push(...squad.filter(player=>player.position===position).slice(0,count))
  take('GK',1); take('DEF',4); take('MID',3); take('FWD',3)
  if (selected.length < 11) selected.push(...squad.filter(player=>!selected.includes(player)).slice(0,11-selected.length))
  return selected.slice(0,11).map(player=>({...player,status:'probable' as const}))
}

export async function loadMatchPlayers(match:Match, appTeamId:string) {
  squadsPromise ??= loadJson<SquadFile>('squads.json')
  lineupsPromise ??= loadJson<LineupFile>('lineups.json').catch(()=>({matches:{}}))
  const [squads,lineups] = await Promise.all([squadsPromise,lineupsPromise])
  const selectedTeamId = teamId(appTeamId)
  const squad = (squads.teams[selectedTeamId]?.players ?? []).map(player=>({...player,status:'probable' as const}))
  const override = lineups.matches[match.id]?.[selectedTeamId]

  if (override?.status === 'confirmed') {
    const byId = new Map(squad.map(player=>[player.playerId,player]))
    return {
      squad,
      lineup:override.playerIds.map(id=>byId.get(id) ? {...byId.get(id)!,status:'confirmed' as const} : unavailablePlayer(id,selectedTeamId)),
      lineupStatus:'confirmed' as const,
    }
  }

  if (!squad.length) return {squad:[unavailablePlayer(`${selectedTeamId}_unavailable`,selectedTeamId)],lineup:[unavailablePlayer(`${selectedTeamId}_unavailable`,selectedTeamId)],lineupStatus:'unavailable' as const}
  const isFuture = Date.now() < new Date(match.dateTime).getTime()
  return {squad,lineup:probableLineup(squad),lineupStatus:isFuture ? 'probable' as const : 'unavailable' as const}
}

export async function loadCareer(player: SquadPlayer, language: Language): Promise<CareerSummary> {
  profilesPromise ??= loadJson<ProfileFile>('playerProfiles.json')
  try {
    const profile = (await profilesPromise).players[player.playerId]
    if (!profile) return {extract:'',sourceUrl:''}
    player.foot = profile.dominantFoot
    player.debut = profile.nationalTeamDebut
    return {extract:profile.summary[language] ?? '',sourceUrl:profile.sourceUrl}
  } catch {
    return {extract:'',sourceUrl:''}
  }
}
