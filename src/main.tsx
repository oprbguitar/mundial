import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { BarChart3, CalendarDays, ChevronDown, Clock3, MapPin, Trophy } from 'lucide-react'
import { allGroupMatches, groupColors, matches, secondMatchday, teamNames, thirdMatchday, type Language, type Match, type Matchday } from './data'
import { copy } from './i18n'
import { readCachedScores, refreshScores } from './worldcupScores'
import { getMatchStatus, getMinuteSnapshot, subscribeToMinute } from './matchStatus'
import { MatchDetailsModal } from './MatchDetailsModal'
import './styles.css'

const YAPE_NUMBER = '973337773'
const PAYPAL_ME_URL = 'https://paypal.me/oprb'

const zones = {
  official: { zone: 'America/New_York', es: 'Oficial Mundial', en: 'World Official' },
  peru: { zone: 'America/Lima', es: 'Perú', en: 'Peru' },
  europe: { zone: 'Europe/Madrid', es: 'Europa', en: 'Europe' },
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

function MatchStatusDot({ match, score, language }: { match:Match; score:string|null|undefined; language:Language }) {
  const now = useSyncExternalStore(subscribeToMinute,getMinuteSnapshot,getMinuteSnapshot)
  const status = getMatchStatus(match,score,now)
  return <span className={`status-dot ${status}`} aria-label={copy[language][status]} />
}

function MatchRow({ match, language, zone, liveScore, onOpen }: { match: Match; language:Language; zone:ZoneKey; liveScore?:string; onOpen:()=>void }) {
  const t = copy[language]
  const score = liveScore ?? match.score
  return <div className="match-row interactive-match" role="button" tabIndex={0} onClick={event=>{event.stopPropagation();onOpen()}} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onOpen()}}}>
    <MatchStatusDot match={match} score={score} language={language}/>
    <span className="team home"><img className="flag" src={`https://flagcdn.com/w40/${flagCodes[match.home]}.png`} alt=""/><span>{teamNames[match.home][language]}</span></span>
    <span className="versus">{t.vs}</span>
    <span className="team away"><img className="flag" src={`https://flagcdn.com/w40/${flagCodes[match.away]}.png`} alt=""/><span>{teamNames[match.away][language]}</span></span>
    <span className="match-time"><Clock3 aria-hidden="true" />{dateParts(match,zone,language).time}</span>
    <span className={`score ${score ? 'done' : ''}`}>{score ?? '– –'}</span>
  </div>
}

function GroupCard({ groupMatches, language, zone, scores, onOpen }: { groupMatches: Match[]; language:Language; zone:ZoneKey; scores:Record<string,string>; onOpen:(match:Match)=>void }) {
  const group = groupMatches[0].group
  const dates = [...new Set(groupMatches.map(match=>dateParts(match,zone,language).short))]
  const venues = [...new Set(groupMatches.map(match=>[match.stadium,match.city].filter(Boolean).join(', ')))]
  return <article className="group-card interactive-card" role="button" tabIndex={0} onClick={()=>onOpen(groupMatches[0])} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onOpen(groupMatches[0])}}}>
    <header className="card-header">
      <span className="group-badge" style={{background:groupColors[group]}}>{group}</span>
      <h2>{copy[language].group} {group}</h2>
      <strong>{dates.join('–')}</strong>
    </header>
    <div className="matches">{groupMatches.map(match=><MatchRow key={match.id} match={match} language={language} zone={zone} liveScore={scores[match.id]} onOpen={()=>onOpen(match)}/>)}</div>
    <footer className="venue"><MapPin aria-hidden="true"/><span>{venues.join(' · ')}</span></footer>
  </article>
}

type KnockoutStage = {
  key:'round32'|'round16'|'quarterfinals'|'semifinals'|'thirdPlace'|'final'
  badge:string
  es:string
  en:string
  venue?:string
}

const knockoutStages: readonly KnockoutStage[] = [
  { key:'round32', badge:'32', es:'28 jun–3 jul', en:'Jun 28–Jul 3' },
  { key:'round16', badge:'16', es:'4–7 jul', en:'Jul 4–7' },
  { key:'quarterfinals', badge:'QF', es:'9–11 jul', en:'Jul 9–11' },
  { key:'semifinals', badge:'SF', es:'14–15 jul', en:'Jul 14–15' },
  { key:'thirdPlace', badge:'3', es:'18 jul', en:'Jul 18' },
  { key:'final', badge:'F', es:'19 jul', en:'Jul 19', venue:'New York New Jersey Stadium' },
]

function KnockoutCard({ stage, language }: { stage: KnockoutStage; language:Language }) {
  const t = copy[language]
  const title = t[stage.key]
  const date = stage[language]
  return <article className="group-card knockout-card">
    <header className="card-header">
      <span className="group-badge knockout-badge">{stage.badge}</span>
      <h2>{title}</h2>
      <strong>{date}</strong>
    </header>
    <div className="knockout-body"><CalendarDays aria-hidden="true"/><span>{date}</span></div>
    {stage.venue ? <footer className="venue"><MapPin aria-hidden="true"/><span>{stage.venue}</span></footer> : null}
  </article>
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
  const [zone,setZone] = useState<ZoneKey>('official')
  const [matchday,setMatchday] = useState<Matchday>('first')
  const [scores,setScores] = useState<Record<string,string>>(()=>readCachedScores() ?? {})
  const [supportOpen,setSupportOpen] = useState(false)
  const [detailMatch,setDetailMatch] = useState<Match|null>(null)
  const t = copy[language]
  const visible = useMemo(()=>({ first:matches, second:secondMatchday, third:thirdMatchday, knockout:[] })[matchday],[matchday])
  const groups = useMemo(()=>Object.values(visible.reduce<Record<string,Match[]>>((acc,match)=>{(acc[match.group]??=[]).push(match); return acc},{})),[visible])
  const range = useMemo(()=>{
    if (matchday === 'knockout') return language === 'es' ? '28 de junio–19 de julio de 2026' : 'June 28–July 19, 2026'
    const days = visible.map(match=>Number(dateParts(match,zone,language).day))
    const min=Math.min(...days), max=Math.max(...days)
    return language === 'es' ? `${min}–${max} de junio de 2026` : `June ${min}–${max}, 2026`
  },[visible,zone,language,matchday])
  const zoneName = zones[zone][language]
  const subtitle = ({ first:t.subtitleFirst, second:t.subtitleSecond, third:t.subtitleThird, knockout:t.subtitleKnockout })[matchday]

  useEffect(()=>{
    let active = true
    refreshScores(allGroupMatches).then(nextScores=>{ if (active) setScores(nextScores) }).catch(()=>{})
    return ()=>{ active = false }
  },[])

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand">
        <span className="trophy-mark"><Trophy aria-hidden="true"/></span>
        <div><h1>{t.title}</h1><p>{subtitle}</p></div>
      </div>
      <div className="controls">
        <div className="control timezone"><label>{t.viewTime}</label><Selector value={zone} onChange={v=>setZone(v as ZoneKey)} label={t.viewTime} className="dark-select">
          {Object.entries(zones).map(([key,item])=><option key={key} value={key}>{item[language]}</option>)}
        </Selector></div>
        <div className="control language"><label>{t.language}</label><div className="segments" role="group" aria-label={t.language}>
          <button className={language==='es'?'active':''} onClick={()=>setLanguage('es')}>Español</button><button className={language==='en'?'active':''} onClick={()=>setLanguage('en')}>English</button>
        </div></div>
        <button className="coffee-button" type="button" onClick={()=>setSupportOpen(true)} aria-label={t.coffee}><span aria-hidden="true">☕</span><span className="coffee-label">{t.coffee}</span></button>
      </div>
    </header>

    <main>
      <div className="legend" aria-label="Match status">
        <span><i className="status-dot scheduled"/>{t.scheduled}</span><span><i className="status-dot live"/>{t.live}</span><span><i className="status-dot finished"/>{t.finished}</span>
      </div>
      {matchday === 'knockout'
        ? <section className="groups-grid knockout-grid">{knockoutStages.map(stage=><KnockoutCard key={stage.key} stage={stage} language={language}/>)}</section>
        : <section className="groups-grid">{groups.map(group=><GroupCard key={group[0].group} groupMatches={group} language={language} zone={zone} scores={scores} onOpen={setDetailMatch}/>)}</section>}
    </main>

    <footer className="bottom-panel">
      <div className="footer-block local"><Clock3/><p>{t.timePrefix} <strong>{t.localTime} ({zoneName})</strong></p></div>
      <div className="footer-block notice"><span className="stadium-icon">◉</span><p>{t.notice}</p></div>
      <div className="date-control"><strong>{t.dates}</strong><Selector value={matchday} onChange={value=>setMatchday(value as Matchday)} label={t.dates}><option value="first">{t.first}</option><option value="second">{t.second}</option><option value="third">{t.third}</option><option value="knockout">{t.knockout}</option></Selector><p><CalendarDays/>{range}</p></div>
      <div className="footer-block follow"><span className="chart-icon"><BarChart3/></span><p>{t.follow}<strong>{t.more}</strong><small className="data-source">Data: OpenFootball CC0</small></p></div>
    </footer>
    {supportOpen ? <SupportModal language={language} onClose={()=>setSupportOpen(false)}/> : null}
    {detailMatch ? <MatchDetailsModal match={detailMatch} language={language} onClose={()=>setDetailMatch(null)}/> : null}
  </div>
}

const rootWindow = window as Window & { __partidosRoot?: Root }
const root = rootWindow.__partidosRoot ??= createRoot(document.getElementById('root')!)
root.render(<React.StrictMode><App/></React.StrictMode>)
