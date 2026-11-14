/* The avatar maker: a child (or a grown-up) makes the character that is
   them in every game - skin, hair, face, their colour, an outfit and one
   extra - with big picture choices, a "Surprise me", and a big preview
   that waves back. Saved on their profile on the family's Orlis server, so
   it's theirs on any PC.

     openMaker(profile, { onDone })   a card over the page; onDone(look)
                                      after it's saved
     faceOf(profile, size)            an element for their face: their
                                      avatar's portrait, or (no avatar yet)
                                      their old picture */
import { button, onPick } from './cursor.js';
import { screen, h } from './screens.js';
import { sfx } from '../audio/sound.js';
import { account, AVATARS } from './account.js';
import { PARTS, body, head, portrait, surprise } from './avatar-art.js';

/* a small canvas, sharp on any screen, drawn by fn(c, size) */
function pic(size, fn, cls = 'avpic'){
  const cv = document.createElement('canvas'); cv.className = cls;
  const k = Math.min(2, (typeof devicePixelRatio === 'number' && devicePixelRatio) || 1);
  cv.width = cv.height = Math.round(size * k);
  const c = cv.getContext && cv.getContext('2d');
  if (c){ c.scale(k, k); fn(c, size); }
  return cv;
}

export function faceOf(profile, size = 48){
  if (profile && profile.look) return pic(size, (c, s) => portrait(c, s / 2, s / 2, s, profile.look, 1.3), 'avface');
  const span = document.createElement('span'); span.className = 'av';
  span.textContent = AVATARS[profile && profile.avatar] || AVATARS.cube;
  return span;
}
/* put their face in place of an element's emoji picture (.av) */
export function withFace(el, profile, size){
  const av = el.querySelector('.av');
  if (av && profile && profile.look) av.replaceWith(faceOf(profile, size));
  return el;
}

/* A first look for someone who hasn't made one: their colour from their
   old picture's place in the list, the rest friendly defaults. */
const starter = (profile) => ({ skin: PARTS.skin[1], hair: 'short', hairColor: PARTS.hairColor[1], eyes: 'dots', mouth: 'smile',
  color: PARTS.color[Math.max(0, Object.keys(AVATARS).indexOf(profile && profile.avatar)) % PARTS.color.length], outfit: 'plain', extra: 'none' });

const TABS = [
  ['skin', 'Skin'], ['hair', 'Hair'], ['face', 'Face'], ['color', 'Colour'], ['outfit', 'Outfit'], ['extra', 'Extra']
];
const NAMES = {
  hair: { short: 'Short', curly: 'Curly', ponytail: 'Ponytail', buns: 'Buns', long: 'Long', spiky: 'Spiky', bob: 'Bob', none: 'None' },
  eyes: { dots: 'Dots', happy: 'Happy', sparkle: 'Sparkly', wink: 'Wink' },
  mouth: { smile: 'Smile', grin: 'Big grin', oh: 'Oh!', tongue: 'Silly' },
  outfit: { plain: 'Plain', stripes: 'Stripes', stars: 'Star', dots: 'Spots', hoodie: 'Hoodie' },
  extra: { none: 'Nothing', cap: 'Cap', bow: 'Bow', glasses: 'Glasses', headphones: 'Headphones', crown: 'Crown', flower: 'Flower' }
};

export function openMaker(profile, { onDone = () => {} } = {}){
  sfx.select?.();
  let look = { ...starter(profile), ...(profile.look || {}) };
  let tab = 'hair', t = 0, raf = 0, wave = 0;
  const s = screen('dim setscreen avmaker'); s.style.zIndex = 7;
  const card = h('div', 'avcard');
  const left = h('div', 'avleft'), right = h('div', 'avright');
  const stage = document.createElement('canvas'); stage.className = 'avstage';
  left.append(stage, h('div', 'avname', '')); left.lastChild.textContent = profile.name;
  const tabs = h('div', 'avtabs'), opts = h('div', 'avopts'), foot = h('div', 'avfoot');
  right.append(tabs, opts, foot);
  card.append(left, right); s.appendChild(card);

  /* the preview: the whole avatar, breathing; a wave each time it changes */
  function paint(){
    const r = stage.getBoundingClientRect(), k = Math.min(2, devicePixelRatio || 1);
    const w = Math.max(1, Math.round(r.width * k)), hh = Math.max(1, Math.round(r.height * k));
    if (stage.width !== w || stage.height !== hh){ stage.width = w; stage.height = hh; }
    const c = stage.getContext('2d'); c.setTransform(k, 0, 0, k, 0, 0); c.clearRect(0, 0, r.width, r.height);
    body(c, r.width / 2, r.height * 0.93, r.height * 0.82, look, t, wave > 0 ? 'wave' : 'stand');
  }
  const loop = (now) => { t = now / 1000; wave = Math.max(0, wave - 1 / 60); paint(); raf = requestAnimationFrame(loop); };
  raf = requestAnimationFrame(loop);
  const set = (k, v) => { look = { ...look, [k]: v }; wave = 1.2; sfx.pop?.(); fill(); };

  /* a choice: a picture, picked */
  const tile = (draw, label, on, fn) => {
    const b = onPick(button('', 'avtile' + (on ? ' on' : '')), fn);
    b.insertBefore(pic(118, draw), b.firstChild);
    b.querySelector('.lbl').textContent = label;
    return b;
  };
  const swatches = (k, title) => {
    const row = h('div', 'avswatches');
    for (const col of PARTS[k]){
      const b = onPick(button('', 'avswatch' + (look[k] === col ? ' on' : '')), () => set(k, col));
      b.style.setProperty('--sw', col); row.appendChild(b);
    }
    return [h('div', 'avlabel', title), row];
  };
  const grid = (k, draw) => {
    const g = h('div', 'avgrid');
    for (const v of PARTS[k]) g.appendChild(tile((c, sz) => draw(c, sz, { ...look, [k]: v }), NAMES[k][v], look[k] === v, () => set(k, v)));
    return g;
  };
  const headPic = (c, sz, l) => head(c, sz / 2, sz * 0.5, sz * 0.3, l, 1.3);

  function fill(){
    tabs.innerHTML = '';
    for (const [id, name] of TABS) tabs.appendChild(onPick(button(name, 'avtab' + (tab === id ? ' on' : '')), () => { tab = id; sfx.nav?.(); fill(); }));
    opts.innerHTML = '';
    if (tab === 'skin') opts.append(...swatches('skin', 'Skin'));
    if (tab === 'hair'){ opts.appendChild(grid('hair', (c, sz, l) => headPic(c, sz, { ...l, extra: 'none' }))); opts.append(...swatches('hairColor', 'Hair colour')); }
    if (tab === 'face'){ opts.append(h('div', 'avlabel', 'Eyes'), grid('eyes', headPic), h('div', 'avlabel', 'Mouth'), grid('mouth', headPic)); }
    if (tab === 'color') opts.append(...swatches('color', 'Your colour - in every game'));
    if (tab === 'outfit') opts.appendChild(grid('outfit', (c, sz, l) => body(c, sz / 2, sz * 1.55, sz * 1.6, l, 1.3)));
    if (tab === 'extra') opts.appendChild(grid('extra', headPic));
  }
  fill();

  const close = () => { cancelAnimationFrame(raf); s.remove(); removeEventListener('keydown', esc, true); };
  const esc = (e) => { if (e.key === 'Escape'){ e.preventDefault(); sfx.back?.(); close(); } };
  addEventListener('keydown', esc, true);
  const say = h('span', 'avsay', '');
  foot.append(
    onPick(button('🎲 Surprise me', 'setbtn avbig'), () => { look = surprise(); wave = 1.2; sfx.select?.(); fill(); }),
    say,
    onPick(button('Cancel', 'setbtn avbig'), () => { sfx.back?.(); close(); }),
    onPick(button('Done', 'setbtn go avbig'), async () => {
      say.textContent = 'Saving…';
      try {
        const p = await account.call('PATCH', `/api/profiles/${encodeURIComponent(profile.id)}`, { look });
        account.set({ profiles: (account.state.profiles || []).map(x => x.id === profile.id ? { ...x, look: p.look } : x) });
        sfx.gold?.(); close(); onDone(p.look);
      } catch (e){ say.textContent = e.message || 'That didn’t save. Try again.'; }
    })
  );
  return { close };
}
