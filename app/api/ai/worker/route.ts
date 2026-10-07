import { timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { claimTask, finishTask, pipelineReviews, pipelineTick, publishQuestions } from '@/lib/ai-tasks';
import { sendAiNotifications } from '@/lib/ai-notifications';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const json = (value: unknown, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'no-store' } });
export async function POST(request: Request) {
  const expected = `Bearer ${process.env.AI_PIPELINE_SECRET ?? ''}`;
  const supplied = request.headers.get('authorization') ?? '';
  if (!process.env.AI_PIPELINE_SECRET || Buffer.byteLength(supplied) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) return json({ error: 'Unauthorized' }, 401);
  try {
    const raw = await request.text();
    if (raw.length > 100000) return json({ error: 'Payload too large' }, 413);
    const body = JSON.parse(raw);
    if (body.action === 'tick') { await pipelineTick(); await sendAiNotifications(); return json({ ok: true }); }
    if (body.action === 'claim') return json({ task: await claimTask(z.enum(['questions', 'system']).parse(body.kind)) });
    if (body.action === 'reviews') return json({ tasks: await pipelineReviews() });
    const id = z.uuid().parse(body.id);
    const receipt = z.uuid().parse(body.receipt);
    if (body.action === 'publish') return json({ ok: await publishQuestions(id, receipt, body.batch) });
    if (body.action === 'finish') {
      const state = z.enum(['failed', 'review', 'published']).parse(body.status);
      const result = z.string().min(1).max(1500).parse(body.result);
      const url = z.url().optional().parse(body.prUrl);
      if (state === 'review' && !url) return json({ error: 'A review needs a pull request' }, 400);
      if (url && (!process.env.AI_GITHUB_REPOSITORY || !url.startsWith(`https://github.com/${process.env.AI_GITHUB_REPOSITORY}/pull/`) || !/^\d+$/.test(url.split('/').at(-1) ?? ''))) return json({ error: 'Invalid pull request' }, 400);
      return json({ ok: (await finishTask(id, receipt, state, result, url)).length > 0 });
    }
    return json({ error: 'Unknown action' }, 400);
  } catch { return json({ error: 'Opdracht kon niet worden verwerkt. Controleer de pipeline en de gegenereerde gegevens.' }, 400); }
}
