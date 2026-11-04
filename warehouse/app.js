// 도둑냥 창고: 들어온 사람마다 랜덤 강아지·고양이가 되어 돌아다니며 놀고 구경하는 곳
// 광장(넓은 홀)은 노는 곳. 위쪽 문은 오늘의 타임딜 방, 양옆 문은 강아지·고양이 사료/간식/영양제/용품 방
// 방 진열대는 1시간마다 10개씩 랜덤으로 바뀜 (같은 시간엔 모두가 같은 10개)
// 다른 손님도 실시간으로 보임 (config.js에 Supabase 설정이 있으면 인터넷 전체, 없으면 같은 브라우저 탭끼리만)
// 캐릭터(BREEDS, drawPet)는 pets.js

const VIEW_W = 720;                // 화면 가로에 보이는 폭 (월드 단위)
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
const me = { id: myId, breed: Math.floor(Math.random() * BREEDS.length), scene: 'hall', x: ENTRY.x, y: ENTRY.y, tx: ENTRY.x, ty: ENTRY.y };   // 들어오면 입구에 서 있음
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
  if (me.scene === 'deal') return { title: '오늘의 타임딜', items: data.hall.items.slice(0, PER_ROOM), shelves: ROOM_SHELVES, deal: true };
  const room = data.rooms.find((r) => r.id === me.scene);
  return { title: room.title, items: hourPick(room), shelves: ROOM_SHELVES, room };
}
// 광장의 문들 (방 id, 이름, 위치)
function doors() {
  const list = [{ id: 'deal', title: '오늘의 타임딜', x: DEAL_DOOR.x, y: DEAL_DOOR.y, side: 'top' }];
  if (data) data.rooms.forEach((r, i) => list.push({ id: r.id, title: r.title, side: r.kind === 'dog' ? 'left' : 'right', x: r.kind === 'dog' ? 30 : PLAZA.w - 30, y: DOOR_YS[i % 4] }));
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
  if (cur) { cur.breed = p.breed; cur.seen = Date.now(); cur.goneAt = 0; return; }   // 이동은 Broadcast가 맡음
  peers.set(p.id, { breed: p.breed, x: p.tx, y: p.ty, tx: p.tx, ty: p.ty, seq: 0, seen: Date.now(), goneAt: 0 });
}
function onMove(m) {
  if (m.id === myId || m.scene !== me.scene) return;
  let cur = peers.get(m.id);
  if (!cur) { cur = { breed: m.breed, x: m.sx, y: m.sy, seq: 0 }; peers.set(m.id, cur); }
  if (m.seq <= cur.seq) return;   // 늦게 도착한 예전 이동은 무시
  if (Math.hypot(cur.x - m.sx, cur.y - m.sy) > 50) { cur.x = m.sx; cur.y = m.sy; }
  Object.assign(cur, { breed: m.breed, tx: m.tx, ty: m.ty, seq: m.seq, seen: Date.now(), goneAt: 0 });
  if (cur.act && cur.act.a === 'sleep') cur.act = null;   // 움직이면 잠에서 깸
}

// ---------- 말풍선: 정해진 문구만 (번호만 주고받아서 다른 글이 끼어들 수 없음) ----------
const PHRASES = ['(울음)', '이거 싸다', '득템했다', '어디 있어?', '같이 놀자', '같이 구경하자', '안녕', '배고파', '산책 가자', '다음 방 가자', '고마워', '잘 가'];
const speech = new Map();   // id → { text, until }
function phraseText(i, breed) {
  if (i === 0) return BREEDS[breed].kind === 'cat' ? '냥' : '멍멍';
  return PHRASES[i] ?? null;
}
function who(id) { return id === myId ? me : peers.get(id); }
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
  const cfg = window.DODUK || {};
  let seq = 0;
  const presence = () => ({ id: me.id, breed: me.breed, scene: me.scene, tx: Math.round(me.tx), ty: Math.round(me.ty), ts: Date.now() });
  const move = () => ({ id: me.id, breed: me.breed, scene: me.scene, sx: Math.round(me.x), sy: Math.round(me.y), tx: Math.round(me.tx), ty: Math.round(me.ty), seq: ++seq });
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
    onSay(myId, i); net.say(i);
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
    onAct(myId, d.a, px, py); net.act(d.a, px, py); net.send();
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
  if (doduk.complete && doduk.naturalWidth) {
    const h = 110, w = (doduk.naturalWidth / doduk.naturalHeight) * h;
    ctx.drawImage(doduk, c.x - w / 2, c.y - 30 - h + Math.sin(t * 3) * 2, w, h);
  }
  const lines = ['어서 와, 여긴 놀고 가는 광장이야', '위쪽 빨간 문은 오늘의 타임딜', '양옆 문은 강아지·고양이 방', '행동 버튼 눌러봐, 똥도 쌀 수 있어', '구경은 공짜, 살 때만 로그인'];
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

  const info = sceneInfo();
  const { w, h } = size();
  camX = w <= VIEW_W ? 0 : Math.max(0, Math.min(w - VIEW_W, me.x - VIEW_W / 2));
  camY = viewH >= h ? -(viewH - h) / 2 : Math.max(0, Math.min(h - viewH, me.y - viewH * 0.55));
  ctx.setTransform(scale, 0, 0, scale, -camX * scale, -camY * scale);
  ctx.clearRect(camX, camY, VIEW_W, viewH);
  if (isPlaza()) drawPlaza(t); else drawRoom(info);

  // 위쪽(y가 작은 것)부터 그려서 앞뒤가 자연스럽게 겹치게
  const items = info.shelves.map((s, i) => ({ y: s.y + 60, draw: () => drawShelf(s, info.items[i]) }));
  if (isPlaza() && !LINEUP) items.push({ y: BOOTH.y + 24, draw: () => drawBooth(t) });
  for (let i = poops.length - 1; i >= 0; i--) if (Date.now() > poops[i].until) poops.splice(i, 1);
  for (const pp of poops) if (pp.scene === me.scene) items.push({ y: pp.y - 1, draw: () => drawPoop(pp, t) });
  const tops = [];   // 말풍선을 맨 위에 그리려고 캐릭터 머리 위치를 모아 둠
  for (const [id, p] of peers) items.push({ y: p.y, draw: () => tops.push([id, p.x, drawActor(p, t, false)]) });
  items.push({ y: me.y, draw: () => tops.push([myId, me.x, drawActor(me, t, true)]) });
  items.sort((a, b) => a.y - b.y).forEach((it) => it.draw());
  for (const [id, x, top] of tops) {
    const s = speech.get(id);
    if (!s) continue;
    if (Date.now() > s.until) { speech.delete(id); continue; }
    ctx.font = '20px Jua'; ctx.textAlign = 'center';
    const bw = ctx.measureText(s.text).width + 24, by = top - 40;
    rr(x - bw / 2, by, bw, 34, 14); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#1f1f22'; ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 6, by + 33); ctx.lineTo(x, by + 42); ctx.lineTo(x + 6, by + 33); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1f1f22'; ctx.fillText(s.text, x, by + 24);
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
