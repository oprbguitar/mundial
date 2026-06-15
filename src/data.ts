export type Language = 'es' | 'en'
export type Host = 'all' | 'Mexico' | 'USA' | 'Canada'
export type Status = 'scheduled' | 'live' | 'finished'
export type Matchday = 'first' | 'second' | 'third' | 'knockout'

export interface Match {
  id: string
  group: string
  dateTime: string
  home: string
  away: string
  homeFlag: string
  awayFlag: string
  host: Exclude<Host, 'all'>
  stadium: string
  city: string
  score: string | null
  status: Status
}

type TeamNames = Record<string, { es: string; en: string }>

export const teamNames: TeamNames = {
  Mexico: { es: 'México', en: 'Mexico' }, SouthAfrica: { es: 'Sudáfrica', en: 'South Africa' },
  SouthKorea: { es: 'Corea del Sur', en: 'South Korea' }, Czechia: { es: 'Chequia', en: 'Czechia' },
  Canada: { es: 'Canadá', en: 'Canada' }, Bosnia: { es: 'Bosnia y Herzegovina', en: 'Bosnia & Herzegovina' },
  Qatar: { es: 'Qatar', en: 'Qatar' }, Switzerland: { es: 'Suiza', en: 'Switzerland' },
  Brazil: { es: 'Brasil', en: 'Brazil' }, Morocco: { es: 'Marruecos', en: 'Morocco' },
  Haiti: { es: 'Haití', en: 'Haiti' }, Scotland: { es: 'Escocia', en: 'Scotland' },
  USA: { es: 'Estados Unidos', en: 'United States' }, Paraguay: { es: 'Paraguay', en: 'Paraguay' },
  Australia: { es: 'Australia', en: 'Australia' }, Turkey: { es: 'Turquía', en: 'Türkiye' },
  Germany: { es: 'Alemania', en: 'Germany' }, Curacao: { es: 'Curazao', en: 'Curaçao' },
  IvoryCoast: { es: 'Costa de Marfil', en: 'Ivory Coast' }, Ecuador: { es: 'Ecuador', en: 'Ecuador' },
  Netherlands: { es: 'Países Bajos', en: 'Netherlands' }, Japan: { es: 'Japón', en: 'Japan' },
  Sweden: { es: 'Suecia', en: 'Sweden' }, Tunisia: { es: 'Túnez', en: 'Tunisia' },
  Belgium: { es: 'Bélgica', en: 'Belgium' }, Egypt: { es: 'Egipto', en: 'Egypt' },
  Iran: { es: 'Irán', en: 'Iran' }, NewZealand: { es: 'Nueva Zelanda', en: 'New Zealand' },
  Spain: { es: 'España', en: 'Spain' }, CapeVerde: { es: 'Cabo Verde', en: 'Cape Verde' },
  SaudiArabia: { es: 'Arabia Saudita', en: 'Saudi Arabia' }, Uruguay: { es: 'Uruguay', en: 'Uruguay' },
  France: { es: 'Francia', en: 'France' }, Senegal: { es: 'Senegal', en: 'Senegal' },
  Iraq: { es: 'Irak', en: 'Iraq' }, Norway: { es: 'Noruega', en: 'Norway' },
  Argentina: { es: 'Argentina', en: 'Argentina' }, Algeria: { es: 'Argelia', en: 'Algeria' },
  Austria: { es: 'Austria', en: 'Austria' }, Jordan: { es: 'Jordania', en: 'Jordan' },
  Portugal: { es: 'Portugal', en: 'Portugal' }, DRCCongo: { es: 'RD Congo', en: 'DR Congo' },
  Uzbekistan: { es: 'Uzbekistán', en: 'Uzbekistan' }, Colombia: { es: 'Colombia', en: 'Colombia' },
  England: { es: 'Inglaterra', en: 'England' }, Croatia: { es: 'Croacia', en: 'Croatia' },
  Ghana: { es: 'Ghana', en: 'Ghana' }, Panama: { es: 'Panamá', en: 'Panama' },
}

const m = (id: string, group: string, day: number, time: string, home: string, homeFlag: string, away: string, awayFlag: string, host: Exclude<Host, 'all'>, stadium: string, city: string, score: string | null): Match => ({
  id, group, dateTime: `2026-06-${String(day).padStart(2, '0')}T${time}:00-05:00`, home, away, homeFlag, awayFlag, host, stadium, city, score, status: score ? 'finished' : 'scheduled',
})

export const matches: Match[] = [
  m('a1','A',11,'14:00','Mexico','🇲🇽','SouthAfrica','🇿🇦','Mexico','Estadio Azteca','Ciudad de México','2-0'),
  m('a2','A',11,'21:00','SouthKorea','🇰🇷','Czechia','🇨🇿','Mexico','Estadio Azteca','Ciudad de México','2-1'),
  m('b1','B',12,'14:00','Canada','🇨🇦','Bosnia','🇧🇦','Canada','BMO Field','Toronto','1-1'),
  m('b2','B',13,'14:00','Qatar','🇶🇦','Switzerland','🇨🇭','Canada','BMO Field','Toronto','1-1'),
  m('c1','C',13,'17:00','Brazil','🇧🇷','Morocco','🇲🇦','USA','Hard Rock Stadium','Miami','1-1'),
  m('c2','C',13,'20:00','Haiti','🇭🇹','Scotland','🏴','USA','Hard Rock Stadium','Miami','0-1'),
  m('d1','D',12,'20:00','USA','🇺🇸','Paraguay','🇵🇾','USA','Lumen Field','Seattle','4-1'),
  m('d2','D',13,'23:00','Australia','🇦🇺','Turkey','🇹🇷','USA','Lumen Field','Seattle','2-0'),
  m('e1','E',14,'12:00','Germany','🇩🇪','Curacao','🇨🇼','USA','MetLife Stadium','East Rutherford','7-1'),
  m('e2','E',14,'18:00','IvoryCoast','🇨🇮','Ecuador','🇪🇨','USA','MetLife Stadium','East Rutherford','1-0'),
  m('f1','F',14,'15:00','Netherlands','🇳🇱','Japan','🇯🇵','USA','AT&T Stadium','Arlington',null),
  m('f2','F',14,'21:00','Sweden','🇸🇪','Tunisia','🇹🇳','USA','AT&T Stadium','Arlington',null),
  m('g1','G',15,'14:00','Belgium','🇧🇪','Egypt','🇪🇬','USA','Mercedes-Benz Stadium','Atlanta',null),
  m('g2','G',15,'20:00','Iran','🇮🇷','NewZealand','🇳🇿','USA','Mercedes-Benz Stadium','Atlanta',null),
  m('h1','H',15,'11:00','Spain','🇪🇸','CapeVerde','🇨🇻','USA','NRG Stadium','Houston',null),
  m('h2','H',15,'17:00','SaudiArabia','🇸🇦','Uruguay','🇺🇾','USA','NRG Stadium','Houston',null),
  m('i1','I',16,'14:00','France','🇫🇷','Senegal','🇸🇳','USA','SoFi Stadium','Inglewood',null),
  m('i2','I',16,'17:00','Iraq','🇮🇶','Norway','🇳🇴','USA','SoFi Stadium','Inglewood',null),
  m('j1','J',16,'20:00','Argentina','🇦🇷','Algeria','🇩🇿','USA','Levi’s Stadium','Santa Clara',null),
  m('j2','J',16,'23:00','Austria','🇦🇹','Jordan','🇯🇴','USA','Levi’s Stadium','Santa Clara',null),
  m('k1','K',17,'12:00','Portugal','🇵🇹','DRCCongo','🇨🇩','USA','Lincoln Financial Field','Filadelfia',null),
  m('k2','K',17,'21:00','Uzbekistan','🇺🇿','Colombia','🇨🇴','USA','Lincoln Financial Field','Filadelfia',null),
  m('l1','L',17,'15:00','England','🏴','Croatia','🇭🇷','USA','Gillette Stadium','Foxborough',null),
  m('l2','L',17,'18:00','Ghana','🇬🇭','Panama','🇵🇦','USA','Gillette Stadium','Foxborough',null),
]

const fixture = (id: string, group: string, dateTime: string, home: string, away: string, city: string): Match => ({
  id, group, dateTime, home, away, homeFlag:'', awayFlag:'', host:'USA', stadium:'', city, score:null, status:'scheduled',
})

export const secondMatchday: Match[] = [
  fixture('s1','A','2026-06-18T12:00:00-04:00','Czechia','SouthAfrica','Atlanta'),
  fixture('s2','A','2026-06-18T19:00:00-06:00','Mexico','SouthKorea','Guadalajara (Zapopan)'),
  fixture('s3','B','2026-06-18T12:00:00-07:00','Switzerland','Bosnia','Los Angeles (Inglewood)'),
  fixture('s4','B','2026-06-18T15:00:00-07:00','Canada','Qatar','Vancouver'),
  fixture('s5','C','2026-06-19T18:00:00-04:00','Scotland','Morocco','Boston (Foxborough)'),
  fixture('s6','C','2026-06-19T20:30:00-04:00','Brazil','Haiti','Philadelphia'),
  fixture('s7','D','2026-06-19T12:00:00-07:00','USA','Australia','Seattle'),
  fixture('s8','D','2026-06-19T20:00:00-07:00','Turkey','Paraguay','San Francisco Bay Area (Santa Clara)'),
  fixture('s9','E','2026-06-20T16:00:00-04:00','Germany','IvoryCoast','Toronto'),
  fixture('s10','E','2026-06-20T19:00:00-05:00','Ecuador','Curacao','Kansas City'),
  fixture('s11','F','2026-06-20T12:00:00-05:00','Netherlands','Sweden','Houston'),
  fixture('s12','F','2026-06-20T22:00:00-06:00','Tunisia','Japan','Monterrey (Guadalupe)'),
  fixture('s13','G','2026-06-21T12:00:00-07:00','Belgium','Iran','Los Angeles (Inglewood)'),
  fixture('s14','G','2026-06-21T18:00:00-07:00','NewZealand','Egypt','Vancouver'),
  fixture('s15','H','2026-06-21T12:00:00-04:00','Spain','SaudiArabia','Atlanta'),
  fixture('s16','H','2026-06-21T18:00:00-04:00','Uruguay','CapeVerde','Miami (Miami Gardens)'),
  fixture('s17','I','2026-06-22T17:00:00-04:00','France','Iraq','Philadelphia'),
  fixture('s18','I','2026-06-22T20:00:00-04:00','Norway','Senegal','New York/New Jersey (East Rutherford)'),
  fixture('s19','J','2026-06-22T12:00:00-05:00','Argentina','Austria','Dallas (Arlington)'),
  fixture('s20','J','2026-06-22T20:00:00-07:00','Jordan','Algeria','San Francisco Bay Area (Santa Clara)'),
  fixture('s21','K','2026-06-23T12:00:00-05:00','Portugal','Uzbekistan','Houston'),
  fixture('s22','K','2026-06-23T20:00:00-06:00','Colombia','DRCCongo','Guadalajara (Zapopan)'),
  fixture('s23','L','2026-06-23T16:00:00-04:00','England','Ghana','Boston (Foxborough)'),
  fixture('s24','L','2026-06-23T19:00:00-04:00','Panama','Croatia','Toronto'),
]

export const thirdMatchday: Match[] = [
  fixture('t1','A','2026-06-24T19:00:00-06:00','Czechia','Mexico','Mexico City'),
  fixture('t2','A','2026-06-24T19:00:00-06:00','SouthAfrica','SouthKorea','Monterrey (Guadalupe)'),
  fixture('t3','B','2026-06-24T12:00:00-07:00','Switzerland','Canada','Vancouver'),
  fixture('t4','B','2026-06-24T12:00:00-07:00','Bosnia','Qatar','Seattle'),
  fixture('t5','C','2026-06-24T18:00:00-04:00','Scotland','Brazil','Miami (Miami Gardens)'),
  fixture('t6','C','2026-06-24T18:00:00-04:00','Morocco','Haiti','Atlanta'),
  fixture('t7','D','2026-06-25T19:00:00-07:00','Turkey','USA','Los Angeles (Inglewood)'),
  fixture('t8','D','2026-06-25T19:00:00-07:00','Paraguay','Australia','San Francisco Bay Area (Santa Clara)'),
  fixture('t9','E','2026-06-25T16:00:00-04:00','Curacao','IvoryCoast','Philadelphia'),
  fixture('t10','E','2026-06-25T16:00:00-04:00','Ecuador','Germany','New York/New Jersey (East Rutherford)'),
  fixture('t11','F','2026-06-25T18:00:00-05:00','Japan','Sweden','Dallas (Arlington)'),
  fixture('t12','F','2026-06-25T18:00:00-05:00','Tunisia','Netherlands','Kansas City'),
  fixture('t13','G','2026-06-26T20:00:00-07:00','Egypt','Iran','Seattle'),
  fixture('t14','G','2026-06-26T20:00:00-07:00','NewZealand','Belgium','Vancouver'),
  fixture('t15','H','2026-06-26T19:00:00-05:00','CapeVerde','SaudiArabia','Houston'),
  fixture('t16','H','2026-06-26T18:00:00-06:00','Uruguay','Spain','Guadalajara (Zapopan)'),
  fixture('t17','I','2026-06-26T15:00:00-04:00','Norway','France','Boston (Foxborough)'),
  fixture('t18','I','2026-06-26T15:00:00-04:00','Senegal','Iraq','Toronto'),
  fixture('t19','J','2026-06-27T21:00:00-05:00','Algeria','Austria','Kansas City'),
  fixture('t20','J','2026-06-27T21:00:00-05:00','Jordan','Argentina','Dallas (Arlington)'),
  fixture('t21','K','2026-06-27T19:30:00-04:00','Colombia','Portugal','Miami (Miami Gardens)'),
  fixture('t22','K','2026-06-27T19:30:00-04:00','DRCCongo','Uzbekistan','Atlanta'),
  fixture('t23','L','2026-06-27T17:00:00-04:00','Panama','England','New York/New Jersey (East Rutherford)'),
  fixture('t24','L','2026-06-27T17:00:00-04:00','Croatia','Ghana','Philadelphia'),
]

export const allGroupMatches = [...matches, ...secondMatchday, ...thirdMatchday]

export const groupColors: Record<string, string> = {
  A:'#1647cc', B:'#08713d', C:'#ff5c00', D:'#7835c8', E:'#1647cc', F:'#08713d',
  G:'#ff5c00', H:'#7835c8', I:'#1647cc', J:'#08713d', K:'#ff5c00', L:'#7835c8',
}
