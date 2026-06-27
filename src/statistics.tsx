import React, { useEffect, useMemo, useReducer, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Activity, ArrowLeft, BarChart3, CalendarDays, Clock, Globe2, Goal, Handshake, Shield, ShieldCheck, Target, TrendingUp, Trophy, Users, Volleyball } from 'lucide-react'
import { allGroupMatches, flagCodes, teamNames, type Language, type Match } from './data'
import { disciplineByTeam, keeperByTeam, topAssists, topEfficiency, topSaves, topScorers, topShots } from './playerStats'
import { getFinalScoreSnapshot, getLiveScorers, startScoreRefresh, subscribeToScore, subscribeToScorers, type ScorerEntry } from './worldcupScores'
import './statistics.css'

type ScoreMap = Record<string,string|null>
type TeamStat = {
  team:string
  played:number
  wins:number
  draws:number
  losses:number
  gf:number
  ga:number
  gd:number
  points:number
  cleanSheets:number
}
type StatRow = {
  team:string
  player?:string
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

function readScores(fixtures:Match[]):ScoreMap {
  return Object.fromEntries(fixtures.map(match=>[match.id,getFinalScoreSnapshot(match)??null]))
}

function useScores() {
  const [,bump]=useReducer((value:number)=>value+1,0)
  useEffect(()=>{
    const unsubscribers=allGroupMatches.map(match=>subscribeToScore(match.id,bump))
    return ()=>unsubscribers.forEach(unsubscribe=>unsubscribe())
  },[])
  return readScores(allGroupMatches)
}

function useScorers() {
  const [,bump]=useReducer((value:number)=>value+1,0)
  useEffect(()=>subscribeToScorers(bump),[])
  return getLiveScorers()
}

function parseScore(score:string|null|undefined) {
  const match=score?.match(/^(\d+)\s*[-–]\s*(\d+)$/)
  return match ? [Number(match[1]),Number(match[2])] as const : null
}

function formatDateTime(date:Date,language:Language) {
  const locale=language==='es'?'es-PE':'en-US'
  const dateText=new Intl.DateTimeFormat(locale,{day:'2-digit',month:'long',year:'numeric',timeZone:'America/Lima'}).format(date)
  const timeText=new Intl.DateTimeFormat(locale,{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'America/Lima'}).format(date)
  return {dateText,timeText}
}

function buildTeamStats(scoreMap:ScoreMap) {
  const teams=[...new Set(allGroupMatches.flatMap(match=>[match.home,match.away]))]
  const table=new Map(teams.map(team=>[team,{team,played:0,wins:0,draws:0,losses:0,gf:0,ga:0,gd:0,points:0,cleanSheets:0} satisfies TeamStat]))
  let playedMatches=0,totalGoals=0,highScoringMatches=0,goallessMatches=0

  for(const match of allGroupMatches){
    const score=parseScore(scoreMap[match.id])
    if(!score) continue
    const [homeGoals,awayGoals]=score
    const matchTotal=homeGoals+awayGoals
    const home=table.get(match.home)!,away=table.get(match.away)!
    playedMatches++
    totalGoals+=matchTotal
    if(matchTotal>=3) highScoringMatches++
    if(matchTotal===0) goallessMatches++
    home.played++;away.played++
    home.gf+=homeGoals;home.ga+=awayGoals
    away.gf+=awayGoals;away.ga+=homeGoals
    if(homeGoals===0) away.cleanSheets++
    if(awayGoals===0) home.cleanSheets++
    if(homeGoals>awayGoals){home.wins++;away.losses++;home.points+=3}
    else if(awayGoals>homeGoals){away.wins++;home.losses++;away.points+=3}
    else{home.draws++;away.draws++;home.points++;away.points++}
  }
  table.forEach(row=>row.gd=row.gf-row.ga)
  return {teams:[...table.values()],playedMatches,totalGoals,highScoringMatches,goallessMatches,totalTeams:teams.length}
}

function topTeamRows(teams:TeamStat[],sorter:(a:TeamStat,b:TeamStat)=>number,value:(team:TeamStat)=>number|string,extra?:(team:TeamStat)=>Array<number|string>):StatRow[] {
  return [...teams].sort((a,b)=>sorter(a,b)||teamNames[a.team].es.localeCompare(teamNames[b.team].es)).slice(0,7).map(team=>({team:team.team,value:value(team),extra:extra?.(team)}))
}

function playerRows(entries:{player:string;team:string;value:number;extra?:Array<number|string>}[]):StatRow[] {
  return entries.map(e=>({team:e.team,player:e.player,value:e.value,extra:e.extra}))
}

function disciplineRows():StatRow[] {
  return disciplineByTeam.map(d=>({team:d.team,value:d.yellow,extra:[d.red]}))
}

// Clean sheets computed live from match results; keeper name from verified lookup, else country.
function cleanSheetRows(teams:TeamStat[]):StatRow[] {
  return teams.filter(t=>t.cleanSheets>0)
    .sort((a,b)=>b.cleanSheets-a.cleanSheets||b.gd-a.gd||teamNames[a.team].es.localeCompare(teamNames[b.team].es))
    .slice(0,7)
    .map(t=>({team:t.team,player:keeperByTeam[t.team],value:t.cleanSheets}))
}

function scorerRows(liveScorers:ScorerEntry[]|null):StatRow[] {
  return liveScorers && liveScorers.length ? liveScorers.map(s=>({team:s.team,player:s.player,value:s.value})) : playerRows(topScorers)
}

function buildCards(teams:TeamStat[],playedMatches:number,totalGoals:number,highScoringMatches:number,goallessMatches:number,liveScorers:ScorerEntry[]|null,language:Language):StatCard[] {
  const average=playedMatches?(totalGoals/playedMatches).toFixed(2):'0.00'
  const highPct=playedMatches?`${((highScoringMatches/playedMatches)*100).toFixed(1)}%`:'0.0%'
  const goallessPct=playedMatches?`${((goallessMatches/playedMatches)*100).toFixed(1)}%`:'0.0%'

  return [
    {
      icon:<Trophy aria-hidden="true"/>,
      title:{es:'Goleadores',en:'Top Scorers'},
      columns:{es:['Goles'],en:['Goals']},
      rows:scorerRows(liveScorers),
    },
    {
      icon:<Handshake aria-hidden="true"/>,
      title:{es:'Asistencias',en:'Assists'},
      columns:{es:['Asist.'],en:['Ast.']},
      rows:playerRows(topAssists),
    },
    {
      icon:<Shield aria-hidden="true"/>,
      title:{es:'Arqueros con más atajadas',en:'Most Saves'},
      columns:{es:['Atajadas'],en:['Saves']},
      rows:playerRows(topSaves),
    },
    {
      icon:<ShieldCheck aria-hidden="true"/>,
      title:{es:'Vallas invictas',en:'Clean Sheets'},
      columns:{es:['Partidos'],en:['Matches']},
      rows:cleanSheetRows(teams),
    },
    {
      icon:<Volleyball aria-hidden="true"/>,
      title:{es:'País con más goles',en:'Most Goals'},
      columns:{es:['Goles'],en:['Goals']},
      rows:topTeamRows(teams,(a,b)=>b.gf-a.gf||b.gd-a.gd,team=>team.gf),
    },
    {
      icon:<Activity aria-hidden="true"/>,
      title:{es:'Diferencia de goles',en:'Goal Difference'},
      columns:{es:['GF','GC','DG'],en:['GF','GA','GD']},
      rows:topTeamRows(teams.filter(t=>t.played>0),(a,b)=>b.gd-a.gd||b.gf-a.gf,team=>team.gf,team=>[team.ga,team.gd>0?`+${team.gd}`:team.gd]),
    },
    {
      icon:<Target aria-hidden="true"/>,
      title:{es:'Remates al arco',en:'Shots on Target'},
      columns:{es:['Rem.','Goles','%'],en:['Sht.','Goals','%']},
      rows:playerRows(topShots),
    },
    {
      icon:<BarChart3 aria-hidden="true"/>,
      title:{es:'Efectividad goleadora',en:'Scoring Efficiency'},
      columns:{es:['Goles','Rem.','%'],en:['Goals','Sht.','%']},
      rows:playerRows(topEfficiency.map(e=>({...e,value:e.extra![0] as number,extra:[e.value,e.extra![1]]}))),
    },
    {
      icon:<CardsIcon/>,
      title:{es:'Tarjetas (por selecciones)',en:'Cards (by country)'},
      columns:{es:['Amar.','Rojas'],en:['Yellow','Red']},
      rows:disciplineRows(),
    },
    {
      icon:<TrendingUp aria-hidden="true"/>,
      title:{es:'Promedio de goles por partido',en:'Goals per match'},
      rows:[],
      summaryRows:[
        {icon:<Volleyball aria-hidden="true"/>,label:{es:'Total de goles',en:'Total goals'},value:totalGoals},
        {icon:<CalendarDays aria-hidden="true"/>,label:{es:'Partidos jugados',en:'Matches played'},value:playedMatches},
        {icon:<Activity aria-hidden="true"/>,label:{es:'Promedio por partido',en:'Goals per match'},value:average},
        {icon:<BarChart3 aria-hidden="true"/>,label:{es:`Partidos con 3+ goles`,en:`Matches with 3+ goals`},value:`${highScoringMatches} (${highPct})`},
        {icon:<Goal aria-hidden="true"/>,label:{es:'Partidos sin goles',en:'Goalless matches'},value:`${goallessMatches} (${goallessPct})`},
      ],
    },
  ]
}

function CardsIcon() {
  return <span className="cards-icon" aria-hidden="true"><i/><i/></span>
}

function flagUrl(team:string) {
  return `https://flagcdn.com/w40/${flagCodes[team]}.png`
}

function displayName(team:string,language:Language) {
  return teamNames[team]?.[language] ?? team
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
          {card.rows.map((row,index)=><li key={`${card.title.es}-${row.team}-${row.player??''}-${index}`}>
            <span className="rank">{index+1}</span>
            <span className="stat-name"><img src={flagUrl(row.team)} alt=""/><b>{row.player??displayName(row.team,language)}</b></span>
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
  const [updatedAt,setUpdatedAt]=useState(()=>new Date())
  const scoreMap=useScores()
  const liveScorers=useScorers()
  const scoreSignature=useMemo(()=>Object.entries(scoreMap).map(([id,score])=>`${id}:${score ?? ''}`).join('|'),[scoreMap])
  const scorerSignature=useMemo(()=>(liveScorers ?? []).map(s=>`${s.team}:${s.player}:${s.value}`).join('|'),[liveScorers])
  const {teams,playedMatches,totalGoals,highScoringMatches,goallessMatches,totalTeams}=useMemo(()=>buildTeamStats(scoreMap),[scoreMap])
  const cards=useMemo(()=>buildCards(teams,playedMatches,totalGoals,highScoringMatches,goallessMatches,liveScorers,language),[teams,playedMatches,totalGoals,highScoringMatches,goallessMatches,scorerSignature,language])
  const updated=formatDateTime(updatedAt,language)

  useEffect(()=>{
    document.documentElement.lang=language
    document.title=language==='es'?'Estadísticas Mundial 2026':'World Cup 2026 Statistics'
  },[language])

  useEffect(()=>startScoreRefresh(allGroupMatches),[])
  useEffect(()=>setUpdatedAt(new Date()),[scoreSignature])

  return <div className="statistics-shell">
    <header className="statistics-header">
      <a className="stats-brand" href="./index.html" aria-label={language==='es'?'Volver a partidos':'Back to matches'}>
        <span><Trophy aria-hidden="true"/></span>
        <div><h1>{language==='es'?'Estadísticas':'Statistics'}</h1><p>Mundial 2026</p></div>
      </a>
      <div className="header-actions">
        <a className="home-button" href="./index.html"><ArrowLeft aria-hidden="true"/>{language==='es'?'Inicio':'Home'}</a>
        <button className="statistics-language-globe" type="button" onClick={()=>setLanguage(language==='es'?'en':'es')} aria-label={language==='es'?'Cambiar idioma':'Change language'} title={language==='es'?'Cambiar idioma':'Change language'}>
          <Globe2 aria-hidden="true"/><span>{language.toUpperCase()}</span>
        </button>
      </div>
    </header>
    <main className="statistics-main">
      <section className="stats-grid">{cards.map(card=><StatTable key={card.title.es} card={card} language={language}/>)}</section>
      <footer className="stats-footer">
        <div className="stats-footer-pills">
          <div className="footer-pill">
            <Volleyball aria-hidden="true"/>
            <div><strong>{totalGoals}</strong><span>{language==='es'?'Goles totales':'Total goals'}</span></div>
          </div>
          <div className="footer-pill">
            <CalendarDays aria-hidden="true"/>
            <div><strong>{playedMatches}</strong><span>{language==='es'?'Partidos jugados':'Matches played'}</span></div>
          </div>
          <div className="footer-pill">
            <Activity aria-hidden="true"/>
            <div><strong>{playedMatches?(totalGoals/playedMatches).toFixed(2):'0.00'}</strong><span>{language==='es'?'Goles/partido':'Goals/match'}</span></div>
          </div>
          <div className="footer-pill">
            <Users aria-hidden="true"/>
            <div><strong>{totalTeams}</strong><span>{language==='es'?'Selecciones':'Teams'}</span></div>
          </div>
        </div>
        <div className="stats-footer-update">
          <Clock aria-hidden="true"/>
          {language==='es'?'Actualizado':'Updated'}: {updated.dateText} · {updated.timeText}
        </div>
      </footer>
    </main>
  </div>
}

createRoot(document.getElementById('statistics-root')!).render(<React.StrictMode><StatisticsApp/></React.StrictMode>)
