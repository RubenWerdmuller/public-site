// Canonical portrait registry: UI, avatar picker, demo personas and database seed share these IDs.
export type Portrait = { id: number; name: string; hair: 'short' | 'long' | 'bald'; hairColor: string; cap: boolean; glasses: boolean; beard: boolean; background: string; shirt: string };
export const AVATARS: readonly Portrait[] = [
  { id: 0, name: 'Oelie · blond', hair: 'long', hairColor: '#d6b961', cap: false, glasses: false, beard: false, background: '#e6dac4', shirt: '#8c9d83' },
  { id: 1, name: 'Roebie · kaal', hair: 'bald', hairColor: '#675442', cap: false, glasses: false, beard: false, background: '#d7e0d2', shirt: '#ba7e62' },
  { id: 2, name: 'Roebie · met pet', hair: 'bald', hairColor: '#675442', cap: true, glasses: false, beard: false, background: '#d7e0d2', shirt: '#ba7e62' },
  ...Array.from({ length: 9 }, (_, i): Portrait => ({ id: i + 3, name: `Reisgenoot ${i + 1}`, hair: i % 3 === 0 ? 'long' : 'short', hairColor: ['#d6b961', '#45443c', '#ad7654'][i % 3], cap: i === 7, glasses: i % 3 === 1, beard: i > 5, background: ['#edd5c7', '#d9dce7', '#e6dac4'][i % 3], shirt: ['#8c9d83', '#ba7e62', '#d5b65f'][i % 3] })),
];
export const CHARACTERS = {
  oelie: { id: 'oelie', name: 'Oelie', avatar: 0 },
  roebie: { id: 'roebie', name: 'Roebie', avatar: 2, withoutCapAvatar: 1 },
} as const;
export type CharacterId = keyof typeof CHARACTERS;
export function portrait(id: number): Portrait { return AVATARS.find(a => a.id === id) ?? AVATARS[0]; }
