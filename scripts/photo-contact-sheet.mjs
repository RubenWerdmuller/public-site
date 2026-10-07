import sharp from 'sharp';
import { readFile, mkdir } from 'node:fs/promises';
const photos=JSON.parse(await readFile('public/photos/credits.json','utf8'));
await mkdir('test-results',{recursive:true});
const tiles=await Promise.all(photos.map(async(p,i)=>({input:await sharp(`public${p.file}`).resize(180,120,{fit:'cover'}).extend({bottom:25,background:'#f7f5ed'}).composite([{input:Buffer.from(`<svg width="180" height="25"><text x="5" y="17" font-size="13">${p.id}</text></svg>`),top:120,left:0}]).png().toBuffer(),left:(i%6)*180,top:Math.floor(i/6)*145})));
await sharp({create:{width:1080,height:Math.ceil(photos.length/6)*145,channels:3,background:'#f7f5ed'}}).composite(tiles).png().toFile('test-results/photos.png');
