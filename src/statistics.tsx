import React, { useEffect, useMemo, useReducer, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Activity, ArrowLeft, BarChart3, CalendarDays, Goal, Shield, Trophy, Users, Volleyball } from 'lucide-react'
import { allGroupMatches, flagCodes, teamNames, type Language, type Match } from './data'
import { getScoreSnapshot, refreshScores, subscribeToScore } from './worldcupScores'
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
  value:number|string
  extra?:Array<number|string>
}
type StatCard = {
  icon:React.ReactNode
  title:{es:string;en:string}
  columns?:{es:string[];en:string[]}
  rows:StatRow[]
}

function readScores(fixtures:Match[]):ScoreMap {
  return Object.fromEntries(fixtures.map(match=>[match.id,getScoreSnapshot(match.id)??match.score]))
}

function useScores() {
  const [,bump]=useReducer((value:number)=>value+1,0)
  useEffect(()=>{
    const unsubscribers=allGroupMatches.map(match=>subscribeToScore(match.id,bump))
    return ()=>unsubscribers.forEach(unsubscribe=>unsubscribe())
  },[])
  return readScores(allGroupMatches)
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
  let playedMatches=0,totalGoals=0

  for(const match of allGroupMatches){
    const score=parseScore(scoreMap[match.id])
    if(!score) continue
    const [homeGoals,awayGoals]=score
    const home=table.get(match.home)!,away=table.get(match.away)!
    playedMatches++
    totalGoals+=homeGoals+awayGoals
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
  return {teams:[...table.values()],playedMatches,totalGoals,totalTeams:teams.length}
}

function topRows(teams:TeamStat[],sorter:(a:TeamStat,b:TeamStat)=>number,value:(team:TeamStat)=>number|string,extra?:(team:TeamStat)=>Array<number|string>) {
  return [...teams].sort((a,b)=>sorter(a,b)||teamNames[a.team].es.localeCompare(teamNames[b.team].es)).slice(0,8).map(team=>({team:team.team,value:value(team),extra:extra?.(team)}))
}

function buildCards(teams:TeamStat[],scoreMap:ScoreMap):StatCard[] {
  return [
    {
      icon:<Volleyball aria-hidden="true"/>,
      title:{es:'Países con más goles',en:'Countries with most goals'},
      rows:topRows(teams,(a,b)=>b.gf-a.gf||b.gd-a.gd,team=>team.gf),
    },
    {
      icon:<Activity aria-hidden="true"/>,
      title:{es:'Diferencia de goles',en:'Goal difference'},
      columns:{es:['PJ','GF','GC','DG'],en:['P','GF','GA','GD']},
      rows:topRows(teams,(a,b)=>b.gd-a.gd||b.gf-a.gf,team=>team.played,team=>[team.gf,team.ga,team.gd>0?`+${team.gd}`:team.gd]),
    },
    {
      icon:<Trophy aria-hidden="true"/>,
      title:{es:'Más puntos',en:'Most points'},
      columns:{es:['PJ','PTS'],en:['P','PTS']},
      rows:topRows(teams,(a,b)=>b.points-a.points||b.gd-a.gd||b.gf-a.gf,team=>team.played,team=>[team.points]),
    },
    {
      icon:<Goal aria-hidden="true"/>,
      title:{es:'Más victorias',en:'Most wins'},
      columns:{es:['PJ','G','E','P'],en:['P','W','D','L']},
      rows:topRows(teams,(a,b)=>b.wins-a.wins||b.points-a.points||b.gd-a.gd,team=>team.played,team=>[team.wins,team.draws,team.losses]),
    },
    {
      icon:<Shield aria-hidden="true"/>,
      title:{es:'Mejor defensa',en:'Best defense'},
      columns:{es:['PJ','GC'],en:['P','GA']},
      rows:topRows(teams.filter(team=>team.played>0),(a,b)=>a.ga-b.ga||b.gd-a.gd||b.points-a.points,team=>team.played,team=>[team.ga]),
    },
    {
      icon:<Shield aria-hidden="true"/>,
      title:{es:'Vallas invictas',en:'Clean sheets'},
      columns:{es:['PJ','VI'],en:['P','CS']},
      rows:topRows(teams,(a,b)=>b.cleanSheets-a.cleanSheets||a.ga-b.ga||b.points-a.points,team=>team.played,team=>[team.cleanSheets]),
    },
    {
      icon:<BarChart3 aria-hidden="true"/>,
      title:{es:'Promedio goleador',en:'Scoring average'},
      columns:{es:['PJ','GF','Prom.'],en:['P','GF','Avg.']},
      rows:topRows(teams.filter(team=>team.played>0),(a,b)=>(b.gf/b.played)-(a.gf/a.played)||b.gf-a.gf,team=>team.played,team=>[team.gf,(team.gf/team.played).toFixed(2)]),
    },
    {
      icon:<Activity aria-hidden="true"/>,
      title:{es:'Partidos con más goles',en:'Highest-scoring matches'},
      columns:{es:['Marcador'],en:['Score']},
      rows:[...allGroupMatches].flatMap(match=>{
        const score=parseScore(scoreMap[match.id] ?? match.score)
        return score ? [{team:`${match.home}__${match.away}`,value:`${score[0]}-${score[1]} · ${score[0]+score[1]}`}] : []
      }).sort((a,b)=>Number(String(b.value).split(' · ')[1]??0)-Number(String(a.value).split(' · ')[1]??0)).slice(0,8),
    },
    {
      icon:<Goal aria-hidden="true"/>,
      title:{es:'Menos goles recibidos',en:'Fewest goals conceded'},
      columns:{es:['PJ','GC'],en:['P','GA']},
      rows:topRows(teams.filter(team=>team.played>0),(a,b)=>a.ga-b.ga||b.points-a.points,team=>team.played,team=>[team.ga]),
    },
    {
      icon:<PercentIcon/>,
      title:{es:'Rendimiento de puntos',en:'Points efficiency'},
      columns:{es:['PJ','PTS','%'],en:['P','PTS','%']},
      rows:topRows(teams.filter(team=>team.played>0),(a,b)=>(b.points/(b.played*3))-(a.points/(a.played*3))||b.points-a.points,team=>team.played,team=>[team.points,`${Math.round((team.points/(team.played*3))*100)}%`]),
    },
  ]
}

function PercentIcon() {
  return <span className="percent-icon" aria-hidden="true">%</span>
}

function flagUrl(team:string) {
  return `https://flagcdn.com/w40/${flagCodes[team]}.png`
}

function displayName(team:string,language:Language) {
  if(team.includes('__')){
    const [home,away]=team.split('__')
    return `${teamNames[home][language]} vs ${teamNames[away][language]}`
  }
  return teamNames[team][language]
}

function flagFor(team:string) {
  return team.includes('__') ? team.split('__')[0] : team
}

function StatTable({card,language}:{card:StatCard;language:Language}) {
  const columns=card.columns?.[language]
  return <article className="stat-card">
    <header>
      <span className="stat-icon">{card.icon}</span>
      <h2>{card.title[language]}</h2>
    </header>
    {columns ? <div className={`stat-columns cols-${columns.length}`}>{columns.map(column=><span key={column}>{column}</span>)}</div> : null}
    <ol className={`stat-list ${columns ? `with-extra extras-${columns.length}` : ''}`}>
      {card.rows.map((row,index)=><li key={`${card.title.es}-${row.team}`}>
        <span className="rank">{index+1}</span>
        <span className="stat-name"><img src={flagUrl(flagFor(row.team))} alt=""/><b>{displayName(row.team,language)}</b></span>
        <strong>{row.value}</strong>
        {row.extra?.map((value,itemIndex)=><strong key={itemIndex}>{value}</strong>)}
      </li>)}
    </ol>
  </article>
}

function StatisticsApp() {
  const [language,setLanguage]=useState<Language>('es')
  const [updatedAt,setUpdatedAt]=useState(()=>new Date())
  const scoreMap=useScores()
  const {teams,playedMatches,totalGoals,totalTeams}=useMemo(()=>buildTeamStats(scoreMap),[scoreMap])
  const cards=useMemo(()=>buildCards(teams,scoreMap),[teams,scoreMap])
  const average=playedMatches ? (totalGoals/playedMatches).toFixed(2) : '0.00'
  const updated=formatDateTime(updatedAt,language)

  useEffect(()=>{
    document.documentElement.lang=language
    document.title=language==='es'?'Estadísticas Mundial 2026':'World Cup 2026 Statistics'
  },[language])

  useEffect(()=>{
    let disposed=false
    refreshScores(allGroupMatches).finally(()=>{if(!disposed)setUpdatedAt(new Date())})
    return ()=>{disposed=true}
  },[])

  return <div className="statistics-shell">
    <header className="statistics-header">
      <a className="stats-brand" href="./index.html" aria-label={language==='es'?'Volver a partidos':'Back to matches'}>
        <span><Trophy aria-hidden="true"/></span>
        <div><h1>{language==='es'?'Estadísticas':'Statistics'}</h1><p>Mundial 2026</p></div>
      </a>
      <div className="header-actions">
        <a className="home-button" href="./index.html"><ArrowLeft aria-hidden="true"/>{language==='es'?'Inicio':'Home'}</a>
        <div className="statistics-language">
          <span>{language==='es'?'Idioma':'Language'}</span>
          <div role="group" aria-label={language==='es'?'Idioma':'Language'}>
            <button className={language==='es'?'active':''} onClick={()=>setLanguage('es')}>Español</button>
            <button className={language==='en'?'active':''} onClick={()=>setLanguage('en')}>English</button>
          </div>
        </div>
      </div>
    </header>
    <main className="statistics-main">
      <section className="stats-grid">{cards.map(card=><StatTable key={card.title.es} card={card} language={language}/>)}</section>
      <section className="summary-panel" aria-label={language==='es'?'Resumen del torneo':'Tournament summary'}>
        <article><span className="summary-icon"><Volleyball aria-hidden="true"/></span><div><small>{language==='es'?'Resumen real':'Live summary'}</small><strong>{totalGoals}</strong><p>{language==='es'?'goles anotados':'goals scored'}</p></div></article>
        <article><span className="summary-icon"><Goal aria-hidden="true"/></span><div><strong>{playedMatches}</strong><p>{language==='es'?'partidos jugados':'matches played'}</p></div></article>
        <article><span className="summary-icon"><Activity aria-hidden="true"/></span><div><strong>{average}</strong><p>{language==='es'?'promedio de goles por partido':'average goals per match'}</p></div></article>
        <article><span className="summary-icon"><Users aria-hidden="true"/></span><div><strong>{totalTeams}</strong><p>{language==='es'?'selecciones participantes':'participating teams'}</p></div></article>
        <article><span className="summary-icon"><CalendarDays aria-hidden="true"/></span><div><small>{language==='es'?'Actualizado':'Updated'}</small><strong>{updated.dateText}</strong><p>{updated.timeText} {language==='es'?'(Hora local)':'(Local time)'}</p></div></article>
      </section>
    </main>
  </div>
}

createRoot(document.getElementById('statistics-root')!).render(<React.StrictMode><StatisticsApp/></React.StrictMode>)
