import React, { useEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { BarChart3, CalendarDays, Clock3, Globe2, Info, MapPin, Trophy } from 'lucide-react'
import { allGroupMatches, flagCodes, groupColors, matches, secondMatchday, teamNames, thirdMatchday, type Language, type Match, type Matchday } from './data'
import { copy } from './i18n'
import { getScoreSnapshot, startScoreRefresh, subscribeToScore } from './worldcupScores'
import { getMatchStatus, getMinuteSnapshot, subscribeToMinute } from './matchStatus'
import { MatchDetailsModal } from './MatchDetailsModal'
import './styles.css'

const YAPE_NUMBER = '973337773'
const PAYPAL_ME_URL = 'https://paypal.me/oprb'

const zones = {
  peru: { zone: 'America/Lima', es: 'Hora Perú', en: 'Peru time' },
  official: { zone: 'America/New_York', es: 'Oficial Mundial', en: 'World Official' },
  europe: { zone: 'Europe/Madrid', es: 'Europa', en: 'Europe' },
} as const
type ZoneKey = keyof typeof zones
type SectionKey = 'matches' | 'standings' | 'knockout' | 'simulation'
type ScoreMap = Record<string,string|null>
type TeamStatus = 'qualified' | 'best-third' | 'out-of-zone' | 'eliminated'
type Standing = {team:string;played:number;gf:number;ga:number;gd:number;points:number}
type RankedStanding = Standing & {rank:number;group:string;status:TeamStatus}
type GroupStandings = Record<string,RankedStanding[]>
type SimulationStatus = 'confirmed' | 'projection' | 'pending' | 'simulated'

const matchdayOptions: {key:Exclude<Matchday,'knockout'>; label:string; matches:Match[]}[] = [
  { key:'first', label:'1°', matches },
  { key:'second', label:'2°', matches:secondMatchday },
  { key:'third', label:'3°', matches:thirdMatchday },
]

const sectionLabels = {
  es: { matches:'Partidos', standings:'Posiciones', knockout:'Eliminatorias', simulation:'Simulación' },
  en: { matches:'Matches', standings:'Standings', knockout:'Knockout', simulation:'Simulation' },
} satisfies Record<Language,Record<SectionKey,string>>

const standingsCopy = {
  es: {
    legend:'PJ = partidos jugados · DG = diferencia de goles · PTS = puntos',
    played:'PJ', difference:'DG', points:'PTS',
    qualified:'Clasificado', bestThird:'Mejor 3.º posible', outOfZone:'3.º fuera de zona', eliminated:'Eliminado',
    provisional:'Posiciones provisionales durante partidos en juego.',
  },
  en: {
    legend:'P = played · GD = goal difference · PTS = points',
    played:'P', difference:'GD', points:'PTS',
    qualified:'Qualified', bestThird:'Possible best 3rd', outOfZone:'3rd out of zone', eliminated:'Eliminated',
    provisional:'Provisional standings while matches are live.',
  },
} as const

const knockoutCopy = {
  es: {
    title:'Fase de eliminación directa',
    round32:'Eliminatoria de 32',
    subtitle:'también conocida como 16avos',
    pending:'Por definir',
    bestThirdPending:'Mejor 3.º pendiente',
  },
  en: {
    title:'Knockout stage',
    round32:'Round of 32',
    subtitle:'also known as the round of 32',
    pending:'To be decided',
    bestThirdPending:'Best 3rd pending',
  },
} as const

const simulationCopy = {
  es: {
    title:'Predicción de cruces',
    legend:'Simulación no oficial basada en los datos actuales.',
    simulate:'Simular resultados pendientes',
    impact:'Impacto en clasificación',
    recalculate:'Recalcular simulación',
    random:'Generar al azar',
    disclaimer:'Esta simulación es referencial. Los cruces oficiales se confirman al finalizar la fase de grupos.',
    noPending:'No hay partidos pendientes para simular.',
    qualified:'Clasificados',
    bestThirds:'Mejores terceros',
    confirmed:'CONFIRMADO',
    projection:'PROYECCIÓN',
    pending:'PENDIENTE',
    simulated:'SIMULADO',
    confirmedLegend:'Cruce definido con equipos ya clasificados.',
    pendingLegend:'Depende de partidos o posiciones aún no definidas.',
    simulatedLegend:'Resultado calculado con los marcadores ingresados por el usuario.',
  },
  en: {
    title:'Matchup prediction',
    legend:'Unofficial simulation based on current data.',
    simulate:'Simulate pending results',
    impact:'Qualification impact',
    recalculate:'Recalculate simulation',
    random:'Generate random',
    disclaimer:'This simulation is a reference. Official matchups are confirmed after the group stage ends.',
    noPending:'There are no pending matches to simulate.',
    qualified:'Qualified teams',
    bestThirds:'Best third-place teams',
    confirmed:'CONFIRMED',
    projection:'PROJECTION',
    pending:'PENDING',
    simulated:'SIMULATED',
    confirmedLegend:'Matchup defined with already qualified teams.',
    pendingLegend:'Depends on matches or positions not yet defined.',
    simulatedLegend:'Result calculated with scores entered by the user.',
  },
} as const

const round32Slots = [
  {num:73,date:'2026-06-28T12:00:00-07:00',city:'Los Angeles (Inglewood)',home:'2A',away:'2B'},
  {num:74,date:'2026-06-29T16:30:00-04:00',city:'Boston (Foxborough)',home:'1E',away:'3A/B/C/D/F'},
  {num:75,date:'2026-06-29T19:00:00-06:00',city:'Monterrey (Guadalupe)',home:'1F',away:'2C'},
  {num:76,date:'2026-06-29T12:00:00-05:00',city:'Houston',home:'1C',away:'2F'},
  {num:77,date:'2026-06-30T17:00:00-04:00',city:'New York/New Jersey (East Rutherford)',home:'1I',away:'3C/D/F/G/H'},
  {num:78,date:'2026-06-30T12:00:00-05:00',city:'Dallas (Arlington)',home:'2E',away:'2I'},
  {num:79,date:'2026-06-30T19:00:00-06:00',city:'Mexico City',home:'1A',away:'3C/E/F/H/I'},
  {num:80,date:'2026-07-01T12:00:00-04:00',city:'Atlanta',home:'1L',away:'3E/H/I/J/K'},
  {num:81,date:'2026-07-01T17:00:00-07:00',city:'San Francisco Bay Area (Santa Clara)',home:'1D',away:'3B/E/F/I/J'},
  {num:82,date:'2026-07-01T13:00:00-07:00',city:'Seattle',home:'1G',away:'3A/E/H/I/J'},
  {num:83,date:'2026-07-02T19:00:00-04:00',city:'Toronto',home:'2K',away:'2L'},
  {num:84,date:'2026-07-02T12:00:00-07:00',city:'Los Angeles (Inglewood)',home:'1H',away:'2J'},
  {num:85,date:'2026-07-02T20:00:00-07:00',city:'Vancouver',home:'1B',away:'3E/F/G/I/J'},
  {num:86,date:'2026-07-03T18:00:00-04:00',city:'Miami (Miami Gardens)',home:'1J',away:'2H'},
  {num:87,date:'2026-07-03T20:30:00-05:00',city:'Kansas City',home:'1K',away:'3D/E/I/J/L'},
  {num:88,date:'2026-07-03T13:00:00-05:00',city:'Dallas (Arlington)',home:'2D',away:'2G'},
] as const

function useScores() {
  const [,bump]=useReducer((value:number)=>value+1,0)
  useEffect(()=>{
    const unsubscribers=allGroupMatches.map(match=>subscribeToScore(match.id,bump))
    return ()=>unsubscribers.forEach(unsubscribe=>unsubscribe())
  },[])
  return Object.fromEntries(allGroupMatches.map(match=>[match.id,getScoreSnapshot(match.id) ?? match.score])) as ScoreMap
}

function dateParts(match: Match | {dateTime:string}, zone: ZoneKey, language: Language) {
  const locale = language === 'es' ? 'es-PE' : 'en-US'
  const date = new Date(match.dateTime)
  return {
    day: new Intl.DateTimeFormat(locale, { day:'numeric', timeZone:zones[zone].zone }).format(date),
    short: new Intl.DateTimeFormat(locale, { day:'numeric', month:'short', timeZone:zones[zone].zone }).format(date).replace('.', ''),
    time: new Intl.DateTimeFormat(locale, { hour:'2-digit', minute:'2-digit', hour12:false, timeZone:zones[zone].zone }).format(date),
    date,
  }
}

function parseScore(score:string|null|undefined) {
  const match=score?.match(/^(\d+)\s*[-–]\s*(\d+)$/)
  return match ? [Number(match[1]),Number(match[2])] as const : null
}

function compareStanding(a:Standing,b:Standing) {
  return b.points-a.points || b.gd-a.gd || b.gf-a.gf || a.team.localeCompare(b.team)
}

function standingsFor(group:string,scoreMap:ScoreMap,language:Language) {
  const groupMatches=allGroupMatches.filter(match=>match.group===group)
  const teams=[...new Set(groupMatches.flatMap(match=>[match.home,match.away]))]
  const table=new Map(teams.map(team=>[team,{team,played:0,gf:0,ga:0,gd:0,points:0} satisfies Standing]))
  for (const match of groupMatches) {
    const score=parseScore(scoreMap[match.id])
    if (!score) continue
    const [homeGoals,awayGoals]=score
    const home=table.get(match.home)!,away=table.get(match.away)!
    home.played++;away.played++;home.gf+=homeGoals;home.ga+=awayGoals;away.gf+=awayGoals;away.ga+=homeGoals
    if(homeGoals>awayGoals)home.points+=3
    else if(awayGoals>homeGoals)away.points+=3
    else{home.points++;away.points++}
  }
  table.forEach(row=>row.gd=row.gf-row.ga)
  return [...table.values()].sort((a,b)=>compareStanding(a,b)||teamNames[a.team][language].localeCompare(teamNames[b.team][language]))
}

function groupComplete(group:string,scoreMap:ScoreMap) {
  return allGroupMatches.filter(match=>match.group===group).every(match=>Boolean(parseScore(scoreMap[match.id])))
}

function hasRealScore(match:Match,scoreMap:ScoreMap) {
  return Boolean(parseScore(getScoreSnapshot(match.id) ?? match.score ?? scoreMap[match.id]))
}

function calculateStandings(scoreMap:ScoreMap,language:Language):GroupStandings {
  const groupLetters=[...new Set(allGroupMatches.map(match=>match.group))].sort()
  const base=Object.fromEntries(groupLetters.map(group=>[group,standingsFor(group,scoreMap,language)]))
  const bestThirdTeams=new Set(Object.entries(base).flatMap(([group,rows])=>rows[2]?[{...rows[2],group}]:[]).sort(compareStanding).slice(0,8).map(row=>row.team))
  return Object.fromEntries(Object.entries(base).map(([group,rows])=>[group,rows.map((row,index)=>{
    const rank=index+1
    const status:TeamStatus = rank<3 ? 'qualified' : rank===3 ? bestThirdTeams.has(row.team) ? 'best-third' : 'out-of-zone' : 'eliminated'
    return {...row,rank,group,status}
  })]))
}

function mergeSimulationScores(scoreMap:ScoreMap,simulationScores:ScoreMap):ScoreMap {
  return Object.fromEntries(allGroupMatches.map(match=>[match.id,scoreMap[match.id] ?? simulationScores[match.id] ?? null]))
}

function simulatedMatchIds(scoreMap:ScoreMap,simulationScores:ScoreMap) {
  return new Set(allGroupMatches.flatMap(match=>!scoreMap[match.id] && simulationScores[match.id] ? [match.id] : []))
}

function rowForSlot(slot:string,standings:GroupStandings,scoreMap:ScoreMap) {
  const direct=slot.match(/^([12])([A-L])$/)
  if (direct) {
    const [,rank,group]=direct
    const row=standings[group]?.[Number(rank)-1]
    return row ? {row, pending:!groupComplete(group,scoreMap), third:false} : null
  }
  const third=slot.match(/^3([A-L](?:\/[A-L])*)$/)
  if (third) {
    const candidates=third[1].split('/').flatMap(group=>{
      const row=standings[group]?.[2]
      return row?.status==='best-third' ? [{row,pending:!groupComplete(group,scoreMap), third:true}] : []
    })
    if (candidates.length===1) return candidates[0]
    return {row:null,pending:true,third:true}
  }
  const team=teamNames[slot] ? Object.values(standings).flat().find(row=>row.team===slot) : undefined
  return team ? {row:team,pending:false,third:false} : null
}

function slotTeam(slot:string,standings:GroupStandings,scoreMap:ScoreMap,language:Language) {
  const result=rowForSlot(slot,standings,scoreMap)
  if (!result?.row) return {team:null,label:result?.third ? knockoutCopy[language].bestThirdPending : knockoutCopy[language].pending,pending:true}
  return {team:result.row.team,label:teamNames[result.row.team][language],pending:result.pending}
}

function groupHasSimulation(group:string,simulatedIds:Set<string>) {
  return allGroupMatches.some(match=>match.group===group && simulatedIds.has(match.id))
}

function matchupStatus(match:{home:string;away:string},standings:GroupStandings,scoreMap:ScoreMap,simulatedIds:Set<string>):SimulationStatus {
  const home=rowForSlot(match.home,standings,scoreMap)
  const away=rowForSlot(match.away,standings,scoreMap)
  const rows=[home?.row,away?.row].filter(Boolean) as RankedStanding[]
  if (!home?.row || !away?.row) return rows.some(row=>groupHasSimulation(row.group,simulatedIds)) ? 'simulated' : 'pending'
  if (home.pending || away.pending) return rows.some(row=>groupHasSimulation(row.group,simulatedIds)) ? 'simulated' : 'projection'
  if (rows.some(row=>groupHasSimulation(row.group,simulatedIds))) return 'simulated'
  return 'confirmed'
}

function projectedThirds(standings:GroupStandings) {
  return Object.values(standings).flat().filter(row=>row.rank===3).sort(compareStanding)
}

function getCurrentMatchday(now:number) {
  const active=matchdayOptions.find(option=>option.matches.some(match=>getMatchStatus(match,getScoreSnapshot(match.id) ?? match.score,now)==='live'))
  if (active) return active.key
  return matchdayOptions.find(option=>{
    const first=Math.min(...option.matches.map(match=>new Date(match.dateTime).getTime()))
    const last=Math.max(...option.matches.map(match=>new Date(match.dateTime).getTime()))
    return now>=first && now<=last+120*60*1000
  })?.key ?? 'third'
}

function MatchStatusDot({ match, score, language }: { match:Match; score:string|null|undefined; language:Language }) {
  const now = useSyncExternalStore(subscribeToMinute,getMinuteSnapshot,getMinuteSnapshot)
  const status = getMatchStatus(match,score,now)
  return <span className={`status-dot ${status}`} aria-label={copy[language][status]} />
}

function MatchRow({ match, language, zone, onOpen }: { match: Match; language:Language; zone:ZoneKey; onOpen:()=>void }) {
  const t = copy[language]
  const liveScore = useSyncExternalStore(listener=>subscribeToScore(match.id,listener),()=>getScoreSnapshot(match.id),()=>getScoreSnapshot(match.id))
  const score = liveScore ?? match.score
  return <div className="match-row interactive-match" role="button" tabIndex={0} onClick={event=>{event.stopPropagation();onOpen()}} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onOpen()}}}>
    <MatchStatusDot match={match} score={score} language={language}/>
    <span className="team home"><img className="flag" src={`https://flagcdn.com/w40/${flagCodes[match.home]}.png`} alt=""/><span>{teamNames[match.home][language]}</span></span>
    <span className="versus">{t.vs}</span>
    <span className="team away"><img className="flag" src={`https://flagcdn.com/w40/${flagCodes[match.away]}.png`} alt=""/><span>{teamNames[match.away][language]}</span></span>
    <span className="match-time"><Clock3 aria-hidden="true" />{dateParts(match,zone,language).time}<small>{language==='es'?'Hora Perú':'Peru time'}</small></span>
    <span className={`score ${score ? 'done' : ''}`}>{score ?? '--'}</span>
  </div>
}

function GroupCard({ groupMatches, language, zone, onOpen }: { groupMatches: Match[]; language:Language; zone:ZoneKey; onOpen:(match:Match)=>void }) {
  const group = groupMatches[0].group
  const dates = [...new Set(groupMatches.map(match=>dateParts(match,zone,language).short))]
  const venues = [...new Set(groupMatches.map(match=>[match.stadium,match.city].filter(Boolean).join(', ')))]
  return <article className="group-card interactive-card" role="button" tabIndex={0} onClick={()=>onOpen(groupMatches[0])} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onOpen(groupMatches[0])}}}>
    <header className="card-header">
      <span className="group-badge" style={{background:groupColors[group]}}>{group}</span>
      <h2>{copy[language].group} {group}</h2>
      <strong>{dates.join('–')}</strong>
    </header>
    <div className="matches">{groupMatches.map(match=><MatchRow key={match.id} match={match} language={language} zone={zone} onOpen={()=>onOpen(match)}/>)}</div>
    <footer className="venue"><MapPin aria-hidden="true"/><span>{venues.join(' · ')}</span></footer>
  </article>
}

function statusLabel(status:TeamStatus,language:Language) {
  const t=standingsCopy[language]
  if (status==='qualified') return t.qualified
  if (status==='best-third') return t.bestThird
  if (status==='out-of-zone') return t.outOfZone
  return t.eliminated
}

function StandingGroupCard({group,standings,language}:{group:string;standings:RankedStanding[];language:Language}) {
  const t=standingsCopy[language]
  return <article className="group-card standings-card">
    <header className="card-header">
      <span className="group-badge" style={{background:groupColors[group]}}>{group}</span>
      <h2>{copy[language].group} {group}</h2>
      <strong>{t.points}</strong>
    </header>
    <div className="standing-head"><span></span><span>{t.played}</span><span>{t.difference}</span><span>{t.points}</span><span></span></div>
    <ol className="standing-list">{standings.map(row=><li key={row.team} className={`standing-row state-${row.status}`}>
      <span className="standing-team"><em>{row.rank}</em><img src={`https://flagcdn.com/w40/${flagCodes[row.team]}.png`} alt=""/><b>{teamNames[row.team][language]}</b></span>
      <span>{row.played}</span><span>{row.gd>0?`+${row.gd}`:row.gd}</span><strong>{row.points}</strong>
      <small>{statusLabel(row.status,language)}</small>
    </li>)}</ol>
  </article>
}

function resolveSlot(slot:string,standings:GroupStandings,scoreMap:ScoreMap,language:Language) {
  const direct=slot.match(/^([12])([A-L])$/)
  if (direct) {
    const [,rank,group]=direct
    return groupComplete(group,scoreMap) ? standings[group]?.[Number(rank)-1]?.team : null
  }
  const third=slot.match(/^3([A-L](?:\/[A-L])*)$/)
  if (third) {
    const candidateGroups=third[1].split('/')
    const confirmed=candidateGroups.flatMap(group=>{
      if (!groupComplete(group,scoreMap)) return []
      const row=standings[group]?.[2]
      return row?.status==='best-third' ? [row.team] : []
    })
    return confirmed.length===1 ? confirmed[0] : 'BEST_THIRD_PENDING'
  }
  return teamNames[slot] ? slot : null
}

function TeamSlot({slot,standings,scoreMap,language}:{slot:string;standings:GroupStandings;scoreMap:ScoreMap;language:Language}) {
  const resolved=resolveSlot(slot,standings,scoreMap,language)
  const text=resolved==='BEST_THIRD_PENDING' ? knockoutCopy[language].bestThirdPending : resolved ? teamNames[resolved][language] : knockoutCopy[language].pending
  return <span className={`ko-team ${resolved ? 'known' : ''}`}>
    {resolved && resolved!=='BEST_THIRD_PENDING' ? <img className="flag" src={`https://flagcdn.com/w40/${flagCodes[resolved]}.png`} alt=""/> : <i/>}
    <b>{text}</b>
  </span>
}

function KnockoutSection({language,zone,standings,scoreMap}:{language:Language;zone:ZoneKey;standings:GroupStandings;scoreMap:ScoreMap}) {
  const t=knockoutCopy[language]
  return <section className="knockout-section">
    <header className="section-title"><h2>{t.title}</h2><p><strong>{t.round32}</strong> · {t.subtitle}</p></header>
    <div className="groups-grid knockout-grid round32-grid">
      {round32Slots.map(match=><article key={match.num} className="group-card knockout-card">
        <header className="card-header">
          <span className="group-badge knockout-badge">{match.num}</span>
          <h2>{t.round32}</h2>
          <strong>{dateParts({dateTime:match.date},zone,language).short}</strong>
        </header>
        <div className="knockout-matchup">
          <TeamSlot slot={match.home} standings={standings} scoreMap={scoreMap} language={language}/>
          <span>{copy[language].vs}</span>
          <TeamSlot slot={match.away} standings={standings} scoreMap={scoreMap} language={language}/>
        </div>
        <footer className="venue"><MapPin aria-hidden="true"/><span>{match.city} · {dateParts({dateTime:match.date},zone,language).time} {language==='es'?'Hora Perú':'Peru time'}</span></footer>
      </article>)}
    </div>
  </section>
}

function SimulationBadge({status,language}:{status:SimulationStatus;language:Language}) {
  const t=simulationCopy[language]
  const label={confirmed:t.confirmed,projection:t.projection,pending:t.pending,simulated:t.simulated}[status]
  return <small className={`simulation-badge badge-${status}`}>{label}</small>
}

function SimulationTeamSlot({slot,standings,scoreMap,language}:{slot:string;standings:GroupStandings;scoreMap:ScoreMap;language:Language}) {
  const resolved=slotTeam(slot,standings,scoreMap,language)
  return <span className={`ko-team ${resolved.team ? 'known' : ''}`}>
    {resolved.team ? <img className="flag" src={`https://flagcdn.com/w40/${flagCodes[resolved.team]}.png`} alt=""/> : <i/>}
    <b>{resolved.label}</b>
  </span>
}

function SimulationMatchCard({match,language,zone,standings,scoreMap,simulatedIds}:{match:typeof round32Slots[number];language:Language;zone:ZoneKey;standings:GroupStandings;scoreMap:ScoreMap;simulatedIds:Set<string>}) {
  const t=knockoutCopy[language]
  const status=matchupStatus(match,standings,scoreMap,simulatedIds)
  return <article className="group-card knockout-card simulation-match-card">
    <header className="card-header">
      <span className="group-badge knockout-badge">{match.num}</span>
      <h2>{t.round32}</h2>
      <SimulationBadge status={status} language={language}/>
    </header>
    <div className="knockout-matchup">
      <SimulationTeamSlot slot={match.home} standings={standings} scoreMap={scoreMap} language={language}/>
      <span>{copy[language].vs}</span>
      <SimulationTeamSlot slot={match.away} standings={standings} scoreMap={scoreMap} language={language}/>
    </div>
    <footer className="venue"><MapPin aria-hidden="true"/><span>{match.city} · {dateParts({dateTime:match.date},zone,language).time} {language==='es'?'Hora Perú':'Peru time'}</span></footer>
  </article>
}

function PendingMatchInput({match,language,zone,value,onChange}:{match:Match;language:Language;zone:ZoneKey;value:{home:string;away:string};onChange:(value:{home:string;away:string})=>void}) {
  return <article className="simulation-input-card">
    <div className="simulation-input-teams">
      <span><img className="flag" src={`https://flagcdn.com/w40/${flagCodes[match.home]}.png`} alt=""/>{teamNames[match.home][language]}</span>
      <b>{copy[language].vs}</b>
      <span><img className="flag" src={`https://flagcdn.com/w40/${flagCodes[match.away]}.png`} alt=""/>{teamNames[match.away][language]}</span>
    </div>
    <div className="simulation-score-inputs">
      <input inputMode="numeric" pattern="[0-9]*" min="0" max="30" value={value.home} aria-label={teamNames[match.home][language]} onChange={event=>onChange({...value,home:event.target.value.replace(/\D/g,'').slice(0,2)})}/>
      <span>-</span>
      <input inputMode="numeric" pattern="[0-9]*" min="0" max="30" value={value.away} aria-label={teamNames[match.away][language]} onChange={event=>onChange({...value,away:event.target.value.replace(/\D/g,'').slice(0,2)})}/>
    </div>
    <small>{copy[language].group} {match.group} · {dateParts(match,zone,language).short} · {dateParts(match,zone,language).time} {language==='es'?'Hora Perú':'Peru time'}</small>
  </article>
}

function SimulationSection({language,zone,realScoreMap,standings,simulationDraft,onDraftChange,onRecalculate,onRandomize}:{language:Language;zone:ZoneKey;realScoreMap:ScoreMap;standings:GroupStandings;simulationDraft:Record<string,{home:string;away:string}>;onDraftChange:(matchId:string,value:{home:string;away:string})=>void;onRecalculate:()=>void;onRandomize:()=>void}) {
  const t=simulationCopy[language]
  const pendingMatches=allGroupMatches.filter(match=>!hasRealScore(match,realScoreMap))
  const thirds=projectedThirds(standings)
  const qualified=Object.values(standings).flat().filter(row=>row.status==='qualified'||row.status==='best-third')
  return <section className="simulation-section">
    <header className="section-title simulation-title">
      <h2>{t.title}</h2>
      <p>{t.legend}</p>
    </header>

    <div className="simulation-layout">
      <aside className="simulation-panel simulation-form-panel">
        <h3>{t.simulate}</h3>
        <div className="simulation-input-list">
          {pendingMatches.length ? pendingMatches.map(match=><PendingMatchInput key={match.id} match={match} language={language} zone={zone} value={simulationDraft[match.id] ?? {home:'',away:''}} onChange={value=>onDraftChange(match.id,value)}/>) : <p className="simulation-empty">{t.noPending}</p>}
        </div>
        <div className="simulation-actions">
          <button className="simulation-random" type="button" onClick={onRandomize}>{t.random}</button>
          <button className="simulation-recalculate" type="button" onClick={onRecalculate}>{t.recalculate}</button>
        </div>
      </aside>

      <aside className="simulation-panel simulation-impact">
        <h3>{t.impact}</h3>
        <div className="impact-block">
          <h4>{t.qualified}</h4>
          <div className="impact-chip-list">{qualified.map(row=><span key={`${row.group}-${row.team}`} className={`impact-chip state-${row.status}`}><img className="flag" src={`https://flagcdn.com/w40/${flagCodes[row.team]}.png`} alt=""/>{teamNames[row.team][language]}</span>)}</div>
        </div>
        <div className="impact-block">
          <h4>{t.bestThirds}</h4>
          <ol className="third-ranking">{thirds.map(row=><li key={`${row.group}-${row.team}`} className={row.status==='best-third'?'in-zone':'out-zone'}><span>{copy[language].group} {row.group}</span><b>{teamNames[row.team][language]}</b><em>{row.points} pts · {row.gd>0?`+${row.gd}`:row.gd}</em></li>)}</ol>
        </div>
      </aside>
    </div>
    <p className="simulation-disclaimer">{t.disclaimer}</p>
  </section>
}

function SupportModal({ language, onClose }: { language:Language; onClose:()=>void }) {
  const t = copy[language]
  const closeButton = useRef<HTMLButtonElement>(null)
  const [copied,setCopied] = useState(false)

  useEffect(()=>{
    closeButton.current?.focus()
    const closeOnEscape = (event:KeyboardEvent)=>{ if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown',closeOnEscape)
    return ()=>document.removeEventListener('keydown',closeOnEscape)
  },[onClose])

  const copyYape = async ()=>{
    try {
      await navigator.clipboard.writeText(YAPE_NUMBER)
      setCopied(true)
    } catch {
      const input = document.createElement('textarea')
      input.value = YAPE_NUMBER
      input.style.position = 'fixed'
      input.style.opacity = '0'
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      setCopied(true)
      input.remove()
    }
    window.setTimeout(()=>setCopied(false),1800)
  }

  return <div className="support-overlay" role="presentation" onMouseDown={event=>{ if (event.target === event.currentTarget) onClose() }}>
    <section className="support-modal" role="dialog" aria-modal="true" aria-labelledby="support-title" aria-describedby="support-subtitle">
      <button ref={closeButton} className="support-close" type="button" onClick={onClose} aria-label={t.closeSupport}>×</button>
      <header><span className="support-cup" aria-hidden="true">☕</span><div><h2 id="support-title">{t.coffee}</h2><p id="support-subtitle">{t.coffeeThanks}</p></div></header>
      <div className="support-options">
        <article className="support-option">
          <span className="payment-badge yape-badge" aria-hidden="true">Y</span>
          <div><strong>Yape Perú</strong><span>{YAPE_NUMBER}</span></div>
          <button type="button" onClick={copyYape} aria-label={`${t.copyNumber} ${YAPE_NUMBER}`}>{copied?t.copied:t.copyNumber}</button>
        </article>
        <article className="support-option">
          <span className="payment-badge paypal-badge" aria-hidden="true">P</span>
          <div><strong>PayPal.Me</strong><span>paypal.me/oprb</span></div>
          <a href={PAYPAL_ME_URL} target="_blank" rel="noopener noreferrer" aria-label={t.openPayPal}>{t.openPayPal}</a>
        </article>
      </div>
    </section>
  </div>
}

function App() {
  const [language,setLanguage] = useState<Language>('es')
  const [zone,setZone] = useState<ZoneKey>('peru')
  const [section,setSection] = useState<SectionKey>('matches')
  const [matchday,setMatchday] = useState<Exclude<Matchday,'knockout'>>('third')
  const [simulationDraft,setSimulationDraft] = useState<Record<string,{home:string;away:string}>>({})
  const [simulationScores,setSimulationScores] = useState<ScoreMap>({})
  const [supportOpen,setSupportOpen] = useState(false)
  const [detailMatch,setDetailMatch] = useState<Match|null>(null)
  const now = useSyncExternalStore(subscribeToMinute,getMinuteSnapshot,getMinuteSnapshot)
  const scoreMap = useScores()
  const t = copy[language]
  const labels = sectionLabels[language]
  const currentMatchday = getCurrentMatchday(now)
  const visible = useMemo(()=>matchdayOptions.find(option=>option.key===matchday)?.matches ?? thirdMatchday,[matchday])
  const groups = useMemo(()=>Object.values(visible.reduce<Record<string,Match[]>>((acc,match)=>{(acc[match.group]??=[]).push(match); return acc},{})),[visible])
  const standings = useMemo(()=>calculateStandings(scoreMap,language),[scoreMap,language])
  const projectedScoreMap = useMemo(()=>mergeSimulationScores(scoreMap,simulationScores),[scoreMap,simulationScores])
  const projectedStandings = useMemo(()=>calculateStandings(projectedScoreMap,language),[projectedScoreMap,language])
  const hasLiveMatches = allGroupMatches.some(match=>getMatchStatus(match,scoreMap[match.id],now)==='live')
  const range = useMemo(()=>{
    const days = visible.map(match=>Number(dateParts(match,zone,language).day))
    const min=Math.min(...days), max=Math.max(...days)
    return language === 'es' ? `${min}–${max} de junio de 2026` : `June ${min}–${max}, 2026`
  },[visible,zone,language])
  const zoneName = zones[zone][language]
  const subtitle = section==='matches' ? `${labels.matches} · ${range}` : section==='standings' ? labels.standings : section==='knockout' ? labels.knockout : simulationCopy[language].title

  const updateSimulationDraft=(matchId:string,value:{home:string;away:string})=>setSimulationDraft(current=>({...current,[matchId]:value}))
  const recalculateSimulation=()=>{
    const simulated=Object.fromEntries(Object.entries(simulationDraft).flatMap(([matchId,value])=>{
      if (scoreMap[matchId] || value.home==='' || value.away==='') return []
      return [[matchId,`${Number(value.home)}-${Number(value.away)}`]]
    })) as ScoreMap
    setSimulationScores(simulated)
    setSection('simulation')
  }
  const randomGoal=()=>Math.random()<.08 ? 4 : Math.random()<.25 ? 3 : Math.floor(Math.random()*3)
  const randomizeSimulation=()=>{
    const pending=allGroupMatches.filter(match=>!hasRealScore(match,scoreMap))
    const draft=Object.fromEntries(pending.map(match=>[match.id,{home:String(randomGoal()),away:String(randomGoal())}]))
    const simulated=Object.fromEntries(Object.entries(draft).map(([matchId,value])=>[matchId,`${Number(value.home)}-${Number(value.away)}`])) as ScoreMap
    setSimulationDraft(draft)
    setSimulationScores(simulated)
    setSection('simulation')
  }

  useEffect(()=>startScoreRefresh(allGroupMatches),[])
  useEffect(()=>{
    document.documentElement.lang=language
    document.title=language==='es'?'Partidos 2026 · Mundial':'Matches 2026 · World Cup'
  },[language])

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand">
        <span className="trophy-mark"><Trophy aria-hidden="true"/></span>
        <div><h1>{t.title}</h1><p>{subtitle}</p></div>
      </div>
      <div className="controls">
        <nav className="section-nav" aria-label={language==='es'?'Secciones':'Sections'}>
          {(['matches','standings','knockout'] as SectionKey[]).map(key=><button key={key} className={section===key?'active':''} type="button" onClick={()=>setSection(key)}>{labels[key]}</button>)}
          <button className={`simulation-nav-button ${section==='simulation'?'active':''}`} type="button" onClick={()=>setSection('simulation')} aria-label={labels.simulation} title={labels.simulation}><span aria-hidden="true">🤖</span><b>{labels.simulation}</b></button>
        </nav>
        <button className="fixture-btn" type="button" onClick={()=>setSection('matches')} aria-label={language==='es'?'Ver partidos':'View matches'}><CalendarDays aria-hidden="true"/><span>{language==='es'?'Ver partidos':'View matches'}</span></button>
        <a className="stats-ball-link" href="./estadisticas.html" aria-label={language==='es'?'Abrir estadísticas':'Open statistics'}>
          <span className="stats-ball" aria-hidden="true">⚽</span>
          <span>{language==='es'?'Estadísticas':'Stats'}</span>
        </a>
        <div className="matchday-nav" role="group" aria-label={language==='es'?'Fechas':'Matchdays'}>
          {matchdayOptions.map(option=><button key={option.key} type="button" className={`${matchday===option.key?'active':''} ${currentMatchday===option.key?'current':''}`} onClick={()=>{setMatchday(option.key);setSection('matches')}}>{option.label}</button>)}
        </div>
        <label className="control timezone"><span>{language==='es'?'Horario':'Time'}</span><select value={zone} onChange={event=>setZone(event.target.value as ZoneKey)} aria-label={t.viewTime}>
          {Object.entries(zones).map(([key,item])=><option key={key} value={key}>{item[language]}</option>)}
        </select></label>
        <button className="language-globe" type="button" onClick={()=>setLanguage(language==='es'?'en':'es')} aria-label={t.language} title={t.language}><Globe2 aria-hidden="true"/><span>{language.toUpperCase()}</span></button>
        <button className="coffee-button" type="button" onClick={()=>setSupportOpen(true)} aria-label={t.coffee}><span aria-hidden="true">☕</span><span className="coffee-label">{t.coffee}</span></button>
      </div>
    </header>

    <main>
      <div className="legend" aria-label="Match status">
        <span><i className="status-dot scheduled"/>{t.scheduled}</span><span><i className="status-dot live"/>{t.live}</span><span><i className="status-dot finished"/>{t.finished}</span>
      </div>
      {section==='matches' ? <section className="groups-grid">{groups.map(group=><GroupCard key={group[0].group} groupMatches={group} language={language} zone={zone} onOpen={setDetailMatch}/>)}</section> : null}
      {section==='standings' ? <section className="standings-section">
        {hasLiveMatches ? <p className="standings-note"><Info aria-hidden="true"/>{standingsCopy[language].provisional}</p> : null}
        <p className="standings-legend">{standingsCopy[language].legend}</p>
        <div className="groups-grid standings-grid">{Object.entries(standings).map(([group,rows])=><StandingGroupCard key={group} group={group} standings={rows} language={language}/>)}</div>
      </section> : null}
      {section==='knockout' ? <KnockoutSection language={language} zone={zone} standings={standings} scoreMap={scoreMap}/> : null}
      {section==='simulation' ? <SimulationSection language={language} zone={zone} realScoreMap={scoreMap} standings={projectedStandings} simulationDraft={simulationDraft} onDraftChange={updateSimulationDraft} onRecalculate={recalculateSimulation} onRandomize={randomizeSimulation}/> : null}
    </main>

    <footer className="bottom-panel">
      <div className="footer-block local"><Clock3/><p>{t.timePrefix} <strong>{zoneName}</strong></p></div>
      <div className="footer-block notice"><span className="stadium-icon">◎</span><p>{t.notice}</p></div>
      <div className="footer-block follow"><span className="chart-icon"><BarChart3/></span><p>{t.follow}<strong>{t.more}</strong><small className="data-source">Data: OpenFootball CC0</small></p></div>
    </footer>
    {supportOpen ? <SupportModal language={language} onClose={()=>setSupportOpen(false)}/> : null}
    {detailMatch ? <MatchDetailsModal match={detailMatch} language={language} onClose={()=>setDetailMatch(null)}/> : null}
  </div>
}

const rootWindow = window as Window & { __partidosRoot?: Root }
const root = rootWindow.__partidosRoot ??= createRoot(document.getElementById('root')!)
root.render(<React.StrictMode><App/></React.StrictMode>)
