import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
const sketches=JSON.parse(await readFile('lib/imported-sketches.json','utf8'));
const scenes=JSON.parse(await readFile('lib/notebook-scenes.json','utf8'));
const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL??'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:900}});const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:3100/schetsboek');
 assert.equal(await page.locator('.sketch-gallery figure').count(),206);
 assert.equal(await page.locator('.sketch-credits').textContent().then(t=>t.includes('100 extra tekeningen')),true);
 for(const sketch of sketches){
  assert.equal(await page.locator(`[data-sketch="${sketch.id}"] image`).getAttribute('href'),sketch.file);
 }
 for(const scene of scenes){assert.equal(await page.locator(`[data-sketch="${scene.id}"]`).count(),1);assert.ok(await page.locator(`[data-sketch="${scene.id}"] > path`).count()>0);}
 const loaded=await page.evaluate(async files=>Promise.all(files.map(file=>new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(img.naturalWidth>0);img.onerror=()=>resolve(false);img.src=file;}))),sketches.map(s=>s.file));
 assert.ok(loaded.every(Boolean),'all local SVGs load');
 await page.setViewportSize({width:390,height:844});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.setViewportSize({width:1280,height:900});
 await page.locator('.sketch-gallery figure').evaluateAll((figures,ids)=>figures.filter(figure=>!ids.includes(figure.querySelector('[data-sketch]')?.getAttribute('data-sketch'))).forEach(figure=>figure.remove()),scenes.map(scene=>scene.id));
 await mkdir('test-results',{recursive:true});
 await page.screenshot({path:'test-results/new-sketches.png',fullPage:true});
 assert.deepEqual(errors,[]);
 console.log('PASS: 206 registered sketches, 100 local SVGs load, credits, all new drawings rendered, desktop/mobile without overflow or browser errors.');
}finally{await browser.close();}
