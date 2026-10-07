import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const illustrations=JSON.parse(await readFile(path.join(root,'lib/imported-sketches.json'),'utf8'));
await mkdir(path.join(root,'public/sketches'),{recursive:true});
for(const illustration of illustrations){
 const response=await fetch(illustration.download);if(!response.ok)throw Error(`Download failed: ${illustration.id}`);
 let svg=await response.text();
 if(!/^<svg\s/.test(svg.trim())||/<(?:script|foreignObject|image|iframe|style)\b|\bon\w+\s*=|javascript:|<!ENTITY/i.test(svg))throw Error(`Unsafe SVG: ${illustration.id}`);
 svg=svg.replace(/(fill|stroke)="(?:#000000|#000|black)"/gi,'$1="#354238"');
 await writeFile(path.join(root,'public',illustration.file),svg);
}
console.log(`Downloaded ${illustrations.length} local notebook doodles.`);
