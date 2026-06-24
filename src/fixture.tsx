import React, { useEffect, useMemo, useReducer, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Info, Trophy } from 'lucide-react'
import { allGroupMatches, flagCodes, groupColors, teamNames, type Language, type Match } from './data'
import { copy } from './i18n'
import { getScoreSnapshot, refreshScores, subscribeToScore } from './worldcupScores'
import './fixture.css'

type ScoreMap = Record<string,string|null>
type Movement = 'up'|'down'|'same'
type TeamStatus = 'qualified'|'best-third'|'out-of-zone'|'eliminated'

const RANKING_STORAGE_KEY = 'partidos-2026-fixture-rankings'

const fixtureCopy = {
  es:{
    back:'← Volver a partidos',
    played:'PJ',
    difference:'DG',
    points:'PTS',
    qualifies:'Clasifica',
    bestThird:'Mejor tercero',
    outOfZone:'Fuera de zona',
    out:'Eliminado',
    info:'Formato 2026: clasifican el 1.º y 2.º de cada grupo. De los 12 terceros, solo los 8 mejores avanzan a dieciseisavos. Los otros 4 terceros y los 4.º puestos quedan eliminados.',
    legend:'PJ = partidos jugados · DG = diferencia de goles · PTS = puntos',
    warning:'No se pudo actualizar. Se muestran los últimos marcadores disponibles.',
  },
  en:{
    back:'← Back to matches',
    played:'P',
    difference:'GD',
    points:'PTS',
    qualifies:'Qualified',
    bestThird:'Best third',
    outOfZone:'Out of zone',
    out:'Eliminated',
    info:'2026 format: the 1st and 2nd placed teams in each group qualify. Among the 12 third-placed teams, only the best 8 advance to the Round of 32. The remaining 4 third-placed teams and all 4th placed teams are eliminated.',
    legend:'P = played · GD = goal difference · PTS = points',
    warning:'Update unavailable. Showing the latest saved scores.',
  },
} as const

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

type Standing={team:string;played:number;gf:number;ga:number;gd:number;points:number}
type RankedStanding = Standing & {rank:number;group:string;status:TeamStatus;movement:Movement}
type GroupStandings = Record<string,Standing[]>

function standingsFor(group:string,relevantMatches:Match[],scoreMap:ScoreMap,language:Language) {
  const teams=[...new Set(allGroupMatches.filter(match=>match.group===group).flatMap(match=>[match.home,match.away]))]
  const table=new Map(teams.map(team=>[team,{team,played:0,gf:0,ga:0,gd:0,points:0} satisfies Standing]))
  const playedMatches=relevantMatches.filter(match=>match.group===group).flatMap(match=>{
    const score=parseScore(scoreMap[match.id])
    if (!score) return []
    const [homeGoals,awayGoals]=score
    const home=table.get(match.home)!,away=table.get(match.away)!
    home.played++;away.played++;home.gf+=homeGoals;home.ga+=awayGoals;away.gf+=awayGoals;away.ga+=homeGoals
    if(homeGoals>awayGoals)home.points+=3
    else if(awayGoals>homeGoals)away.points+=3
    else{home.points++;away.points++}
    return [{match,homeGoals,awayGoals}]
  })
  table.forEach(row=>row.gd=row.gf-row.ga)
  const headToHead=(a:string,b:string)=>{
    let aPoints=0,bPoints=0
    for(const result of playedMatches){
      const {match,homeGoals,awayGoals}=result
      if(!((match.home===a&&match.away===b)||(match.home===b&&match.away===a)))continue
      if(homeGoals===awayGoals){aPoints++;bPoints++}
      else if((match.home===a&&homeGoals>awayGoals)||(match.away===a&&awayGoals>homeGoals))aPoints+=3
      else bPoints+=3
    }
    return bPoints-aPoints
  }
  return [...table.values()].sort((a,b)=>b.points-a.points||b.gd-a.gd||b.gf-a.gf||headToHead(a.team,b.team)||teamNames[a.team][language].localeCompare(teamNames[b.team][language]))
}

function compareStanding(a:Standing,b:Standing) {
  return b.points-a.points||b.gd-a.gd||b.gf-a.gf||a.team.localeCompare(b.team)
}

function calculateAllGroupStandings(scoreMap:ScoreMap,language:Language):GroupStandings {
  const groupLetters=[...new Set(allGroupMatches.map(match=>match.group))].sort()
  return Object.fromEntries(groupLetters.map(group=>[group,standingsFor(group,allGroupMatches,scoreMap,language)]))
}

function getThirdPlacedTeams(groups:GroupStandings) {
  return Object.entries(groups).flatMap(([group,rows])=>rows[2] ? [{...rows[2],group}] : [])
}

function rankBestThirds(thirdPlacedTeams:(Standing & {group:string})[]) {
  return [...thirdPlacedTeams].sort((a,b)=>compareStanding(a,b)||a.group.localeCompare(b.group))
}

function applyQualificationStatus(groups:GroupStandings,previous:Record<string,number>) {
  const bestThirdTeams=new Set(rankBestThirds(getThirdPlacedTeams(groups)).slice(0,8).map(row=>row.team))
  return Object.fromEntries(Object.entries(groups).map(([group,rows])=>[group,rows.map((row,index)=>{
    const rank=index+1
    const status:TeamStatus = rank<3 ? 'qualified' : rank===3 ? bestThirdTeams.has(row.team) ? 'best-third' : 'out-of-zone' : 'eliminated'
    return {...row,rank,group,status,movement:getMovement(previous,group,row.team,rank)}
  })]))
}

function readPreviousRanking():Record<string,number> {
  try {
    const parsed=JSON.parse(localStorage.getItem(RANKING_STORAGE_KEY) ?? '{}')
    return parsed && typeof parsed==='object' ? parsed as Record<string,number> : {}
  } catch { return {} }
}

function saveCurrentRanking(groups:Record<string,Standing[]>) {
  try {
    const ranking=Object.fromEntries(Object.entries(groups).flatMap(([group,rows])=>rows.map((row,index)=>[`${group}:${row.team}`,index+1])))
    localStorage.setItem(RANKING_STORAGE_KEY,JSON.stringify(ranking))
  } catch {}
}

function getMovement(previous:Record<string,number>,group:string,team:string,currentRank:number):Movement {
  const last=previous[`${group}:${team}`]
  if (!last || last===currentRank) return 'same'
  return last>currentRank ? 'up' : 'down'
}

function statusLabel(status:TeamStatus,language:Language) {
  const t=fixtureCopy[language]
  if (status==='qualified') return t.qualifies
  if (status==='best-third') return t.bestThird
  if (status==='out-of-zone') return t.outOfZone
  return t.out
}

function movementLabel(movement:Movement) {
  return movement==='up' ? '▲' : movement==='down' ? '▼' : '–'
}

function GroupFixtureCard({group,standings,language}:{group:string;standings:RankedStanding[];language:Language}) {
  const t=fixtureCopy[language]
  return <article className="fixture-group-card">
    <header><span style={{background:groupColors[group]}}>{group}</span><h2>{copy[language].group} {group}</h2></header>
    <div className="standing-head"><span></span><span>{t.played}</span><span>{t.difference}</span><span>{t.points}</span><span></span><span></span></div>
    <ol className="standing-list">{standings.map(row=><li key={row.team} className={row.rank===1?'leader':''}>
      <span className="standing-team"><em>{row.rank}</em><img src={`https://flagcdn.com/w40/${flagCodes[row.team]}.png`} alt=""/><b>{teamNames[row.team][language]}</b></span>
      <span>{row.played}</span><span>{row.gd>0?`+${row.gd}`:row.gd}</span><strong>{row.points}</strong>
      <small className={`rank-state state-${row.status}`}>{statusLabel(row.status,language)}</small>
      <i className={`movement movement-${row.movement}`} aria-label={row.movement}>{movementLabel(row.movement)}</i>
    </li>)}</ol>
  </article>
}

function FixtureApp() {
  const [language,setLanguage]=useState<Language>('es')
  const [warning,setWarning]=useState(false)
  const scoreMap=useScores()
  const t=copy[language],ft=fixtureCopy[language]
  const groupedStandings=useMemo(()=>{
    const previous=readPreviousRanking()
    return applyQualificationStatus(calculateAllGroupStandings(scoreMap,language),previous)
  },[scoreMap,language])

  useEffect(()=>{saveCurrentRanking(groupedStandings)},[groupedStandings])

  useEffect(()=>{
    document.documentElement.lang=language
    document.title=`Fixture · ${t.title}`
  },[language,t.title])

  useEffect(()=>{
    let timer:number|undefined
    let running=false
    const run=async()=>{
      if(running) return
      running=true
      try{
        await refreshScores(allGroupMatches)
        setWarning(false)
      }catch{
        setWarning(true)
      }finally{
        running=false
      }
    }
    const start=()=>{
      if(document.visibilityState!=='visible') return
      void run()
      if(timer===undefined) timer=window.setInterval(()=>void run(),5*60*1000)
    }
    const stop=()=>{if(timer!==undefined){window.clearInterval(timer);timer=undefined}}
    const visibility=()=>document.visibilityState==='visible'?start():stop()
    document.addEventListener('visibilitychange',visibility)
    window.addEventListener('focus',start)
    window.addEventListener('pageshow',start)
    window.addEventListener('online',start)
    start()
    return ()=>{
      stop()
      document.removeEventListener('visibilitychange',visibility)
      window.removeEventListener('focus',start)
      window.removeEventListener('pageshow',start)
      window.removeEventListener('online',start)
    }
  },[])

  return <div className="fixture-shell">
    <header className="fixture-header">
      <div className="fixture-brand"><span><Trophy aria-hidden="true"/></span><div><h1>{t.title}</h1></div></div>
      <div className="fixture-controls">
        <a className="back-dates-btn" href="./index.html" aria-label={ft.back}>{ft.back}</a>
        <div className="fixture-language" role="group" aria-label={t.language}><button className={language==='es'?'active':''} onClick={()=>setLanguage('es')}>ES</button><button className={language==='en'?'active':''} onClick={()=>setLanguage('en')}>EN</button></div>
      </div>
    </header>
    {warning?<div className="fixture-warning" role="status"><Info aria-hidden="true"/>{ft.warning}</div>:null}
    <main className="fixture-main">
      <section className="fixture-info"><Info aria-hidden="true"/><p>{ft.info}</p></section>
      <p className="fixture-legend">{ft.legend}</p>
      <section className="fixture-grid">{Object.entries(groupedStandings).map(([group,standings])=><GroupFixtureCard key={group} group={group} standings={standings} language={language}/>)}</section>
    </main>
  </div>
}

createRoot(document.getElementById('fixture-root')!).render(<React.StrictMode><FixtureApp/></React.StrictMode>)
