import type { Coin, Market } from '../lib/api';
import { usd } from './MarketChart';
import { voiceLabel } from '../lib/pets';
import { ago } from '../lib/time';
import { href } from '../router';
import PetAvatar from './PetAvatar';

// One coin as a row of the "List" ledger view.
export default function CoinRow({ n, coin, market }: { n: number; coin: Coin; market?: Omit<Market, 'history'> }) {
  const cat = coin.cat;
  const ch = market?.change24h;
  return (
    <a className="lr" role="listitem" href={href.coin(coin.mint)}>
      <span className="lr-n mono muted">{n}</span>
      <span className="lr-coin">
        <img src={coin.imageUrl} alt="" width={40} height={40} loading="lazy" />
        <span>
          <b>{coin.name}</b>
          <span className="mono muted small"> ${coin.symbol}</span>
        </span>
      </span>
      <span className="lr-cat">
        <PetAvatar id={cat.id} name={cat.name} size={28} />
        <span>
          {cat.name} <span className="muted small">· {voiceLabel(cat.voice)}</span>
        </span>
      </span>
      <span className="r mono">{market?.mc ? usd(market.mc) : <span className="muted">n/a</span>}</span>
      <span className={`r mono ${ch == null ? 'muted' : ch >= 0 ? 'up' : 'down'}`}>{ch == null ? '' : `${ch >= 0 ? '+' : ''}${ch.toFixed(1)}%`}</span>
      <span className="r mono muted small">{ago(coin.createdAt)}</span>
    </a>
  );
}
