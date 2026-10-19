// A portrait for each character: the pixel-art picture in /heroes (public folder).
import { PET_ROSTER } from '../lib/pets';
import type { PetLook } from '../lib/petWorld';

export default function PetAvatar({ id, name, size = 40 }: { id: string; name?: string; size?: number }) {
  const known = PET_ROSTER.some((p) => p.id === id);
  return (
    <img
      className="catavatar"
      src={`/heroes/${known ? id : 'napoleon'}.png`}
      width={size}
      height={size}
      alt={name ? `${name}, an AI character` : 'An AI character'}
      style={{ borderRadius: '50%', flex: 'none', objectFit: 'cover', objectPosition: 'center 22%', background: '#000', imageRendering: size > 90 ? 'pixelated' : 'auto' }}
    />
  );
}

/** What the animated park needs to draw this character. */
export function petLook(id: string): PetLook {
  return { species: 'hero', coat: '#000', coat2: '#000', ear: '#000', eye: '#000', kind: 'plain', sprite: id };
}
