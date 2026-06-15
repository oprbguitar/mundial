export type Language = 'es' | 'en'
export type Host = 'all' | 'Mexico' | 'USA' | 'Canada'
export type Status = 'scheduled' | 'live' | 'finished'

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

export const groupColors: Record<string, string> = {
  A:'#1647cc', B:'#08713d', C:'#ff5c00', D:'#7835c8', E:'#1647cc', F:'#08713d',
  G:'#ff5c00', H:'#7835c8', I:'#1647cc', J:'#08713d', K:'#ff5c00', L:'#7835c8',
}
