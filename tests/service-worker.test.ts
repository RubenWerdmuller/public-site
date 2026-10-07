import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

test('push deep links preserve AI and question routes and reject external URLs',async()=>{
  const listeners:Record<string,(event:unknown)=>void>={};
  const shown:{data:{url:string}}[]=[];const opened:string[]=[];const deleted:string[]=[];
  const clients=[{url:'https://example.test/test',focus:async()=>{throw Error('Preview must stay isolated');},navigate:async()=>{throw Error('Preview must stay isolated');}}];
  const self={location:{origin:'https://example.test'},addEventListener:(name:string,listener:(event:unknown)=>void)=>listeners[name]=listener,registration:{showNotification:async(_title:string,options:{data:{url:string}})=>{shown.push(options);}},clients:{claim:()=>{},matchAll:async()=>clients,openWindow:async(url:string)=>{opened.push(url);}},skipWaiting:()=>{}};
  vm.runInNewContext(await readFile(new URL('../public/sw.js',import.meta.url),'utf8'),{self,URL,caches:{keys:async()=>['reis-shell-old','other-app-cache'],delete:async(key:string)=>{deleted.push(key);}}});
  let pending:Promise<unknown>=Promise.resolve();
  const waitUntil=(value:Promise<unknown>)=>{pending=value;};
  for(const [url,expected] of [['/ai','/ai'],['/?screen=question&q=q001','/?screen=question&q=q001'],['//evil.example/ai','/'],['https://evil.example/ai','/'],['/test','/']]){
    listeners.push({data:{json:()=>({title:'Test',url})},waitUntil});await pending;
    assert.equal(shown.at(-1)?.data.url,expected);
  }
  listeners.notificationclick({notification:{data:{url:'/ai'},close:()=>{}},waitUntil});await pending;
  assert.deepEqual(opened,['https://example.test/ai']);
  listeners.push({data:{json:()=>null},waitUntil});await pending;assert.equal(shown.at(-1)?.data.url,'/');
  listeners.notificationclick({notification:{data:{url:'https://evil.example'},close:()=>{}},waitUntil});await pending;
  assert.deepEqual(opened,['https://example.test/ai','https://example.test/']);
  listeners.activate({waitUntil});await pending;
  assert.deepEqual(deleted,['reis-shell-old']);
});
