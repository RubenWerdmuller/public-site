import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { runJobs } from '@/lib/jobs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=60;
export async function GET(request:NextRequest) { const secret=process.env.CRON_SECRET; const supplied=Buffer.from(request.headers.get('authorization')??''); const expected=Buffer.from(`Bearer ${secret}`); if(!secret||supplied.length!==expected.length||!timingSafeEqual(supplied,expected)) return NextResponse.json({error:'Unauthorized'},{status:401}); return NextResponse.json(await runJobs()); }
