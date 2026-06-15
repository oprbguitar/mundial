import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Info, Network, Users } from 'lucide-react'
import type { Language, Match } from './data'
import { teamNames } from './data'
import { loadCareer, loadMatchPlayers, type CareerSummary, type LineupStatus, type PlayerPosition, type SquadPlayer } from './squadData'

type View = 'formation' | 'players' | 'squad' | 'career'
const groups: PlayerPosition[] = ['GK','DEF','MID','FWD']

const modalCopy = {
  es:{title:'Detalle del partido y alineaciones',matchday:'Fecha',formation:'Formación',players:'Jugadores',viewSquad:'Ver plantilla completa',backPlayers:'Volver a jugadores',backSquad:'Volver a la plantilla',fullSquad:'Plantilla completa',career:'Resumen de carrera antes del Mundial',style:'Estilo de juego',strengths:'Fortalezas',form:'Forma reciente',position:'Posición',club:'Club',age:'Edad',foot:'Pie dominante',debut:'Debut con la selección',preview:'Datos de plantilla mostrados para la vista previa de la interfaz',loading:'Cargando datos públicos…',unavailable:'Dato no disponible',close:'Cerrar detalle del partido',lineupNotice:'Las alineaciones suelen anunciarse aproximadamente una hora antes del inicio.',source:'Resumen de fuente pública',gk:'Porteros',def:'Defensas',mid:'Centrocampistas',fwd:'Delanteros',all:'Todos',select:'Seleccionar jugador',play:'Juego dinámico y disciplinado, adaptado a su posición.',strong:'Experiencia internacional · técnica · trabajo en equipo',recent:'Actividad reciente previa al Mundial.',confirmedLineup:'Alineación confirmada',probableLineup:'Alineación probable'},
  en:{title:'Match detail & lineups',matchday:'Matchday',formation:'Formation',players:'Players',viewSquad:'View full squad',backPlayers:'Back to players',backSquad:'Back to full squad',fullSquad:'Full squad',career:'Career summary before the World Cup',style:'Style of play',strengths:'Strengths',form:'Recent form',position:'Position',club:'Club',age:'Age',foot:'Dominant foot',debut:'National team debut',preview:'Squad data shown for interface preview',loading:'Loading public data…',unavailable:'Data unavailable',close:'Close match details',lineupNotice:'Lineups are usually announced approximately one hour before kickoff.',source:'Public-source summary',gk:'Goalkeepers',def:'Defenders',mid:'Midfielders',fwd:'Forwards',all:'All',select:'Select player',play:'Dynamic, disciplined play adapted to the player’s position.',strong:'International experience · technique · teamwork',recent:'Recent activity before the World Cup.',confirmedLineup:'Confirmed lineup',probableLineup:'Probable lineup'},
} as const

const flagCodes: Record<string,string> = {Brazil:'br',Morocco:'ma',Mexico:'mx',SouthAfrica:'za',SouthKorea:'kr',Czechia:'cz',Canada:'ca',Bosnia:'ba',Qatar:'qa',Switzerland:'ch',Haiti:'ht',Scotland:'gb-sct',USA:'us',Paraguay:'py',Australia:'au',Turkey:'tr',Germany:'de',Curacao:'cw',IvoryCoast:'ci',Ecuador:'ec',Netherlands:'nl',Japan:'jp',Sweden:'se',Tunisia:'tn',Belgium:'be',Egypt:'eg',Iran:'ir',NewZealand:'nz',Spain:'es',CapeVerde:'cv',SaudiArabia:'sa',Uruguay:'uy',France:'fr',Senegal:'sn',Iraq:'iq',Norway:'no',Argentina:'ar',Algeria:'dz',Austria:'at',Jordan:'jo',Portugal:'pt',DRCCongo:'cd',Uzbekistan:'uz',Colombia:'co',England:'gb-eng',Croatia:'hr',Ghana:'gh',Panama:'pa'}

function Avatar({ player, large=false }: { player:SquadPlayer; large?:boolean }) {
  const hue = [...player.name].reduce((sum,char)=>sum+char.charCodeAt(0),0)%28
  return <span className={`cartoon-avatar ${large?'large':''}`} style={{'--avatar-hue':hue} as React.CSSProperties} aria-hidden="true"><i className="hair"/><i className="head"/><i className="body"/><i className="eyes"/></span>
}

function displayName(player:SquadPlayer, language:Language) { return player.status === 'unavailable' ? modalCopy[language].unavailable : player.name }

function TeamFlag({ team }: { team:string }) { return <img className="detail-flag" src={`https://flagcdn.com/w80/${flagCodes[team]}.png`} alt=""/> }

function PositionGroups({ players, onPlayer, language, compact=false }: { players:SquadPlayer[]; onPlayer:(player:SquadPlayer)=>void; language:Language; compact?:boolean }) {
  const t = modalCopy[language]
  return <div className={`player-groups ${compact?'compact':''}`}>{groups.map(group=>{
    const items=players.filter(player=>player.position===group)
    if (!items.length) return null
    return <section key={group}><h4>{({GK:t.gk,DEF:t.def,MID:t.mid,FWD:t.fwd})[group]}</h4><div className="player-grid">{items.map(player=><button className="player-tile" key={player.playerId} onClick={()=>onPlayer(player)}><b>{player.number ?? '—'}</b><Avatar player={player}/><span>{displayName(player,language)}<small>{player.role}</small></span></button>)}</div></section>
  })}</div>
}

function Formation({ team, players, status, onSquad, onPlayer, language }: {team:string;players:SquadPlayer[];status:LineupStatus;onSquad:()=>void;onPlayer:(p:SquadPlayer)=>void;language:Language}) {
  const t=modalCopy[language]
  const label=status==='confirmed'?t.confirmedLineup:status==='probable'?t.probableLineup:t.unavailable
  return <div className="formation-layout"><section><h3><TeamFlag team={team}/>{teamNames[team][language]} <small>{label} · 4-3-3</small></h3><div className="pitch">{players.map((player,index)=><button key={player.playerId} className={`pitch-player p${index+1}`} onClick={()=>onPlayer(player)} aria-label={`${t.select}: ${displayName(player,language)}`}><Avatar player={player}/><span>{player.status==='unavailable'?t.unavailable:player.name.split(' ').at(-1)}</span></button>)}</div></section><aside className="lineup-list"><h3>{teamNames[team][language]} {label}</h3>{players.map(player=><button key={player.playerId} onClick={()=>onPlayer(player)}><b>{player.number ?? '—'}</b><span>{displayName(player,language)}</span><small>{player.role}</small></button>)}<button className="modal-link" onClick={onSquad}>{t.viewSquad} ›</button></aside></div>
}

function PlayerSummary({ player, language, onCareer }: {player:SquadPlayer;language:Language;onCareer:()=>void}) {
  const t=modalCopy[language]
  return <aside className="player-summary"><h3>{displayName(player,language)}</h3><div className="portrait-row"><Avatar player={player} large/><strong>{player.number ?? '—'}<small>{player.role}</small></strong></div><dl><div><dt>{t.position}</dt><dd>{player.role}</dd></div><div><dt>{t.club}</dt><dd>{player.club ?? t.unavailable}</dd></div><div><dt>{t.age}</dt><dd>{player.age ?? t.unavailable}</dd></div><div><dt>{t.foot}</dt><dd>{player.foot ?? t.unavailable}</dd></div></dl><button className="modal-link" onClick={onCareer}>{t.career} ›</button></aside>
}

export function MatchDetailsModal({ match, language, onClose }: {match:Match;language:Language;onClose:()=>void}) {
  const t=modalCopy[language]
  const closeRef=useRef<HTMLButtonElement>(null)
  const [view,setView]=useState<View>('formation')
  const [team,setTeam]=useState(match.home)
  const [players,setPlayers]=useState<SquadPlayer[]>([])
  const [lineup,setLineup]=useState<SquadPlayer[]>([])
  const [lineupStatus,setLineupStatus]=useState<LineupStatus>('unavailable')
  const [selected,setSelected]=useState<SquadPlayer|null>(null)
  const [career,setCareer]=useState<CareerSummary|null>(null)
  const [loading,setLoading]=useState(true)
  const labels=useMemo(()=>({GK:t.gk,DEF:t.def,MID:t.mid,FWD:t.fwd}),[t])
  const playerPreview=useMemo(()=>groups.flatMap(group=>players.filter(player=>player.position===group).slice(0,group==='GK'?2:4)),[players])

  useEffect(()=>{closeRef.current?.focus();document.body.classList.add('modal-open');const key=(event:KeyboardEvent)=>event.key==='Escape'&&onClose();document.addEventListener('keydown',key);return()=>{document.body.classList.remove('modal-open');document.removeEventListener('keydown',key)}},[onClose])
  useEffect(()=>{let active=true;setLoading(true);loadMatchPlayers(match,team).then(next=>{if(!active)return;setPlayers(next.squad);setLineup(next.lineup);setLineupStatus(next.lineupStatus);setSelected(current=>current&&next.squad.find(item=>item.playerId===current.playerId)||next.squad[0]||null);setLoading(false)});return()=>{active=false}},[match,team])
  useEffect(()=>{if(view!=='career'||!selected)return;let active=true;setCareer(null);loadCareer(selected,language).then(value=>active&&setCareer(value));return()=>{active=false}},[view,selected,language])
  const openCareer=(player:SquadPlayer)=>{setSelected(player);setView('career')}

  return <div className="match-overlay" onMouseDown={event=>event.target===event.currentTarget&&onClose()}><section className="match-modal" role="dialog" aria-modal="true" aria-labelledby="match-detail-title"><button ref={closeRef} className="match-close" onClick={onClose} aria-label={t.close}>×</button><header className="match-detail-header"><h2 id="match-detail-title">{t.title}</h2><p>{language==='es'?'Grupo':'Group'} {match.group} · {t.matchday} 1</p><div className="detail-teams"><button className={team===match.home?'active':''} onClick={()=>setTeam(match.home)}><TeamFlag team={match.home}/><b>{teamNames[match.home][language]}</b></button><strong>VS</strong><button className={team===match.away?'active':''} onClick={()=>setTeam(match.away)}><TeamFlag team={match.away}/><b>{teamNames[match.away][language]}</b></button></div><nav className="detail-tabs"><button className={view==='formation'?'active':''} onClick={()=>setView('formation')}><Network/>{t.formation}</button><button className={view!=='formation'?'active':''} onClick={()=>setView('players')}><Users/>{t.players}</button></nav></header><div className="match-detail-body">{loading?<p className="detail-loading">{t.loading}</p>:view==='formation'?<Formation team={team} players={lineup} status={lineupStatus} onSquad={()=>setView('squad')} onPlayer={openCareer} language={language}/>:view==='players'?<div className="players-layout"><section><h3>{teamNames[team][language]} {language==='es'?'plantilla':'squad'}</h3><PositionGroups players={playerPreview} onPlayer={player=>setSelected(player)} language={language}/></section>{selected&&<PlayerSummary player={selected} language={language} onCareer={()=>openCareer(selected)}/>}<button className="modal-link wide" onClick={()=>setView('squad')}>{t.viewSquad} ›</button></div>:view==='squad'?<div className="full-squad-layout"><section><button className="back-link" onClick={()=>setView('players')}><ArrowLeft/>{t.backPlayers}</button><h3>{teamNames[team][language]} {t.fullSquad}</h3><p>{players.length} {language==='es'?'jugadores':'players'}</p><PositionGroups players={players} onPlayer={openCareer} language={language} compact/></section><aside className="team-summary"><TeamFlag team={team}/><h3>{teamNames[team][language]}</h3>{groups.map(group=><p key={group}><i className={`position-dot ${group.toLowerCase()}`}/>{labels[group]} <b>{players.filter(player=>player.position===group).length}</b></p>)}</aside></div>:selected?<div className="career-layout"><aside><button className="back-link" onClick={()=>setView('squad')}><ArrowLeft/>{t.backSquad}</button><Avatar player={selected} large/><h3>{displayName(selected,language)}</h3><p>{selected.role}</p><dl><div><dt>{t.club}</dt><dd>{selected.club ?? t.unavailable}</dd></div><div><dt>{t.foot}</dt><dd>{selected.foot??t.unavailable}</dd></div><div><dt>{t.debut}</dt><dd>{selected.debut??t.unavailable}</dd></div></dl></aside><section><h3>{t.career}</h3>{career===null?<p>{t.loading}</p>:<article className="career-summary"><span>2006–2026</span><h4>{t.source}</h4><p>{career.extract?career.extract.split(/(?<=[.!?])\s+/).slice(0,4).join(' '):t.unavailable}</p>{career.sourceUrl&&<a href={career.sourceUrl} target="_blank" rel="noopener noreferrer">Wikipedia ↗</a>}</article>}<div className="career-cards"><article><h4>{t.style}</h4><p>{t.play}</p></article><article><h4>{t.strengths}</h4><p>{t.strong}</p></article><article><h4>{t.form}</h4><p>{t.recent}</p></article></div></section></div>:null}</div><footer className="match-detail-footer"><Info/>{view==='formation'?(lineupStatus==='confirmed'?t.confirmedLineup:lineupStatus==='probable'?t.probableLineup:t.unavailable):t.preview}</footer></section></div>
}
