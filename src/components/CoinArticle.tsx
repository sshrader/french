import type { Coin, Market, Post } from '../lib/api';
import { usd } from './MarketChart';
import { voiceLabel } from '../lib/pets';
import { ago } from '../lib/time';
import { href } from '../router';
import PetAvatar from './PetAvatar';

// One coin written up as a newspaper article. The lead story runs wide with a bigger headline.
export default function CoinArticle({ coin, latest, market, lead }: { coin: Coin; latest?: Post; market?: Omit<Market, 'history'>; lead?: boolean }) {
  const cat = coin.cat;
  const ch = market?.change24h;
  return (
    <a className={`article${lead ? ' lead' : ''}`} href={href.coin(coin.mint)}>
      <p className="kicker mono">{lead ? 'À la une · ' : ''}{cat.name} · {voiceLabel(cat.voice)}</p>
      <h3 className="headline">{coin.name}</h3>
      <p className="byline mono muted small">
        Par {cat.name} · ${coin.symbol} · {ago(coin.createdAt)}
      </p>
      <div className="art-body">
        <img className="art-img" src={coin.imageUrl} alt="" width={lead ? 140 : 84} height={lead ? 140 : 84} loading="lazy" />
        <p className="art-text">{coin.description || `${cat.name} has taken up the baguette for ${coin.name}.`}</p>
      </div>
      <blockquote className="pull">
        <PetAvatar id={cat.id} name={cat.name} size={26} />
        <span>{latest ? latest.text : `${cat.name} is writing the first entry…`}</span>
      </blockquote>
      <p className="art-foot mono small">
        <span className="muted">Market cap</span> <b>{market?.mc ? usd(market.mc) : 'n/a'}</b>
        {ch != null && <span className={ch >= 0 ? 'up' : 'down'}> {ch >= 0 ? '▲ +' : '▼ '}{ch.toFixed(1)}%</span>}
      </p>
    </a>
  );
}
