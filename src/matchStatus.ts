import type { Match, Status } from './data'

const MATCH_WINDOW_MS = 120 * 60 * 1000
const MINUTE_MS = 60 * 1000

let currentTime = Date.now()
let timer: number | undefined
const listeners = new Set<()=>void>()

export function getMatchStatus(match: Match, score: string | null | undefined, now = Date.now(), sourceStatus?: Status): Status {
  if (sourceStatus === 'finished' || match.status === 'finished') return 'finished'
  if (sourceStatus === 'live') return 'live'
  const kickoff = new Date(match.dateTime).getTime()
  return now >= kickoff && now <= kickoff + MATCH_WINDOW_MS ? 'live' : 'scheduled'
}

export function subscribeToMinute(listener: ()=>void) {
  listeners.add(listener)
  if (timer === undefined) {
    timer = window.setInterval(()=>{
      currentTime = Date.now()
      listeners.forEach(notify=>notify())
    },MINUTE_MS)
  }
  return ()=>{
    listeners.delete(listener)
    if (!listeners.size && timer !== undefined) {
      window.clearInterval(timer)
      timer = undefined
    }
  }
}

export function getMinuteSnapshot() {
  return currentTime
}
