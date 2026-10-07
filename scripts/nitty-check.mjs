import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {chromium} from '@playwright/test';
import path from 'node:path';
import net from 'node:net';
const port=3113,base=`http://127.0.0.1:${port}`;
await new Promise((resolve,reject)=>{const probe=net.createServer();probe.once('error',reject);probe.listen(port,'127.0.0.1',()=>probe.close(resolve));});
const email=`nitty-${randomBytes(6).toString('hex')}@example.test`;
const server=spawn(process.execPath,[path.resolve('node_modules/next/dist/bin/next'),'start','--hostname','127.0.0.1','--port',String(port)],{cwd:process.cwd(),stdio:['ignore','pipe','pipe'],windowsHide:true,env:{...process.env,DATABASE_URL:'',VERCEL:'',AI_ADMIN_EMAILS:email,VAPID_PRIVATE_KEY:'',NEXT_PUBLIC_VAPID_PUBLIC_KEY:''}});
server.stderr.on('data',()=>{});server.stdout.on('data',()=>{});
let cookie='',browser;
async function api(url,payload){
 const response=await fetch(`${base}${url}`,{method:payload?'POST':'GET',headers:{Cookie:cookie,...(payload?{Origin:base,'Content-Type':'application/json'}:{})},body:payload?JSON.stringify(payload):undefined});
 const session=response.headers.get('set-cookie');if(session)cookie=session.split(';')[0];
 return {status:response.status,data:await response.json()};
}
try{
 for(let attempt=0;attempt<100;attempt++){
  if(server.exitCode!==null)throw Error('Temporary test server stopped.');
  try{if((await fetch(base)).ok)break;}catch{}
  if(attempt===99)throw Error('Temporary test server did not become ready.');
  await new Promise(resolve=>setTimeout(resolve,100));
 }
 assert.equal((await api('/api/app',{action:'register',email,password:'local-nitty-test-123',name:'Nitty',avatar:2})).status,200);
 const dashboard=(await api('/api/app')).data;
 const budget=dashboard.preferences.find(p=>p.attribute==='monthlyBudget');
 const payload={action:'preference',preferenceId:budget.key,kind:'open_question',notes:budget.notes,confidence:.5,boundary:null};
 assert.equal((await api('/api/app',{...payload,value:'1800'})).status,200);
 assert.equal((await api('/api/app')).data.preferences.find(p=>p.key===budget.key).value,1800);
 assert.equal((await api('/api/app',{...payload,value:''})).status,200);
 assert.equal((await api('/api/app')).data.preferences.find(p=>p.key===budget.key).value,null);
 for(const value of ['oops',-1,'-1'])assert.equal((await api('/api/app',{...payload,value})).status,400);
 const month=dashboard.preferences.find(p=>p.attribute==='departureMonth');
 assert.equal((await api('/api/app',{...payload,preferenceId:month.key,value:13})).status,400);
 const taskInput={kind:'questions',instruction:'Maak nieuwe vragen over kamperen.',scheduledAt:new Date().toISOString()};
 const initial=await api('/api/ai/tasks',taskInput);assert.equal(initial.status,200);const task=initial.data.tasks[0];
 browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL??'msedge',headless:true});
 const context=await browser.newContext();
 const [name,value]=cookie.split('=');await context.addCookies([{name,value,url:base}]);
 await context.addInitScript(()=>{const interval=window.setInterval;window.setInterval=(callback,delay,...args)=>{if(delay===20000){window.nittyPoll=callback;return 0;}return interval(callback,delay,...args);};});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 let held,notifyHeld;const heldReady=new Promise(resolve=>{notifyHeld=resolve;});
 await page.route('**/api/ai/tasks',async route=>{
  if(route.request().method()==='GET'){held=route;notifyHeld();return;}
  assert.equal(route.request().postDataJSON().action,'cancel');
  await route.fulfill({json:{tasks:[{...task,status:'cancelled'}]}});
 });
 await page.goto(`${base}/ai`);await page.getByRole('button',{name:'Annuleren',exact:true}).waitFor();
 await page.evaluate(()=>window.nittyPoll());await heldReady;
 await page.getByRole('button',{name:'Annuleren',exact:true}).click();
 await page.getByText('Geannuleerd',{exact:true}).waitFor();
 const responseReady=page.waitForResponse(response=>response.url()===`${base}/api/ai/tasks`&&response.request().method()==='GET');
 await held.fulfill({json:{tasks:[task]}});await (await responseReady).finished();
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 assert.equal(await page.getByText('Geannuleerd',{exact:true}).isVisible(),true);
 assert.equal(await page.getByRole('button',{name:'Annuleren',exact:true}).count(),0);
 assert.deepEqual(errors,[]);
 for(let i=0;i<9;i++)assert.equal((await api('/api/ai/tasks',taskInput)).status,200);
 assert.equal((await api('/api/ai/tasks',taskInput)).status,429);
 console.log('PASS: numeric preference API validation, empty stays open, queue cap through HTTP, stale polling cannot undo an AI task cancellation; no cloud calls.');
}finally{
 if(browser)await browser.close();
 if(server.exitCode===null){server.kill();await new Promise(resolve=>server.once('exit',resolve));}
}
