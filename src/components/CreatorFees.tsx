import { useCallback, useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, PublicKey, VersionedTransaction } from '@solana/web3.js';
import BN from 'bn.js';
import { explorerTx } from '../config';
import { dbcClient } from '../lib/dbc';
import type { Coin } from '../lib/api';

const U64_MAX = new BN('18446744073709551615');
const sol = (b: BN) => Number(b.toString()) / LAMPORTS_PER_SOL;

// Best-effort read of the creator's unclaimed SOL from Meteora's fee breakdown. The field names are not documented,
// so look in the likely places and show nothing if none match (the claim button still works).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function creatorQuote(b: any): BN | null {
  const cands = [b?.creator?.unclaimedQuoteFee, b?.creator?.quoteFee, b?.creator?.quote, b?.creatorQuoteFee, b?.creator?.claimableQuoteFee];
  for (const c of cands) if (c && typeof c.toString === 'function' && /^\d+$/.test(c.toString())) return new BN(c.toString());
  return null;
}

// Shown only to the wallet that launched this coin. The creator earns a share of the trading fees set in the curve config.
export default function CreatorFees({ coin }: { coin: Coin }) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [waiting, setWaiting] = useState<BN | null>(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const mine = !!wallet.publicKey && wallet.publicKey.toBase58() === coin.creator && !!coin.pool;

  const load = useCallback(async () => {
    if (!coin.pool) return;
    try {
      const b = await dbcClient(connection).state.getPoolFeeBreakdown(new PublicKey(coin.pool));
      setWaiting(creatorQuote(b));
    } catch {
      setWaiting(null);
    }
  }, [connection, coin.pool]);

  useEffect(() => {
    if (mine) void load();
  }, [mine, load]);

  if (!mine) return null;

  async function claim() {
    if (!wallet.publicKey || !wallet.sendTransaction || !coin.pool) return;
    setBusy(true);
    setMsg('');
    try {
      const tx = await dbcClient(connection).creator.claimCreatorTradingFee({
        pool: new PublicKey(coin.pool),
        creator: wallet.publicKey,
        payer: wallet.publicKey,
        maxBaseAmount: new BN(0),
        maxQuoteAmount: U64_MAX,
      });
      const latest = await connection.getLatestBlockhash('confirmed');
      tx.feePayer = wallet.publicKey;
      tx.recentBlockhash = latest.blockhash;
      const sim = await connection.simulateTransaction(new VersionedTransaction(tx.compileMessage()), { sigVerify: false, replaceRecentBlockhash: true });
      if (sim.value.err) throw new Error('Nothing to claim yet, or the claim would fail. Try again after more trading.');
      const signature = await wallet.sendTransaction(tx, connection);
      await connection.confirmTransaction({ signature, ...latest }, 'confirmed');
      setMsg(`Claimed. ${explorerTx(signature)}`);
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Claim failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card devnote" aria-label="Creator fees">
      <p>
        <b>Your creator fees.</b> As the creator of this coin you earn a share of its trading fees.
        {waiting ? <> Waiting to claim: <b className="mono">{sol(waiting).toFixed(6)} SOL</b>.</> : null}
      </p>
      <button className="btn primary" onClick={claim} disabled={busy}>{busy ? 'Claiming…' : 'Claim my fees'}</button>
      {msg && <p className="status" role="status">{msg}</p>}
    </section>
  );
}
