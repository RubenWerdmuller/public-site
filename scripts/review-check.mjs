import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import webpush from 'web-push';
import {initialPreview,previewDashboard} from '../lib/demo.ts';

const base=process.env.APP_TEST_URL??'http://localhost:3100';
for(const [body,status] of [['{',400],['null',400],['[]',400],['x'.repeat(16001),413]]){
  const response=await fetch(`${base}/api/app`,{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body});
  assert.equal(response.status,status);
}
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
  const context=await browser.newContext({viewport:{width:390,height:844}});
  await context.addInitScript(()=>{
    const original=window.setInterval;
    window.setInterval=(callback,delay,...args)=>{if(delay===20000){window.reviewPoll=callback;return 0;}return original(callback,delay,...args);};
    Object.defineProperty(navigator,'serviceWorker',{value:{register:async()=>({})}});
  });
  const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
  const data=previewDashboard({...initialPreview(),active:'roebie'});
  let count=0,held,notifyHeld;const heldReady=new Promise(resolve=>{notifyHeld=resolve;});
  await page.route('**/api/app',async route=>{
    count++;
    if(count===2){held=route;notifyHeld();return;}
    await route.fulfill({json:count===3?{user:null}:data});
  });
  await page.goto(`${base}/?screen=settings`);await page.getByRole('button',{name:'Bewaar mijn profiel'}).waitFor();assert.equal(await page.locator('.avatar-picker button[aria-pressed=true]').getAttribute('aria-label'),'Kies Roebie \u00b7 met pet');
  await page.evaluate(()=>window.reviewPoll());
  await heldReady;
  // The first poll is deliberately kept pending while the newer poll reports logout.

  await page.evaluate(()=>window.reviewPoll());await page.getByRole('button',{name:'Begin jullie boekje'}).waitFor();
  await held.fulfill({json:data});await page.waitForLoadState('networkidle');
  assert.equal(await page.getByRole('button',{name:'Bewaar mijn profiel'}).count(),0);
  assert.equal(await page.getByRole('button',{name:'Begin jullie boekje'}).count(),1);

  const pushContext=await browser.newContext();const publicKey=webpush.generateVAPIDKeys().publicKey;
  await pushContext.addInitScript(()=>{
    window.rotation={removed:0,subscribed:0};
    const old={options:{applicationServerKey:new Uint8Array([1,2,3]).buffer},unsubscribe:async()=>{window.rotation.removed++;return true;}};
    const registration={pushManager:{getSubscription:async()=>old,subscribe:async()=>{window.rotation.subscribed++;return {toJSON:()=>({endpoint:'https://fcm.googleapis.com/test-only',keys:{p256dh:'test',auth:'test'}})};}}};
    Object.defineProperty(navigator,'serviceWorker',{value:{register:async()=>registration,ready:Promise.resolve(registration)}});
    Object.defineProperty(window,'Notification',{value:{requestPermission:async()=>'granted'}});
    Object.defineProperty(window,'PushManager',{value:function(){}});
  });
  const pushPage=await pushContext.newPage();pushPage.on('pageerror',error=>errors.push(error.message));let saved=0,profile;
  await pushPage.route('**/api/app',async route=>{
    if(route.request().method()==='POST'){const payload=route.request().postDataJSON();if(payload.action==='subscribe')saved++;else if(payload.action==='profile')profile=payload;else assert.fail('Unexpected action');await route.fulfill({json:{ok:true}});}
    else await route.fulfill({json:{...data,pushConfigured:true,pushPublicKey:publicKey}});
  });
  await pushPage.goto(`${base}/?screen=settings`);await pushPage.getByRole('button',{name:'Zet berichtjes aan',exact:true}).click();
  await pushPage.getByText('Aan! We sturen alleen tussen 09:00 en 21:00 een berichtje.').waitFor();
  assert.deepEqual(await pushPage.evaluate(()=>window.rotation),{removed:1,subscribed:1});assert.equal(saved,1);await pushPage.getByRole('button',{name:'Bewaar mijn profiel'}).click();await pushPage.getByText('Je profiel is bijgewerkt.').waitFor();assert.equal(profile.avatar,2);assert.deepEqual(errors,[]);
  const demo=await browser.newContext();const demoPage=await demo.newPage();const demoRequests=[];await demoPage.route('**/api/**',route=>{demoRequests.push(route.request().url());return route.abort();});await demoPage.goto(`${base}/test?screen=settings`);await demoPage.getByLabel('Je naam',{exact:true}).waitFor();await demoPage.getByRole('button',{name:'Speel als Roebie'}).click();assert.equal(await demoPage.getByLabel('Je naam',{exact:true}).inputValue(),'Roebie');assert.equal(await demoPage.locator('.avatar-picker button[aria-pressed=true]').getAttribute('aria-label'),'Kies Roebie \u00b7 met pet');assert.equal(await demoPage.locator('a[href="/ai"]').count(),0);await demoPage.getByRole('button',{name:/Onze reisuitgangspunten/}).click();await demoPage.locator('.preference-list details').filter({hasText:'Warmte'}).locator('summary').click();const warmth=demoPage.locator('.preference-list details').filter({hasText:'Warmte'});await warmth.locator('input[name=hardMin]').fill('20');await warmth.getByRole('button',{name:'Bewaar dit uitgangspunt'}).click();await demoPage.getByRole('alert').filter({hasText:'Vul bij een grens zowel vanaf als tot in.'}).waitFor();assert.deepEqual(demoRequests,[]);
  const login=await browser.newContext();const loginPage=await login.newPage();let authenticated=false;await loginPage.route('**/api/app',async route=>{if(route.request().method()==='POST'){assert.equal(route.request().postDataJSON().action,'login');authenticated=true;await route.fulfill({json:{ok:true}});}else await route.fulfill({json:authenticated?data:{user:null}});});await loginPage.goto(`${base}/?screen=report`);await loginPage.getByRole('button',{name:/Inloggen/}).click();await loginPage.getByLabel('E-mailadres').fill('test@example.test');await loginPage.getByLabel('Wachtwoord',{exact:true}).fill('test-password-123');await loginPage.getByRole('button',{name:'Open mijn boekje'}).click();await loginPage.waitForFunction(()=>!document.querySelector('[role=dialog]'));assert.equal(new URL(loginPage.url()).searchParams.get('screen'),'report');await loginPage.goto(`${base}/?screen=unknown`);await loginPage.getByRole('button',{name:'Verder met onze set'}).waitFor();
  console.log('PASS: invalid/oversized requests, out-of-order polling cannot restore logged-out data, changed VAPID keys, profile/avatar ownership, login deep links and incomplete boundary validation; no real push sent.');
}finally{await browser.close();}
