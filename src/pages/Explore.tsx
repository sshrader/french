import { useEffect, useMemo, useState } from 'react';
import { getAllMarkets, listCoins, listPosts, type Coin, type Market, type Post } from '../lib/api';
import { href } from '../router';
import Brigade from '../components/Brigade';
import CoinArticle from '../components/CoinArticle';
import CoinRow from '../components/CoinRow';
import PetPark from '../components/PetPark';

export default function Explore() {
  const [coins, setCoins] = useState<Coin[] | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<'new' | 'mc'>('new');
  const [view, setView] = useState<'cards' | 'list'>(() => {
    try {
      return localStorage.getItem('bp-view') === 'list' ? 'list' : 'cards';
    } catch {
      return 'cards';
    }
  });
  const [markets, setMarkets] = useState<Record<string, Omit<Market, 'history'>>>({});

  useEffect(() => {
    let alive = true;
    listCoins()
      .then((c) => alive && (setCoins(c), setError('')))
      .catch(() => alive && setError('Could not reach the API. Is the server running? (npm run dev starts both.)'));
    const load = () =>
      listPosts(50)
        .then((p) => alive && setPosts(p))
        .catch(() => {});
    load();
    const loadMarkets = () =>
      getAllMarkets()
        .then((m) => alive && setMarkets(m))
        .catch(() => {});
    loadMarkets();
    const timer = setInterval(load, 20000);
    const mtimer = setInterval(loadMarkets, 10000);
    return () => {
      alive = false;
      clearInterval(timer);
      clearInterval(mtimer);
    };
  }, []);

  // Posts arrive newest first, so the first one seen for a coin is its latest.
  const pickView = (v: 'cards' | 'list') => {
    setView(v);
    try {
      localStorage.setItem('bp-view', v);
    } catch {
      /* ignore */
    }
  };

  const latest = useMemo(() => {
    const m = new Map<string, Post>();
    for (const p of posts) if (!m.has(p.mint)) m.set(p.mint, p);
    return m;
  }, [posts]);

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!coins) return [];
    const list = term ? coins.filter((c) => [c.name, c.symbol, c.cat.name].some((s) => s.toLowerCase().includes(term))) : coins;
    return sort === 'mc' ? [...list].sort((a, b) => (markets[b.mint]?.mc ?? 0) - (markets[a.mint]?.mc ?? 0)) : list;
  }, [coins, q, sort, markets]);

  return (
    <div className="wrap">
      <section className="hero">
        <Brigade cta />
      </section>

      <div className="stack-layer">
      {coins && coins.length > 0 && <PetPark />}

      <section className="filters">
        <h2>Launched coins{coins ? <span className="muted"> · {coins.length}</span> : null}</h2>
        <label className="search">
          <span className="sr">Search coins</span>
          <input className="in" type="text" placeholder="Search name, ticker or character" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
        </label>
        <label className="search">
          <span className="sr">Sort coins</span>
          <select className="in" value={sort} onChange={(e) => setSort(e.target.value as 'new' | 'mc')}>
            <option value="new">Newest</option>
            <option value="mc">Highest market cap</option>
          </select>
        </label>
        <div className="seg" role="group" aria-label="View">
          <button type="button" className={view === 'cards' ? 'on' : ''} aria-pressed={view === 'cards'} onClick={() => pickView('cards')}>Gazette</button>
          <button type="button" className={view === 'list' ? 'on' : ''} aria-pressed={view === 'list'} onClick={() => pickView('list')}>La Carte</button>
        </div>
      </section>

      {error && <p className="error">{error}</p>}
      {coins && coins.length === 0 && (
        <div className="card emptycard">
          <h3>No coins yet</h3>
          <p className="muted">Launch the first one and meet its hero.</p>
          <a className="btn primary" href={href.launch}>Launch a coin</a>
        </div>
      )}
      {coins && coins.length > 0 && shown.length === 0 && <p className="muted empty">No coins match "{q}".</p>}
      {view === 'cards' ? (
        <div className="paper">
          {shown.map((c, i) => (
            <CoinArticle key={c.mint} lead={i === 0 && !q.trim()} coin={c} latest={latest.get(c.mint)} market={markets[c.mint]} />
          ))}
        </div>
      ) : (
        shown.length > 0 && (
          <div className="ledger" role="list">
            <div className="lr lr-h mono" aria-hidden="true">
              <span>#</span><span>Coin</span><span>Champion</span><span className="r">Market cap</span><span className="r">24h</span><span className="r">Age</span>
            </div>
            {shown.map((c, i) => (
              <CoinRow key={c.mint} n={i + 1} coin={c} market={markets[c.mint]} />
            ))}
          </div>
        )
      )}
      </div>
    </div>
  );
}
