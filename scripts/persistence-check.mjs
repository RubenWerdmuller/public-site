import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const saved=JSON.parse(await readFile('test-results/persistence.json','utf8'));const base='http://localhost:3100';
const login=await fetch(base+'/api/app',{method:'POST',headers:{'Content-Type':'application/json',Origin:base},body:JSON.stringify({action:'login',email:saved.email,password:'local-test-only-123'})});assert.equal(login.status,200,await login.text());
const res=await fetch(base+'/api/app',{headers:{Cookie:login.headers.get('set-cookie').split(';')[0]}});const data=await res.json();assert.equal(data.history.find(q=>q.id===saved.questionId).own,0);assert.equal(data.members.length,2);assert.equal(data.saved.length,1);console.log('PASS: duo, immutable answer and shared saved question survive a real server process restart.');
