import type { Language } from './data'

export const copy = {
  es: {
    title:'Partidos 2026', subtitle:'Primera fecha de fase de grupos', viewTime:'Ver horario', language:'Idioma', host:'Sede',
    all:'Todas', mexico:'México', usa:'EE.UU.', canada:'Canadá', scheduled:'Programado', live:'En juego', finished:'Finalizado',
    group:'Grupo', dates:'Fechas:', first:'Primera fecha', second:'Segunda fecha', coming:'Próximamente', noMatches:'No hay partidos para esta selección.',
    timePrefix:'Todos los horarios están en', localTime:'hora local', notice:'Los horarios pueden cambiar. Consulta la información más reciente.',
    follow:'Sigue en tiempo real todos los partidos.', more:'Actualizaciones, estadísticas y más.', coffee:'Invítame un café', vs:'vs',
  },
  en: {
    title:'Matches 2026', subtitle:'First group-stage matchday', viewTime:'View time', language:'Language', host:'Host',
    all:'All', mexico:'Mexico', usa:'U.S.', canada:'Canada', scheduled:'Scheduled', live:'Live', finished:'Finished',
    group:'Group', dates:'Dates:', first:'First matchday', second:'Second matchday', coming:'Coming soon', noMatches:'No matches for this selection.',
    timePrefix:'All times are shown in', localTime:'local time', notice:'Times may change. Check the latest information.',
    follow:'Follow all matches in real time.', more:'Updates, statistics and more.', coffee:'Buy me a coffee', vs:'vs',
  },
} satisfies Record<Language, Record<string,string>>
