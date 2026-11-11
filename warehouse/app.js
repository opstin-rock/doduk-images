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
// 타임딜 방은 스레드 글에서 '여기 오면 있다'고 안내하므로 오늘 특가를 전부 진열 (3줄 x 5칸 = 최대 15개, 조금 작게)
const DEAL_SHELVES = ROWS.flatMap((y) => [{ x: 125, y, k: 0.85 }, { x: 360, y, k: 0.85 }, { x: 595, y, k: 0.85 }]);
const SPOT = { x: 140, y: 700, w: 440, h: 230 };              // 포토존 발자국 자리

// ---------- 화면 ----------
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let dpr = 1, scale = 1, viewH = 1240, camX = 0, camY = 0;
function resize() {
  // PC에서는 화면 가운데 폰 크기(최대 520px)로만 그림
  dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = (canvas.clientHeight || innerHeight) * dpr;   // 실제 보이는 높이 (--vh)
  scale = (canvas.clientWidth / VIEW_W) * dpr;
  viewH = canvas.height / scale;
}
addEventListener('resize', resize);
if (window.visualViewport) visualViewport.addEventListener('resize', () => setTimeout(resize, 50));
resize();

// ---------- 나 ----------
const myId = Math.random().toString(36).slice(2, 10);
const me = { id: myId, breed: Math.floor(Math.random() * BREEDS.length), scene: 'hall', x: ENTRY.x, y: ENTRY.y, tx: ENTRY.x, ty: ENTRY.y, acc: '' };
try { me.acc = localStorage.getItem('doduk-acc') || ''; } catch {}   // 옷장에서 고른 소품은 다음에 와도 유지   // 들어오면 입구에 서 있음
try { const b = Number(localStorage.getItem('doduk-breed')); if (localStorage.getItem('doduk-breed') !== null && BREEDS[b]) me.breed = b; } catch {}   // 지난번에 고른 품종
me.name = window.Score ? Score.myName() : '';   // 순위판 별명 (없으면 품종 이름으로 보임)
const nameOk = (n) => !!(window.Score && Score.nameOk(n));   // 다른 손님이 보낸 이름도 같은 규칙으로 거름
const meText = () => `나: ${me.name || BREEDS[me.breed].name}`;
document.getElementById('me').textContent = meText();
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
  if (isPlaza()) return { title: '도둑냥 오락실', items: [], shelves: [] };
  if (!data) return { title: '', items: [], shelves: ROOM_SHELVES };
  if (me.scene === 'field') return { title: '운동장', items: [], shelves: [], field: true };
  if (me.scene === 'dance') return { title: '댄스장', items: [], shelves: [], dance: true };
  if (me.scene === 'photo') return { title: '포토존', items: [], shelves: [], photo: true };
  if (me.scene === 'deal') { const items = data.hall.items.slice(0, DEAL_SHELVES.length); return { title: '오늘의 타임딜', items, shelves: DEAL_SHELVES.slice(0, Math.max(1, items.length)), deal: true }; }
  const room = data.rooms.find((r) => r.id === me.scene);
  return { title: room.title, items: hourPick(room), shelves: ROOM_SHELVES, room };
}
// 광장의 문들 (방 id, 이름, 위치)
function doors() {
  // 2026-11-09 광장을 통째로 오락실로 바꾸면서 타임딜·포토존·댄스장·운동장 문을 모두 뺌 (방 코드는 남아 있지만 갈 수 없음)
  return [];
}

// ---------- 다른 손님 (실시간, 같은 장소에 있는 손님만) ----------
// Presence(접속자 목록): 누가 들어오고 나갔는지, 품종, 마지막 목표 위치 (늦게 들어온 사람용)
// Broadcast(즉시 메시지): 이동, 말풍선, 행동
// extras.js(미니게임·트리 등)가 끼어드는 자리: 광장 그리기, 매 프레임, 실시간 메시지
const plazaHooks = [], frameHooks = [], extraHandlers = {};
const peers = new Map();   // id → { breed, x, y, tx, ty, seq, seen, goneAt, act }
const okBreed = (n) => (Number.isInteger(n) && BREEDS[n] ? n : 0);   // 모르는 품종 번호(옛 화면·새 화면 섞임)는 0번으로
function onPeer(p) {
  if (p.id === myId) return;
  p.breed = okBreed(p.breed);
  if (p.scene !== me.scene) { peers.delete(p.id); return; }
  const cur = peers.get(p.id);
  const name = nameOk(p.name) ? p.name : '';
  if (cur) { cur.breed = p.breed; cur.acc = p.acc; cur.name = name; cur.seen = Date.now(); cur.goneAt = 0; return; }   // 이동은 Broadcast가 맡음
  peers.set(p.id, { breed: p.breed, acc: p.acc, name, x: p.tx, y: p.ty, tx: p.tx, ty: p.ty, seq: 0, seen: Date.now(), goneAt: 0 });
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
  m.breed = okBreed(m.breed);
  let cur = peers.get(m.id);
  if (!cur) { cur = { breed: m.breed, x: m.sx, y: m.sy, seq: 0 }; peers.set(m.id, cur); greetNewcomer(); }
  if (m.seq <= cur.seq) return;   // 늦게 도착한 예전 이동은 무시
  if (Math.hypot(cur.x - m.sx, cur.y - m.sy) > 50) { cur.x = m.sx; cur.y = m.sy; }
  Object.assign(cur, { breed: m.breed, acc: m.acc ?? cur.acc, name: m.name === undefined ? cur.name : nameOk(m.name) ? m.name : '', tx: m.tx, ty: m.ty, seq: m.seq, seen: Date.now(), goneAt: 0 });
  if (cur.act && cur.act.a === 'sleep') cur.act = null;   // 움직이면 잠에서 깸
}

// ---------- 말풍선: 정해진 문구만 (번호만 주고받아서 다른 글이 끼어들 수 없음) ----------
const PHRASES = ['(울음)', '한 판 하자', '내가 이겼다', '어디 있어?', '같이 놀자', '같이 하자', '안녕', '배고파', '콤보 터졌다', '다음 게임 가자', '고마워', '잘 가'];
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
  const presence = () => ({ id: me.id, breed: me.breed, acc: me.acc, name: me.name || '', scene: me.scene, tx: Math.round(me.tx), ty: Math.round(me.ty), ts: Date.now() });
  const move = () => ({ id: me.id, breed: me.breed, acc: me.acc, name: me.name || '', scene: me.scene, sx: Math.round(me.x), sy: Math.round(me.y), tx: Math.round(me.tx), ty: Math.round(me.ty), seq: ++seq });
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
      ch.on('broadcast', { event: 'snack' }, ({ payload }) => onSnack(payload));
      ch.on('broadcast', { event: 'ext' }, ({ payload }) => extraHandlers[payload.k]?.(payload));
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
      snack(s) { bcast('snack', s); },
      ext(k, s) { bcast('ext', { ...s, k }); },
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
    else if (d.type === 'snack') { if (d.scene === me.scene) onSnack(d); }
    else if (d.type === 'ext') { if (d.scene === me.scene) extraHandlers[d.k]?.(d); }
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
    snack(s) { bc.postMessage({ type: 'snack', scene: me.scene, ...s }); },
    ext(k, s) { bc.postMessage({ type: 'ext', scene: me.scene, ...s, k }); },
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
function buildButtons() {
phrasesEl.innerHTML = ''; actionsEl.innerHTML = '';
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
}
buildButtons();

// ---------- 입장: 품종 직접 고르기 (11.10 대표님: 처음에 자유롭게 캐릭터 선택). 왼쪽 위 "나: ..." 누르면 다시 고름 ----------
const chooserEl = document.getElementById('chooser');
const meChip = document.getElementById('me');
// 얼굴 아이콘 (품종 고르기·옷장 공용): 머리만 가운데에, acc가 있으면 소품까지
function faceIcon(cv, breed, acc) {
  const dpr2 = 2, w = cv.clientWidth || 54, h = cv.clientHeight || 54;
  cv.width = w * dpr2; cv.height = h * dpr2;
  const q = cv.getContext('2d'); q.setTransform(dpr2, 0, 0, dpr2, 0, 0); q.clearRect(0, 0, w, h);
  const b = BREEDS[breed], headR = b.headR ?? 16, snout = b.snout ?? (b.kind === 'dog' ? 7 : 0);
  const k = Math.min(w / (headR * 2.6 + snout + 10), h / (headR * 2.9 + 16));
  q.save(); q.translate(w / 2, h * 0.58); q.scale(k, k);
  q.lineWidth = 2.4; q.strokeStyle = '#2a2420'; q.lineJoin = 'round'; q.lineCap = 'round';
  const hx = -(snout - headR * 0.17) / 2;
  drawHead(q, b, hx, 0, headR, b.head ?? b.base, snout, 0.3, breed);
  if (acc) drawAccessory(q, acc, hx, 0, headR);
  q.restore();
}
// 고르는 칸이 좁아서 긴 품종 이름은 자연스러운 자리에서 두 줄로 (11.11 대표님: 글씨 잘림)
const PICK_SPLIT = { 이탈리안그레이하운드: '이탈리안 그레이하운드', 시베리안허스키: '시베리안 허스키', 베들링턴테리어: '베들링턴 테리어',
  미니어처슈나우저: '미니어처 슈나우저', 브리티시숏헤어: '브리티시 숏헤어', 아메리칸숏헤어: '아메리칸 숏헤어', 엑조틱숏헤어: '엑조틱 숏헤어',
  골든리트리버: '골든 리트리버', 요크셔테리어: '요크셔 테리어', 잉글리시불독: '잉글리시 불독', 그레이트데인: '그레이트 데인', 프렌치불독: '프렌치 불독',
  스코티시폴드: '스코티시 폴드', 터키시앙고라: '터키시 앙고라', 노르웨이숲: '노르웨이 숲', 시고르자브종: '시고르 자브종', 포메라니안: '포메 라니안', 러시안블루: '러시안 블루', 아비시니안: '아비 시니안' };
const pickLabel = (n) => (PICK_SPLIT[n] ? PICK_SPLIT[n].replace(' ', '<wbr>') : n);   // 눈에 안 보이는 줄바꿈 자리 (한 줄에 들어가면 붙여서 보임)
let pickTab = BREEDS[me.breed].kind, pickIdx = me.breed;
const breedGrid = document.getElementById('breedGrid');
function renderPick() {
  chooserEl.querySelectorAll('.tabs button').forEach((t) => t.classList.toggle('on', t.dataset.tab === pickTab));
  breedGrid.innerHTML = '';
  // 믹스·토종개·길고양이를 맨 앞에 (PICK_FIRST 순서), 나머지는 원래 순서
  const order = BREEDS.map((b, i) => i).sort((a, c) => {
    const ra = PICK_FIRST.indexOf(BREEDS[a].name), rc = PICK_FIRST.indexOf(BREEDS[c].name);
    return (ra < 0 ? 999 + a : ra) - (rc < 0 ? 999 + c : rc);
  });
  order.forEach((i) => {
    const b = BREEDS[i];
    if (b.kind !== pickTab) return;
    const btn = document.createElement('button');
    btn.className = i === pickIdx ? 'on' : '';
    btn.innerHTML = `<canvas></canvas><span class="nm">${pickLabel(b.name)}</span>`;
    btn.onclick = () => { pickIdx = i; renderPick(); };
    breedGrid.appendChild(btn);
    faceIcon(btn.querySelector('canvas'), i, me.acc);
  });
}
function applyBreed(i) {
  me.breed = i;
  try { localStorage.setItem('doduk-breed', String(i)); } catch {}
  meChip.textContent = meText();
  buildButtons(); net.send();
  chooserEl.classList.remove('open');
  speech.set(myId, { text: phraseText(0, me.breed), until: Date.now() + 1800 });
}
// 별명 (11.10 대표님: 겹치지 않는 아이디 + 게임별 순위판). 비워 두면 별명 없이 들어감
const nickInput = document.getElementById('nickInput'), nickMsg = document.getElementById('nickMsg');
let entering = false;
async function enter(i) {
  if (entering) return;
  const n = (nickInput.value || '').trim();
  if (n && n !== me.name) {
    if (!window.Score) { nickMsg.textContent = '별명은 잠시 뒤에 다시 정해 줘'; }
    else {
      entering = true; nickMsg.textContent = '별명 확인 중';
      const r = await Score.setName(n);
      entering = false;
      if (r.ok) { me.name = r.name; nickMsg.textContent = ''; }
      else if (r.reason !== 'net') { nickMsg.textContent = Score.nameMsg(r.reason); nickInput.focus(); return; }   // 겹치거나 안 되는 말이면 다시
      else speech.set(myId, { text: '연결이 안 돼서 별명은 나중에', until: Date.now() + 2500 });
    }
  }
  applyBreed(i);
}
function setKind(kind) {   // 그 종류 안에서 아무나
  const list = BREEDS.map((b, i) => i).filter((i) => !kind || BREEDS[i].kind === kind);
  return list[Math.floor(Math.random() * list.length)];
}
chooserEl.querySelectorAll('.tabs button').forEach((t) => { t.onclick = () => { pickTab = t.dataset.tab; renderPick(); }; });
document.getElementById('pickRandom').onclick = () => enter(setKind(pickTab));
document.getElementById('pickGo').onclick = () => enter(pickIdx);
nickInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); enter(pickIdx); } });
function openChooser() {
  pickTab = BREEDS[me.breed].kind; pickIdx = me.breed;
  nickInput.value = me.name || ''; nickMsg.textContent = '';
  chooserEl.classList.add('open'); renderPick();
}
meChip.style.cursor = 'pointer';
meChip.onclick = openChooser;
if (!location.search.match(/film|lineup|demo/)) openChooser();
// 다른 곳(게임 결과창)에서 별명을 정하면 여기도 바꿈
function setMyName(n) { if (!nameOk(n)) return; me.name = n; meChip.textContent = meText(); net.send(); }
// 다른 폰·예전 기록에서 서버에 별명이 있으면 맞춤
if (window.Score) Score.myInfo().then((r) => { if (r && r.ok && r.name && r.name !== me.name) { try { localStorage.setItem('doduk-name', JSON.stringify(r.name)); } catch {} setMyName(r.name); } });

// ---------- 폰 뒤로가기: 열린 창(게임·순위판·옷장)만 닫고 오락실은 그대로 (예전엔 사이트를 나가 버림) ----------
const layers = [];
let skipPop = 0;
function openLayer(close) { layers.push(close); try { history.pushState({ doduk: layers.length }, ''); } catch {} }
// 화면의 닫기 버튼으로 닫을 때: 바로 닫고, 쌓아 둔 기록 한 칸도 같이 지움
function closeLayer(close) {
  const i = layers.lastIndexOf(close);
  close();
  if (i < 0) return;
  layers.splice(i, 1); skipPop++;
  try { history.back(); } catch { skipPop--; }
}
addEventListener('popstate', () => { if (skipPop) { skipPop--; return; } const c = layers.pop(); if (c) c(); });

// ---------- 순위판: 게임마다 각자 최고 점수 ----------
const rankEl = document.getElementById('rankBox'), rankList = document.getElementById('rankList');
let rankGame = 'sacheon';
function renderRank() {
  rankEl.querySelectorAll('#rankTabs button').forEach((t) => t.classList.toggle('on', t.dataset.game === rankGame));
  if (window.Score) Score.renderBoard(rankList, rankGame, { limit: 10 }).then(() => { if (Score.myName() && Score.myName() !== me.name) setMyName(Score.myName()); });
  else rankList.textContent = '아직 못 불러왔어';
}
rankEl.querySelectorAll('#rankTabs button').forEach((t) => { t.onclick = () => { rankGame = t.dataset.game; renderRank(); }; });
const closeRank = () => rankEl.classList.remove('open');
document.getElementById('rankBtn').onclick = () => { if (!rankEl.classList.contains('open')) openLayer(closeRank); rankEl.classList.add('open'); renderRank(); };
document.getElementById('rankClose').onclick = () => closeLayer(closeRank);

// ---------- 옷장: 끝낸 게임 판 수만큼 소품이 풀림 (게임 쪽에서 doduk-games-done 을 올림) ----------
const wardEl = document.getElementById('wardrobe');
const gamesDone = () => { try { return Number(localStorage.getItem('doduk-games-done')) || 0; } catch { return 0; } };
// 잠긴 소품도 모양·이름을 다 보여 줌 (11.10 대표님: 뭐가 있는지 알아야 함). 누르면 위 미리보기에 입혀 봄
let peekAcc = null;
const escHtml = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
function drawWardPreview(acc) {
  const pv = document.getElementById('wardPreview'), q = pv.getContext('2d');
  q.setTransform(1, 0, 0, 1, 0, 0); q.clearRect(0, 0, pv.width, pv.height);
  drawPet(q, { breed: me.breed, acc, x: pv.width / 2 - 10, y: pv.height - 22, tx: pv.width / 2 - 10, ty: pv.height - 22, face: 1, noTag: true }, performance.now() / 1000, false);
}
function renderWardrobe() {
  const n = gamesDone(), next = ACCESSORIES.find((a) => a.need > n);
  const info = document.getElementById('wardInfo');
  const peek = peekAcc && ACCESSORIES.find((a) => a.id === peekAcc);
  if (peek) info.innerHTML = `<b>${escHtml(peek.name)}</b> 미리 입어 보는 중 · 게임 <b>${peek.need - n}판</b> 더 하면 입을 수 있어`;
  else info.innerHTML = `끝낸 게임 <b>${n}판</b>${next ? ` · ${next.need - n}판 더 하면 ${escHtml(next.name)}` : ' · 다 풀었어'}<br>잠긴 것도 눌러서 미리 입어 볼 수 있어`;
  drawWardPreview(peek ? peek.id : me.acc);
  const grid = document.getElementById('accGrid'), scroller = grid.closest('.box'), keep = scroller.scrollTop; grid.innerHTML = '';
  for (const a of ACCESSORIES) {
    const open = n >= (a.need || 0);
    const btn = document.createElement('button');
    btn.className = `${a.id === me.acc && !peek ? 'on' : ''} ${open ? '' : 'locked'} ${a.id === peekAcc ? 'peek' : ''}`;
    btn.innerHTML = `<canvas></canvas>${escHtml(a.name)}${open ? '' : `<span class="need">${a.need}판</span>`}`;
    btn.onclick = () => {
      if (!open) { peekAcc = peekAcc === a.id ? null : a.id; renderWardrobe(); return; }
      peekAcc = null;
      me.acc = a.id; try { localStorage.setItem('doduk-acc', a.id); } catch {}
      net.send(); renderWardrobe();
    };
    grid.appendChild(btn);
    faceIcon(btn.querySelector('canvas'), me.breed, a.id);
  }
  scroller.scrollTop = keep;   // 고를 때마다 맨 위로 튀지 않게
}
const closeWard = () => { peekAcc = null; wardEl.classList.remove('open'); if (me.acc) speech.set(myId, { text: '어때', until: Date.now() + 1500 }); };
document.getElementById('wardBtn').onclick = () => { peekAcc = null; if (!wardEl.classList.contains('open')) openLayer(closeWard); wardEl.classList.add('open'); renderWardrobe(); };
document.getElementById('wardClose').onclick = () => closeLayer(closeWard);
// 예전에 고른 소품이 아직 안 풀린 거면 벗김 (판 수 기준이 새로 생겨서)
{ const a = ACCESSORIES.find((x) => x.id === me.acc); if (a && gamesDone() < (a.need || 0)) { me.acc = ''; try { localStorage.setItem('doduk-acc', ''); } catch {} } }
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
// 옛 브라우저(PointerEvent 없음, iOS 12 이하 등)는 touchstart·mousedown 으로 받음
function floorTap(clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  canvas.dispatchEvent(Object.assign(new Event('floortap'), { offsetX: clientX - r.left, offsetY: clientY - r.top }));
}
if (!window.PointerEvent) {
  canvas.addEventListener('touchstart', (e) => { const t = e.changedTouches[0]; floorTap(t.clientX, t.clientY); }, { passive: true });
  canvas.addEventListener('mousedown', (e) => floorTap(e.clientX, e.clientY));
}
canvas.addEventListener('floortap', (e) => onFloor(e));
canvas.addEventListener('pointerdown', (e) => onFloor(e));
function onFloor(e) {
  const { w, h } = size();
  const wx = (e.offsetX * dpr) / scale + camX;
  const wy = (e.offsetY * dpr) / scale + camY;
  me.tx = Math.max(24, Math.min(w - 24, wx));
  me.ty = Math.max(isPlaza() ? 210 : 200, Math.min(h - 14, wy));
  if (me.act && me.act.a === 'sleep') me.act = null;
  net.send();
  hint.style.opacity = 0;
  phrasesEl.classList.remove('open'); actionsEl.classList.remove('open');
}

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

// ---------- 광장 = 도둑냥 오락실 (2026-11-09) ----------
// 바닥: 오락실 카펫 (어두운 남색 + 형광 무늬). 처음 한 번만 그려 두고 복사해서 씀
const NEON = ['#FF5DA2', '#3EE6C8', '#FFD54A', '#7C8CFF', '#FF8A3D'];
let carpet = null;
function carpetCanvas() {
  if (carpet) return carpet;
  const c = document.createElement('canvas'); c.width = PLAZA.w; c.height = PLAZA.h - 190;
  // 11.10 대표님 "정신없다" → 무늬를 확 줄이고 흐리게. 큰 타일 줄 + 드문드문 작은 별만
  const g = c.getContext('2d');
  g.fillStyle = '#262046'; g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = 'rgba(255,255,255,.05)'; g.lineWidth = 2;
  for (let x = 0; x <= c.width; x += 120) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, c.height); g.stroke(); }
  for (let y = 0; y <= c.height; y += 120) { g.beginPath(); g.moveTo(0, y); g.lineTo(c.width, y); g.stroke(); }
  let s = 7; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < 70; i++) {
    const x = rnd() * c.width, y = rnd() * c.height, r = 2 + rnd() * 2.5;
    g.globalAlpha = 0.18 + rnd() * 0.12; g.fillStyle = NEON[i % NEON.length];
    g.beginPath(); for (let j = 0; j < 8; j++) { const a = (j / 8) * Math.PI * 2, rr2 = j % 2 ? r * 0.4 : r * 1.6; g.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); } g.closePath(); g.fill();
  }
  g.globalAlpha = 1;
  return (carpet = c);
}
function drawPlaza(t) {
  const { w, h } = PLAZA;
  ctx.fillStyle = '#15112b'; ctx.fillRect(-2000, -2000, w + 4000, h + 4000);
  ctx.drawImage(carpetCanvas(), 0, 190);
  // 벽: 어두운 벽 + 깜빡이는 형광 띠와 전구
  ctx.fillStyle = '#1B1638'; ctx.fillRect(0, 0, w, 190);
  for (let i = 0; i < 5; i++) { ctx.fillStyle = NEON[(i + Math.floor(t * 2)) % NEON.length]; ctx.globalAlpha = 0.85; ctx.fillRect(i * (w / 5), 178, w / 5, 8); }
  ctx.globalAlpha = 1;
  for (let x = 30; x < w; x += 60) { const on = Math.sin(t * 3 + x * 0.05) > 0; ctx.fillStyle = on ? '#FFD54A' : 'rgba(255,213,74,.2)'; ctx.beginPath(); ctx.arc(x, 150, 5, 0, Math.PI * 2); ctx.fill(); }
  // 간판
  ctx.textAlign = 'center'; ctx.font = '38px Jua';
  const title = '도둑냥 오락실', tw = ctx.measureText(title).width + 70;
  rr(w / 2 - tw / 2, 20, tw, 70, 16); ctx.fillStyle = '#2B2622'; ctx.fill();
  ctx.strokeStyle = NEON[Math.floor(t * 1.5) % NEON.length]; ctx.lineWidth = 4; ctx.stroke();
  ctx.save(); ctx.shadowColor = '#FFD54A'; ctx.shadowBlur = 14; ctx.fillStyle = '#FFD54A'; ctx.fillText(title, w / 2, 70); ctx.restore();
  label('입구', ENTRY.x, h - 60, '#C0563E', '#fff', '20px Jua');
}

function drawRoom(info) {
  const kindFloor = info.deal ? '#F3E3C2' : info.room?.kind === 'dog' ? '#E6E1CC' : '#EADCD6';
  drawWallAndFloor(ROOM.w, ROOM.h, kindFloor, info.title, info.deal ? '오늘만 이 가격' : '1시간마다 진열이 바뀌어');
  rr(EXIT.x - 85, ROOM.h - 46, 170, 36, 10); ctx.fillStyle = '#2B2622'; ctx.fill();
  ctx.fillStyle = '#FFD54A'; ctx.font = '19px Jua'; ctx.textAlign = 'center'; ctx.fillText('광장으로 나가기', EXIT.x, ROOM.h - 21);
}

function drawShelf(s, d) {
  if (s.k) { ctx.save(); ctx.translate(s.x, s.y); ctx.scale(s.k, s.k); ctx.translate(-s.x, -s.y); drawShelf({ x: s.x, y: s.y }, d); ctx.restore(); return; }
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
  const lines = ['어서 와, 여긴 도둑냥 오락실이야', '게임기 앞에 서면 바로 할 수 있어', '게임 한 판 끝내면 간식 한 알이 모여', '300알 모이면 간식을 보호소로 보내', '매시 정각엔 간식 타임, 1분 동안 많이 주워', '행동 버튼 눌러봐, 똥도 쌀 수 있어', '똥 싸면 빗자루가 치워', '물음표 게임기는 곧 열려'];
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
  if (!a && isDance() && Math.hypot(p.tx - p.x, p.ty - p.y) < 2) {
    const b = beatAt(t) + (p.breed % 4) * 0.25;
    ctx.translate(0, -Math.abs(Math.sin(b * Math.PI)) * 12);
    p.face = Math.floor(b / 2) % 2 ? -1 : 1;
  }
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

// 한국 시간 기준 날짜 번호 (점집 등 하루 단위 기능에 씀)
const dayKey = () => Math.floor((Date.now() + 9 * 3600000) / 86400000);

// ---------- 댄스장: 들어오면 모두 박자에 맞춰 들썩임 (주민 댄서도 있음) ----------
const BPM = 120;
const beatAt = (t) => (t * BPM) / 60;
const isDance = () => me.scene === 'dance';
function drawDance(t) {
  const { w, h } = ROOM, b = beatAt(t), bi = Math.floor(b);
  drawWallAndFloor(w, h, '#1E1A2E', '댄스장', '들어오면 다 같이 춤춰 · 행동 버튼도 돼');
  // 반짝이는 바닥 타일
  const cols = ['#E8402F', '#FFD54A', '#7B9E6B', '#8FC9E8', '#C57B88', '#9B7BE0'];
  const S = 90;
  for (let y = 230, j = 0; y < h - 70; y += S, j++) for (let x = 0, i = 0; x < w; x += S, i++) {
    const on = (i + j + bi) % 3 === 0;
    ctx.fillStyle = on ? cols[(i * 3 + j + bi) % cols.length] : '#2A2440';
    ctx.globalAlpha = on ? 0.55 + 0.25 * (1 - (b % 1)) : 1;
    ctx.fillRect(x + 3, y + 3, S - 6, S - 6);
  }
  ctx.globalAlpha = 1;
  // 미러볼과 빛 조각
  ctx.strokeStyle = '#888'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(w / 2, 190); ctx.lineTo(w / 2, 214); ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.arc(w / 2, 250, 38, 0, Math.PI * 2); ctx.fillStyle = '#C9CCD6'; ctx.fill(); ctx.clip();
  for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) { ctx.fillStyle = (i + j + bi) % 2 ? '#F4F6FA' : '#9EA3B0'; ctx.fillRect(w / 2 + i * 10 - ((t * 20) % 10), 250 + j * 10, 9, 9); }
  ctx.restore();
  ctx.strokeStyle = '#2a2420'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(w / 2, 250, 38, 0, Math.PI * 2); ctx.stroke();
  for (let i = 0; i < 14; i++) {
    const a = i * 2.4 + t * 0.6, r = 160 + (i % 5) * 80;
    ctx.fillStyle = `rgba(255,255,255,${0.18 + 0.12 * Math.sin(t * 3 + i)})`;
    ctx.beginPath(); ctx.ellipse(w / 2 + Math.cos(a) * r, 700 + Math.sin(a) * r * 0.55, 9, 5, 0, 0, Math.PI * 2); ctx.fill();
  }
  // 스피커
  for (const x of [40, w - 40]) {
    const pump = 1 + 0.06 * Math.max(0, 1 - (b % 1) * 3);
    rr(x - 34, 300, 68, 120, 8); ctx.fillStyle = '#2B2622'; ctx.fill(); ctx.strokeStyle = '#111'; ctx.stroke();
    ctx.fillStyle = '#555'; ctx.beginPath(); ctx.arc(x, 335, 18 * pump, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x, 385, 24 * pump, 0, Math.PI * 2); ctx.fill();
  }
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
// 스레드·인스타·카톡 같은 앱 안 브라우저는 "저장하기"(다운로드)를 막음 → 그때는 사진을 꾹 눌러 저장하게 안내
// 사진은 blob 주소 대신 data 주소로 넣어야 앱 안 브라우저에서도 꾹 눌러 저장이 됨 (11.04 "저장이 안돼" 신고)
const IN_APP = /Instagram|Barcelona|FBAN|FBAV|KAKAOTALK|NAVER|Line\/|DaumApps|everytimeApp|; wv\)/i.test(navigator.userAgent);
function showPhoto(canvasEl) {
  const dataUrl = canvasEl.toDataURL('image/jpeg', 0.92);
  document.getElementById('pImg').src = dataUrl;
  const save = document.getElementById('pSave');
  save.href = dataUrl; save.download = `doduk-${BREEDS[me.breed].name}.jpg`;
  save.style.display = IN_APP ? 'none' : '';
  const tip = document.querySelector('#photo .login');
  tip.textContent = IN_APP ? '위 사진을 꾹 눌러서 "이미지 저장"을 눌러줘' : '저장이 안 되면 사진을 꾹 눌러서 저장해줘';
  tip.classList.toggle('strong', IN_APP);
  document.getElementById('pShare').style.display = 'none';
  canvasEl.toBlob((blob) => {
    photoBlob = blob;
    const file = new File([blob], 'doduk.jpg', { type: 'image/jpeg' });
    document.getElementById('pShare').style.display = navigator.canShare && navigator.canShare({ files: [file] }) ? '' : 'none';
  }, 'image/jpeg', 0.92);
  photoEl.classList.add('open');
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
  const file = new File([photoBlob], 'doduk.jpg', { type: 'image/jpeg' });
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
// 혼자 움직이는 빗자루 (2026-11-09: 빗자루 든 도둑냥 대신 빗자루만). 바닥에 닿는 솔 끝이 기준점
function drawBot(t, now) {
  const h = 104;
  const cleaning = bot.cleanUntil > now;
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(bot.x, bot.y, 26, 8, 0, 0, Math.PI * 2); ctx.fill();
  const hop = bot.walking ? Math.abs(Math.sin(t * 12)) * 12 : 0;               // 이동: 콩콩 뛰기
  const tilt = cleaning ? Math.sin(t * 18) * 0.55                              // 청소: 좌우로 쓱쓱
    : bot.walking ? Math.sin(t * 12) * 0.15 : 0.12 + Math.sin(t * 2) * 0.04;   // 쉴 때: 살짝 기대 서기
  ctx.save(); ctx.translate(bot.x, bot.y - hop); ctx.rotate(tilt); ctx.scale(1.25, 1.25);   // 잘 보이게 조금 크게
  ctx.strokeStyle = '#2a2420'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
  // 자루
  ctx.fillStyle = '#A8754A'; rr(-4, -h, 8, h - 30, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#E8402F'; rr(-6, -h, 12, 8, 3); ctx.fill(); ctx.stroke();   // 손잡이 끝
  // 묶은 끈
  ctx.fillStyle = '#E8402F'; rr(-13, -34, 26, 8, 3); ctx.fill(); ctx.stroke();
  // 솔
  ctx.beginPath(); ctx.moveTo(-12, -27); ctx.lineTo(12, -27); ctx.lineTo(22, 0); ctx.lineTo(-22, 0); ctx.closePath();
  ctx.fillStyle = '#E8C46A'; ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(138,92,55,.6)'; ctx.lineWidth = 1.5;
  for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * 3.2, -25); ctx.lineTo(i * 6.4, -2); ctx.stroke(); }
  ctx.restore();
  // 쓸 때 먼지
  if (cleaning) {
    ctx.fillStyle = 'rgba(200,190,170,.7)';
    for (let i = 0; i < 4; i++) { const k = ((t * 2 + i / 4) % 1); ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.arc(bot.x + (i % 2 ? 1 : -1) * (14 + k * 26), bot.y - 6 - k * 18, 4 + k * 5, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
  }
  // 반짝이
  ctx.fillStyle = '#FFD54A';
  bot.sparkles = bot.sparkles.filter((s) => now - s.start < 700);
  for (const s of bot.sparkles) {
    const k = (now - s.start) / 700, r = 10 + k * 34;
    ctx.globalAlpha = 1 - k;
    ctx.beginPath(); ctx.arc(s.x + Math.cos(s.a) * r, s.y + Math.sin(s.a) * r * 0.6, 5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  return bot.y - h * 1.25 - 6 - hop;
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

// ---------- 간식 타임: 매시 정각부터 1분 동안 광장에 간식이 떨어짐 ----------
// 간식 위치·시간은 그 시각(한국 시간)으로 정해져서 모두에게 같음. 누가 주웠는지는 실시간으로 알려서 같이 사라짐
// 주민(봇)도 간식을 주우러 다님 (주민 몫은 각자 화면에서만). 실제 경품 없음
// 시험: 주소에 ?snacktest 붙이면 3초 뒤 시작
const SNACK_DUR = 60000, SNACK_COUNT = 70, SNACK_LIFE = 8000, SNACK_FALL = 600;
const snackTest = location.search.includes('snacktest') ? Date.now() + 3000 : 0;
let snack = { round: -1, list: [], taken: new Map(), scores: new Map(), result: null };
function snackClock(now = Date.now()) {
  if (snackTest) {
    const into = now - snackTest;
    return { round: 1, into, active: into >= 0 && into < SNACK_DUR, soon: into < 0, left: -into };
  }
  const kst = now + 9 * 3600000;
  const into = kst % 3600000;
  return { round: Math.floor(kst / 3600000), into, active: into < SNACK_DUR, soon: 3600000 - into < 120000, left: 3600000 - into };
}
function snackReset(round) {
  const rnd = seeded(round * 7919 + 13);
  const list = [];
  for (let i = 0; i < SNACK_COUNT; i++) {
    let x = 180 + rnd() * 1080, y = 380 + rnd() * 1180;
    if (Math.hypot(x - FOUNTAIN.x, y - FOUNTAIN.y) < 170) x += x < FOUNTAIN.x ? -180 : 180;
    list.push({ i, x, y, at: i * ((SNACK_DUR - 9000) / SNACK_COUNT) + rnd() * 500, type: Math.floor(rnd() * 4) });
  }
  if (snack.round >= 0 && snack.scores.size && !snack.result) snackFinish();
  snack = { round, list, taken: new Map(), scores: new Map(), result: null };
}
function snackName(id) {
  const p = who(id);
  if (!p) return '누군가';
  return id === myId ? `나 · ${BREEDS[p.breed].name}` : p.npc ? `주민 · ${BREEDS[p.breed].name}` : BREEDS[p.breed].name;
}
function takeSnack(i, id) {
  if (snack.taken.has(i)) return false;
  snack.taken.set(i, id);
  snack.scores.set(id, (snack.scores.get(id) || 0) + 1);
  return true;
}
function onSnack(m) {
  if (m.round !== snack.round) return;
  takeSnack(m.i, m.id);
}
const visibleSnacks = (into) => snack.list.filter((s) => into >= s.at && into < s.at + SNACK_LIFE && !snack.taken.has(s.i));
function ranking() { return [...snack.scores.entries()].sort((a, b) => b[1] - a[1]); }
function snackFinish() {
  const r = ranking();
  snack.result = { until: Date.now() + 9000, top: r.slice(0, 3).map(([id, n]) => [snackName(id), n]), mine: snack.scores.get(myId) || 0, first: r[0] && r[0][0] === myId };
  if (snack.result.first && isPlaza()) speech.set(myId, { text: '1등', until: Date.now() + 3000 });
}
function snackStep() {
  const c = snackClock();
  if (c.active && c.round !== snack.round) snackReset(c.round);
  if (!c.active && snack.round === c.round && !snack.result && c.into >= SNACK_DUR) snackFinish();
  if (!c.active || !isPlaza()) return;
  for (const s of visibleSnacks(c.into)) {
    if (c.into - s.at < SNACK_FALL) continue;   // 아직 떨어지는 중
    if (Math.hypot(me.x - s.x, me.y - s.y) < 44) {
      if (takeSnack(s.i, myId)) { net.snack({ id: myId, i: s.i, round: snack.round }); speech.set(myId, { text: `냠 ${snack.scores.get(myId)}`, until: Date.now() + 700 }); }
      continue;
    }
    for (const [id, p] of activeNpcs()) if (Math.hypot(p.x - s.x, p.y - s.y) < 40) { takeSnack(s.i, id); break; }
  }
}
// 주민이 간식 쪽으로 달려가게 (간식 타임 중이면 true)
function snackSteer(p, now) {
  const c = snackClock();
  if (!c.active || !isPlaza()) return false;
  if (now < (p.snackNext || 0)) return true;
  p.snackNext = now + rndIn(500, 1100);
  let best = null, bd = 700;
  for (const s of visibleSnacks(c.into)) { const d = Math.hypot(p.x - s.x, p.y - s.y); if (d < bd) { bd = d; best = s; } }
  if (best) { p.tx = best.x + rndIn(-10, 10); p.ty = best.y + rndIn(-6, 6); p.act = null; }
  return true;
}
function drawSnack(s, into) {
  const k = Math.min(1, (into - s.at) / SNACK_FALL), fade = Math.min(1, (s.at + SNACK_LIFE - into) / 800);
  const y = s.y - (1 - k) * (1 - k) * 420;
  ctx.globalAlpha = fade;
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(s.x, s.y + 4, 16 * k + 4, 5 * k + 2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.translate(s.x, y - 10); ctx.rotate(k < 1 ? into / 120 : Math.sin(into / 300 + s.i) * 0.15);
  ctx.strokeStyle = '#2a2420'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
  if (s.type === 0) {   // 뼈다귀 과자
    ctx.fillStyle = '#F2D9A6';
    ctx.beginPath(); ctx.roundRect(-14, -5, 28, 10, 4); ctx.fill(); ctx.stroke();
    for (const [x, yy] of [[-15, -5], [-15, 5], [15, -5], [15, 5]]) { ctx.beginPath(); ctx.arc(x, yy, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    ctx.fillRect(-12, -4, 24, 8);
  } else if (s.type === 1) {   // 생선 과자
    ctx.fillStyle = '#8FC9E8';
    ctx.beginPath(); ctx.ellipse(0, 0, 15, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-13, 0); ctx.lineTo(-22, -7); ctx.lineTo(-22, 7); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2a2420'; ctx.beginPath(); ctx.arc(8, -2, 2, 0, Math.PI * 2); ctx.fill();
  } else if (s.type === 2) {   // 스틱 간식
    ctx.fillStyle = '#E8402F';
    ctx.beginPath(); ctx.roundRect(-5, -15, 10, 30, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.fillRect(-4, -4, 8, 6);
  } else {   // 쿠키
    ctx.fillStyle = '#D9A066';
    ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#6B4A30'; for (const [x, yy] of [[-4, -3], [4, 2], [-2, 5], [5, -5]]) { ctx.beginPath(); ctx.arc(x, yy, 2, 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}
// 위쪽 띠: 곧 시작 / 진행 중 / 결과
const snackBar = document.getElementById('snackBar');
let snackBarAt = 0, snackBarHtml = '';
function updateSnackBar() {
  if (performance.now() - snackBarAt < 250) return;
  snackBarAt = performance.now();
  const c = snackClock();
  let html = '';
  if (c.active) {
    const sec = Math.ceil((SNACK_DUR - c.into) / 1000);
    if (!isPlaza()) html = `<b>간식 타임</b> 광장에서 진행 중 ${sec}초 남음`;
    else {
      const top = ranking().slice(0, 3).map(([id, n], k) => `${k + 1}. ${snackName(id)} ${n}`).join(' · ');
      html = `<b>간식 타임 ${sec}초</b> 내가 주운 간식 ${snack.scores.get(myId) || 0}개${top ? `<br><small>${top}</small>` : ''}`;
    }
  } else if (snack.result && Date.now() < snack.result.until) {
    const top = snack.result.top.map(([n, v], k) => `${k + 1}. ${n} ${v}`).join(' · ');
    html = `<b>간식 타임 끝</b> 나는 ${snack.result.mine}개${top ? `<br><small>${top}</small>` : ''}`;
  } else if (c.soon) {
    const s = Math.ceil(c.left / 1000);
    html = `<b>곧 간식 타임</b> ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} 뒤 광장에 간식이 떨어져`;
  }
  if (html !== snackBarHtml) { snackBarHtml = html; snackBar.innerHTML = html; snackBar.classList.toggle('show', !!html); }
}

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
  if (NPC_OFF || !(isPlaza() || isDance())) return;
  const dance = isDance();
  const used = new Set([me.breed]);
  for (let i = 0; i < (dance ? 5 : NPC_MAX); i++) {
    let breed; do { breed = Math.floor(Math.random() * BREEDS.length); } while (used.has(breed) && used.size < BREEDS.length);
    used.add(breed);
    const acc = Math.random() < 0.35 ? ACCESSORIES[1 + Math.floor(Math.random() * (ACCESSORIES.length - 1))].id : '';
    const x = dance ? rndIn(120, 600) : rndIn(380, 1060), y = dance ? rndIn(380, 1000) : rndIn(780, 1640);   // 광장은 처음 들어왔을 때 보이게 입구·가운데 쪽에 모아서 시작
    npcs.set(`npc${i}`, { npc: true, breed, acc, x, y, tx: x, ty: y, next: performance.now() + rndIn(500, 4000) });
  }
}
function activeNpcs() {
  const n = Math.max(2, NPC_MAX - peers.size);   // 손님이 늘면 주민은 줄임 (최소 2마리)
  return [...npcs.entries()].slice(0, n);
}
function npcThink(id, p, now) {
  p.next = now + rndIn(2500, 7000);
  if (isDance()) {   // 댄스장 주민은 제자리 근처에서 춤추다 가끔 행동
    const r = Math.random();
    if (r < 0.25) { p.tx = Math.max(100, Math.min(620, p.x + rndIn(-120, 120))); p.ty = Math.max(360, Math.min(1040, p.y + rndIn(-80, 80))); }
    else if (r < 0.6) onAct(id, ['jump', 'roll', 'wag', 'heart', 'zoom'][Math.floor(Math.random() * 5)], p.x, p.y);
    else if (r < 0.7) speech.set(id, { text: phraseText([0, 4][Math.floor(Math.random() * 2)], p.breed), until: Date.now() + 2000 });
    return;
  }
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
    if (snackSteer(p, now)) continue;
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
// 한 장 그리다 오류가 나도 다음 장은 계속 그리게 (예전엔 오류 한 번에 광장이 통째로 멈춤)
let frameErrShown = false;
function frame(now) {
  try { drawFrame(now); } catch (e) { if (!frameErrShown) { frameErrShown = true; console.error('광장 그리기 오류', e); } }
  requestAnimationFrame(frame);
}
function drawFrame(now) {
  // 오락실 게임 창이 열려 있으면 광장은 쉬게 함 (폰에서 둘 다 그리면 느려짐)
  if (window.plazaPaused) { lastT = now; return; }
  const dt = Math.max(0, Math.min(0.05, (now - lastT) / 1000)); lastT = now;   // 시간이 거꾸로 오면(다른 시계 섞임) 0으로: 캐릭터가 반대로 튀어 나가지 않게
  const t = now / 1000;
  step(me, dt);
  for (const [id, p] of peers) {
    if (p.goneAt && Date.now() - p.goneAt > 8000) { peers.delete(id); continue; }
    step(p, dt);
  }
  checkDoors();
  if (isPlaza()) stepBot(dt, now);
  if (isPlaza() || isDance()) stepNpcs(dt, now);
  snackStep();
  updateSnackBar();
  if (me.scene === 'field') { stepBall(dt); kickCheck(); }

  const info = sceneInfo();
  const { w, h } = size();
  camX = w <= VIEW_W ? 0 : Math.max(0, Math.min(w - VIEW_W, me.x - VIEW_W / 2));
  camY = viewH >= h ? -(viewH - h) / 2 : Math.max(0, Math.min(h - viewH, me.y - viewH * 0.55));
  if (info.photo && (boothEl.classList.contains('open') || countdown)) camY = SPOT.y + SPOT.h / 2 - viewH * 0.27;   // 꾸미는 동안 패널에 가리지 않게 발자국 자리를 위로
  ctx.setTransform(scale, 0, 0, scale, -camX * scale, -camY * scale);
  ctx.clearRect(camX, camY, VIEW_W, viewH);
  if (isPlaza()) drawPlaza(t); else if (info.photo) drawPhotoRoom(t); else if (info.dance) drawDance(t); else if (info.field) drawField(); else drawRoom(info);

  // 위쪽(y가 작은 것)부터 그려서 앞뒤가 자연스럽게 겹치게
  const tops = [];   // 말풍선을 맨 위에 그리려고 캐릭터 머리 위치를 모아 둠
  const items = info.shelves.map((s, i) => ({ y: s.y + 60, draw: () => drawShelf(s, info.items[i]) }));
  if (info.field) items.push({ y: ball.y, draw: drawBall });
  if (isPlaza() && !LINEUP) {
    items.push({ y: BOOTH.y + 24, draw: () => drawBooth(t) });   // 점집 천막은 오락실로 바꾸면서 뺌
    const sc = snackClock();
    if (sc.active && sc.round === snack.round) for (const s of visibleSnacks(sc.into)) items.push({ y: s.y - 2, draw: () => drawSnack(s, sc.into) });
    for (const h of plazaHooks) h(items, t, now);
    items.push({ y: bot.y, draw: () => tops.push(['bot', bot.x, drawBot(t, now)]) });
  }
  for (let i = poops.length - 1; i >= 0; i--) if (Date.now() > poops[i].until) poops.splice(i, 1);
  for (const pp of poops) if (pp.scene === me.scene) items.push({ y: pp.y - 1, draw: () => drawPoop(pp, t) });
  for (const [id, p] of peers) items.push({ y: p.y, draw: () => tops.push([id, p.x, drawActor(p, t, false)]) });
  if (isPlaza() || isDance()) for (const [id, p] of activeNpcs()) items.push({ y: p.y, draw: () => tops.push([id, p.x, drawActor(p, t, false)]) });
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
  const canTarot = false;   // 점집 없음
  if (canTarot !== tarotBtn.classList.contains('show')) tarotBtn.classList.toggle('show', canTarot);
  if (!isPlaza() && tarotEl.classList.contains('open')) tarotEl.classList.remove('open');
  for (const h of frameHooks) h(now);

  const n = nearShelf(info.shelves);
  const still = Math.hypot(me.tx - me.x, me.ty - me.y) < 2;
  if (n >= 0 && n !== openShelf && n !== dismissed && still && info.items[n]) openCard(n, info.items[n]);
  if (openShelf >= 0 && n !== openShelf) { sheet.classList.remove('open'); openShelf = -1; }
  if (n !== dismissed) dismissed = -1;   // 닫았던 선반을 벗어나면 다시 열릴 수 있게

  const conn = '';   // 연결 상태(끊김·연결 중) 표시는 뺌 (대표님 11.10)
  document.getElementById('count').innerHTML = `<b>${peers.size + 1}</b>마리${conn}`;
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
  // 첫 터치 때 켜기 (꺼둔 사람은 그대로). 폰은 손가락을 뗄 때(touchend)·click 이 "사용자 동작"이라 그때 켜야 소리가 남
  let inGame = false;
  const first = () => {
    if (!on || inGame) return;
    start().then(() => { if (ac && ac.state === 'suspended' && on && !inGame) ac.resume(); });
    if (started) { ['touchend', 'click', 'keydown'].forEach((ev) => removeEventListener(ev, first, true)); }
  };
  ['touchend', 'click', 'keydown'].forEach((ev) => addEventListener(ev, first, true));
  // 다른 앱으로 가면 소리 멈춤
  document.addEventListener('visibilitychange', () => { if (!ac || !on || inGame) return; document.hidden ? ac.suspend() : ac.resume(); });
  label();
  // 게임 창이 열리면 배경음악은 쉼 (게임 창이 "음악 끄기" 버튼을 덮고, 게임엔 효과음이 따로 있음)
  function game(open) { inGame = open; if (!ac) return; if (open) ac.suspend(); else if (on) ac.resume(); }
  return { set, game };
})();
