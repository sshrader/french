import { useCallback, useEffect, useRef, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { CLUSTER, IS_MAINNET } from './config';
import { href, useRoute } from './router';
import Explore from './pages/Explore';
import Launch from './pages/Launch';
import Wire from './pages/Wire';
import CoinPage from './pages/CoinPage';
import Admin from './pages/Admin';

function Hat() {
  // The Bonkeparte mark: the emperor in his laurels
  return <img className="paw" src="/brand-mark.png" width={30} height={30} alt="" style={{ borderRadius: '50%', objectFit: 'cover' }} />;
}

export default function App() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const route = useRoute();
  const [balance, setBalance] = useState<number | null>(null);
  const [airdropMsg, setAirdropMsg] = useState('');
  const [airdropping, setAirdropping] = useState(false);

  const refreshBalance = useCallback(async () => {
    if (!publicKey) return setBalance(null);
    try {
      setBalance((await connection.getBalance(publicKey, 'confirmed')) / LAMPORTS_PER_SOL);
    } catch {
      setBalance(null);
    }
  }, [connection, publicKey]);

  // Sticky bars below the header need to know how tall it is (it wraps on small screens).
  const topRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = topRef.current;
    if (!el) return;
    const set = () => document.documentElement.style.setProperty('--top-h', `${el.offsetHeight}px`);
    set();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    refreshBalance();
    const t = setInterval(refreshBalance, 15000);
    return () => clearInterval(t);
  }, [refreshBalance]);

  async function airdrop() {
    if (!publicKey) return;
    setAirdropping(true);
    setAirdropMsg('');
    try {
      const sig = await connection.requestAirdrop(publicKey, LAMPORTS_PER_SOL);
      const latest = await connection.getLatestBlockhash();
      await connection.confirmTransaction({ signature: sig, ...latest }, 'confirmed');
      setAirdropMsg('Received 1 SOL of test money.');
      refreshBalance();
    } catch {
      setAirdropMsg('The public faucet is rate limited. Get test SOL at');
    } finally {
      setAirdropping(false);
    }
  }

  const section = route.name === 'coin' ? 'explore' : route.name === 'admin' ? '' : route.name;
  const link = (name: 'explore' | 'launch' | 'wire', label: string) => (
    <a className={section === name ? 'on' : ''} href={href[name]} aria-current={section === name ? 'page' : undefined}>
      {label}
    </a>
  );

  return (
    <>
      <div className="banner">
        {IS_MAINNET ? (
          <>Beta on Solana mainnet. Real money: memecoins are extremely risky, you can lose everything. Not financial advice.</>
        ) : (
          <>You are on Solana <b>{CLUSTER}</b>. Coins made here are test coins with no value.</>
        )}
      </div>
      <header className="top" ref={topRef}>
        <div className="wrap top-in">
          <a className="brand" href={href.explore} aria-label="Bonkeparte home">
            <Hat />
            Bonkeparte
          </a>
          <nav className="nav" aria-label="Main">
            {link('explore', 'Explore')}
            {link('launch', 'Launch')}
            {link('wire', 'La Gazette')}
          </nav>
          <div className="wallet-area">
            {publicKey && balance !== null && <span className="bal mono">{balance.toFixed(3)} SOL</span>}
            {publicKey && CLUSTER === 'devnet' && (
              <button className="btn" onClick={airdrop} disabled={airdropping}>
                {airdropping ? 'Requesting…' : 'Get test SOL'}
              </button>
            )}
            <WalletMultiButton />
          </div>
        </div>
      </header>

      {airdropMsg && (
        <div className="wrap">
          <p className="note">
            {airdropMsg}{' '}
            <a href="https://faucet.solana.com" target="_blank" rel="noreferrer">faucet.solana.com</a>
          </p>
        </div>
      )}

      <main>
        {route.name === 'explore' && <Explore />}
        {route.name === 'launch' && <Launch balance={balance} onCreated={refreshBalance} />}
        {route.name === 'wire' && <Wire />}
        {route.name === 'admin' && <Admin />}
        {route.name === 'coin' && <CoinPage mint={route.mint} />}
      </main>

      <footer className="wrap foot muted">
        {IS_MAINNET
          ? 'Bonkeparte is unaudited beta software. Characters are AI parodies and their posts are not advice. Coins are not endorsed by Bonkeparte. Only risk what you can lose.'
          : `Prototype running on ${CLUSTER}. Not audited.`}
      </footer>
    </>
  );
}
