# Bonkeparte

A French Revolution flavoured memecoin launchpad on Solana. *Vive la memecoin.* Launch a token in one click, trade it on a Meteora bonding curve, and let each coin's AI character write its lore. Built on the Bonkeparte codebase.

## Quick start (local)

Requires Node 20 or newer.

```bash
npm install
npm run setup     # creates .env from .env.example (never overwrites an existing one)
npm run dev       # API on :8787, site on http://localhost:5173
```

The default `.env` runs on **devnet** with local storage, so nothing costs real money. Open http://localhost:5173, connect Phantom set to Devnet, press **Get test SOL**, and launch a coin. Edit `.env` any time to add a Pinata key (images show up in wallets), an LLM key (characters talk for real) or the bonding-curve config. See the comments in `.env.example`.

**Block-zero dev buy.** With the curve on, the Launch form has an optional dev buy (in SOL). The creator's buy is built into the same transaction as pool creation (`createPoolWithFirstBuy`), so nobody can buy before the creator. The server reads the tokens the creator holds straight from that transaction and shows "Block-zero dev buy: N tokens (x% of supply)" on the coin page, so it is always disclosed and cannot be faked from the browser. The cap is `VITE_MAX_DEV_BUY_SOL`. Untested on-chain so far: try it on devnet first.

## 1. Prepare Phantom (devnet)

1. Create a **separate Phantom account just for development**. Never use one that holds real funds.
2. Phantom → Settings → Developer Settings → turn on **Testnet Mode** → choose **Solana Devnet**.
3. You will get test SOL with the **Get test SOL** button in the app, or at https://faucet.solana.com.

## 2. Run it

Requires Node 20 or newer.

```bash
npm install
cp .env.example .env     # optional for a first run
npm run dry-run          # offline: checks the transaction is built correctly
npm run dry-run -- --send   # online: sends a real test coin to devnet with a throwaway keypair
npm run dev              # API on :8787, site on :5173
```

Open http://localhost:5173, connect Phantom, click **Get test SOL**, fill in the form, **Launch coin**. Phantom asks you to approve one transaction.

Run `npm run dry-run -- --send` first if you can. It tests the on-chain part with no wallet or browser involved, so if something fails later you know it is the browser or wallet layer.

## What happens when you click Launch

1. **Upload.** The browser sends the image, name, ticker and description to `POST /api/upload`. The server stores the image and a metadata JSON file and returns the metadata link.
2. **One transaction** (`src/lib/createCoin.ts`), signed in Phantom: create mint, initialise (6 decimals), create your token account, mint 1,000,000,000 tokens, attach the metadata, revoke mint authority, revoke freeze authority. All or nothing.
3. **Register.** The browser sends the mint and signature to `POST /api/coins`. The server does not trust it. It reads the chain itself and rejects the coin unless the mint exists, both authorities are revoked, and the transaction succeeded and was paid by the creator. It then pairs a character (a hero or meme) by hashing the mint address, so the pairing looks random but cannot be rerolled.

## The characters

Every coin is paired with a random French hero (Napoleon, Joan of Arc, d'Artagnan, Vercingetorix) or French-themed meme (Trollface, Pepe, Gigachad, Wojak), picked from its mint address. The pixel-art pictures live in `public/heroes/` (a portrait and a transparent park sprite for each). They are played as AI parodies and labelled as such. Check the rights to the meme characters before launching commercially.

Every coin's character can talk and write.

- **Chat.** Each coin page has a chat with its character. `POST /api/coins/:mint/chat` (single coin: `GET /api/coins/:mint`) sends the message and the last few turns to the model and returns the reply.
- **Lore.** When a coin is registered its character writes a first diary entry, then a new one every `CAT_POST_MINUTES` (varies per coin). Entries are stored in `server/data/posts.json`, shown on the coin card and in the La Gazette feed, and each continues from the character's last three entries.
- **Voices.** Each character has its own voice, defined in `server/pets.mjs` (with canned fallback lines in `server/petbrain.mjs`). Edit the style lines to change how one sounds.
- **AI brain.** `server/llm.mjs` calls any OpenAI-compatible chat API. Put `LLM_API_KEY` in `.env` (Groq has a free tier, see `.env.example`) and restart. With no key the characters answer from canned lines and say so.
- **Safety rules** are in `server/petbrain.mjs`. Pets say they are AI, never predict prices or tell anyone to buy or sell, and treat coin descriptions and chat messages as untrusted text. Replies are stripped of links and markdown. Posts are labelled AI in the UI.
- **Cost control.** Chat is limited to 12 messages a minute per visitor, and the server stops calling the model after `LLM_DAILY_LIMIT` calls a day (lore posts stop earlier, at 70%, so chat keeps working). After that, characters fall back to canned lines.

Test the logic without a key or internet: `npm run pet-test`.

## Metadata storage

- **Local mode (default).** Files go to `server/uploads/`. The flow works, but the image link is `http://localhost…`, so Phantom and explorers cannot load it and the picture will not show.
- **Pinata mode.** Create a free Pinata account, make an API key (JWT), put it in `.env` as `PINATA_JWT`. Images and metadata then go to IPFS and show up everywhere. The upload call is in `server/index.mjs` (`pinFile`). If Pinata changed its API, that function is the only place to edit.

## Files

```
server/index.mjs        API: upload, register (verifies on chain), list
server/pets.mjs         the character roster (4 heroes, 4 memes) and voices
server/petbrain.mjs     what the characters say: prompts, safety rules, cleanup, canned fallback
server/llm.mjs          the model client (any OpenAI-compatible API)
server/lore.mjs         diary entries and the background writer
server/limits.mjs       rate limit and daily call budget
server/store.mjs        JSON-file storage (swap for a real database later)
src/lib/createCoin.ts   the transaction. Start reading here.
src/lib/api.ts          client calls to the API
src/router.ts           tiny hash router (#/, #/launch, #/wire, #/coin/<mint>)
src/pages/              Explore, Launch, La Gazette, coin page
src/components/         create form, coin card, character chat, post list, character portraits
src/App.tsx             header, nav, wallet button, balance, test-SOL button
scripts/dry-run.ts      tests the transaction without a browser
scripts/pet-test.mjs    tests the character logic against a fake model server
```

## Known limits (on purpose, for now)

- **The creator receives the whole supply.** That is the starter model, not a launchpad. In the next step an Anchor program holds the supply and sells it along a bonding curve.
- Metadata is **immutable** (`isMutable: false`), so a typo in the name is permanent. Fine on devnet.
- Only the character chat is rate limited. Upload and register have no limits, accounts or spam protection.
- Chat and the daily call count live in memory, so they reset when the server restarts.
- JSON-file storage, no database.
- Not audited. Do not use on mainnet without a security review and legal advice.

## Switching to testnet

Set `VITE_CLUSTER=testnet` and `SOLANA_RPC_URL=https://api.testnet.solana.com`, and switch Phantom to Solana Testnet. Devnet is the better choice for development: testnet is meant for validator testing and is less stable.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| `Buffer is not defined` in the browser | `src/polyfills.ts` must be the first import in `main.tsx` |
| Phantom does not appear in the wallet list | Phantom not installed or locked in this browser profile |
| Transaction is simulated and fails in Phantom | Wrong network: Phantom must be on Devnet, and the site's RPC must match |
| Airdrop fails | The public faucet is rate limited. Use https://faucet.solana.com |
| "Unknown upload" on register | The API restarted between upload and register. Launch again |
| Register says authority not revoked | The transaction did not include the two revoke steps. It should not happen unless the code was edited |

## Market cap chart

Each coin page shows a market cap chart. `MARKET_MODE=demo` (the default) draws made-up numbers that move randomly, which is what you want on devnet. `MARKET_MODE=live` asks DexScreener for the coin's mint address and charts the real market cap. That only works for mainnet coins that trade on a DEX. DexScreener has no free history endpoint, so the server records a point every 30 seconds into `server/data/market.json`. Code: `server/market.mjs`, `src/components/MarketChart.tsx`.

## Trading on a bonding curve (Meteora)

Bonkeparte uses Meteora's Dynamic Bonding Curve program, so there is no curve code of our own to maintain or audit. The flow:

1. **Once:** `npm run dbc-config -- --check` shows the curve settings. `npm run dbc-config` creates the config on chain with the partner wallet (`.devnet-keypair.json`) and prints `DBC_CONFIG` and `VITE_DBC_CONFIG` for `.env`.
2. **Each launch:** one transaction creates the token and its curve pool (`src/lib/dbc.ts`). The server checks that the pool exists, came from your config, and was made by the paying wallet (`server/curve.mjs`).
3. **Trading:** the coin page has a Buy/Sell box (`src/components/TradeBox.tsx`) with a quote, 1% slippage, and a progress bar to graduation.
4. **Graduation:** when the curve fills, Meteora's keeper moves the coin to a DAMM v2 pool. The Trade box then points people to a DEX, and market cap comes from DexScreener in `MARKET_MODE=live`.
5. **Market cap** for curve coins is read from the curve price (market cap in SOL times the SOL price from DexScreener; `SOL_USD_FALLBACK` is used if that lookup fails).

With `VITE_DBC_CONFIG` empty the app keeps the older plain-token launch (no trading).

### If you see `429 Too many requests`

The free public devnet RPC rate-limits heavily. The app caches and looks up pools directly to stay under it, but a free key from Helius (or similar) is much more reliable. Put the same URL in `VITE_RPC_URL` (browser) and `SOLANA_RPC_URL` (server) in `.env`, then restart.

### Partner tools

- `npm run dbc-fees -- --check` shows trading fees waiting to be claimed; `npm run dbc-fees` claims them.
- `npm run dbc-migrate -- <mint>` graduates a full curve by hand (devnet testing). Meteora also has a manual migrator at migrator.meteora.ag.
- `npm run dbc-inspect -- <mint>` prints what the SDK returns for a pool (debugging).
- `docs/GO_LIVE.md` has the production checklist and the devnet graduation test.

## Characters

Every coin is paired with one of 8 AI characters (4 French heroes, 4 memes), chosen from the coin's address. Add or edit them in `server/pets.mjs` and `src/lib/pets.ts` (keep both in sync); their pictures live in `public/heroes/`. The feed page is La Gazette.

### The barricades (the park)

Each coin page has a top-down pixel street in Paris: cobbles, townhouses with tricolour awnings, gas lamps, burning barrels and two barricades. A cartoon mob (torches and pitchforks, never hurt, just bonked) wanders the road, and the characters walk up and bonk it with baguettes (POW!), then it staggers off and a new one turns up. The scene is generic and period, not a depiction of any real event. Code: `src/components/PetPark.tsx` (the card) and `src/lib/petWorld.ts` (the engine). Tap a character for a hop and its latest diary line. It shows the 40 newest characters, follows the viewer's local time of day, pauses when scrolled out of view, and starts paused if the device asks for reduced motion.
