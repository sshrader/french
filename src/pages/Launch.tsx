import { useState } from 'react';
import { PET_ROSTER, voiceLabel } from '../lib/pets';
import PetAvatar from '../components/PetAvatar';
import CreateCoinForm, { type Draft } from '../components/CreateCoinForm';

const STEPS = [
  ['Pin it', 'Your image and details are stored on IPFS.'],
  ['Sign it', 'You approve one transaction in your wallet.'],
  ['Verify it', 'The server checks the chain, then pairs your character.'],
  ['Hear it', 'Your character writes its first diary entry within seconds.'],
];

export default function Launch({ balance, onCreated }: { balance: number | null; onCreated: () => void }) {
  const [draft, setDraft] = useState<Draft>({ name: '', symbol: '', description: '', preview: null });
  return (
    <div className="wrap">
      <header className="page-h launch-h">
        <p className="eyebrow mono">Décret de lancement</p>
        <h1>Launch a coin</h1>
        <p className="lede">
          Three short sections and one wallet approval. A famous French hero or a French-themed meme is paired to your coin when it is registered, and it fights for you from that moment on.
        </p>
      </header>

      <div className="launch">
        <CreateCoinForm balance={balance} onCreated={onCreated} onDraft={setDraft} />
        <aside className="launch-side">
          <section className="card ticket" aria-label="Live preview">
            <p className="eyebrow mono">Aperçu · live preview</p>
            <div className="ticket-top">
              <div className="ticket-img">{draft.preview ? <img src={draft.preview} alt="" /> : <span className="muted small">Image</span>}</div>
              <div>
                <h3>{draft.name || 'Your coin'}</h3>
                <span className="mono muted">${draft.symbol || 'TICKER'}</span>
              </div>
            </div>
            <p className="muted small ticket-desc">{draft.description || 'Your description appears here as you type.'}</p>
            <p className="ticket-foot mono small muted">1,000,000,000 supply · paired with a champion on launch</p>
          </section>

          <section className="card">
            <h3>What happens next</h3>
            <ol className="timeline">
              {STEPS.map(([t, d]) => (
                <li key={t}>
                  <b>{t}</b>
                  <span className="muted small">{d}</span>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>

      <section className="champions" aria-label="Meet the characters">
        <div className="champions-h">
          <p className="eyebrow mono">Your champion awaits</p>
          <h2>Meet the characters</h2>
          <p className="muted small">One of these is paired to your coin, chosen from its address. You cannot reroll it.</p>
        </div>
        <div className="champ-strip">
          {PET_ROSTER.map((c) => (
            <div className="champ" key={c.id}>
              <PetAvatar id={c.id} name={c.name} size={72} />
              <b>{c.name}</b>
              <span className="muted small">{c.breed}</span>
              <span className="tag">{voiceLabel(c.voice)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
