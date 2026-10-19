// A shared top-down pixel street in Paris. Every coin's character lives here, holds the barricades and bonks the cartoon mob.
// Pure canvas code with no React and no imports, so it can be tested on its own.

export type PetLook = {
  species: 'cat' | 'dog' | 'hero' | 'meme';
  sprite?: string; // a picture from /heroes/<id>-sprite.png instead of the drawn pet
  coat: string;
  coat2: string;
  ear: string;
  eye: string;
  kind: string; // cat: points|stripes|bib|patches|plain  dog: cheeks|mask|blaze|muzzle|plain
  earStyle?: 'point' | 'floppy' | 'fold' | 'tall';
  tongue?: boolean;
  short?: boolean;
};

export type WorldPet = { mint: string; petId: string; look: PetLook; name: string; symbol: string };

export const TILE = 16;
export const COLS = 30;
export const ROWS = 17;
export const W = COLS * TILE; // 480
export const H = ROWS * TILE; // 272

type Dir = 'up' | 'right' | 'down' | 'left';
const DIRS: Dir[] = ['up', 'right', 'down', 'left'];
const DV: Record<Dir, [number, number]> = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };

/* ------------------------------ helpers ------------------------------ */

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(a: string, b: string, t: number): string {
  const x = rgb(a);
  const y = rgb(b);
  return `#${x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
}

const mk = (w: number, h: number) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};

/* ------------------------------ top-down sprites ------------------------------ */

const OUT = '#14161a';

// Draw the pet facing UP, seen from above. Other directions are this picture turned by 90 degrees.
function paintUp(look: PetLook, frame: 0 | 1 | 2): HTMLCanvasElement {
  const c = mk(16, 16);
  const g = c.getContext('2d')!;
  const px = (x: number, y: number, col: string) => {
    g.fillStyle = col;
    g.fillRect(x, y, 1, 1);
  };
  const rect = (x: number, y: number, w: number, h: number, col: string) => {
    g.fillStyle = col;
    g.fillRect(x, y, w, h);
  };
  const round = (x: number, y: number, w: number, h: number, col: string) => {
    g.fillStyle = col;
    for (let i = 0; i < h; i++) {
      const inset = i === 0 || i === h - 1 ? 1 : 0;
      g.fillRect(x + inset, y + i, w - inset * 2, 1);
    }
  };
  const dog = look.species === 'dog';
  const legCol = look.kind === 'points' && !dog ? look.coat2 : look.coat;
  const pawCol = look.kind === 'bib' && !dog ? look.coat2 : legCol;
  const snout = dog ? (look.kind === 'plain' ? mix(look.coat, '#ffffff', 0.35) : look.coat2) : '#E58F9A';
  const a = frame === 0 ? -1 : 0;
  const b = frame === 1 ? -1 : 0;
  const sway = frame === 1 ? 1 : 0;
  const tailCol = look.kind === 'points' && !dog ? look.coat2 : look.coat;

  // legs, tail
  rect(4, 7 + a, 2, 2, pawCol);
  rect(10, 7 + b, 2, 2, pawCol);
  rect(4, 11 + b, 2, 2, legCol);
  rect(10, 11 + a, 2, 2, legCol);
  if (dog) rect(7 + sway, 13, 2, 2, tailCol);
  else {
    px(8, 13, tailCol);
    px(8 + sway, 14, tailCol);
    px(9 + sway, 15, tailCol);
  }

  // body
  round(5, 6, 6, 7, look.coat);
  if (look.kind === 'stripes') for (const y of [7, 9, 11]) rect(5, y, 6, 1, look.coat2);
  if (look.kind === 'patches') {
    rect(5, 7, 3, 3, look.coat2);
    rect(8, 10, 3, 2, '#2B2A33');
  }
  if (look.kind === 'bib' || look.kind === 'cheeks' || look.kind === 'mask' || look.kind === 'blaze') rect(6, 6, 4, 2, look.coat2);
  if (look.kind === 'plain' && dog) rect(6, 11, 4, 1, snout);

  // head
  round(5, 2, 6, 5, look.coat);
  if (look.kind === 'points' && !dog) round(6, 3, 4, 3, look.coat2);
  if (dog && (look.kind === 'cheeks' || look.kind === 'mask')) round(5, 4, 6, 3, look.coat2);
  if (dog && look.kind === 'blaze') rect(7, 1, 2, 5, look.coat2);

  // ears
  if (!dog || look.earStyle === 'point') {
    rect(5, 1, 2, 2, look.ear);
    rect(9, 1, 2, 2, look.ear);
    if (!dog) {
      px(6, 2, '#E58F9A');
      px(9, 2, '#E58F9A');
    }
  } else if (look.earStyle === 'tall') {
    rect(4, 0, 2, 3, look.ear);
    rect(10, 0, 2, 3, look.ear);
  } else if (look.earStyle === 'floppy') {
    rect(3, 3, 2, 4, look.ear);
    rect(11, 3, 2, 4, look.ear);
  } else {
    rect(4, 2, 2, 3, look.ear);
    rect(10, 2, 2, 3, look.ear);
  }

  // face
  if (dog) {
    rect(6, 0, 4, 3, snout);
    rect(7, 0, 2, 1, '#16181A');
  } else rect(7, 3, 2, 1, '#E58F9A');
  px(6, 4, look.eye);
  px(9, 4, look.eye);

  // dark outline so the pet stands out on any ground
  const out = mk(18, 18);
  const og = out.getContext('2d')!;
  const src = g.getImageData(0, 0, 16, 16).data;
  const solid = (x: number, y: number) => x >= 0 && y >= 0 && x < 16 && y < 16 && src[(y * 16 + x) * 4 + 3] > 0;
  og.fillStyle = OUT;
  for (let y = -1; y <= 16; y++) {
    for (let x = -1; x <= 16; x++) {
      if (!solid(x, y) && (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1))) og.fillRect(x + 1, y + 1, 1, 1);
    }
  }
  og.drawImage(c, 1, 1);
  return out;
}

function turned(src: HTMLCanvasElement, dir: Dir): HTMLCanvasElement {
  if (dir === 'up') return src;
  const c = mk(18, 18);
  const g = c.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  g.translate(9, 9);
  g.rotate(dir === 'right' ? Math.PI / 2 : dir === 'down' ? Math.PI : -Math.PI / 2);
  g.drawImage(src, -9, -9);
  return c;
}

type SpriteSet = Record<Dir, [HTMLCanvasElement, HTMLCanvasElement, HTMLCanvasElement]>;
const spriteCache = new Map<string, SpriteSet>();
const heroImg = new Map<string, HTMLImageElement>();
function heroImage(id: string): HTMLImageElement | null {
  if (typeof Image === 'undefined') return null;
  let img = heroImg.get(id);
  if (!img) {
    img = new Image();
    img.src = `/heroes/${id}-sprite.png`;
    heroImg.set(id, img);
  }
  return img.complete && img.naturalWidth > 0 ? img : null;
}
// A character picture as three walking frames (the same picture, bobbing a little). Facing left mirrors it.
function heroFrames(img: HTMLImageElement, flip: boolean): [HTMLCanvasElement, HTMLCanvasElement, HTMLCanvasElement] {
  const make = (dy: number) => {
    const c = mk(20, 20);
    const g = c.getContext('2d')!;
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = 'high';
    if (flip) {
      g.translate(20, 0);
      g.scale(-1, 1);
    }
    g.drawImage(img, 0, 0 + dy, 20, 20);
    return c;
  };
  return [make(0), make(-1), make(0)];
}
function spritesFor(petId: string, look: PetLook): SpriteSet {
  let s = spriteCache.get(petId);
  if (!s && look.sprite) {
    const img = heroImage(look.sprite);
    if (!img) {
      // not loaded yet: show a plain dot for now and build the real frames on a later frame
      const dot = mk(18, 18);
      const g = dot.getContext('2d')!;
      g.fillStyle = '#c9d4f2';
      g.beginPath();
      g.arc(9, 9, 6, 0, Math.PI * 2);
      g.fill();
      return { up: [dot, dot, dot], right: [dot, dot, dot], down: [dot, dot, dot], left: [dot, dot, dot] };
    }
    const r = heroFrames(img, false);
    const l = heroFrames(img, true);
    s = { up: r, right: r, down: r, left: l };
    spriteCache.set(petId, s);
  }
  if (!s) {
    const base = [paintUp(look, 0), paintUp(look, 1), paintUp(look, 2)] as const;
    s = {} as SpriteSet;
    for (const d of DIRS) s[d] = [turned(base[0], d), turned(base[1], d), turned(base[2], d)];
    spriteCache.set(petId, s);
  }
  return s;
}

/* ------------------------------ the terrain: a Paris street behind the barricades ------------------------------ */

type Terrain = { img: HTMLCanvasElement; blocked: Uint8Array; lamps: [number, number][]; fires: [number, number][] };

const ROAD_TOP = 5; // tile rows of the cobbled road
const ROAD_BOT = 11;

// One 80x64 townhouse front: zinc mansard roof, shuttered windows, balconies and a shop awning in the tricolour.
function facade(rand: () => number, wall: string, roof: string): HTMLCanvasElement {
  const c = mk(80, 64);
  const g = c.getContext('2d')!;
  const r = (x: number, y: number, w: number, h: number, col: string) => {
    g.fillStyle = col;
    g.fillRect(x, y, w, h);
  };
  r(0, 0, 80, 16, roof);
  for (let x = 0; x < 80; x += 4) r(x, 0, 1, 16, mix(roof, '#000000', 0.15));
  r(0, 14, 80, 2, mix(roof, '#000000', 0.35));
  for (const dx of [10, 34, 58]) {
    r(dx - 1, 3, 14, 2, mix(roof, '#ffffff', 0.25));
    r(dx, 5, 12, 11, wall);
    r(dx + 2, 7, 8, 8, rand() < 0.5 ? '#F2C95B' : '#3B4A5E');
  }
  r(0, 16, 80, 34, wall);
  for (let y = 22; y < 50; y += 6) r(0, y, 80, 1, mix(wall, '#000000', 0.07));
  for (const fy of [20, 35]) {
    for (const wx of [8, 35, 62]) {
      r(wx - 1, fy - 1, 12, 14, mix(wall, '#ffffff', 0.5));
      r(wx, fy, 10, 12, rand() < 0.35 ? '#F2C95B' : '#3B4A5E');
      r(wx + 4, fy, 1, 12, mix(wall, '#ffffff', 0.5));
      r(wx - 4, fy, 3, 12, '#5B7C99');
      r(wx + 11, fy, 3, 12, '#5B7C99');
      r(wx - 3, fy + 12, 16, 2, '#2A2A30');
    }
  }
  r(0, 50, 80, 14, mix(wall, '#000000', 0.22));
  const tri = ['#2D4A9A', '#F4F1E8', '#C8302F'];
  for (const ax of [4, 30, 56]) {
    for (let i = 0; i < 20; i += 4) r(ax + i, 50, 4, 7, tri[(i / 4) % 3]);
    r(ax, 57, 20, 1, 'rgba(0,0,0,0.3)');
    r(ax, 58, 20, 6, '#2C3342');
    if (rand() < 0.6) r(ax + 2, 59, 16, 3, '#F2C95B');
  }
  r(0, 63, 80, 1, 'rgba(0,0,0,0.35)');
  return c;
}

function buildTerrain(): Terrain {
  const img = mk(W, H);
  const g = img.getContext('2d')!;
  const rand = rng(hash('bonkeparte-streets'));
  const blocked = new Uint8Array(COLS * ROWS);
  const block = (tx: number, ty: number, w = 1, h = 1) => {
    for (let y = ty; y < ty + h; y++) for (let x = tx; x < tx + w; x++) if (x >= 0 && y >= 0 && x < COLS && y < ROWS) blocked[y * COLS + x] = 1;
  };
  const rect = (x: number, y: number, w: number, h: number, col: string) => {
    g.fillStyle = col;
    g.fillRect(x, y, w, h);
  };
  const pickOf = <T,>(a: T[]) => a[Math.floor(rand() * a.length)];

  // cobblestones on the road, flagstones on the pavements
  rect(0, 0, W, H, '#4A4C52');
  const roadShades = ['#6B6E75', '#72757C', '#686B72', '#777A81'];
  const sideShades = ['#B9B2A3', '#C2BBAC', '#B1AA9B'];
  for (let y = 0; y < H; y += 8) {
    const ty = Math.floor(y / TILE);
    const road = ty >= ROAD_TOP && ty <= ROAD_BOT;
    const side = ty === ROAD_TOP - 1 || ty === ROAD_BOT + 1;
    if (!road && !side) continue;
    const off = ((y / 8) % 2) * 4 - 4;
    for (let x = off; x < W; x += 8) rect(x + 1, y + 1, 7, 7, pickOf(road ? roadShades : sideShades));
  }
  g.fillStyle = 'rgba(20,18,20,0.18)';
  for (let i = 0; i < 14; i++) {
    g.beginPath();
    g.ellipse(rand() * W, (ROAD_TOP + 0.5 + rand() * (ROAD_BOT - ROAD_TOP)) * TILE, 6 + rand() * 8, 3 + rand() * 3, 0, 0, Math.PI * 2);
    g.fill();
  }
  for (let i = 0; i < 60; i++) {
    rect(Math.floor(rand() * W), (ROAD_TOP + Math.floor(rand() * (ROAD_BOT - ROAD_TOP + 1))) * TILE + Math.floor(rand() * 14), 2, 2, pickOf(['#8A8D93', '#5C5F65', '#A0603F', '#B8B2A3']));
  }

  // townhouses along both sides
  const walls = ['#E8DFC8', '#DDD3B8', '#E6E0D2', '#D9D6C9', '#EADFCB', '#DCD2BD'];
  const roofs = ['#4F5B6B', '#56606E', '#4A5666'];
  for (let i = 0; i < 6; i++) {
    const x = i * 80;
    const f = facade(rand, walls[i % walls.length], roofs[i % roofs.length]);
    g.drawImage(f, x, 0);
    g.save();
    g.translate(x, H);
    g.scale(1, -1);
    g.drawImage(f, 0, 0);
    g.restore();
    rect(x, 4 * TILE, 80, 3, 'rgba(0,0,0,0.18)');
    rect(x, 13 * TILE - 3, 80, 3, 'rgba(0,0,0,0.18)');
    block(i * 5, 0, 5, 4);
    block(i * 5, 13, 5, 4);
  }

  // gas lamps on the pavements
  const lamps: [number, number][] = [[4, 4], [14, 4], [24, 4], [4, 12], [14, 12], [24, 12]];
  for (const [tx, ty] of lamps) {
    rect(tx * TILE + 7, ty * TILE + 5, 2, 9, '#23252B');
    rect(tx * TILE + 5, ty * TILE + 2, 6, 4, '#23252B');
    rect(tx * TILE + 6, ty * TILE + 3, 4, 2, '#FFE9A0');
    block(tx, ty);
  }

  // barrels, some of them burning
  const fires: [number, number][] = [];
  const barrel = (tx: number, ty: number, fire: boolean) => {
    const x = tx * TILE;
    const y = ty * TILE;
    rect(x + 2, y + 13, 12, 2, 'rgba(0,0,0,0.25)');
    rect(x + 2, y + 3, 12, 11, OUT);
    rect(x + 3, y + 3, 10, 11, '#7A4E2E');
    rect(x + 3, y + 5, 10, 1, '#3A3A40');
    rect(x + 3, y + 10, 10, 1, '#3A3A40');
    rect(x + 4, y + 3, 8, 2, fire ? '#2A1A10' : '#9A6A3E');
    if (fire) fires.push([x + 8, y + 4]);
    block(tx, ty);
  };
  for (const [tx, ty] of [[7, 8], [10, 8], [18, 8], [21, 8]]) barrel(tx, ty, true);
  for (const [tx, ty] of [[3, 6], [3, 10], [26, 6], [27, 10], [12, 10], [16, 6]]) barrel(tx, ty, false);

  // barricades: carts, planks and paving stones with a tricolour on top. A gap is left in the middle of each.
  const barricade = (tx: number, ty: number, th: number, flag: boolean) => {
    const x = tx * TILE;
    const y = ty * TILE;
    const w = 2 * TILE;
    const h = th * TILE;
    rect(x - 1, y + h - 6, w + 2, 8, 'rgba(0,0,0,0.25)');
    const woods = ['#7A4E2E', '#8B5A34', '#6B4328', '#9A6A3E'];
    for (let py = y + 2; py < y + h - 5; py += 5) {
      const ox = Math.floor(rand() * 6) - 2;
      rect(x + 1 + Math.max(0, ox), py, w - 2 - Math.abs(ox), 4, pickOf(woods));
      rect(x + 1 + Math.max(0, ox), py + 3, w - 2 - Math.abs(ox), 1, 'rgba(0,0,0,0.3)');
    }
    rect(x + 4, y, 2, h - 2, '#4A3322');
    rect(x + w - 6, y, 2, h - 2, '#4A3322');
    for (let i = 0; i < 8; i++) rect(x + 1 + Math.floor(rand() * (w - 6)), y + h - 7 + Math.floor(rand() * 3), 4, 3, pickOf(['#8A8D93', '#6B6E75', '#A0A3A8']));
    if (flag) {
      const px = x + w / 2;
      rect(px, y - 10, 1, 18, '#2A2A30');
      rect(px + 1, y - 10, 4, 6, '#2D4A9A');
      rect(px + 5, y - 10, 4, 6, '#F4F1E8');
      rect(px + 9, y - 10, 4, 6, '#C8302F');
    }
    block(tx, ty, 2, th);
  };
  barricade(8, 6, 2, true);
  barricade(8, 9, 2, false);
  barricade(19, 6, 2, false);
  barricade(19, 9, 2, true);

  return { img, blocked, lamps, fires };
}

/* ------------------------------ the mob (cartoon crowd, never hurt, just bonked) ------------------------------ */

type Mob = {
  x: number;
  y: number;
  tx: number;
  ty: number;
  variant: number;
  kind: 0 | 1; // 0 torch, 1 pitchfork
  state: 'walk' | 'down' | 'flee' | 'gone';
  timer: number;
  vx: number;
  vy: number;
  phase: number;
  face: 1 | -1;
  stuck: number;
};

const CLOTH = ['#8A3B3B', '#3B5A8A', '#6E6A3A', '#5B3B6B'];
const mobCache = new Map<string, HTMLCanvasElement>();
function mobSprite(variant: number, kind: number, frame: number, face: 1 | -1): HTMLCanvasElement {
  const key = `${variant}:${kind}:${frame}:${face}`;
  const hit = mobCache.get(key);
  if (hit) return hit;
  const c = mk(16, 16);
  const g = c.getContext('2d')!;
  const r = (x: number, y: number, w: number, h: number, col: string) => {
    g.fillStyle = col;
    g.fillRect(x, y, w, h);
  };
  const cloth = CLOTH[variant % CLOTH.length];
  r(4, 1, 8, 14, OUT);
  r(5, 1, 6, 2, '#C8302F'); // red cap
  r(5, 3, 6, 4, '#E3B58D'); // face
  r(6, 3, 2, 1, '#5A2A20');
  r(8, 3, 2, 1, '#5A2A20'); // angry brows
  r(6, 4, 1, 1, OUT);
  r(9, 4, 1, 1, OUT);
  r(7, 6, 2, 1, '#7A2A2A');
  r(5, 7, 6, 5, cloth);
  r(5, 10, 6, 1, '#2A2A30');
  r(frame === 0 ? 5 : 6, 12, 2, 3, '#33302E');
  r(frame === 0 ? 9 : 8, 12, 2, 3, '#33302E');
  r(3, 7, 2, 4, cloth);
  r(11, 7, 2, 4, cloth);
  const wx = face === 1 ? 13 : 2;
  if (kind === 0) {
    r(wx, 2, 1, 9, '#6B4A2B');
    r(wx - 1, 0, 3, 3, '#FFB347');
    r(wx, 0, 1, 2, '#FFE08A');
  } else {
    r(wx, 2, 1, 10, '#9AA0A8');
    r(wx - 1, 0, 1, 3, '#9AA0A8');
    r(wx + 1, 0, 1, 3, '#9AA0A8');
  }
  mobCache.set(key, c);
  return c;
}

/* ------------------------------ the world ------------------------------ */

type PetState = {
  pet: WorldPet;
  tx: number;
  ty: number;
  x: number;
  y: number;
  fromX: number;
  fromY: number;
  toTx: number;
  toTy: number;
  mt: number;
  dir: Dir;
  state: 'move' | 'idle' | 'sleep';
  timer: number;
  phase: number;
  hopY: number;
  hopV: number;
  cool: number; // seconds until it can bonk again
};

export type World = {
  night: boolean;
  setPets(pets: WorldPet[], focusMint?: string): void;
  update(dt: number): void;
  draw(g: CanvasRenderingContext2D): void;
  positions(): { mint: string; x: number; y: number }[];
  hitTest(x: number, y: number): string | null;
  hold(mint: string | null): void;
  hop(mint: string): void;
  stats(): { routed: number };
};

export function createWorld(opts: { hour?: number } = {}): World {
  const hour = opts.hour ?? new Date().getHours();
  const night = hour >= 20 || hour < 6;
  const dusk = (hour >= 17 && hour < 20) || (hour >= 6 && hour < 8);
  const terrain = buildTerrain();
  const rand = rng(Date.now() & 0xffff);

  const pets = new Map<string, PetState>();
  const occ = new Map<number, string>();
  let focus: string | undefined;
  let held: string | null = null;
  let clock = 0;
  let routed = 0;
  const MOVE_T = 0.7;
  const MOB_COUNT = 7;
  const mobs: Mob[] = [];
  const effects: { mint: string; x: number; y: number; t: number; text: string; dir: 1 | -1 }[] = [];
  const BONKS = ['POW!', 'BAF!', 'CLONK!', 'BONK!', 'OUCH!', 'PAF!'];
  const footOk = (px: number, py: number) => {
    const tx = Math.floor((px + 8) / TILE);
    const ty = Math.floor((py + 13) / TILE);
    return tx >= 0 && ty >= 0 && tx < COLS && ty < ROWS && !terrain.blocked[ty * COLS + tx];
  };
  function pickTarget(m: Mob) {
    m.tx = 11 * TILE + rand() * (W - 24 - 11 * TILE);
    m.ty = ROAD_TOP * TILE + rand() * (ROAD_BOT - ROAD_TOP) * TILE;
    m.timer = 2 + rand() * 3;
  }
  function spawnMob(m: Mob) {
    for (let i = 0; i < 12; i++) {
      m.x = W - 28 - rand() * 40;
      m.y = (ROAD_TOP + rand() * (ROAD_BOT - ROAD_TOP)) * TILE;
      if (footOk(m.x, m.y)) break;
    }
    m.state = 'walk';
    m.stuck = 0;
    m.vx = 0;
    m.vy = 0;
    pickTarget(m);
  }
  function stepMob(m: Mob, ax: number, ay: number) {
    let moved = false;
    if (footOk(m.x + ax, m.y)) {
      m.x = Math.min(W - 6, Math.max(0, m.x + ax));
      moved = true;
    }
    if (footOk(m.x, m.y + ay)) {
      m.y += ay;
      moved = true;
    }
    return moved;
  }
  for (let i = 0; i < MOB_COUNT; i++) {
    const m: Mob = { x: 0, y: 0, tx: 0, ty: 0, variant: i, kind: (i % 2) as 0 | 1, state: 'walk', timer: 0, vx: 0, vy: 0, phase: rand() * 4, face: -1, stuck: 0 };
    spawnMob(m);
    m.x = 14 * TILE + rand() * (W - 14 * TILE - 40);
    if (!footOk(m.x, m.y)) spawnMob(m);
    mobs.push(m);
  }
  const key = (tx: number, ty: number) => ty * COLS + tx;
  const free = (tx: number, ty: number) => tx >= 0 && ty >= 0 && tx < COLS && ty < ROWS && !terrain.blocked[key(tx, ty)] && !occ.has(key(tx, ty));

  function spawnTile(mint: string): [number, number] {
    const start = hash(mint) % (COLS * ROWS);
    for (let i = 0; i < COLS * ROWS; i++) {
      const k = (start + i) % (COLS * ROWS);
      const tx = k % COLS;
      const ty = Math.floor(k / COLS);
      if (free(tx, ty)) return [tx, ty];
    }
    return [0, 0];
  }

  function setPets(list: WorldPet[], focusMint?: string) {
    focus = focusMint;
    const keep = new Set(list.map((p) => p.mint));
    for (const [mint, s] of pets) {
      if (!keep.has(mint)) {
        occ.delete(key(s.tx, s.ty));
        if (s.state === 'move') occ.delete(key(s.toTx, s.toTy));
        pets.delete(mint);
      }
    }
    for (const p of list) {
      const s = pets.get(p.mint);
      if (s) {
        s.pet = p;
        continue;
      }
      const [tx, ty] = spawnTile(p.mint);
      occ.set(key(tx, ty), p.mint);
      pets.set(p.mint, {
        pet: p, tx, ty, x: tx * TILE, y: ty * TILE, fromX: tx * TILE, fromY: ty * TILE, toTx: tx, toTy: ty, mt: 0,
        dir: DIRS[hash(p.mint + 'd') % 4], state: 'idle', timer: rand() * 2, phase: rand() * 2, hopY: 0, hopV: 0, cool: rand() * 1.5,
      });
    }
  }

  function chooseNext(s: PetState) {
    if (rand() < 0.035) {
      s.state = 'sleep';
      s.timer = 4 + rand() * 4;
      return;
    }
    // prefer to keep going the way it was facing, and lean towards the nearest rioter
    let near: Mob | undefined;
    let nearD = Infinity;
    for (const m of mobs) {
      if (m.state !== 'walk') continue;
      const d = Math.hypot(m.x - s.x, m.y - s.y);
      if (d < nearD) {
        nearD = d;
        near = m;
      }
    }
    const hunt = near && nearD < 12 * TILE ? near : undefined;
    const sc = new Map<Dir, number>();
    for (const d of DIRS) {
      const closer = hunt && Math.hypot(hunt.x - (s.x + DV[d][0] * TILE), hunt.y - (s.y + DV[d][1] * TILE)) < nearD;
      sc.set(d, (d === s.dir ? 1.5 : 0) + rand() + (closer ? 1.6 : 0));
    }
    const order = [...DIRS].sort((a, b) => (sc.get(b) ?? 0) - (sc.get(a) ?? 0));
    for (const d of order) {
      const nx = s.tx + DV[d][0];
      const ny = s.ty + DV[d][1];
      if (free(nx, ny)) {
        s.dir = d;
        s.toTx = nx;
        s.toTy = ny;
        occ.set(key(nx, ny), s.pet.mint);
        s.fromX = s.tx * TILE;
        s.fromY = s.ty * TILE;
        s.mt = 0;
        s.state = 'move';
        return;
      }
    }
    s.state = 'idle';
    s.timer = 0.8 + rand();
  }

  function update(dt: number) {
    clock += dt;
    for (const s of pets.values()) {
      if (s.hopV !== 0 || s.hopY > 0) {
        s.hopV -= 260 * dt;
        s.hopY = Math.max(0, s.hopY + s.hopV * dt);
        if (s.hopY === 0) s.hopV = 0;
      }
      if (held === s.pet.mint) continue;
      if (s.state === 'move') {
        s.mt += dt / MOVE_T;
        if (s.mt >= 1) {
          occ.delete(key(s.tx, s.ty));
          s.tx = s.toTx;
          s.ty = s.toTy;
          s.x = s.tx * TILE;
          s.y = s.ty * TILE;
          s.state = 'idle';
          s.timer = rand() < 0.65 ? 0 : 0.6 + rand() * 3;
        } else {
          s.x = s.fromX + (s.toTx * TILE - s.fromX) * s.mt;
          s.y = s.fromY + (s.toTy * TILE - s.fromY) * s.mt;
        }
      } else {
        s.timer -= dt;
        if (s.timer <= 0) chooseNext(s);
      }
    }

    for (const m of mobs) updateMob(m, dt);

    // a character next to a standing rioter gives it a baguette bonk
    for (const s of pets.values()) {
      s.cool -= dt;
      if (s.cool > 0 || s.state === 'sleep' || held === s.pet.mint) continue;
      for (const m of mobs) {
        if (m.state !== 'walk') continue;
        const dx = m.x - s.x;
        const dy = m.y - s.y;
        const d = Math.hypot(dx, dy);
        if (d >= 22) continue;
        m.state = 'down';
        m.timer = 2.2 + rand() * 0.8;
        m.vx = (dx / (d || 1)) * 70;
        m.vy = (dy / (d || 1)) * 70;
        m.face = dx >= 0 ? 1 : -1;
        s.cool = 2.2 + rand() * 1.5;
        if (s.hopY === 0) s.hopV = 95;
        s.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
        effects.push({ mint: s.pet.mint, x: m.x + 8, y: m.y, t: 0, text: BONKS[Math.floor(rand() * BONKS.length)], dir: dx >= 0 ? 1 : -1 });
        routed++;
        break;
      }
    }
    for (let i = effects.length - 1; i >= 0; i--) {
      effects[i].t += dt;
      if (effects[i].t > 1.1) effects.splice(i, 1);
    }
  }

  function updateMob(m: Mob, dt: number) {
    m.phase += dt;
    if (m.state === 'gone') {
      m.timer -= dt;
      if (m.timer <= 0) spawnMob(m);
      return;
    }
    if (m.state === 'down') {
      m.timer -= dt;
      stepMob(m, m.vx * dt, m.vy * dt);
      const k = Math.pow(0.02, dt);
      m.vx *= k;
      m.vy *= k;
      if (m.timer <= 0) {
        m.state = 'flee';
        m.stuck = 0;
      }
      return;
    }
    if (m.state === 'flee') {
      if (m.x >= W - 10 || m.stuck > 2.5) {
        m.state = 'gone';
        m.timer = 1.5 + rand() * 3.5;
        return;
      }
      m.tx = W - 6;
      m.ty = m.y;
    } else {
      m.timer -= dt;
    }
    const dx = m.tx - m.x;
    const dy = m.ty - m.y;
    const d = Math.hypot(dx, dy);
    if (m.state === 'walk' && (d < 3 || m.timer <= 0)) {
      pickTarget(m);
      return;
    }
    const speed = m.state === 'flee' ? 34 : 16;
    if (d > 0.5) {
      const ok = stepMob(m, (dx / d) * speed * dt, (dy / d) * speed * dt);
      if (!ok) {
        m.stuck += dt;
        if (m.state === 'walk') pickTarget(m);
      } else {
        m.stuck = 0;
      }
      if (Math.abs(dx) > 1) m.face = dx > 0 ? 1 : -1;
    }
  }

  function hop(mint: string) {
    const s = pets.get(mint);
    if (s && s.hopY === 0) s.hopV = 80;
  }

  function sprite(s: PetState) {
    const set = spritesFor(s.pet.petId, s.pet.look);
    const f = s.state === 'move' ? (Math.floor(s.mt * 2) % 2 === 0 ? 0 : 1) : 2;
    return set[s.dir][f];
  }

  function drawMob(g: CanvasRenderingContext2D, m: Mob) {
    if (m.state === 'gone') return;
    const frame = m.state === 'down' ? 0 : Math.floor(m.phase * 4) % 2;
    const sp = mobSprite(m.variant, m.kind, frame, m.face);
    const x = Math.round(m.x);
    const y = Math.round(m.y);
    g.fillStyle = 'rgba(0,0,0,0.28)';
    g.fillRect(x + 3, y + 13, 10, 3);
    if (m.state === 'down') {
      g.save();
      g.translate(x + 8, y + 10);
      g.rotate(m.face * (Math.PI / 2));
      g.drawImage(sp, -8, -8);
      g.restore();
      g.fillStyle = '#FFD84D';
      for (let i = 0; i < 3; i++) {
        const a = clock * 6 + i * 2.1;
        g.fillRect(Math.round(x + 8 + Math.cos(a) * 6), Math.round(y - 1 + Math.sin(a) * 2), 2, 2);
      }
      return;
    }
    const bob = Math.floor(m.phase * 8) % 2 === 1 ? -1 : 0;
    g.drawImage(sp, x, y + bob);
  }

  function drawPet(g: CanvasRenderingContext2D, s: PetState) {
    const sp = sprite(s);
    const bob = s.state === 'move' && Math.floor(s.mt * 4) % 2 === 1 ? -1 : 0;
    const px = Math.round(s.x) - 1;
    const py = Math.round(s.y) - 1 + bob - Math.round(s.hopY);
    g.fillStyle = 'rgba(0,0,0,0.28)';
    g.fillRect(Math.round(s.x) + 3, Math.round(s.y) + 13, 10, 3);
    g.drawImage(sp, px, py);
    if (s.state === 'sleep') {
      g.fillStyle = '#FFFFFF';
      const t = (clock * 0.8 + s.phase) % 1.6;
      for (let k = 0; k < 2; k++) {
        const tt = (t + k * 0.8) % 1.6;
        const zx = px + 14 + tt * 3;
        const zy = py + 2 - tt * 7;
        g.globalAlpha = Math.max(0, 1 - tt / 1.6);
        g.fillRect(Math.round(zx), Math.round(zy), 3, 1);
        g.fillRect(Math.round(zx) + 2, Math.round(zy) + 1, 1, 1);
        g.fillRect(Math.round(zx) + 1, Math.round(zy) + 2, 1, 1);
        g.fillRect(Math.round(zx), Math.round(zy) + 3, 3, 1);
      }
      g.globalAlpha = 1;
    }
    if (s.hopY > 5) {
      g.fillStyle = '#FF6B8B';
      const hx = px + 12;
      const hy = py - 6;
      g.fillRect(hx, hy, 2, 2);
      g.fillRect(hx + 3, hy, 2, 2);
      g.fillRect(hx, hy + 1, 5, 2);
      g.fillRect(hx + 1, hy + 3, 3, 1);
    }
    if (s.pet.mint === focus) {
      // a bobbing arrow shows which character belongs to this coin
      const ay = py - 7 + Math.round(Math.sin(clock * 5) * 1.5);
      g.fillStyle = OUT;
      g.fillRect(px + 4, ay - 1, 10, 2);
      g.fillRect(px + 5, ay + 1, 8, 2);
      g.fillRect(px + 6, ay + 3, 6, 2);
      g.fillRect(px + 7, ay + 5, 4, 2);
      g.fillStyle = '#FF7B5C';
      g.fillRect(px + 5, ay, 8, 1);
      g.fillRect(px + 6, ay + 1, 6, 1);
      g.fillRect(px + 7, ay + 2, 4, 1);
      g.fillRect(px + 8, ay + 3, 2, 1);
    }
  }

  function draw(g: CanvasRenderingContext2D) {
    g.imageSmoothingEnabled = false;
    g.drawImage(terrain.img, 0, 0);

    // warm glow under the burning barrels
    for (const [fx, fy] of terrain.fires) {
      const grad = g.createRadialGradient(fx, fy + 4, 2, fx, fy + 4, 30);
      grad.addColorStop(0, night ? 'rgba(255,150,60,0.42)' : 'rgba(255,150,60,0.2)');
      grad.addColorStop(1, 'rgba(255,150,60,0)');
      g.fillStyle = grad;
      g.fillRect(fx - 32, fy - 28, 64, 64);
    }

    // everyone back to front: characters and rioters sorted together
    const items: { y: number; f: () => void }[] = [];
    for (const s of pets.values()) items.push({ y: s.y, f: () => drawPet(g, s) });
    for (const m of mobs) items.push({ y: m.y, f: () => drawMob(g, m) });
    items.sort((a, b) => a.y - b.y);
    for (const it of items) it.f();

    // flames and smoke rise from the barrels, in front of the crowd
    for (const [fx, fy] of terrain.fires) {
      const h = Math.round(6 + Math.sin(clock * 14 + fx) * 1.5 + Math.sin(clock * 23 + fy));
      g.fillStyle = '#E8591A';
      g.fillRect(fx - 3, fy - h, 6, h);
      g.fillStyle = '#FFB347';
      g.fillRect(fx - 2, fy - h + 2, 4, h - 2);
      g.fillStyle = '#FFE9A0';
      g.fillRect(fx - 1, fy - h + 4, 2, Math.max(1, h - 4));
      for (let k = 0; k < 3; k++) {
        const t = (clock * 0.5 + k / 3 + fx * 0.01) % 1;
        g.fillStyle = `rgba(60,58,62,${(0.24 * (1 - t)).toFixed(3)})`;
        g.beginPath();
        g.arc(fx + Math.sin(t * 6 + k) * 4, fy - 9 - t * 24, 3 + t * 4, 0, Math.PI * 2);
        g.fill();
      }
    }

    // baguette swings, impact stars and comic text
    for (const e of effects) {
      const s = pets.get(e.mint);
      if (s && e.t < 0.35) {
        g.save();
        g.translate(Math.round(s.x) + 8, Math.round(s.y) + 6 - Math.round(s.hopY));
        g.rotate(e.dir * (-1.2 + e.t * 7));
        g.fillStyle = OUT;
        g.fillRect(1, -2, 14, 5);
        g.fillStyle = '#D9A441';
        g.fillRect(2, -1, 12, 3);
        g.fillStyle = '#B9822B';
        g.fillRect(2, 1, 12, 1);
        g.restore();
      }
      if (e.t < 0.4) {
        g.fillStyle = '#FFD84D';
        for (let i = 0; i < 6; i++) {
          const a = i * 1.05 + 0.4;
          const r = 4 + e.t * 40;
          g.fillRect(Math.round(e.x + Math.cos(a) * r), Math.round(e.y + 8 + Math.sin(a) * r * 0.7), 2, 2);
        }
      }
      g.globalAlpha = Math.max(0, 1 - Math.max(0, e.t - 0.7) / 0.4);
      g.font = 'bold 8px monospace';
      g.textAlign = 'center';
      g.lineWidth = 2;
      g.strokeStyle = OUT;
      g.fillStyle = '#FFD84D';
      g.strokeText(e.text, Math.round(e.x), Math.round(e.y - 2 - e.t * 14));
      g.fillText(e.text, Math.round(e.x), Math.round(e.y - 2 - e.t * 14));
      g.globalAlpha = 1;
    }

    // evening and night
    if (night || dusk) {
      g.fillStyle = night ? 'rgba(10,18,60,0.5)' : 'rgba(255,140,70,0.16)';
      g.fillRect(0, 0, W, H);
      for (const [tx, ty] of terrain.lamps) {
        const cx = tx * TILE + 8;
        const cy = ty * TILE + 8;
        const grad = g.createRadialGradient(cx, cy, 1, cx, cy, night ? 28 : 20);
        grad.addColorStop(0, night ? 'rgba(255,225,140,0.38)' : 'rgba(255,225,140,0.22)');
        grad.addColorStop(1, 'rgba(255,225,140,0)');
        g.fillStyle = grad;
        g.fillRect(cx - 36, cy - 36, 72, 72);
      }
    }
  }

  function positions() {
    return [...pets.values()].map((s) => ({ mint: s.pet.mint, x: s.x, y: s.y - Math.round(s.hopY) }));
  }

  function hitTest(x: number, y: number) {
    const list = [...pets.values()].sort((a, b) => b.y - a.y);
    for (const s of list) if (x >= s.x - 2 && x <= s.x + 18 && y >= s.y - 3 && y <= s.y + 18) return s.pet.mint;
    return null;
  }

  return { night, setPets, update, draw, positions, hitTest, hold: (m) => { held = m; }, hop, stats: () => ({ routed }) };
}
