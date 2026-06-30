import React, { useEffect, useMemo, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Activity, ArrowLeft, BarChart3, CalendarDays, Clock, Globe2, Goal, ShieldCheck, Target, TrendingUp, Trophy, Users, Volleyball } from 'lucide-react'
import { flagCodes, teamNames, type Language } from './data'
import './statistics.css'

const REMOTE_DATA_URL = 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json'
const REFRESH_INTERVAL_MS = 45_000
const LIVE_WINDOW_MS = 150 * 60 * 1000

type SourceScore = {
  ft?: [number, number]
  ht?: [number, number]
  current?: [number, number]
  live?: [number, number]
}
type GoalEntry = { name?: string; minute?: string | number; penalty?: boolean; owngoal?: boolean }
type SourceMatch = {
  round?: string
  num?: number
  date?: string
  time?: string
  team1?: string
  team2?: string
  score?: SourceScore
  status?: string
  goals1?: GoalEntry[]
  goals2?: GoalEntry[]
  group?: string
  ground?: string
}
type SourceData = { matches?: SourceMatch[] }
type MatchStatus = 'final' | 'live' | 'scheduled'
type TeamStat = {
  team:string
  played:number
  wins:number
  draws:number
  losses:number
  gf:number
  ga:number
  gd:number
  cleanSheets:number
  failedToScore:number
}
type PlayerStat = { player:string; team:string; value:number; extra?:Array<number|string> }
type MatchStat = Omit<SourceMatch,'score'> & {
  id:string
  home:string
  away:string
  score:[number,number] | null
  status:MatchStatus
  kickoff:number | null
}
type StatRow = {
  team?:string
  player?:string
  label?:string
  sublabel?:string
  value:number|string
  extra?:Array<number|string>
}
type SummaryRow = {
  icon:React.ReactNode
  label:{es:string;en:string}
  value:string|number
}
type StatCard = {
  icon:React.ReactNode
  title:{es:string;en:string}
  columns?:{es:string[];en:string[]}
  rows:StatRow[]
  summaryRows?:SummaryRow[]
}

const normalize = (value:string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'')
const aliases = new Map<string,string>()
for (const [key,names] of Object.entries(teamNames)) {
  ;[key,names.es,names.en].forEach(name=>aliases.set(normalize(name),key))
}
Object.entries({
  USA:['USA','United States of America','EEUU','EE.UU.'],
  SouthAfrica:['South Africa'],
  SouthKorea:['Korea Republic','South Korea'],
  IvoryCoast:['Cote d Ivoire','Cote dIvoire','Côte d’Ivoire'],
  DRCCongo:['DR Congo','Congo DR','DRC Congo','RD Congo'],
  CapeVerde:['Cape Verde'],
  SaudiArabia:['Saudi Arabia'],
  NewZealand:['New Zealand'],
  Curacao:['Curaçao'],
}).forEach(([team,items])=>items.forEach(item=>aliases.set(normalize(item),team)))

function teamKey(value:string|undefined) {
  if (!value || /^[WL]\d+$/i.test(value.trim())) return ''
  return aliases.get(normalize(value)) ?? value.replace(/\s+/g,'')
}

function flagUrl(team:string) {
  return flagCodes[team] ? `https://flagcdn.com/w40/${flagCodes[team]}.png` : ''
}

function displayName(team:string,language:Language) {
  return teamNames[team]?.[language] ?? team
}

function parseKickoff(match:SourceMatch) {
  if (!match.date) return null
  const offset=match.time?.match(/UTC([+-]\d{1,2})/)?.[1]
  const time=match.time?.match(/^(\d{1,2}:\d{2})/)?.[1] ?? '00:00'
  const normalizedOffset=offset ? `${offset[0]}${offset.slice(1).padStart(2,'0')}:00` : 'Z'
  return new Date(`${match.date}T${time}:00${normalizedOffset}`).getTime()
}

function scoreTuple(value:[number,number]|undefined):[number,number]|null {
  return value && value.length===2 && value.every(Number.isFinite) ? value : null
}

function normalizeStatus(match:SourceMatch, now=Date.now()):MatchStatus {
  const value=normalize(match.status ?? '')
  if (match.score?.ft || /^(final|ft|fulltime|complete|completed|finished)$/.test(value)) return 'final'
  if (match.score?.current || match.score?.live || /^(live|inplay|playing|halftime|ht|1sthalf|2ndhalf)$/.test(value)) return 'live'
  const kickoff=parseKickoff(match)
  return kickoff && now>=kickoff && now<=kickoff+LIVE_WINDOW_MS ? 'live' : 'scheduled'
}

function scoreFor(match:SourceMatch) {
  return scoreTuple(match.score?.ft) ?? scoreTuple(match.score?.current) ?? scoreTuple(match.score?.live)
}

async function fetchJson<T>(url:string) {
  const response=await fetch(`${url}${url.includes('?')?'&':'?'}v=${Date.now()}`,{cache:'no-store'})
  if (!response.ok) throw new Error(`Stats data request failed: ${response.status}`)
  return response.json() as Promise<T>
}

async function fetchStatsData():Promise<SourceData> {
  const base=import.meta.env.BASE_URL
  const local=await fetchJson<SourceData>(`${base}data/worldcup.json`).catch(()=>null)
  const remote=await fetchJson<SourceData>(REMOTE_DATA_URL).catch(()=>null)
  return remote?.matches?.length ? remote : local ?? {matches:[]}
}

function useStatsData() {
  const [data,setData]=useState<SourceData>({matches:[]})
  const [updatedAt,setUpdatedAt]=useState(()=>new Date())
  const [sourceError,setSourceError]=useState(false)

  useEffect(()=>{
    let disposed=false
    let timer:number|undefined
    const refresh=async()=>{
      if (document.visibilityState !== 'visible') return
      try {
        const next=await fetchStatsData()
        if (disposed) return
        setData(next)
        setUpdatedAt(new Date())
        setSourceError(false)
      } catch {
        if (!disposed) setSourceError(true)
      }
    }
    const start=()=>{
      if (timer===undefined) {
        void refresh()
        timer=window.setInterval(refresh,REFRESH_INTERVAL_MS)
      }
    }
    const stop=()=>{
      if (timer!==undefined) {
        window.clearInterval(timer)
        timer=undefined
      }
    }
    const visibility=()=>document.visibilityState==='visible'?start():stop()
    document.addEventListener('visibilitychange',visibility)
    window.addEventListener('focus',refresh)
    window.addEventListener('pageshow',refresh)
    window.addEventListener('online',refresh)
    visibility()
    return ()=>{
      disposed=true
      stop()
      document.removeEventListener('visibilitychange',visibility)
      window.removeEventListener('focus',refresh)
      window.removeEventListener('pageshow',refresh)
      window.removeEventListener('online',refresh)
    }
  },[])

  return {data,updatedAt,sourceError}
}

function normalizeMatches(data:SourceData):MatchStat[] {
  return (data.matches ?? []).flatMap((match,index)=>{
    const home=teamKey(match.team1),away=teamKey(match.team2)
    if (!home || !away) return []
    const status=normalizeStatus(match)
    return [{
      ...match,
      id: match.num ? `match-${match.num}` : `${match.date ?? 'date'}-${home}-${away}-${index}`,
      home,
      away,
      status,
      score: scoreFor(match),
      kickoff: parseKickoff(match),
    }]
  })
}

function compareNumberThenName(a:{value:number;player?:string;team?:string},b:{value:number;player?:string;team?:string},language:Language) {
  const aName=a.player ?? (a.team ? displayName(a.team,language) : '')
  const bName=b.player ?? (b.team ? displayName(b.team,language) : '')
  return b.value-a.value || aName.localeCompare(bName)
}

function buildTeamStats(matches:MatchStat[]) {
  const teams=[...new Set(matches.flatMap(match=>[match.home,match.away]))]
  const table=new Map(teams.map(team=>[team,{team,played:0,wins:0,draws:0,losses:0,gf:0,ga:0,gd:0,cleanSheets:0,failedToScore:0} satisfies TeamStat]))
  let playedMatches=0,totalGoals=0,highScoringMatches=0,goallessMatches=0,liveMatches=0

  for (const match of matches) {
    if (match.status==='live') liveMatches++
    if (!match.score || (match.status!=='final' && match.status!=='live')) continue
    const [homeGoals,awayGoals]=match.score
    const home=table.get(match.home)!,away=table.get(match.away)!
    const matchTotal=homeGoals+awayGoals
    playedMatches++
    totalGoals+=matchTotal
    if (matchTotal>=3) highScoringMatches++
    if (matchTotal===0) goallessMatches++
    home.played++;away.played++
    home.gf+=homeGoals;home.ga+=awayGoals
    away.gf+=awayGoals;away.ga+=homeGoals
    if (homeGoals===0) home.failedToScore++
    if (awayGoals===0) away.failedToScore++
    if (homeGoals===0) away.cleanSheets++
    if (awayGoals===0) home.cleanSheets++
    if (homeGoals>awayGoals){home.wins++;away.losses++}
    else if (awayGoals>homeGoals){away.wins++;home.losses++}
    else{home.draws++;away.draws++}
  }
  table.forEach(row=>row.gd=row.gf-row.ga)
  return {teams:[...table.values()],playedMatches,totalGoals,highScoringMatches,goallessMatches,liveMatches,totalTeams:teams.length}
}

function buildScorers(matches:MatchStat[],language:Language):PlayerStat[] {
  const tally=new Map<string,PlayerStat>()
  const addGoal=(goal:GoalEntry,team:string)=>{
    if (!goal.name || goal.owngoal) return
    const key=`${team}|${goal.name}`
    const entry=tally.get(key) ?? {player:goal.name,team,value:0,extra:[0]}
    entry.value++
    entry.extra=[Number(entry.extra?.[0] ?? 0)+(goal.penalty ? 1 : 0)]
    tally.set(key,entry)
  }
  for (const match of matches) {
    ;(match.goals1 ?? []).forEach(goal=>addGoal(goal,match.home))
    ;(match.goals2 ?? []).forEach(goal=>addGoal(goal,match.away))
  }
  return [...tally.values()].sort((a,b)=>compareNumberThenName(a,b,language)).slice(0,7)
}

function topTeamRows(teams:TeamStat[],sorter:(a:TeamStat,b:TeamStat)=>number,value:(team:TeamStat)=>number|string,extra?:(team:TeamStat)=>Array<number|string>):StatRow[] {
  return [...teams].filter(team=>team.played>0).sort((a,b)=>sorter(a,b)||displayName(a.team,'es').localeCompare(displayName(b.team,'es'))).slice(0,7).map(team=>({team:team.team,value:value(team),extra:extra?.(team)}))
}

function matchLabel(match:MatchStat,language:Language) {
  return `${displayName(match.home,language)} ${match.score ? `${match.score[0]}-${match.score[1]}` : 'vs'} ${displayName(match.away,language)}`
}

function formatShortDate(match:MatchStat,language:Language) {
  if (!match.kickoff) return match.round ?? ''
  const locale=language==='es'?'es-PE':'en-US'
  const date=new Intl.DateTimeFormat(locale,{day:'numeric',month:'short',timeZone:'America/Lima'}).format(match.kickoff).replace('.','')
  const time=new Intl.DateTimeFormat(locale,{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'America/Lima'}).format(match.kickoff)
  return `${date} · ${time}`
}

function buildCards(matches:MatchStat[],teams:TeamStat[],playedMatches:number,totalGoals:number,highScoringMatches:number,goallessMatches:number,liveMatches:number,totalTeams:number,language:Language):StatCard[] {
  const average=playedMatches?(totalGoals/playedMatches).toFixed(2):'0.00'
  const highPct=playedMatches?`${((highScoringMatches/playedMatches)*100).toFixed(1)}%`:'0.0%'
  const goallessPct=playedMatches?`${((goallessMatches/playedMatches)*100).toFixed(1)}%`:'0.0%'
  const scorers=buildScorers(matches,language)
  const completed=[...matches].filter(match=>match.status==='final' && match.score).sort((a,b)=>(b.kickoff ?? 0)-(a.kickoff ?? 0))
  const liveOrNext=[...matches].filter(match=>match.status==='live' || match.status==='scheduled').sort((a,b)=>(a.kickoff ?? 0)-(b.kickoff ?? 0)).slice(0,7)

  return [
    {
      icon:<Trophy aria-hidden="true"/>,
      title:{es:'Goleadores reales',en:'Real top scorers'},
      columns:{es:['Goles','Pen.'],en:['Goals','Pen.']},
      rows:scorers.map(row=>({team:row.team,player:row.player,value:row.value,extra:[row.extra?.[0] ?? 0]})),
    },
    {
      icon:<Volleyball aria-hidden="true"/>,
      title:{es:'Selecciones con más goles',en:'Team goals'},
      columns:{es:['Goles'],en:['Goals']},
      rows:topTeamRows(teams,(a,b)=>b.gf-a.gf||b.gd-a.gd,team=>team.gf),
    },
    {
      icon:<Activity aria-hidden="true"/>,
      title:{es:'Diferencia de goles',en:'Goal difference'},
      columns:{es:['GF','GC','DG'],en:['GF','GA','GD']},
      rows:topTeamRows(teams,(a,b)=>b.gd-a.gd||b.gf-a.gf,team=>team.gf,team=>[team.ga,team.gd>0?`+${team.gd}`:team.gd]),
    },
    {
      icon:<Target aria-hidden="true"/>,
      title:{es:'Rendimiento por selección',en:'Team record'},
      columns:{es:['G','E','P'],en:['W','D','L']},
      rows:topTeamRows(teams,(a,b)=>b.wins-a.wins||b.gd-a.gd||b.gf-a.gf,team=>team.wins,team=>[team.draws,team.losses]),
    },
    {
      icon:<ShieldCheck aria-hidden="true"/>,
      title:{es:'Vallas invictas',en:'Clean sheets'},
      columns:{es:['Partidos'],en:['Matches']},
      rows:topTeamRows(teams,(a,b)=>b.cleanSheets-a.cleanSheets||b.gd-a.gd,team=>team.cleanSheets).filter(row=>Number(row.value)>0),
    },
    {
      icon:<Goal aria-hidden="true"/>,
      title:{es:'Porterías vencidas',en:'Failed to score'},
      columns:{es:['Veces'],en:['Times']},
      rows:topTeamRows(teams,(a,b)=>b.failedToScore-a.failedToScore||a.gf-b.gf,team=>team.failedToScore).filter(row=>Number(row.value)>0),
    },
    {
      icon:<BarChart3 aria-hidden="true"/>,
      title:{es:'Partidos con más goles',en:'Highest scoring matches'},
      columns:{es:['Goles'],en:['Goals']},
      rows:[...matches].filter(match=>match.score).sort((a,b)=>(b.score![0]+b.score![1])-(a.score![0]+a.score![1])).slice(0,7).map(match=>({team:match.home,label:matchLabel(match,language),sublabel:formatShortDate(match,language),value:match.score![0]+match.score![1]})),
    },
    {
      icon:<CalendarDays aria-hidden="true"/>,
      title:{es:'Ultimos finalizados',en:'Latest finals'},
      columns:{es:['Marcador'],en:['Score']},
      rows:completed.slice(0,7).map(match=>({team:match.home,label:`${displayName(match.home,language)} vs ${displayName(match.away,language)}`,sublabel:formatShortDate(match,language),value:`${match.score![0]}-${match.score![1]}`})),
    },
    {
      icon:<Clock aria-hidden="true"/>,
      title:{es:'En vivo / proximos',en:'Live / upcoming'},
      columns:{es:['Estado'],en:['Status']},
      rows:liveOrNext.map(match=>({team:match.home,label:`${displayName(match.home,language)} vs ${displayName(match.away,language)}`,sublabel:formatShortDate(match,language),value:match.status==='live' ? (language==='es'?'En vivo':'Live') : (language==='es'?'Proximo':'Next')})),
    },
    {
      icon:<TrendingUp aria-hidden="true"/>,
      title:{es:'Resumen real',en:'Real summary'},
      rows:[],
      summaryRows:[
        {icon:<Volleyball aria-hidden="true"/>,label:{es:'Total de goles',en:'Total goals'},value:totalGoals},
        {icon:<CalendarDays aria-hidden="true"/>,label:{es:'Partidos con marcador',en:'Matches with score'},value:playedMatches},
        {icon:<Activity aria-hidden="true"/>,label:{es:'Promedio por partido',en:'Goals per match'},value:average},
        {icon:<Clock aria-hidden="true"/>,label:{es:'Partidos en vivo',en:'Live matches'},value:liveMatches},
        {icon:<Users aria-hidden="true"/>,label:{es:'Selecciones',en:'Teams'},value:totalTeams},
        {icon:<BarChart3 aria-hidden="true"/>,label:{es:'Partidos con 3+ goles',en:'Matches with 3+ goals'},value:`${highScoringMatches} (${highPct})`},
        {icon:<Goal aria-hidden="true"/>,label:{es:'Partidos sin goles',en:'Goalless matches'},value:`${goallessMatches} (${goallessPct})`},
      ],
    },
  ]
}

function formatDateTime(date:Date,language:Language) {
  const locale=language==='es'?'es-PE':'en-US'
  const dateText=new Intl.DateTimeFormat(locale,{day:'2-digit',month:'long',year:'numeric',timeZone:'America/Lima'}).format(date)
  const timeText=new Intl.DateTimeFormat(locale,{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'America/Lima'}).format(date)
  return {dateText,timeText}
}

function StatTable({card,language}:{card:StatCard;language:Language}) {
  const columns=card.columns?.[language]
  return <article className="stat-card">
    <header>
      <span className="stat-icon">{card.icon}</span>
      <h2>{card.title[language]}</h2>
    </header>
    {card.summaryRows ? (
      <div className="stat-summary">
        {card.summaryRows.map((row,i)=>(
          <div key={i} className="stat-summary-row">
            <span className="stat-summary-icon">{row.icon}</span>
            <span className="stat-summary-label">{row.label[language]}</span>
            <strong>{row.value}</strong>
          </div>
        ))}
      </div>
    ) : (
      <>
        {columns ? <div className={`stat-columns cols-${columns.length}`}>{columns.map(column=><span key={column}>{column}</span>)}</div> : null}
        <ol className={`stat-list ${columns ? `with-extra extras-${columns.length}` : ''}`}>
          {card.rows.map((row,index)=><li key={`${card.title.es}-${row.team ?? row.label}-${row.player ?? ''}-${index}`}>
            <span className="rank">{index+1}</span>
            <span className="stat-name">
              {row.team && flagUrl(row.team) ? <img src={flagUrl(row.team)} alt=""/> : null}
              <span><b>{row.player ?? row.label ?? (row.team ? displayName(row.team,language) : '')}</b>{row.sublabel ? <small>{row.sublabel}</small> : null}</span>
            </span>
            <strong>{row.value}</strong>
            {row.extra?.map((value,itemIndex)=><strong key={itemIndex}>{value}</strong>)}
          </li>)}
        </ol>
      </>
    )}
  </article>
}

function StatisticsApp() {
  const [language,setLanguage]=useState<Language>('es')
  const {data,updatedAt,sourceError}=useStatsData()
  const matches=useMemo(()=>normalizeMatches(data),[data])
  const {teams,playedMatches,totalGoals,highScoringMatches,goallessMatches,liveMatches,totalTeams}=useMemo(()=>buildTeamStats(matches),[matches])
  const cards=useMemo(()=>buildCards(matches,teams,playedMatches,totalGoals,highScoringMatches,goallessMatches,liveMatches,totalTeams,language),[matches,teams,playedMatches,totalGoals,highScoringMatches,goallessMatches,liveMatches,totalTeams,language])
  const updated=formatDateTime(updatedAt,language)

  useEffect(()=>{
    document.documentElement.lang=language
    document.title=language==='es'?'Estadisticas Mundial 2026':'World Cup 2026 Statistics'
  },[language])

  return <div className="statistics-shell">
    <header className="statistics-header">
      <a className="stats-brand" href="./index.html" aria-label={language==='es'?'Volver a partidos':'Back to matches'}>
        <span><Trophy aria-hidden="true"/></span>
        <div><h1>{language==='es'?'Estadisticas':'Statistics'}</h1><p>Mundial 2026</p></div>
      </a>
      <div className="header-actions">
        <a className="home-button" href="./index.html"><ArrowLeft aria-hidden="true"/>{language==='es'?'Inicio':'Home'}</a>
        <button className="statistics-language-globe" type="button" onClick={()=>setLanguage(language==='es'?'en':'es')} aria-label={language==='es'?'Cambiar idioma':'Change language'} title={language==='es'?'Cambiar idioma':'Change language'}>
          <Globe2 aria-hidden="true"/><span>{language.toUpperCase()}</span>
        </button>
      </div>
    </header>
    <main className="statistics-main">
      {sourceError ? <p className="stats-source-warning">{language==='es'?'No se pudo actualizar la fuente remota. Mostrando el ultimo dato disponible.':'Remote source could not be refreshed. Showing the latest available data.'}</p> : null}
      <section className="stats-grid">{cards.map(card=><StatTable key={card.title.es} card={card} language={language}/>)}</section>
      <footer className="stats-footer">
        <div className="stats-footer-pills">
          <div className="footer-pill">
            <Volleyball aria-hidden="true"/>
            <div><strong>{totalGoals}</strong><span>{language==='es'?'Goles reales':'Real goals'}</span></div>
          </div>
          <div className="footer-pill">
            <CalendarDays aria-hidden="true"/>
            <div><strong>{playedMatches}</strong><span>{language==='es'?'Partidos con marcador':'Matches scored'}</span></div>
          </div>
          <div className="footer-pill">
            <Clock aria-hidden="true"/>
            <div><strong>{liveMatches}</strong><span>{language==='es'?'En vivo':'Live'}</span></div>
          </div>
          <div className="footer-pill">
            <Users aria-hidden="true"/>
            <div><strong>{totalTeams}</strong><span>{language==='es'?'Selecciones':'Teams'}</span></div>
          </div>
        </div>
        <div className="stats-footer-update">
          <Clock aria-hidden="true"/>
          {language==='es'?'Actualizado':'Updated'}: {updated.dateText} · {updated.timeText}
          <small>OpenFootball CC0 · refresh 45s</small>
        </div>
      </footer>
    </main>
  </div>
}

const rootWindow = window as Window & { __statisticsRoot?: Root }
const root = rootWindow.__statisticsRoot ??= createRoot(document.getElementById('statistics-root')!)
root.render(<React.StrictMode><StatisticsApp/></React.StrictMode>)
