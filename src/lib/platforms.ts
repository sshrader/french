// Trading terminals a creator can jump to right after launch. The URLs are the usual token-page patterns for each site;
// if one of them changes, edit it here. New coins can take a minute or two to show up on a terminal.
export const PLATFORMS = [
  { id: 'baguettepad', label: 'BaguettePad coin page', url: null as null | ((mint: string) => string) },
  { id: 'gmgn', label: 'GMGN', url: (m: string) => `https://gmgn.ai/sol/token/${m}` },
  { id: 'axiom', label: 'Axiom', url: (m: string) => `https://axiom.trade/meme/${m}` },
  { id: 'padre', label: 'Terminal (Padre)', url: (m: string) => `https://trade.padre.gg/trade/solana/${m}` },
] as const;

export type PlatformId = (typeof PLATFORMS)[number]['id'];

export const platformUrl = (id: string, mint: string): string | null => PLATFORMS.find((p) => p.id === id)?.url?.(mint) ?? null;
