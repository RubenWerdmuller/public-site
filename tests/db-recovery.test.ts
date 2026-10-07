import test from 'node:test';
import assert from 'node:assert/strict';
import {Pool} from 'pg';
import {query} from '../lib/db';

test('failed database initialization closes the pool and a later request retries successfully',async context=>{
 const local=globalThis as typeof globalThis & {travelDB?:Promise<unknown>};
 const previous=process.env.DATABASE_URL;
 process.env.DATABASE_URL='postgresql://test:dummy@127.0.0.1:1/test';
 delete local.travelDB;
 let schemaAttempts=0;
 const end=context.mock.method(Pool.prototype,'end',async()=>{});
 context.mock.method(Pool.prototype,'query',async(sql:string)=>{
  if(sql.includes('CREATE TABLE')){schemaAttempts++;if(schemaAttempts===1)throw Error('temporary connection failure');}
  return {rows:sql.includes("SELECT version FROM app_migrations")?[{version:'seed-v2-roadtrip'}]:[{ok:1}]};
 });
 try{
  const attempts=await Promise.allSettled([query('SELECT 1'),query('SELECT 1')]);
  assert.ok(attempts.every(r=>r.status==='rejected'));
  assert.equal(schemaAttempts,1);assert.equal(end.mock.callCount(),1);assert.equal(local.travelDB,undefined);
  assert.deepEqual(await query('SELECT 1'),[{ok:1}]);
  assert.equal(schemaAttempts,2);
  await query('SELECT 1');assert.equal(schemaAttempts,2);
 }finally{
  delete local.travelDB;
  if(previous===undefined)delete process.env.DATABASE_URL;else process.env.DATABASE_URL=previous;
 }
});
