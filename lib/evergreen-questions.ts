import type {Question,Option} from './domain';
/**
 * Infinite, deterministic, non-experimental conversation bank.
 * Questions have immutable pair+ordinal+slot IDs, remain replayable forever,
 * and are never interpreted as DCE observations or calibrated utilities.
 */
const moments=[
 ['De heenweg','Onderweg door onbekende dorpen','Een paar dagen in één bijzonder stadje'],
 ['De eerste week','Meteen eropuit om nieuwe mensen te ontmoeten','Langzaam acclimatiseren met lange wandelingen'],
 ['Tussen twee verblijven','Een onverwachte omweg voor iets bijzonders','Een rustige tussenstop om even thuis te komen'],
 ['Op een lange thuisbasis','Een ritme opbouwen alsof jullie hier wonen','Iedere dag iets kleins nieuws ontdekken'],
 ['Een vrije week','Niets vastleggen en zien waar je belandt','Een bijzonder avontuur helemaal voorbereiden'],
 ['De terugreis','Terug met een paar mooie verrassende stops','Langzaam naar huis met tijd om na te genieten'],
 ['Een regenachtige dag','Een vreemde workshop binnensluipen','Een café vinden en een verhaal schrijven'],
 ['Een lokale feestdag','Met een onbekend gezelschap meevieren','Met z’n tweeën een eigen traditie verzinnen'],
 ['Een ochtend zonder plan','De buurt lopend ontdekken','Samen uitslapen en ergens uitgebreid ontbijten'],
 ['Een plek waar je wilt blijven','Het verblijf spontaan verlengen','Toch verder reizen voor het volgende onbekende'],
 ['Een avond onderweg','Een klein concert of improvisatieavond vinden','Onder de sterren zitten met iets lekkers'],
 ['Een zondag in het buitenland','Vrijwillig meehelpen bij een lokaal initiatief','Je eigen project maken op een rustige plek'],
];
const perspectives=[
 {title:'Welke herinnering wil je maken?',prefix:'Stel je voor:',detail:'Beeld je in hoe deze keuze voelt als je er later samen over vertelt.'},
 {title:'Wat zou je morgen het liefst doen?',prefix:'Je hebt onverwacht de tijd:',detail:'Het mag klein en eenvoudig zijn, zolang het goed voelt.'},
 {title:'Een klein onverwacht avontuur',prefix:'De dag loopt anders dan verwacht:',detail:'Beide keuzes passen in een lange reis; er is geen juist antwoord.'},
 {title:'Hoe graag wil je hier landen?',prefix:'Jullie hoeven even nergens naartoe:',detail:'Welk idee geeft je op dit moment meer zin in vertrekken?'},
 {title:'Waar word jij echt nieuwsgierig van?',prefix:'Twee mogelijkheden dienen zich aan:',detail:'Kies zonder eerst alles praktisch uit te rekenen.'},
 {title:'Tijd voor iets nieuws',prefix:'Een plaatselijke tip verandert het plan:',detail:'Hoe zouden jullie je vrije tijd het liefst benutten?'},
 {title:'Een kans om iets te leren',prefix:'Er is ruimte voor één bijzondere ervaring:',detail:'Stel je voor dat er geen verkeerde keuze bestaat.'},
 {title:'Dat ene verhaal voor later',prefix:'Over tien jaar kijk je hierop terug:',detail:'Welke versie zou je dan het liefst herinneren?'},
 {title:'Wat voelt als vakantie?',prefix:'De drukte is ineens weg:',detail:'Maak een intuïtieve keuze over deze manier van reizen.'},
 {title:'Welk ritme klopt?',prefix:'Je bent al een tijdje onderweg:',detail:'Waar krijg je dan het meeste energie van?'},
 {title:'Samen op een onbekende plek',prefix:'Er is een vrije middag:',detail:'Welke afslag zou je spontaan nemen?'},
 {title:'Ruimte om te dromen',prefix:'Niets is vandaag verplicht:',detail:'Welke mogelijkheid voelt aantrekkelijker voor jullie avontuur?'},
];
const combinations=[
 ['Kunst en maken','Een keramiekworkshop volgen bij een lokale maker','Een kleine galerie of atelier ontdekken'],
 ['Natuur dichtbij','Op zoek naar een stille zwem- of wandelplek','Een dag naar een bijzonder landschap verderop'],
 ['Muziek en ontmoetingen','Meedoen met een lokale jamsessie','Een intiem optreden ontdekken'],
 ['Eten en gezelligheid','Samen iets typisch lokaals leren koken','Een lange avond aanschuiven aan een grote tafel'],
 ['Buiten slapen','Een nacht kamperen op een stille plek','Een bijzonder kleinschalig pension proberen'],
 ['Leren en groeien','Een cursus volgen bij iemand uit de buurt','Je verdiepen in de geschiedenis van de streek'],
 ['Samen ontspannen','Een sauna of warm bad ergens ontdekken','Een middag langzaam ronddwalen zonder haast'],
 ['Spontaan contact','Een uitnodiging van locals aannemen','Met z’n tweeën een eigen avontuur verzinnen'],
 ['Verplaatsen of landen','Een nieuw gebied intrekken en onderweg stoppen','Nog wat langer blijven omdat het hier fijn voelt'],
 ['Tijd maken','Een hele dag vrijhouden voor één activiteit','Verschillende kleine ervaringen combineren'],
 ['Op het water','Een dagje zeilen of varen met iemand uit de buurt','Een lange wandeling langs het water maken'],
 ['Ver weg voelen','Een afgelegen natuurplek zoeken','Een bruisende wijk verkennen'],
];
const landscapes=['aan een ruige kust','in een bergdorp','in een groene vallei','aan de rand van een oud centrum',
 'naast een klein natuurpark','op het platteland','langs een stille rivier','vlak bij een bruisende stad',
 'in een streek met wijngaarden','in een bosrijk gebied','bij een onbekend meer','op een zonnig eiland'];
const conditions=['tijdens de eerste week','op een vrije dag','net na een lange reisdag','na een paar weken ergens wonen',
 'wanneer jullie weinig geld willen uitgeven','na een uitnodiging van een local','terwijl het regent','in het weekend'];
export function evergreenId(pairId:string,ordinal:number,slot:number){
 if(!/^[a-zA-Z0-9-]{1,100}$/.test(pairId)||!Number.isSafeInteger(ordinal)||ordinal<1||slot<0||slot>3)
  throw Error('Ongeldige vraagidentiteit.');
 return 'ev1-'+pairId+'-'+ordinal+'-'+slot;
}
export function createEvergreenQuestion(pairId:string,ordinal:number,slot:number):Question{
 const id=evergreenId(pairId,ordinal,slot);
 const index=(ordinal-1)*4+slot;
 const period=moments[(index*5+Math.floor(index/moments.length))%moments.length];
 const theme=combinations[(index*7+Math.floor(index/combinations.length))%combinations.length];
 const angle=perspectives[(index*3+Math.floor(index/perspectives.length))%perspectives.length];
 const flip=Math.floor(index/4)%2===1;
 const landscape=landscapes[(index*7+Math.floor(index/11))%landscapes.length];
 const situation=conditions[(index*3+Math.floor(index/23))%conditions.length];
 const a=slot%2===0?period[1]:theme[1];
 const b=slot%2===0?period[2]:theme[2];
 const opts=flip?[b,a]:[a,b];
 const option=(title:string,side:number):Option=>({
  title,subtitle:side===0?'Dit trekt me nu het meest.':'Of toch liever deze mogelijkheid?',
  details:[angle.detail,'Een fijne invalshoek voor jullie toekomstige lange reis.'],attributes:{},art:'nature',
 });
 return {
  id,title:angle.title,theme:slot%2===0?period[0]:theme[0],
  type:'reflection',role:slot%2===0?'wildcard':'personal',
  intro:angle.prefix+' Jullie zijn '+landscape+', '+situation+'. '+(slot%2===0?period[0]:theme[0])+'.',
  options:[option(opts[0],0),option(opts[1],1)],informationValue:0,
  focus:[],
 };
}
export function createEvergreenBatch(pairId:string,ordinal:number){
 return Array.from({length:4},(_,i)=>createEvergreenQuestion(pairId,ordinal,i));
}
