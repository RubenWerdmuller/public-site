import {spawn} from 'node:child_process';
import {mkdtemp,readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {preparePushSetup,setupFolder,root} from './push-setup.mjs';
const config=await preparePushSetup();
const scope=process.env.PUSH_VERCEL_SCOPE??'rubenwerdmullers-projects';
const project=process.env.PUSH_VERCEL_PROJECT??'public-site-goai';
if(!/^[a-z0-9_-]+$/i.test(scope)||!/^[a-z0-9_-]+$/i.test(project))throw Error('Ongeldige projectnaam of scope.');
const cache=process.env.npm_config_cache??(process.platform==='win32'?path.join(process.env.LOCALAPPDATA??path.join(os.homedir(),'AppData/Local'),'npm-cache'):path.join(os.homedir(),'.npm'));
let cli;
for(const folder of await readdir(path.join(cache,'_npx')).catch(()=>[])){
 const packageRoot=path.join(cache,'_npx',folder,'node_modules/vercel');
 try{const metadata=JSON.parse(await readFile(path.join(packageRoot,'package.json'),'utf8'));if(metadata.version==='62.7.0'){cli=path.join(packageRoot,metadata.bin.vercel);break;}}catch{}
}
if(!cli)throw Error('Installeer en log eenmalig in met npx --yes vercel@62.7.0 login, daarna npm run push:activate.');
function run(args,input){return new Promise((resolve,reject)=>{const child=spawn(process.execPath,[cli,...args],{cwd:root,windowsHide:true,stdio:['pipe','pipe','pipe'],env:{...process.env,VERCEL_TELEMETRY_DISABLED:'1'}});let output='';child.stdout.on('data',chunk=>output+=chunk);child.stderr.on('data',chunk=>output+=chunk);child.on('error',()=>reject(Error('Vercel CLI kon niet starten.')));child.on('close',code=>code===0?resolve(output):reject(Error(`Vercel-stap ${args[0]} is mislukt. Open het Vercel-dashboard om de toegang of projectinstellingen te controleren.`)));child.stdin.end(input??'');});}
try{await run(['whoami']);}catch{throw Error('Vercel is niet ingelogd. Voer npx vercel@62.7.0 login uit, daarna npm run push:activate. Er is niets op Vercel gewijzigd.');}
await run(['project','inspect',project,'--scope',scope]);
await run(['link','--yes','--project',project,'--scope',scope]);
const listing=await run(['env','ls','production','--scope',scope]);
const existing=new Set(Object.keys(config).filter(key=>new RegExp(`\b${key}\b`).test(listing)));
if(!/\bDATABASE_URL\b/.test(listing))throw Error('DATABASE_URL ontbreekt op Vercel. Koppel eerst de bestaande database; pushconfiguratie is nog niet geupload.');
if(existing.has('NEXT_PUBLIC_VAPID_PUBLIC_KEY')&&!existing.has('VAPID_PRIVATE_KEY')){
 const folder=await mkdtemp(path.join(setupFolder,'remote-check-'));const file=path.join(folder,'production.env');
 await run(['env','pull',file,'--environment=production','--yes','--scope',scope]);
 const remote=await readFile(file,'utf8');const publicLine=remote.split(/\r?\n/).find(line=>line.startsWith('NEXT_PUBLIC_VAPID_PUBLIC_KEY='));
 const publicValue=publicLine?.split('=').slice(1).join('=').replace(/^(["'])(.*)\1$/,'$2');
 if(publicValue!==config.NEXT_PUBLIC_VAPID_PUBLIC_KEY)throw Error('Er staat al een andere publieke pushsleutel op Vercel. Bestaande sleutels zijn niet overschreven.');
}
if(existing.has('VAPID_PRIVATE_KEY')&&!existing.has('NEXT_PUBLIC_VAPID_PUBLIC_KEY'))throw Error('Vercel heeft al een private pushsleutel. Herstel eerst de bijbehorende publieke sleutel; bestaande gegevens zijn niet gewijzigd.');
for(const [key,value] of Object.entries(config)){
 if(existing.has(key)){console.log(`${key}: bestaande Vercel-instelling behouden.`);continue;}
 const secret=['VAPID_PRIVATE_KEY','CRON_SECRET'].includes(key);
 await run(['env','add',key,'production','--yes',...(secret?['--sensitive']:['--no-sensitive']),'--scope',scope],value);
 console.log(`${key}: veilig toegevoegd.`);
}
await run(['--prod','--yes','--scope',scope]);
console.log(`Pushconfiguratie uitgerold naar ${config.APP_URL}. Open de geinstalleerde app, zet berichtjes aan en kies Stuur mij een testberichtje.`);
