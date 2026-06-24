import type { Language } from './data'

export const copy = {
  es: {
    title:'Partidos 2026', subtitleFirst:'Primera fecha de fase de grupos', subtitleSecond:'Segunda fecha de fase de grupos', subtitleThird:'Tercera fecha de fase de grupos', subtitleKnockout:'Fase eliminatoria', viewTime:'Horario', language:'Idioma',
    all:'Todas', mexico:'México', usa:'EE.UU.', canada:'Canadá', scheduled:'Programado', live:'En juego', finished:'Finalizado',
    group:'Grupo', dates:'Fechas:', first:'Primera fecha', second:'Segunda fecha', third:'Tercera fecha', knockout:'Eliminatorias', round32:'Ronda de 32', round16:'Octavos', quarterfinals:'Cuartos', semifinals:'Semifinales', thirdPlace:'Tercer puesto', final:'Final',
    timePrefix:'Todos los horarios están en', localTime:'hora local', notice:'Los horarios pueden cambiar. Consulta la información más reciente.',
    follow:'Sigue en tiempo real todos los partidos.', more:'Actualizaciones, estadísticas y más.', coffee:'Invítame un café', coffeeThanks:'Gracias por apoyar este proyecto.', copyNumber:'Copiar número', copied:'Copiado', openPayPal:'Abrir PayPal', closeSupport:'Cerrar apoyo', vs:'vs',
  },
  en: {
    title:'Matches 2026', subtitleFirst:'First group-stage matchday', subtitleSecond:'Second group-stage matchday', subtitleThird:'Third group-stage matchday', subtitleKnockout:'Knockout stage', viewTime:'View time', language:'Language',
    all:'All', mexico:'Mexico', usa:'U.S.', canada:'Canada', scheduled:'Scheduled', live:'Live', finished:'Finished',
    group:'Group', dates:'Dates:', first:'First matchday', second:'Second matchday', third:'Third matchday', knockout:'Knockout stage', round32:'Round of 32', round16:'Round of 16', quarterfinals:'Quarterfinals', semifinals:'Semifinals', thirdPlace:'Third place', final:'Final',
    timePrefix:'All times are shown in', localTime:'local time', notice:'Times may change. Check the latest information.',
    follow:'Follow all matches in real time.', more:'Updates, statistics and more.', coffee:'Buy me a coffee', coffeeThanks:'Thanks for supporting this project.', copyNumber:'Copy number', copied:'Copied', openPayPal:'Open PayPal', closeSupport:'Close support', vs:'vs',
  },
} satisfies Record<Language, Record<string,string>>
