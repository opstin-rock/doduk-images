// 도둑냥 창고: 들어온 사람마다 랜덤 강아지·고양이가 되어 돌아다니며 놀고 구경하는 곳
// 광장(넓은 홀)은 노는 곳. 위쪽 빨간 문은 오늘의 타임딜 방
// 방 진열대는 1시간마다 10개씩 랜덤으로 바뀜 (같은 시간엔 모두가 같은 10개)
// 다른 손님도 실시간으로 보임 (config.js에 Supabase 설정이 있으면 인터넷 전체, 없으면 같은 브라우저 탭끼리만)
// 캐릭터(BREEDS, drawPet)는 pets.js

let VIEW_W = 720;                // 화면 가로에 보이는 폭 (월드 단위)
const SPEED = 190;                 // 걷는 속도 (월드 단위/초)
const PER_ROOM = 10;

// ---------- 장소 ----------
const PLAZA = { w: 1440, h: 1800 };
const ROOM = { w: 720, h: 1240 };
const ENTRY = { x: 720, y: 1560 };                       // 광장 입구
const EXIT = { x: 360, y: 1205 };                        // 방에서 광장으로 나가는 문
const BOOTH = { x: 430, y: 1480 };                       // 도둑냥 안내 부스
const FOUNTAIN = { x: 720, y: 900, r: 120 };
const DOOR_YS = [430, 700, 970, 1240];                   // 광장 양옆 문 높이 (왼쪽 강아지, 오른쪽 고양이)
const DEAL_DOOR = { x: 720, y: 205 };                    // 광장 위쪽: 오늘의 타임딜 방
const ROWS = [300, 480, 660, 840, 1020];
const ROOM_SHELVES = ROWS.flatMap((y) => [{ x: 190, y }, { x: 530, y }]);
const SPOT = { x: 140, y: 700, w: 440, h: 230 };              // 포토존 발자국 자리

// ---------- 화면 ----------
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let dpr = 1, scale = 1, viewH = 1240, camX = 0, camY = 0;
function resize() {
  // PC에서는 화면 가운데 폰 크기(최대 520px)로만 그림
  dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = innerHeight * dpr;
  scale = (canvas.clientWidth / VIEW_W) * dpr;
  viewH = canvas.height / scale;
}
addEventListener('resize', resize);
resize();

// ---------- 나 ----------
const myId = Math.random().toString(36).slice(2, 10);
const me = { id: myId, breed: Math.floor(Math.random() * BREEDS.length), scene: 'hall', x: ENTRY.x, y: ENTRY.y, tx: ENTRY.x, ty: ENTRY.y, acc: '' };
try { me.acc = localStorage.getItem('doduk-acc') || ''; } catch {}   // 포토존에서 고른 소품은 다음에 와도 유지   // 들어오면 입구에 서 있음
document.getElementById('me').textContent = `나: ${BREEDS[me.breed].name}`;
const isPlaza = () => me.scene === 'hall';
const size = () => (isPlaza() ? PLAZA : ROOM);

// ---------- 데이터: 타임딜 + 방 8개 ----------
let data = null;
const imgs = {};
const doduk = new Image(); doduk.src = 'img/doduk.png';
function img(url) {
  if (!url) return null;
  if (!imgs[url]) { imgs[url] = new Image(); imgs[url].src = url; }
  return imgs[url];
}
fetch('data/rooms.json').then((r) => r.json()).then((d) => { data = d; });

// 1시간 단위 시드로 섞어서 10개 고르기 → 같은 시간대엔 모두 같은 진열
function seeded(seed) {
  return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function hourPick(room) {
  const hour = Math.floor(Date.now() / 3600000);
  let h = hour; for (const ch of room.id) h = (h * 31 + ch.charCodeAt(0)) | 0;
  const rnd = seeded(h), arr = room.items.slice();
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  return arr.slice(0, PER_ROOM);
}
function sceneInfo() {
  if (isPlaza()) return { title: '도둑냥 광장', items: [], shelves: [] };
  if (!data) return { title: '', items: [], shelves: ROOM_SHELVES };
  if (me.scene === 'field') return { title: '운동장', items: [], shelves: [], field: true };
  if (me.scene === 'treasure') return { title: '보물창고', items: [], shelves: [], treasure: true };
  if (me.scene === 'photo') return { title: '포토존', items: [], shelves: [], photo: true };
  if (me.scene === 'deal') return { title: '오늘의 타임딜', items: data.hall.items.slice(0, PER_ROOM), shelves: ROOM_SHELVES, deal: true };
  const room = data.rooms.find((r) => r.id === me.scene);
  return { title: room.title, items: hourPick(room), shelves: ROOM_SHELVES, room };
}
// 광장의 문들 (방 id, 이름, 위치)
function doors() {
  const list = [{ id: 'deal', title: '오늘의 타임딜', x: DEAL_DOOR.x, y: DEAL_DOOR.y, side: 'top' }];
  // 강아지·고양이 카테고리 방 문은 2026-11-04에 뺌 (광장은 노는 곳 + 타임딜 방 + 포토존)
  list.push({ id: 'photo', title: '도둑냥 포토존', side: 'left', x: 30, y: 900 });
  list.push({ id: 'treasure', title: '도둑냥 보물창고', side: 'right', x: PLAZA.w - 30, y: 900 });
  list.push({ id: 'field', title: '도둑냥 운동장', side: 'right', x: PLAZA.w - 30, y: 480 });
  return list;
}

// ---------- 다른 손님 (실시간, 같은 장소에 있는 손님만) ----------
// Presence(접속자 목록): 누가 들어오고 나갔는지, 품종, 마지막 목표 위치 (늦게 들어온 사람용)
// Broadcast(즉시 메시지): 이동, 말풍선, 행동
const peers = new Map();   // id → { breed, x, y, tx, ty, seq, seen, goneAt, act }
function onPeer(p) {
  if (p.id === myId) return;
  if (p.scene !== me.scene) { peers.delete(p.id); return; }
  const cur = peers.get(p.id);
  if (cur) { cur.breed = p.breed; cur.acc = p.acc; cur.seen = Date.now(); cur.goneAt = 0; return; }   // 이동은 Broadcast가 맡음
  peers.set(p.id, { breed: p.breed, acc: p.acc, x: p.tx, y: p.ty, tx: p.tx, ty: p.ty, seq: 0, seen: Date.now(), goneAt: 0 });
  greetNewcomer();

}
// 운동장에 새 손님이 오면, 먼저 와 있던 사람이 공 위치와 점수를 알려줌 (막 들어온 사람은 공 상태를 모르니 안 보냄)
function greetNewcomer() {
  if (me.scene !== 'field' || Date.now() - fieldSince < 2500) return;
  const asked = Date.now();
  setTimeout(() => { if (me.scene === 'field' && lastBallMsg < asked) net.ball(ballState()); }, 200 + Math.random() * 600);
}
function onMove(m) {
  if (m.id === myId || m.scene !== me.scene) return;
  let cur = peers.get(m.id);
  if (!cur) { cur = { breed: m.breed, x: m.sx, y: m.sy, seq: 0 }; peers.set(m.id, cur); greetNewcomer(); }
  if (m.seq <= cur.seq) return;   // 늦게 도착한 예전 이동은 무시
  if (Math.hypot(cur.x - m.sx, cur.y - m.sy) > 50) { cur.x = m.sx; cur.y = m.sy; }
  Object.assign(cur, { breed: m.breed, acc: m.acc ?? cur.acc, tx: m.tx, ty: m.ty, seq: m.seq, seen: Date.now(), goneAt: 0 });
  if (cur.act && cur.act.a === 'sleep') cur.act = null;   // 움직이면 잠에서 깸
}

// ---------- 말풍선: 정해진 문구만 (번호만 주고받아서 다른 글이 끼어들 수 없음) ----------
const PHRASES = ['(울음)', '이거 싸다', '득템했다', '어디 있어?', '같이 놀자', '같이 구경하자', '안녕', '배고파', '산책 가자', '다음 방 가자', '고마워', '잘 가'];
const speech = new Map();   // id → { text, until }
function phraseText(i, breed) {
  if (i === 0) return BREEDS[breed].kind === 'cat' ? '냥' : '멍멍';
  return PHRASES[i] ?? null;
}
function who(id) { return id === myId ? me : peers.get(id) ?? npcs.get(id); }
function onSay(id, i) {
  const w = who(id);
  const text = w && Number.isInteger(i) ? phraseText(i, w.breed) : null;
  if (text) speech.set(id, { text, until: Date.now() + 4000 });
}

// ---------- 행동 ----------
const ACTIONS = [
  { a: 'bark', label: (b) => (b.kind === 'cat' ? '하악질' : '짖기'), dur: 1400 },
  { a: 'poop', label: () => '똥싸기', dur: 1800 },
  { a: 'jump', label: () => '점프', dur: 700 },
  { a: 'roll', label: () => '뒹굴기', dur: 1000 },
  { a: 'wag', label: (b) => (b.kind === 'cat' ? '꾹꾹이' : '꼬리 흔들기'), dur: 1800 },
  { a: 'heart', label: () => '하트', dur: 1800 },
  { a: 'zoom', label: () => '우다다', dur: 1500 },
  { a: 'sleep', label: () => '낮잠', dur: 20000 },
];
const poops = [];   // 바닥에 남은 똥 { x, y, scene, until }
function onAct(id, a, x, y) {
  const w = who(id);
  const def = ACTIONS.find((d) => d.a === a);
  if (!w || !def) return;
  w.act = { a, start: performance.now(), dur: def.dur };
  const b = BREEDS[w.breed];
  if (a === 'bark') speech.set(id, { text: b.kind === 'cat' ? '하악!' : b.size && b.size < 0.8 ? '앙앙!' : '왈왈!', until: Date.now() + 1500 });
  if (a === 'poop' && Number.isFinite(x)) setTimeout(() => {
    poops.push({ x, y, scene: me.scene, until: Date.now() + 40000 });
    if (poops.length > 30) poops.shift();
  }, 1200);
  if (a === 'zoom') { const ang = Math.random() * Math.PI * 2; w.zoomFrom = { x: w.x, y: w.y, ang }; }
}

// ---------- 실시간 연결 ----------
const net = (() => {
  const cfg = location.search.includes('film') ? {} : window.DODUK || {};   // 홍보 영상 촬영(?film)은 실제 손님과 섞이지 않게 혼자 모드
  let seq = 0;
  const presence = () => ({ id: me.id, breed: me.breed, acc: me.acc, scene: me.scene, tx: Math.round(me.tx), ty: Math.round(me.ty), ts: Date.now() });
  const move = () => ({ id: me.id, breed: me.breed, acc: me.acc, scene: me.scene, sx: Math.round(me.x), sy: Math.round(me.y), tx: Math.round(me.tx), ty: Math.round(me.ty), seq: ++seq });
  if (cfg.supabaseUrl && cfg.supabaseKey && window.supabase) {
    // worker: 화면이 뒤로 가도 연결 유지 신호(heartbeat)가 밀리지 않게 별도 작업자에서 보냄
    const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, { realtime: { worker: true } });
    let ch = null, status = 'CONNECTING', trackTimer = null;
    const join = (scene) => {
      const changing = ch && ch.topic !== `realtime:doduk-${scene}`;
      if (ch) { ch.untrack(); client.removeChannel(ch); }
      if (changing || !ch) peers.clear();   // 장소를 옮길 때만 비움 (같은 곳 재접속 때 깜빡이지 않게)
      status = 'CONNECTING';
      ch = client.channel(`doduk-${scene}`, { config: { presence: { key: myId }, broadcast: { self: false } } });
      ch.on('broadcast', { event: 'move' }, ({ payload }) => onMove(payload));
      ch.on('broadcast', { event: 'say' }, ({ payload }) => onSay(payload.id, payload.i));
      ch.on('broadcast', { event: 'act' }, ({ payload }) => onAct(payload.id, payload.a, payload.x, payload.y));
      ch.on('broadcast', { event: 'ball' }, ({ payload }) => onBall(payload));
      ch.on('presence', { event: 'sync' }, () => {
        const state = ch.presenceState();
        const ids = new Set(Object.keys(state));
        // 같은 손님이 재접속 중이면 정보가 2개 겹칠 수 있음 → 가장 최신 것만 사용
        for (const metas of Object.values(state)) onPeer(metas.reduce((a, b) => ((b.ts ?? 0) > (a.ts ?? 0) ? b : a)));
        // 목록에서 빠진 손님은 바로 지우지 않고 8초 기다림 (잠깐 끊겼다 붙는 경우 깜빡임 방지)
        for (const [id, q] of peers) if (!ids.has(id) && !q.goneAt) q.goneAt = Date.now();
      });
      const mine = ch;
      ch.subscribe((s) => {
        if (mine !== ch) return;   // 장소를 옮기며 닫은 예전 채널의 신호는 무시
        status = s;
        if (s === 'SUBSCRIBED') { ch.track(presence()); ch.send({ type: 'broadcast', event: 'move', payload: move() }); }
      });
    };
    join(me.scene);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && status === 'SUBSCRIBED') ch.track(presence());
    });
    const bcast = (event, payload) => ch && status === 'SUBSCRIBED' && ch.send({ type: 'broadcast', event, payload });
    return {
      mode: 'online',
      get status() { return status; },
      join,
      say(i) { bcast('say', { id: myId, i }); },
      act(a, x, y) { bcast('act', { id: myId, a, x, y }); },
      ball(s) { bcast('ball', s); },
      send() {
        if (!bcast('move', move())) return;
        clearTimeout(trackTimer);
        trackTimer = setTimeout(() => ch.track(presence()), 1500);   // 늦게 들어온 사람이 볼 위치는 천천히 갱신
      },
    };
  }
  // 테스트 모드: 같은 브라우저의 다른 탭끼리만 보임
  const bc = new BroadcastChannel('doduk-warehouse');
  bc.onmessage = ({ data: d }) => {
    if (d.bye) peers.delete(d.id);
    else if (d.type === 'say') { if (d.scene === me.scene) onSay(d.id, d.i); }
    else if (d.type === 'act') { if (d.scene === me.scene) onAct(d.id, d.a, d.x, d.y); }
    else if (d.type === 'ball') { if (d.scene === me.scene) onBall(d); }
    else if (d.type === 'move') onMove(d);
    else onPeer(d);
  };
  setInterval(() => {
    bc.postMessage(presence());
    for (const [id, q] of peers) if (Date.now() - q.seen > 6000) peers.delete(id);
  }, 2000);
  addEventListener('pagehide', () => bc.postMessage({ id: myId, bye: true }));
  return {
    mode: 'local',
    join() { peers.clear(); bc.postMessage(presence()); },
    send() { bc.postMessage({ type: 'move', ...move() }); },
    say(i) { bc.postMessage({ type: 'say', id: myId, scene: me.scene, i }); },
    act(a, x, y) { bc.postMessage({ type: 'act', id: myId, scene: me.scene, a, x, y }); },
    ball(s) { bc.postMessage({ type: 'ball', scene: me.scene, ...s }); },
  };
})();
net.send();

// ?lineup=dog|cat 로 열면 품종을 줄 세워서 보여줌 (그림 점검용)
const LINEUP = location.search.includes('lineup');
if (LINEUP) {
  const kind = new URLSearchParams(location.search).get('lineup');
  BREEDS.map((b, i) => ({ b, i })).filter(({ b }) => !kind || b.kind === kind).forEach(({ i }, n) => {
    const p = { breed: i, x: 460 + (n % 4) * 170, y: 420 + Math.floor(n / 4) * 150, seen: Infinity };
    p.tx = p.x; p.ty = p.y;
    peers.set(`line${i}`, p);
  });
  me.x = me.tx = 1300; me.y = me.ty = 1560;
}
// ?demo 로 열면 전 품종이 광장을 돌아다니는 시연 화면 (실제 접속자 아님)
if (location.search.includes('demo')) {
  BREEDS.forEach((_, i) => {
    if (i === me.breed) return;
    const p = { breed: i, x: 200 + Math.random() * 1040, y: 320 + Math.random() * 1300, seen: Infinity };
    p.tx = p.x; p.ty = p.y;
    peers.set(`demo${i}`, p);
  });
  setInterval(() => {
    for (const [id, p] of peers) {
      if (Math.random() < 0.25) { p.tx = 160 + Math.random() * 1120; p.ty = 300 + Math.random() * 1380; }
      else if (Math.random() < 0.08) onAct(id, ACTIONS[Math.floor(Math.random() * 7)].a, p.x, p.y);
    }
  }, 1500);
}

// ---------- 말풍선, 행동 버튼 ----------
const phrasesEl = document.getElementById('phrases');
const actionsEl = document.getElementById('actions');
let lastSay = 0, lastAct = 0;
PHRASES.forEach((_, i) => {
  const btn = document.createElement('button');
  btn.textContent = phraseText(i, me.breed);
  btn.onclick = () => {
    if (Date.now() - lastSay < 1500) return;   // 도배 방지
    lastSay = Date.now();
    onSay(myId, i); net.say(i); npcReact('say');
    phrasesEl.classList.remove('open');
  };
  phrasesEl.appendChild(btn);
});
ACTIONS.forEach((d) => {
  const btn = document.createElement('button');
  btn.textContent = d.label(BREEDS[me.breed]);
  btn.onclick = () => {
    if (Date.now() - lastAct < 1200) return;
    lastAct = Date.now();
    me.tx = me.x; me.ty = me.y;   // 제자리에서
    const face = me.face ?? 1;
    const px = Math.round(me.x - face * 26), py = Math.round(me.y + 4);
    onAct(myId, d.a, px, py); net.act(d.a, px, py); net.send(); npcReact(d.a);
    actionsEl.classList.remove('open');
  };
  actionsEl.appendChild(btn);
});
document.getElementById('talk').onclick = () => { phrasesEl.classList.toggle('open'); actionsEl.classList.remove('open'); };
document.getElementById('act').onclick = () => { actionsEl.classList.toggle('open'); phrasesEl.classList.remove('open'); };

// ---------- 장소 이동 ----------
function goScene(scene, spawn) {
  me.scene = scene;
  me.x = me.tx = spawn.x; me.y = me.ty = spawn.y;
  me.act = null;
  if (scene === 'field') fieldSince = Date.now();
  spawnNpcs();
  closeCard(true);
  net.join(scene);
  net.send();
}
function checkDoors() {
  if (isPlaza()) {
    for (const d of doors()) {
      const hit = d.side === 'top' ? Math.abs(me.x - d.x) < 90 && me.y < d.y + 30
        : Math.abs(me.x - d.x) < 40 && Math.abs(me.y - d.y) < 60;
      if (hit) return goScene(d.id, { x: EXIT.x, y: EXIT.y - 40 });
    }
  } else if (Math.abs(me.x - EXIT.x) < 80 && me.y > EXIT.y - 18) {
    const d = doors().find((x) => x.id === me.scene);
    if (!d) return goScene('hall', { x: ENTRY.x, y: ENTRY.y - 80 });
    goScene('hall', d.side === 'top' ? { x: d.x, y: d.y + 110 } : { x: d.side === 'left' ? 120 : PLAZA.w - 120, y: d.y + 10 });
  }
}

// ---------- 조작: 바닥을 누르면 그쪽으로 걸어감 ----------
const hint = document.getElementById('hint');
canvas.addEventListener('pointerdown', (e) => {
  const { w, h } = size();
  const wx = (e.offsetX * dpr) / scale + camX;
  const wy = (e.offsetY * dpr) / scale + camY;
  me.tx = Math.max(24, Math.min(w - 24, wx));
  me.ty = Math.max(isPlaza() ? 210 : 200, Math.min(h - 14, wy));
  if (me.act && me.act.a === 'sleep') me.act = null;
  net.send();
  hint.style.opacity = 0;
  phrasesEl.classList.remove('open'); actionsEl.classList.remove('open');
});

// ---------- 상품 카드 ----------
const sheet = document.getElementById('sheet');
let openShelf = -1, dismissed = -1;
function openCard(i, d) {
  openShelf = i;
  document.getElementById('sImg').src = d.img;
  document.getElementById('sName').textContent = d.name;
  document.getElementById('sSpec').textContent = sceneInfo().title;
  document.getElementById('sPrice').innerHTML = `${d.list ? `<s>${d.list}</s>` : ''}${d.off ? `<em>${d.off}</em>` : ''}${d.price}`;
  document.getElementById('sPer').textContent = d.expiry ? `유통기한 ${d.expiry}` : '';
  document.getElementById('sPer').style.display = d.expiry ? '' : 'none';
  document.getElementById('sMeta').textContent = d.ship;
  document.getElementById('sSay').textContent = d.say;
  document.getElementById('go').href = d.url;
  sheet.classList.add('open');
}
function closeCard(reset) { sheet.classList.remove('open'); dismissed = reset ? -1 : openShelf; openShelf = -1; }
document.getElementById('close').onclick = () => closeCard(false);
function nearShelf(shelves) {
  for (let i = 0; i < shelves.length; i++) {
    const s = shelves[i];
    if (Math.abs(me.x - s.x) < 80 && me.y > s.y + 8 && me.y < s.y + 100) return i;
  }
  return -1;
}

// ---------- 그리기 ----------
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function label(text, x, y, bg, fg, font = '19px Jua') {
  ctx.font = font; ctx.textAlign = 'center';
  const w = ctx.measureText(text).width + 22;
  rr(x - w / 2, y - 22, w, 32, 10); ctx.fillStyle = bg; ctx.fill();
  ctx.fillStyle = fg; ctx.fillText(text, x, y);
}

function drawWallAndFloor(w, h, floor, title, sub) {
  ctx.fillStyle = '#2a2622'; ctx.fillRect(-2000, -2000, w + 4000, h + 4000);
  ctx.fillStyle = floor; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(120,90,60,.12)'; ctx.lineWidth = 2;
  for (let y = 190; y < h; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  for (let x = 0; x < w; x += 60) { ctx.beginPath(); ctx.moveTo(x, 190); ctx.lineTo(x, h); ctx.stroke(); }
  ctx.fillStyle = '#B9875A'; ctx.fillRect(0, 0, w, 190);
  ctx.fillStyle = '#9C6E46'; for (let x = 0; x < w; x += 48) ctx.fillRect(x, 0, 4, 190);
  ctx.textAlign = 'center';
  const sx = w / 2, ty = isPlaza() ? 14 : 60, th = isPlaza() ? 56 : 70;
  ctx.font = isPlaza() ? '32px Jua' : '40px Jua';
  const tw = ctx.measureText(title).width + 60;
  rr(sx - tw / 2, ty, tw, th, 14); ctx.fillStyle = '#2B2622'; ctx.fill();
  ctx.fillStyle = '#FFD54A'; ctx.fillText(title, sx, ty + th * 0.7);
  if (sub) { ctx.font = '18px "Noto Sans KR"'; ctx.fillStyle = '#fff'; ctx.fillText(sub, sx, 160); }
}

function drawPlaza(t) {
  const { w, h } = PLAZA;
  drawWallAndFloor(w, h, '#E9DCC4', '도둑냥 광장', '');
  // 잔디밭
  ctx.fillStyle = '#B9D99A';
  for (const [x, y, rx, ry] of [[300, 620, 170, 90], [1140, 620, 170, 90], [300, 1350, 180, 95], [1140, 1350, 180, 95]]) {
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#94BE73'; ctx.lineWidth = 3; ctx.stroke();
  }
  // 분수
  const f = FOUNTAIN;
  ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.beginPath(); ctx.ellipse(f.x, f.y + 18, f.r + 10, f.r * 0.55, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#CFC3B0'; ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r, f.r * 0.55, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#2a2420'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#8FC9E8'; ctx.beginPath(); ctx.ellipse(f.x, f.y - 4, f.r - 18, f.r * 0.42, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) { const k = ((t * 0.5 + i / 3) % 1); ctx.beginPath(); ctx.ellipse(f.x, f.y - 4, 20 + k * 70, (20 + k * 70) * 0.42, 0, 0, Math.PI * 2); ctx.globalAlpha = 1 - k; ctx.stroke(); }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#CFC3B0'; rr(f.x - 14, f.y - 70, 28, 66, 8); ctx.fill(); ctx.strokeStyle = '#2a2420'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#8FC9E8';
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + t; ctx.beginPath(); ctx.arc(f.x + Math.cos(a) * 26, f.y - 76 + Math.sin(t * 4 + i) * 6, 4, 0, Math.PI * 2); ctx.fill(); }
  // 벤치
  for (const [x, y] of [[470, 1150], [970, 1150], [470, 560], [970, 560]]) {
    rr(x - 70, y - 14, 140, 22, 6); ctx.fillStyle = '#B07A4A'; ctx.fill(); ctx.strokeStyle = '#2a2420'; ctx.lineWidth = 2.5; ctx.stroke();
    rr(x - 70, y - 40, 140, 16, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#6B4A30'; ctx.fillRect(x - 60, y + 8, 8, 18); ctx.fillRect(x + 52, y + 8, 8, 18);
  }
  // 위쪽 문: 오늘의 타임딜
  const d = DEAL_DOOR;
  rr(d.x - 105, 92, 210, 112, 12); ctx.fillStyle = '#E8402F'; ctx.fill(); ctx.strokeStyle = '#2a2420'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#FFD54A'; ctx.font = '26px Jua'; ctx.textAlign = 'center'; ctx.fillText('오늘의 타임딜', d.x, 140);
  ctx.fillStyle = '#fff'; ctx.font = '17px Jua'; ctx.fillText('▲ 들어가기', d.x, 182);
  // 양옆 문
  for (const dr of doors()) {
    if (dr.side === 'top') continue;
    const left = dr.side === 'left';
    rr(left ? 0 : PLAZA.w - 30, dr.y - 60, 30, 120, 6); ctx.fillStyle = left ? '#7B9E6B' : '#C57B88'; ctx.fill();
    const [a, b] = dr.title.split(' ');
    const bw = 96, bx = left ? 38 : PLAZA.w - 38 - bw;
    rr(bx, dr.y - 34, bw, 64, 10); ctx.fillStyle = 'rgba(255,255,255,.94)'; ctx.fill();
    ctx.fillStyle = '#1f1f22'; ctx.font = '21px Jua'; ctx.textAlign = 'center';
    ctx.fillText(a, bx + bw / 2, dr.y - 8); ctx.fillText(b, bx + bw / 2, dr.y + 20);
  }
  label('입구', ENTRY.x, h - 60, '#C0563E', '#fff', '20px Jua');
}

function drawRoom(info) {
  const kindFloor = info.deal ? '#F3E3C2' : info.room?.kind === 'dog' ? '#E6E1CC' : '#EADCD6';
  drawWallAndFloor(ROOM.w, ROOM.h, kindFloor, info.title, info.deal ? '오늘만 이 가격' : '1시간마다 진열이 바뀌어');
  rr(EXIT.x - 85, ROOM.h - 46, 170, 36, 10); ctx.fillStyle = '#2B2622'; ctx.fill();
  ctx.fillStyle = '#FFD54A'; ctx.font = '19px Jua'; ctx.textAlign = 'center'; ctx.fillText('광장으로 나가기', EXIT.x, ROOM.h - 21);
}

function drawShelf(s, d) {
  const half = 120, box = 108;
  ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.beginPath(); ctx.ellipse(s.x, s.y + 62, half + 6, 15, 0, 0, Math.PI * 2); ctx.fill();
  rr(s.x - half, s.y - 10, half * 2, 70, 8); ctx.fillStyle = '#A8754A'; ctx.fill();
  rr(s.x - half, s.y - 10, half * 2, 16, 8); ctx.fillStyle = '#C48F5E'; ctx.fill();
  ctx.fillStyle = '#8A5C37'; ctx.fillRect(s.x - half + 5, s.y + 26, half * 2 - 10, 4);
  rr(s.x - box / 2, s.y - box - 8, box, box, 12); ctx.fillStyle = '#fff'; ctx.fill();
  const im = d && img(d.img);
  if (im && im.complete && im.naturalWidth) {
    const k = Math.min((box - 8) / im.naturalWidth, (box - 8) / im.naturalHeight);
    ctx.drawImage(im, s.x - (im.naturalWidth * k) / 2, s.y - 8 - box / 2 - (im.naturalHeight * k) / 2, im.naturalWidth * k, im.naturalHeight * k);
  }
  if (d) {
    ctx.font = '21px Jua';
    const w = ctx.measureText(d.price).width + 20;
    rr(s.x - w / 2, s.y + 30, w, 29, 8); ctx.fillStyle = '#FFD54A'; ctx.fill();
    ctx.fillStyle = '#1f1f22'; ctx.textAlign = 'center'; ctx.fillText(d.price, s.x, s.y + 52);
    if (d.off) {
      ctx.font = '17px Jua'; const ow = ctx.measureText(d.off).width + 14;
      rr(s.x + box / 2 - ow + 6, s.y - box - 18, ow, 24, 12); ctx.fillStyle = '#E8402F'; ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillText(d.off, s.x + box / 2 - ow / 2 + 6, s.y - box);
    }
  }
}

function drawBooth(t) {
  const c = BOOTH;
  rr(c.x - 80, c.y - 28, 160, 52, 10); ctx.fillStyle = '#6B4A30'; ctx.fill();
  rr(c.x - 80, c.y - 28, 160, 14, 10); ctx.fillStyle = '#8A6343'; ctx.fill();
  if (!bot.home || (bot.say && Date.now() < bot.say.until)) return;   // 도둑냥이 청소하러 나가면 부스는 비어 있음
  const lines = ['어서 와, 여긴 놀고 가는 광장이야', '위쪽 빨간 문은 오늘의 타임딜', '행동 버튼 눌러봐, 똥도 쌀 수 있어', '똥 싸면 내가 치울게', '왼쪽 문은 포토존, 소품 쓰고 네컷 찍어 가', '오른쪽 문은 보물창고, 내가 숨겨둔 거 찾아봐', '오른쪽 위 문은 운동장, 공 차러 가자', '오른쪽 아래 천막은 점집, 오늘의 카드 뽑아 봐', '구경은 공짜, 살 때만 로그인'];
  const msg = lines[Math.floor(t / 4) % lines.length];
  ctx.font = '18px Jua'; const w = ctx.measureText(msg).width + 24;
  const bx = c.x + 30, by = c.y - 172;
  rr(bx, by, w, 38, 14); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#1f1f22'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#1f1f22'; ctx.textAlign = 'left'; ctx.fillText(msg, bx + 12, by + 26);
}

function drawPoop(p, t) {
  const left = p.until - Date.now();
  ctx.globalAlpha = Math.min(1, left / 3000);
  ctx.fillStyle = '#7A4E2A'; ctx.strokeStyle = '#3B2414'; ctx.lineWidth = 2;
  for (const [dy, r] of [[0, 11], [-9, 8], [-16, 5]]) { ctx.beginPath(); ctx.ellipse(p.x, p.y + dy, r, r * 0.65, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(80,80,80,.6)'; ctx.lineWidth = 1.5;
  for (let i = 0; i < 2; i++) { const a = t * 6 + i * 3; ctx.beginPath(); ctx.arc(p.x + Math.cos(a) * 16, p.y - 26 + Math.sin(a * 1.3) * 6, 1.8, 0, Math.PI * 2); ctx.stroke(); }
  ctx.globalAlpha = 1;
}

// 행동에 맞춰 캐릭터를 변형해서 그림
function drawActor(p, t, mine) {
  const act = p.act;
  const k = act ? (performance.now() - act.start) / act.dur : 1;
  if (act && k >= 1 && act.a !== 'sleep') p.act = null;
  const a = p.act ? p.act.a : null;
  ctx.save();
  let q = p;
  if (a === 'jump') q = { ...p, y: p.y - Math.sin(Math.min(1, k) * Math.PI) * 70 };
  if (a === 'bark') ctx.translate(Math.sin(t * 60) * 2.5, 0);
  if (a === 'poop') { ctx.translate(p.x, p.y); ctx.scale(1.08, k < 0.7 ? 0.82 : 1); ctx.translate(-p.x, -p.y); }
  if (a === 'roll') { ctx.translate(p.x, p.y - 30); ctx.rotate(Math.min(1, k) * Math.PI * 2 * (p.face ?? 1)); ctx.translate(-p.x, -(p.y - 30)); }
  if (a === 'sleep') { ctx.translate(p.x, p.y); ctx.scale(1, 0.8); ctx.translate(-p.x, -p.y); }
  if (a === 'wag') ctx.translate(0, Math.abs(Math.sin(t * 16)) * -3);
  const top = drawPet(ctx, q, t, mine);
  ctx.restore();
  // 효과
  if (a === 'heart') {
    for (let i = 0; i < 3; i++) {
      const kk = (k + i * 0.25) % 1, x = p.x + Math.sin(kk * 6 + i) * 16, y = top - 10 - kk * 70;
      ctx.globalAlpha = 1 - kk; ctx.fillStyle = '#F06A86';
      ctx.beginPath(); ctx.moveTo(x, y + 6); ctx.bezierCurveTo(x - 12, y - 4, x - 6, y - 14, x, y - 6); ctx.bezierCurveTo(x + 6, y - 14, x + 12, y - 4, x, y + 6); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  if (a === 'sleep') {
    ctx.font = '22px Jua'; ctx.fillStyle = '#5A6E9A'; ctx.textAlign = 'center';
    for (let i = 0; i < 3; i++) { const kk = ((t * 0.5) + i / 3) % 1; ctx.globalAlpha = 1 - kk; ctx.fillText('z', p.x + 20 + kk * 24, top + 20 - kk * 50); }
    ctx.globalAlpha = 1;
  }
  if (a === 'zoom') {
    ctx.strokeStyle = 'rgba(42,36,32,.5)'; ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(p.x - 40 - i * 6, p.y - 20 - i * 12); ctx.lineTo(p.x - 70 - i * 6, p.y - 20 - i * 12); ctx.stroke(); }
  }
  if (a === 'bark') {
    ctx.strokeStyle = '#2a2420'; ctx.lineWidth = 3;
    const fx = p.x + 40 * (p.face ?? 1);
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(fx, top + 40 + i * 12 - 12); ctx.lineTo(fx + 14 * (p.face ?? 1), top + 34 + i * 16 - 16); ctx.stroke(); }
  }
  return top;
}

// ---------- 운동장: 공 하나를 모두가 같이 참 ----------
// 공을 찬 사람이 공의 위치·속도·점수를 보내고, 받은 사람은 그 상태에서 똑같이 굴림
// 위 골대에 넣으면 멍팀 점수, 아래 골대에 넣으면 냥팀 점수 (팀 구분 없이 아무나 차도 됨)
const FIELD = { l: 40, r: 680, t: 250, b: 1100 };
const GOAL = { l: 265, r: 455, depth: 40 };
const BALL_R = 17;
const ball = { x: 360, y: 675, vx: 0, vy: 0, spin: 0, dog: 0, cat: 0 };
let lastBallMsg = 0, lastKick = 0, goalShow = null, fieldSince = 0;
const ballState = () => ({ x: Math.round(ball.x), y: Math.round(ball.y), vx: Math.round(ball.vx), vy: Math.round(ball.vy), dog: ball.dog, cat: ball.cat });
function onBall(s) {
  lastBallMsg = Date.now();
  if (!Number.isFinite(s.x) || !Number.isFinite(s.y)) return;
  Object.assign(ball, { x: s.x, y: s.y, vx: s.vx || 0, vy: s.vy || 0, dog: s.dog | 0, cat: s.cat | 0 });
}
function resetBall() { ball.x = 360; ball.y = 675; ball.vx = 0; ball.vy = 0; }
function stepBall(dt) {
  const f = Math.exp(-1.1 * dt);
  ball.vx *= f; ball.vy *= f;
  if (Math.hypot(ball.vx, ball.vy) < 6) { ball.vx = 0; ball.vy = 0; }
  ball.x += ball.vx * dt; ball.y += ball.vy * dt;
  ball.spin += Math.hypot(ball.vx, ball.vy) * dt / BALL_R;
  const inMouth = ball.x > GOAL.l + BALL_R && ball.x < GOAL.r - BALL_R;
  if (ball.x < FIELD.l + BALL_R) { ball.x = FIELD.l + BALL_R; ball.vx = Math.abs(ball.vx) * 0.8; }
  if (ball.x > FIELD.r - BALL_R) { ball.x = FIELD.r - BALL_R; ball.vx = -Math.abs(ball.vx) * 0.8; }
  if (ball.y < FIELD.t + BALL_R && !inMouth) { ball.y = FIELD.t + BALL_R; ball.vy = Math.abs(ball.vy) * 0.8; }
  if (ball.y > FIELD.b - BALL_R && !inMouth) { ball.y = FIELD.b - BALL_R; ball.vy = -Math.abs(ball.vy) * 0.8; }
  if (ball.y < FIELD.t - 10) { ball.dog++; goal('멍팀'); }
  else if (ball.y > FIELD.b + 10) { ball.cat++; goal('냥팀'); }
}
function goal(team) {
  goalShow = { team, until: Date.now() + 1800 };
  resetBall();
  if (ball.dog > 99 || ball.cat > 99) { ball.dog = 0; ball.cat = 0; }
}
function kickCheck() {
  const d = Math.hypot(ball.x - me.x, ball.y - me.y);
  if (d > BALL_R + 24 || performance.now() - lastKick < 300) return;
  lastKick = performance.now();
  const moving = Math.hypot(me.tx - me.x, me.ty - me.y) > 2;
  let nx = (ball.x - me.x) / (d || 1), ny = (ball.y - me.y) / (d || 1);
  if (d < 1) { nx = me.face ?? 1; ny = 0; }
  const power = moving ? 560 : 260;
  ball.vx = nx * power; ball.vy = ny * power;
  ball.x = me.x + nx * (BALL_R + 25); ball.y = me.y + ny * (BALL_R + 25);
  net.ball(ballState());
}
function drawField() {
  drawWallAndFloor(ROOM.w, ROOM.h, '#7DB35A', '운동장', '공에 부딪히면 차져 · 위 골대는 멍팀 점수, 아래 골대는 냥팀 점수');
  // 잔디 줄무늬
  for (let i = 0; i < 9; i++) if (i % 2) { ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fillRect(FIELD.l, FIELD.t + i * ((FIELD.b - FIELD.t) / 9), FIELD.r - FIELD.l, (FIELD.b - FIELD.t) / 9); }
  ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 5;
  ctx.strokeRect(FIELD.l, FIELD.t, FIELD.r - FIELD.l, FIELD.b - FIELD.t);
  ctx.beginPath(); ctx.moveTo(FIELD.l, 675); ctx.lineTo(FIELD.r, 675); ctx.stroke();
  ctx.beginPath(); ctx.arc(360, 675, 90, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeRect(GOAL.l - 50, FIELD.t, GOAL.r - GOAL.l + 100, 110);
  ctx.strokeRect(GOAL.l - 50, FIELD.b - 110, GOAL.r - GOAL.l + 100, 110);
  // 골대 (그물)
  for (const [y0, dir, team] of [[FIELD.t, -1, '멍팀 골'], [FIELD.b, 1, '냥팀 골']]) {
    const y1 = y0 + dir * GOAL.depth;
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(GOAL.l, Math.min(y0, y1), GOAL.r - GOAL.l, GOAL.depth);
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.5;
    for (let x = GOAL.l; x <= GOAL.r; x += 14) { ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke(); }
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(GOAL.l, y0); ctx.lineTo(GOAL.l, y1); ctx.lineTo(GOAL.r, y1); ctx.lineTo(GOAL.r, y0); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = '18px Jua'; ctx.textAlign = 'center'; ctx.fillText(team, 360, y0 + dir * -22 + (dir < 0 ? 6 : 0));
  }
  // 점수판
  rr(560, 40, 140, 96, 12); ctx.fillStyle = '#2B2622'; ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = '18px Jua'; ctx.textAlign = 'center'; ctx.fillText('멍팀', 600, 70); ctx.fillText('냥팀', 660, 70);
  ctx.fillStyle = '#FFD54A'; ctx.font = '38px Jua'; ctx.fillText(String(ball.dog), 600, 118); ctx.fillText(String(ball.cat), 660, 118);
  rr(EXIT.x - 85, ROOM.h - 46, 170, 36, 10); ctx.fillStyle = '#2B2622'; ctx.fill();
  ctx.fillStyle = '#FFD54A'; ctx.font = '19px Jua'; ctx.textAlign = 'center'; ctx.fillText('광장으로 나가기', EXIT.x, ROOM.h - 21);
}
function drawBall() {
  ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(ball.x, ball.y + 2, BALL_R, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.translate(ball.x, ball.y - BALL_R + 2);
  ctx.beginPath(); ctx.arc(0, 0, BALL_R, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
  ctx.save(); ctx.clip(); ctx.rotate(ball.spin);
  ctx.fillStyle = '#2a2420';
  for (const [x, y] of [[0, 0], [14, -10], [-14, -10], [12, 13], [-12, 13]]) { ctx.beginPath(); ctx.arc(x, y, 5.5, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
  ctx.beginPath(); ctx.arc(0, 0, BALL_R, 0, Math.PI * 2); ctx.strokeStyle = '#2a2420'; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.restore();
}
function drawGoalBanner() {
  if (!goalShow || Date.now() > goalShow.until) return;
  const k = 1 - (goalShow.until - Date.now()) / 1800, s = 1 + Math.sin(Math.min(1, k * 4) * Math.PI) * 0.15;
  ctx.save(); ctx.translate(camX + VIEW_W / 2, camY + viewH * 0.4); ctx.scale(s, s);
  ctx.font = '88px Jua'; ctx.textAlign = 'center'; ctx.lineWidth = 10; ctx.strokeStyle = '#2a2420';
  ctx.strokeText('골!', 0, 0); ctx.fillStyle = '#FFD54A'; ctx.fillText('골!', 0, 0);
  ctx.font = '36px Jua'; ctx.lineWidth = 7; ctx.strokeText(`${goalShow.team} 득점`, 0, 56); ctx.fillStyle = '#fff'; ctx.fillText(`${goalShow.team} 득점`, 0, 56);
  ctx.restore();
}

// ---------- 보물창고: 상자 12개 중 3개에 도둑냥이 오늘의 타임딜을 숨겨둠 ----------
// 하루(한국 시간) 단위로 숨긴 자리가 바뀌고, 모두에게 같은 자리. 연 상자는 이 브라우저에 오늘 하루 기억
const BOXES = [360, 540, 720, 900].flatMap((y, r) => [150, 360, 570].map((x, j) => ({ x: x + [[-10, 20, 5], [15, -15, 0], [0, 10, -20], [-15, 5, 15]][r][j], y: y + (j === 1 ? 25 : 0) })));
const HIDDEN = 3;
const GAGS = ['꽝, 먼지만 있어', '양말 한 짝', '털뭉치', '빈 간식 봉지', '도둑냥 낮잠 자리였어', '뽁뽁이', '꽝, 다음 상자', '고무줄 하나', '털 엄청 묻었어', '여긴 비었어'];
const dayKey = () => Math.floor((Date.now() + 9 * 3600000) / 86400000);
function treasureMap() {
  const day = dayKey();
  const rnd = seeded(day * 7919);
  const order = BOXES.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  const pool = (data?.hall.items || []).slice();
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const map = {};
  order.slice(0, Math.min(HIDDEN, pool.length)).forEach((bi, n) => { map[bi] = pool[n]; });
  return { day, map, gag: (i) => GAGS[(i * 7 + day) % GAGS.length] };
}
const openedKey = () => `doduk-boxes-${dayKey()}`;
let opened = new Set(), openedDay = 0;
function loadOpened() {
  openedDay = dayKey();
  try { opened = new Set(JSON.parse(localStorage.getItem(openedKey()) || '[]')); } catch { opened = new Set(); }
}
function saveOpened() { try { localStorage.setItem(openedKey(), JSON.stringify([...opened])); } catch {} }
loadOpened();
const boxAnim = {};
let treasureBox = -1;
function foundCount() { const { map } = treasureMap(); return [...opened].filter((i) => map[i]).length; }
function openBox(i) {
  const { map, gag } = treasureMap();
  opened.add(i); saveOpened(); boxAnim[i] = performance.now();
  const item = map[i];
  if (!item) { speech.set('box' + i, { text: gag(i), until: Date.now() + 2500 }); return; }
  const n = foundCount();
  speech.set(myId, { text: n >= Object.keys(map).length ? '다 찾았다' : '찾았다', until: Date.now() + 2500 });
  treasureBox = i;
  setTimeout(() => {
    if (me.scene !== 'treasure' || treasureBox !== i) return;
    openCard(-2, item);
    document.getElementById('sSpec').textContent = `도둑냥 보물창고에서 찾음 · 오늘 ${n}/${Object.keys(map).length}`;
  }, 700);
}
function drawBox(b, i, t, now) {
  const { map } = treasureMap();
  const isOpen = opened.has(i), item = isOpen && map[i];
  const k = isOpen ? Math.min(1, (now - (boxAnim[i] ?? -1e9)) / 300) : 0;
  ctx.fillStyle = 'rgba(0,0,0,.14)'; ctx.beginPath(); ctx.ellipse(b.x, b.y + 2, 56, 12, 0, 0, Math.PI * 2); ctx.fill();
  if (item) {   // 보물: 금빛 + 물건이 튀어나옴
    const glow = 0.35 + Math.sin(t * 4) * 0.15;
    ctx.fillStyle = `rgba(255,213,74,${glow})`; ctx.beginPath(); ctx.arc(b.x, b.y - 70 - 60 * k, 70, 0, Math.PI * 2); ctx.fill();
    const im = img(item.img), s = 64, rise = 100 * k;
    if (im && im.complete && im.naturalWidth) {
      rr(b.x - s / 2 - 4, b.y - 76 - s - rise + 30, s + 8, s + 8, 10); ctx.fillStyle = '#fff'; ctx.fill();
      const q = Math.min(s / im.naturalWidth, s / im.naturalHeight);
      ctx.drawImage(im, b.x - (im.naturalWidth * q) / 2, b.y - 72 - rise + 30 - s / 2 - (im.naturalHeight * q) / 2, im.naturalWidth * q, im.naturalHeight * q);
    }
  }
  rr(b.x - 48, b.y - 70, 96, 70, 6); ctx.fillStyle = '#C9965F'; ctx.fill(); ctx.strokeStyle = '#2a2420'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#E3C48F'; ctx.fillRect(b.x - 8, b.y - 69, 16, 68);
  if (isOpen) {
    rr(b.x - 44, b.y - 76, 88, 12, 4); ctx.fillStyle = '#5a3d22'; ctx.fill();
    for (const side of [-1, 1]) {   // 뚜껑 날개가 바깥으로 젖혀짐
      ctx.save(); ctx.translate(b.x + side * 48, b.y - 70); ctx.rotate(side * (0.2 + k * 0.9));
      rr(side > 0 ? 0 : -40, -12, 40, 14, 4); ctx.fillStyle = '#B88550'; ctx.fill(); ctx.stroke(); ctx.restore();
    }
  } else {
    rr(b.x - 52, b.y - 82, 104, 16, 5); ctx.fillStyle = '#B88550'; ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#7a5230'; ctx.font = '30px Jua'; ctx.textAlign = 'center'; ctx.fillText('?', b.x, b.y - 24 + Math.sin(t * 3 + i) * 2);
  }
}
function drawTreasureRoom() {
  const total = Object.keys(treasureMap().map).length;
  drawWallAndFloor(ROOM.w, ROOM.h, '#E6DCCB', '보물창고', `오늘 숨긴 보물 ${total}개 · 찾은 것 ${foundCount()}개 · 상자 앞에 서면 열려`);
  rr(EXIT.x - 85, ROOM.h - 46, 170, 36, 10); ctx.fillStyle = '#2B2622'; ctx.fill();
  ctx.fillStyle = '#FFD54A'; ctx.font = '19px Jua'; ctx.textAlign = 'center'; ctx.fillText('광장으로 나가기', EXIT.x, ROOM.h - 21);
}

// ---------- 포토존 ----------
const inSpot = (p) => p.x > SPOT.x && p.x < SPOT.x + SPOT.w && p.y > SPOT.y && p.y < SPOT.y + SPOT.h;
let flashUntil = 0;
function bunting(g, x0, x1, y, size) {
  const cols = ['#E8402F', '#FFD54A', '#7B9E6B', '#8FC9E8', '#C57B88'];
  g.strokeStyle = '#2a2420'; g.lineWidth = size / 10;
  g.beginPath(); g.moveTo(x0, y); g.quadraticCurveTo((x0 + x1) / 2, y + size * 0.6, x1, y); g.stroke();
  const n = Math.floor((x1 - x0) / (size * 1.3));
  for (let i = 0; i < n; i++) {
    const x = x0 + (i + 0.5) * ((x1 - x0) / n), k = (x - x0) / (x1 - x0), yy = y + Math.sin(k * Math.PI) * size * 0.3;
    g.beginPath(); g.moveTo(x - size / 2, yy); g.lineTo(x + size / 2, yy); g.lineTo(x, yy + size); g.closePath();
    g.fillStyle = cols[i % cols.length]; g.fill(); g.stroke();
  }
}
function paw(g, x, y, r, col) {
  g.fillStyle = col;
  g.beginPath(); g.ellipse(x, y, r, r * 0.8, 0, 0, Math.PI * 2); g.fill();
  for (const [dx, dy] of [[-0.9, -1.1], [-0.3, -1.5], [0.3, -1.5], [0.9, -1.1]]) { g.beginPath(); g.arc(x + dx * r, y + dy * r, r * 0.32, 0, Math.PI * 2); g.fill(); }
}
function drawPhotoRoom(t) {
  drawWallAndFloor(ROOM.w, ROOM.h, '#EFE4D4', '포토존', '발자국 위에 서서 소품 고르고 네컷 찍어봐');
  rr(50, 220, 620, 440, 26); ctx.fillStyle = '#F3E3C2'; ctx.fill(); ctx.strokeStyle = '#2a2420'; ctx.lineWidth = 4; ctx.stroke();
  bunting(ctx, 70, 650, 240, 34);
  ctx.textAlign = 'center'; ctx.fillStyle = '#2B2622'; ctx.font = '58px Jua'; ctx.fillText('도둑냥 광장', 360, 410);
  ctx.fillStyle = '#E8402F'; ctx.font = '30px Jua'; ctx.fillText('@doduk_nyang', 360, 460);
  if (doduk.complete && doduk.naturalWidth) { const h = 130, w = (doduk.naturalWidth / doduk.naturalHeight) * h; ctx.drawImage(doduk, 600 - w / 2, 650 - h, w, h); }
  // 발자국 자리
  rr(SPOT.x, SPOT.y, SPOT.w, SPOT.h, 30); ctx.fillStyle = 'rgba(255,213,74,.35)'; ctx.fill();
  ctx.setLineDash([14, 10]); ctx.strokeStyle = '#C9A227'; ctx.lineWidth = 4; ctx.stroke(); ctx.setLineDash([]);
  for (let i = 0; i < 6; i++) paw(ctx, SPOT.x + 50 + i * 68, SPOT.y + (i % 2 ? 150 : 110), 13, 'rgba(160,120,40,.35)');
  // 삼각대 카메라
  const cx = 360, cy = 1060;
  ctx.strokeStyle = '#2a2420'; ctx.lineWidth = 6;
  for (const dx of [-50, 0, 50]) { ctx.beginPath(); ctx.moveTo(cx, cy - 40); ctx.lineTo(cx + dx, cy + 60); ctx.stroke(); }
  rr(cx - 55, cy - 100, 110, 70, 12); ctx.fillStyle = '#3A3530'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#8FC9E8'; ctx.beginPath(); ctx.arc(cx, cy - 65, 22, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = performance.now() < flashUntil || Math.sin(t * 4) > 0.6 ? '#E8402F' : '#6b2a22';
  ctx.beginPath(); ctx.arc(cx + 38, cy - 90, 5, 0, Math.PI * 2); ctx.fill();
  rr(EXIT.x - 85, ROOM.h - 46, 170, 36, 10); ctx.fillStyle = '#2B2622'; ctx.fill();
  ctx.fillStyle = '#FFD54A'; ctx.font = '19px Jua'; ctx.textAlign = 'center'; ctx.fillText('광장으로 나가기', EXIT.x, ROOM.h - 21);
}

// ---------- 스티커사진 부스: 소품·배경·컷 고르고 찍기 ----------
// 4컷은 3·2·1 세고 4번 찍음. 찍는 사이에 자리 바꾸거나 행동 버튼 누르면 그대로 사진에 남음
const THEMES = [
  { id: 'cream', name: '크림', bg: '#FBF6EC', frame: '#F3E3C2', floor: '#E9DCC4', band: '#2B2622', accent: '#FFD54A', ink: '#1f1f22', sub: '#8a8a8a' },
  { id: 'pink', name: '핑크', bg: '#FFE8EE', frame: '#FFD3DE', floor: '#F9BCCB', band: '#C2456A', accent: '#FFF2B3', ink: '#5a1f33', sub: '#a0607a' },
  { id: 'sky', name: '하늘', bg: '#E6F4FF', frame: '#CDE8FB', floor: '#AED5F2', band: '#2F5F8A', accent: '#FFD54A', ink: '#1d3a57', sub: '#5f7f9c' },
  { id: 'mint', name: '민트', bg: '#E7F7EF', frame: '#CDEFDD', floor: '#A9DDC2', band: '#2E6B52', accent: '#FFE07A', ink: '#1f4a39', sub: '#5f8a77' },
  { id: 'night', name: '밤', bg: '#1E2233', frame: '#2C3350', floor: '#3A4366', band: '#0F1220', accent: '#FFD54A', ink: '#ffffff', sub: '#aab2cc' },
];
const booth = { theme: 'cream', cuts: 4, busy: false };
try { booth.theme = localStorage.getItem('doduk-theme') || 'cream'; } catch {}
let countdown = null;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 찍는 순간 발자국 자리에 있던 손님들 모습 (최대 6마리, 나는 자리를 벗어나도 포함)
function capture() {
  const now = performance.now();
  return [me, ...[...peers.values()].filter(inSpot)].slice(0, 6).map((p) => ({
    breed: p.breed, x: p.x, y: p.y, face: p.face ?? 1, acc: p.acc || '', mine: p === me,
    a: p.act ? p.act.a : null, k: p.act ? Math.min(1, (now - p.act.start) / p.act.dur) : 0,
  })).sort((a, b) => a.y - b.y);
}
function heart(g, x, y, s, col) {
  g.fillStyle = col; g.beginPath(); g.moveTo(x, y + s);
  g.bezierCurveTo(x - s * 2, y - s * 0.6, x - s, y - s * 2.2, x, y - s * 1);
  g.bezierCurveTo(x + s, y - s * 2.2, x + s * 2, y - s * 0.6, x, y + s); g.fill();
}
function drawSnapPet(g, p, x, y, k) {
  g.save(); g.translate(x, y); g.scale(k, k);
  const dy = p.a === 'jump' ? -Math.sin(p.k * Math.PI) * 55 : 0;
  if (p.a === 'roll') { g.translate(0, -30); g.rotate(p.k * Math.PI * 2 * p.face); g.translate(0, 30); }
  if (p.a === 'sleep' || p.a === 'poop') g.scale(1, 0.82);
  const top = drawPet(g, { breed: p.breed, x: 0, y: dy, tx: 0, ty: dy, face: p.face, acc: p.acc, noTag: true }, 0.4, false);
  g.restore();
  const hy = y + top * k;
  if (p.a === 'heart') for (let i = 0; i < 3; i++) heart(g, x + (i - 1) * 16 * k, hy - 8 * k - (i % 2) * 10 * k, 4 * k, '#F06A86');
  if (p.a === 'sleep' || p.a === 'bark') {
    g.font = `${Math.round(16 * k)}px Jua`; g.textAlign = 'center'; g.lineWidth = 4; g.strokeStyle = '#fff';
    const txt = p.a === 'sleep' ? 'z z' : BREEDS[p.breed].kind === 'cat' ? '하악!' : '왈!';
    g.strokeText(txt, x + 22 * k, hy); g.fillStyle = p.a === 'sleep' ? '#5A6E9A' : '#E8402F'; g.fillText(txt, x + 22 * k, hy);
  }
}
// 스티커: 사진 테두리 쪽에 별·하트·반짝이·발바닥·도장을 흩뿌림
function stickers(g, spots, seed) {
  const rnd = seeded(seed);
  const cols = ['#FFD54A', '#F06A86', '#8FC9E8', '#7B9E6B', '#fff'];
  for (const [x, y] of spots) {
    const type = Math.floor(rnd() * 5), s = 18 + rnd() * 14, col = cols[Math.floor(rnd() * cols.length)];
    g.save(); g.translate(x, y); g.rotate((rnd() - 0.5) * 0.8);
    g.lineWidth = 5; g.strokeStyle = '#fff'; g.lineJoin = 'round';
    if (type === 0) {   // 별
      g.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? s * 0.45 : s, a = (i / 10) * Math.PI * 2 - Math.PI / 2; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      g.closePath(); g.stroke(); g.fillStyle = col === '#fff' ? '#FFD54A' : col; g.fill();
    } else if (type === 1) { heart(g, 0, 0, s * 0.55, '#fff'); heart(g, 0, 0, s * 0.42, '#F06A86'); }
    else if (type === 2) {   // 반짝이
      g.fillStyle = col === '#fff' ? '#FFD54A' : col;
      g.beginPath(); g.moveTo(0, -s); g.quadraticCurveTo(0, 0, s, 0); g.quadraticCurveTo(0, 0, 0, s); g.quadraticCurveTo(0, 0, -s, 0); g.quadraticCurveTo(0, 0, 0, -s); g.fill();
    } else if (type === 3) { paw(g, 0, 4, s * 0.45, '#fff'); paw(g, 0, 4, s * 0.36, '#C57B88'); }
    else {   // 도둑냥 도장
      g.beginPath(); g.arc(0, 0, s * 1.1, 0, Math.PI * 2); g.fillStyle = '#E8402F'; g.fill(); g.stroke();
      g.fillStyle = '#fff'; g.font = `${Math.round(s * 0.62)}px Jua`; g.textAlign = 'center'; g.fillText('도둑냥', 0, s * 0.22);
    }
    g.restore();
  }
}
function cardBase(g, CW, CH, T, title) {
  g.fillStyle = T.bg; g.fillRect(0, 0, CW, CH);
  for (let y = 160; y < CH; y += 70) for (let x = (y / 70) % 2 ? 35 : 0; x < CW; x += 70) paw(g, x, y, 8, T.id === 'night' ? 'rgba(255,255,255,.06)' : 'rgba(120,90,60,.08)');
  g.fillStyle = T.band; g.fillRect(0, 0, CW, 130);
  g.textAlign = 'center'; g.fillStyle = T.accent; g.font = '60px Jua'; g.fillText(title, CW / 2, 88);
}
function cardFooter(g, CW, CH, T, line) {
  g.fillStyle = T.band; g.fillRect(0, CH - 150, CW, 150);
  g.textAlign = 'left'; g.fillStyle = T.accent; g.font = '54px Jua'; g.fillText('@doduk_nyang', 56, CH - 78);
  g.fillStyle = '#fff'; g.font = '28px "Noto Sans KR"'; g.fillText(line, 56, CH - 36);
  if (doduk.complete && doduk.naturalWidth) { const h = 210, w = (doduk.naturalWidth / doduk.naturalHeight) * h; g.drawImage(doduk, CW - w - 30, CH - 5 - h, w, h); }
}
function today() { const d = new Date(); return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`; }
const SPOT_CX = SPOT.x + SPOT.w / 2, SPOT_CY = SPOT.y + SPOT.h / 2;

// 1컷 (1080x1350)
function makeCard1(shot, T) {
  const CW = 1080, CH = 1350, c = document.createElement('canvas'); c.width = CW; c.height = CH;
  const g = c.getContext('2d');
  const R = (x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
  cardBase(g, CW, CH, T, '도둑냥 광장 포토존');
  R(60, 180, 960, 740, 44); g.fillStyle = T.frame; g.fill();
  g.save(); g.clip(); g.fillStyle = T.floor; g.fillRect(60, 680, 960, 260); g.restore();
  R(60, 180, 960, 740, 44); g.strokeStyle = '#2a2420'; g.lineWidth = 8; g.stroke();
  bunting(g, 90, 990, 205, 52);
  g.fillStyle = T.id === 'night' ? 'rgba(255,255,255,.10)' : 'rgba(43,38,34,.10)'; g.font = '96px Jua'; g.textAlign = 'center'; g.fillText('도둑냥 광장', CW / 2, 410);
  const k = shot.length > 3 ? 2.7 : 3.3;
  for (const p of shot) {
    const x = Math.max(170, Math.min(910, CW / 2 + (p.x - SPOT_CX) * 2.3)), y = 820 + (p.y - SPOT_CY) * 0.6;
    drawSnapPet(g, p, x, y, k);
    const name = BREEDS[p.breed].name;
    g.font = '30px Jua'; g.textAlign = 'center'; const w = g.measureText(name).width + 28;
    R(x - w / 2, y + 22, w, 44, 22); g.fillStyle = p.mine ? '#E8402F' : 'rgba(31,31,34,.8)'; g.fill();
    g.fillStyle = '#fff'; g.fillText(name, x, y + 55);
  }
  stickers(g, [[90, 230], [990, 900], [1000, 260], [80, 880]], Date.now() & 0xffff);
  const mine = shot.find((p) => p.mine) || shot[0];
  g.textAlign = 'center'; g.fillStyle = T.ink; g.font = '44px Jua';
  g.fillText(shot.length > 1 ? `친구 ${shot.length - 1}마리랑 같이 찍었어` : '오늘 나는', CW / 2, 1000);
  g.font = '90px Jua'; g.fillStyle = '#E8402F'; g.fillText(BREEDS[mine.breed].name, CW / 2, 1098);
  g.font = '30px "Noto Sans KR"'; g.fillStyle = T.sub; g.fillText(today(), CW / 2, 1150);
  cardFooter(g, CW, CH, T, '도둑냥 창고에서 찍음 · 들어올 때마다 다른 동물');
  return c;
}
// 4컷 (1080x1350, 2x2)
function makeCard4(shots, T) {
  const CW = 1080, CH = 1350, c = document.createElement('canvas'); c.width = CW; c.height = CH;
  const g = c.getContext('2d');
  const R = (x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
  cardBase(g, CW, CH, T, '도둑냥 네컷');
  const M = 46, G = 24, top = 156, cw = (CW - M * 2 - G) / 2, ch = (CH - 150 - top - 24 - G) / 2;
  shots.forEach((shot, i) => {
    const x0 = M + (i % 2) * (cw + G), y0 = top + Math.floor(i / 2) * (ch + G);
    R(x0, y0, cw, ch, 28); g.fillStyle = T.frame; g.fill();
    g.save(); g.clip(); g.fillStyle = T.floor; g.fillRect(x0, y0 + ch * 0.66, cw, ch); bunting(g, x0 + 16, x0 + cw - 16, y0 + 14, 30); g.restore();
    R(x0, y0, cw, ch, 28); g.strokeStyle = '#2a2420'; g.lineWidth = 6; g.stroke();
    const k = shot.length > 3 ? 1.45 : 1.85;
    for (const p of shot) {
      const x = Math.max(x0 + 70, Math.min(x0 + cw - 70, x0 + cw / 2 + (p.x - SPOT_CX) * 1.45));
      drawSnapPet(g, p, x, y0 + ch - 70 + (p.y - SPOT_CY) * 0.3, k);
    }
    g.beginPath(); g.arc(x0 + 40, y0 + ch - 38, 22, 0, Math.PI * 2); g.fillStyle = T.band; g.fill();
    g.fillStyle = T.accent; g.font = '26px Jua'; g.textAlign = 'center'; g.fillText(String(i + 1), x0 + 40, y0 + ch - 29);
  });
  stickers(g, [[M + 10, top + 8], [CW - M - 14, top + ch + G / 2], [CW / 2, top + ch * 2 + G - 6], [M + 6, top + ch + G + ch * 0.55], [CW - M - 6, top + 14]], Date.now() & 0xffff);
  const mine = shots[0].find((p) => p.mine) || shots[0][0];
  const n = Math.max(...shots.map((s) => s.length));
  cardFooter(g, CW, CH, T, `${BREEDS[mine.breed].name}${n > 1 ? ` 외 ${n - 1}마리` : ''} · ${today()} · 도둑냥 창고`);
  return c;
}

const snapBtn = document.getElementById('snap');
const photoEl = document.getElementById('photo');
const boothEl = document.getElementById('booth');
let photoBlob = null, photoUrl = null;
function showPhoto(canvasEl) {
  canvasEl.toBlob((blob) => {
    photoBlob = blob;
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    photoUrl = URL.createObjectURL(blob);
    document.getElementById('pImg').src = photoUrl;
    const save = document.getElementById('pSave');
    save.href = photoUrl; save.download = `doduk-${BREEDS[me.breed].name}.png`;
    const file = new File([blob], 'doduk.png', { type: 'image/png' });
    document.getElementById('pShare').style.display = navigator.canShare && navigator.canShare({ files: [file] }) ? '' : 'none';
    photoEl.classList.add('open');
  }, 'image/png');
}
async function shoot() {
  if (booth.busy) return;
  booth.busy = true; boothEl.classList.remove('open');
  const shots = [];
  for (let s = 0; s < booth.cuts; s++) {
    for (let n = 3; n >= 1; n--) { countdown = { n, shot: s + 1, total: booth.cuts }; await sleep(650); }
    countdown = null; flashUntil = performance.now() + 450;
    shots.push(capture());
    speech.set(myId, { text: '찰칵', until: Date.now() + 900 });
    await sleep(600);
  }
  booth.busy = false;
  const T = THEMES.find((x) => x.id === booth.theme) || THEMES[0];
  showPhoto(booth.cuts === 4 ? makeCard4(shots, T) : makeCard1(shots[0], T));
}
function chips(el, list, isOn, onPick) {
  el.innerHTML = '';
  for (const item of list) {
    const b = document.createElement('button');
    b.textContent = item.name;
    if (item.swatch) { b.classList.add('sw'); b.style.setProperty('--sw', item.swatch); }
    if (isOn(item)) b.classList.add('on');
    b.onclick = () => { onPick(item); renderBooth(); };
    el.appendChild(b);
  }
}
function renderBooth() {
  chips(document.getElementById('accChips'), ACCESSORIES, (a) => a.id === me.acc, (a) => {
    me.acc = a.id;
    try { localStorage.setItem('doduk-acc', a.id); } catch {}
    net.send();   // 다른 손님 화면에도 바로 보이게
  });
  chips(document.getElementById('themeChips'), THEMES.map((x) => ({ ...x, swatch: x.frame })), (x) => x.id === booth.theme, (x) => {
    booth.theme = x.id;
    try { localStorage.setItem('doduk-theme', x.id); } catch {}
  });
  chips(document.getElementById('cutChips'), [{ id: 4, name: '4컷' }, { id: 1, name: '1컷' }], (x) => x.id === booth.cuts, (x) => { booth.cuts = x.id; });
}
snapBtn.onclick = () => { if (booth.busy) return; renderBooth(); boothEl.classList.toggle('open'); };
document.getElementById('bClose').onclick = () => boothEl.classList.remove('open');
document.getElementById('shoot').onclick = shoot;
document.getElementById('pShare').onclick = () => {
  const file = new File([photoBlob], 'doduk.png', { type: 'image/png' });
  navigator.share({ files: [file], text: '도둑냥 창고에서 찍었어 @doduk_nyang' }).catch(() => {});
};
document.getElementById('pClose').onclick = () => photoEl.classList.remove('open');

// ---------- 도둑냥 청소 봇: 광장에 똥이 생기면 가서 치우고 부스로 돌아옴 ----------
// 접속한 사람마다 자기 화면에서 따로 움직임 (똥이 생기는 시점이 거의 같아서 비슷하게 보임)
const HOME = { x: BOOTH.x, y: BOOTH.y - 30 };
const bot = { x: HOME.x, y: HOME.y, tx: HOME.x, ty: HOME.y, home: true, target: null, cleanUntil: 0, idleSince: performance.now(), say: null, sparkles: [] };
const SPOT_LINES = ['또 쌌어?', '잠깐, 내가 치울게', '거기 그대로 있어', '누구야 이거', '아 진짜'];
const DONE = ['깨끗해졌다', '다음엔 화장실 가', '반짝반짝', '치우는 것도 일이야', '이건 못 훔치겠다'];
const pick = (a) => a[Math.floor(Math.random() * a.length)];
function botSay(text) { bot.say = { text, until: Date.now() + 2600 }; }
function stepBot(dt, now) {
  if (bot.cleanUntil) {
    if (now < bot.cleanUntil) return;
    const i = poops.indexOf(bot.target);
    if (i >= 0) poops.splice(i, 1);
    for (let k = 0; k < 6; k++) bot.sparkles.push({ x: bot.target.x, y: bot.target.y - 10, a: (k / 6) * Math.PI * 2, start: now });
    botSay(pick(DONE));
    bot.cleanUntil = 0; bot.target = null;
    bot.tx = HOME.x; bot.ty = HOME.y;
  }
  if (!bot.target) {
    // 가장 가까운 똥부터
    let best = null, bd = Infinity;
    for (const p of poops) {
      if (p.scene !== 'hall' || p.until - Date.now() < 1500) continue;
      const d = Math.hypot(p.x - bot.x, p.y - bot.y);
      if (d < bd) { bd = d; best = p; }
    }
    if (best) {
      bot.target = best; bot.tx = best.x + 34; bot.ty = best.y + 6;
      if (bot.home || !bot.say || Date.now() > bot.say.until) botSay(pick(SPOT_LINES));
    } else if (bot.home && now - bot.idleSince > 15000 && Math.random() < 0.004) {
      // 한가하면 가끔 광장 한 바퀴
      bot.tx = 200 + Math.random() * 1040; bot.ty = 330 + Math.random() * 1100;
    }
  } else if (!poops.includes(bot.target)) {   // 사라진 똥이면 다른 똥 찾기
    bot.target = null; return;
  }
  const dx = bot.tx - bot.x, dy = bot.ty - bot.y, d = Math.hypot(dx, dy);
  bot.walking = d > 2;
  if (bot.walking) {
    const m = Math.min(d, 230 * dt);
    bot.x += (dx / d) * m; bot.y += (dy / d) * m;
    bot.home = false;
    return;
  }
  if (bot.target) { bot.cleanUntil = now + 1700; return; }
  if (bot.x === HOME.x && bot.y === HOME.y) { if (!bot.home) { bot.home = true; bot.idleSince = now; } }
  else { bot.tx = HOME.x; bot.ty = HOME.y; }
}
function drawBot(t, now) {
  const h = 104, w = doduk.naturalWidth ? (doduk.naturalWidth / doduk.naturalHeight) * h : 0;
  const cleaning = bot.cleanUntil > now;
  ctx.fillStyle = 'rgba(0,0,0,.14)'; ctx.beginPath(); ctx.ellipse(bot.x, bot.y, 34, 10, 0, 0, Math.PI * 2); ctx.fill();
  // 빗자루 (청소하러 다닐 때만)
  if (!bot.home) {
    const swing = cleaning ? Math.sin(t * 18) * 0.5 : Math.sin(t * 8) * 0.1;
    ctx.save(); ctx.translate(bot.x - 30, bot.y - 50); ctx.rotate(-0.5 + swing);
    ctx.fillStyle = '#8A5C37'; ctx.fillRect(-3, 0, 6, 62);
    ctx.beginPath(); ctx.moveTo(-14, 60); ctx.lineTo(14, 60); ctx.lineTo(18, 82); ctx.lineTo(-18, 82); ctx.closePath();
    ctx.fillStyle = '#E8C46A'; ctx.fill(); ctx.strokeStyle = '#2a2420'; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }
  if (w) {
    const bob = bot.walking ? -Math.abs(Math.sin(t * 12)) * 7 : Math.sin(t * 3) * 2;
    ctx.save(); ctx.translate(bot.x, bot.y + bob);
    if (bot.walking) ctx.rotate(Math.sin(t * 12) * 0.06);
    ctx.drawImage(doduk, -w / 2, -h, w, h);
    ctx.restore();
  }
  label('도둑냥', bot.x, bot.y + 26, '#2B2622', '#FFD54A', '16px Jua');
  // 반짝이
  ctx.fillStyle = '#FFD54A';
  bot.sparkles = bot.sparkles.filter((s) => now - s.start < 700);
  for (const s of bot.sparkles) {
    const k = (now - s.start) / 700, r = 10 + k * 34;
    ctx.globalAlpha = 1 - k;
    ctx.beginPath(); ctx.arc(s.x + Math.cos(s.a) * r, s.y + Math.sin(s.a) * r * 0.6, 5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  return bot.y - h - 6;
}

// ---------- 도둑냥 점집 (타로) ----------
// 광장 오른쪽 아래 천막. 앞에 서면 "타로 보기" 버튼. 집사 운세 / 우리 애 마음 중 고르고 카드 3장 중 1장을 뽑음
// 결과는 하루 동안 고정(이 브라우저 기준). 해석 문구는 data/tarot.json
const TENT = { x: 1150, y: 1560 };
let tarotData = null;
fetch('data/tarot.json').then((r) => r.json()).then((d) => { tarotData = d; }).catch(() => {});
const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];
const TAROT_MODES = { human: '집사 운세', pet: '우리 애 마음' };

function drawTent(t) {
  const { x, y } = TENT;
  ctx.fillStyle = 'rgba(0,0,0,.14)'; ctx.beginPath(); ctx.ellipse(x, y + 4, 120, 22, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#2a2420'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x - 110, y); ctx.lineTo(x, y - 170); ctx.lineTo(x + 110, y); ctx.closePath(); ctx.fillStyle = '#5B3F8C'; ctx.fill(); ctx.stroke();
  ctx.save(); ctx.clip(); ctx.fillStyle = '#7A5BB0';
  for (let i = -3; i <= 3; i += 2) { ctx.beginPath(); ctx.moveTo(x + i * 16, y); ctx.lineTo(x, y - 170); ctx.lineTo(x + (i + 1) * 16, y); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  ctx.beginPath(); ctx.moveTo(x - 34, y); ctx.lineTo(x, y - 78); ctx.lineTo(x + 34, y); ctx.closePath(); ctx.fillStyle = '#2B2240'; ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#FFD54A'; star(ctx, x, y - 186 + Math.sin(t * 2) * 3, 12, 5);
  rr(x - 70, y - 120, 140, 34, 10); ctx.fillStyle = '#2B2240'; ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#FFD54A'; ctx.font = '20px Jua'; ctx.textAlign = 'center'; ctx.fillText('도둑냥 점집', x, y - 96);
}
function star(g, x, y, r, n = 5) {
  g.beginPath();
  for (let i = 0; i < n * 2; i++) { const rr2 = i % 2 ? r * 0.45 : r, a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2; g.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); }
  g.closePath(); g.fill();
}
// 카드 그림 기호 (단순한 도형만 사용)
function tarotSymbol(g, s, x, y, r) {
  g.save(); g.fillStyle = '#FFD54A'; g.strokeStyle = '#FFD54A'; g.lineWidth = r * 0.12; g.lineCap = 'round'; g.lineJoin = 'round';
  const circ = (cx, cy, rad, fill = true) => { g.beginPath(); g.arc(cx, cy, rad, 0, Math.PI * 2); fill ? g.fill() : g.stroke(); };
  if (s === 'star') star(g, x, y, r, 5);
  else if (s === 'star4') star(g, x, y, r, 4);
  else if (s === 'sun') { circ(x, y, r * 0.5); for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.beginPath(); g.moveTo(x + Math.cos(a) * r * 0.65, y + Math.sin(a) * r * 0.65); g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); g.stroke(); } }
  else if (s === 'moon') { circ(x, y, r * 0.8); g.globalCompositeOperation = 'destination-out'; circ(x + r * 0.35, y - r * 0.2, r * 0.7); g.globalCompositeOperation = 'source-over'; }
  else if (s === 'heart') { g.beginPath(); g.moveTo(x, y + r * 0.8); g.bezierCurveTo(x - r * 1.4, y - r * 0.1, x - r * 0.6, y - r * 1.1, x, y - r * 0.4); g.bezierCurveTo(x + r * 0.6, y - r * 1.1, x + r * 1.4, y - r * 0.1, x, y + r * 0.8); g.fill(); }
  else if (s === 'crown') { g.beginPath(); g.moveTo(x - r, y + r * 0.5); g.lineTo(x - r, y - r * 0.5); g.lineTo(x - r * 0.5, y); g.lineTo(x, y - r * 0.7); g.lineTo(x + r * 0.5, y); g.lineTo(x + r, y - r * 0.5); g.lineTo(x + r, y + r * 0.5); g.closePath(); g.fill(); }
  else if (s === 'key') { circ(x - r * 0.45, y, r * 0.35, false); g.beginPath(); g.moveTo(x - r * 0.1, y); g.lineTo(x + r, y); g.moveTo(x + r * 0.7, y); g.lineTo(x + r * 0.7, y + r * 0.35); g.moveTo(x + r * 0.45, y); g.lineTo(x + r * 0.45, y + r * 0.3); g.stroke(); }
  else if (s === 'arrow') { g.beginPath(); g.moveTo(x - r, y + r * 0.6); g.lineTo(x + r * 0.7, y - r * 0.7); g.stroke(); g.beginPath(); g.moveTo(x + r, y - r); g.lineTo(x + r * 0.2, y - r * 0.85); g.lineTo(x + r * 0.85, y - r * 0.2); g.closePath(); g.fill(); }
  else if (s === 'lamp') { g.beginPath(); g.moveTo(x - r * 0.4, y - r * 0.6); g.lineTo(x + r * 0.4, y - r * 0.6); g.lineTo(x + r * 0.55, y + r * 0.5); g.lineTo(x - r * 0.55, y + r * 0.5); g.closePath(); g.stroke(); circ(x, y, r * 0.22); g.beginPath(); g.moveTo(x, y - r * 0.6); g.lineTo(x, y - r); g.stroke(); }
  else if (s === 'wheel') { circ(x, y, r * 0.85, false); circ(x, y, r * 0.15); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * r * 0.85, y + Math.sin(a) * r * 0.85); g.stroke(); } }
  else if (s === 'scale') { g.beginPath(); g.moveTo(x, y - r); g.lineTo(x, y + r * 0.8); g.moveTo(x - r * 0.4, y + r * 0.8); g.lineTo(x + r * 0.4, y + r * 0.8); g.moveTo(x - r, y - r * 0.6); g.lineTo(x + r, y - r * 0.6); g.stroke(); for (const sx of [-1, 1]) { g.beginPath(); g.arc(x + sx * r * 0.8, y - r * 0.1, r * 0.3, 0, Math.PI); g.fill(); } }
  else if (s === 'drop') { g.beginPath(); g.moveTo(x, y - r); g.quadraticCurveTo(x + r * 0.8, y + r * 0.1, x, y + r * 0.8); g.quadraticCurveTo(x - r * 0.8, y + r * 0.1, x, y - r); g.fill(); }
  else if (s === 'cup') { g.beginPath(); g.moveTo(x - r * 0.7, y - r * 0.6); g.lineTo(x + r * 0.7, y - r * 0.6); g.quadraticCurveTo(x + r * 0.6, y + r * 0.2, x, y + r * 0.25); g.quadraticCurveTo(x - r * 0.6, y + r * 0.2, x - r * 0.7, y - r * 0.6); g.fill(); g.beginPath(); g.moveTo(x, y + r * 0.25); g.lineTo(x, y + r * 0.8); g.moveTo(x - r * 0.4, y + r * 0.8); g.lineTo(x + r * 0.4, y + r * 0.8); g.stroke(); }
  else if (s === 'candy') { g.save(); g.translate(x, y); g.rotate(-0.4); g.beginPath(); g.ellipse(0, 0, r * 0.55, r * 0.4, 0, 0, Math.PI * 2); g.fill(); for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * r * 0.5, 0); g.lineTo(sx * r, -r * 0.35); g.lineTo(sx * r, r * 0.35); g.closePath(); g.fill(); } g.restore(); }
  else if (s === 'bolt') { g.beginPath(); g.moveTo(x + r * 0.2, y - r); g.lineTo(x - r * 0.5, y + r * 0.1); g.lineTo(x, y + r * 0.1); g.lineTo(x - r * 0.2, y + r); g.lineTo(x + r * 0.5, y - r * 0.15); g.lineTo(x, y - r * 0.15); g.closePath(); g.fill(); }
  else if (s === 'bell') { g.beginPath(); g.moveTo(x - r * 0.7, y + r * 0.5); g.quadraticCurveTo(x - r * 0.6, y - r * 0.9, x, y - r * 0.9); g.quadraticCurveTo(x + r * 0.6, y - r * 0.9, x + r * 0.7, y + r * 0.5); g.closePath(); g.fill(); circ(x, y + r * 0.7, r * 0.18); }
  else if (s === 'circle') { circ(x, y, r * 0.85, false); circ(x, y, r * 0.55, false); star(g, x, y, r * 0.3, 4); }
  else if (s === 'flower') { for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; circ(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5, r * 0.35); } g.fillStyle = '#2B2240'; circ(x, y, r * 0.3); }
  else paw(g, x, y + r * 0.3, r * 0.55, '#FFD54A');
  g.restore();
}
// 카드 앞면 (w x h 크기, 왼쪽 위 0,0 기준)
function drawTarotFront(g, card, w, h) {
  const R = (x, y, ww, hh, r) => { g.beginPath(); g.roundRect(x, y, ww, hh, r); };
  const grad = g.createLinearGradient(0, 0, 0, h); grad.addColorStop(0, '#2B2240'); grad.addColorStop(1, '#1A1530');
  R(0, 0, w, h, w * 0.06); g.fillStyle = grad; g.fill();
  R(w * 0.05, w * 0.05, w * 0.9, h - w * 0.1, w * 0.04); g.strokeStyle = '#FFD54A'; g.lineWidth = w * 0.012; g.stroke();
  g.fillStyle = 'rgba(255,213,74,.35)'; for (const [sx, sy] of [[0.2, 0.25], [0.8, 0.3], [0.15, 0.62], [0.85, 0.66], [0.3, 0.75], [0.72, 0.18]]) star(g, w * sx, h * sy, w * 0.025, 4);
  g.fillStyle = '#FFD54A'; g.textAlign = 'center'; g.font = `${Math.round(w * 0.1)}px Jua`; g.fillText(ROMAN[card.n], w / 2, h * 0.13);
  tarotSymbol(g, card.symbol, w / 2, h * 0.47, w * 0.26);
  g.font = `${Math.round(w * 0.11)}px Jua`; g.fillText(card.name, w / 2, h * 0.86);
}
function drawTarotBack(g, w, h) {
  const R = (x, y, ww, hh, r) => { g.beginPath(); g.roundRect(x, y, ww, hh, r); };
  R(0, 0, w, h, w * 0.06); g.fillStyle = '#5B3F8C'; g.fill();
  R(w * 0.05, w * 0.05, w * 0.9, h - w * 0.1, w * 0.04); g.strokeStyle = '#FFD54A'; g.lineWidth = w * 0.012; g.stroke();
  for (let yy = 0.18; yy < 0.9; yy += 0.14) for (let xx = 0.22; xx < 0.9; xx += 0.28) paw(g, w * xx, h * yy, w * 0.04, 'rgba(255,213,74,.25)');
  g.fillStyle = '#FFD54A'; star(g, w / 2, h / 2, w * 0.14, 5);
}
function wrapText(g, text, maxW) {
  const lines = []; let line = '';
  for (const word of text.split(' ')) {
    const test = line ? `${line} ${word}` : word;
    if (g.measureText(test).width > maxW && line) { lines.push(line); line = word; } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

// 화면 (모달)
const tarotEl = document.getElementById('tarot');
const tarotBtn = document.getElementById('tarotBtn');
let tarotMode = 'human';
const tarotKey = (mode) => `doduk-tarot-${dayKey()}-${mode}`;
function savedPick(mode) { try { const v = localStorage.getItem(tarotKey(mode)); return v === null ? null : Number(v); } catch { return null; } }
function cardCanvas(card, w, h, back) {
  const c = document.createElement('canvas'); c.width = w * 2; c.height = h * 2; c.style.width = `${w}px`; c.style.height = `${h}px`;
  const g = c.getContext('2d'); g.scale(2, 2);
  back ? drawTarotBack(g, w, h) : drawTarotFront(g, card, w, h);
  return c;
}
function renderTarot() {
  document.querySelectorAll('#tarot .tabs button').forEach((b) => b.classList.toggle('on', b.dataset.mode === tarotMode));
  const area = document.getElementById('tarotArea');
  area.innerHTML = '';
  if (!tarotData) { area.textContent = '카드를 섞는 중이에요'; return; }
  const picked = savedPick(tarotMode);
  if (picked !== null) return showReading(tarotData.cards.find((c) => c.n === picked), true);
  const hint = document.createElement('div'); hint.className = 'tarot-hint';
  hint.textContent = tarotMode === 'human' ? '마음을 가라앉히고 한 장을 골라 주세요' : '우리 애를 떠올리면서 한 장을 골라 주세요';
  area.appendChild(hint);
  const row = document.createElement('div'); row.className = 'tarot-row';
  // 3장 후보: 오늘 날짜 + 메뉴 + 이 브라우저마다 다르게 섞음
  let uid = 'x'; try { uid = localStorage.getItem('doduk-uid') || Math.random().toString(36).slice(2); localStorage.setItem('doduk-uid', uid); } catch {}
  let seed = dayKey() * 31 + (tarotMode === 'pet' ? 7 : 3); for (const ch of uid) seed = (seed * 33 + ch.charCodeAt(0)) | 0;
  const rnd = seeded(seed), deck = tarotData.cards.slice();
  for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
  deck.slice(0, 3).forEach((card) => {
    const slot = document.createElement('button'); slot.className = 'tarot-card';
    slot.appendChild(cardCanvas(null, 92, 150, true));
    slot.onclick = () => {
      try { localStorage.setItem(tarotKey(tarotMode), String(card.n)); } catch {}
      slot.classList.add('flip');
      setTimeout(() => showReading(card, false), 450);
    };
    row.appendChild(slot);
  });
  area.appendChild(row);
}
function showReading(card, again) {
  const area = document.getElementById('tarotArea');
  area.innerHTML = '';
  const wrap = document.createElement('div'); wrap.className = 'tarot-result';
  wrap.appendChild(cardCanvas(card, 120, 196, false));
  const box = document.createElement('div');
  box.innerHTML = `<div class="tarot-mode">${again ? '오늘 이미 뽑은 카드' : '오늘의 카드'} · ${TAROT_MODES[tarotMode]}</div><div class="tarot-name">${card.name}<small>${card.key}</small></div>`;
  const p = document.createElement('p'); p.textContent = card[tarotMode]; box.appendChild(p);
  wrap.appendChild(box);
  area.appendChild(wrap);
  const btns = document.createElement('div'); btns.className = 'btns';
  const save = document.createElement('button'); save.className = 'go'; save.textContent = '이미지로 저장';
  save.onclick = () => { tarotEl.classList.remove('open'); showPhoto(makeTarotCard(card, tarotMode)); };
  btns.appendChild(save); area.appendChild(btns);
  const note = document.createElement('div'); note.className = 'login'; note.textContent = '재미로 보는 오늘의 카드예요. 내일 다시 뽑을 수 있어요';
  area.appendChild(note);
}
// 공유용 이미지 (1080x1350)
function makeTarotCard(card, mode) {
  const CW = 1080, CH = 1350, c = document.createElement('canvas'); c.width = CW; c.height = CH;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, CH); grad.addColorStop(0, '#2B2240'); grad.addColorStop(1, '#15112A');
  g.fillStyle = grad; g.fillRect(0, 0, CW, CH);
  g.fillStyle = 'rgba(255,213,74,.25)'; const rnd = seeded(card.n * 97 + 5);
  for (let i = 0; i < 40; i++) star(g, rnd() * CW, rnd() * CH, 3 + rnd() * 6, 4);
  g.textAlign = 'center'; g.fillStyle = '#FFD54A'; g.font = '56px Jua'; g.fillText('도둑냥 점집', CW / 2, 100);
  g.fillStyle = '#fff'; g.font = '34px Jua'; g.fillText(`오늘의 카드 · ${TAROT_MODES[mode]}`, CW / 2, 152);
  g.save(); g.translate(CW / 2 - 170, 190); drawTarotFront(g, card, 340, 556); g.restore();
  g.fillStyle = '#FFD54A'; g.font = '64px Jua'; g.fillText(card.name, CW / 2, 830);
  g.fillStyle = '#C9B8EE'; g.font = '36px Jua'; g.fillText(card.key, CW / 2, 882);
  g.fillStyle = '#fff'; g.font = '36px "Noto Sans KR"';
  wrapText(g, card[mode], 860).forEach((line, i) => g.fillText(line, CW / 2, 970 + i * 56));
  g.fillStyle = 'rgba(255,255,255,.55)'; g.font = '26px "Noto Sans KR"'; g.fillText('재미로 보는 오늘의 카드', CW / 2, 1220);
  g.fillStyle = '#FFD54A'; g.font = '44px Jua'; g.fillText('@doduk_nyang', CW / 2, 1290);
  return c;
}
document.querySelectorAll('#tarot .tabs button').forEach((b) => { b.onclick = () => { tarotMode = b.dataset.mode; renderTarot(); }; });
document.getElementById('tClose').onclick = () => tarotEl.classList.remove('open');
tarotBtn.onclick = () => { renderTarot(); tarotEl.classList.add('open'); };
const nearTent = () => isPlaza() && Math.abs(me.x - TENT.x) < 120 && me.y > TENT.y - 10 && me.y < TENT.y + 110;

// ---------- 광장 주민 (봇 강아지·고양이) ----------
// 광장이 휑하지 않게 돌아다니는 주민들. 접속자마다 자기 화면에서 따로 움직이고, 접속자 수(N마리)에는 안 셈
// 이름표에 "주민"이 붙어서 실제 손님과 구분됨. 실제 손님이 많아지면 주민 수를 줄임
const npcs = new Map();
const NPC_MAX = 8;
const NPC_OFF = LINEUP || location.search.includes('demo') || location.search.includes('film');
const NPC_SAY = [0, 1, 2, 4, 6, 7, 8, 9];   // PHRASES 번호 (울음, 이거 싸다, 득템했다, 같이 놀자, 안녕, 배고파, 산책 가자, 다음 방 가자)
const NPC_ACTS = ['bark', 'jump', 'heart', 'wag', 'roll', 'zoom'];
const rndIn = (a, b) => a + Math.random() * (b - a);
function spawnNpcs() {
  npcs.clear();
  if (NPC_OFF || !isPlaza()) return;
  const used = new Set([me.breed]);
  for (let i = 0; i < NPC_MAX; i++) {
    let breed; do { breed = Math.floor(Math.random() * BREEDS.length); } while (used.has(breed) && used.size < BREEDS.length);
    used.add(breed);
    const acc = Math.random() < 0.35 ? ACCESSORIES[1 + Math.floor(Math.random() * (ACCESSORIES.length - 1))].id : '';
    const x = rndIn(380, 1060), y = rndIn(780, 1640);   // 처음 들어왔을 때 보이게 입구·가운데 쪽에 모아서 시작
    npcs.set(`npc${i}`, { npc: true, breed, acc, x, y, tx: x, ty: y, next: performance.now() + rndIn(500, 4000) });
  }
}
function activeNpcs() {
  const n = Math.max(2, NPC_MAX - peers.size);   // 손님이 늘면 주민은 줄임 (최소 2마리)
  return [...npcs.entries()].slice(0, n);
}
function npcThink(id, p, now) {
  p.next = now + rndIn(2500, 7000);
  if (p.act && p.act.a === 'sleep') { if (Math.random() < 0.5) return; p.act = null; }
  const r = Math.random();
  if (r < 0.42) { p.tx = Math.max(140, Math.min(1300, p.x + rndIn(-320, 320))); p.ty = Math.max(320, Math.min(1640, p.y + rndIn(-260, 260))); }
  else if (r < 0.6) onAct(id, NPC_ACTS[Math.floor(Math.random() * NPC_ACTS.length)], p.x, p.y);
  else if (r < 0.74) speech.set(id, { text: phraseText(NPC_SAY[Math.floor(Math.random() * NPC_SAY.length)], p.breed), until: Date.now() + 2600 });
  else if (r < 0.84 && Math.hypot(me.x - p.x, me.y - p.y) < 600) { p.tx = me.x + (Math.random() < 0.5 ? -70 : 70); p.ty = me.y + rndIn(-30, 30); }   // 손님한테 다가감
  else if (r < 0.89) onAct(id, 'sleep', p.x, p.y);
  else if (r < 0.915) onAct(id, 'poop', Math.round(p.x - (p.face ?? 1) * 26), Math.round(p.y + 4));   // 가끔 싸고 도둑냥이 치움
}
function stepNpcs(dt, now) {
  for (const [id, p] of activeNpcs()) {
    step(p, dt);
    if (now > p.next) npcThink(id, p, now);
  }
}
// 내가 말하거나 행동하면 근처 주민이 반응
function npcReact(kind) {
  for (const [id, p] of activeNpcs()) {
    if (Math.hypot(me.x - p.x, me.y - p.y) > 260 || Math.random() < 0.4) continue;
    setTimeout(() => {
      if (kind === 'poop' && Math.random() < 0.5) return onAct(id, 'bark', p.x, p.y);
      if (Math.random() < 0.5) onAct(id, Math.random() < 0.6 ? 'heart' : 'jump', p.x, p.y);
      else speech.set(id, { text: phraseText([0, 4, 6][Math.floor(Math.random() * 3)], p.breed), until: Date.now() + 2400 });
      if (p.act && p.act.a === 'sleep') p.act = null;
      p.next = performance.now() + rndIn(2000, 5000);
    }, rndIn(500, 1500));
  }
}

// ---------- 움직임 + 그리기 루프 ----------
function step(p, dt) {
  // 우다다: 행동 중엔 원을 그리며 빠르게 뜀
  if (p.act && p.act.a === 'zoom' && p.zoomFrom) {
    const k = (performance.now() - p.act.start) / p.act.dur, a = p.zoomFrom.ang + k * Math.PI * 4;
    if (k < 1) { p.face = Math.cos(a + Math.PI / 2) > 0 ? 1 : -1; p.x = p.zoomFrom.x + Math.cos(a) * 70 - 70 * Math.cos(p.zoomFrom.ang); p.y = p.zoomFrom.y + Math.sin(a) * 40 - 40 * Math.sin(p.zoomFrom.ang); p.tx = p.x + p.face; p.ty = p.y; return; }
    p.tx = p.x; p.ty = p.y; p.zoomFrom = null;
  }
  const dx = p.tx - p.x, dy = p.ty - p.y, d = Math.hypot(dx, dy);
  if (d < 1) { p.x = p.tx; p.y = p.ty; return; }
  const m = Math.min(d, SPEED * dt);
  p.x += (dx / d) * m; p.y += (dy / d) * m;
}

let lastT = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
  const t = now / 1000;
  step(me, dt);
  for (const [id, p] of peers) {
    if (p.goneAt && Date.now() - p.goneAt > 8000) { peers.delete(id); continue; }
    step(p, dt);
  }
  checkDoors();
  if (isPlaza()) { stepBot(dt, now); stepNpcs(dt, now); }
  if (me.scene === 'field') { stepBall(dt); kickCheck(); }

  const info = sceneInfo();
  const { w, h } = size();
  camX = w <= VIEW_W ? 0 : Math.max(0, Math.min(w - VIEW_W, me.x - VIEW_W / 2));
  camY = viewH >= h ? -(viewH - h) / 2 : Math.max(0, Math.min(h - viewH, me.y - viewH * 0.55));
  if (info.photo && (boothEl.classList.contains('open') || countdown)) camY = SPOT.y + SPOT.h / 2 - viewH * 0.27;   // 꾸미는 동안 패널에 가리지 않게 발자국 자리를 위로
  ctx.setTransform(scale, 0, 0, scale, -camX * scale, -camY * scale);
  ctx.clearRect(camX, camY, VIEW_W, viewH);
  if (isPlaza()) drawPlaza(t); else if (info.photo) drawPhotoRoom(t); else if (info.treasure) drawTreasureRoom(); else if (info.field) drawField(); else drawRoom(info);

  // 위쪽(y가 작은 것)부터 그려서 앞뒤가 자연스럽게 겹치게
  const tops = [];   // 말풍선을 맨 위에 그리려고 캐릭터 머리 위치를 모아 둠
  const items = info.shelves.map((s, i) => ({ y: s.y + 60, draw: () => drawShelf(s, info.items[i]) }));
  if (info.field) items.push({ y: ball.y, draw: drawBall });
  if (info.treasure) BOXES.forEach((b, i) => { items.push({ y: b.y, draw: () => drawBox(b, i, t, now) }); tops.push(['box' + i, b.x, b.y - 96]); });
  if (isPlaza() && !LINEUP) {
    items.push({ y: BOOTH.y + 24, draw: () => drawBooth(t) });
    items.push({ y: TENT.y, draw: () => drawTent(t) });
    items.push({ y: bot.y, draw: () => tops.push(['bot', bot.x, drawBot(t, now)]) });
  }
  for (let i = poops.length - 1; i >= 0; i--) if (Date.now() > poops[i].until) poops.splice(i, 1);
  for (const pp of poops) if (pp.scene === me.scene) items.push({ y: pp.y - 1, draw: () => drawPoop(pp, t) });
  for (const [id, p] of peers) items.push({ y: p.y, draw: () => tops.push([id, p.x, drawActor(p, t, false)]) });
  if (isPlaza()) for (const [id, p] of activeNpcs()) items.push({ y: p.y, draw: () => tops.push([id, p.x, drawActor(p, t, false)]) });
  items.push({ y: me.y, draw: () => tops.push([myId, me.x, drawActor(me, t, true)]) });
  items.sort((a, b) => a.y - b.y).forEach((it) => it.draw());
  for (const [id, x, top] of tops) {
    const s = id === 'bot' ? bot.say : speech.get(id);
    if (!s) continue;
    if (Date.now() > s.until) { if (id !== 'bot') speech.delete(id); continue; }
    ctx.font = '20px Jua'; ctx.textAlign = 'center';
    const bw = ctx.measureText(s.text).width + 24, by = top - 40;
    rr(x - bw / 2, by, bw, 34, 14); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#1f1f22'; ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 6, by + 33); ctx.lineTo(x, by + 42); ctx.lineTo(x + 6, by + 33); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1f1f22'; ctx.fillText(s.text, x, by + 24);
  }

  if (info.field) drawGoalBanner();
  if (performance.now() < flashUntil) {
    ctx.globalAlpha = (flashUntil - performance.now()) / 450; ctx.fillStyle = '#fff';
    ctx.fillRect(camX, camY, VIEW_W, viewH); ctx.globalAlpha = 1;
  }
  if (countdown) {
    const cx = camX + VIEW_W / 2, cy = camY + viewH * 0.33;
    ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.beginPath(); ctx.arc(cx, cy, 80, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2a2420'; ctx.lineWidth = 6; ctx.stroke();
    ctx.fillStyle = '#E8402F'; ctx.font = '100px Jua'; ctx.textAlign = 'center'; ctx.fillText(String(countdown.n), cx, cy + 36);
    label(`${countdown.shot}/${countdown.total} · 포즈! 행동 버튼도 돼`, cx, cy + 128, '#2B2622', '#FFD54A', '22px Jua');
  }
  if (!info.photo && boothEl.classList.contains('open')) boothEl.classList.remove('open');
  const canSnap = !!info.photo && !booth.busy && inSpot(me) && Math.hypot(me.tx - me.x, me.ty - me.y) < 2;
  if (canSnap !== snapBtn.classList.contains('show')) snapBtn.classList.toggle('show', canSnap);
  const canTarot = nearTent() && Math.hypot(me.tx - me.x, me.ty - me.y) < 2;
  if (canTarot !== tarotBtn.classList.contains('show')) tarotBtn.classList.toggle('show', canTarot);
  if (!isPlaza() && tarotEl.classList.contains('open')) tarotEl.classList.remove('open');

  if (info.treasure) {
    if (openedDay !== dayKey()) loadOpened();   // 자정 지나면 새 상자
    const stillHere = Math.hypot(me.tx - me.x, me.ty - me.y) < 2;
    const bi = BOXES.findIndex((b) => Math.abs(me.x - b.x) < 60 && me.y > b.y - 10 && me.y < b.y + 60);
    if (stillHere && bi >= 0 && !opened.has(bi)) openBox(bi);
    if (openShelf === -2 && bi !== treasureBox) { sheet.classList.remove('open'); openShelf = -1; treasureBox = -1; }
  }
  const n = nearShelf(info.shelves);
  const still = Math.hypot(me.tx - me.x, me.ty - me.y) < 2;
  if (n >= 0 && n !== openShelf && n !== dismissed && still && info.items[n]) openCard(n, info.items[n]);
  if (openShelf >= 0 && n !== openShelf) { sheet.classList.remove('open'); openShelf = -1; }
  if (n !== dismissed) dismissed = -1;   // 닫았던 선반을 벗어나면 다시 열릴 수 있게

  const conn = net.mode === 'local' ? ' · 테스트' : net.status === 'SUBSCRIBED' ? '' : net.status === 'CONNECTING' ? ' · 연결 중' : ' · 끊김';
  document.getElementById('count').innerHTML = `<b>${peers.size + 1}</b>마리${conn}`;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// ?film=이름 으로 열면 홍보 영상용 연출 스크립트(film.js, 로컬 전용)를 불러옴
if (location.search.includes('film')) { const s = document.createElement('script'); s.src = 'film.js?' + Date.now(); document.body.appendChild(s); }
spawnNpcs();

// ---------- 배경음악 ----------
// 처음 화면을 누르면 켜짐 (브라우저가 소리 자동재생을 막아서). 오른쪽 위 버튼으로 끄고 켬, 설정은 이 브라우저에 기억
// 곡: "Happy Clappy Loop" by OwlishMedia (CC0, opengameart.org/content/happy-clappy-loop)
const music = (() => {
  const btn = document.getElementById('music');
  let on = true;
  try { on = localStorage.getItem('doduk-music') !== 'off'; } catch {}
  if (location.search.includes('film')) on = false;
  let ac = null, gain = null, started = false, loading = null;
  const label = () => { btn.textContent = on ? '음악 끄기' : '음악 켜기'; btn.classList.toggle('off', !on); };
  async function start() {
    if (started || loading) return loading;
    loading = (async () => {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      gain = ac.createGain(); gain.gain.value = 0.35; gain.connect(ac.destination);
      const buf = await ac.decodeAudioData(await (await fetch('music/bgm.m4a')).arrayBuffer());
      // 압축(AAC)하면서 앞에 생긴 짧은 무음을 건너뛰고 원곡 길이(769132 샘플 @44.1kHz)만큼만 반복 → 이음새 없이 돌게
      const d = buf.getChannelData(0);
      let lead = 0; while (lead < 8192 && Math.abs(d[lead]) < 0.001) lead++;
      const src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
      src.loopStart = lead / buf.sampleRate; src.loopEnd = Math.min(buf.duration, src.loopStart + 769132 / 44100);
      src.connect(gain); src.start(0, src.loopStart);
      started = true;
      if (!on) await ac.suspend();
    })().catch(() => { btn.style.display = 'none'; });   // 음악 파일이 없거나 재생이 안 되면 버튼 숨김
    return loading;
  }
  function set(v) {
    on = v; label();
    try { localStorage.setItem('doduk-music', on ? 'on' : 'off'); } catch {}
    if (on) { if (!started) start(); else ac.resume(); } else if (ac) ac.suspend();
  }
  btn.onclick = (e) => { e.stopPropagation(); set(!on); };
  // 첫 터치 때 켜기 (꺼둔 사람은 그대로)
  const first = () => { if (on) start(); removeEventListener('pointerdown', first, true); };
  addEventListener('pointerdown', first, true);
  // 다른 앱으로 가면 소리 멈춤
  document.addEventListener('visibilitychange', () => { if (!ac || !on) return; document.hidden ? ac.suspend() : ac.resume(); });
  label();
  return { set };
})();