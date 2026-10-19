// One-time local setup:  npm run setup
// Creates .env from .env.example if you do not have one yet, and tells you what is left to do.
// It never overwrites an existing .env.
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const envPath = new URL('.env', root);
const examplePath = new URL('.env.example', root);

if (fs.existsSync(envPath)) {
  console.log('.env already exists, leaving it alone.');
} else {
  fs.copyFileSync(examplePath, envPath);
  console.log('Created .env from .env.example (devnet, local storage, canned pet lines).');
}

const env = fs.readFileSync(envPath, 'utf8');
const get = (k) => (env.match(new RegExp(`^${k}=(.*)$`, 'm')) || [])[1]?.trim() || '';
const todo = [];
if (!get('PINATA_JWT')) todo.push('PINATA_JWT is empty: fine for testing, but coin images will not show in Phantom or explorers until you add a free Pinata key.');
if (!get('LLM_API_KEY')) todo.push('LLM_API_KEY is empty: pets answer with canned lines. Add a free Groq key to make them talk for real.');
if (!get('DBC_CONFIG')) todo.push('DBC_CONFIG is empty: coins are plain tokens with no trading. Run `npm run dbc-config` (needs a funded devnet wallet) to turn on the bonding curve.');
console.log('\nNext:');
console.log('  1. npm install');
console.log('  2. npm run dev      (API on :8787, site on http://localhost:5173)');
if (todo.length) console.log('\nOptional:\n' + todo.map((t) => '  - ' + t).join('\n'));
