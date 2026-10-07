import importedSketches from './imported-sketches.json';
import { questions } from './questions';
import type { Option } from './domain';
export type SketchPath = { d:string; fill?:string };
export type TravelSketch = { id:string; title:string; art:string; paths:SketchPath[]; file?:string; source?:string; author?:string; license?:string };
const sage='#b7c8ac', sand='#ead8b7', clay='#ca8b70', blue='#b4cbd0', gold='#ebc879';
const p=(d:string,fill?:string):SketchPath=>({d,fill});
const circle=(x:number,y:number,r:number,fill?:string)=>p(`M${x-r} ${y}a${r} ${r} 0 1 0 ${r*2} 0a${r} ${r} 0 1 0 -${r*2} 0`,fill);
const s=(art:string,title:string,...paths:SketchPath[]):TravelSketch=>({id:`${art}-${title}`,title,art,paths});
// Original, locally authored notebook drawings. Every entry has its own subject/composition.
export const travelSketches:TravelSketch[]=[
 s('mountain','Bergpad met sneeuw',p('M55 172 143 45 224 171 279 91 351 173',sage),p('m116 86 27-41 29 41-21-9-10 10-12-12',sand),p('M162 190c-29-19 40-29 20-47',undefined)),
 s('mountain','Twee bergtoppen',p('M48 174 132 68 190 133 247 48 354 175',sage),p('m219 87 28-39 32 42-27-9-10 10-11-12',sand),p('M50 178q102-12 161 7t146-11')),
 s('mountain','Bergmeer',p('M51 130 120 47 190 133 253 62 342 135',sage),p('M76 146q115-24 247 1l-35 34H100z',blue),p('M113 157h67m27 7h61m-132 11h62')),
 s('mountain','Kabelbaan naar boven',p('M52 170 155 48 245 174',sage),p('M84 58 320 37m-64 7v38'),p('M230 85h52l-1 45h-51z',clay),p('M242 93h27v19h-27zm14-18v-9')),
 s('house','Huisje onder de zon',p('M113 99 196 41 277 100z',clay),p('M126 102v77h139v-76',sand),p('M178 178v-48h36v48m-66-63h21v23h-21zm82 0h20v23h-20z',blue),p('M243 74V43h16v42')),
 s('house','Hangmat tussen bomen',p('M81 174V76m240 98V76'),p('M59 93 83 39 109 95zM296 97 321 37 346 97z',sage),p('M92 116q106 106 218-5-118 63-218 5z',sand),p('m166 128 15 16 47-8',clay)),
 s('house','Balkon met planten',p('M105 176V53h185v124',sand),p('M133 66h128v77H133z',blue),p('M98 145h200m-200 15h200m-186-14v29m30-29v29m32-29v29m33-29v29m34-29v29m33-29v29'),p('M151 142h27l-5-20h-17z',clay),p('M165 121v-24m0 12q-22-14-21-27 22 0 21 27m1-7q2-24 22-22-1 17-22 22',sage)),
 s('house','Bad op pootjes',p('M89 110h219l-20 54H116z',sand),p('M133 165l-7 17m147-17 7 17M108 107V71q0-23 24-23v21'),circle(180,95,15,blue),circle(215,102,13,blue),circle(242,88,18,blue)),
 s('camper','Camper met surfplank',p('M79 88h149l45 44h31v35H79z',sage),p('M236 104v30h39l-30-30zM98 103h43v31H98zm58 0h43v31h-43z',blue),circle(127,168,19,sand),circle(267,168,19,sand),p('M113 72q77-23 142 0-66 12-142 0z',clay)),
 s('camper','Verdwalen mag',p('M144 184q118-45 46-92t37-57M173 184q125-50 49-95t34-54',sand),p('M86 113V44m0 8h92l-18 19H86m0 10H39L21 100h65',sage),p('M99 63h31m-91 28h22')),
 s('camper','Koffer vol avontuur',p('M124 75h153l8 101H113z',sand),p('M165 74V51h67v23m-86 1-7 101m113-101 7 101'),p('m176 113 21-16 18 20-21 16z',sage),circle(245,140,13,clay),p('M122 187h157')),
 s('camper','Auto met een eigen wil',p('M81 133h242v34H81zM120 132l22-48h111l29 48',clay),p('M151 95h42v35h-58zm55 0h38l23 35h-61z',blue),circle(132,168,20,sand),circle(270,168,20,sand),p('M121 74 116 51m131 23 8-25m-140 93h18m128 0h18M192 151q14 11 27-2')),
 s('garden','Groenten uit de moestuin',p('M85 166h225l18 21H65z',sand),p('M122 163v-58m75 58v-72m71 72v-53'),p('M122 143q-43-36-41-49 39 0 41 49m0-13q5-47 41-49 2 32-41 49M196 135q-40-25-36-54 35 8 36 54m0-18q7-41 39-46-1 32-39 46M268 150q-32-27-29-45 26 4 29 45m0-13q9-35 32-33-1 24-32 33',sage)),
 s('garden','Gieter en een eigenwijze bloem',p('M113 131h113v43H113zM225 139l40-31 9 15-49 39M141 130v-28h58v28',sage),p('M302 166v-60m0 41-20-18m20-5 21-18'),circle(302,82,26,gold),circle(302,82,9,clay),p('M293 81v3m17-3v3m-13 7q6 4 11-2')),
 s('garden','Tomaten met karakter',circle(149,133,32,clay),circle(223,128,39,clay),p('m135 109 13-18 12 18-12-8zM204 101l18-19 16 22-16-10z',sage),p('M138 130v4m23-4v4m-18 13q8 7 14-1m52-19v5m24-5v5m-21 14q10 8 18-3')),
 s('garden','Kruiwagen na het klussen',p('M100 100h146l-27 51h-96z',sage),p('M104 112 68 88m166 62 25 28m-132-28-6 30m24-39 139 18'),circle(283,160,25,sand),p('M129 101l9-28 31 8 12-24 40 23-6 20',sand)),
 s('surf','Surfplank op het strand',p('M92 176q99-13 208 2',sand),p('M188 174q-46-89 4-137 52 46 15 137z',clay),p('M195 50v113m-9-48h24'),p('M44 145q19-13 40 0t40 0m142 0q20-13 42 0t37 0',blue)),
 s('surf','Golf met een klein board',p('M52 172q66-4 113-63 63-85 117-38-56-4-39 32 21 36 93 67z',blue),p('M171 127q46-17 98-9-44 24-98 9z',sand),p('M72 183q15-10 34 0t35 0m69 0q15-10 34 0t35 0')),
 s('surf','Strandparasol en slippers',p('M198 52q-75 0-97 49h190q-19-49-93-49z',clay),p('M198 52v123m0-118q-30 12-39 45m39-45q30 12 39 45'),p('M112 159q-24-25-30 13-6 27 20 22zm23-5q30-12 29 26-7 22-31 10z',sand),p('m84 172 14-3 3 14m43-22-4 16 13-2')),
 s('surf','Krab neemt vakantie',p('M159 133q-6-43 45-45t45 43q-38 22-90 0z',clay),p('M174 93l-9-20m61 20 9-20m-67 63-24 21m36-14-12 24m62-30 26 22m-39-17 13 28m-62-58-30-9 7-22m97 30 27-10-5-21'),circle(165,70,8,sand),circle(235,70,8,sand),p('m186 116 12 10 13-10')),
 s('hiking','Wandelschoenen',p('M89 85h58v48l47 15v24H86zM224 63h45v65l48 18v26h-93z',sand),p('M88 174h109m27 0h96m-214-64h27m-27 13h27m109-27h23m-23 14h23m-23 14h23')),
 s('hiking','Rugzak en routekaart',p('M97 92q0-33 44-33t43 33v83H97z',sage),p('M117 127h47v39h-47zM120 57v-16h37v16m-60 44h87'),p('M225 78 254 91 287 78 319 91v84l-31-13-33 13-30-13z',sand),p('M254 92v81m33-94v82m-46-43q65 43 64-9',undefined)),
 s('hiking','Picknick op een kleed',p('M73 132h241l24 46H50z',sand),p('M101 132 82 176m71-44-8 44m58-44v44m43-44 10 44M65 153h261'),p('M137 118h49l-10 22h-29z',clay),p('M216 114h18v27h-18zm27 2h27v21h-27z',sage)),
 s('hiking','Kompas voor de omweg',circle(194,123,57,sand),circle(194,123,46),p('m171 149 19-61 27 60-23-10z',clay),p('M194 76v12m0 70v12m-46-47h12m67 0h14M172 66v-14h39v14m-48 113-17 13m72-13 19 13')),
 s('sailing','Zeilboot met wind mee',p('M104 145h205l-39 37H136z',clay),p('M204 142V42l-78 96h70zm10-4V62l61 74z',sand),p('M71 190q22-12 44 0t44 0t44 0t44 0t44 0',blue),p('M62 71h47m-26 15h39')),
 s('sailing','Zeilles en knopen',p('M92 140q-40-46 4-66 50-24 68 34 15 52 69 32 52-20 37-49-10-17-27-3-30 29 35 54l42 8'),p('M100 140q-39-34-4-54 39-14 53 28 20 66 86 39'),p('M267 74V45l46 24-46 7',sage),p('M267 46v124')),
 s('sailing','Fles met een bootdroom',p('M160 55h67v30q26 22 26 51v47H135v-47q0-30 25-51z',blue),p('M166 44h55v15h-55z',sand),p('M154 145h80l-19 19h-45z',clay),p('M190 145v-43l-31 40h26zm7-4v-30l26 30z',sand)),
 s('sailing','Anker en een meeuw',p('M198 89v84m-37-68h74M131 131q0 48 67 49 69-2 70-48m-137-1-15 16m15-16 18 8m119-7 16 16m-16-16-17 8',blue),circle(198,74,15),p('M85 65q15-21 29 0 15-21 30 0m123-21q13-18 24 0 14-16 25 0')),
 s('pottery','Mok met scheve oren',p('M137 87h111v74q-49 33-111 0z',sand),p('M250 103q70-29 34 49l-35 5M164 68q-14-17 0-31m35 31q-14-17 0-31'),p('M169 125v4m43-4v4m-38 17q18 16 33-2')),
 s('pottery','Vaas op de draaischijf',p('M169 47h63l-13 47q46 47 26 66h-88q-20-23 27-67z',clay),p('M169 50q30 14 63 0M163 139q38 13 73 0'),p('M107 168q88-19 177 0-78 23-177 0z',sand),p('M118 181h153m-73-3v16')),
 s('pottery','Drie heel eigen potjes',p('M78 112h66l-8 59H88z',clay),p('M168 90h66l8 79h-84z',sand),p('M269 107h46l18 63h-80z',sage),p('M99 138q8 8 17 0m-34-18h58m31-15h58m-54 18h52m-51 16h54m23-20 37 39m-22-37 24 23')),
 s('pottery','Verfkwasten en kleurvlekken',p('M154 171l19-108 17 2-15 109z',sand),p('M173 62q-13-43 19-49 18 21-2 52z',clay),p('M211 174l-17-112 17-3 22 111z',sand),p('M194 63l-8-33 28-6-4 37z',sage),circle(111,141,22,blue),circle(285,118,26,gold)),
 s('alpaca','Alpaca met zonnebril',p('M155 173v-71q-18-65 26-57 24-17 45 7 36 18 8 52v69',sand),p('M163 55l-7-31 18-9 12 35m18-1 8-32 17 5-8 37',sand),p('M160 74h34v20h-34zm42 0h33v20h-33zm-8 8h8',sage),p('M182 112q14 12 26-1m-39 33 13 7m37-11-12 10')),
 s('alpaca','Kat met lokale meningen',p('M148 168q-25-70 3-87V44l37 26 24-1 30-28 2 44q36 61 0 83z',sand),p('M160 108v4m66-4v4m-39 8 11 10 9-10m-9 10v13m-24-15-36-7m33 17-36 4m74-15 41-6m-39 15 35 10M244 169q65 10 51-38')),
 s('alpaca','Slak heeft geen haast',p('M102 161h157q25-2 14-40m-1 8 7-28m-17 35-2-26',sage),circle(171,123,44,sand),p('M171 146q-37-2-21-38 17-21 36-1 15 24-13 26-13-1-9-12'),circle(281,98,5),circle(259,108,5)),
 s('alpaca','Dramatische vakantiegans',p('M157 164q-53-21-13-61l48 4q-6-52 19-61 24 0 24 19-9 18-23 17l7 60q-3 23-62 22z',sand),p('m236 57 34 12-34 7',gold),p('M167 167v17h-20m47-20v20h22M152 121q23 40 40 4m29-65h1M115 78l-16-9m24-7-3-19')),
 s('coffee','Koffie met tijd genoeg',p('M137 97h109v59q-49 33-109 0z',sand),p('M246 105q55-11 32 38l-32 6M108 180q86-13 172 0M165 75q-17-17 0-39m34 40q-17-17 0-39m33 41q-17-17 0-39')),
 s('coffee','Koffiepot op het vuur',p('M165 55h68l18 50-10 62h-83l-10-62z',sage),p('M159 55h84m-79 0 6-18h53l10 18m-33 29v53m-49-30h96m-18 3q61-16 38 40l-38 7'),p('m169 189 17-13 13 13 15-13 17 13',gold)),
 s('coffee','Pannenkoekenonderzoek',p('M108 151q83-27 170 0-80 30-170 0z',sand),p('M118 139q77-23 151 0-74 24-151 0zM125 127q67-22 137 0-72 22-137 0z',gold),p('M172 112h45v13h-45z',sand),p('M294 98v74m-8-72v-17m8 17V81m8 19V82M89 97v74m-5-72q-14-21 4-21t5 22')),
 s('coffee','Theepot voor twee',p('M158 84q-43 55-5 80h93q28-30-4-81z',sand),p('M164 83h73m-50-1V70h27v12m-65 33-36-28-11 14 47 45m94-45q70-16 36 45l-30 5'),p('M73 155h43v29H73zM285 158h39v26h-39z',sage)),
 s('market','Marktkraam met luifel',p('M84 94l22-39h190l25 39z',clay),p('M105 96v88m192-88v88m-192-55h192v44H105',sand),p('M133 57l-8 36m42-36-3 36m38-36v36m36-36 4 36m30-36 10 36'),circle(150,119,12,clay),circle(178,119,12,gold),p('M224 130l-1-40 19 7 16 33',sage)),
 s('market','Mand vol marktgroenten',p('M126 119h156l-19 60H145z',sand),p('M153 114q1-75 100 0m-108 23h116m-108 20h100m-68-37 5 57m31-57v57m30-57-6 57'),circle(165,107,17,clay),p('M198 117l3-39 31 4-16 37m29-3 9-34 17 8-13 32',sage)),
 s('market','Spaarpot voor avontuur',p('M121 133q-1-48 67-48 63-3 68 40h28v25h-32l-15 28h-17v-19h-47v19h-19l-12-23z',clay),p('M166 85l-3-22 24 21m-9 16h35m-91 20q-39-23-32 6m160-8h1'),circle(200,57,16,gold),p('M194 52h10m-10 8h10')),
 s('market','Brood en kaas voor onderweg',p('M98 163q-20-72 70-88 42 39 13 87z',sand),p('M111 104l17 18m7-32 17 22m5-29 14 22'),p('M218 164V95l79 43v26z',gold),circle(237,142,7),circle(267,151,5),p('M202 178h111')),
 s('yoga','Rustig op het matje',p('M93 172h218l22 12H74z',sage),circle(201,71,17,sand),p('M202 92v49m0-39-46 31m46-30 46 30m-91 13q41-30 84 0l-16 17h-47z',clay),p('M94 85q13-26 0-44m209 42q-13-26 0-44')),
 s('yoga','Een stapel zachte kussens',p('M99 151q85-23 193 0l-11 24H108z',sage),p('M123 125q71-19 146 0l-7 25H126z',sand),p('M149 101q47-15 93 0l-7 25h-78z',clay),p('M171 67q-11-17 0-29m28 29q-11-17 0-29m27 29q-11-17 0-29')),
 s('yoga','Dagboek zonder haast',p('M99 71q52-14 102 5 46-20 101-7v98q-49-8-101 10-51-17-102-8z',sand),p('M201 77v100m-81-77 58 3m-58 15 58 3m-58 15 58 3m-58 15 58 3m54-50 48-6m-48 20 48-6'),p('M271 165l41-82 10 5-41 82z',sage)),
 s('yoga','Kaarsje en stilte',p('M170 101h61v73h-61z',sand),p('M170 104q30 11 61 0m-61 24q8 19 17 0m16-21v-18'),p('M201 91q-28-20 0-54 27 34 0 54z',gold),p('M127 180q73-16 146 0M141 83l-20-9m146 8 19-12m-85-50v-12')),
 s('dance','Dansschoenen op het dorpsplein',p('M90 105h47v32l50 18v23H82zM224 69h44v70l40 18v21h-87z',clay),p('M81 182h108m32 0h90m-201-67h23m107-11h22'),p('M140 71V38l27-6v34m-27 5q-23 9-18-6 6-8 18-2m27 3q-21 10-18-5 4-9 18-2M285 83l14-24 17 10')),
 s('dance','Gitaar bij de gathering',p('M206 85l32-46 17 11-35 53q28 49-15 62-19 21-49-2-34-15-17-43 3-20 23-17 17 4 22-17z',sand),circle(192,125,15),p('M177 147l70-101m-62 104 69-99m-84 100 23 14M102 84V51l25-7v33m-25 7q-18 8-15-5 4-8 15-1')),
 s('dance','Discobal boven het gras',circle(199,93,46,sand),p('M199 47V24m-38 39 76 61m-64-78 81 56m-94-1 61-52m-52 74 69-65m-42-11v91'),p('M199 154v28m-78-50-21 14m194-13 19 14m-171 20-15 16m133-16 17 18',gold)),
 s('dance','Spelletjes met nieuwe vrienden',p('M105 94l61-19 47 39-64 22zM105 94v63l44 33 1-54m0 54 64-24v-52',sand),circle(154,105,6),p('M119 128v4m13 22v4m44-21v4m20 13v4'),p('M248 115l32-11 23 58-33 13z',clay),p('M263 133q11-16 20 1-1 13-10 22-15-6-10-23',sand)),
 s('campfire','Kampvuur met verhalen',p('M150 174l94-14m-95-1 95 15',sand),p('M170 158q-27-35 18-75-4 27 13 21 24-5 8-44 57 59 21 98z',clay),p('M187 157q-12-19 15-42 25 25 13 42z',gold),p('M97 165v-37h-25m226 37v-37h27M76 178h39m168 0h38')),
 s('campfire','Tent onder de sterren',p('M105 174 202 65 307 175z',sage),p('M154 174l48-109 48 109z',sand),p('M202 108v66m-95-20-21 29m214-26 19 26'),p('m107 44 5-12 5 12-11-6h13m144 2 5-12 5 12-11-6h13m-33-18 3-9 4 9',gold)),
 s('campfire','Marshmallows met grote plannen',p('M92 168 269 75M105 84 272 185'),p('m246 77 31-18 12 23-31 18zM113 68l28 16-13 22-28-16z',sand),p('M156 175q-15-31 22-56-5 27 13 17 19-20 17-40 50 42 27 78z',clay),p('M141 187h109')),
 s('campfire','Lampje naast de tent',p('M154 174V94h89v80z',sand),p('M147 89h104l-20-19h-64zM151 180h97m-80-110V50q30-33 63 0v20m-40 42v53m20-53v53',sage),p('M191 155q-17-23 8-44 24 26 9 44z',gold)),
 ...importedSketches.map(sketch=>({...sketch,paths:[]})),
];
const themeCounts=new Map<string,number>();
const questionPositions=new Map(questions.flatMap(question=>question.options.map((option,index)=>{
 const position=themeCounts.get(option.art)??0;themeCounts.set(option.art,position+1);
 return [`${question.id}:${index}`,position] as const;
})));
export function selectTravelSketch(option:Option,questionId:string,index:number):TravelSketch {
 const matches=travelSketches.filter(sketch=>sketch.art===option.art);
 const pool=matches.length?matches:travelSketches.filter(sketch=>sketch.art==='mountain');
 // Rotate within a theme, so gaps in question IDs never skip half the drawings.
 const position=questionPositions.get(`${questionId}:${index}`)??((Number(questionId.replace(/\D/g,''))||0)+index);
 return pool[position%pool.length];
}
