export function batch(title = 'Een lange kustroute of een korte bergroute?', sourceQuestionId: string | null = null) {
  return { summary: 'Een nieuw reisdilemma.', questions: [{ sourceQuestionId, title, intro: 'Waar gaat jullie voorkeur naar uit?', theme: 'reistijd', type: 'trade-off', role: 'core', focus: ['days'], informationValue: 1, options: [
    { title: 'Langs de kust', subtitle: 'Rustig onderweg', details: ['Een lange route'], art: 'house', attributes: [{ key: 'days', value: 12 }, { key: 'transport', value: 'car' }] },
    { title: 'Naar de bergen', subtitle: 'Snel op de bestemming', details: ['Een korte route'], art: 'mountain', attributes: [{ key: 'days', value: 6 }, { key: 'transport', value: 'car' }] },
  ] }] };
}
