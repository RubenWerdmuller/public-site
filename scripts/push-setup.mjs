import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {createECDH,randomBytes,timingSafeEqual} from 'node:crypto';
export const root=path.resolve(import.meta.dirname,'..');
export const setupFolder=path.join(root,'data/push-setup');
export const setupFile=path.join(setupFolder,'production.env');
async function readEnv(file){try{const text=await readFile(file,'utf8');return Object.fromEntries(text.split(/\r?\n/).filter(line=>/^[A-Z_]+=.*/.test(line)).map(line=>{const position=line.indexOf('=');return [line.slice(0,position),line.slice(position+1).replace(/^(["'])(.*)\1$/,'$2')];}));}catch(error){if(error.code==='ENOENT')return {};throw error;}}
export async function preparePushSetup(){
 const local=await readEnv(path.join(root,'.env.local'));const stored=await readEnv(setupFile);const values={...local,...stored};
 if(!values.VAPID_PRIVATE_KEY&&!values.NEXT_PUBLIC_VAPID_PUBLIC_KEY){const curve=createECDH('prime256v1');curve.generateKeys();values.VAPID_PRIVATE_KEY=curve.getPrivateKey().toString('base64url');values.NEXT_PUBLIC_VAPID_PUBLIC_KEY=curve.getPublicKey().toString('base64url');}
 if(values.VAPID_PRIVATE_KEY&&!values.NEXT_PUBLIC_VAPID_PUBLIC_KEY){const curve=createECDH('prime256v1');curve.setPrivateKey(Buffer.from(values.VAPID_PRIVATE_KEY,'base64url'));values.NEXT_PUBLIC_VAPID_PUBLIC_KEY=curve.getPublicKey().toString('base64url');}
 if(!values.VAPID_PRIVATE_KEY)throw Error('Er is al een publieke sleutel. Voeg de bijbehorende private sleutel veilig toe; bestaande sleutels worden niet vervangen.');
 const curve=createECDH('prime256v1');curve.setPrivateKey(Buffer.from(values.VAPID_PRIVATE_KEY,'base64url'));const actual=curve.getPublicKey(),expected=Buffer.from(values.NEXT_PUBLIC_VAPID_PUBLIC_KEY,'base64url');if(actual.length!==expected.length||!timingSafeEqual(actual,expected))throw Error('De bestaande pushsleutels passen niet bij elkaar. Ze zijn niet gewijzigd.');
 const config={APP_URL:stored.APP_URL??'https://rubenwerdmuller.nl',NEXT_PUBLIC_VAPID_PUBLIC_KEY:values.NEXT_PUBLIC_VAPID_PUBLIC_KEY,VAPID_PRIVATE_KEY:values.VAPID_PRIVATE_KEY,VAPID_SUBJECT:values.VAPID_SUBJECT??'https://rubenwerdmuller.nl',CRON_SECRET:values.CRON_SECRET??randomBytes(32).toString('base64url')};
 if(config.CRON_SECRET.length<32)throw Error('Het bestaande CRON_SECRET is te kort. Het is niet overschreven.');
 if(!URL.canParse(config.VAPID_SUBJECT)||!['https:','mailto:'].includes(new URL(config.VAPID_SUBJECT).protocol))throw Error('VAPID_SUBJECT moet een geldige https: of mailto: URL zijn.');
 await mkdir(setupFolder,{recursive:true});
 if(!Object.keys(stored).length)await writeFile(setupFile,Object.entries(config).map(([key,value])=>`${key}=${value}`).join('\n')+'\n',{flag:'wx',mode:0o600});
 return config;
}
