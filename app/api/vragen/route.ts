import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {currentUser} from '@/lib/auth';
import {recordQuestion} from '@/lib/pair-actions';
import {refreshInsights} from '@/lib/service';
import {advanceUnifiedSet,ensureUnifiedSlot,getUnifiedState,recordUnifiedChoice,UnifiedFlowError} from '@/lib/unified-sets';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const json=(value:unknown,status=200)=>NextResponse.json(value,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(){
 const user=await currentUser();if(!user)return json({error:'Log in om jullie vragenset te openen.'},401);
 try{return json(await getUnifiedState(user));}
 catch(error){console.error('Unified set GET:',error instanceof Error?error.message:'unknown');return json({error:'Het vragenboekje openen lukt niet.'},500);}
}
export async function POST(req:NextRequest){
 const origin=req.headers.get('origin');
 if(!origin||!URL.canParse(origin)||new URL(origin).host!==req.headers.get('host'))return json({error:'Deze aanvraag komt niet uit de app.'},403);
 const user=await currentUser();if(!user)return json({error:'Log eerst in.'},401);
 try{
  const raw=await req.text();if(raw.length>4000)return json({error:'Aanvraag te groot.'},413);
  const body=z.discriminatedUnion('action',[
   z.object({action:z.literal('answer'),key:z.string().min(1).max(160),choice:z.number().int().min(0).max(1)}).strict(),
   z.object({action:z.literal('next-set'),ordinal:z.number().int().min(1).max(10000)}).strict(),
  ]).parse(JSON.parse(raw));
  if(body.action==='next-set')return json(await advanceUnifiedSet(user,body.ordinal));
  const slot=await ensureUnifiedSlot(user,body.key);
  if(slot.legacyId){
   await recordQuestion(user,slot.legacyId,{action:'answer',choice:body.choice,mode:'daily'});
   await refreshInsights(user.pair_id);
  }else if(slot.round!==null)await recordUnifiedChoice(user,slot.round,body.choice as 0|1);
  return json(await getUnifiedState(user));
 }catch(error){
  if(error instanceof UnifiedFlowError)return json({error:error.message},error.status);
  if(error instanceof z.ZodError||error instanceof SyntaxError)return json({error:'Controleer je keuze.'},400);
  console.error('Unified set POST:',error instanceof Error?error.message:'unknown');
  return json({error:'Opslaan lukte niet. Probeer opnieuw.'},500);
 }
}
