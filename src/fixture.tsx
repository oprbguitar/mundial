import React, { useEffect, useMemo, useReducer, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { CalendarDays, ChevronDown, Clock3, Info, Trophy } from 'lucide-react'
import { allGroupMatches, flagCodes, groupColors, matches, secondMatchday, teamNames, thirdMatchday, type Language, type Match } from './data'
import { copy } from './i18n'
import { getScoreSnapshot, refreshScores, subscribeToScore } from './worldcupScores'
import './fixture.css'

type FixtureMatchday = 'first'|'second'|'third'
type ZoneKey = 'official'|'peru'|'europe'
type ScoreMap = Record<string,string|null>

const zones = {
  official:{zone:'America/New_York',es:'Oficial Mundial',en:'World Official'},
  peru:{zone:'America/Lima',es:'Perú',en:'Peru'},
  europe:{zone:'Europe/Madrid',es:'Europa',en:'Europe'},
} as const

const fixtureCopy = {
  es:{back:'← Volver a fechas',rank:'Clasificación',played:'PJ',difference:'DG',points:'PTS',qualifies:'Clasifica',playoff:'Repechaje',out:'Eliminado',warning:'No se pudo actualizar. Se muestran los últimos marcadores disponibles.',updated:'Actualizado',date:'Fecha',timezone:'Horario'},
  en:{back:'← Back to matches',rank:'Standings',played:'P',difference:'GD',points:'PTS',qualifies:'Qualifies',playoff:'Playoff',out:'Eliminated',warning:'Update unavailable. Showing the latest saved scores.',updated:'Updated',date:'Matchday',timezone:'Time'},
} as const

const scheduleByDay:Record<FixtureMatchday,Match[]> = {first:matches,second:secondMatchday,third:thirdMatchday}

function Selector({value,onChange,label,children}:{value:string;onChange:(value:string)=>void;label:string;children:React.ReactNode}) {
  return <span className="fixture-select"><select value={value} onChange={event=>onChange(event.target.value)} aria-label={label}>{children}</select><ChevronDown aria-hidden="true"/></span>
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

type Standing={team:string;played:number;gf:number;ga:number;gd:number;points:number}

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

function GroupFixtureCard({group,rankingMatches,scoreMap,language}:{group:string;rankingMatches:Match[];scoreMap:ScoreMap;language:Language}) {
  const t=fixtureCopy[language]
  const standings=standingsFor(group,rankingMatches,scoreMap,language)
  return <article className="fixture-group-card">
    <header><span style={{background:groupColors[group]}}>{group}</span><h2>{copy[language].group} {group}</h2></header>
    <div className="standing-title">{t.rank}</div>
    <div className="standing-head"><span></span><span>{t.played}</span><span>{t.difference}</span><span>{t.points}</span><span></span></div>
    <ol className="standing-list">{standings.map((row,index)=><li key={row.team}>
      <span className="standing-team"><em>{index+1}</em><img src={`https://flagcdn.com/w40/${flagCodes[row.team]}.png`} alt=""/><b>{teamNames[row.team][language]}</b></span>
      <span>{row.played}</span><span>{row.gd>0?`+${row.gd}`:row.gd}</span><strong>{row.points}</strong>
      <small className={`rank-state state-${index+1}`}>{index<2?t.qualifies:index===2?t.playoff:t.out}</small>
    </li>)}</ol>
  </article>
}

function FixtureApp() {
  const [language,setLanguage]=useState<Language>('es')
  const [zone,setZone]=useState<ZoneKey>('official')
  const [matchday,setMatchday]=useState<FixtureMatchday>('second')
  const [warning,setWarning]=useState(false)
  const [lastUpdated,setLastUpdated]=useState<Date|null>(null)
  const scoreMap=useScores()
  const t=copy[language],ft=fixtureCopy[language]
  const visible=scheduleByDay[matchday]
  const rankingMatches=allGroupMatches
  const groups=useMemo(()=>Object.values(visible.reduce<Record<string,Match[]>>((result,match)=>{(result[match.group]??=[]).push(match);return result},{})),[visible])
  const days=visible.map(match=>Number(new Intl.DateTimeFormat('en',{day:'numeric',timeZone:zones[zone].zone}).format(new Date(match.dateTime))))
  const range=language==='es'?`${Math.min(...days)}–${Math.max(...days)} de junio de 2026`:`June ${Math.min(...days)}–${Math.max(...days)}, 2026`
  const subtitle=({first:t.subtitleFirst,second:t.subtitleSecond,third:t.subtitleThird})[matchday]

  useEffect(()=>{
    document.documentElement.lang=language
    document.title=`Fixture · ${t.title}`
  },[language,t.title])

  useEffect(()=>{
    let timer:number|undefined
    const run=()=>refreshScores(allGroupMatches).then(()=>{setWarning(false);setLastUpdated(new Date())}).catch(()=>setWarning(true))
    const start=()=>{if(timer===undefined){void run();timer=window.setInterval(run,5*60*1000)}}
    const stop=()=>{if(timer!==undefined){window.clearInterval(timer);timer=undefined}}
    const visibility=()=>document.visibilityState==='visible'?start():stop()
    document.addEventListener('visibilitychange',visibility);visibility()
    return ()=>{stop();document.removeEventListener('visibilitychange',visibility)}
  },[])

  return <div className="fixture-shell">
    <header className="fixture-header">
      <div className="fixture-brand"><span><Trophy aria-hidden="true"/></span><div><h1>{t.title}</h1><p>{subtitle}</p></div></div>
      <div className="fixture-controls">
        <a className="back-dates-btn" href="./index.html" aria-label={ft.back}>{ft.back}</a>
        <label className="fixture-control-compact"><Selector value={matchday} onChange={value=>setMatchday(value as FixtureMatchday)} label={t.dates}><option value="first">{t.first}</option><option value="second">{t.second}</option><option value="third">{t.third}</option></Selector></label>
        <label className="fixture-control-compact"><Selector value={zone} onChange={value=>setZone(value as ZoneKey)} label={t.viewTime}>{Object.entries(zones).map(([key,item])=><option key={key} value={key}>{item[language]}</option>)}</Selector></label>
        <div className="fixture-language" role="group" aria-label={t.language}><button className={language==='es'?'active':''} onClick={()=>setLanguage('es')}>ES</button><button className={language==='en'?'active':''} onClick={()=>setLanguage('en')}>EN</button></div>
      </div>
    </header>
    {warning?<div className="fixture-warning" role="status"><Info aria-hidden="true"/>{ft.warning}</div>:null}
    <main className="fixture-main"><section className="fixture-grid">{groups.map(group=><GroupFixtureCard key={group[0].group} group={group[0].group} rankingMatches={rankingMatches} scoreMap={scoreMap} language={language}/>)}</section></main>
    <footer className="fixture-footer">
      <div><Clock3 aria-hidden="true"/><span>{t.timePrefix}<strong>{t.localTime} ({zones[zone][language]})</strong></span></div>
      <div><CalendarDays aria-hidden="true"/><span>{t.dates}<strong>{range}</strong></span></div>
      <div className="fixture-live"><i></i><span>{t.follow}<strong>{t.more}</strong>{lastUpdated?<small>{ft.updated}: {lastUpdated.toLocaleTimeString(language==='es'?'es-PE':'en-US',{hour:'2-digit',minute:'2-digit'})}</small>:null}</span></div>
    </footer>
  </div>
}

createRoot(document.getElementById('fixture-root')!).render(<React.StrictMode><FixtureApp/></React.StrictMode>)