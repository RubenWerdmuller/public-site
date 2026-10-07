import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { runJobs } from '@/lib/jobs';
export const runtime='nodejs';
export async function GET(request:NextRequest) { const secret=process.env.CRON_SECRET; const supplied=request.headers.get('authorization')??''; const expected=`Bearer ${secret}`; if(!secret||supplied.length!==expected.length||!timingSafeEqual(Buffer.from(supplied),Buffer.from(expected))) return NextResponse.json({error:'Unauthorized'},{status:401}); return NextResponse.json(await runJobs()); }
