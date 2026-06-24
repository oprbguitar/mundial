import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Activity, BarChart3, CalendarDays, Goal, Hand, Percent, Shield, Trophy, Users, Volleyball } from 'lucide-react'
import './statistics.css'

type Language = 'es'|'en'
type StatRow = {
  name:string
  flag:string
  value:number|string
  extra?:Array<number|string>
}
type StatCard = {
  icon:React.ReactNode
  title:{es:string;en:string}
  columns?:{es:string[];en:string[]}
  rows:StatRow[]
}

const playerCards:StatCard[] = [
  {
    icon:<Volleyball aria-hidden="true"/>,
    title:{es:'Goleadores',en:'Top scorers'},
    rows:[
      {flag:'fr',name:'Kylian Mbappé',value:7},
      {flag:'ar',name:'Julián Álvarez',value:6},
      {flag:'gb-eng',name:'Harry Kane',value:5},
      {flag:'br',name:'Vinícius Júnior',value:5},
      {flag:'pl',name:'R. Lewandowski',value:4},
      {flag:'ar',name:'Lautaro Martínez',value:4},
      {flag:'ir',name:'Mehdi Taremi',value:4},
      {flag:'nl',name:'Cody Gakpo',value:3},
    ],
  },
  {
    icon:<Goal aria-hidden="true"/>,
    title:{es:'Máximos asistentes',en:'Top assists'},
    rows:[
      {flag:'ar',name:'Lionel Messi',value:5},
      {flag:'fr',name:'Antoine Griezmann',value:4},
      {flag:'pt',name:'Bruno Fernandes',value:4},
      {flag:'gb-eng',name:'Bukayo Saka',value:3},
      {flag:'be',name:'Kevin De Bruyne',value:3},
      {flag:'br',name:'Neymar Jr.',value:3},
      {flag:'us',name:'Christian Pulisic',value:3},
      {flag:'de',name:'Jamal Musiala',value:2},
    ],
  },
  {
    icon:<Hand aria-hidden="true"/>,
    title:{es:'Arqueros con más atajadas',en:'Most goalkeeper saves'},
    rows:[
      {flag:'ar',name:'Emiliano Martínez',value:28},
      {flag:'ma',name:'Yassine Bounou',value:24},
      {flag:'be',name:'Thibaut Courtois',value:22},
      {flag:'br',name:'Alisson Becker',value:21},
      {flag:'de',name:'Manuel Neuer',value:20},
      {flag:'cm',name:'André Onana',value:19},
      {flag:'cr',name:'Keylor Navas',value:18},
      {flag:'gb-eng',name:'Jordan Pickford',value:17},
    ],
  },
  {
    icon:<Goal aria-hidden="true"/>,
    title:{es:'Remates al arco (jugadores)',en:'Shots on target'},
    rows:[
      {flag:'fr',name:'Kylian Mbappé',value:23},
      {flag:'gb-eng',name:'Harry Kane',value:20},
      {flag:'br',name:'Vinícius Júnior',value:18},
      {flag:'ar',name:'Julián Álvarez',value:17},
      {flag:'pl',name:'R. Lewandowski',value:16},
      {flag:'ar',name:'Lautaro Martínez',value:15},
      {flag:'gb-eng',name:'Bukayo Saka',value:14},
      {flag:'nl',name:'Cody Gakpo',value:13},
    ],
  },
  {
    icon:<Percent aria-hidden="true"/>,
    title:{es:'Efectividad goleadora',en:'Scoring efficiency'},
    columns:{es:['Goles','Remates','%'],en:['Goals','Shots','%']},
    rows:[
      {flag:'fr',name:'Kylian Mbappé',value:7,extra:[23,'30.4']},
      {flag:'gb-eng',name:'Harry Kane',value:5,extra:[20,'25.0']},
      {flag:'ar',name:'Julián Álvarez',value:6,extra:[17,'35.3']},
      {flag:'br',name:'Vinícius Júnior',value:5,extra:[18,'27.8']},
      {flag:'ir',name:'Mehdi Taremi',value:4,extra:[12,'33.3']},
      {flag:'nl',name:'Cody Gakpo',value:3,extra:[13,'23.1']},
      {flag:'ar',name:'Lautaro Martínez',value:4,extra:[15,'26.7']},
      {flag:'pl',name:'R. Lewandowski',value:4,extra:[16,'25.0']},
    ],
  },
  {
    icon:<Shield aria-hidden="true"/>,
    title:{es:'Vallas invictas',en:'Clean sheets'},
    rows:[
      {flag:'ar',name:'Emiliano Martínez',value:2},
      {flag:'ma',name:'Yassine Bounou',value:1},
      {flag:'be',name:'Thibaut Courtois',value:1},
      {flag:'br',name:'Alisson Becker',value:1},
      {flag:'cm',name:'André Onana',value:1},
      {flag:'de',name:'Manuel Neuer',value:1},
      {flag:'cr',name:'Keylor Navas',value:1},
      {flag:'hr',name:'Dominik Livaković',value:1},
    ],
  },
]

const countryCards:StatCard[] = [
  {
    icon:<Goal aria-hidden="true"/>,
    title:{es:'Países con más goles',en:'Countries with most goals'},
    rows:[
      {flag:'fr',name:'Francia',value:18},
      {flag:'br',name:'Brasil',value:16},
      {flag:'gb-eng',name:'Inglaterra',value:15},
      {flag:'ar',name:'Argentina',value:14},
      {flag:'es',name:'España',value:13},
      {flag:'pt',name:'Portugal',value:12},
      {flag:'nl',name:'Países Bajos',value:11},
      {flag:'de',name:'Alemania',value:11},
    ],
  },
  {
    icon:<Activity aria-hidden="true"/>,
    title:{es:'Diferencia de goles',en:'Goal difference'},
    columns:{es:['PJ','GF','GC','DG'],en:['P','GF','GA','GD']},
    rows:[
      {flag:'fr',name:'Francia',value:4,extra:[18,3,'+15']},
      {flag:'br',name:'Brasil',value:4,extra:[16,4,'+12']},
      {flag:'gb-eng',name:'Inglaterra',value:4,extra:[15,4,'+11']},
      {flag:'ar',name:'Argentina',value:4,extra:[14,5,'+9']},
      {flag:'es',name:'España',value:4,extra:[13,5,'+8']},
      {flag:'pt',name:'Portugal',value:4,extra:[12,6,'+6']},
      {flag:'nl',name:'Países Bajos',value:4,extra:[11,6,'+5']},
      {flag:'de',name:'Alemania',value:4,extra:[11,7,'+4']},
    ],
  },
  {
    icon:<span className="cards-icon" aria-hidden="true"><i></i><i></i></span>,
    title:{es:'Disciplina (por país)',en:'Discipline by country'},
    columns:{es:['Amarillas','Rojas'],en:['Yellow','Red']},
    rows:[
      {flag:'mx',name:'México',value:12,extra:[1]},
      {flag:'co',name:'Colombia',value:11,extra:[1]},
      {flag:'br',name:'Brasil',value:10,extra:[1]},
      {flag:'ar',name:'Argentina',value:9,extra:[0]},
      {flag:'ma',name:'Marruecos',value:9,extra:[0]},
      {flag:'us',name:'Estados Unidos',value:8,extra:[2]},
      {flag:'uy',name:'Uruguay',value:8,extra:[1]},
      {flag:'de',name:'Alemania',value:7,extra:[1]},
    ],
  },
  {
    icon:<BarChart3 aria-hidden="true"/>,
    title:{es:'Posesión promedio (por país)',en:'Average possession'},
    rows:[
      {flag:'es',name:'España',value:'63%'},
      {flag:'de',name:'Alemania',value:'58%'},
      {flag:'br',name:'Brasil',value:'56%'},
      {flag:'fr',name:'Francia',value:'55%'},
      {flag:'pt',name:'Portugal',value:'54%'},
      {flag:'gb-eng',name:'Inglaterra',value:'52%'},
      {flag:'ar',name:'Argentina',value:'51%'},
      {flag:'nl',name:'Países Bajos',value:'50%'},
    ],
  },
]

const cards=[...playerCards.slice(0,3),...countryCards.slice(0,2),...playerCards.slice(3),...countryCards.slice(2)]

const summary = [
  {icon:<Volleyball/>,k:'86',es:'goles anotados',en:'goals scored',small:{es:'Resumen del torneo',en:'Tournament summary'}},
  {icon:<Goal/>,k:'24',es:'partidos jugados',en:'matches played'},
  {icon:<Activity/>,k:'3.58',es:'promedio de goles por partido',en:'average goals per match'},
  {icon:<Users/>,k:'32',es:'selecciones participantes',en:'participating teams'},
  {icon:<CalendarDays/>,k:'18 de junio de 2026',es:'23:45 (Hora local)',en:'23:45 (Local time)',small:{es:'Actualizado',en:'Updated'}},
]

function flagUrl(code:string) {
  return `https://flagcdn.com/w40/${code}.png`
}

function StatTable({card,language}:{card:StatCard;language:Language}) {
  const columns=card.columns?.[language]
  return <article className="stat-card">
    <header>
      <span className="stat-icon">{card.icon}</span>
      <h2>{card.title[language]}</h2>
    </header>
    {columns ? <div className={`stat-columns cols-${columns.length}`}>{columns.map(column=><span key={column}>{column}</span>)}</div> : null}
    <ol className={`stat-list ${columns ? `with-extra extras-${columns.length}` : ''}`}>
      {card.rows.map((row,index)=><li key={`${card.title.es}-${row.name}`}>
        <span className="rank">{index+1}</span>
        <span className="stat-name"><img src={flagUrl(row.flag)} alt=""/><b>{row.name}</b></span>
        <strong>{row.value}</strong>
        {row.extra?.map((value,itemIndex)=><strong key={itemIndex}>{value}</strong>)}
      </li>)}
    </ol>
  </article>
}

function StatisticsApp() {
  const [language,setLanguage]=useState<Language>('es')
  useEffect(()=>{
    document.documentElement.lang=language
    document.title=language==='es'?'Estadísticas Mundial 2026':'World Cup 2026 Statistics'
  },[language])

  return <div className="statistics-shell">
    <header className="statistics-header">
      <a className="stats-brand" href="./index.html" aria-label={language==='es'?'Volver a partidos':'Back to matches'}>
        <span><Trophy aria-hidden="true"/></span>
        <div><h1>{language==='es'?'Estadísticas':'Statistics'}</h1><p>Mundial 2026</p></div>
      </a>
      <div className="statistics-language">
        <span>{language==='es'?'Idioma':'Language'}</span>
        <div role="group" aria-label={language==='es'?'Idioma':'Language'}>
          <button className={language==='es'?'active':''} onClick={()=>setLanguage('es')}>Español</button>
          <button className={language==='en'?'active':''} onClick={()=>setLanguage('en')}>English</button>
        </div>
      </div>
    </header>
    <main className="statistics-main">
      <section className="stats-grid">{cards.map(card=><StatTable key={card.title.es} card={card} language={language}/>)}</section>
      <section className="summary-panel" aria-label={language==='es'?'Resumen del torneo':'Tournament summary'}>
        {summary.map(item=><article key={item.es}>
          <span className="summary-icon">{item.icon}</span>
          <div>{item.small ? <small>{item.small[language]}</small> : null}<strong>{item.k}</strong><p>{item[language]}</p></div>
        </article>)}
      </section>
    </main>
  </div>
}

createRoot(document.getElementById('statistics-root')!).render(<React.StrictMode><StatisticsApp/></React.StrictMode>)
