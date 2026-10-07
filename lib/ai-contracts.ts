import { z } from 'zod';
import type { Question } from './domain';
import { questions as initialQuestions } from './questions';
export { amsterdamDateTime, fromAmsterdamDateTime, nextAmsterdamWeek } from './ai-schedule';

export const questionId = z.string().regex(/^(?:q\d{3,}|ai_[a-f0-9]{32}_\d{1,2})$/);
export const taskInput = z.object({
  kind: z.enum(['questions', 'system']),
  instruction: z.string().trim().min(10).max(4000),
  scheduledAt: z.iso.datetime({ offset: true }),
  repeatWeekly: z.boolean().default(false),
  acknowledgePublic: z.boolean().default(false),
}).refine(input => input.kind !== 'system' || input.acknowledgePublic, { message: 'Bevestig dat de systeemopdracht openbaar mag worden.' });
export type TaskKind = z.infer<typeof taskInput>['kind'];
export type TaskStatus = 'queued' | 'running' | 'review' | 'published' | 'failed' | 'cancelled';
export type TaskView = { id: string; kind: TaskKind; instruction: string; status: TaskStatus; scheduled_at: string; created_at: string; result: string | null; pr_url: string | null; repeat_weekly: boolean };

export function isAiAdmin(email: string, configured = process.env.AI_ADMIN_EMAILS ?? '') {
  return configured.split(',').map(v => v.trim().toLowerCase()).filter(Boolean).includes(email.toLowerCase());
}
export function validSchedule(value: string, now = new Date()) {
  const at = new Date(value).getTime();
  return Number.isFinite(at) && at >= now.getTime() - 60_000 && at <= now.getTime() + 90 * 86400_000;
}
const attributeTypes: Record<string, string> = Object.fromEntries(initialQuestions.flatMap(q => q.options.flatMap(o => Object.entries(o.attributes).map(([key, value]) => [key, typeof value]))));
export const attributeKeys = Object.keys(attributeTypes) as [string, ...string[]];
const text = z.string().trim().min(1).max(300);
const option = z.object({ title: text, subtitle: text, details: z.array(text).min(1).max(5), art: z.enum(['mountain', 'house']), attributes: z.array(z.object({ key: z.enum(attributeKeys), value: z.union([z.number().finite().min(-100).max(100000), z.string().trim().min(1).max(60)]) })).min(1).max(15) });
export const generatedBatch = z.object({ summary: z.string().trim().min(1).max(1000), questions: z.array(z.object({ sourceQuestionId: questionId.nullable(), title: text, intro: text, theme: text, type: z.enum(['trade-off', 'extreme', 'scenario', 'one-change', 'wildcard', 'boundary', 'refinement', 'conditional', 'conflict', 'personal-dream', 'bundle']), role: z.enum(['core', 'boundary', 'personal', 'wildcard']), focus: z.array(z.enum(attributeKeys)).min(1).max(5), informationValue: z.number().min(0).max(3), options: z.array(option).length(2) })).min(1).max(14) });
export type GeneratedBatch = z.infer<typeof generatedBatch>;

export function validateBatch(raw: unknown, taskId: string, bank: Question[]) {
  const batch = generatedBatch.parse(raw);
  const titles = new Set(bank.map(q => q.title.toLocaleLowerCase('nl').replace(/[^\p{L}\p{N}]/gu, '')));
  const replacements = new Set<string>();
  const batchTitles = new Set<string>();
  return { summary: batch.summary, questions: batch.questions.map((q, index) => {
    if (q.sourceQuestionId && (!bank.some(b => b.id === q.sourceQuestionId) || replacements.has(q.sourceQuestionId))) throw new Error('Ongeldige of dubbele vraagvervanging.');
    if (q.sourceQuestionId) replacements.add(q.sourceQuestionId);
    const title = q.title.toLocaleLowerCase('nl').replace(/[^\p{L}\p{N}]/gu, '');
    if (batchTitles.has(title)) throw new Error('Dubbele vraag in het voorstel.');
    batchTitles.add(title);
    if (titles.has(title) && (!q.sourceQuestionId || bank.find(b => b.id === q.sourceQuestionId)?.title.toLocaleLowerCase('nl').replace(/[^\p{L}\p{N}]/gu, '') !== title)) throw new Error('Een voorgestelde vraag bestaat al.');
    titles.add(title);
    if (q.options[0].title.toLowerCase() === q.options[1].title.toLowerCase()) throw new Error('De keuzes moeten verschillen.');
    const options = q.options.map(o => {
      if (new Set(o.attributes.map(a => a.key)).size !== o.attributes.length) throw new Error('Dubbele eigenschap in een keuze.');
      for (const a of o.attributes) {
        if (attributeTypes[a.key] !== typeof a.value) throw new Error('Eigenschap heeft het verkeerde waardetype.');
        if (typeof a.value === 'number' && ((['month', 'departureMonth'].includes(a.key) && (!Number.isInteger(a.value) || a.value < 1 || a.value > 12)) || (a.key !== 'temperature' && a.value < 0))) throw new Error('Eigenschap heeft een ongeldige waarde.');
      }
      return { ...o, attributes: Object.fromEntries(o.attributes.map(a => [a.key, a.value])) };
    }) as Question['options'];
    const { sourceQuestionId, ...content } = q;
    return { sourceQuestionId, content: { ...content, id: `ai_${taskId.replaceAll('-', '')}_${index}`, options } satisfies Question };
  }) };
}
