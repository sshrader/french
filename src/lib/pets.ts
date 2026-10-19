// The character roster as the browser needs it. Keep in sync with server/pets.mjs.
export type Species = 'hero' | 'meme';

export const PET_ROSTER = [
  { id: 'napoleon', species: 'hero', name: 'Napoleon', breed: 'The Little Corporal', voice: 'napoleon' },
  { id: 'joan', species: 'hero', name: 'Joan of Arc', breed: 'The Maid of Orléans', voice: 'joan' },
  { id: 'dartagnan', species: 'hero', name: "D'Artagnan", breed: 'The Fourth Musketeer', voice: 'dartagnan' },
  { id: 'vercingetorix', species: 'hero', name: 'Vercingetorix', breed: 'Chief of the Gauls', voice: 'vercingetorix' },
  { id: 'trollface', species: 'meme', name: 'Trollface', breed: 'Problem?', voice: 'trollface' },
  { id: 'pepe', species: 'meme', name: 'Pepe', breed: 'Good Vibes Frog', voice: 'pepe' },
  { id: 'gigachad', species: 'meme', name: 'Gigachad', breed: 'Le Chad', voice: 'gigachad' },
  { id: 'wojak', species: 'meme', name: 'Wojak', breed: 'The Feels Guy', voice: 'wojak' },
] as const;

const VOICE_LABEL: Record<string, string> = {
  napoleon: 'Imperial',
  joan: 'Devout',
  dartagnan: 'Swashbuckling',
  vercingetorix: 'Defiant',
  trollface: 'Trolling',
  pepe: 'Chill',
  gigachad: 'Confident',
  wojak: 'Melancholic',
};

export const voiceLabel = (voice: string): string => VOICE_LABEL[voice] ?? voice;

export function speciesOf(pet: { id: string; species?: string }): Species {
  if (pet.species === 'hero' || pet.species === 'meme') return pet.species;
  return PET_ROSTER.find((p) => p.id === pet.id)?.species ?? 'hero';
}
