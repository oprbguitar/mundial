import React, { useEffect, useMemo, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { BarChart3, CalendarDays, ChevronDown, Clock3, MapPin, Trophy } from 'lucide-react'
import { groupColors, matches, teamNames, type Host, type Language, type Match } from './data'
import { copy } from './i18n'
import { readCachedScores, refreshScores } from './worldcupScores'
import './styles.css'

const COFFEE_LINK = '#'

const zones = {
  peru: { zone: 'America/Lima', es: 'Perú', en: 'Peru' },
  official: { zone: 'America/New_York', es: 'Oficial Mundial', en: 'World Official' },
  europe: { zone: 'Europe/Madrid', es: 'Europa Central', en: 'Central Europe' },
  mexico: { zone: 'America/Mexico_City', es: 'México', en: 'Mexico' },
} as const
type ZoneKey = keyof typeof zones

const flagCodes: Record<string,string> = {
  Mexico:'mx', SouthAfrica:'za', SouthKorea:'kr', Czechia:'cz', Canada:'ca', Bosnia:'ba', Qatar:'qa', Switzerland:'ch',
  Brazil:'br', Morocco:'ma', Haiti:'ht', Scotland:'gb-sct', USA:'us', Paraguay:'py', Australia:'au', Turkey:'tr',
  Germany:'de', Curacao:'cw', IvoryCoast:'ci', Ecuador:'ec', Netherlands:'nl', Japan:'jp', Sweden:'se', Tunisia:'tn',
  Belgium:'be', Egypt:'eg', Iran:'ir', NewZealand:'nz', Spain:'es', CapeVerde:'cv', SaudiArabia:'sa', Uruguay:'uy',
  France:'fr', Senegal:'sn', Iraq:'iq', Norway:'no', Argentina:'ar', Algeria:'dz', Austria:'at', Jordan:'jo',
  Portugal:'pt', DRCCongo:'cd', Uzbekistan:'uz', Colombia:'co', England:'gb-eng', Croatia:'hr', Ghana:'gh', Panama:'pa',
}

function dateParts(match: Match, zone: ZoneKey, language: Language) {
  const locale = language === 'es' ? 'es-ES' : 'en-US'
  const date = new Date(match.dateTime)
  return {
    day: new Intl.DateTimeFormat(locale, { day:'numeric', timeZone:zones[zone].zone }).format(date),
    short: new Intl.DateTimeFormat(locale, { day:'numeric', month:'short', timeZone:zones[zone].zone }).format(date).replace('.', ''),
    time: new Intl.DateTimeFormat(locale, { hour:'2-digit', minute:'2-digit', hour12:false, timeZone:zones[zone].zone }).format(date),
    date,
  }
}

function Selector({ value, onChange, label, children, className='' }: { value:string; onChange:(v:string)=>void; label:string; children:React.ReactNode; className?:string }) {
  return <span className={`select-wrap ${className}`}><select aria-label={label} value={value} onChange={e=>onChange(e.target.value)}>{children}</select><ChevronDown aria-hidden="true" /></span>
}

function MatchRow({ match, language, zone, liveScore }: { match: Match; language:Language; zone:ZoneKey; liveScore?:string }) {
  const t = copy[language]
  const score = liveScore ?? match.score
  return <div className="match-row">
    <span className={`status-dot ${match.status}`} aria-label={t[match.status]} />
    <span className="team home"><img className="flag" src={`https://flagcdn.com/w40/${flagCodes[match.home]}.png`} alt=""/><span>{teamNames[match.home][language]}</span></span>
    <span className="versus">{t.vs}</span>
    <span className="team away"><img className="flag" src={`https://flagcdn.com/w40/${flagCodes[match.away]}.png`} alt=""/><span>{teamNames[match.away][language]}</span></span>
    <span className="match-time"><Clock3 aria-hidden="true" />{dateParts(match,zone,language).time}</span>
    <span className={`score ${score ? 'done' : ''}`}>{score ?? '– –'}</span>
  </div>
}

function GroupCard({ groupMatches, language, zone, scores }: { groupMatches: Match[]; language:Language; zone:ZoneKey; scores:Record<string,string> }) {
  const group = groupMatches[0].group
  const dates = [...new Set(groupMatches.map(match=>dateParts(match,zone,language).short))]
  const venue = groupMatches[0]
  return <article className="group-card">
    <header className="card-header">
      <span className="group-badge" style={{background:groupColors[group]}}>{group}</span>
      <h2>{copy[language].group} {group}</h2>
      <strong>{dates.join('–')}</strong>
    </header>
    <div className="matches">{groupMatches.map(match=><MatchRow key={match.id} match={match} language={language} zone={zone} liveScore={scores[match.id]}/>)}</div>
    <footer className="venue"><MapPin aria-hidden="true"/><span>{venue.stadium}, {venue.city}</span></footer>
  </article>
}

function App() {
  const [language,setLanguage] = useState<Language>('es')
  const [host,setHost] = useState<Host>('all')
  const [zone,setZone] = useState<ZoneKey>('peru')
  const [matchday,setMatchday] = useState('first')
  const [scores,setScores] = useState<Record<string,string>>(()=>readCachedScores() ?? {})
  const t = copy[language]
  const visible = useMemo(()=>matchday === 'first' ? matches.filter(match=>host === 'all' || match.host === host) : [],[host,matchday])
  const groups = useMemo(()=>Object.values(visible.reduce<Record<string,Match[]>>((acc,match)=>{(acc[match.group]??=[]).push(match); return acc},{})),[visible])
  const range = useMemo(()=>{
    if (!visible.length) return language === 'es' ? '11–17 de junio de 2026' : 'June 11–17, 2026'
    const days = visible.map(match=>Number(dateParts(match,zone,language).day))
    const min=Math.min(...days), max=Math.max(...days)
    return language === 'es' ? `${min}–${max} de junio de 2026` : `June ${min}–${max}, 2026`
  },[visible,zone,language])
  const zoneName = zones[zone][language]

  useEffect(()=>{
    let active = true
    refreshScores(matches).then(nextScores=>{ if (active) setScores(nextScores) }).catch(()=>{})
    return ()=>{ active = false }
  },[])

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand">
        <span className="trophy-mark"><Trophy aria-hidden="true"/></span>
        <div><h1>{t.title}</h1><p>{t.subtitle}</p></div>
      </div>
      <div className="controls">
        <div className="control timezone"><label>{t.viewTime}</label><Selector value={zone} onChange={v=>setZone(v as ZoneKey)} label={t.viewTime} className="dark-select">
          {Object.entries(zones).map(([key,item])=><option key={key} value={key}>{item[language]}</option>)}
        </Selector></div>
        <div className="control language"><label>{t.language}</label><div className="segments" role="group" aria-label={t.language}>
          <button className={language==='es'?'active':''} onClick={()=>setLanguage('es')}>Español</button><button className={language==='en'?'active':''} onClick={()=>setLanguage('en')}>English</button>
        </div></div>
        <div className="control host"><label>{t.host}</label><div className="segments host-segments" role="group" aria-label={t.host}>
          {([['all',t.all],['Mexico',t.mexico],['USA',t.usa],['Canada',t.canada]] as [Host,string][]).map(([key,label])=><button key={key} className={`${host===key?'active ':''}${key.toLowerCase()}`} onClick={()=>setHost(key)}>{label}</button>)}
        </div></div>
        <a className="coffee-button" href={COFFEE_LINK} target="_blank" rel="noreferrer" aria-label={t.coffee}><span aria-hidden="true">☕</span><span className="coffee-label">{t.coffee}</span></a>
      </div>
    </header>

    <main>
      <div className="legend" aria-label="Match status">
        <span><i className="status-dot scheduled"/>{t.scheduled}</span><span><i className="status-dot live"/>{t.live}</span><span><i className="status-dot finished"/>{t.finished}</span>
      </div>
      {groups.length ? <section className={`groups-grid ${groups.length < 4 ? 'filtered' : ''}`}>{groups.map(group=><GroupCard key={group[0].group} groupMatches={group} language={language} zone={zone} scores={scores}/>)}</section> : <section className="empty-state"><CalendarDays/><strong>{matchday==='second'?t.coming:t.noMatches}</strong></section>}
    </main>

    <footer className="bottom-panel">
      <div className="footer-block local"><Clock3/><p>{t.timePrefix} <strong>{t.localTime} ({zoneName})</strong></p></div>
      <div className="footer-block notice"><span className="stadium-icon">◉</span><p>{t.notice}</p></div>
      <div className="date-control"><strong>{t.dates}</strong><Selector value={matchday} onChange={setMatchday} label={t.dates}><option value="first">{t.first}</option><option value="second">{t.second}</option></Selector><p><CalendarDays/>{range}</p></div>
      <div className="footer-block follow"><span className="chart-icon"><BarChart3/></span><p>{t.follow}<strong>{t.more}</strong><small className="data-source">Data: OpenFootball CC0</small></p></div>
    </footer>
  </div>
}

const rootWindow = window as Window & { __partidosRoot?: Root }
const root = rootWindow.__partidosRoot ??= createRoot(document.getElementById('root')!)
root.render(<React.StrictMode><App/></React.StrictMode>)
