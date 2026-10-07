import { cookies } from 'next/headers';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { query } from './db';
export type User = { id: string; name: string; email: string; avatar: number; pair_id: string };
export function passwordHash(password: string) { const salt = randomBytes(16).toString('hex'); return `${salt}:${scryptSync(password,salt,64).toString('hex')}`; }
export function verifyPassword(password: string, stored: string) { const [salt,hash] = stored.split(':'); if (!salt || !hash) return false; const digest = Buffer.from(hash,'hex'); return digest.length === 64 && timingSafeEqual(scryptSync(password,salt,64),digest); }
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
export async function currentUser(): Promise<User | null> { const token = (await cookies()).get('travel-session')?.value; if (!token) return null; const rows = await query<User & Record<string, unknown>>('SELECT u.id,u.name,u.email,u.avatar,m.pair_id FROM sessions s JOIN users u ON u.id=s.user_id JOIN memberships m ON m.user_id=u.id WHERE s.token_hash=$1 AND s.expires_at>now()', [hashToken(token)]); return rows[0] ?? null; }
export async function createSession(userId: string) { const token = randomBytes(32).toString('hex'); await query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '30 days')", [hashToken(token),userId]); (await cookies()).set('travel-session',token,{ httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:60*60*24*30 }); }
