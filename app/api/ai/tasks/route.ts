import { currentUser } from '@/lib/auth';
import { changeTask, enqueueTask, isAiAdmin, listTasks } from '@/lib/ai-tasks';
import { taskInput, validSchedule } from '@/lib/ai-contracts';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const json = (value: unknown, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'no-store' } });
export async function GET() {
  const user = await currentUser();
  if (!user) return json({ error: 'Log eerst in via de startpagina.' }, 401);
  if (!isAiAdmin(user.email)) return json({ error: 'AI-opdrachten zijn alleen beschikbaar voor de ingestelde beheerders.' }, 403);
  return json({ tasks: await listTasks(user) });
}
export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin || !URL.canParse(origin) || new URL(origin).host !== request.headers.get('host')) return json({ error: 'Deze aanvraag komt niet uit de app.' }, 403);
  const user = await currentUser();
  if (!user) return json({ error: 'Log eerst in.' }, 401);
  if (!isAiAdmin(user.email)) return json({ error: 'Geen toegang tot AI-opdrachten.' }, 403);
  try {
    const raw = await request.text();
    if (raw.length > 8000) return json({ error: 'De opdracht is te lang.' }, 413);
    const body = JSON.parse(raw);
    if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ error: 'Controleer je opdracht.' }, 400);
    if (body.action === 'cancel' || body.action === 'retry') {
      const id = z.uuid().parse(body.id);
      const changed = await changeTask(user, id, body.action);
      if (!changed.length) return json({ error: 'Deze opdracht kan nu niet worden gewijzigd.' }, 409);
    } else {
      const input = taskInput.parse(body);
      if (!validSchedule(input.scheduledAt)) return json({ error: 'Kies een tijdstip binnen de komende 90 dagen.' }, 400);
      const queued = (await listTasks(user)).filter(t => t.status === 'queued' || t.status === 'running');
      if (queued.length >= 10) return json({ error: 'Er staan al tien opdrachten klaar. Wacht tot er één is afgerond.' }, 429);
      await enqueueTask(user, input);
    }
    return json({ tasks: await listTasks(user) });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) return json({ error: 'Controleer je opdracht en het uitvoermoment.' }, 400);
    return json({ error: 'Opslaan lukte niet. Probeer later opnieuw.' }, 500);
  }
}
