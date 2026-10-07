import { PGlite } from '@electric-sql/pglite';
import { Pool } from 'pg';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { schema } from './schema';
import { questions } from './questions';
import { AVATARS } from './characters';
type Row = Record<string, unknown>;
type DB = { query<T extends Row = Row>(sql: string, args?: unknown[]): Promise<{ rows: T[] }> };
const globalDb = globalThis as typeof globalThis & { travelDB?: Promise<DB> };
async function connect(): Promise<DB> {
  let db: DB;
  if (process.env.DATABASE_URL) db = new Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
  else {
    if (process.env.VERCEL) throw new Error('DATABASE_URL is required on hosted deployments.');
    const dir = path.join(process.cwd(), 'data', 'postgres'); await mkdir(dir, { recursive: true }); db = new PGlite(dir);
  }
  // pg supports multi-statement migrations; PGlite requires exec for this batch.
  const local = db instanceof PGlite ? db : null;
  if (local) await local.exec(schema); else await (db as DB).query(schema);
  const avatars=AVATARS.map(({id,name})=>({id,name}));
  await db.query('INSERT INTO avatars SELECT * FROM jsonb_to_recordset($1::jsonb) AS x(id integer,name text) ON CONFLICT(id) DO UPDATE SET name=excluded.name',[JSON.stringify(avatars)]);
  if ((await db.query("SELECT version FROM app_migrations WHERE version='seed-v1'")).rows.length) return db;
  await db.query('INSERT INTO questions SELECT * FROM jsonb_to_recordset($1::jsonb) AS x(id text,content jsonb) ON CONFLICT DO NOTHING',[JSON.stringify(questions.map(q=>({id:q.id,content:q})))]);
  const options=questions.flatMap(q=>q.options.map((content,choice)=>({question_id:q.id,choice,content})));
  await db.query('INSERT INTO question_options SELECT * FROM jsonb_to_recordset($1::jsonb) AS x(question_id text,choice integer,content jsonb) ON CONFLICT DO NOTHING',[JSON.stringify(options)]);
  const optionAttrs=options.flatMap(o=>Object.entries(o.content.attributes).map(([key,value])=>({question_id:o.question_id,choice:o.choice,attribute_key:key,value_id:`${key}:${JSON.stringify(value)}`,value})));
  const attrs=new Map(optionAttrs.map(a=>[a.attribute_key,{key:a.attribute_key,value_type:typeof a.value}]));
  for(const key of ['budget','totalBudget','days','month','temperature','travelHours','jetlag','destinations','moves','pace','nature','city','culture','food','beach','hiking','adventure','relaxation','nightlife','comfort','specialStay','privacy','facilities','planning','spontaneity','together','remote']) if(!attrs.has(key))attrs.set(key,{key,value_type:'number'});
  for(const key of ['season','climate','transport']) if(!attrs.has(key))attrs.set(key,{key,value_type:'string'});
  await db.query('INSERT INTO attributes SELECT * FROM jsonb_to_recordset($1::jsonb) AS x(key text,value_type text) ON CONFLICT DO NOTHING',[JSON.stringify([...attrs.values()])]);
  const values=[...new Map(optionAttrs.map(a=>[a.value_id,{id:a.value_id,attribute_key:a.attribute_key,value:a.value}])).values()];
  await db.query('INSERT INTO attribute_values SELECT * FROM jsonb_to_recordset($1::jsonb) AS x(id text,attribute_key text,value jsonb) ON CONFLICT DO NOTHING',[JSON.stringify(values)]);
  await db.query('INSERT INTO question_option_attributes SELECT * FROM jsonb_to_recordset($1::jsonb) AS x(question_id text,choice integer,attribute_key text,value_id text) ON CONFLICT DO NOTHING',[JSON.stringify(optionAttrs)]);
  await db.query("INSERT INTO app_migrations(version) VALUES('seed-v1') ON CONFLICT DO NOTHING");
  return db;
}
export async function query<T extends Row = Row>(sql: string, args: unknown[] = []) { globalDb.travelDB ??= connect(); return (await (await globalDb.travelDB).query<T>(sql, args)).rows; }
