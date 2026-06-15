import type { Language } from './data'

export type PlayerPosition = 'GK' | 'DEF' | 'MID' | 'FWD'

export interface SquadPlayer {
  name: string
  number: number
  position: PlayerPosition
  role: string
  club: string
  age?: string
  foot?: string
  debut?: string
}

export interface CareerSummary {
  extract: string
  sourceUrl: string
}

const CACHE_HOURS = 24
const teamPages: Record<string,string> = {
  USA:'United States', SouthKorea:'South Korea', SouthAfrica:'South Africa', NewZealand:'New Zealand',
  IvoryCoast:'Ivory Coast', SaudiArabia:'Saudi Arabia', CapeVerde:'Cape Verde', DRCCongo:'DR Congo',
  Bosnia:'Bosnia and Herzegovina', Curacao:'Curaçao',
}

const brazilPreview: SquadPlayer[] = [
  ['Alisson Becker',1,'GK','GK','Liverpool'],['Bento',12,'GK','GK','Al-Nassr'],
  ['Marquinhos',4,'DEF','CB','Paris Saint-Germain'],['Gabriel Magalhães',3,'DEF','CB','Arsenal'],
  ['Éder Militão',14,'DEF','CB','Real Madrid'],['Alex Sandro',6,'DEF','LB','Flamengo'],
  ['Danilo',2,'DEF','RB','Flamengo'],['Bruno Guimarães',8,'MID','CM','Newcastle United'],
  ['Casemiro',5,'MID','DM','Manchester United'],['Lucas Paquetá',10,'MID','AM','West Ham United'],
  ['Vinícius Júnior',7,'FWD','LW','Real Madrid'],['Raphinha',11,'FWD','RW','Barcelona'],
  ['Rodrygo',19,'FWD','RW','Real Madrid'],['Richarlison',9,'FWD','ST','Tottenham Hotspur'],
].map(([name,number,position,role,club])=>({name:name as string,number:number as number,position:position as PlayerPosition,role:role as string,club:club as string}))

function fallbackSquad(team: string): SquadPlayer[] {
  if (team === 'Brazil') return brazilPreview
  const positions: PlayerPosition[] = ['GK','DEF','DEF','DEF','DEF','MID','MID','MID','FWD','FWD','FWD','GK','DEF','MID','FWD']
  return positions.map((position,index)=>({
    name:`${teamPages[team] ?? team} ${index + 1}`,
    number:index + 1,
    position,
    role:position,
    club:'—',
  }))
}

function readCache<T>(key: string): T | null {
  try {
    const cached = JSON.parse(localStorage.getItem(key) ?? 'null') as { savedAt:number; value:T } | null
    if (cached && Date.now() - cached.savedAt < CACHE_HOURS * 60 * 60 * 1000) return cached.value
  } catch {}
  return null
}

function writeCache<T>(key: string, value: T) {
  try { localStorage.setItem(key,JSON.stringify({savedAt:Date.now(),value})) } catch {}
}

function normalizePosition(value: string): PlayerPosition {
  const upper = value.toUpperCase()
  if (upper.includes('GK') || upper.includes('GOALKEEPER')) return 'GK'
  if (/DF|DEF|BACK/.test(upper)) return 'DEF'
  if (/MF|MID/.test(upper)) return 'MID'
  return 'FWD'
}

function parseSquad(html: string): SquadPlayer[] {
  const documentNode = new DOMParser().parseFromString(html,'text/html')
  const heading = documentNode.querySelector('#Current_squad, #Players, #Squad')
  let table = heading?.closest('h2,h3')?.nextElementSibling
  while (table && table.tagName !== 'TABLE') table = table.nextElementSibling
  const target = table?.tagName === 'TABLE' ? table : [...documentNode.querySelectorAll('table')].find(item=>/player/i.test(item.textContent ?? '') && /pos/i.test(item.textContent ?? ''))
  if (!target) return []
  return [...target.querySelectorAll('tr')].flatMap((row,index)=>{
    const cells = [...row.querySelectorAll('td')]
    const anchor = row.querySelector('th a, td a[title]') as HTMLAnchorElement | null
    if (cells.length < 3 || !anchor) return []
    const number = Number((cells[0]?.textContent ?? '').match(/\d+/)?.[0] ?? index)
    const positionText = cells[1]?.textContent?.trim() ?? ''
    const club = cells.at(-1)?.textContent?.trim().replace(/\s+/g,' ') ?? '—'
    return [{name:anchor.textContent?.trim() || anchor.title,number,position:normalizePosition(positionText),role:positionText || '—',club}]
  }).filter((player,index,list)=>player.name && list.findIndex(item=>item.name===player.name)===index).slice(0,26)
}

export async function loadSquad(team: string): Promise<SquadPlayer[]> {
  const key = `mundial-squad-${team}`
  const cached = readCache<SquadPlayer[]>(key)
  if (cached) return cached
  try {
    const country = teamPages[team] ?? team
    const page = `${country} national football team`
    const url = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(page)}&prop=text&format=json&origin=*`
    const response = await fetch(url)
    if (!response.ok) throw new Error('Squad request failed')
    const data = await response.json() as { parse?:{ text?:{ '*':string } } }
    const players = parseSquad(data.parse?.text?.['*'] ?? '')
    if (players.length < 8) throw new Error('Squad table unavailable')
    writeCache(key,players)
    return players
  } catch {
    return fallbackSquad(team)
  }
}

export async function loadCareer(player: SquadPlayer, language: Language): Promise<CareerSummary> {
  const key = `mundial-career-${language}-${player.name}`
  const cached = readCache<CareerSummary>(key)
  if (cached) return cached
  const host = language === 'es' ? 'es.wikipedia.org' : 'en.wikipedia.org'
  try {
    const url = `https://${host}/api/rest_v1/page/summary/${encodeURIComponent(player.name.replaceAll(' ','_'))}`
    const response = await fetch(url)
    if (!response.ok) throw new Error('Career request failed')
    const data = await response.json() as { extract?:string; content_urls?:{ desktop?:{ page?:string } } }
    const value = {extract:data.extract ?? '',sourceUrl:data.content_urls?.desktop?.page ?? `https://${host}/wiki/${encodeURIComponent(player.name)}`}
    writeCache(key,value)
    return value
  } catch {
    return {extract:'',sourceUrl:''}
  }
}
