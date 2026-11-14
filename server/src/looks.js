/* A profile's look: how their avatar is drawn - what the avatar maker
   saves. The choices are the app's (app/src/ui/avatar-art.js PARTS; a test
   keeps the two lists equal). Colours may also be any #rrggbb. */
import { Fail } from './http.js';

export const PARTS = {
  skin: ['#ffdfc4', '#f3c393', '#dda46d', '#b97c4b', '#8d5524', '#5e3a20'],
  hair: ['short', 'curly', 'ponytail', 'buns', 'long', 'spiky', 'bob', 'none'],
  hairColor: ['#2a1d18', '#5a3825', '#9a4a26', '#e2b65a', '#f08c3a', '#4f7cff', '#ff6fae', '#9b6bff'],
  eyes: ['dots', 'happy', 'sparkle', 'wink'],
  mouth: ['smile', 'grin', 'oh', 'tongue'],
  color: ['#3da9ff', '#ff8a3d', '#22c55e', '#a855f7', '#ff5d8f', '#facc15', '#14b8a6', '#ef4444'],
  outfit: ['plain', 'stripes', 'stars', 'dots', 'hoodie'],
  extra: ['none', 'cap', 'bow', 'glasses', 'headphones', 'crown', 'flower']
};
const COLOURS = new Set(['skin', 'hairColor', 'color']);

/* A look as given, checked: every part one of its choices; nothing else. */
export function look(v){
  if (v === null) return null;
  if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Fail(400, 'bad_look', 'That avatar isn\'t one Orlis Play can draw.');
  const out = {};
  for (const [k, choices] of Object.entries(PARTS)){
    const x = v[k];
    if (x === undefined) continue;
    if (typeof x !== 'string' || !(choices.includes(x) || (COLOURS.has(k) && /^#[0-9a-f]{6}$/i.test(x)))) throw new Fail(400, 'bad_look', `That avatar's ${k} isn't one of the choices.`);
    out[k] = x;
  }
  return out;
}
